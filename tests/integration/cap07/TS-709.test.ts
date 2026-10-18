// C001-TC-709 — verifies C001-TS-709 (C001-AC-709.1, C001-REQ-709): trace.json content.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { repoRoot } from "../../helpers.ts";
import { specFile } from "../../helpers/spec-file.ts";
import { runTrace } from "./trace-fixture.ts";
import { task } from "../cap06/plan-fixture.ts";

const schema = JSON.parse(readFileSync(specFile("001", "10-spec/50-interfaces/trace.schema.json"), "utf8")) as object;
// Formats are not validated by Ajv here (no ajv-formats dependency); generated_at is checked below.
const validate = new Ajv2020({ strict: false, validateFormats: false }).compile(schema);

interface Doc {
  nodes: { id: string; type: string }[];
  edges: { from: string; to: string; relation: string }[];
}

test("trace.json validates against C001-IF-12, has every defined ID and every implements edge", () => {
  const r = runTrace(["--write"], Object.fromEntries([task("002", { implements: ["C004-REQ-012"], dependsOn: ["C004-T-001"] })]), true);
  const doc = JSON.parse(r.file("trace.json") ?? "{}") as Doc;
  assert.ok(validate(doc), JSON.stringify(validate.errors));
  const at = (doc as unknown as { generated_at: string }).generated_at;
  assert.equal(new Date(at).toISOString(), at);
  const ids = new Set(doc.nodes.map((n) => n.id));
  for (const id of ["C004-US-001", "C004-REQ-012", "C004-AC-012.1", "C004-TS-012", "C004-DOD-001", "C004-T-001", "C004-T-002", "C004-TC-012", "C004-M-01", "C004-CAP-01"])
    assert.ok(ids.has(id), id);
  for (const t of ["C004-T-001", "C004-T-002"]) assert.ok(doc.edges.some((e) => e.from === t && e.to === "C004-REQ-012" && e.relation === "implements"), t);
  assert.ok(doc.edges.some((e) => e.from === "C004-T-002" && e.to === "C004-T-001" && e.relation === "depends-on"));
  assert.ok(doc.edges.some((e) => e.from === "C004-AC-012.1" && e.to === "C004-TS-012" && e.relation === "scenario-of"));
});

test("--json prints the same graph", () => {
  const r = runTrace(["--json"], {}, true);
  assert.ok(validate(JSON.parse(r.stdout)), r.stdout);
});
