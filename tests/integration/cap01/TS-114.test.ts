// C001-TC-114 — verifies C001-TS-114 (C001-AC-109.1, C001-REQ-109): id next persists first.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, minimalChange, runBundled } from "../cli/helpers.ts";

test("id next prints C004-REQ-012 after recording it, and C004-REQ-013 on the next run", () => {
  // The Given is only about ids.json, so no requirement file defines REQ-012 here.
  const ws = makeWorkspace({
    ".sdd/SDD.md": minimalChange()[".sdd/SDD.md"]!,
    ".sdd/004-x/change.md": minimalChange()[".sdd/004-x/change.md"]!,
    ".sdd/004-x/ids.json": JSON.stringify({ change: "CHG-004", allocated: { REQ: 11 }, blocks: [], tombstones: [] }),
  });
  try {
    const ids = join(ws.root, ".sdd", "004-x", "ids.json");
    const first = runBundled(["id", "next", "REQ", "--change", "004"], { cwd: ws.root });
    assert.equal(first.code, 0, first.stderr);
    assert.equal(first.stdout, "C004-REQ-012\n");
    assert.equal((JSON.parse(readFileSync(ids, "utf8")) as { allocated: Record<string, number> }).allocated["REQ"], 12);
    const second = runBundled(["id", "next", "REQ", "--change", "004"], { cwd: ws.root });
    assert.equal(second.stdout, "C004-REQ-013\n");
  } finally {
    ws.cleanup();
  }
});
