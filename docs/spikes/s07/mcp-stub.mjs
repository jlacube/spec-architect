// S-07 throwaway probe: an "adopter" MCP server (stdio, newline-delimited JSON-RPC) with one tool
// `adopter_tool`; every call is logged. Never shipped.   node mcp-stub.mjs <log.jsonl>
import fs from "node:fs";
import readline from "node:readline";

const logFile = process.argv[2] ?? "mcp-stub.jsonl";
const log = (e) => fs.appendFileSync(logFile, JSON.stringify({ t: new Date().toISOString(), ...e }) + "\n");
const send = (m) => process.stdout.write(JSON.stringify(m) + "\n");

readline.createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  const msg = JSON.parse(line);
  log({ kind: "rpc", method: msg.method, params: msg.params });
  if (msg.id === undefined) return;
  switch (msg.method) {
    case "initialize":
      return send({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: msg.params?.protocolVersion ?? "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "adopter", version: "0.0.1" } } });
    case "tools/list":
      return send({ jsonrpc: "2.0", id: msg.id, result: { tools: [{ name: "adopter_tool", description: "Adopter probe tool", inputSchema: { type: "object", properties: { q: { type: "string" } } } }] } });
    case "tools/call":
      log({ kind: "CALLED", tool: msg.params?.name, args: msg.params?.arguments });
      return send({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: "adopter tool ran" }] } });
    default:
      return send({ jsonrpc: "2.0", id: msg.id, result: {} });
  }
});
