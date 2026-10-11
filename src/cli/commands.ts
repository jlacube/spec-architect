// Command table of C001-IF-01. Usage strings are copied from the interface. Commands without `run`
// are refused with ERR-CLI-003 until their task implements them.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { isInside, normalisePath, relativePath } from "../io/paths.ts";
import { RULES } from "../lint/rules/index.ts";
import { lintWorkspace, type LintOptions } from "../lint/engine.ts";
import { PHASES, type LintRule, type Phase } from "../lint/types.ts";
import { buildChangeGraph } from "../model/graph.ts";
import { TOOL } from "../version.ts";
import { initRoot, initWorkspace } from "../workspace/init.ts";
import { nextId, tombstoneId } from "../workspace/ledger.ts";
import { createChange, isoDate, KINDS, PROFILES, type Kind } from "../workspace/change.ts";
import { upgradeToFull } from "../workspace/upgrade.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { applyArchive } from "../archive/apply.ts";
import { formatOp, planArchive } from "../archive/plan.ts";
import { decideBash } from "../hooks/guard-bash.ts";
import { decidePath } from "../hooks/guard-path.ts";
import { parseHookInput } from "../hooks/input.ts";
import { postWriteFeedback } from "../hooks/post-write.ts";
import { changeLine, sessionBrief } from "../hooks/session-start.ts";
import { findWorkspace } from "../workspace/find.ts";
import { writeSerenaConfig } from "../workspace/serena-config.ts";
import type { Profile } from "../workspace/templates.ts";
import { listChanges, rebuildRegistry, registryDrift, renderStatusBlock, writeStatus } from "../workspace/status.ts";
import { parseId } from "../model/ids.ts";
import { percent } from "../trace/matrix.ts";
import { trace } from "../trace/write.ts";
import { phaseHash } from "../gate/hash.ts";
import { approvalBlockers, approve, gateSummary, gitUser, record, type ApproveOptions, type GateContext } from "../gate/gate.ts";
import { setTask, type TaskSetOptions } from "../tracking/task.ts";
import { addDefect, closeDefect, reopenDefect } from "../tracking/defect.ts";
import { staleCheck, type PhaseCheck } from "../gate/stale.ts";
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
  /** Standard input (hook commands). */
  stdin: () => string;
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

function gateContext(ctx: CommandContext): GateContext {
  const phase = ctx.args["phase"] as Phase;
  return { root: ctx.root, changeDir: resolveChange(ctx, ctx.args["NNN"]), phase, rules: ctx.rules, tool: TOOL };
}

/** `sdd gate show <NNN> <phase>` (C001-REQ-801). */
function gateShow(ctx: CommandContext): number {
  ctx.out.line(gateSummary(gateContext(ctx)));
  return 0;
}

/**
 * `sdd gate approve <NNN> <phase> --note … [--waive …]… [--by …] [--usage …]` (C001-REQ-805 … 809,
 * 720). The refusal conditions are checked first, so a refused approval needs no note and writes
 * nothing; registry.json and SDD.md are refreshed after a successful approval.
 */
function gateApprove(ctx: CommandContext): number {
  const g = gateContext(ctx);
  const waive = (ctx.values["waive"] as string[] | undefined) ?? [];
  approvalBlockers(g, new Set(waive));
  const note = ctx.values["note"] as string | undefined;
  if (note === undefined || note.trim() === "") throw usage(ctx.name, "--note is required");
  const o: ApproveOptions = { note, waive };
  if (ctx.values["by"] !== undefined) o.by = ctx.values["by"] as string;
  if (ctx.values["usage"] !== undefined) o.usage = ctx.values["usage"] as string;
  const r = approve(g, o);
  const sdd = join(ctx.root, ".sdd");
  if (existsSync(join(sdd, "registry.json"))) writeStatus(sdd);
  ctx.out.line(`approved: CHG-${ctx.args["NNN"]} ${g.phase} ${r.hash} by ${r.approvedBy} on ${r.date}`);
  for (const w of r.waivers) ctx.out.line(`waived: ${w.item}`);
  return 0;
}

/**
 * `sdd change revise <NNN> <phase> --reason …` (C001-REQ-812): the phase goes in-revision, every
 * later approved phase stale, and the Gate log records the reason (same transition as
 * `gate record --decision revise`).
 */
function changeRevise(ctx: CommandContext): number {
  const phase = ctx.args["phase"] as Phase;
  record(gateContext(ctx), "revise", ctx.values["reason"] as string);
  refreshRegistry(ctx);
  ctx.out.line(`revised: CHG-${ctx.args["NNN"]} ${phase} in-revision`);
  return 0;
}

