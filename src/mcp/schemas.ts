// Tool schemas of the sdd MCP server (C002-IF-002 §4, C002-ADR-002). The served schemas are the
// self-contained copies written by scripts/mcp-schemas.mjs from src/mcp/tools.schema.json; Ajv in
// the 2020-12 dialect compiles the three input schemas once at start. A compile failure is the fatal
// start error of C002-IF-002 §1 (exit 3), raised as StartError by loadToolSchemas.
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import served from "./served-schemas.json";

export type Profile = "files" | "shell";
export type ToolName = "write_file" | "replace_text" | "run_command";

/** The tools of each profile (C002-IF-002 §2, C002-REQ-415), in `tools/list` order. */
export const PROFILE_TOOLS: Readonly<Record<Profile, readonly ToolName[]>> = {
  files: ["write_file", "replace_text"],
  shell: ["run_command"],
};

export interface ServedTool {
  name: ToolName;
  description: string;
  inputSchema: { type: "object"; [k: string]: unknown };
  outputSchema: { type: "object"; [k: string]: unknown };
}

export interface ToolSchemas {
  /** The tools of the profile with their served schemas, for `tools/list`. */
  tools: ServedTool[];
  /** Validates arguments against the tool's input schema: [] when valid, else `<instancePath> <message>` details. */
  validateInput(tool: ToolName, args: unknown): string[];
}

/** A failure before any tool is served: the process exits 3 (C002-IF-002 §1). */
export class StartError extends Error {}

function detail(e: ErrorObject): string {
  const where = e.instancePath === "" ? "(arguments)" : e.instancePath;
  const extra = e.keyword === "additionalProperties" ? ` (${String((e.params as { additionalProperty?: string }).additionalProperty)})` : "";
  return `${where} ${e.message ?? e.keyword}${extra}`;
}

/** Test fault (C002-IF-002 §1 exit 3): `SDD_TEST_FAULT=mcp-schema-compile` makes the compile fail. */
function compileFault(): boolean {
  return /(?:^|,)mcp-schema-compile(?:,|$)/.test(process.env["SDD_TEST_FAULT"] ?? "");
}

/** Compiles the input schemas of the profile's tools once; throws StartError on failure. */
export function loadToolSchemas(profile: Profile): ToolSchemas {
  const all = served as unknown as Record<ToolName, Omit<ServedTool, "name">>;
  const validators = new Map<ToolName, ValidateFunction>();
  const tools: ServedTool[] = [];
  try {
    if (compileFault()) throw new Error("SDD_TEST_FAULT: schema compile failure");
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    for (const name of PROFILE_TOOLS[profile]) {
      const t = all[name];
      if (t === undefined) throw new Error(`no served schema for ${name}`);
      validators.set(name, ajv.compile(t.inputSchema));
      tools.push({ name, ...t });
    }
  } catch (e) {
    throw new StartError(`tool schemas cannot be compiled: ${e instanceof Error ? e.message : String(e)}`);
  }
  return {
    tools,
    validateInput(tool, args) {
      const v = validators.get(tool);
      if (v === undefined) return [`${tool} is not a tool of the ${profile} profile`];
      return v(args) ? [] : (v.errors ?? []).map(detail);
    },
  };
}
