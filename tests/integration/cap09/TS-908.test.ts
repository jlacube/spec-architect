// C001-TC-908 — verifies C001-TS-908 (C001-AC-907.1, C001-REQ-907): add defect.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isoDate } from "../../../src/workspace/change.ts";
import { runBundled } from "../cli/helpers.ts";
import { changeFm, registry, tracking } from "./tracking-fixture.ts";

test("defect add records D-001 in change.md and registry.json", () => {
  const ws = tracking();
  try {
    const r = runBundled(["defect", "add", "--ref", "C004-REQ-012", "--summary", "PSP returns expiry in UTC", "--by", "p02"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const expected = { id: "D-001", ref: "C004-REQ-012", summary: "PSP returns expiry in UTC", reporter: "p02", date: isoDate(), status: "open", resolution: null, closed_at: null };
    const defects = (changeFm(ws.dir)["defects"] as Record<string, unknown>[]).map((d) => ({ ...d, date: String(d["date"]) }));
    assert.deepEqual(defects, [expected]);
    assert.deepEqual(registry(ws.root).changes.find((c) => c.id === "CHG-004")?.defects, [expected]);
    const second = runBundled(["defect", "add", "--ref", "C004-AC-012.1", "--summary", "s"], { cwd: ws.root });
    assert.match(second.stdout, /^D-002: open on C004-AC-012\.1/m);
  } finally {
    ws.cleanup();
  }
});
