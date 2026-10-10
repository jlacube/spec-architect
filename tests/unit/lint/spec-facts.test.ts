// Spec facts on this repository's CHG-001 (C001-T-019 "zero findings on this repository's 10-spec"):
// the facts the requirement-quality rules read are really gathered, so a clean run is not vacuous.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { knownSystem, systemName } from "../../../src/lint/ears.ts";
import { gatherSpecFacts } from "../../../src/lint/spec-facts.ts";
import { buildChangeGraph } from "../../../src/model/graph.ts";
import { repoRoot } from "../../helpers.ts";

const sdd = join(repoRoot(), ".sdd");
const graph = buildChangeGraph(join(sdd, "001-architect-agent-suite"));
const facts = gatherSpecFacts(sdd, graph);

test("every CHG-001 story section, persona and system name is gathered", () => {
  assert.equal(facts.kind, "greenfield");
  const stories = [...facts.sections.keys()].filter((id) => id.includes("-US-"));
  assert.equal(stories.length, graph.nodes.filter((n) => n.type === "US").length);
  assert.ok(stories.length >= 80);
  assert.equal(facts.sections.size, graph.nodes.filter((n) => ["US", "REQ", "NFR"].includes(n.type) && n.form === "heading").length);
  assert.deepEqual([...facts.personas].sort(), ["P-01", "P-02", "P-03", "P-04", "P-05"]);
  for (const name of ["sdd CLI", "plugin", "Conductor"]) assert.ok(facts.systems.includes(name), name);
});

test("every CHG-001 statement names a known system", () => {
  const reqs = graph.nodes.filter((n) => n.type === "REQ");
  assert.ok(reqs.length >= 200);
  for (const n of reqs) {
    const name = systemName(n.fields.find((f) => f.name === "Statement")?.value ?? "");
    assert.ok(name !== null && knownSystem(name, facts.systems), `${n.id}: ${name}`);
  }
});
