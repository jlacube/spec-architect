// C001-TC-805 — verifies C001-TS-805 (C001-AC-805.1, C001-REQ-805): approval fields.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { phaseHash } from "../../../src/gate/hash.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { isoDate } from "../../../src/workspace/change.ts";
import { runBundled, runInProcess } from "../cli/helpers.ts";
import { approvedChange } from "./gate-fixture.ts";

function phase(dir: string, name: string): Record<string, unknown> {
  return (splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data?.["phases"] as Record<string, Record<string, unknown>>)[name]!;
}

test('gate approve sets status, approved_hash, approved_at and approved_by, and logs the note "ok"', () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    const before = readFileSync(join(ws.dir, "change.md"), "utf8");
    const r = runBundled(["gate", "approve", "004", "10-spec", "--note", "ok", "--by", "p01"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const p = phase(ws.dir, "10-spec");
    assert.equal(p["status"], "approved");
    assert.equal(p["approved_hash"], phaseHash(ws.dir, "10-spec").hash);
    assert.equal(String(p["approved_at"]), isoDate());
    assert.equal(p["approved_by"], "p01");
    const after = readFileSync(join(ws.dir, "change.md"), "utf8");
    const rows = (s: string) => s.split("\n").filter((l) => /^\| \d{4}-\d{2}-\d{2} \|/.test(l));
    assert.equal(rows(after).length, rows(before).length + 1);
    assert.equal(rows(after).at(-1), `| ${isoDate()} | G2 (spec) | **Approved** | "ok" | none | unavailable |`);
    const approvals = JSON.parse(readFileSync(join(ws.dir, "approvals.json"), "utf8")) as Record<string, { hash: string }>;
    assert.equal(approvals["10-spec"]!.hash, p["approved_hash"]);
  } finally {
    ws.cleanup();
  }
});

test("approved_by defaults to git user.name", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    runBundled(["gate", "approve", "004", "10-spec", "--note", "ok"], { cwd: ws.root });
    assert.notEqual(phase(ws.dir, "10-spec")["approved_by"], undefined);
  } finally {
    ws.cleanup();
  }
});

test("approval needs an approved predecessor and a note", () => {
  const ws = approvedChange([]);
  try {
    const r = runInProcess(["gate", "approve", "004", "10-spec", "--note", "ok"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-015: `10-spec` requires approved `00-ideation \(draft\)`/);
  } finally {
    ws.cleanup();
  }
  const ok = approvedChange(["00-ideation"]);
  try {
    const before = readFileSync(join(ok.dir, "change.md"), "utf8");
    const n = runInProcess(["gate", "approve", "004", "10-spec"], { cwd: ok.root });
    assert.equal(n.code, 2);
    assert.match(n.stderr, /--note is required/);
    assert.equal(readFileSync(join(ok.dir, "change.md"), "utf8"), before, "refusals write nothing");
  } finally {
    ok.cleanup();
  }
});
