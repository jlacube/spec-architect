// Revision impact (C001-REQ-813): the IDs added, modified and removed in a phase since its last
// approval, by the per-ID content hashes of approvals.json (C001-REQ-814), and the downstream IDs
// that reference them. Printed by `sdd gate show` for a phase in revision (defect D-005 records that
// the interface spec does not define this output yet).
import { buildChangeGraph } from "../model/graph.ts";
import { idHashes, readApprovals } from "./hash.ts";

export interface Impact {
  added: string[];
  modified: string[];
  removed: string[];
  /** IDs (or `file:<path>`) outside the changed set whose text references a changed ID. */
  downstream: string[];
}

const sorted = (xs: Iterable<string>) => [...xs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

/** The impact of a phase since its last approval, or null when it has never been approved. */
export function impact(changeDir: string, phase: string): Impact | null {
  const before = readApprovals(changeDir)[phase]?.ids;
  if (!before) return null;
  const now = idHashes(changeDir, phase);
  const added = sorted(Object.keys(now).filter((id) => !(id in before)));
  const removed = sorted(Object.keys(before).filter((id) => !(id in now)));
  const modified = sorted(Object.keys(now).filter((id) => id in before && before[id] !== now[id]));
  const changed = new Set([...added, ...removed, ...modified]);
  const graph = buildChangeGraph(changeDir);
  const downstream = new Set<string>();
  for (const e of graph.edges) if (e.context === "text" && changed.has(e.to) && !changed.has(e.from)) downstream.add(e.from);
  return { added, modified, removed, downstream: sorted(downstream) };
}

/** The impact as the lines appended to the gate summary. */
export function impactLines(i: Impact): string[] {
  const part = (label: string, ids: string[]) => (ids.length > 0 ? [`${label} ${ids.join(", ")}`] : []);
  const changes = [...part("modified", i.modified), ...part("added", i.added), ...part("removed", i.removed)];
  return [`Impact since last approval: ${changes.join(" · ") || "no ID changed"}`, `Downstream: ${i.downstream.join(", ") || "none"}`];
}
