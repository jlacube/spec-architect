// Target structure checks of C002-IF-005 §6 (C002-COMP-007, C002-T-035): the packages are generated from
// the current source plugin into a fresh temporary folder (C002-REQ-601; never the repository's dist/,
// C002-TS-603), each is read back and checked against its contract, and the folder is removed. A failed
// generation is reported with the generator's diagnostics, each naming its target and file. Bundled and
// run by ./run.mjs; tests import `runTargetChecks` and `checkPackage` directly.
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../../generate/main.ts";
import { agent001, mem001, mode001 } from "./agents.mjs";
import grant from "./grant.mjs";
import { class001, hook001 } from "./hooks.mjs";
import { layout001, mcp001 } from "./layout.mjs";
import { readTree, sourceContext, targetContext, TARGETS } from "./lib.mjs";
import perm from "./perm.mjs";
import port from "./port.mjs";
import serena from "./serena.mjs";
import size from "./size.mjs";
import tools from "./tools.mjs";

export const CHECKS = [layout001, port, tools, mcp001, serena, grant, class001, size, hook001, perm, agent001, mode001, mem001];

/** Runs every check on one target context; each finding gets the target and severity error. */
export function checkPackage(ctx, checks = CHECKS) {
  const out = [];
  for (const c of checks) for (const f of c.check(ctx)) out.push({ ...f, target: ctx.target, severity: "error" });
  return out;
}

/**
 * Generates the selected targets (default all, each in its table's mode unless `modes` names another)
 * from `plugin` into a fresh temporary folder and checks them. Returns the findings, the per-target
 * summaries and the file-access log of the checks (paths read; C002-TS-607).
 * @param {{ plugin: string, targets?: readonly string[], modes?: Record<string, string>, checks?: { code: string, check: (ctx: any) => any[] }[] }} options
 */
export function runTargetChecks({ plugin, targets = TARGETS, modes = {}, checks = CHECKS }) {
  const log = [];
  const out = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-tgt-check-")));
  try {
    const args = ["--source", plugin, "--out", out, "--json"];
    for (const t of targets) args.push("--target", t);
    for (const [t, m] of Object.entries(modes)) args.push("--mode", `${t}=${m}`);
    const stdout = [];
    const stderr = [];
    const code = main(args, { stdout: (l) => stdout.push(l), stderr: (l) => stderr.push(l) });
    let report = { targets: [], diagnostics: [] };
    try {
      report = JSON.parse(stdout.join("\n"));
    } catch {
      // usage error or internal error: no JSON report
    }
    if (code !== 0) {
      const findings = report.diagnostics.map((d) => ({ code: d.code, target: d.target ?? null, path: d.file ?? null, line: d.line ?? null, message: d.message, severity: "error" }));
      if (findings.length === 0) findings.push({ code: "ERR-GEN", target: null, path: null, line: null, message: `generation failed (exit ${code}): ${stderr.join(" ")}`, severity: "error" });
      return { findings, packages: [], log, generated: false };
    }
    const src = sourceContext(plugin, log);
    const findings = [];
    const packages = [];
    for (const r of report.targets) {
      const files = readTree(join(out, r.target), log);
      const ctx = targetContext(src, r.target, r.mode, files);
      const fs = checkPackage(ctx, checks);
      findings.push(...fs);
      packages.push({ target: r.target, mode: r.mode, files: files.size, errors: fs.length });
    }
    return { findings, packages, log, generated: true };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

/** C001-IF-08 §3 print form with the target name. */
export function format(f) {
  const where = f.path ? (f.line ? `${f.path}:${f.line}` : f.path) : "-";
  return `${f.severity} ${f.code} ${f.target ?? "-"} ${where} — ${f.message}`;
}

/** Command line: `[--plugin <dir>] [--mode <target>=<mode>]… [--json]`; exit 1 on any finding. */
export function cli(argv, defaultPlugin) {
  const i = argv.indexOf("--plugin");
  const plugin = i >= 0 ? argv[i + 1] : process.env.SDD_CHECK_PLUGIN || defaultPlugin;
  const modes = {};
  argv.forEach((a, k) => {
    const m = a === "--mode" ? /^([^=]+)=(.+)$/.exec(argv[k + 1] ?? "") : null;
    if (m) modes[m[1]] = m[2];
  });
  const started = Date.now();
  const r = runTargetChecks({ plugin, modes });
  if (argv.includes("--json")) console.log(JSON.stringify(r.findings, null, 2));
  else for (const f of r.findings) console.log(format(f));
  if (!r.generated) console.log(`target structure checks: generation failed, ${r.findings.length} error${r.findings.length === 1 ? "" : "s"}`);
  for (const p of r.packages) console.log(`target structure checks: ${p.target} (mode ${p.mode}, ${p.files} files): ${CHECKS.length} checks, ${p.errors} error${p.errors === 1 ? "" : "s"}`);
  console.log(`target structure checks: ${((Date.now() - started) / 1000).toFixed(1)} s`);
  return r.findings.length > 0 ? 1 : 0;
}
