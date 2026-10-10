// Adoption of a hand-written bootstrap workspace (C001-REQ-123): when SDD.md's `generator` starts
// with `manual`, set it to the CLI's identifier and change nothing else. Changes, phase statuses,
// approval hashes and gate logs are left as they are; `sdd status --write` (C001-T-017) calls this
// before rebuilding derived files.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeTextAtomic } from "../io/atomic.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { TOOL } from "../version.ts";

/** Returns true when the workspace was adopted, false when it already had a CLI generator. */
export function adoptBootstrap(sddDir: string): boolean {
  const path = join(sddDir, "SDD.md");
  const text = readFileSync(path, "utf8");
  const doc = splitFrontmatter(text);
  const generator = doc.data?.["generator"];
  if (typeof generator !== "string" || !generator.startsWith("manual")) return false;
  const lines = doc.lines;
  const end = doc.bodyStartLine - 2; // index of the closing `---`
  const at = lines.findIndex((l, i) => i > 0 && i < end && /^generator:/.test(l));
  if (at < 0) return false;
  lines[at] = `generator: ${TOOL}`;
  writeTextAtomic(path, lines.join("\n"));
  return true;
}
