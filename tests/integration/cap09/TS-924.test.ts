// C001-TC-924 — verifies C001-TS-924 (C001-AC-923.1, C001-REQ-923): reopen a closed defect.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isoDate } from "../../../src/workspace/change.ts";
import { runInProcess } from "../cli/helpers.ts";
import { changeFm, registry, tracking } from "./tracking-fixture.ts";

test("defect reopen sets status open and keeps the previous resolution and date in history", () => {
  const ws = tracking();
  try {
    runInProcess(["defect", "add", "--ref", "C004-REQ-012", "--summary", "UTC", "--by", "p02"], { cwd: ws.root });
    runInProcess(["defect", "close", "D-001", "--change", "004", "--resolution", "REQ-012 now uses UTC (rev 2)"], { cwd: ws.root });
    const r = runInProcess(["defect", "reopen", "D-001", "--change", "004"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const d = (changeFm(ws.dir)["defects"] as Record<string, unknown>[])[0]!;
    assert.equal(d["status"], "open");
    const history = (d["history"] as Record<string, unknown>[]).map((h) => ({ ...h, closed_at: String(h["closed_at"]) }));
    assert.deepEqual(history, [{ resolution: "REQ-012 now uses UTC (rev 2)", closed_at: isoDate() }]);
    // The registry keeps the C001-IF-02 defect fields only.
    const reg = registry(ws.root).changes.find((c) => c.id === "CHG-004")!.defects[0]!;
    assert.equal(reg["status"], "open");
    assert.equal("history" in reg, false);
  } finally {
    ws.cleanup();
  }
});
