// Error results of the sdd MCP server tools (C002-IF-002 §4, §6), shared by handlers.ts and the tool
// modules under tools/ without an import cycle.
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolName } from "./schemas.ts";

/** A CallToolResult carrying `$defs/errorResult` (C002-IF-002 §4, §6). */
export function errorResult(tool: ToolName, status: "refused" | "failed", code: string, message: string, extra: Record<string, unknown> = {}): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: { status, tool, code, message, ...extra },
    isError: true,
  };
}