/** `sdd change stop <NNN> --reason …` (C001-REQ-815): the change is stopped with the reason and date. */
function changeStop(ctx: CommandContext): number {
  const changeDir = resolveChange(ctx, ctx.args["NNN"]);
  const current = String(splitFrontmatter(readFileSync(join(changeDir, "change.md"), "utf8")).data?.["phase"] ?? "00-ideation");
  record({ root: ctx.root, changeDir, phase: current as Phase, rules: ctx.rules, tool: TOOL }, "stop", ctx.values["reason"] as string);
  refreshRegistry(ctx);
  ctx.out.line(`stopped: CHG-${ctx.args["NNN"]}`);
  return 0;
}

/** `sdd gate record <NNN> <phase> --decision revise|stop --note …` (C001-REQ-812, 815). */
function gateRecord(ctx: CommandContext): number {
  const decision = ctx.values["decision"] as string;
  if (decision !== "revise" && decision !== "stop") throw usage(ctx.name, `--decision must be revise or stop: ${decision}`);
  record(gateContext(ctx), decision, ctx.values["note"] as string);
  const sdd = join(ctx.root, ".sdd");
  if (existsSync(join(sdd, "registry.json"))) writeStatus(sdd);
  ctx.out.line(`recorded: CHG-${ctx.args["NNN"]} ${ctx.args["phase"]} ${decision}`);
  return 0;
}

/** The change folder owning a full ID (`C004-…` → `.sdd/004-*`), or null. */
function changeOfId(ctx: CommandContext, id: string): string | null {
  const nnn = /^C(\d{3})-/.exec(id)?.[1];
  const folder = nnn ? changeFolders(ctx.root).find((f) => f.startsWith(`${nnn}-`)) : undefined;
  return folder ? join(ctx.root, ".sdd", folder) : null;
}

function refreshRegistry(ctx: CommandContext): void {
  const sdd = join(ctx.root, ".sdd");
  if (existsSync(join(sdd, "registry.json"))) writeStatus(sdd);
}

/** `sdd task set <T-ID> --status <s> [--commit] [--note] [--reason]` (C001-REQ-901 … 904, 922). */
function taskSet(ctx: CommandContext): number {
  const raw = ctx.args["T-ID"]!;
  const dir = /^C\d{3}-/.test(raw) ? changeOfId(ctx, raw) : resolveChange(ctx, undefined);
  if (!dir) throw new CliError("ERR-CLI-002", { NNN: raw.slice(1, 4) });
  const id = /^C\d{3}-/.test(raw) ? raw : `C${basename(dir).slice(0, 3)}-${raw}`;
  const o: TaskSetOptions = { status: ctx.values["status"] as string };
  for (const k of ["commit", "note", "reason"] as const) if (ctx.values[k] !== undefined) o[k] = ctx.values[k] as string;
  const r = setTask(dir, id, o);
  refreshRegistry(ctx);
  ctx.out.line(`${r.id}: ${r.from} → ${r.to}`);
  if (r.unfinished.length > 0) ctx.out.warn(new CliError("WARN-CLI-001", { T: r.id, deps: r.unfinished.join(", ") }));
  return 0;
}

/** `sdd defect add --ref <ID> --summary "<t>" [--by <name>]` (C001-REQ-907, 908). */
function defectAdd(ctx: CommandContext): number {
  const ref = ctx.values["ref"] as string;
  const dir = changeOfId(ctx, ref);
  const status = dir ? String(splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data?.["status"] ?? "active") : "";
  if (!dir || status === "archived" || !buildChangeGraph(dir).byId.has(ref)) throw new CliError("ERR-CLI-008", { ID: ref });
  const d = addDefect(dir, ref, ctx.values["summary"] as string, (ctx.values["by"] as string | undefined) ?? gitUser(ctx.root));
  refreshRegistry(ctx);
  ctx.out.line(`${d.id}: open on ${ref} (CHG-${basename(dir).slice(0, 3)})`);
  return 0;
}

/** `sdd defect close <D-id> --change <NNN> --resolution "<t>"` (C001-REQ-910). */
function defectClose(ctx: CommandContext): number {
  const d = closeDefect(resolveChange(ctx, ctx.values["change"] as string), ctx.args["D-id"]!, ctx.values["resolution"] as string);
  refreshRegistry(ctx);
  ctx.out.line(`${d.id}: closed`);
  return 0;
}

