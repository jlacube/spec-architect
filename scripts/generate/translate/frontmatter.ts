// Frontmatter translator (C002-COMP-001; C002-IF-001 §3 step 4): each source agent's frontmatter through
// the target's mapping table. The model is the host model of the source tier (C002-REQ-105), `memory` is
// dropped (C002-REQ-106), only the conductor may start agents, and only the nine specialists
// (C002-REQ-107), the tools are exactly those the table derives from the source `tools` field
// (C002-REQ-108), and under sdd MCP server enforcement Write/Edit and Bash become the `sdd-files` and
// `sdd-shell` server profiles (C002-REQ-117; under the Copilot hooks fallback the conductor keeps them,
// C002-REQ-321). `effort` and `color` follow `agent_fields`. A field, tool or value without a table entry
// is a diagnostic (ERR-GEN-001), never a silent drop; a model outside the three tiers is ERR-GEN-003.
// The result is the host-neutral shape the emitters (C002-T-029, C002-T-031) write; descriptions are
// left as in the source for the body-construct pass (C002-T-027).
import { diagnostic, type Diagnostic } from "../diagnostics.ts";
import type { EmitInput, SourceDoc } from "../model.ts";
import { toolGrants, type MappingTable, type Mode, type Target } from "../tables.ts";

/** The primary agent: the only one that may start other agents (C002-IF-005 §1). */
export const CONDUCTOR = "sdd-conductor";
export const TIERS = ["opus", "sonnet", "haiku"] as const;
export type Tier = (typeof TIERS)[number];

/** Frontmatter fields with a fixed treatment; any other field needs a table entry (none exists: ERR-GEN-001). */
const STRUCTURAL = new Set(["name", "description", "model", "tools", "skills", "memory", "effort", "color"]);

/** The host form of the right to start agents (C002-IF-001 §2, `agent_start`). */
export type AgentStart =
  /** OpenCode `permission.task`: the conductor's map (`"*": "deny"`, the nine specialists `allow`), `"deny"` for a specialist. */
  | { style: "permission-task"; task: Record<string, "allow" | "deny"> | "deny" }
  /** Copilot `agents` list: the nine specialists by bare name for the conductor, `[]` for a specialist. */
  | { style: "agents-list"; agents: string[] };

export interface AgentFrontmatter {
  name: string;
  /** Source description, references not yet translated (C002-T-027). */
  description: string;
  role: "primary" | "subagent";
  tier: Tier;
  /** Host model id of the tier (`models.<tier>`). */
  model: string;
  /** Host tool grants in source order, without duplicates (agent-start tools included). */
  tools: string[];
  agentStart: AgentStart;
  /** True when the source `tools` holds AskUserQuestion: the only agent with a question tool (C002-REQ-108). */
  asks: boolean;
  /** Further host frontmatter: mapped `effort`/`color` fields and `primary_flags` or `subagent_flags`. */
  fields: Record<string, unknown>;
  /** Source `skills`, in order, for inlining (C002-REQ-109, C002-T-028). */
  skills: string[];
}

export interface TranslatedAgent {
  /** Source path (`agents/<name>.md`). */
  path: string;
  frontmatter: AgentFrontmatter;
}

export interface FrontmatterResult {
  agents: TranslatedAgent[];
  diagnostics: Diagnostic[];
}

/** Splits a `tools` field: a comma list (commas inside `Agent(…)` kept) or a YAML list. */
export function splitToolsField(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter((v) => v !== "");
  if (typeof value !== "string") return [];
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out.filter((v) => v !== "");
}

/** Splits a plain list field (`skills`): a comma list or a YAML list. */
export const listField = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => String(v).trim()).filter((v) => v !== "") : typeof value === "string" ? value.split(",").map((v) => v.trim()).filter((v) => v !== "") : [];

