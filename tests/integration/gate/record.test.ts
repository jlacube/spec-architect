// `sdd gate record` (C001-T-025): revise puts the phase in revision and later approved phases to
// stale (C001-REQ-812); stop sets the change to stopped (C001-REQ-815); both log the note.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { runInProcess } from "../cli/helpers.ts";
import { approvedChange, statuses } from "../cap08/gate-fixture.ts";

test("revise: 10-spec in revision, 20-plan stale, note logged", () => {
  const ws = approvedChange();
  try {
    const r = runInProcess(["gate", "record", "004", "10-spec", "--decision", "revise", "--note", "spike S-07 findings"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(statuses(ws.dir), { "00-ideation": "approved", "10-spec": "in-revision", "20-plan": "stale" });
    assert.match(readFileSync(join(ws.dir, "change.md"), "utf8"), /\| G2 \(spec\) \| \*\*Revise\*\* \| "spike S-07 findings" \| none \| unavailable \|/);
  } finally {
    ws.cleanup();
  }
});

test("stop: the change is stopped with reason and date, and further approval is refused", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    assert.equal(runInProcess(["gate", "record", "004", "10-spec", "--decision", "stop", "--note", "out of budget"], { cwd: ws.root }).code, 0);
    const fm = splitFrontmatter(readFileSync(join(ws.dir, "change.md"), "utf8")).data ?? {};
    assert.equal(fm["status"], "stopped");
    assert.equal((fm["stopped"] as Record<string, unknown>)["reason"], "out of budget");
    const r = runInProcess(["gate", "approve", "004", "10-spec", "--note", "ok"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-014: Change `004` is `stopped`/);
  } finally {
    ws.cleanup();
  }
});
