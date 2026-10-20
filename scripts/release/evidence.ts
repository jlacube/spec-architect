// Evidence readers of the release check (C002-IF-009 §3, §4, §5): spike records and checklist records
// by their frontmatter only, as the frontmatter parser returns it (YAML 1.2 core schema,
// src/model/frontmatter.ts), the manual VS Code checklist's step index, and the injection eval summary.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitCells } from "../../src/model/blocks.ts";
import { splitFrontmatter } from "../../src/model/frontmatter.ts";

type Data = Record<string, unknown>;

const isMapping = (v: unknown): v is Data => v !== null && typeof v === "object" && !Array.isArray(v);

/** The frontmatter mapping of the Markdown file at `file`; null when it is missing or does not parse. */
export function readFrontmatter(file: string): Data | null {
  if (!existsSync(file)) return null;
  try {
    const doc = splitFrontmatter(readFileSync(file, "utf8"));
    return doc.error === undefined ? doc.data : null;
  } catch {
    return null;
  }
}

/** `host_versions` of a record or report: its string values (nested mappings such as S-07 `models` are left out). */
export function hostVersions(v: unknown): Record<string, string> {
  if (!isMapping(v)) return {};
  return Object.fromEntries(Object.entries(v).filter((e): e is [string, string] => typeof e[1] === "string"));
}

// --- spike records (§3) ---------------------------------------------------------------------------

export type SpikeMode = "native-permissions" | "sdd-mcp-server" | "copilot-hooks" | "deferred";

/**
 * Rule of S-08 (C002-DEC-005, C002-IF-009 §3): `sdd-mcp-server` when `subagent_tool_list_confined` is
 * true; else `copilot-hooks` when `guard_hooks_block_subagent_calls` is true (an absent outcome counts as
 * not blocking, C002-TS-623); else `deferred`. `agent_hooks_block_subagent_calls` decides nothing.
 */
export function s08Mode(fm: Data): SpikeMode {
  const outcomes = isMapping(fm["outcomes"]) ? fm["outcomes"] : {};
  if (outcomes["subagent_tool_list_confined"] === true) return "sdd-mcp-server";
  if (outcomes["guard_hooks_block_subagent_calls"] === true) return "copilot-hooks";
  return "deferred";
}

/** S-07 `agent_tools_closed` (ERR-REL-013): `true`, `false`, or `not recorded` (missing or not a boolean). */
export function agentToolsClosed(fm: Data): "true" | "false" | "not recorded" {
  const outcomes = isMapping(fm["outcomes"]) ? fm["outcomes"] : {};
  const v = outcomes["agent_tools_closed"];
  return v === true ? "true" : v === false ? "false" : "not recorded";
}

/** The S-07 enforcement mode the record gives (`native-permissions` or `sdd-mcp-server`), else null. */
export function s07Mode(fm: Data): SpikeMode | null {
  const m = fm["enforcement_mode"];
  return m === "native-permissions" || m === "sdd-mcp-server" ? m : null;
}

// --- the checklist and its records (§4) -----------------------------------------------------------

export const STEP_GROUPS = [1, 2, 3, 4] as const;
export const STEP_MODES = ["both", "sdd-mcp-server", "copilot-hooks"] as const;
export const STEP_KINDS = ["install", "hooks-row", "restore", "hooks-state", "boundary", "roots", "delegated-edit", "guard-denial", "injection", "assumption", "scenario"] as const;

export interface ChecklistStep {
  id: string;
  /** 1 … 4, the group of the run order (§4 Run order), the step index's Group column. */
  group: number;
  /** `both`, `sdd-mcp-server` or `copilot-hooks`, the step index's Mode column. */
  mode: string;
  kind: string;
  /** The Copilot injection case of an injection step (`Injection case INJ-nn`), else null. */
  injectionCase: string | null;
}

const STEP_INDEX_HEADING = "## Step index";
const STEP_INDEX_HEADER = ["Step", "Group", "Mode", "Kind"];

/**
 * The step index of `docs/checklists/vscode-copilot.md` (C002-IF-009 §4 Step index, critic CR-54): the
 * table under the heading `## Step index`, whose header row starts with `Step`, `Group`, `Mode`, `Kind`;
 * every further row of that table is one step. Null for every unreadable condition of §4: no file, no
 * heading, no table or no step row under it, another header, a repeated step ID or one that is not
 * `VSC-<digits>`, a Group, Mode or Kind outside the listed values, an injection step without a case ID
 * or with one that another injection step has, and not exactly one `restore` step. Rows of the other
 * tables of the checklist are never read.
 */
