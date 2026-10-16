// S-08 stub MCP server (stdio, newline-delimited JSON-RPC, no dependencies). Two tools: stub_read and
// stub_write. Every tools/call is logged to logs/mcp.jsonl, so the probe sees which tools an agent could call.
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const logs = join(dirname(fileURLToPath(import.meta.url)), "..", "logs");
mkdirSync(logs, { recursive: true });
const log = (entry) => appendFileSync(join(logs, "mcp.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

const tools = [
  { name: "stub_read", description: "S-08 probe: returns a fixed text (read-only).", inputSchema: { type: "object", properties: { note: { type: "string" } } } },
  { name: "stub_write", description: "S-08 probe: pretends to write a file (logs the call only).", inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path"] } },
];

log({ event: "start", argv: process.argv.slice(2) });
createInterface({ input: process.stdin }).on("line", (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  if (msg.id === undefined) return; // notifications
  if (msg.method === "initialize") {
    send({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: msg.params?.protocolVersion ?? "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "probe-stub", version: "0.0.0" } } });
  } else if (msg.method === "tools/list") {
    send({ jsonrpc: "2.0", id: msg.id, result: { tools } });
  } else if (msg.method === "tools/call") {
    log({ event: "call", tool: msg.params?.name, arguments: msg.params?.arguments });
    send({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: `probe-stub ${msg.params?.name} called` }] } });
  } else {
    send({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `method not found: ${msg.method}` } });
  }
});
