// Tool handlers of the sdd MCP server (C002-IF-002 §5). C002-T-016 binds the protocol only: every
// handler is a stub that fails closed with ERR-MCP-002 and changes nothing. C002-T-017 replaces the
// write tools (src/mcp/tools/files.ts) and C002-T-019 the command tool (src/mcp/tools/shell.ts).
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolName, ToolSchemas } from "./schemas.ts";

export interface ToolContext {
  /** The repository root of the session (C002-IF-002 §3), fixed at initialisation. */
  root: string;
  schemas: ToolSchemas;
  /** An SDD_DEBUG line on standard error (no-op otherwise). */
  debug(event: string, data?: Record<string, string | number | boolean | null | undefined>): void;
}

export type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<CallToolResult>;

/** A CallToolResult carrying `$defs/errorResult` (C002-IF-002 §4, §6). */
export function errorResult(tool: ToolName, status: "refused" | "failed", code: string, message: string, extra: Record<string, unknown> = {}): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: { status, tool, code, message, ...extra },
    isError: true,
  };
}

function notImplemented(tool: ToolName): ToolHandler {
  return async () => errorResult(tool, "failed", "ERR-MCP-002", `internal fault in ${tool}: the tool is not implemented in this build; the call was refused`);
}

export const HANDLERS: Record<ToolName, ToolHandler> = {
  write_file: notImplemented("write_file"),
  replace_text: notImplemented("replace_text"),
  run_command: notImplemented("run_command"),
};
