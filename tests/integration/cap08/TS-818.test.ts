// C001-TC-818 / C001-TS-818 (C001-AC-816.1, C001-REQ-816): `gate approve --commit` commits the approval —
// only the change folder and the status files, with the message naming the change, gate and approver;
// an unrelated modified file stays uncommitted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { git, gitWorkspace } from "./git-fixture.ts";

test("approval committed", () => {
  const ws = gitWorkspace();
  try {
    writeFileSync(join(ws.root, "src-app.ts"), "export const a = 2;\n"); // modified, not staged
    const r = runBundled(["gate", "approve", "004", "10-spec", "--note", "Approve", "--by", "p01", "--commit"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /^committed: [0-9a-f]{7,}$/m);
    assert.equal(git(ws.root, "log", "-1", "--format=%s"), "CHG-004: G2 (spec) approved by p01");
    const files = git(ws.root, "show", "--name-only", "--format=", "HEAD").split("\n").filter(Boolean);
    assert.ok(files.length > 0);
    for (const f of files) assert.ok(f.startsWith(".sdd/004-") || f === ".sdd/SDD.md" || f === ".sdd/registry.json", f);
    assert.ok(files.includes(".sdd/004-x/change.md"));
    assert.equal(git(ws.root, "diff", "--name-only"), "src-app.ts", "still modified");
    assert.equal(git(ws.root, "diff", "--cached", "--name-only"), "", "and not staged");
  } finally {
    ws.cleanup();
  }
});

test("without --commit nothing is committed", () => {
  const ws = gitWorkspace();
  try {
    assert.equal(runBundled(["gate", "approve", "004", "10-spec", "--note", "Approve", "--by", "p01"], { cwd: ws.root }).code, 0);
    assert.equal(git(ws.root, "log", "-1", "--format=%s"), "fixture");
  } finally {
    ws.cleanup();
  }
});
