// Gate engine (C001-COMP-05): the summary of `sdd gate show` (C001-IF-13 §1, C001-REQ-801), the
// approval transaction of `sdd gate approve` (C001-REQ-805, 807, 808, 809, 720; refusals write
// nothing) and the non-approval decisions of `sdd gate record` (C001-REQ-812, 815).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { CliError } from "../cli/errors.ts";
import { writeTextAtomic } from "../io/atomic.ts";
import { lintWorkspace } from "../lint/engine.ts";
import type { Finding, LintRule, Phase } from "../lint/types.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { planCoverage, specCoverage, type CoverageRow } from "../trace/matrix.ts";
import { buildTrace } from "../trace/model.ts";
import { markers, type Marker } from "../trace/open-items.ts";
import { appendGateLog, GATES, setPhase, setPhaseStatus, setTopLevel, waiversYaml, type Waiver } from "../workspace/change-md.ts";
import { isoDate } from "../workspace/change.ts";
import { criticFindings, type CriticFinding } from "./critic-parse.ts";
import { PHASES, phaseFiles, phaseHash, recordApproval } from "./hash.ts";

export interface GateContext {
  root: string;
  changeDir: string;
  phase: Phase;
  rules: readonly LintRule[];
  tool: string;
}

interface ChangeState {
  text: string;
  fm: Record<string, unknown>;
  phases: Record<string, Record<string, unknown>>;
}

function readChange(changeDir: string): ChangeState {
  const text = readFileSync(join(changeDir, "change.md"), "utf8");
  const fm = splitFrontmatter(text).data ?? {};
  return { text, fm, phases: (fm["phases"] ?? {}) as Record<string, Record<string, unknown>> };
}

const nnnOf = (changeDir: string) => basename(changeDir).slice(0, 3);
const phaseStatus = (s: ChangeState, phase: string) => String(s.phases[phase]?.["status"] ?? "not-started");

function lintPhase(ctx: GateContext): Finding[] {
  return lintWorkspace(ctx.root, { change: nnnOf(ctx.changeDir), phase: ctx.phase, cwd: ctx.root, rules: ctx.rules, tool: ctx.tool }).findings;
}

function coverageFor(changeDir: string, phase: string): CoverageRow[] {
  const t = buildTrace(changeDir);
  if (phase === "10-spec") return specCoverage(t);
  if (phase === "20-plan") return planCoverage(t).rows;
  return [];
}

/** The C001-IF-13 §1 summary. */
export function gateSummary(ctx: GateContext): string {
  const s = readChange(ctx.changeDir);
  const t = buildTrace(ctx.changeDir);
  const files = phaseFiles(join(ctx.changeDir, ctx.phase));
  const counts = new Map<string, number>();
  for (const n of t.doc.nodes) if (n.file.startsWith(`${ctx.phase}/`)) counts.set(n.type, (counts.get(n.type) ?? 0) + 1);
  const coverage = coverageFor(ctx.changeDir, ctx.phase);
  const findings = lintPhase(ctx);
  const sev = (x: string) => findings.filter((f) => f.severity === x).length;
  const critic = criticFindings(ctx.changeDir, ctx.phase).filter((f) => f.status === "open");
  const crit = (x: string) => {
    const list = critic.filter((f) => f.severity === x);
    return `${list.length} ${x}${list.length > 0 && x !== "minor" ? ` (${list.map((f) => f.id).join(", ")})` : ""}`;
  };
  const open = markers(t, ctx.phase);
  const clar = open.filter((m) => m.type === "NEEDS CLARIFICATION");
  const others = ["ASSUMPTION", "WAIVED"].map((k) => [k, open.filter((m) => m.type === k).length] as const).filter(([, n]) => n > 0);
  const markerText =
    open.length === 0
      ? "none"
      : [
          ...(clar.length > 0 ? [`${clar.length} [NEEDS CLARIFICATION] (${clar.map((m) => `${m.reference} at ${m.file.slice(ctx.phase.length + 1)}:${m.line}`).join(", ")})`] : []),
          ...others.map(([k, n]) => `${n} [${k}]`),
        ].join(" · ");
  const status = phaseStatus(s, ctx.phase);
  const approvedHash = s.phases[ctx.phase]?.["approved_hash"];
  const stale = status === "stale" || (status === "approved" && typeof approvedHash === "string" && phaseHash(ctx.changeDir, ctx.phase).hash !== approvedHash);
  const previous = typeof approvedHash === "string" ? `${String(s.phases[ctx.phase]?.["approved_at"] ?? "?")} (${approvedHash.slice(0, 15)}…)` : "none";
  return [
    `Gate ${GATES[ctx.phase]!.split(" ")[0]} — CHG-${nnnOf(ctx.changeDir)} ${JSON.stringify(String(s.fm["title"] ?? ""))} — phase ${ctx.phase} (status: ${status})`,
    `Files (${files.length}): ${files.join(", ") || "none"}`,
    `IDs: ${[...counts].sort(([a], [b]) => a.localeCompare(b)).map(([k, n]) => `${k} ${n}`).join(" · ") || "none"}`,
    `Coverage: ${coverage.map((c) => `${c.rule} ${c.covered}/${c.total}`).join(" · ") || "n/a"}`,
    `Lint: ${sev("error")} error · ${sev("warn")} warn · ${sev("info")} info`,
    `Critic: ${crit("blocker")} · ${crit("major")} · ${crit("minor")}`,
    `Open markers: ${markerText}`,
    `Stale: ${stale ? "yes" : "no"} · Previous approval: ${previous}`,
    "Proposed waivers: (none)",
  ].join("\n");
}

