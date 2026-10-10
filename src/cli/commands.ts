// Command table of C001-IF-01. Usage strings are copied from the interface. Commands without `run`
// are refused with ERR-CLI-003 until their task implements them.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { isInside, normalisePath, relativePath } from "../io/paths.ts";
import { RULES } from "../lint/rules/index.ts";
import { buildContext, runLint } from "../lint/run.ts";
import { PHASES, type LintChange, type LintRule, type Phase } from "../lint/types.ts";
import { buildChangeGraph } from "../model/graph.ts";
import { TOOL } from "../version.ts";
import { initRoot, initWorkspace } from "../workspace/init.ts";
import { CliError, usage } from "./errors.ts";
import { formatFinding, type Output } from "./output.ts";

export interface OptionSpec {
  type: "string" | "boolean";
  multiple?: boolean;
  required?: boolean;
}

export interface Positional {
  name: string;
  optional?: boolean;
}

export interface CommandContext {
  name: string;
  out: Output;
  /** Directory the command runs from (`--cwd` or the process directory). */
  cwd: string;
  /** Repository root containing `.sdd/` (commands with `workspace: true`). */
  root: string;
  args: Record<string, string | undefined>;
  values: Record<string, string | boolean | string[] | undefined>;
  rules: readonly LintRule[];
}

export interface CommandSpec {
  name: string;
  usage: string;
  summary: string;
  positionals: Positional[];
  options: Record<string, OptionSpec>;
  /** True when the command needs an existing workspace (ERR-CLI-001 otherwise). */
  workspace: boolean;
  /** Arguments that pass validation, used by the SDD_DEBUG test of every command. */
  sampleArgs: string[];
  run?: (ctx: CommandContext) => number;
}

const S: OptionSpec = { type: "string" };
const R: OptionSpec = { type: "string", required: true };
const B: OptionSpec = { type: "boolean" };
const P = (name: string, optional = false): Positional => (optional ? { name, optional } : { name });

function changeFolders(root: string): string[] {
  const sdd = join(root, ".sdd");
  return readdirSync(sdd)
    .filter((n) => /^\d{3}-/.test(n) && statSync(join(sdd, n)).isDirectory())
    .sort();
}

function lint(ctx: CommandContext): number {
  const { out, root, values } = ctx;
  const phase = (values["phase"] as Phase | undefined) ?? null;
  let folders = changeFolders(root);
  const nnn = ctx.args["NNN"];
  let file: string | undefined;
  if (values["file"] !== undefined) {
    const abs = normalisePath(values["file"] as string, { cwd: ctx.cwd });
    if (!isInside(join(root, ".sdd"), abs)) throw usage(ctx.name, "--file must be inside .sdd/");
    file = relativePath(root, abs);
    const folder = /^\.sdd\/(\d{3}-[^/]+)\//.exec(file)?.[1];
    folders = folder ? folders.filter((f) => f === folder) : [];
  }
  if (nnn !== undefined) {
    const match = folders.filter((f) => f.startsWith(nnn + "-"));
    if (match.length !== 1) throw new CliError("ERR-CLI-002", { NNN: nnn });
    folders = match;
  }
  const changes: LintChange[] = folders.map((f) => {
    const graph = buildChangeGraph(join(root, ".sdd", f));
    out.trace("graph", { change: graph.change, files: graph.files.length, nodes: graph.nodes.length, edges: graph.edges.length });
    return { change: graph.change, folder: `.sdd/${f}`, graph };
  });
  const report = runLint(buildContext(root, changes, phase, file), ctx.rules, TOOL);
  out.trace("lint", { rules: ctx.rules.length, error: report.summary.error, warn: report.summary.warn, info: report.summary.info });
  if (values["json"]) out.json(report);
  else {
    for (const f of report.findings) out.line(formatFinding(f));
    if (!values["quiet"]) {
      const s = report.summary;
      out.line(`lint: ${s.error} error${s.error === 1 ? "" : "s"}, ${s.warn} warning${s.warn === 1 ? "" : "s"}, ${s.info} info`);
    }
  }
  return report.summary.error > 0 ? 1 : 0;
}