/** `sdd defect reopen <D-id> --change <NNN>` (C001-REQ-923). */
function defectReopen(ctx: CommandContext): number {
  const d = reopenDefect(resolveChange(ctx, ctx.values["change"] as string), ctx.args["D-id"]!);
  refreshRegistry(ctx);
  ctx.out.line(`${d.id}: open (reopened)`);
  return 0;
}

/** `sdd hash <NNN> <phase>` (C001-REQ-806): prints the phase's approval hash. */
function hashCmd(ctx: CommandContext): number {
  const dir = resolveChange(ctx, ctx.args["NNN"]);
  const phase = ctx.args["phase"]!;
  const r = phaseHash(dir, phase);
  if (ctx.values["json"]) ctx.out.json({ change: `CHG-${ctx.args["NNN"]}`, phase, hash: r.hash, files: r.files });
  else ctx.out.line(r.hash);
  return 0;
}

/**
 * `sdd stale check [<NNN>]` (C001-REQ-810): recomputes the approved phases of the named change, or of
 * every non-archived change, and marks stale phases in change.md (then refreshes registry.json and
 * the SDD.md block when the workspace has them).
 */
function staleCmd(ctx: CommandContext): number {
  const sdd = join(ctx.root, ".sdd");
  const dirs = ctx.args["NNN"] !== undefined ? [resolveChange(ctx, ctx.args["NNN"])] : changeFolders(ctx.root).map((f) => join(sdd, f));
  const results: { change: string; phases: PhaseCheck[] }[] = [];
  for (const dir of dirs) {
    const fm = splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data ?? {};
    if (fm["status"] === "archived") continue;
    results.push({ change: String(fm["id"] ?? dir), phases: staleCheck(dir, true) });
  }
  const changed = results.some((r) => r.phases.some((p) => p.stale));
  if (changed && existsSync(join(sdd, "registry.json"))) writeStatus(sdd);
  if (ctx.values["json"]) ctx.out.json({ changes: results });
  else
    for (const r of results)
      for (const p of r.phases)
        if (p.status === "approved")
          ctx.out.line(`${r.change} ${p.phase}: ${p.stale ? `stale (${p.stale})` : p.approvedHash === null ? "approved (no approved_hash)" : "approved (hash matches)"}`);
  return 0;
}

/**
 * `sdd trace <NNN> [--write] [--json]` (C001-REQ-706 … 709, 716). Prints the coverage of TR-01 …
 * TR-08 (and the TR-11 verdict once the plan has started) and the open markers, or the trace graph
 * with --json. Exits 1 when a coverage rule has gaps or the task DAG is broken.
 */
function traceCmd(ctx: CommandContext): number {
  const { out, values } = ctx;
  if (values["active"]) return traceActive(ctx);
  if (ctx.args["NNN"] === undefined) throw usage(ctx.name, "missing argument <NNN> (or --active)");
  const root = findWorkspace(ctx.cwd);
  if (root === null) throw new CliError("ERR-CLI-001");
  ctx = { ...ctx, root };
  const dir = resolveChange(ctx, ctx.args["NNN"]);
  const r = trace(dir, { write: values["write"] === true });
  out.trace("trace", { nodes: r.document.nodes.length, edges: r.document.edges.length, written: r.written.length });
  if (values["json"]) out.json(r.document);
  else {
    for (const c of r.coverage) out.line(`${c.rule} ${c.label}: ${percent(c.covered, c.total)}${c.gaps.length > 0 ? ` — missing ${c.gaps.slice(0, 10).join(", ")}${c.gaps.length > 10 ? ", …" : ""}` : ""}`);
    if (r.dagOk !== null) out.line(`TR-11 Task DAG acyclic, dependencies resolve: ${r.dagOk ? "yes" : "no"}`);
    out.line(`open items: ${r.markers.length}`);
    for (const w of r.written) out.line(`written: ${w}`);
  }
  return r.coverage.some((c) => c.gaps.length > 0) || r.dagOk === false ? 1 : 0;
}

/**
 * `sdd trace --active [--write]` (SubagentStop hook, C001-IF-07 §2): traces every active change (not
 * archived, not stopped). Always exits 0 and prints nothing with --quiet: exit 2 would keep the
 * subagent from stopping. Outside a workspace it does nothing.
 */
