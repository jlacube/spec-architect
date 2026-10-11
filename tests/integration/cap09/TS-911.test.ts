// C001-TC-911 — verifies C001-TS-911 (C001-AC-910.1, C001-REQ-910): close defect.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isoDate } from "../../../src/workspace/change.ts";
import { runInProcess } from "../cli/helpers.ts";
import { changeFm, tracking } from "./tracking-fixture.ts";

test("defect close sets status closed with the resolution and today's date", () => {
  const ws = tracking();
  try {
    runInProcess(["defect", "add", "--ref", "C004-REQ-012", "--summary", "PSP returns expiry in UTC", "--by", "p02"], { cwd: ws.root });
    const r = runInProcess(["defect", "close", "D-001", "--change", "004", "--resolution", "REQ-012 now uses UTC (rev 2)"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const d = (changeFm(ws.dir)["defects"] as Record<string, unknown>[])[0]!;
    assert.equal(d["status"], "closed");
    assert.equal(d["resolution"], "REQ-012 now uses UTC (rev 2)");
    assert.equal(String(d["closed_at"]), isoDate());
  } finally {
    ws.cleanup();
  }
});
