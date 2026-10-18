// S-07 throwaway probe (C002-ADR-005 feasibility): a loopback OpenAI-compatible chat endpoint
// that answers each session turn from a script queue. Never shipped.
//
//   node stub-model.mjs <port> <log.jsonl>
//
// POST /script   body: [{ tool: "<name>", args: {...} } | { text: "..." }, ...]  replaces the queue
// POST /v1/chat/completions  OpenAI chat API (stream or not). A request without tools (title or
//   summary agents) gets a fixed text and does not consume the queue. A request whose last message
//   is a tool result gets the next queue item, or "done." when the queue is empty.
import http from "node:http";
import fs from "node:fs";

const port = Number(process.argv[2] ?? 4199);
const logFile = process.argv[3] ?? "stub-model.jsonl";
let queue = [];
let seq = 0;

function log(entry) {
  fs.appendFileSync(logFile, JSON.stringify({ t: new Date().toISOString(), ...entry }) + "\n");
}

function nextItem(body) {
  const hasTools = Array.isArray(body.tools) && body.tools.length > 0;
  if (!hasTools) return { text: "probe title" };
  return queue.shift() ?? { text: "done." };
}

function chunk(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

const server = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (d) => (raw += d));
  req.on("end", () => {
    if (req.method === "POST" && req.url === "/script") {
      queue = JSON.parse(raw || "[]");
      log({ kind: "script", queue });
      res.writeHead(200, { "content-type": "application/json" });
      return res.end('{"ok":true}');
    }
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200);
      return res.end("ok");
    }
    if (!(req.method === "POST" && req.url.endsWith("/chat/completions"))) {
      log({ kind: "other", method: req.method, url: req.url });
      res.writeHead(404);
      return res.end();
    }
    const body = JSON.parse(raw);
    const item = nextItem(body);
    const id = `stub-${++seq}`;
    const last = body.messages?.[body.messages.length - 1];
    log({
      kind: "chat",
      id,
      model: body.model,
      stream: !!body.stream,
      tools: (body.tools ?? []).map((t) => t.function?.name ?? t.name),
      last_role: last?.role,
      last_content: typeof last?.content === "string" ? last.content : JSON.stringify(last?.content),
      reply: item,
    });
    const created = Math.floor(Date.now() / 1000);
    const usage = { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 };
    const toolCalls = item.tool
      ? [{ index: 0, id: `call_${seq}`, type: "function", function: { name: item.tool, arguments: JSON.stringify(item.args ?? {}) } }]
      : null;
    const finish = toolCalls ? "tool_calls" : "stop";
    if (!body.stream) {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(
        JSON.stringify({
          id, object: "chat.completion", created, model: body.model,
          choices: [{ index: 0, finish_reason: finish, message: { role: "assistant", content: item.text ?? null, ...(toolCalls ? { tool_calls: toolCalls } : {}) } }],
          usage,
        }),
      );
    }
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
    const base = { id, object: "chat.completion.chunk", created, model: body.model };
    chunk(res, { ...base, choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }] });
    if (toolCalls) chunk(res, { ...base, choices: [{ index: 0, delta: { tool_calls: toolCalls }, finish_reason: null }] });
    else chunk(res, { ...base, choices: [{ index: 0, delta: { content: item.text }, finish_reason: null }] });
    chunk(res, { ...base, choices: [{ index: 0, delta: {}, finish_reason: finish }] });
    chunk(res, { ...base, choices: [], usage });
    res.write("data: [DONE]\n\n");
    res.end();
  });
});

server.listen(port, "127.0.0.1", () => log({ kind: "listen", port }));
