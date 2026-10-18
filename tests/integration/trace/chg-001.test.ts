// C001-T-023 on this repository's CHG-001: trace.json validates against C001-IF-12, outputs are
// deterministic apart from generated_at (C001-NFR-302), and the coverage equals the prototype
// generator's (specgen.py and planrender.py, retired in C001-T-028) recorded before the dogfood switch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { renderPlanMatrix, renderSpecMatrix } from "../../../src/trace/matrix.ts";
import { buildTrace } from "../../../src/trace/model.ts";
import { trace } from "../../../src/trace/write.ts";
import { repoRoot } from "../../helpers.ts";
import { changeFolder } from "../../helpers/spec-file.ts";

const dir = changeFolder("001");
const schema = JSON.parse(readFileSync(join(dir, "10-spec", "50-interfaces", "trace.schema.json"), "utf8")) as object;
const validate = new Ajv2020({ strict: false, validateFormats: false }).compile(schema);

test("the CHG-001 trace graph validates and covers every definition", () => {
  const r = trace(dir, { write: false, now: new Date("2026-10-11T00:00:00Z") });
  assert.ok(validate(r.document), JSON.stringify(validate.errors?.slice(0, 3)));
  assert.ok(r.document.nodes.length > 1000);
  assert.equal(new Set(r.document.nodes.map((n) => n.id)).size, r.document.nodes.length);
});

test("trace output is deterministic apart from generated_at", () => {
  const a = trace(dir, { write: false, now: new Date("2026-10-11T00:00:00Z") });
  const b = trace(dir, { write: false, now: new Date("2027-01-01T00:00:00Z") });
  assert.deepEqual({ ...a.document, generated_at: "" }, { ...b.document, generated_at: "" });
  assert.equal(renderSpecMatrix(buildTrace(dir)), renderSpecMatrix(buildTrace(dir)));
  assert.equal(renderPlanMatrix(buildTrace(dir)), renderPlanMatrix(buildTrace(dir)));
});

test("coverage equals the prototype generator's: TR-01 … TR-08 all complete, DAG resolves", () => {
  const r = trace(dir, { write: false });
  const lines = r.coverage.map((c) => `${c.rule} ${c.covered}/${c.total}`);
  assert.deepEqual(lines, ["TR-01 80/80", "TR-02 212/212", "TR-03 234/234", "TR-04 27/27", "TR-05 212/212", "TR-05 27/27", "TR-06 212/212", "TR-07 60/60", "TR-08 235/235"]);
  assert.equal(r.dagOk, true);
});
