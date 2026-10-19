// Loopback stub model of the OpenCode replay (C002-ADR-005, C002-T-042): an OpenAI-compatible chat
// endpoint on 127.0.0.1 that answers each replayed case with exactly its scripted tool call, then ends
// the turn. Runs in the replay process (never under `npm test`, whose no-network preload forbids it).
//
// The script is keyed by a token that the case's prompt carries (`replay case <token>`), so that a
// request is answered from its own messages alone:
//   - a request without tools (title, summary) gets a fixed text;
//   - a request whose messages already hold a tool result gets "done." (the turn ends);
//   - else the scripted call of the token found in the user messages, or "done." when none is scripted.
// Approach of the S-07 probe (docs/spikes/s07/stub-model.mjs), feasible on OpenCode 1.18.31 (S-07 §4).
import http from "node:http";

export const STUB_PROVIDER = "stub";
export const STUB_MODEL = "stub-model";
const TOKEN = /replay case (\S+)/;

function textOf(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c) => (typeof c === "string" ? c : (c?.text ?? ""))).join("\n");
  return "";
}

/**
 * Starts the stub on a free loopback port. Returns
 *   { port, baseURL, script(token, call), requests, close() }
 * where `call` is { tool, args } (args may be any JSON value, also an invalid one) and `requests` the
 * log of the chat requests received (tools offered, token, reply).
 */
export function startStubModel() {
  const scripts = new Map();
  const requests = [];
  let seq = 0;
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (d) => (raw += d));
    req.on("end", () => {
      if (!(req.method === "POST" && (req.url ?? "").endsWith("/chat/completions"))) {
        res.writeHead(404);
        res.end();
        return;
      }
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        res.writeHead(400);
        res.end();
        return;
      }
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const tools = (Array.isArray(body.tools) ? body.tools : []).map((t) => t?.function?.name ?? t?.name);
      const token = messages.filter((m) => m?.role === "user").map((m) => TOKEN.exec(textOf(m.content))?.[1]).find(Boolean) ?? null;
      const answered = messages.some((m) => m?.role === "tool");
      let item;
      if (tools.length === 0) item = { text: "replay" };
      else if (answered || token === null || !scripts.has(token)) item = { text: "done." };
      else item = scripts.get(token);
      const id = `stub-${++seq}`;
      requests.push({ id, token, tools, answered, reply: item });
      const created = Math.floor(Date.now() / 1000);
      const usage = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 };
      const toolCalls = item.tool
        ? [{ index: 0, id: `call_${seq}`, type: "function", function: { name: item.tool, arguments: typeof item.args === "string" ? item.args : JSON.stringify(item.args ?? {}) } }]
        : null;
      const finish = toolCalls ? "tool_calls" : "stop";
      if (!body.stream) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            id,
            object: "chat.completion",
            created,
            model: body.model,
            choices: [{ index: 0, finish_reason: finish, message: { role: "assistant", content: item.text ?? null, ...(toolCalls ? { tool_calls: toolCalls } : {}) } }],
            usage,
          }),
        );
        return;
      }
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
      const base = { id, object: "chat.completion.chunk", created, model: body.model };
      const chunk = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
      chunk({ ...base, choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }] });
      if (toolCalls) chunk({ ...base, choices: [{ index: 0, delta: { tool_calls: toolCalls }, finish_reason: null }] });
      else chunk({ ...base, choices: [{ index: 0, delta: { content: item.text }, finish_reason: null }] });
      chunk({ ...base, choices: [{ index: 0, delta: {}, finish_reason: finish }] });
      chunk({ ...base, choices: [], usage });
      res.write("data: [DONE]\n\n");
      res.end();
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({
        port,
        baseURL: `http://127.0.0.1:${port}/v1`,
        requests,
        script(token, call) {
          scripts.set(token, call);
        },
        close() {
          return new Promise((r) => {
            server.closeAllConnections?.();
            server.close(() => r());
          });
        },
      });
    });
  });
}
