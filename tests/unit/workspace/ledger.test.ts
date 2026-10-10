// ID ledger (C001-T-016): widths, blocks, defined IDs, change selection, format, this repository.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatLedger, loadLedger, nextId } from "../../../src/workspace/ledger.ts";
import { repoRoot } from "../../helpers.ts";
import { makeWorkspace, minimalChange, runBundled, runInProcess } from "../../integration/cli/helpers.ts";

const CHG001 = join(repoRoot(), ".sdd", "001-architect-agent-suite");

test("this repository's ids.json loads and records C001-REQ-308 as tombstoned", () => {
  const l = loadLedger(CHG001);
  assert.equal(l.change, "CHG-001");
  assert.ok(l.tombstones.some((t) => t.id === "C001-REQ-308"));
  assert.equal(l.isTombstoned("C001-REQ-308"), true);
  assert.equal(l.isTombstoned("C001-REQ-307"), false);
});

test("next IDs use the widths of C001-IF-04 §1 and never collide with defined IDs", () => {
  const ws = makeWorkspace({
    ...minimalChange(),
    ".sdd/004-x/ids.json": JSON.stringify({ change: "CHG-004", allocated: {}, blocks: [], tombstones: [] }),
  });
  try {
    const dir = join(ws.root, ".sdd", "004-x");
    assert.equal(nextId(dir, "GOAL").id, "C004-GOAL-01");
    assert.equal(nextId(dir, "T").id, "C004-T-001");
    // C004-REQ-012 is defined in the fixture's requirements.md although the ledger has no REQ counter.
    assert.equal(nextId(dir, "REQ").id, "C004-REQ-013");
  } finally {
    ws.cleanup();
  }
});

test("allocation inside a capability block stays within the block and counts per block", () => {
  const ws = makeWorkspace({
    ...minimalChange(),
    ".sdd/004-x/ids.json": JSON.stringify({
      change: "CHG-004",
      allocated: {},
      blocks: [
        { type: "US|REQ|TS", from: 101, to: 102, capability: "C004-CAP-01" },
        { type: "US|REQ|TS", from: 201, to: 299, capability: "C004-CAP-02" },
      ],
      tombstones: [],
    }),
  });
  try {
    const dir = join(ws.root, ".sdd", "004-x");
    assert.equal(nextId(dir, "REQ", { block: "CAP-01" }).id, "C004-REQ-101");
    assert.equal(nextId(dir, "REQ", { block: "C004-CAP-01" }).id, "C004-REQ-102");
    assert.throws(() => nextId(dir, "REQ", { block: "CAP-01" }), /block C004-CAP-01 for REQ is full \(101–102\)/);
    assert.equal(nextId(dir, "REQ", { block: "CAP-02" }).id, "C004-REQ-201");
    assert.equal(nextId(dir, "US", { block: "CAP-02" }).id, "C004-US-201");
    assert.throws(() => nextId(dir, "REQ"), /REQ uses capability blocks; pass --block/);
    assert.throws(() => nextId(dir, "REQ", { block: "CAP-09" }), /no block for REQ in capability C004-CAP-09/);
    assert.equal(nextId(dir, "T", { block: "CAP-01" }).id, "C004-T-001", "types without blocks ignore --block");
    const saved = JSON.parse(readFileSync(join(dir, "ids.json"), "utf8")) as { blocks: { allocated?: Record<string, number> }[] };
    assert.deepEqual(saved.blocks[0]?.allocated, { REQ: 102 });
    assert.deepEqual(saved.blocks[1]?.allocated, { REQ: 201, US: 201 });
  } finally {
    ws.cleanup();
  }
});

test("AC IDs are not allocated: they derive from their requirement (C001-IF-03 §4)", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const r = runInProcess(["id", "next", "AC", "--change", "004"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /AC IDs derive from their requirement/);
  } finally {
    ws.cleanup();
  }
});

test("the change is taken from --change, the current change folder, or the only change", () => {
  const ws = makeWorkspace({ ...minimalChange(), ".sdd/005-y/change.md": "---\nid: CHG-005\n---\n" });
  try {
    assert.equal(runInProcess(["id", "next", "T"], { cwd: join(ws.root, ".sdd", "005-y") }).stdout, "C005-T-001\n");
    const ambiguous = runInProcess(["id", "next", "T"], { cwd: ws.root });
    assert.equal(ambiguous.code, 2);
    assert.match(ambiguous.stderr, /pass --change <NNN>/);
    assert.match(runInProcess(["id", "next", "T", "--change", "009"], { cwd: ws.root }).stderr, /^ERR-CLI-002: Change `009` not found/);
  } finally {
    ws.cleanup();
  }
});

test("a missing ids.json is created; tombstoning requires a full ID of an existing change", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    assert.equal(runBundled(["id", "next", "RISK", "--change", "004"], { cwd: ws.root }).stdout, "C004-RISK-001\n");
    assert.match(runInProcess(["id", "tombstone", "REQ-007", "--reason", "x"], { cwd: ws.root }).stderr, /full ID/);
    assert.match(runInProcess(["id", "tombstone", "C009-REQ-007", "--reason", "x"], { cwd: ws.root }).stderr, /^ERR-CLI-002/);
  } finally {
    ws.cleanup();
  }
});

test("formatLedger writes one entry per line, like the hand-written ledger of CHG-001", () => {
  const raw = readFileSync(join(CHG001, "ids.json"), "utf8");
  assert.equal(formatLedger(JSON.parse(raw)), raw);
});
