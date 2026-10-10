// Command table of C001-IF-01. Usage strings are copied from the interface. Commands without `run`
// are refused with ERR-CLI-003 until their task implements them.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { isInside, normalisePath, relativePath } from "../io/paths.ts";
import { RULES } from "../lint/rules/index.ts";
import { lintWorkspace, type LintOptions } from "../lint/engine.ts";
import { PHASES, type LintRule, type Phase } from "../lint/types.ts";
import { buildChangeGraph } from "../model/graph.ts";
import { TOOL } from "../version.ts";
import { initRoot, initWorkspace } from "../workspace/init.ts";
import { nextId, tombstoneId } from "../workspace/ledger.ts";
import { createChange, KINDS, PROFILES, type Kind } from "../workspace/change.ts";
import { upgradeToFull } from "../workspace/upgrade.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import type { Profile } from "../workspace/templates.ts";
import { rebuildRegistry, registryDrift, renderStatusBlock, writeStatus } from "../workspace/status.ts";
import { parseId } from "../model/ids.ts";
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
  const options: LintOptions = { cwd: ctx.cwd, rules: ctx.rules, tool: TOOL, phase: (values["phase"] as Phase | undefined) ?? null, trace: (e, d) => out.trace(e, d) };
  if (ctx.args["NNN"] !== undefined) options.change = ctx.args["NNN"];
  if (values["file"] !== undefined) options.file = values["file"] as string;
  const report = lintWorkspace(root, options);
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

/**
 * The change a command acts on: `--change NNN`, else the change folder containing the current
 * directory, else the only change of the workspace.
 */
export function resolveChange(ctx: CommandContext, nnn: string | undefined): string {
  const folders = changeFolders(ctx.root);
  if (nnn !== undefined) {
    if (!/^\d{3}$/.test(nnn)) throw usage(ctx.name, `--change must have three digits: ${nnn}`);
    const match = folders.filter((f) => f.startsWith(nnn + "-"));
    if (match.length !== 1) throw new CliError("ERR-CLI-002", { NNN: nnn });
    return join(ctx.root, ".sdd", match[0]!);
  }
  const inside = folders.find((f) => isInside(join(ctx.root, ".sdd", f), ctx.cwd));
  if (inside) return join(ctx.root, ".sdd", inside);
  if (folders.length === 1) return join(ctx.root, ".sdd", folders[0]!);
  throw usage(ctx.name, "several changes exist; pass --change <NNN>");
}

function status(ctx: CommandContext): number {
  const sdd = join(ctx.root, ".sdd");
  if (ctx.values["write"]) {
    const r = writeStatus(sdd);
    ctx.out.trace("status.write", { adopted: r.adopted, registry: r.registryWritten, sddMd: r.sddMdWritten, changes: r.registry.changes.length });
    if (ctx.values["json"]) {
      ctx.out.json(r.registry);
      return 0;
    }
    if (r.adopted) ctx.out.line("adopted: bootstrap workspace (SDD.md generator set)");
    ctx.out.line(r.registryWritten ? "written: registry.json" : "unchanged: registry.json");
    ctx.out.line(r.sddMdWritten ? "written: SDD.md status block" : "unchanged: SDD.md status block");
    return 0;
  }
  const registry = rebuildRegistry(sdd);
  if (ctx.values["json"]) ctx.out.json(registry);
  else if (ctx.values["brief"]) {
    for (const c of registry.changes.filter((x) => x.status !== "archived")) {
      const t = c.implementation.tasks;
      const open = c.defects.filter((d) => d["status"] === "open").length;
      ctx.out.line(`${c.id} ${c.phase} ${c.phases[c.phase as "10-spec"]?.status ?? "not-started"} · tasks ${t.done}/${t.total} · ${open} open defect${open === 1 ? "" : "s"}`);
    }
  } else ctx.out.line(renderStatusBlock(registry));
  return 0;
}

function changeNew(ctx: CommandContext): number {
  const profile = (ctx.values["profile"] as Profile | undefined) ?? "full";
  const kind = (ctx.values["kind"] as Kind | undefined) ?? "greenfield";
  const c = createChange(join(ctx.root, ".sdd"), ctx.args["title"]!, { profile, kind });
  ctx.out.trace("change.new", { id: c.id, folder: c.folder, profile, kind });
  ctx.out.line(`${c.id} .sdd/${c.folder}`);
  return 0;
}

