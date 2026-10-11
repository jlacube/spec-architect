// `sdd trace` outputs (C001-REQ-706): 10-spec/80-traceability.md, 20-plan/80-traceability.md once
// the plan phase has started, trace.json at the change root, and 85-open-items.md in every started
// phase folder. All writes are atomic.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { writeTextAtomic } from "../io/atomic.ts";
import { loadLedger } from "../workspace/ledger.ts";
import { planCoverage, renderPlanMatrix, renderSpecMatrix, specCoverage, type CoverageRow } from "./matrix.ts";
import { buildTrace, type TraceDocument, type TraceModel } from "./model.ts";
import { markers, renderOpenItems, type Marker } from "./open-items.ts";

export const PHASE_FOLDERS = ["00-ideation", "10-spec", "20-plan"] as const;

export interface TraceResult {
  model: TraceModel;
  document: TraceDocument;
  coverage: CoverageRow[];
  dagOk: boolean | null;
  markers: Marker[];
  /** Change-relative paths written (with `write`). */
  written: string[];
}

/** A phase has started when change.md says so; without phase data, when its folder has content. */
function started(t: TraceModel, phase: string): boolean {
  const status = t.phaseStatus(phase);
  if (status !== "not-started") return true;
  const anyStatus = PHASE_FOLDERS.some((p) => t.phaseStatus(p) !== "not-started");
  return !anyStatus && [...t.lint.spec.docs.keys()].some((p) => p.startsWith(`${phase}/`));
}

export function trace(changeDir: string, options: { write: boolean; now?: Date }): TraceResult {
  const model = buildTrace(changeDir);
  const tombstones = new Set(loadLedger(changeDir).tombstones.map((x) => x.id));
  const planStarted = model.lint.spec.planStarted;
  const plan = planStarted ? planCoverage(model, tombstones) : null;
  const phases = PHASE_FOLDERS.filter((p) => started(model, p) && existsSync(join(changeDir, p)));
  const document: TraceDocument = { change: model.doc.change, generated_at: (options.now ?? new Date()).toISOString(), nodes: model.doc.nodes, edges: model.doc.edges };
  const result: TraceResult = {
    model, document, coverage: [...specCoverage(model), ...(plan?.rows ?? [])], dagOk: plan ? plan.dagOk : null,
    markers: phases.flatMap((p) => markers(model, p)), written: [],
  };
  if (!options.write) return result;

  const put = (rel: string, text: string) => {
    writeTextAtomic(join(changeDir, ...rel.split("/")), text);
    result.written.push(rel);
  };
  if (existsSync(join(changeDir, "10-spec"))) put("10-spec/80-traceability.md", renderSpecMatrix(model));
  if (planStarted && existsSync(join(changeDir, "20-plan"))) put("20-plan/80-traceability.md", renderPlanMatrix(model, tombstones));
  for (const p of phases) put(`${p}/85-open-items.md`, renderOpenItems(model, p));
  put("trace.json", JSON.stringify(document, null, 2) + "\n");
  return result;
}