export function readChecklistSteps(file: string): ChecklistStep[] | null {
  if (!existsSync(file)) return null;
  const lines = readFileSync(file, "utf8").replace(/\r\n?/g, "\n").split("\n");
  const heading = lines.findIndex((l) => l.trimEnd() === STEP_INDEX_HEADING);
  if (heading < 0) return null;
  // The first table under the heading, before the next heading.
  let at = heading + 1;
  while (at < lines.length && !lines[at]!.trimStart().startsWith("|")) {
    if (/^#{1,6}\s/.test(lines[at]!)) return null;
    at++;
  }
  const table: string[] = [];
  for (; at < lines.length && lines[at]!.trimStart().startsWith("|"); at++) table.push(lines[at]!);
  if (table.length < 3) return null;
  const header = splitCells(table[0]!);
  if (!STEP_INDEX_HEADER.every((h, i) => header[i] === h)) return null;
  if (!splitCells(table[1]!).every((c) => /^:?-{3,}:?$/.test(c))) return null;
  const steps: ChecklistStep[] = [];
  const ids = new Set<string>();
  const cases = new Set<string>();
  for (const row of table.slice(2)) {
    const c = splitCells(row);
    const [id = "", group = "", mode = "", kind = ""] = c;
    if (!/^VSC-\d+$/.test(id) || ids.has(id)) return null;
    ids.add(id);
    if (!(STEP_GROUPS as readonly number[]).includes(Number(group)) || !/^\d$/.test(group)) return null;
    if (!(STEP_MODES as readonly string[]).includes(mode)) return null;
    if (!(STEP_KINDS as readonly string[]).includes(kind)) return null;
    let injectionCase: string | null = null;
    if (kind === "injection") {
      injectionCase = /\b(INJ-\d+)\b/.exec(c.slice(4).join(" "))?.[1] ?? null;
      if (injectionCase === null || cases.has(injectionCase)) return null;
      cases.add(injectionCase);
    }
    steps.push({ id, group: Number(group), mode, kind, injectionCase });
  }
  if (steps.length === 0) return null;
  if (steps.filter((s) => s.kind === "restore").length !== 1) return null;
  return steps;
}

/** The checklist record of `version` under `<root>/docs/checklists/records/` (`vscode-<YYYY-MM-DD>-<version>.md`), the latest date first; null when none. */
export function findChecklistRecord(recordsDir: string, version: string): string | null {
  if (!existsSync(recordsDir)) return null;
  const suffix = `-${version}.md`;
  const names = readdirSync(recordsDir)
    .filter((n) => n.startsWith("vscode-") && n.endsWith(suffix) && /^\d{4}-\d{2}-\d{2}$/.test(n.slice("vscode-".length, -suffix.length)))
    .sort();
  return names.length === 0 ? null : (names[names.length - 1] ?? null);
}

export interface RecordStep {
  id: string;
  result?: unknown;
  injection_case?: unknown;
  /** The earlier runs as read (§4 Earlier runs); checked by the step check, never by the reader. */
  earlier_results?: unknown;
}

/**
 * The record's `steps` list as `{ id, result, injection_case, earlier_results }` entries, as read; null
 * only when it is not a list of mappings with an `id` (ERR-REL-009 `checklist record`). A malformed
 * `earlier_results` is a line of the step check, not an unreadable record.
 */
export function recordSteps(fm: Data): RecordStep[] | null {
  const steps = fm["steps"];
  if (!Array.isArray(steps)) return null;
  if (!steps.every((s) => isMapping(s) && typeof s["id"] === "string")) return null;
  return steps as RecordStep[];
}

/** Causes of a re-run that the rerun rule gives (§4 Earlier runs); `repeated` is none of them. */
const RERUN_CAUSES = new Set(["hooks-source-changed", "ran-before-hooks-state"]);

/**
 * The step check of C002-IF-009 §5 (critic CR-52, CR-55; Q-checklist-rerun-01): one `<result>` of
 * ERR-REL-004 per listed step ID, in record order, for the first of rules 1 … 6 that applies; then
 * `not recorded` for each step of the package's mode, the injection steps excepted, that the record
 * does not list, in index order. With an unreadable index (`index` null) only rules 1, 3 and 6 apply,
 * and rule 6 excuses no earlier `failed` run.
 */
export function stepCheck(list: readonly RecordStep[], index: readonly ChecklistStep[] | null, mode: string): { id: string; result: string }[] {
  const out: { id: string; result: string }[] = [];
  const byIndex = new Map((index ?? []).map((s) => [s.id, s]));
  const ofMode = (s: ChecklistStep) => s.mode === "both" || s.mode === mode;
  const count = new Map<string, number>();
  for (const s of list) count.set(s.id, (count.get(s.id) ?? 0) + 1);
  const restore = index?.find((s) => s.kind === "restore");
  const restoreEntry = restore ? list.find((s) => s.id === restore.id) : undefined;
  const restoreRuns = restoreEntry && Array.isArray(restoreEntry.earlier_results) ? restoreEntry.earlier_results.length : 0;
  const seen = new Set<string>();
  for (const s of list) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    const line = (result: string) => out.push({ id: s.id, result });
    // 1. listed more than once (one line, at its first listing)
    if ((count.get(s.id) ?? 0) > 1) {
      line("listed more than once");
      continue;
    }
    const step = byIndex.get(s.id);
    // 2. no step of the step index
    if (index !== null && step === undefined) {
      line("not a step of the checklist");
      continue;
    }
    // 3. a result other than passed or not-applicable
    if (s.result !== "passed" && s.result !== "not-applicable") {
      line(s.result === undefined ? "not recorded" : String(s.result));
      continue;
    }
    if (step !== undefined && step.kind !== "injection") {
      // 4. a step of the package's mode recorded not-applicable
      if (ofMode(step) && s.result === "not-applicable") {
        line("not-applicable");
        continue;
      }
      // 5. a step of the other mode recorded passed
      if (!ofMode(step) && s.result === "passed") {
        line(`passed, but its mode is ${step.mode}`);
        continue;
      }
    }
    // 6. an earlier run that refuses (§4 Earlier runs)
    if (s.earlier_results === undefined) continue;
    if (!Array.isArray(s.earlier_results)) {
      line("not recorded in an earlier run");
      continue;
    }
    const reruns = s.earlier_results.filter((r) => isMapping(r) && RERUN_CAUSES.has(r["cause"] as string)).length;
    for (const run of s.earlier_results as unknown[]) {
      if (!isMapping(run)) {
        line("not recorded in an earlier run");
        break;
      }
      if (run["result"] === "passed") continue;
      if (run["result"] === "failed") {
        const cause = run["cause"];
        const byRule =
          step !== undefined &&
          restore !== undefined &&
          ((cause === "hooks-source-changed" && (step.kind === "restore" || step.group === 3 || step.group === 4)) || (cause === "ran-before-hooks-state" && step.group === 4));
        const restored = step !== undefined && restore !== undefined && (step.id === restore.id || (restoreEntry !== undefined && restoreRuns >= reruns));
        if (byRule && restored) continue;
        line("failed in an earlier run not repeated under the rerun rule");
        break;
      }
      line(`${run["result"] === undefined ? "not recorded" : String(run["result"])} in an earlier run`);
      break;
    }
  }
  for (const step of index ?? []) {
    if (step.kind === "injection" || !ofMode(step) || seen.has(step.id)) continue;
    out.push({ id: step.id, result: "not recorded" });
  }
  return out;
}

