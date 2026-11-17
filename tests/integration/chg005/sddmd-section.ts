// The section "If you are implementing a change" of SDD.md (C005-IF-003 §4), for C005-TS-126 … 128.
export const OLD_SENTENCE =
  "Read `NNN-slug/20-plan/handoff.md` and report progress with\n`node <plugin-root>/scripts/sdd.mjs task set <task-id> --status <status>` as described there.";

/** Body of the section, up to the next level-2 heading. */
export function implementingSection(text: string): string {
  const at = text.indexOf("## If you are implementing a change\n");
  if (at < 0) throw new Error("no implementing section");
  const end = text.indexOf("\n## ", at + 1);
  return text.slice(at, end < 0 ? text.length : end);
}
