// LINT-ROLL-001 (error): `75-rollout.md` lacks migration steps, feature flags with default values,
// rollback steps RB-<seq> each linked to a T or M ID, or communication notes — unless it states
// "No rollout impact" with a reason (C001-REQ-614). HTML comments (template guidance) do not count.
import { findIds } from "../../model/ids.ts";
import { sectionByName, tables, textWithoutComments } from "../spec.ts";
import type { LintRule, RuleFinding, SpecDoc } from "../types.ts";

const ROLLOUT = "20-plan/75-rollout.md";
const NO_IMPACT = /No rollout impact\s*[—–:-]?\s*(.*)/i;
const NO_FLAGS = /^\s*none\b|\bno (?:feature )?flags?\b/im;

/** The body of the level-2 section `name` without its heading and HTML comments, or null when absent. */
function section(doc: SpecDoc, name: string): { line: number; end: number; text: string } | null {
  const s = sectionByName(doc, name, 2);
  return s ? { ...s, text: textWithoutComments(doc, s.line + 1, s.end) } : null;
}

function problems(doc: SpecDoc, change: string): { line: number; ids?: string[]; text: string }[] {
  const body = doc.lines.map((l, i) => (doc.blocks.inFence(i + 1) ? "" : l));
  const none = NO_IMPACT.exec(body.join("\n").replace(/<!--[\s\S]*?-->/g, ""));
  if (none) return none[1]!.trim().split(/\s+/).filter(Boolean).length >= 3 ? [] : [{ line: 1, text: '"No rollout impact" without a reason' }];
  const out: { line: number; ids?: string[]; text: string }[] = [];
  const migration = section(doc, "migration");
  if (!migration || migration.text.trim() === "") out.push({ line: migration?.line ?? 1, text: "no migration steps" });
  const flags = section(doc, "feature flags");
  if (!flags || flags.text.trim() === "") out.push({ line: flags?.line ?? 1, text: "no feature flags section" });
  else if (!NO_FLAGS.test(flags.text)) {
    const flagTables = tables(doc, ROLLOUT).filter((t) => t.headerLine > flags.line && t.headerLine <= flags.end);
    const withDefault = flagTables.filter((t) => t.header.some((h) => h.includes("default")));
    const rows = withDefault.flatMap((t) => t.rows.map((r) => ({ r, i: t.header.findIndex((h) => h.includes("default")) })));
    if (withDefault.length > 0 && rows.length === 0) out.push({ line: flags.line, text: "feature flags lists no flag and does not say none" });
    for (const { r, i } of rows) if ((r.raw[i] ?? "").trim() === "") out.push({ line: r.line, text: `feature flag ${(r.raw[0] ?? "").replace(/`/g, "").trim()} has no default value` });
    if (withDefault.length === 0 && !/default/i.test(flags.text)) out.push({ line: flags.line, text: "feature flags without default values" });
  }
  const rb = tables(doc, ROLLOUT).flatMap((t) => t.rows).flatMap((r) => {
    const id = findIds(r.raw[0] ?? "", change).find((h) => h.id.includes("-RB-"))?.id;
    return id ? [{ r, id }] : [];
  });
  if (rb.length === 0) out.push({ line: section(doc, "rollback")?.line ?? 1, text: "no rollback steps RB-<seq>" });
  for (const { r, id } of rb)
    if (!r.raw.slice(1).some((cell) => findIds(cell, change).some((h) => /-(T|M)-/.test(h.id)))) out.push({ line: r.line, ids: [id], text: `${id} is not linked to a T or M ID` });
  const communication = section(doc, "communication");
  if (!communication || communication.text.trim() === "") out.push({ line: communication?.line ?? 1, text: "no communication notes" });
  return out;
}

export const roll001: LintRule = {
  code: "LINT-ROLL-001",
  severity: "error",
  fix: 'Add migration, flags with defaults, RB-IDs linked to T or M, communication — or "No rollout impact — <reason>"',
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      const doc = c.spec.docs.get(ROLLOUT);
      if (!c.spec.planStarted || !doc) continue;
      for (const p of problems(doc, c.change))
        out.push({ path: `${c.folder}/${ROLLOUT}`, line: p.line, ...(p.ids ? { ids: p.ids } : {}), message: `Rollout content missing: ${p.text}` });
    }
    return out;
  },
};
