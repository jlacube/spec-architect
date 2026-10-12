// One module and one bad/good fixture pair per rule (C001-NFR-503): every registered rule must have
// tests/lint-fixtures/<code>/{bad,good}/ mini-workspaces; `bad` yields the rule's finding, `good`
// does not. A rule without fixtures fails this test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RULES } from "../../../src/lint/rules/index.ts";
import { rebuildRegistry } from "../../../src/workspace/status.ts";
import { repoRoot } from "../../helpers.ts";
import { runInProcess } from "../../integration/cli/helpers.ts";

// SDD_LINT_FIXTURES points the suite at another fixture folder (C001-TS-1118 alters a copy).
const FIXTURES = process.env["SDD_LINT_FIXTURES"] ?? join(repoRoot(), "tests", "lint-fixtures");

function runFixture(code: string, kind: "bad" | "good"): { code: string }[] {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), `sdd-fx-${code}-`)));
  try {
    cpSync(join(FIXTURES, code, kind), root, { recursive: true });
    // Fixtures need no registry unless they test it; a consistent one keeps LINT-REG-001 quiet.
    if (code !== "LINT-REG-001") writeFileSync(join(root, ".sdd", "registry.json"), JSON.stringify(rebuildRegistry(join(root, ".sdd")), null, 2) + "\n");
    const r = runInProcess(["lint", "--json"], { cwd: root });
    assert.ok(r.code === 0 || r.code === 1, `${code}/${kind}: ${r.stderr}`);
    return (JSON.parse(r.stdout) as { findings: { code: string }[] }).findings;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("every registered rule has a bad and a good fixture", () => {
  const missing = RULES.map((r) => r.code).filter((c) => !existsSync(join(FIXTURES, c, "bad", ".sdd")) || !existsSync(join(FIXTURES, c, "good", ".sdd")));
  assert.deepEqual(missing, []);
});

test("every fixture folder belongs to a registered rule", () => {
  const codes = new Set(RULES.map((r) => r.code));
  assert.deepEqual(readdirSync(FIXTURES).filter((d) => !codes.has(d)), []);
});

test("rule codes are unique", () => {
  const codes = RULES.map((r) => r.code);
  assert.equal(new Set(codes).size, codes.length);
});

for (const rule of RULES) {
  test(`${rule.code}: the bad fixture is reported and the good fixture is not`, () => {
    assert.ok(runFixture(rule.code, "bad").some((f) => f.code === rule.code), "bad");
    assert.equal(runFixture(rule.code, "good").some((f) => f.code === rule.code), false, "good");
  });
}
