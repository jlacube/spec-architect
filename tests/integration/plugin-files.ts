// Readers for the plugin's own files (C001-T-060): agent frontmatter tool lists and `.mcp.json`.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../src/model/frontmatter.ts";
import { repoRoot } from "../helpers.ts";

export const PLUGIN = join(repoRoot(), "plugins", "architect");

/** Splits a comma list, keeping `Agent(a, b)` together. */
export function splitTools(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Agent name (`sdd-…`) → its `tools` entries. */
export function agentTools(): Map<string, string[]> {
  const dir = join(PLUGIN, "agents");
  const out = new Map<string, string[]>();
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
    const fm = splitFrontmatter(readFileSync(join(dir, f), "utf8")).data ?? {};
    out.set(String(fm["name"]), splitTools(String(fm["tools"] ?? "")));
  }
  return out;
}

export interface McpServer {
  type?: string;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

export function mcpConfig(): Record<string, McpServer> {
  return (JSON.parse(readFileSync(join(PLUGIN, ".mcp.json"), "utf8")) as { mcpServers: Record<string, McpServer> }).mcpServers;
}

export const SPECIALISTS = ["researcher", "cartographer", "options-analyst", "spec-writer", "test-designer", "architect", "planner", "critic", "auditor"].map((n) => `sdd-${n}`);
export const SERENA_TOOLS = ["find_symbol", "get_symbols_overview", "find_referencing_symbols", "find_declaration", "find_implementations"].map((t) => `mcp__plugin_architect_serena__${t}`);
