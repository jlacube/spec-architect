// A minimal client of the sdd MCP server for the benchmarks (C002-T-020): starts the built server
// (`build/npm/sdd-mcp.mjs`, C002-T-021) once as a child process and speaks newline-delimited JSON-RPC
// over its standard input and output. `call` measures the wall-clock time from writing the tool call to
// the server's standard input to reading its result (C002-NFR-101, C002-NFR-102).
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

export const SERVER = join(ROOT, "build", "npm", "sdd-mcp.mjs");

export async function startServer(profile, cwd) {
  if (!existsSync(SERVER)) throw new Error(`${SERVER} is missing: run \`npm run build\` first`);
  const child = spawn(process.execPath, [SERVER, "--profile", profile], {
    cwd,
    env: { ...process.env, SDD_DEBUG: undefined, SDD_TEST_FAULT: undefined },
    stdio: ["pipe", "pipe", "pipe"],
  });
  const waiting = new Map();
  let pending = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (s) => (stderr += s));
  child.stdout.on("data", (s) => {
    pending += s;
    for (let i = pending.indexOf("\n"); i >= 0; i = pending.indexOf("\n")) {
      const line = pending.slice(0, i);
      pending = pending.slice(i + 1);
      const at = process.hrtime.bigint();
      const m = JSON.parse(line);
      const w = waiting.get(m.id);
      if (w) {
        waiting.delete(m.id);
        w({ message: m, at });
      }
    }
  });
  const exited = new Promise((resolve) => child.on("exit", resolve));
  let nextId = 1;
  const request = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => reject(new Error(`no response to ${method} within 20 s; stderr=${stderr}`)), 20000);
      waiting.set(id, (r) => {
        clearTimeout(timer);
        resolve({ ...r, sent });
      });
      const sent = process.hrtime.bigint();
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });

  const init = await request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "sdd-bench", version: "1.0.0" } });
  if (!init.message.result) throw new Error(`initialize failed: ${JSON.stringify(init.message)}`);
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

  return {
    /** One tools/call: its result and the wall-clock time in ms. */
    async call(name, args) {
      const r = await request("tools/call", { name, arguments: args });
      if (!r.message.result) throw new Error(`tools/call ${name} failed: ${JSON.stringify(r.message)}`);
      return { result: r.message.result, ms: Number(r.at - r.sent) / 1e6 };
    },
    async close() {
      child.stdin.end();
      return exited;
    },
  };
}
