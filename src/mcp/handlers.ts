// Tool handlers of the sdd MCP server (C002-IF-002 §5). The write tools are in src/mcp/tools/files.ts
// (C002-T-017), the command tool in src/mcp/tools/shell.ts (C002-T-019).
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { errorResult } from "./results.ts";
import type { ToolName, ToolSchemas } from "./schemas.ts";
import { replaceText, writeFile } from "./tools/files.ts";
import { runCommand } from "./tools/shell.ts";

export { errorResult };

export interface ToolContext {
  /** The repository root of the session (C002-IF-002 §3), fixed at initialisation. */
  root: string;
  schemas: ToolSchemas;
  /** An SDD_DEBUG line on standard error (no-op otherwise). */
  debug(event: string, data?: Record<string, string | number | boolean | null | undefined>): void;
}

export type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<CallToolResult>;

export const HANDLERS: Record<ToolName, ToolHandler> = {
  write_file: writeFile,
  replace_text: replaceText,
  run_command: runCommand,
};
