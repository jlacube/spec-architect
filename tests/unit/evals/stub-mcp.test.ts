// C002-T-084: the loopback stub MCP server of C002-TS-709 (evals/harness/stub-mcp.mjs), driven in process
// without a socket (tests/no-network.mjs blocks network access): `initialize`, `ping` and `tools/list`
// succeed and list the DeepWiki tools; every `tools/call` answers with the row's failure, a tool result
// whose `isError` is true or the JSON-RPC error -32603; notifications get 202; GET is refused.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { DEEPWIKI_TOOLS, FAILURES, handleRpc, respond, stubHandler, stubPort, stubUrl } from "../../../evals/harness/stub-mcp.mjs";

const call = (id: number, method: string, params?: unknown) => ({ jsonrpc: "2.0", id, method, ...(params === undefined ? {} : { params }) });

test("initialize, ping and tools/list succeed and list the three DeepWiki tools, for both failures", () => {
  for (const failure of FAILURES) {
    const init = handleRpc(call(1, "initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } }), { failure }) as { result: Record<string, any> };
    assert.equal(init.result["protocolVersion"], "2025-03-26", "the client's protocol version echoed");
    assert.ok(init.result["capabilities"].tools, "tools capability");
    assert.deepEqual(handleRpc(call(2, "ping"), { failure }), { jsonrpc: "2.0", id: 2, result: {} });
    const list = handleRpc(call(3, "tools/list"), { failure }) as { result: { tools: { name: string; inputSchema: unknown }[] } };
    assert.deepEqual(list.result.tools.map((t) => t.name), ["read_wiki_structure", "read_wiki_contents", "ask_wiki_question"]);
    assert.ok(list.result.tools.every((t) => t.inputSchema), "each tool has an input schema");
    assert.equal(list.result.tools, DEEPWIKI_TOOLS);
  }
});

test("tools/call: a tool result whose isError is true (isError); the JSON-RPC error -32603 (-32603)", () => {
  const args = { name: "read_wiki_structure", arguments: { repoName: "oraios/serena" } };
  const a = handleRpc(call(4, "tools/call", args), { failure: "isError" }) as { result: { isError: boolean; content: { type: string; text: string }[] }; error?: unknown };
  assert.equal(a.result.isError, true);
  assert.equal(a.result.content[0]?.type, "text");
  assert.equal(a.error, undefined);
  const b = handleRpc(call(5, "tools/call", args), { failure: "-32603" }) as { error: { code: number; message: string }; result?: unknown };
  assert.equal(b.error.code, -32603);
  assert.equal(b.result, undefined);
});

test("notifications get no answer; unknown methods -32601; invalid requests -32600; an unknown failure throws", () => {
  assert.equal(handleRpc({ jsonrpc: "2.0", method: "notifications/initialized" }, { failure: "isError" }), null);
  assert.equal((handleRpc(call(6, "resources/list"), { failure: "isError" }) as { error: { code: number } }).error.code, -32601);
  assert.equal((handleRpc({ id: 7 }, { failure: "isError" }) as { error: { code: number } }).error.code, -32600);
  assert.throws(() => handleRpc(call(8, "ping"), { failure: "timeout" }), /unknown failure/);
});

test("HTTP: POST answers JSON (single and batch), a notification 202, GET 405, bad JSON 400", () => {
  const one = respond({ method: "POST", body: JSON.stringify(call(1, "tools/list")) }, { failure: "isError" });
  assert.equal(one.status, 200);
  assert.equal((one.headers as Record<string, string>)["content-type"], "application/json");
  assert.equal(JSON.parse(one.body).id, 1);
  const batch = respond({ method: "POST", body: JSON.stringify([call(1, "ping"), { jsonrpc: "2.0", method: "notifications/initialized" }, call(2, "tools/call", { name: "ask_wiki_question" })]) }, { failure: "-32603" });
  const answers = JSON.parse(batch.body) as { id: number; error?: { code: number } }[];
  assert.deepEqual(answers.map((x) => x.id), [1, 2]);
  assert.equal(answers[1]!.error!.code, -32603);
  assert.equal(respond({ method: "POST", body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) }, { failure: "isError" }).status, 202);
  assert.equal(respond({ method: "GET", body: "" }, { failure: "isError" }).status, 405);
  assert.equal(respond({ method: "POST", body: "{" }, { failure: "isError" }).status, 400);
});

test("the request handler answers a request object in process (no socket)", async () => {
  const req = Object.assign(new EventEmitter(), { method: "POST" });
  const res = { status: 0, headers: {} as Record<string, string>, body: "", writeHead(s: number, h: Record<string, string>) { this.status = s; this.headers = h; }, end(b: string) { this.body = b; } };
  const done = new Promise<void>((resolve) => {
    const end = res.end.bind(res);
    res.end = (b: string) => { end(b); resolve(); };
  });
  stubHandler({ failure: "isError" })(req, res);
  req.emit("data", Buffer.from(JSON.stringify(call(9, "tools/call", { name: "read_wiki_structure", arguments: { repoName: "oraios/serena" } }))));
  req.emit("end");
  await done;
  assert.equal(res.status, 200);
  assert.equal(JSON.parse(res.body).result.isError, true);
});

test("the loopback URL of each failure: 127.0.0.1, distinct ports, moved by SDD_EVAL_STUB_PORT_BASE", () => {
  assert.equal(stubUrl("isError", {}), "http://127.0.0.1:47391/mcp");
  assert.equal(stubUrl("-32603", {}), "http://127.0.0.1:47392/mcp");
  assert.equal(stubPort("-32603", { SDD_EVAL_STUB_PORT_BASE: "50000" }), 50001);
});
