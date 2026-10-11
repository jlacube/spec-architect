// Lists the tools a Serena MCP server exposes when started with the plugin's `.mcp.json` launch
// arguments (C001-TS-1007): JSON-RPC over stdio — initialize, initialized, tools/list.
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeSerenaConfig } from "../../../src/workspace/serena-config.ts";
import { mcpConfig, PLUGIN } from "../plugin-files.ts";

export function serenaInstalled(): boolean {
  return spawnSync("serena", ["--version"], { encoding: "utf8" }).status === 0;
}

export async function serenaToolNames(project: string, timeoutMs = 90000): Promise<string[]> {
  const cfg = mcpConfig()["serena"]!;
  const data = mkdtempSync(join(tmpdir(), "sdd-serena-data-"));
  writeSerenaConfig(data);
  const subst = (s: string) => s.split("${CLAUDE_PLUGIN_ROOT}").join(PLUGIN).split("${CLAUDE_PLUGIN_DATA}").join(data);
  const env = { ...process.env, ...Object.fromEntries(Object.entries(cfg.env ?? {}).map(([k, v]) => [k, subst(v)])) };
  // No shell: on Windows a shell would re-parse the arguments (the mode file path).
  const child = spawn(cfg.command!, (cfg.args ?? []).map(subst), { cwd: project, env, stdio: ["pipe", "pipe", "pipe"] });
  const send = (msg: object) => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");
  try {
    return await new Promise<string[]>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("serena did not answer tools/list in time")), timeoutMs);
      let buf = "";
      child.stdout.on("data", (d: Buffer) => {
        buf += d.toString("utf8");
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("{")) continue;
          const msg = JSON.parse(line) as { id?: number; result?: { tools?: { name: string }[] } };
          if (msg.id === 1) {
            send({ method: "notifications/initialized" });
            send({ id: 2, method: "tools/list", params: {} });
          } else if (msg.id === 2) {
            clearTimeout(timer);
            resolve((msg.result?.tools ?? []).map((t) => t.name).sort());
          }
        }
      });
      child.on("error", reject);
      send({ id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "sdd-test", version: "0" } } });
    });
  } finally {
    child.kill();
    if (process.platform === "win32" && child.pid) spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    try {
      rmSync(data, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // A language server Serena started may still hold the temporary folder; it is left for the OS.
    }
  }
}
