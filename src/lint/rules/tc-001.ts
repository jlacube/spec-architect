// LINT-TC-001 (error): a test case of `60-test-plan.md` has a level outside unit, integration, e2e,
// eval, manual, or no location, test data or environment; or a manual case names no executor
// (C001-REQ-609). Lite: the TC table of plan.md, whose template defines level and location only.
import { findIds } from "../../model/ids.ts";
import { tables, type Table } from "../spec.ts";
import type { LintRule, RuleFinding } from "../types.ts";

const TEST_PLAN = "20-plan/60-test-plan.md";
const LITE_PLAN = "20-plan/plan.md";
const LEVELS = ["unit", "integration", "e2e", "eval", "manual"];

const col = (t: Table, name: RegExp) => t.header.findIndex((h) => name.test(h));
const plain = (cell: string | undefined) => (cell ?? "").replace(/`/g, "").trim();

export const tc001: LintRule = {
  code: "LINT-TC-001",
  severity: "error",
  fix: "Add the field",
  scope: "file",
  phase: "20-plan",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes) {
      if (!c.spec.planStarted) continue;
      const lite = c.profile === "lite";
      const file = lite ? LITE_PLAN : TEST_PLAN;
      const doc = c.spec.docs.get(file);
      if (!doc) continue;
      const path = `${c.folder}/${file}`;
      const all = tables(doc, file);
      // Who executes a manual case: an owner or executor column of any table, keyed by the row's TC.
      const executors = new Map<string, string>();
      for (const t of all) {
        const i = col(t, /owner|executed by|executor/);
        if (i >= 0) for (const r of t.rows) for (const h of findIds(r.raw[0] ?? "", c.change)) executors.set(h.id, plain(r.raw[i]));
      }
      const tcTables = all.filter((t) => col(t, /^level$/) >= 0 && col(t, /^tc$|^id$/) >= 0);
      if (tcTables.length === 0) out.push({ path, line: 1, message: "Test case field missing: no test-case table (TC, Level, Location, Test data, Environment)" });
      for (const t of tcTables) {
        const [id, level, location, data, env] = [col(t, /^tc$|^id$/), col(t, /^level$/), col(t, /location/), col(t, /test data|^data$/), col(t, /environment/)];
        const required: [string, number][] = lite ? [["location", location]] : [["location", location], ["test data", data], ["environment", env]];
        for (const r of t.rows) {
          const tc = findIds(r.raw[id] ?? "", c.change).find((h) => h.id.includes("-TC-"))?.id;
          if (!tc) continue;
          const at = (message: string): void => void out.push({ path, line: r.line, ids: [tc], message: `Test case field missing: ${tc} ${message}` });
          const lv = plain(r.raw[level]);
          if (!LEVELS.includes(lv)) at(lv === "" ? "has no level" : `has level "${lv}", not one of ${LEVELS.join(", ")}`);
          for (const [name, i] of required) if (i < 0 || plain(r.raw[i]) === "") at(`has no ${name}`);
          if (lv === "manual" && (executors.get(tc) ?? "") === "") at("is manual but names no executor");
        }
      }
    }
    return out;
  },
};
