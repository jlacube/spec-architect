// Loopback stub of a remote MCP server for the failing-probe rows (C002-TS-709, and the Claude Code and
// OpenCode rows of C002-TS-509 "the researcher's DeepWiki probe call fails"; C002-IF-010 §2.1
// `mcpOverrides`, C002-IF-006 §2.1 Blocked endpoint). It speaks the Streamable HTTP transport with JSON
// responses: `initialize`, `ping` and `tools/list` succeed and list the DeepWiki tools, so the host offers
// them to the researcher; every `tools/call` answers with the row's failure:
//   "isError"  a tool result whose `isError` is true;
//   "-32603"   the JSON-RPC error -32603 (internal error).
// The case starts it (`listenStub`, in its fixture) and stops it (`close`, in its assert); the request
// handler (`handleRpc`, `stubHandler`) is tested in process without a socket (tests/no-network.mjs).
import { createServer } from "node:http";

export const FAILURES = ["isError", "-32603"];

/** The DeepWiki tools the stub lists (names and arguments as the DeepWiki server lists them). */
export const DEEPWIKI_TOOLS = [
  {
    name: "read_wiki_structure",
    description: "Get a list of documentation topics for a GitHub repository (stub).",
    inputSchema: { type: "object", properties: { repoName: { type: "string", description: "GitHub repository: owner/repo" } }, required: ["repoName"] },
  },
  {
    name: "read_wiki_contents",
    description: "View documentation about a GitHub repository (stub).",
    inputSchema: { type: "object", properties: { repoName: { type: "string", description: "GitHub repository: owner/repo" } }, required: ["repoName"] },
  },
  {
    name: "ask_wiki_question",
    description: "Ask any question about a GitHub repository (stub).",
    inputSchema: {
      type: "object",
      properties: { repoName: { type: "string", description: "GitHub repository: owner/repo" }, question: { type: "string", description: "The question" } },
      required: ["repoName", "question"],
    },
  },
];

/** Default loopback ports per failure (a row's stub; `SDD_EVAL_STUB_PORT_BASE` moves both). */
export function stubPort(failure, env = process.env) {
  const base = Number(env.SDD_EVAL_STUB_PORT_BASE ?? 47391);
  return base + FAILURES.indexOf(failure);
}

/** The URL of the stub for `failure` (what the row's `mcpOverrides` gives the server). */
export const stubUrl = (failure, env = process.env) => `http://127.0.0.1:${stubPort(failure, env)}/mcp`;

/**
 * The JSON-RPC response to one message, or null for a notification. `failure` is one of FAILURES.
 */
export function handleRpc(message, { failure }) {
  if (!FAILURES.includes(failure)) throw new Error(`stub MCP server: unknown failure ${failure}; use ${FAILURES.join(" or ")}`);
  if (!message || typeof message !== "object" || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return { jsonrpc: "2.0", id: message?.id ?? null, error: { code: -32600, message: "Invalid Request" } };
  }
  const { id, method, params } = message;
  if (id === undefined || id === null) return null; // a notification (notifications/initialized, …)
  const ok = (result) => ({ jsonrpc: "2.0", id, result });
  switch (method) {
    case "initialize":
      return ok({ protocolVersion: params?.protocolVersion ?? "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "deepwiki-stub", version: "0.0.0" } });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: DEEPWIKI_TOOLS });
    case "tools/call":
      if (failure === "isError") return ok({ content: [{ type: "text", text: `stub failure: ${params?.name ?? "tool"} is unavailable (C002-TS-709)` }], isError: true });
      return { jsonrpc: "2.0", id, error: { code: -32603, message: "Internal error (stub, C002-TS-709)" } };
    default:
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

/**
 * The response to one HTTP request: `{ status, headers, body }` (body a string or ""). POST carries one
 * JSON-RPC message or a batch; GET and DELETE are refused with 405 (no server-sent stream, no session).
 */
export function respond({ method, body }, { failure }) {
  if (method !== "POST") return { status: 405, headers: { allow: "POST" }, body: "" };
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return json(400, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }
  const answers = (Array.isArray(parsed) ? parsed : [parsed]).map((m) => handleRpc(m, { failure })).filter((a) => a !== null);
  if (answers.length === 0) return { status: 202, headers: {}, body: "" };
  return json(200, Array.isArray(parsed) ? answers : answers[0]);
}

const json = (status, value) => ({ status, headers: { "content-type": "application/json" }, body: JSON.stringify(value) });

/** A Node.js request handler for `createServer`. */
export function stubHandler({ failure }) {
  return (req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const r = respond({ method: req.method, body: Buffer.concat(chunks).toString("utf8") }, { failure });
      res.writeHead(r.status, r.headers);
      res.end(r.body);
    });
  };
}

/**
 * Starts the stub on 127.0.0.1 at the port of `failure` and returns `{ url, server, close }` at once
 * (the listen completes before the session starts). The server does not keep the process alive.
 */
export function listenStub(failure, { port = stubPort(failure) } = {}) {
  const server = createServer(stubHandler({ failure }));
  server.on("error", (e) => console.error(`stub MCP server (${failure}) on port ${port}: ${e.message}`));
  server.listen(port, "127.0.0.1");
  server.unref();
  return { url: `http://127.0.0.1:${port}/mcp`, server, close: () => new Promise((done) => server.close(() => done())) };
}
