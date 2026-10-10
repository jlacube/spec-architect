// SDD.md, the workspace description file (C001-REQ-103): frontmatter, orientation sections and a
// status block between markers. Only the status block is ever rewritten in place.

export const STATUS_BEGIN = "<!-- sdd:status:begin -->";
export const STATUS_END = "<!-- sdd:status:end -->";

const EMPTY_STATUS = [
  "| Change | Title | Phase | Status | Tasks done | Open defects | Updated |",
  "|---|---|---|---|---|---|---|",
].join("\n");

export function renderSddMd(generator: string, statusBlock: string = EMPTY_STATUS): string {
  return `---
sdd_version: 1
workspace: .sdd
generator: ${generator}
id_scheme: "C{NNN}-{TYPE}-{seq}"
---
# Spec-Driven Development workspace

This folder holds the specifications for this repository. **Agents: read this file first.**

## How to orient yourself (agents)
1. Read \`registry.json\` → find changes whose status is not \`archived\`.
2. For the change you work on, read \`NNN-slug/change.md\` (phase, gate state, open defects).
3. Respect phase order: \`00-ideation\` → \`10-spec\` → \`20-plan\`. Never consume an artifact whose
   \`status\` is not \`approved\` (or whose approval hash no longer matches its content).
4. Current system truth lives in \`_living/\`; per-change deltas live in change folders.
5. Project rules: \`_constitution/constitution.md\`.

## If you are implementing a change
Read \`NNN-slug/20-plan/handoff.md\` and report progress with
\`node <plugin-root>/scripts/sdd.mjs task set <task-id> --status <status>\` as described there.

## Conventions
- IDs: \`C<NNN>-<TYPE>-<seq>\` (e.g. \`C004-REQ-012\`); short forms (\`REQ-012\`) inside a change folder.
- Status: not-started → draft → in-review → approved → (stale | in-revision) → archived.
- Markers: \`[NEEDS CLARIFICATION: …]\`, \`[ASSUMPTION: …]\`, \`[WAIVED: <gate> <reason>]\`.
- Only the sdd CLI writes \`registry.json\`, \`ids.json\`, \`approvals.json\` and the status block below.

${STATUS_BEGIN}
${statusBlock}
${STATUS_END}
`;
}

/** The status block's content, or null when the markers are missing, repeated or out of order. */
export function readStatusBlock(text: string): string | null {
  const b = text.indexOf(STATUS_BEGIN);
  const e = text.indexOf(STATUS_END);
  if (b < 0 || e < b || text.indexOf(STATUS_BEGIN, b + 1) >= 0 || text.indexOf(STATUS_END, e + 1) >= 0) return null;
  return text.slice(b + STATUS_BEGIN.length, e).replace(/^\n/, "").replace(/\n$/, "");
}

/** Replaces only the content between the markers; throws when they are not well formed. */
export function replaceStatusBlock(text: string, block: string): string {
  if (readStatusBlock(text) === null) throw new Error(`SDD.md must contain exactly one ${STATUS_BEGIN} … ${STATUS_END} block`);
  const b = text.indexOf(STATUS_BEGIN) + STATUS_BEGIN.length;
  const e = text.indexOf(STATUS_END);
  return text.slice(0, b) + "\n" + block + "\n" + text.slice(e);
}
