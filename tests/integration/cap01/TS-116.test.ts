// C001-TC-116 — verifies C001-TS-116 (C001-AC-111.1, C001-REQ-111): tombstone entry.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, minimalChange, runBundled } from "../cli/helpers.ts";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test("id tombstone records the ID, the reason and today's ISO-8601 date", () => {
  const ws = makeWorkspace({
    ...minimalChange(),
    ".sdd/004-x/ids.json": JSON.stringify({ change: "CHG-004", allocated: { REQ: 12 }, blocks: [], tombstones: [] }),
  });
  try {
    const r = runBundled(["id", "tombstone", "C004-REQ-007", "--reason", "merged into REQ-006"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const ids = JSON.parse(readFileSync(join(ws.root, ".sdd", "004-x", "ids.json"), "utf8")) as { tombstones: unknown[] };
    assert.deepEqual(ids.tombstones, [{ id: "C004-REQ-007", reason: "merged into REQ-006", date: today() }]);
    const again = runBundled(["id", "tombstone", "C004-REQ-007", "--reason", "again"], { cwd: ws.root });
    assert.equal(again.code, 2);
    assert.match(again.stderr, /already tombstoned/);
  } finally {
    ws.cleanup();
  }
});
