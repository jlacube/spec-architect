// Target mapping tables (C002-IF-001, C002-COMP-002): load plugins/architect/targets/<target>.json and
// validate it against the in-repository schema copy (C002-ADR-002) with Ajv in the 2020-12 dialect.
// Shared by the generator, the target structure checks and the release check. A table that does not
// validate is ERR-GEN-004, one message per schema error: `<table>: <JSON pointer>: <schema message>`.
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import schema from "../../plugins/architect/targets/mapping-table.schema.json";

export type Target = "opencode" | "copilot";
export type Mode = "native-permissions" | "sdd-mcp-server" | "copilot-hooks";
export type Context = "frontmatter" | "body" | "hook-command" | "mcp-config";

export const TARGETS: readonly Target[] = ["opencode", "copilot"];

export type ToolEntry = string[] | { by_mode: Partial<Record<Mode, string[]>> };
export type Action = { replace: string | { by_mode: Partial<Record<Mode, string>> } } | { drop_line: true } | { variant_required: true };

export interface Construct {
  id: string;
  kind: string;
  detect: string;
  contexts: Context[];
  accepted_in?: Context[];
  action: Action;
}

export interface McpServer {
  transport: "stdio" | "http";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  modes: Mode[];
}

export interface VariableRule {
  body: string | null;
  "hook-command": string | null;
  "mcp-config": string | null;
}

/** A validated mapping table; the schema (mapping-table.schema.json) is the full contract. */
export interface MappingTable {
  schema_version: 1;
  target: Target;
  enforcement_mode: Mode;
  host: { name: string; tested_versions: Record<string, string>; validated_by: string };
  placement: Record<string, string | null>;
  models: { opus: string; sonnet: string; haiku: string };
  agent_fields: { effort: unknown; color: unknown; memory: "drop"; skills: "inline"; subagent_flags?: Record<string, unknown>; primary_flags?: Record<string, unknown> };
  tools: Record<string, ToolEntry>;
  agent_start: { style: "permission-task" | "agents-list"; tools?: string[] };
  mcp_tool_names: { source_pattern: string; target_pattern: string; grant_pattern?: string; grant: "per-tool" | "per-server"; deferred?: boolean };
  mcp_servers: Record<string, McpServer>;
  variables: Record<"${CLAUDE_PLUGIN_ROOT}" | "${CLAUDE_PLUGIN_DATA}" | "$ARGUMENTS", VariableRule>;
  references: { agent: { from: string; to: string }; command: { from: string; to: string } };
  constructs: Construct[];
  variants: { id: string; file: string; anchor: { section: string } | { lines: string[] }; text_file: string }[];
  permissions?: Record<"native-permissions" | "sdd-mcp-server", Record<string, unknown>>;
  hook_tool_classes?: {
    write: { tool: string; paths: string[]; always_deny?: boolean }[];
    terminal: { tool: string; command: string; dialect?: "bash" | "powershell" | "strictest" }[];
    read_only: string[];
  };
  post_write_feedback?: boolean;
}

/** ERR-GEN-004: the table cannot be read or does not validate; `messages` holds one line per error. */
export class TableError extends Error {
  readonly code = "ERR-GEN-004";
  constructor(readonly messages: string[]) {
    super(messages.join("\n"));
  }
}

let validator: ValidateFunction | undefined;

function compiled(): ValidateFunction {
  if (validator === undefined) {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    // Registered so that every schema of the release check and the generator shares one Ajv setup.
    ajv.addFormat("date", /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/);
    validator = ajv.compile(schema);
  }
  return validator;
}

function detail(e: ErrorObject): string {
  const params = e.params as { additionalProperty?: string; allowedValues?: unknown[] };
  const extra =
    e.keyword === "additionalProperties" && params.additionalProperty !== undefined
      ? ` (${params.additionalProperty})`
      : e.keyword === "enum" && params.allowedValues !== undefined
        ? ` (${params.allowedValues.map((v) => JSON.stringify(v)).join(", ")})`
        : "";
  return `${e.message ?? e.keyword}${extra}`;
}

/** Validates parsed table data; [] when valid, else ERR-GEN-004 lines `<label>: <pointer>: <message>`. */
export function validateTable(data: unknown, label: string): string[] {
  const v = compiled();
  if (v(data)) return [];
  const lines = (v.errors ?? []).map((e) => `${label}: ${e.instancePath === "" ? "/" : e.instancePath}: ${detail(e)}`);
  return [...new Set(lines)];
}

/** The table's display name: its path relative to the working folder, `/`-separated. */
function labelOf(path: string): string {
  const r = relative(process.cwd(), path);
  return (r === "" || r.startsWith("..") || isAbsolute(r) ? path : r).split(sep).join("/");
}

/** Reads and validates one table; throws TableError (ERR-GEN-004). */
export function loadTable(path: string, label = labelOf(path)): MappingTable {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new TableError([`${label}: /: ${e instanceof Error ? e.message : String(e)}`]);
  }
  const errors = validateTable(data, label);
  if (errors.length > 0) throw new TableError(errors);
  return data as MappingTable;
}

/** `plugins/architect/targets/` of a repository. */
export function targetsDir(repo: string): string {
  return join(repo, "plugins", "architect", "targets");
}

/** Loads the table of one target from `<repo>/plugins/architect/targets/<target>.json`. */
export function loadTargetTable(repo: string, target: Target): MappingTable {
  return loadTable(join(targetsDir(repo), `${target}.json`));
}

/** The grants of a tool entry under a mode (by_mode entries resolved); undefined when not covered. */
export function toolGrants(entry: ToolEntry, mode: Mode): string[] | undefined {
  return Array.isArray(entry) ? entry : entry.by_mode[mode];
}