function changeProfile(ctx: CommandContext): number {
  const dir = resolveChange(ctx, ctx.args["NNN"]);
  const target = ctx.args["profile"] as Profile;
  const current = splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data?.["profile"];
  if (current === target) {
    ctx.out.line(`CHG-${ctx.args["NNN"]} is already ${target}`);
    return 0;
  }
  if (target === "lite") throw new CliError("ERR-CLI-007");
  const written = upgradeToFull(dir);
  for (const f of written) ctx.out.line(`written: ${f}`);
  ctx.out.line(`CHG-${ctx.args["NNN"]} upgraded to full`);
  return 0;
}

function idNext(ctx: CommandContext): number {
  const dir = resolveChange(ctx, ctx.values["change"] as string | undefined);
  const opts = ctx.values["block"] !== undefined ? { block: ctx.values["block"] as string } : {};
  const { id } = nextId(dir, ctx.args["TYPE"]!, opts);
  ctx.out.trace("id.next", { id });
  ctx.out.line(id);
  return 0;
}

function idTombstone(ctx: CommandContext): number {
  const id = ctx.args["ID"]!;
  const parts = parseId(id);
  if (!parts) throw usage(ctx.name, `<ID> must be a full ID such as C004-REQ-007: ${id}`);
  const dir = resolveChange(ctx, parts.change);
  tombstoneId(dir, id, ctx.values["reason"] as string);
  ctx.out.line(`tombstoned: ${id}`);
  return 0;
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
  { name: "change new", usage: '"<title>" [--profile lite|full] [--kind greenfield|brownfield|mixed]', summary: "Create a change folder", positionals: [P("title")], options: { profile: S, kind: S }, workspace: true, sampleArgs: ["A title"], run: changeNew },
  { name: "change profile", usage: "<NNN> full", summary: "Upgrade lite → full", positionals: [P("NNN"), P("profile")], options: {}, workspace: true, sampleArgs: ["004", "full"], run: changeProfile },
  { name: "change revise", usage: '<NNN> <phase> --reason "<text>"', summary: "Phase → in-revision; downstream → stale", positionals: [P("NNN"), P("phase")], options: { reason: R }, workspace: true, sampleArgs: ["004", "10-spec", "--reason", "r"] },
  { name: "change stop", usage: '<NNN> --reason "<text>"', summary: "Change → stopped", positionals: [P("NNN")], options: { reason: R }, workspace: true, sampleArgs: ["004", "--reason", "r"] },
  { name: "id next", usage: "<TYPE> [--change NNN] [--block <capability>]", summary: "Allocate and print the next ID", positionals: [P("TYPE")], options: { change: S, block: S }, workspace: true, sampleArgs: ["REQ", "--change", "004"], run: idNext },
  { name: "id tombstone", usage: '<ID> --reason "<text>"', summary: "Retire an ID", positionals: [P("ID")], options: { reason: R }, workspace: true, sampleArgs: ["C004-REQ-012", "--reason", "r"], run: idTombstone },
  { name: "status", usage: "[--write] [--brief] [--json]", summary: "Print status; --write rebuilds registry and SDD.md block", positionals: [], options: { write: B, brief: B }, workspace: true, sampleArgs: [], run: status },
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
  if (name === "profile" && !(PROFILES as readonly string[]).includes(value)) throw usage(command, `<profile> must be one of ${PROFILES.join(", ")}: ${value}`);
}

/** Command-specific option checks that parseArgs cannot express. */
export function checkOptions(spec: CommandSpec, values: CommandContext["values"]): void {
  if (spec.name === "change new") {
    const profile = values["profile"];
    if (profile !== undefined && !(PROFILES as readonly string[]).includes(profile as string)) throw usage(spec.name, `--profile must be one of ${PROFILES.join(", ")}`);
    const kind = values["kind"];
    if (kind !== undefined && !(KINDS as readonly string[]).includes(kind as string)) throw usage(spec.name, `--kind must be one of ${KINDS.join(", ")}`);
  }
  if (spec.name === "lint") {
    const phase = values["phase"];
    if (phase !== undefined && !(PHASES as readonly string[]).includes(phase as string)) throw usage(spec.name, `--phase must be one of ${PHASES.join(", ")}`);
    if (values["quick"] && values["file"] === undefined) throw usage(spec.name, "--quick requires --file");
  }
}

export { RULES };
