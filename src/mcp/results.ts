// Error results of the sdd MCP server tools (C002-IF-002 §4, §6.1), shared by handlers.ts and the tool
// modules under tools/ without an import cycle.
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * A text-only error result (C002-IF-002 §6.1, revised for defect D-017): `isError: true`, one text
 * item and no `structuredContent`. For an `ERR-MCP-*` code the text is the print form
 * `<code>: <message>`; for a `GUARD-*` code it is the guard core's deny message as the core returns
 * it, which already starts with its code.
 */
export function errorResult(code: string, message: string): CallToolResult {
  const text = code.startsWith("GUARD-") ? message : `${code}: ${message}`;
  return { content: [{ type: "text", text }], isError: true };
}

/** The code of an error result: the characters of its text before the first `: ` (C002-IF-002 §6.1). */
export function errorCode(result: CallToolResult): string | undefined {
  if (result.isError !== true) return undefined;
  const first = result.content?.[0];
  if (!first || first.type !== "text") return undefined;
  const at = first.text.indexOf(": ");
  return at > 0 ? first.text.slice(0, at) : undefined;
}
