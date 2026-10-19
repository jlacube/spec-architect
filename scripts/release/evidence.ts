// Evidence readers of the release check (C002-IF-009 §3, §4, §5): spike records and checklist records
// by their frontmatter only, as the frontmatter parser returns it (YAML 1.2 core schema,
// src/model/frontmatter.ts), the manual VS Code checklist's step index, and the injection eval summary.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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

export interface ChecklistStep {
  id: string;
  /** `both`, `sdd-mcp-server` or `copilot-hooks`, the step index's Mode column. */
  mode: string;
  kind: string;
  /** The Copilot injection case of an injection step (`Injection case INJ-nn`), else null. */
  injectionCase: string | null;
}

/** The step index of `docs/checklists/vscode-copilot.md`: its `| VSC-nn | group | mode | kind | … |` rows; null when unreadable. */
export function readChecklistSteps(file: string): ChecklistStep[] | null {
  if (!existsSync(file)) return null;
  const rows = readFileSync(file, "utf8").replace(/\r\n?/g, "\n").split("\n").filter((l) => /^\| VSC-\d+ \|/.test(l));
  if (rows.length === 0) return null;
  return rows.map((l) => {
    const c = l.split("|").slice(1, -1).map((x) => x.trim());
    const id = c[0] ?? "";
    const kind = c[3] ?? "";
    const inj = kind === "injection" ? (/\b(INJ-\d+)\b/.exec(c.slice(4).join(" "))?.[1] ?? null) : null;
    return { id, mode: c[2] ?? "", kind, injectionCase: inj };
  });
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
  result: unknown;
  injection_case?: unknown;
}

/** The record's `steps` list as `{ id, result, injection_case }` entries; null when it is not a list of mappings with an id. */
export function recordSteps(fm: Data): RecordStep[] | null {
  const steps = fm["steps"];
  if (!Array.isArray(steps)) return null;
  if (!steps.every((s) => isMapping(s) && typeof s["id"] === "string")) return null;
  return steps as RecordStep[];
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