/** Keys of `hooks_sources` in the order of C002-IF-009 §4 and §5, with their values and the value under which hooks stay on. */
export const HOOKS_SOURCES: readonly { key: "use_hooks" | "workspace_trust" | "policy"; values: readonly [string, string] }[] = [
  { key: "use_hooks", values: ["on", "off"] },
  { key: "workspace_trust", values: ["trusted", "untrusted"] },
  { key: "policy", values: ["none", "disables"] },
];

export interface HooksState {
  /** The stored `hooks_state` when it is `enabled` or `disabled`, else null (never the derived value). */
  stored: "enabled" | "disabled" | null;
  /** The `<problem>` of ERR-REL-010 for the first step of the hooks-state check that applies, else null. */
  problem: string | null;
}

/**
 * Hooks-state check of C002-IF-009 §5 (Q-release-hooks-01), in either Copilot enforcement mode:
 * (1) `hooks_state` not recorded; (2) `hooks_sources` not recorded in full; (3) `hooks_state`
 * contradicting the value derived from `hooks_sources` (§4), either way; (4) `hooks_state` `disabled`.
 */
export function hooksState(fm: Data): HooksState {
  const state = fm["hooks_state"];
  const stored = state === "enabled" || state === "disabled" ? state : null;
  if (stored === null) return { stored, problem: "shows hooks not recorded" };
  const sources = fm["hooks_sources"];
  const missing = HOOKS_SOURCES.filter((s) => !isMapping(sources) || !s.values.includes(sources[s.key] as string)).map((s) => s.key);
  if (missing.length > 0) return { stored, problem: `does not record hooks_sources ${missing.join(", ")}` };
  const src = sources as Data;
  const derived = HOOKS_SOURCES.every((s) => src[s.key] === s.values[0]) ? "enabled" : "disabled";
  if (derived !== stored)
    return {
      stored,
      problem: `gives hooks_state ${stored}, but its hooks_sources (use_hooks ${String(src["use_hooks"])}, workspace_trust ${String(src["workspace_trust"])}, policy ${String(src["policy"])}) give ${derived}`,
    };
  if (stored === "disabled") return { stored, problem: "shows hooks disabled" };
  return { stored, problem: null };
}

// --- injection eval summary (§1, `$defs/injectionSummary`) -------------------------------------------

export interface InjectionSummary {
  source: "opencode-runner" | "copilot-cli-runner" | "manual-checklist";
  host_versions: Record<string, string>;
  cases: { id: string; acted_upon: boolean }[];
}

/** The summary at `file` when it has the shape of `$defs/injectionSummary` that the check reads, else null. */
export function readInjectionSummary(file: string): InjectionSummary | null {
  if (!existsSync(file)) return null;
  try {
    const s = JSON.parse(readFileSync(file, "utf8")) as Data;
    const source = s["source"];
    if (source !== "opencode-runner" && source !== "copilot-cli-runner" && source !== "manual-checklist") return null;
    const cases = s["cases"];
    if (!Array.isArray(cases) || !cases.every((c) => isMapping(c) && typeof c["id"] === "string" && typeof c["acted_upon"] === "boolean")) return null;
    return { source, host_versions: hostVersions(s["host_versions"]), cases: cases as InjectionSummary["cases"] };
  } catch {
    return null;
  }
}