function init(ctx: CommandContext): number {
  const root = initRoot(ctx.cwd);
  ctx.out.trace("init", { root });
  const r = initWorkspace(root, { force: ctx.values["force"] === true });
  const where = join(root, ".sdd");
  ctx.out.line(r.existed ? `workspace exists: ${where}` : `created workspace: ${where}`);
  for (const c of r.created) ctx.out.line(`created: ${c}`);
  for (const c of r.rewritten) ctx.out.line(`rewritten: ${c}`);
  return 0;
}

function version(ctx: CommandContext): number {
  ctx.out.line(TOOL);
  return 0;
}

export const COMMANDS: readonly CommandSpec[] = [
  { name: "init", usage: "[--force]", summary: "Create or complete .sdd/", positionals: [], options: { force: B }, workspace: false, sampleArgs: [], run: init },
  { name: "change new", usage: '"<title>" [--profile lite|full] [--kind greenfield|brownfield|mixed]', summary: "Create a change folder", positionals: [P("title")], options: { profile: S, kind: S }, workspace: true, sampleArgs: ["A title"] },
  { name: "change profile", usage: "<NNN> full", summary: "Upgrade lite → full", positionals: [P("NNN"), P("profile")], options: {}, workspace: true, sampleArgs: ["004", "full"] },
  { name: "change revise", usage: '<NNN> <phase> --reason "<text>"', summary: "Phase → in-revision; downstream → stale", positionals: [P("NNN"), P("phase")], options: { reason: R }, workspace: true, sampleArgs: ["004", "10-spec", "--reason", "r"] },
  { name: "change stop", usage: '<NNN> --reason "<text>"', summary: "Change → stopped", positionals: [P("NNN")], options: { reason: R }, workspace: true, sampleArgs: ["004", "--reason", "r"] },
  { name: "id next", usage: "<TYPE> [--change NNN] [--block <capability>]", summary: "Allocate and print the next ID", positionals: [P("TYPE")], options: { change: S, block: S }, workspace: true, sampleArgs: ["REQ", "--change", "004"] },
  { name: "id tombstone", usage: '<ID> --reason "<text>"', summary: "Retire an ID", positionals: [P("ID")], options: { reason: R }, workspace: true, sampleArgs: ["C004-REQ-012", "--reason", "r"] },
  { name: "status", usage: "[--write] [--brief] [--json]", summary: "Print status; --write rebuilds registry and SDD.md block", positionals: [], options: { write: B, brief: B }, workspace: true, sampleArgs: [] },
  { name: "lint", usage: "[<NNN>] [--phase <phase>] [--json] [--quick --file <path>]", summary: "Run lint rules", positionals: [P("NNN", true)], options: { phase: S, quick: B, file: S }, workspace: true, sampleArgs: [], run: lint },
  { name: "trace", usage: "<NNN> [--write] [--json]", summary: "Build the trace graph; write matrix, open items, trace.json", positionals: [P("NNN")], options: { write: B }, workspace: true, sampleArgs: ["004"] },
  { name: "gate show", usage: "<NNN> <phase>", summary: "Print the gate summary", positionals: [P("NNN"), P("phase")], options: {}, workspace: true, sampleArgs: ["004", "10-spec"] },
  { name: "gate approve", usage: '<NNN> <phase> --note "<text>" [--waive <item>]… [--by <name>] [--usage "<text>"]', summary: "Approve a phase", positionals: [P("NNN"), P("phase")], options: { note: R, waive: { type: "string", multiple: true }, by: S, usage: S }, workspace: true, sampleArgs: ["004", "10-spec", "--note", "n"] },
  { name: "gate record", usage: '<NNN> <phase> --decision revise|stop --note "<text>"', summary: "Log a non-approval decision", positionals: [P("NNN"), P("phase")], options: { decision: R, note: R }, workspace: true, sampleArgs: ["004", "10-spec", "--decision", "revise", "--note", "n"] },
  { name: "stale check", usage: "[<NNN>]", summary: "Recompute hashes; mark stale", positionals: [P("NNN", true)], options: {}, workspace: true, sampleArgs: [] },
  { name: "hash", usage: "<NNN> <phase>", summary: "Print the phase hash", positionals: [P("NNN"), P("phase")], options: {}, workspace: true, sampleArgs: ["004", "10-spec"] },
  { name: "task set", usage: '<T-ID> --status <s> [--commit <sha>] [--note "<t>"] [--reason "<t>"]', summary: "Update a task", positionals: [P("T-ID")], options: { status: R, commit: S, note: S, reason: S }, workspace: true, sampleArgs: ["C004-T-001", "--status", "done"] },
  { name: "defect add", usage: '--ref <ID> --summary "<t>" [--by <name>]', summary: "Open a spec defect", positionals: [], options: { ref: R, summary: R, by: S }, workspace: true, sampleArgs: ["--ref", "C004-REQ-012", "--summary", "s"] },
  { name: "defect close", usage: '<D-id> --change <NNN> --resolution "<t>"', summary: "Close a defect", positionals: [P("D-id")], options: { change: R, resolution: R }, workspace: true, sampleArgs: ["D-001", "--change", "004", "--resolution", "r"] },
  { name: "defect reopen", usage: "<D-id> --change <NNN>", summary: "Reopen a defect", positionals: [P("D-id")], options: { change: R }, workspace: true, sampleArgs: ["D-001", "--change", "004"] },
  { name: "archive", usage: "<NNN> [--dry-run]", summary: "Merge into _living/, move to _archive/", positionals: [P("NNN")], options: { "dry-run": B }, workspace: true, sampleArgs: ["004", "--dry-run"] },
  { name: "guard-path", usage: "hook JSON on stdin", summary: "Allow/deny a write (hook)", positionals: [], options: {}, workspace: false, sampleArgs: [] },
  { name: "guard-bash", usage: "hook JSON on stdin", summary: "Allow/deny a shell command (hook)", positionals: [], options: {}, workspace: false, sampleArgs: [] },
  { name: "hook session-start", usage: "hook JSON on stdin", summary: "Print the session brief", positionals: [], options: {}, workspace: false, sampleArgs: [] },
  { name: "hook post-write", usage: "hook JSON on stdin", summary: "Quick lint of a written .sdd/ file", positionals: [], options: {}, workspace: false, sampleArgs: [] },
  { name: "extract-features", usage: "<NNN>", summary: "Write .feature files from gherkin blocks", positionals: [P("NNN")], options: {}, workspace: true, sampleArgs: ["004"] },
  { name: "version", usage: "—", summary: "Print architect-plugin@<semver>", positionals: [], options: {}, workspace: false, sampleArgs: [], run: version },
];

/** Validates a positional by its name: `<NNN>` is three digits, `<phase>` one of PHASES. */
export function checkPositional(command: string, name: string, value: string): void {
  if (name === "NNN" && !/^\d{3}$/.test(value)) throw usage(command, `<NNN> must have three digits: ${value}`);
  if (name === "phase" && !(PHASES as readonly string[]).includes(value)) throw usage(command, `<phase> must be one of ${PHASES.join(", ")}: ${value}`);
}

/** Command-specific option checks that parseArgs cannot express. */
export function checkOptions(spec: CommandSpec, values: CommandContext["values"]): void {
  if (spec.name === "lint") {
    const phase = values["phase"];
    if (phase !== undefined && !(PHASES as readonly string[]).includes(phase as string)) throw usage(spec.name, `--phase must be one of ${PHASES.join(", ")}`);
    if (values["quick"] && values["file"] === undefined) throw usage(spec.name, "--quick requires --file");
  }
}

export { RULES };
