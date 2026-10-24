// Plugin structure checks of C001-IF-08 §3: `node scripts/check/run.mjs [--json]`. Exit 1 on any error.
// A check owned by a task that is not done yet (its subject is written by that task) reports its
// findings as `pending`, which does not fail the run; once the task is done they are errors.
import { fileURLToPath } from "node:url";
import ci from "./ci.mjs";
import dup from "./dup.mjs";
import evals from "./evals.mjs";
import hooks from "./hooks.mjs";
import layout from "./layout.mjs";
import { context, taskStatus } from "./lib.mjs";
import mcp from "./mcp.mjs";
import path from "./path.mjs";
import { port001, port002 } from "./port.mjs";
import readme from "./readme.mjs";
import { msg001, rules001, ver001 } from "./rules.mjs";
import size from "./size.mjs";
import tmpl from "./tmpl.mjs";
import tools from "./tools.mjs";
import variants from "./variants.mjs";

// PLG-VAR-001 (C002-IF-005 §6, C002-T-035) runs with the plugin checks of C001-IF-08 §3.
export const CHECKS = [layout, dup, port001, port002, path, tools, size, rules001, msg001, ver001, readme, hooks, ci, evals, mcp, tmpl, variants];

/** Runs every check; each finding gets `severity` error, or pending while its owner task is open. */
export function runChecks(ctx = context(), checks = CHECKS) {
  const out = [];
  for (const c of checks) {
    for (const f of c.check(ctx)) {
      // A finding may name its own owner task (a planned rule); otherwise the check's owner applies.
      const owner = f.owner ?? c.owner;
      const open = owner ? taskStatus(ctx, owner) !== "done" : false;
      out.push({ ...f, severity: open ? "pending" : "error", owner });
    }
  }
  return out;
}

export function format(f) {
  const where = f.line ? `${f.path}:${f.line}` : f.path;
  return `${f.severity} ${f.code} ${where} — ${f.message}${f.severity === "pending" ? ` (until ${f.owner} is done)` : ""}`;
}

// Script entry only: bundled into a test, import.meta.url is the test file, so match the file name too.
if (fileURLToPath(import.meta.url) === process.argv[1] && /[\\/]check[\\/]run\.mjs$/.test(process.argv[1] ?? "")) {
  // SDD_CHECK_PLUGIN: the plugin folder to check (a copy, in tests); default plugins/architect.
  const findings = runChecks(process.env.SDD_CHECK_PLUGIN ? context({ plugin: process.env.SDD_CHECK_PLUGIN }) : context());
  if (process.argv.includes("--json")) console.log(JSON.stringify(findings, null, 2));
  else for (const f of findings) console.log(format(f));
  const errors = findings.filter((f) => f.severity === "error").length;
  const pending = findings.filter((f) => f.severity === "pending").length;
  console.log(`structure checks: ${CHECKS.length} checks, ${errors} error${errors === 1 ? "" : "s"}, ${pending} pending`);
  process.exitCode = errors > 0 ? 1 : 0;
}
