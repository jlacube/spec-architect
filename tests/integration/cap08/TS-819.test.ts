// C001-TC-819 / C001-TS-819 (C001-AC-817.1, C001-REQ-817): `gate approve --commit` is refused with
// ERR-CLI-018 before anything is recorded, outside a git repository or when other changes are staged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { approvedChange } from "./gate-fixture.ts";
import { git, gitWorkspace } from "./git-fixture.ts";

function assertRefused(root: string, dir: string, reason: RegExp) {
  const before = readFileSync(join(dir, "change.md"), "utf8");
  const r = runBundled(["gate", "approve", "004", "10-spec", "--note", "Approve", "--commit"], { cwd: root });
  assert.equal(r.code, 2, r.stdout);
  assert.match(r.stderr, /^ERR-CLI-018: Cannot commit the approval: /);
  assert.match(r.stderr, reason);
  assert.equal(readFileSync(join(dir, "change.md"), "utf8"), before, "nothing recorded");
}

test("a folder that is not a git repository", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    assertRefused(ws.root, ws.dir, /not a git repository/);
  } finally {
    ws.cleanup();
  }
});

test('a git repository with "README.md" staged', () => {
  const ws = gitWorkspace();
  try {
    writeFileSync(join(ws.root, "README.md"), "# x\n");
    git(ws.root, "add", "README.md");
    assertRefused(ws.root, ws.dir, /other changes are staged: README\.md/);
  } finally {
    ws.cleanup();
  }
});
