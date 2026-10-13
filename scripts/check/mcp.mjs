// PLG-MCP-001: .mcp.json declares exactly context7, deepwiki and serena; ripwire is never an MCP server;
// Serena starts through `sdd serena-launch` with the read-only launch of C001-IF-14 §4 (C001-REQ-1005,
// 1006, 1013, 1108).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { finding, read, rel } from "./lib.mjs";

const SERENA_ARGS = ["--context", "claude-code", "--mode", "planning", "--mode", "${CLAUDE_PLUGIN_ROOT}/serena/architect-read-only.yml", "--project", "."];

export default {
  code: "PLG-MCP-001",
  check(ctx) {
    const p = join(ctx.plugin, ".mcp.json");
    if (!existsSync(p)) return [finding(this.code, rel(ctx, p), null, ".mcp.json is missing")];
    const servers = JSON.parse(read(p)).mcpServers ?? {};
    const out = [];
    const names = Object.keys(servers).sort().join(", ");
    if (names !== "context7, deepwiki, serena") out.push(finding(this.code, rel(ctx, p), null, `servers ${names}; expected context7, deepwiki, serena`));
    if (servers.context7?.url !== "https://mcp.context7.com/mcp") out.push(finding(this.code, rel(ctx, p), null, "context7 url"));
    if (servers.deepwiki?.url !== "https://mcp.deepwiki.com/mcp") out.push(finding(this.code, rel(ctx, p), null, "deepwiki url"));
    for (const [name, s] of Object.entries(servers))
      if (/ripwire/i.test(String(s.command ?? "")) || (s.args ?? []).some((a) => String(a).includes("--mcp"))) out.push(finding(this.code, rel(ctx, p), null, `${name}: ripwire must not be an MCP server`));
    // D-010: Serena is started through `sdd serena-launch`, which writes its configuration first.
    const launcher = ["${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs", "serena-launch", "${CLAUDE_PLUGIN_DATA}", "--"];
    if (servers.serena?.command !== "node" || launcher.some((a, i) => servers.serena?.args?.[i] !== a)) out.push(finding(this.code, rel(ctx, p), null, `serena is not started through ${launcher.join(" ")}`));
    const args = (servers.serena?.args ?? []).join(" ");
    if (!args.includes(SERENA_ARGS.join(" "))) out.push(finding(this.code, rel(ctx, p), null, "serena is not started with the read-only modes"));
    if (servers.serena?.env?.SERENA_HOME !== "${CLAUDE_PLUGIN_DATA}/serena") out.push(finding(this.code, rel(ctx, p), null, "serena SERENA_HOME is not ${CLAUDE_PLUGIN_DATA}/serena"));
    return out;
  },
};