function traceActive(ctx: CommandContext): number {
  try {
    const root = findWorkspace(ctx.cwd);
    if (root === null) return 0;
    const sdd = join(root, ".sdd");
    const registry = rebuildRegistry(sdd);
    listChanges(sdd).forEach((c, i) => {
      const status = registry.changes[i]?.status;
      if (c.archived || status === "stopped" || status === "archived") return;
      const r = trace(c.dir, { write: ctx.values["write"] === true });
      if (!ctx.values["quiet"]) ctx.out.line(`${registry.changes[i]!.id}: open items ${r.markers.length}${r.written.length > 0 ? `, written ${r.written.length} file(s)` : ""}`);
    });
  } catch (e) {
    ctx.out.trace("trace.active.error", { detail: e instanceof Error ? e.message : String(e) });
  }
  return 0;
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
    for (const c of registry.changes.filter((x) => x.status !== "archived")) ctx.out.line(changeLine(c));
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

/** `sdd serena-config <plugin-data-dir>` (C001-REQ-1013): Serena's config in the plugin data folder. */
function serenaConfig(ctx: CommandContext): number {
  const r = writeSerenaConfig(resolve(ctx.cwd, String(ctx.args["plugin-data-dir"])));
  ctx.out.line(`${r.outcome}: ${r.path}`);
  return 0;
}

/** PreToolUse hook: exit 0 allows the write, exit 2 denies it with the reason on stderr (C001-IF-07 §2). */
function guardPath(ctx: CommandContext): number {
  const d = decidePath(parseHookInput(ctx.stdin()));
  if (d.allow) return 0;
  ctx.out.errorLine(d.message);
  return 2;
}

/** PreToolUse hook on Bash and PowerShell: exit 0 allows, exit 2 denies with the reason on stderr (C001-IF-07 §2). */
function guardBash(ctx: CommandContext): number {
  const d = decideBash(parseHookInput(ctx.stdin()));
  if (d.allow) return 0;
  ctx.out.errorLine(d.message);
  return 2;
}

/** `sdd archive <NNN> [--dry-run]` (C001-REQ-913 … 921): plan in memory, print every operation, then apply. */
function archiveCmd(ctx: CommandContext): number {
  const dir = resolveChange(ctx, ctx.args["NNN"]);
  const plan = planArchive(ctx.root, dir, isoDate());
  const dry = ctx.values["dry-run"] === true;
  ctx.out.line(`archive ${plan.change}${dry ? " (dry run)" : ""}: ${plan.ops.length} operation(s)`);
  for (const o of plan.ops) ctx.out.line(formatOp(o));
  if (dry) return 0;
  applyArchive(ctx.root, plan);
  ctx.out.line(`archived: ${plan.change} → .sdd/_archive/${basename(dir)}`);
  return 0;
}

/** SessionStart hook: the brief on standard output, nothing without .sdd/ (C001-REQ-911, 912). Always exit 0. */
function hookSessionStart(ctx: CommandContext): number {
  for (const line of sessionBrief(parseHookInput(ctx.stdin()), ctx.cwd)) ctx.out.line(line);
  return 0;
}

/** PostToolUse hook on Write|Edit: quick-lint feedback for .sdd/ files as additionalContext. Always exit 0. */
function hookPostWrite(ctx: CommandContext): number {
  const doc = postWriteFeedback(parseHookInput(ctx.stdin()), ctx.rules, TOOL);
  if (doc !== null) ctx.out.line(doc);
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
  { name: "change revise", usage: '<NNN> <phase> --reason "<text>"', summary: "Phase → in-revision; downstream → stale", positionals: [P("NNN"), P("phase")], options: { reason: R }, workspace: true, sampleArgs: ["004", "10-spec", "--reason", "r"], run: changeRevise },
  { name: "change stop", usage: '<NNN> --reason "<text>"', summary: "Change → stopped", positionals: [P("NNN")], options: { reason: R }, workspace: true, sampleArgs: ["004", "--reason", "r"], run: changeStop },
  { name: "id next", usage: "<TYPE> [--change NNN] [--block <capability>]", summary: "Allocate and print the next ID", positionals: [P("TYPE")], options: { change: S, block: S }, workspace: true, sampleArgs: ["REQ", "--change", "004"], run: idNext },
  { name: "id tombstone", usage: '<ID> --reason "<text>"', summary: "Retire an ID", positionals: [P("ID")], options: { reason: R }, workspace: true, sampleArgs: ["C004-REQ-012", "--reason", "r"], run: idTombstone },
  { name: "status", usage: "[--write] [--brief] [--json]", summary: "Print status; --write rebuilds registry and SDD.md block", positionals: [], options: { write: B, brief: B }, workspace: true, sampleArgs: [], run: status },
  { name: "lint", usage: "[<NNN>] [--phase <phase>] [--json] [--quick --file <path>]", summary: "Run lint rules", positionals: [P("NNN", true)], options: { phase: S, quick: B, file: S }, workspace: true, sampleArgs: [], run: lint },
  { name: "trace", usage: "<NNN> [--write] [--json]", summary: "Build the trace graph; write matrix, open items, trace.json", positionals: [P("NNN", true)], options: { write: B, active: B }, workspace: false, sampleArgs: ["004"], run: traceCmd },
  { name: "gate show", usage: "<NNN> <phase>", summary: "Print the gate summary", positionals: [P("NNN"), P("phase")], options: {}, workspace: true, sampleArgs: ["004", "10-spec"], run: gateShow },
  { name: "gate approve", usage: '<NNN> <phase> --note "<text>" [--waive <item>]… [--by <name>] [--usage "<text>"]', summary: "Approve a phase", positionals: [P("NNN"), P("phase")], options: { note: S, waive: { type: "string", multiple: true }, by: S, usage: S }, workspace: true, sampleArgs: ["004", "10-spec", "--note", "n"], run: gateApprove },
  { name: "gate record", usage: '<NNN> <phase> --decision revise|stop --note "<text>"', summary: "Log a non-approval decision", positionals: [P("NNN"), P("phase")], options: { decision: R, note: R }, workspace: true, sampleArgs: ["004", "10-spec", "--decision", "revise", "--note", "n"], run: gateRecord },
  { name: "stale check", usage: "[<NNN>]", summary: "Recompute hashes; mark stale", positionals: [P("NNN", true)], options: {}, workspace: true, sampleArgs: [], run: staleCmd },
  { name: "hash", usage: "<NNN> <phase>", summary: "Print the phase hash", positionals: [P("NNN"), P("phase")], options: {}, workspace: true, sampleArgs: ["004", "10-spec"], run: hashCmd },
  { name: "task set", usage: '<T-ID> --status <s> [--commit <sha>] [--note "<t>"] [--reason "<t>"]', summary: "Update a task", positionals: [P("T-ID")], options: { status: R, commit: S, note: S, reason: S }, workspace: true, sampleArgs: ["C004-T-001", "--status", "done"], run: taskSet },
  { name: "defect add", usage: '--ref <ID> --summary "<t>" [--by <name>]', summary: "Open a spec defect", positionals: [], options: { ref: R, summary: R, by: S }, workspace: true, sampleArgs: ["--ref", "C004-REQ-012", "--summary", "s"], run: defectAdd },
  { name: "defect close", usage: '<D-id> --change <NNN> --resolution "<t>"', summary: "Close a defect", positionals: [P("D-id")], options: { change: R, resolution: R }, workspace: true, sampleArgs: ["D-001", "--change", "004", "--resolution", "r"], run: defectClose },
  { name: "defect reopen", usage: "<D-id> --change <NNN>", summary: "Reopen a defect", positionals: [P("D-id")], options: { change: R }, workspace: true, sampleArgs: ["D-001", "--change", "004"], run: defectReopen },
  { name: "archive", usage: "<NNN> [--dry-run]", summary: "Merge into _living/, move to _archive/", positionals: [P("NNN")], options: { "dry-run": B }, workspace: true, sampleArgs: ["004", "--dry-run"], run: archiveCmd },
  { name: "guard-path", usage: "hook JSON on stdin", summary: "Allow/deny a write (hook)", positionals: [], options: {}, workspace: false, sampleArgs: [], run: guardPath },
  { name: "guard-bash", usage: "hook JSON on stdin", summary: "Allow/deny a shell command (hook)", positionals: [], options: {}, workspace: false, sampleArgs: [], run: guardBash },
  { name: "hook session-start", usage: "hook JSON on stdin", summary: "Print the session brief", positionals: [], options: {}, workspace: false, sampleArgs: [], run: hookSessionStart },
  { name: "hook post-write", usage: "hook JSON on stdin", summary: "Quick lint of a written .sdd/ file", positionals: [], options: {}, workspace: false, sampleArgs: [], run: hookPostWrite },
  { name: "serena-config", usage: "<plugin-data-dir>", summary: "Write Serena's config in the plugin data folder", positionals: [P("plugin-data-dir")], options: {}, workspace: false, sampleArgs: ["data"], run: serenaConfig },
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
