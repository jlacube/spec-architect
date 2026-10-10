// C001-TC-117 — verifies C001-TS-117 (C001-AC-112.1, C001-REQ-112): short-form resolution.
// Exercised through the workspace model; the `sdd trace` command (C001-T-023) reuses it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildChangeGraph } from "../../../src/model/graph.ts";

test("a short-form reference inside change 004 resolves to C004-AC-012.1", () => {
  const root = mkdtempSync(join(tmpdir(), "sdd-ts117-"));
  try {
    const dir = join(root, ".sdd", "004-x", "10-spec", "20-capabilities", "CAP-01-x");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "requirements.md"),
      "---\nartifact: spec/requirements\n---\n\n### C004-REQ-012 — Something\n- **Acceptance:** AC-012.1\n");
    const graph = buildChangeGraph(join(root, ".sdd", "004-x"));
    assert.equal(graph.change, "004");
    const edge = graph.edges.find((e) => e.to === "C004-AC-012.1");
    assert.ok(edge, "edge to C004-AC-012.1");
    assert.equal(edge.from, "C004-REQ-012");
    assert.equal(edge.kind, "acceptance");
    assert.equal(edge.raw, "AC-012.1");
    assert.equal(edge.line, 6);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
