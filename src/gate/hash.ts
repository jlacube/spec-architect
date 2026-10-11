// Approval hash of C001-IF-13 §2 (C001-REQ-806) and the per-ID content hashes of approvals.json
// (C001-REQ-814). Ported from the bootstrap prototype phasehash.py (retired in C001-T-028); this
// repository's G1–G3 hashes are the golden values.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { normalizeForHash } from "../model/frontmatter.ts";
import { buildChangeGraph } from "../model/graph.ts";
import { writeTextAtomic } from "../io/atomic.ts";

/** Generated files at the phase root, outside the hash. */
export const GENERATED = new Set(["80-traceability.md", "85-open-items.md"]);
export const PHASES = ["00-ideation", "10-spec", "20-plan"] as const;
export type GatedPhase = (typeof PHASES)[number];

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

/** Hash inputs: every file under the phase folder except the generated ones, by path in byte order. */
export function phaseFiles(phaseDir: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const rel = prefix + name;
      if (statSync(abs).isDirectory()) walk(abs, rel + "/");
      else if (!GENERATED.has(rel)) out.push(rel);
    }
  };
  if (existsSync(phaseDir)) walk(phaseDir, "");
  return out.sort((a, b) => Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8")));
}

export function fileHash(abs: string): string {
  return sha256(normalizeForHash(readFileSync(abs, "utf8")));
}

/** `sha256:<hex>` of a phase: the single file's hash, or the hash of `path\thash\n` lines. */
export function phaseHash(changeDir: string, phase: string): { hash: string; files: number } {
  const dir = join(changeDir, phase);
  const files = phaseFiles(dir);
  const hashes = files.map((rel) => [rel, fileHash(join(dir, ...rel.split("/")))] as const);
  if (hashes.length === 1) return { hash: `sha256:${hashes[0]![1]}`, files: 1 };
  return { hash: `sha256:${sha256(hashes.map(([rel, h]) => `${rel}\t${h}\n`).join(""))}`, files: hashes.length };
}

/** Content hash of every ID defined in the phase (first definition wins), sorted by ID. */
export function idHashes(changeDir: string, phase: string): Record<string, string> {
  const graph = buildChangeGraph(changeDir);
  const ids = new Map<string, string>();
  for (const n of graph.nodes) if (n.file.startsWith(`${phase}/`) && !GENERATED.has(n.file.slice(phase.length + 1)) && !ids.has(n.id)) ids.set(n.id, n.contentHash);
  return Object.fromEntries([...ids].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

export interface ApprovalRecord {
  hash: string;
  approved_at: string;
  files: number;
  ids: Record<string, string>;
}

export function readApprovals(changeDir: string): Record<string, ApprovalRecord> {
  const p = join(changeDir, "approvals.json");
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as Record<string, ApprovalRecord>) : {};
}

/** Records the phase's hash and per-ID hashes in approvals.json (C001-REQ-814); used by `gate approve`. */
export function recordApproval(changeDir: string, phase: string, approvedAt: string): ApprovalRecord {
  const { hash, files } = phaseHash(changeDir, phase);
  const record: ApprovalRecord = { hash, approved_at: approvedAt, files, ids: idHashes(changeDir, phase) };
  const all = readApprovals(changeDir);
  all[phase] = record;
  writeTextAtomic(join(changeDir, "approvals.json"), JSON.stringify(all, null, 2) + "\n");
  return record;
}
