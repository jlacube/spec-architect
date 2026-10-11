// Shared setup of the doctor scenarios (C001-T-044): /architect:doctor in the conductor on a machine
// configuration, with a workspace (constitution approved) so toolchain.md can be written.
import { join } from "node:path";
import { homedir } from "node:os";
import { constitution } from "../cap02/drafting.mjs";
import { machine } from "../harness/machines.mjs";
import { git, sdd } from "../harness/workspaces.mjs";
import { finalReply } from "../harness/assert.mjs";

export const TOOLS = ["node", "git", "Claude Code", "ripwire", "Serena", "ast-grep", "Context7", "DeepWiki"];
export const SERENA = ["find_symbol", "get_symbols_overview", "find_referencing_symbols", "find_declaration", "find_implementations"].map((t) => `mcp__plugin_architect_serena__${t}`);
export const MCP = ["mcp__plugin_architect_context7__resolve-library-id", "mcp__plugin_architect_context7__query-docs", "mcp__plugin_architect_deepwiki__read_wiki_structure", "mcp__plugin_architect_deepwiki__read_wiki_contents", "mcp__plugin_architect_deepwiki__ask_wiki_question"];

/** The plugin data folder Claude Code gives the eval plugin (`--plugin-dir` style local plugin). */
export const PLUGIN_DATA = join(homedir(), ".claude", "plugins", "data", "architect-inline");

export function workspace(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  sdd(root, "status", "--write");
}

/** Scenario fields of a doctor run on configuration `cfg` (plugins may be overridden). */
export function doctorRun(cfg, extra = {}) {
  const m = machine(cfg);
  return {
    agent: "architect:sdd-conductor",
    plugins: m.plugins,
    env: m.env,
    fixture: workspace,
    allowTools: ["Agent", "Write", "Edit", "Bash", "ToolSearch", "LSP", ...SERENA, ...MCP],
    maxTurns: 30,
    startDelayMs: 15000,
    prompt: "/architect:doctor",
    ...extra,
  };
}

/** Doctor table rows of the reply: `{ tool, status, version, fallback, fix }`. */
export function doctorRows(transcript) {
  const text = finalReply(transcript);
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/^\s*\|/.test(line)) continue;
    const c = line.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
    const tool = TOOLS.find((t) => c[0]?.replace(/[`*]/g, "").toLowerCase() === t.toLowerCase());
    if (tool) rows.push({ tool, status: (c[1] ?? "").replace(/[`*]/g, "").toLowerCase(), version: c[2] ?? "", fallback: c[3] ?? "", fix: c.slice(4).join(" | ") });
  }
  return rows;
}

/** The outcome line of the reply. */
export const outcome = (transcript) => /Doctor:\s*(completed with warnings|completed|failed: node ≥ 20 required)/.exec(finalReply(transcript))?.[1] ?? null;
