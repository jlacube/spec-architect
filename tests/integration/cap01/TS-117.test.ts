// C001-TC-117 — verifies C001-TS-117 (C001-AC-112.1, C001-REQ-112): short-form resolution.
// Exercised through the workspace model and through `sdd trace` (C001-T-023).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildChangeGraph } from "../../../src/model/graph.ts";
import { makeWorkspace, runInProcess } from "../cli/helpers.ts";

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

test("through the command: `sdd trace 004 --json` has the edge to C004-AC-012.1", () => {
  // The criterion is defined too: trace.json keeps edges between defined IDs (dangling ones are TR-12's).
  const ws = makeWorkspace({
    ".sdd/SDD.md": "# SDD\n",
    ".sdd/004-x/change.md": "---\nid: CHG-004\ntitle: x\n---\n# CHG-004\n",
    ".sdd/004-x/10-spec/20-capabilities/CAP-01-x/requirements.md": "---\nartifact: spec/requirements\n---\n\n### C004-REQ-012 — Something\n- **Acceptance:** AC-012.1\n",
    ".sdd/004-x/10-spec/20-capabilities/CAP-01-x/acceptance.md":
      "---\nartifact: spec/acceptance\n---\n\n#### C004-AC-012.1 — Criterion\n```gherkin\nScenario: C004-TS-012 — s\n  Given a\n  When b\n  Then c\n```\n",
  });
  try {
    const r = runInProcess(["trace", "004", "--json"], { cwd: ws.root });
    const doc = JSON.parse(r.stdout) as { edges: { from: string; to: string; relation: string }[] };
    assert.ok(doc.edges.some((e) => e.from === "C004-REQ-012" && e.to === "C004-AC-012.1" && e.relation === "acceptance-of"), r.stdout);
  } finally {
    ws.cleanup();
  }
});