/** 1-based line of a frontmatter key, or of the first line from it that contains `needle`. */
export function fieldLine(doc: SourceDoc, key: string, needle?: string): number | undefined {
  const last = doc.bodyStartLine - 3; // 0-based index of the last frontmatter line
  const keyRe = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`);
  for (let i = 1; i <= last; i++) {
    if (!keyRe.test(doc.lines[i] ?? "")) continue;
    if (needle === undefined) return i + 1;
    for (let j = i; j <= last; j++) {
      if (j > i && /^\S/.test(doc.lines[j] ?? "")) break; // next top-level key
      if ((doc.lines[j] ?? "").includes(needle)) return j + 1;
    }
    return i + 1;
  }
  return undefined;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Matcher of `mcp_tool_names.source_pattern` (`mcp__plugin_architect_{server}__{tool}`). */
export function mcpMatcher(table: MappingTable): RegExp {
  const parts = table.mcp_tool_names.source_pattern.split(/(\{server\}|\{tool\})/);
  const re = parts.map((p) => (p === "{server}" ? "(?<server>[A-Za-z0-9-]+)" : p === "{tool}" ? "(?<tool>[A-Za-z0-9_-]+)" : escapeRe(p))).join("");
  return new RegExp(`^${re}$`);
}

/** Grant form of one MCP tool: per tool (`grant_pattern` or `target_pattern`) or per server (`{tool}` → `*`). */
export function mcpGrant(table: MappingTable, server: string, tool: string): string {
  const m = table.mcp_tool_names;
  const pattern = m.grant_pattern ?? m.target_pattern;
  return pattern.replaceAll("{server}", server).replaceAll("{tool}", m.grant === "per-server" ? "*" : tool);
}

/** The agent's name as the table's `references.agent` rule writes it (`architect:sdd-critic` → `sdd-critic`). */
function bareAgent(table: MappingTable, ref: string): string {
  const { from, to } = table.references.agent;
  return ref.startsWith(from) ? to + ref.slice(from.length) : ref;
}

interface Ctx {
  table: MappingTable;
  target: Target;
  mode: Mode;
  /** Names of every source agent (the conductor's start list may name only these). */
  agentNames: readonly string[];
}

/** Translates one agent's frontmatter; the agent is left out when its frontmatter has an error. */
export function translateAgent(doc: SourceDoc, ctx: Ctx): { agent?: TranslatedAgent; diagnostics: Diagnostic[] } {
  const { table, target, mode } = ctx;
  const diagnostics: Diagnostic[] = [];
  const file = doc.path;
  const unmapped = (kind: string, construct: string, line: number | undefined, why = `has no entry in the ${target} mapping table`) =>
    diagnostics.push(diagnostic("ERR-GEN-001", `${file}:${line ?? 1}: ${kind} "${construct}" ${why}`, { file, line: line ?? 1, target, construct }));
  const data = doc.data ?? {};
  const isConductor = doc.name === CONDUCTOR;

  // Fields without a table entry (step outline 1).
  for (const key of Object.keys(data)) if (!STRUCTURAL.has(key)) unmapped("frontmatter field", key, fieldLine(doc, key));

  // Model tier (C002-REQ-105); ERR-GEN-003 names every target once the run merges them (mergeTierDiagnostics).
  const rawModel = data["model"];
  const tier = TIERS.find((t) => t === rawModel);
  if (tier === undefined) {
    const line = fieldLine(doc, "model") ?? 1;
    diagnostics.push(
      diagnostic("ERR-GEN-003", `${file}:${line}: model "${String(rawModel ?? "")}" is not a Claude model tier (opus, sonnet, haiku); targets: ${target}`, { file, line, target, construct: String(rawModel ?? "") }),
    );
  }

  // effort and color (C002-IF-001 §2): drop, or a field with a value map.
  const fields: Record<string, unknown> = {};
  for (const key of ["effort", "color"] as const) {
    if (!(key in data)) continue;
    const rule = table.agent_fields[key] as "drop" | { field: string; values: Record<string, string | number | boolean> };
    if (rule === "drop") continue;
    const value = String(data[key]);
    const mapped = rule.values[value];
    if (mapped === undefined) unmapped(`${key} value`, value, fieldLine(doc, key));
    else fields[rule.field] = mapped;
  }
  Object.assign(fields, (isConductor ? table.agent_fields.primary_flags : table.agent_fields.subagent_flags) ?? {});

  // Tools (C002-REQ-108, C002-REQ-117).
  const tools: string[] = [];
  const add = (g: readonly string[]) => {
    for (const x of g) if (!tools.includes(x)) tools.push(x);
  };
  const mcp = mcpMatcher(table);
  let starts: string[] | null = null;
  let asks = false;
  for (const name of splitToolsField(data["tools"])) {
    const line = fieldLine(doc, "tools", name);
    const agentGrant = /^Agent\((.*)\)$/s.exec(name);
    if (agentGrant) {
      if (!isConductor) {
        unmapped("agent-start grant", name, line, `is allowed to ${CONDUCTOR} only (C002-REQ-107)`);
        continue;
      }
      starts = listField(agentGrant[1]).map((r) => bareAgent(table, r));
      for (const s of starts) if (s === CONDUCTOR || !ctx.agentNames.includes(s)) unmapped("agent-start grant", s, line, "names no specialist of the source plugin");
      add(table.agent_start.tools ?? []);
      continue;
    }
    const m = mcp.exec(name);
    if (m?.groups) {
      const server = table.mcp_servers[m.groups["server"]!];
      if (!server || !server.modes.includes(mode)) unmapped("MCP tool name", name, line, `names a server that the ${target} mapping table does not declare in mode ${mode}`);
      else add([mcpGrant(table, m.groups["server"]!, m.groups["tool"]!)]);
      continue;
    }
    const entry = table.tools[name];
    if (entry === undefined) {
      unmapped("tool name", name, line);
      continue;
    }
    // Copilot hooks fallback: the conductor writes and runs commands through the server profiles (C002-REQ-321).
    const useMode: Mode = mode === "copilot-hooks" && isConductor && (name === "Write" || name === "Edit" || name === "Bash") ? "sdd-mcp-server" : mode;
    const grants = toolGrants(entry, useMode);
    if (grants === undefined) {
      unmapped("tool name", name, line, `has no entry for mode ${useMode} in the ${target} mapping table`);
      continue;
    }
    if (name === "AskUserQuestion") asks = true;
    add(grants);
  }
  if (isConductor && starts === null) unmapped("agent-start grant", "Agent(...)", fieldLine(doc, "tools"), "is missing from the conductor (C002-REQ-107)");

  const specialists = starts ?? [];
  const agentStart: AgentStart =
    table.agent_start.style === "permission-task"
      ? { style: "permission-task", task: isConductor ? { "*": "deny", ...Object.fromEntries(specialists.map((s) => [s, "allow" as const])) } : "deny" }
      : { style: "agents-list", agents: isConductor ? [...specialists] : [] };

  if (diagnostics.length > 0 || tier === undefined) return { diagnostics };
  return {
    agent: {
      path: file,
      frontmatter: {
        name: doc.name,
        description: typeof data["description"] === "string" ? data["description"] : "",
        role: isConductor ? "primary" : "subagent",
        tier,
        model: table.models[tier],
        tools,
        agentStart,
        asks,
        fields,
        skills: listField(data["skills"]),
      },
    },
    diagnostics,
  };
}

/** Translates the frontmatter of every source agent for one target (C002-IF-001 §3 step 4). */
export function translateAgents(input: Pick<EmitInput, "source" | "table" | "target" | "mode">): FrontmatterResult {
  const agentNames = input.source.agents.map((a) => a.name);
  const agents: TranslatedAgent[] = [];
  const diagnostics: Diagnostic[] = [];
  for (const doc of input.source.agents) {
    const r = translateAgent(doc, { table: input.table, target: input.target, mode: input.mode, agentNames });
    diagnostics.push(...r.diagnostics);
    if (r.agent) agents.push(r.agent);
  }
  return { agents, diagnostics };
}

/**
 * ERR-GEN-003 is about the source, not a target: the per-target diagnostics of one file and line are
 * merged into one message naming every target (`targets: copilot, opencode`, C002-TS-110).
 */
export function mergeTierDiagnostics(list: readonly Diagnostic[]): Diagnostic[] {
  const out: Diagnostic[] = [];
  const merged = new Map<string, { d: Diagnostic; targets: Set<string> }>();
  for (const d of list) {
    if (d.code !== "ERR-GEN-003") {
      out.push(d);
      continue;
    }
    const key = `${d.file}\0${d.line}\0${d.construct}`;
    const seen = merged.get(key);
    if (seen) {
      if (d.target) seen.targets.add(d.target);
      continue;
    }
    const entry = { d, targets: new Set<string>(d.target ? [d.target] : []) };
    merged.set(key, entry);
    out.push(d);
  }
  return out.map((d) => {
    if (d.code !== "ERR-GEN-003") return d;
    const e = merged.get(`${d.file}\0${d.line}\0${d.construct}`)!;
    const targets = [...e.targets].sort();
    const { target: _target, ...rest } = d;
    return { ...rest, message: d.message.replace(/; targets: .*$/, `; targets: ${targets.join(", ")}`) };
  });
}

/** One TGT-TOOLS-001 finding: a tool granted beyond, or missing from, the table's derivation. */
export interface GrantFinding {
  code: "TGT-TOOLS-001";
  file: string;
  agent: string;
  tool: string;
  kind: "granted" | "missing";
  message: string;
}

/**
 * The grant comparison of TGT-TOOLS-001 (C002-IF-005 §6; C002-TS-130): the tools a generated agent file
 * grants against the tools this translator derives. The target structure check (C002-T-035) runs it on
 * the files it reads; `file` is the package-relative agent file.
 */
export function grantFindings(expected: AgentFrontmatter, granted: readonly string[], file: string): GrantFinding[] {
  const out: GrantFinding[] = [];
  for (const tool of granted)
    if (!expected.tools.includes(tool))
      out.push({ code: "TGT-TOOLS-001", file, agent: expected.name, tool, kind: "granted", message: `${file}: ${expected.name} is granted "${tool}", which its source tools field does not derive` });
  for (const tool of expected.tools)
    if (!granted.includes(tool))
      out.push({ code: "TGT-TOOLS-001", file, agent: expected.name, tool, kind: "missing", message: `${file}: ${expected.name} lacks "${tool}", which its source tools field derives` });
  return out;
}

/** Package-relative path of an agent file (`placement.agents_dir` / `placement.agent_file`). */
export function agentFilePath(table: MappingTable, name: string): string {
  const dir = table.placement["agents_dir"] ?? "";
  const fileName = (table.placement["agent_file"] ?? "{name}.md").replaceAll("{name}", name);
  return dir === "" ? fileName : `${dir}/${fileName}`;
}
