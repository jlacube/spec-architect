// Gate fixture for C001-TS-807 … 816: change 004 with ideation, spec and plan, approved with their
// real hashes, so edits can be checked against them.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { phaseHash, recordApproval } from "../../../src/gate/hash.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { makeWorkspace, minimalChange } from "../cli/helpers.ts";
import { plan } from "../cap06/plan-fixture.ts";

export const DIR = ".sdd/004-x";
export const REQ = `${DIR}/10-spec/20-capabilities/CAP-01-a/requirements.md`;

export interface GateWorkspace {
  root: string;
  dir: string;
  cleanup: () => void;
}

/** Change 004 with the given phases approved (approved_hash = their current hash). */
export function approvedChange(approved: string[] = ["00-ideation", "10-spec", "20-plan"]): GateWorkspace {
  const ws = makeWorkspace({
    ...minimalChange(),
    ...plan(),
    [`${DIR}/00-ideation/ideation.md`]: "---\nid: C004-IDEA\nartifact: ideation\nstatus: approved\n---\n# Ideation\n\nThe idea.\n",
  });
  const dir = join(ws.root, ...DIR.split("/"));
  const line = (p: string) =>
    approved.includes(p) ? `  ${p}: { status: approved, approved_hash: "${phaseHash(dir, p).hash}", approved_at: 2026-10-11, approved_by: p01 }` : `  ${p}: { status: draft }`;
  writeFileSync(join(dir, "change.md"), ["---", "id: CHG-004", "title: x", "profile: full", "status: active", "phases:", ...["00-ideation", "10-spec", "20-plan"].map(line), "---", "# CHG-004", ""].join("\n"));
  // Per-ID hashes in approvals.json, as `sdd gate approve` records them (C001-REQ-814).
  for (const p of approved) recordApproval(dir, p, "2026-10-11");
  return { root: ws.root, dir, cleanup: ws.cleanup };
}

/** Phase statuses from the change's change.md. */
export function statuses(dir: string): Record<string, string> {
  const phases = splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data?.["phases"] as Record<string, { status: string }>;
  return Object.fromEntries(Object.entries(phases).map(([k, v]) => [k, v.status]));
}
