// TGT-SERENA-001: the `serena` entry of the MCP configuration runs `sdd` with `serena-launch`,
// `--user-data`, `--read-only`, `--`, `start-mcp-server`, in that order, followed by the table's Serena
// arguments, and holds no `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` or `SERENA_HOME` (C002-REQ-114,
// C002-TS-124, C002-TS-126). The finding names the configuration file, `serena` and each missing,
// misplaced or extra argument. A configuration without a `serena` entry is TGT-MCP-001's.
import { configPath, finding, json } from "./lib.mjs";

export const LEADING = ["serena-launch", "--user-data", "--read-only", "--", "start-mcp-server"];
const FORBIDDEN = ["${CLAUDE_PLUGIN_ROOT}", "${CLAUDE_PLUGIN_DATA}", "SERENA_HOME"];

/** Command and arguments of the entry: OpenCode `command` array, Copilot `command` and `args`. */
function commandOf(target, entry) {
  if (target === "opencode") {
    const c = Array.isArray(entry.command) ? entry.command.map(String) : [];
    return { command: c[0], args: c.slice(1) };
  }
  return { command: typeof entry.command === "string" ? entry.command : undefined, args: Array.isArray(entry.args) ? entry.args.map(String) : [] };
}

export default {
  code: "TGT-SERENA-001",
  check(ctx) {
    const table = ctx.table.mcp_servers.serena;
    if (table === undefined || !table.modes.includes(ctx.mode)) return [];
    const config = configPath(ctx);
    const j = json(ctx, config);
    if (j === undefined || j.error) return [];
    const entry = (ctx.target === "opencode" ? j.value?.mcp : j.value?.servers)?.serena;
    if (entry === null || typeof entry !== "object") return [];
    const out = [];
    const say = (m) => out.push(finding(this.code, config, null, `${config}: serena ${m}`));
    const { command, args } = commandOf(ctx.target, entry);
    if (command !== "sdd") say(`runs ${JSON.stringify(command ?? null)}, not "sdd"`);
    // The leading arguments in their order, then the table's Serena arguments.
    LEADING.forEach((a, i) => {
      if (args[i] === a) return;
      const at = args.indexOf(a);
      say(at < 0 ? `lacks the argument "${a}"` : `has the argument "${a}" at position ${at + 1}, not ${i + 1}`);
    });
    const want = (table.args ?? []).slice((table.args ?? []).findIndex((a) => a === "start-mcp-server") + 1);
    const have = args.filter((a) => !LEADING.includes(a));
    for (const a of want) if (!have.includes(a)) say(`lacks the table's Serena argument "${a}"`);
    for (const a of have) if (!want.includes(a)) say(`has the extra argument "${a}"`);
    if (want.every((a) => have.includes(a)) && have.every((a) => want.includes(a)) && have.join("\0") !== want.join("\0")) say(`holds the table's Serena arguments out of order: ${have.join(" ")}`);
    const all = JSON.stringify(entry);
    for (const t of FORBIDDEN) if (all.includes(t)) say(`holds "${t}"`);
    return out;
  },
};
