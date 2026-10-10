// C001-TC-108 — verifies C001-TS-108 (C001-AC-105.2, C001-REQ-105): user text outside the block survives.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STATUS_BEGIN, STATUS_END } from "../../../src/workspace/sddmd.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { changeMd, SDD_MD } from "../workspace-fixtures.ts";

test("every byte of SDD.md outside the status markers is unchanged", () => {
  const custom = SDD_MD.replace(STATUS_BEGIN, "Team note: ping Ana before G2\r\nTrailing spaces stay.   \n\n" + STATUS_BEGIN) + "\nFooter written by hand.\n";
  const ws = makeWorkspace({ ".sdd/SDD.md": custom, ".sdd/001-alpha/change.md": changeMd({ nnn: "001", phase: "10-spec", phases: { "10-spec": { status: "draft" } } }) });
  try {
    const path = join(ws.root, ".sdd", "SDD.md");
    writeFileSync(path, custom);
    assert.equal(runBundled(["status", "--write"], { cwd: ws.root }).code, 0);
    const after = readFileSync(path, "utf8");
    const outside = (t: string) => [t.slice(0, t.indexOf(STATUS_BEGIN)), t.slice(t.indexOf(STATUS_END))];
    assert.deepEqual(outside(after), outside(custom));
    assert.match(after, /\| 001 \| Change 001 \| 10-spec \| draft \|/);
  } finally {
    ws.cleanup();
  }
});
