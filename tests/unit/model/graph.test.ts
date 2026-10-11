// The CHG-001 workspace of this repository is the parsing fixture: definition counts must match
// the bootstrap prototypes (retired in C001-T-028), and every per-ID content hash must reproduce the
// hashes recorded at the G2/G3 approvals (C001-IF-13 §2 step 5).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildChangeGraph, loadWorkspace } from "../../../src/model/graph.ts";
import { repoRoot } from "../../helpers.ts";

const changeDir = join(repoRoot(), ".sdd", "001-architect-agent-suite");
const graph = buildChangeGraph(changeDir);

function countByType(phase: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of graph.nodes) if (n.file.startsWith(phase + "/")) out[n.type] = (out[n.type] ?? 0) + 1;
  return out;
}

test("CHG-001 specification definitions match the prototype counts", () => {
  assert.deepEqual(countByType("10-spec"), {
    US: 80, REQ: 210, AC: 232, TS: 233, NFR: 27, INV: 24, DOD: 21, CON: 16, IF: 14, COMP: 13,
    SC: 10, GOAL: 8, AS: 4, NG: 2, CAP: 11,
  });
});

test("CHG-001 plan definitions are found in their defining files", () => {
  assert.deepEqual(countByType("20-plan"), { T: 58, TC: 233, RISK: 13, M: 7, ADR: 6, RB: 4, OA: 2 });
});

test("no ID is defined twice in CHG-001", () => {
  const dup = [...graph.byId.entries()].filter(([, v]) => v.length > 1).map(([k]) => k);
  assert.deepEqual(dup, []);
});

test("per-ID content hashes reproduce approvals.json for 10-spec and 20-plan", () => {
  const approvals = JSON.parse(readFileSync(join(changeDir, "approvals.json"), "utf8")) as Record<string, { ids: Record<string, string> }>;
  for (const phase of ["10-spec", "20-plan"]) {
    const expected = approvals[phase]?.ids ?? {};
    const mismatched: string[] = [];
    for (const [id, hash] of Object.entries(expected)) {
      const node = graph.byId.get(id)?.find((n) => n.file.startsWith(phase + "/"));
      if (node?.contentHash !== hash) mismatched.push(id);
    }
    assert.deepEqual(mismatched, [], `${phase}: ${mismatched.length} of ${Object.keys(expected).length} differ`);
  }
});

test("nodes carry file, 1-based line, title and form", () => {
  const req = graph.byId.get("C001-REQ-112")?.[0];
  assert.equal(req?.file, "10-spec/20-capabilities/CAP-01-workspace/requirements.md");
  assert.equal(req?.form, "heading");
  assert.equal(req?.title, "Short-form ID resolution");
  const line = readFileSync(join(changeDir, req!.file), "utf8").split("\n")[req!.line - 1];
  assert.match(line ?? "", /^### C001-REQ-112 /);
  assert.equal(graph.byId.get("C001-TS-117")?.[0]?.form, "scenario");
  assert.equal(graph.byId.get("C001-T-010")?.[0]?.form, "frontmatter");
  assert.equal(graph.byId.get("C001-RISK-003")?.[0]?.form, "table-row");
  assert.equal(graph.byId.get("C001-INV-01")?.[0]?.form, "bullet");
});

test("typed edges come from field bullets and task frontmatter", () => {
  const has = (from: string, to: string, kind: string) =>
    graph.edges.some((e) => e.from === from && e.to === to && e.kind === kind);
  assert.ok(has("C001-REQ-112", "C001-US-104", "stories"));
  assert.ok(has("C001-REQ-112", "C001-AC-112.1", "acceptance"));
  assert.ok(has("C001-T-010", "C001-REQ-112", "implements"));
  assert.ok(has("C001-T-010", "C001-TC-117", "verified_by"));
  assert.ok(has("C001-T-010", "C001-T-001", "depends_on"));
  assert.ok(has("C001-AC-112.1", "C001-TS-117", "scenario"));
});

test("references record whether they sit in code, quotes or text", () => {
  const ctx = (file: string, to: string) => graph.edges.find((e) => e.file.endsWith(file) && e.to === to)?.context;
  assert.equal(ctx("CAP-01-workspace/acceptance.md", "C004-REQ-013"), "code"); // example ID inside a gherkin fence
  assert.equal(ctx("CAP-01-workspace/requirements.md", "C001-US-104"), "text");
  assert.equal(ctx("50-interfaces/artifact-frontmatter.md", "C004-CAP-01"), "code"); // inside a fenced example
});

test("references resolve to a definition or a tombstone, except example IDs in code or quotes", () => {
  const tomb = new Set((JSON.parse(readFileSync(join(changeDir, "ids.json"), "utf8")) as { tombstones: { id: string }[] }).tombstones.map((t) => t.id));
  // Since the C001-T-028 revision, ideation labels are written IDEA-NG/IDEA-AS and example IDs sit in
  // backticks, so every text reference of the change resolves.
  const unresolved = graph.edges.filter((e) => e.context === "text" && !graph.byId.has(e.to) && !tomb.has(e.to));
  assert.deepEqual([...new Set(unresolved.map((e) => e.to))].sort(), []);
});

test("generated files contribute neither definitions nor edges", () => {
  assert.ok(graph.files.some((f) => f.path === "10-spec/80-traceability.md" && f.generated));
  assert.equal(graph.nodes.some((n) => n.file.endsWith("80-traceability.md")), false);
  assert.equal(graph.edges.some((e) => e.file.endsWith("80-traceability.md")), false);
});

test("loadWorkspace finds the change folders of .sdd/", () => {
  const ws = loadWorkspace(join(repoRoot(), ".sdd"));
  assert.deepEqual(ws.changes.map((c) => c.change), ["001"]);
});
