// Stale detection (C001-REQ-810): an approved phase whose recomputed hash differs from its
// approved_hash becomes `stale`, and so does every approved phase after it in the same change.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeTextAtomic } from "../io/atomic.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { PHASES, phaseHash } from "./hash.ts";

export interface PhaseCheck {
  phase: string;
  /** Status before the check. */
  status: string;
  approvedHash: string | null;
  hash: string | null;
  /** Why the phase becomes stale, if it does. */
  stale: "hash changed" | "earlier phase stale" | null;
}

/**
 * Sets `status` of one phase in change.md's frontmatter, editing only that value so the rest of the
 * file stays byte-identical. Handles the flow form `10-spec: { status: approved, … }` and the
 * block form (`10-spec:` followed by an indented `status:` line).
 */
export function setPhaseStatus(text: string, phase: string, status: string): string {
  const lines = text.split("\n");
  const end = lines.indexOf("---", 1);
  const at = lines.findIndex((l, i) => i > 0 && i < end && new RegExp(`^\\s+${phase}:`).test(l));
  if (at < 0) throw new Error(`change.md has no phase ${phase}`);
  if (/\{/.test(lines[at]!)) {
    lines[at] = lines[at]!.replace(/(\bstatus:\s*)[\w-]+/, `$1${status}`);
    return lines.join("\n");
  }
  const indent = /^(\s*)/.exec(lines[at]!)![1]!.length;
  for (let i = at + 1; i < end; i++) {
    const own = /^(\s*)/.exec(lines[i]!)![1]!.length;
    if (own <= indent) break;
    if (/^\s+status:/.test(lines[i]!)) {
      lines[i] = lines[i]!.replace(/(status:\s*)[\w-]+/, `$1${status}`);
      return lines.join("\n");
    }
  }
  throw new Error(`change.md phase ${phase} has no status`);
}

/** Recomputes the approved phases of a change; with `write`, marks the stale ones in change.md. */
export function staleCheck(changeDir: string, write: boolean): PhaseCheck[] {
  const path = join(changeDir, "change.md");
  const text = readFileSync(path, "utf8");
  const phases = (splitFrontmatter(text).data?.["phases"] ?? {}) as Record<string, { status?: unknown; approved_hash?: unknown }>;
  const checks: PhaseCheck[] = [];
  let staleFrom = false;
  for (const phase of PHASES) {
    const p = phases[phase];
    const status = typeof p?.status === "string" ? p.status : "not-started";
    const approvedHash = typeof p?.approved_hash === "string" ? p.approved_hash : null;
    const check: PhaseCheck = { phase, status, approvedHash, hash: null, stale: null };
    if (status === "approved") {
      if (approvedHash !== null) check.hash = phaseHash(changeDir, phase).hash;
      if (staleFrom) check.stale = "earlier phase stale";
      else if (approvedHash !== null && check.hash !== approvedHash) {
        check.stale = "hash changed";
        staleFrom = true;
      }
    }
    checks.push(check);
  }
  if (write && checks.some((c) => c.stale)) {
    let next = text;
    for (const c of checks) if (c.stale) next = setPhaseStatus(next, c.phase, "stale");
    writeTextAtomic(path, next);
  }
  return checks;
}