export interface ApproveOptions {
  note: string;
  waive: string[];
  by?: string;
  usage?: string;
  today?: string;
}

/** git user.name in `root`, or "unknown". */
export function gitUser(root: string): string {
  try {
    return execFileSync("git", ["config", "user.name"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || "unknown";
  } catch {
    return "unknown";
  }
}

/** Checks the refusal conditions; throws the first refusal without writing anything. */
export function approvalBlockers(ctx: GateContext, waive: ReadonlySet<string>): void {
  const s = readChange(ctx.changeDir);
  const changeStatus = String(s.fm["status"] ?? "active");
  if (changeStatus === "stopped" || changeStatus === "archived") throw new CliError("ERR-CLI-014", { NNN: nnnOf(ctx.changeDir), "stopped|archived": changeStatus });
  const index = PHASES.indexOf(ctx.phase as (typeof PHASES)[number]);
  if (index > 0) {
    const predecessor = PHASES[index - 1]!;
    if (phaseStatus(s, predecessor) !== "approved") throw new CliError("ERR-CLI-015", { phase: ctx.phase, predecessor: `${predecessor} (${phaseStatus(s, predecessor)})` });
  }
  const lint = lintPhase(ctx).filter((f) => f.severity === "error" && !waive.has(f.code) && !(f.ids ?? []).some((id) => waive.has(id)));
  if (lint.length > 0) throw new CliError("ERR-CLI-010", { list: lint.map((f) => `${f.code}${f.ids?.length ? ` [${f.ids.join(", ")}]` : ""} at ${f.path}${f.line ? `:${f.line}` : ""}`).join("; ") });
  const open: Marker[] = markers(buildTrace(ctx.changeDir), ctx.phase).filter((m) => m.type === "NEEDS CLARIFICATION" && !waive.has(m.reference));
  if (open.length > 0) throw new CliError("ERR-CLI-011", { list: open.map((m) => `${m.reference} at ${m.file}:${m.line}`).join("; ") });
  const blockers: CriticFinding[] = criticFindings(ctx.changeDir, ctx.phase).filter((f) => f.severity === "blocker" && f.status === "open" && !waive.has(f.id));
  if (blockers.length > 0) throw new CliError("ERR-CLI-012", { list: blockers.map((f) => `${f.id} (${f.title})`).join("; ") });
}

export interface ApproveResult {
  hash: string;
  approvedBy: string;
  date: string;
  waivers: Waiver[];
}

/** `sdd gate approve`: refusal checks, then approvals.json, change.md (phase, waivers, Gate log). */
export function approve(ctx: GateContext, o: ApproveOptions): ApproveResult {
  const waive = new Set(o.waive);
  approvalBlockers(ctx, waive);
  const date = o.today ?? isoDate();
  const approvedBy = o.by ?? gitUser(ctx.root);
  const record = recordApproval(ctx.changeDir, ctx.phase, date);
  const s = readChange(ctx.changeDir);
  const waivers: Waiver[] = o.waive.map((item) => ({ item, gate: ctx.phase, date, note: o.note }));
  let text = setPhase(s.text, ctx.phase, { status: "approved", approved_hash: record.hash, approved_at: date, approved_by: approvedBy });
  if (waivers.length > 0) {
    const existing = (Array.isArray(s.fm["waivers"]) ? s.fm["waivers"] : []) as Record<string, unknown>[];
    const kept: Waiver[] = existing.map((w) => ({ item: String(w["item"]), gate: String(w["gate"]), date: String(w["date"]), note: String(w["note"]) }));
    text = setTopLevel(text, "waivers", waiversYaml([...kept, ...waivers]));
  }
  text = appendGateLog(text, [
    date, GATES[ctx.phase]!, waivers.length > 0 ? "**Approved with waivers**" : "**Approved**", `"${o.note}"`,
    waivers.length > 0 ? waivers.map((w) => w.item).join(", ") : "none", o.usage ?? "unavailable",
  ]);
  writeTextAtomic(join(ctx.changeDir, "change.md"), text);
  return { hash: record.hash, approvedBy, date, waivers };
}

/**
 * `sdd gate record --decision revise|stop`: revise puts the phase in revision and every later
 * approved phase to stale (C001-REQ-812); stop sets the change to `stopped` with the reason and
 * date (C001-REQ-815). Both log a Gate log row with the note.
 */
export function record(ctx: GateContext, decision: "revise" | "stop", note: string, today?: string): void {
  const date = today ?? isoDate();
  const s = readChange(ctx.changeDir);
  let text = s.text;
  if (decision === "revise") {
    text = setPhaseStatus(text, ctx.phase, "in-revision");
    for (const p of PHASES.slice(PHASES.indexOf(ctx.phase as (typeof PHASES)[number]) + 1)) if (phaseStatus(s, p) === "approved") text = setPhaseStatus(text, p, "stale");
  } else {
    text = setTopLevel(text, "status", "stopped");
    text = setTopLevel(text, "stopped", `{ reason: ${JSON.stringify(note)}, date: ${date} }`);
  }
  text = appendGateLog(text, [date, GATES[ctx.phase]!, decision === "revise" ? "**Revise**" : "**Stop**", `"${note}"`, "none", "unavailable"]);
  writeTextAtomic(join(ctx.changeDir, "change.md"), text);
}

