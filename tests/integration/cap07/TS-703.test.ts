// C001-TC-703 — verifies C001-TS-703 (C001-AC-703.1, C001-REQ-703): `lint --json` writes one JSON
// document conforming to C001-IF-11 §1 and nothing else on standard output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { repoRoot } from "../../helpers.ts";
import { makeWorkspace, minimalChange, runBundled, runInProcess } from "../cli/helpers.ts";

const schemaPath = join(repoRoot(), ".sdd", "001-architect-agent-suite", "10-spec", "50-interfaces", "lint-report.schema.json");
const ajv = new Ajv2020({ strict: false });
const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, "utf8")) as object);

function assertReport(stdout: string): Record<string, unknown> {
  const doc = JSON.parse(stdout) as Record<string, unknown>; // throws when anything else is printed
  assert.ok(validate(doc), JSON.stringify(validate.errors));
  assert.equal(stdout.trimEnd(), JSON.stringify(doc, null, 2));
  return doc;
}

test("lint --json on a workspace validates against lint-report.schema.json", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const r = runBundled(["lint", "--json"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const doc = assertReport(r.stdout);
    assert.deepEqual(doc["scope"], { changes: ["CHG-004"], phase: null, quick: false });
    assert.deepEqual(doc["summary"], { error: 0, warn: 0, info: 0 });
  } finally {
    ws.cleanup();
  }
});

test("standard output stays pure JSON with SDD_DEBUG=1 (traces go to standard error)", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const r = runBundled(["lint", "004", "--phase", "10-spec", "--json"], { cwd: ws.root, env: { SDD_DEBUG: "1" } });
    assert.equal(r.code, 0, r.stderr);
    const doc = assertReport(r.stdout);
    assert.deepEqual(doc["scope"], { changes: ["CHG-004"], phase: "10-spec", quick: false });
    assert.match(r.stderr, /^\[sdd \+\d+ms\] /m);
  } finally {
    ws.cleanup();
  }
});

test("findings in --json carry code, severity, path, line, ids, message and fix", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const r = runInProcess(["lint", "--json"], {
      cwd: ws.root,
      rules: [{ code: "LINT-WORD-001", severity: "error", fix: "Replace with a measurable term", scope: "change", check: (ctx) => ctx.statements.map((s) => ({ path: s.path, line: s.line, ids: [s.id], message: "Weak word \"thing\"" })) }],
    });
    assert.equal(r.code, 1);
    const doc = assertReport(r.stdout);
    assert.deepEqual(doc["findings"], [
      { code: "LINT-WORD-001", severity: "error", path: ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md", line: 8, ids: ["C004-REQ-012"], message: "Weak word \"thing\"", fix: "Replace with a measurable term" },
    ]);
  } finally {
    ws.cleanup();
  }
});
