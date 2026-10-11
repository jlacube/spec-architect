// C001-TC-816 — verifies C001-TS-816 (C001-AC-814.1, C001-REQ-814): per-ID hash store, directly and
// through `sdd gate approve`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { phaseHash, recordApproval } from "../../../src/gate/hash.ts";
import { buildChangeGraph } from "../../../src/model/graph.ts";
import { runInProcess } from "../cli/helpers.ts";
import { approvedChange } from "./gate-fixture.ts";

test("approving 10-spec stores a sha256 hash for every ID defined in 10-spec", () => {
  const ws = approvedChange([]);
  try {
    recordApproval(ws.dir, "10-spec", "2026-10-11");
    const approvals = JSON.parse(readFileSync(join(ws.dir, "approvals.json"), "utf8")) as Record<string, { hash: string; ids: Record<string, string> }>;
    const entry = approvals["10-spec"]!;
    assert.equal(entry.hash, phaseHash(ws.dir, "10-spec").hash);
    const defined = new Set(buildChangeGraph(ws.dir).nodes.filter((n) => n.file.startsWith("10-spec/")).map((n) => n.id));
    assert.deepEqual(new Set(Object.keys(entry.ids)), defined);
    for (const id of ["C004-US-001", "C004-REQ-012", "C004-AC-012.1", "C004-TS-012", "C004-DOD-001"]) assert.match(entry.ids[id] ?? "", /^sha256:[0-9a-f]{64}$/, id);
  } finally {
    ws.cleanup();
  }
});

test("a second approval keeps the other phases' entries", () => {
  const ws = approvedChange([]);
  try {
    recordApproval(ws.dir, "00-ideation", "2026-10-11");
    recordApproval(ws.dir, "10-spec", "2026-10-11");
    const approvals = JSON.parse(readFileSync(join(ws.dir, "approvals.json"), "utf8")) as Record<string, unknown>;
    assert.deepEqual(Object.keys(approvals), ["00-ideation", "10-spec"]);
  } finally {
    ws.cleanup();
  }
});

test("end to end: `sdd gate approve 004 10-spec` stores the per-ID hashes", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    const r = runInProcess(["gate", "approve", "004", "10-spec", "--note", "ok", "--by", "p01"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const approvals = JSON.parse(readFileSync(join(ws.dir, "approvals.json"), "utf8")) as Record<string, { ids: Record<string, string> }>;
    const defined = new Set(buildChangeGraph(ws.dir).nodes.filter((n) => n.file.startsWith("10-spec/")).map((n) => n.id));
    assert.deepEqual(new Set(Object.keys(approvals["10-spec"]!.ids)), defined);
  } finally {
    ws.cleanup();
  }
});
