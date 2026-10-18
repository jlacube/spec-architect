// C002-TC-414, C002-TC-415, C002-TC-416, C002-TC-420, C002-TC-421, C002-TC-422 (C002-T-016): the sdd
// MCP server's protocol binding (C002-IF-002 §1, §2, §4; C002-ADR-001) — initialize, the tool list of
// each profile, the -32602 error for a tool of the other profile, exit codes 0/2/3, the SDK's handling
// of malformed input, and JSON-RPC only on standard output (C002-REQ-410, C002-REQ-411, C002-REQ-415).
// The server runs as a child process with tests/no-network.mjs preloaded (C002-NFR-205).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { McpSession, runServerSync, serverWorkspace, VERSION, type RpcMessage } from "./client.ts";

const served = JSON.parse(readFileSync(join(repoRoot(), "src", "mcp", "served-schemas.json"), "utf8")) as Record<string, { description: string; inputSchema: unknown; outputSchema: unknown }>;

/** Every line of standard output is one JSON-RPC 2.0 message, and nothing follows the last newline. */
function assertJsonRpcOnly(stdout: string): RpcMessage[] {
  assert.ok(stdout.length > 0, "standard output is empty");
  assert.ok(stdout.endsWith("\n"), `standard output does not end with a newline: ${JSON.stringify(stdout.slice(-80))}`);
  return stdout
    .slice(0, -1)
    .split("\n")
    .map((line) => {
      let m: RpcMessage;
      try {
        m = JSON.parse(line) as RpcMessage;
      } catch {
        assert.fail(`standard output line is not JSON: ${JSON.stringify(line)}`);
      }
      assert.equal(m.jsonrpc, "2.0", line);
      const isResponse = "id" in m && (m.result !== undefined || m.error !== undefined);
      const isRequestOrNotification = typeof m.method === "string";
      assert.ok(isResponse !== isRequestOrNotification, `not a JSON-RPC message: ${line}`);
      return m;
    });
}

async function withSession<T>(profile: string, fn: (s: McpSession, root: string) => Promise<T>, env: Record<string, string | undefined> = {}): Promise<T> {
  const ws = serverWorkspace();
  const s = await McpSession.start(["--profile", profile], { cwd: ws.root, env });
  try {
    return await fn(s, ws.root);
  } finally {
    s.kill();
    await s.exited;
    ws.cleanup();
  }
}

test("the plugin bundle scripts/sdd.mjs does not contain the MCP SDK (C002-CON-11)", () => {
  const plugin = join(repoRoot(), "plugins", "architect");
  assert.ok(!readFileSync(join(plugin, "scripts", "sdd.mjs"), "utf8").includes("modelcontextprotocol"));
  assert.ok(!readFileSync(join(plugin, "THIRD_PARTY_NOTICES.md"), "utf8").includes("@modelcontextprotocol/sdk"));
});

test("initialize: serverInfo sdd-mcp with the package version, tools capability only (C002-IF-002 §4)", async () => {
  await withSession("files", async (s) => {
    const r = await s.initialize();
    assert.deepEqual(r["serverInfo"], { name: "sdd-mcp", version: VERSION });
    assert.deepEqual(r["capabilities"], { tools: { listChanged: false } });
    assert.equal(typeof r["protocolVersion"], "string");
  });
});

for (const [profile, tools] of [
  ["files", ["write_file", "replace_text"]],
  ["shell", ["run_command"]],
] as const) {
  test(`C002-TS-420: --profile ${profile} lists exactly ${tools.join(" and ")}, with the served schemas`, async () => {
    await withSession(profile, async (s) => {
      await s.initialize();
      const r = await s.request("tools/list");
      const list = (r.result?.["tools"] ?? []) as { name: string; description: string; inputSchema: unknown; outputSchema: unknown }[];
      assert.deepEqual(list.map((t) => t.name), [...tools]);
      for (const t of list) {
        const want = served[t.name]!;
        assert.deepEqual({ description: t.description, inputSchema: t.inputSchema, outputSchema: t.outputSchema }, want);
        assert.ok(!JSON.stringify(t).includes("$ref"), `${t.name}: served schemas are self-contained`);
      }
    });
  });
}

test("C002-TS-421: sdd-files called with run_command → -32602; src/marker.txt does not exist", async () => {
  await withSession("files", async (s, root) => {
    await s.initialize();
    const r = await s.request("tools/call", { name: "run_command", arguments: { command: "echo x > src/marker.txt" } });
    assert.equal(r.error?.code, -32602, JSON.stringify(r));
    assert.equal(r.result, undefined);
    assert.equal(existsSync(join(root, "src", "marker.txt")), false);
  });
});

test('C002-TS-421: sdd-shell called with write_file → -32602; .sdd/002-x/a.md still holds "status: draft"', async () => {
  await withSession("shell", async (s, root) => {
    await s.initialize();
    const r = await s.request("tools/call", { name: "write_file", arguments: { path: ".sdd/002-x/a.md", content: "status: approved\n" } });
    assert.equal(r.error?.code, -32602, JSON.stringify(r));
    assert.equal(readFileSync(join(root, ".sdd", "002-x", "a.md"), "utf8"), "status: draft\n");
  });
});

for (const args of [[], ["--profile", "admin"], ["--profile"], ["--profile", "files", "--extra"], ["--profile", "files", "--root", "no/such/folder"]]) {
  test(`C002-TS-422: sdd-mcp ${args.join(" ")} → exit 2 before any MCP message, ERR-MCP-007, empty stdout`, async () => {
    const ws = serverWorkspace();
    try {
      const r = await runServerSync(args, { cwd: ws.root, input: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) + "\n" });
      assert.equal(r.code, 2, r.stderr);
      // C002-TC-422 (revised print form, errors.md §2): `sdd-mcp: ERR-MCP-007: <message>`.
      assert.ok(r.stderr.startsWith("sdd-mcp: ERR-MCP-007: usage: sdd-mcp --profile files|shell [--root <dir>]: "), r.stderr);
      assert.equal(r.stdout, "");
    } finally {
      ws.cleanup();
    }
  });
}

test("C002-TS-416: sdd-shell exits 0 when standard input closes before any message", async () => {
  const ws = serverWorkspace();
  try {
    const r = await runServerSync(["--profile", "shell"], { cwd: ws.root, input: "" });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, "");
  } finally {
    ws.cleanup();
  }
});

for (const profile of ["files", "shell"]) {
  test(`C002-TS-415: sdd-${profile} exits 0 when the host closes standard input after initialize`, async () => {
    const ws = serverWorkspace();
    try {
      const s = await McpSession.start(["--profile", profile], { cwd: ws.root });
      await s.initialize();
      assert.equal(await s.close(), 0, s.stderr);
      assertJsonRpcOnly(s.stdout);
    } finally {
      ws.cleanup();
    }
  });
}

test("a schema compile failure at start exits 3 with no MCP message (C002-IF-002 §1, C002-ADR-002)", async () => {
  const ws = serverWorkspace();
  try {
    const r = await runServerSync(["--profile", "files"], { cwd: ws.root, env: { SDD_TEST_FAULT: "mcp-schema-compile" } });
    assert.equal(r.code, 3, r.stderr);
    assert.match(r.stderr, /^sdd-mcp: fatal: tool schemas cannot be compiled: /);
    assert.equal(r.stdout, "");
  } finally {
    ws.cleanup();
  }
});

test("malformed input (C002-ADR-001): unparsable line → -32700, JSON that is not JSON-RPC → -32600, id null; the session goes on", async () => {
  await withSession("files", async (s) => {
    await s.initialize();
    const errorWith = (code: number) => (m: RpcMessage) => m.error?.code === code && m.id === null;
    s.writeLine("{ this is not json");
    assert.deepEqual(await s.next(errorWith(-32700), "-32700 response"), { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    for (const line of ["42", '"text"', "[]", '{"jsonrpc":"2.0","foo":1}', '{"id":7,"method":"tools/list"}']) {
      s.writeLine(line);
      const m = await s.next(errorWith(-32600), `-32600 response to ${line}`);
      assert.deepEqual(m, { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } }, line);
    }
    const r = await s.request("tools/list");
    assert.equal((r.result?.["tools"] as unknown[]).length, 2);
    assert.equal(await s.close(), 0);
    assertJsonRpcOnly(s.stdout);
  });
});

test("unknown method → -32601 from the SDK; no tool runs", async () => {
  await withSession("shell", async (s) => {
    await s.initialize();
    const r = await s.request("resources/list");
    assert.equal(r.error?.code, -32601, JSON.stringify(r));
  });
});

for (const [profile, call] of [
  ["files", { name: "write_file", arguments: { path: ".sdd/002-x/b.md", content: "status: draft\n" } }],
  ["shell", { name: "run_command", arguments: { command: "sdd status" } }],
] as const) {
  test(`C002-TS-414: sdd-${profile} with SDD_DEBUG=1 — every stdout byte is JSON-RPC, diagnostics on stderr only, no socket`, async () => {
    const ws = serverWorkspace();
    try {
      const s = await McpSession.start(["--profile", profile], { cwd: ws.root, env: { SDD_DEBUG: "1" } });
      await s.initialize();
      await s.request("tools/list");
      // Two calls back to back: answered in arrival order (one tools/call at a time, C001-CON-11).
      const first = s.request("tools/call", call);
      const second = s.request("tools/call", call);
      const [a, b] = await Promise.all([first, second]);
      for (const r of [a, b]) assert.ok(r.result !== undefined && r.error === undefined, JSON.stringify(r));
      assert.equal(await s.close(), 0, s.stderr);
      const msgs = assertJsonRpcOnly(s.stdout);
      const callIds = msgs.filter((m) => m.result?.["content"] !== undefined).map((m) => m.id);
      assert.deepEqual(callIds, [a.id, b.id]);
      const lines = s.stderr.trimEnd().split("\n");
      assert.ok(lines.length >= 4, s.stderr);
      for (const l of lines) assert.match(l, /^sdd-mcp: /);
      assert.ok(lines.some((l) => l.includes(`tools/call tool=${call.name}`)), s.stderr);
      assert.ok(!s.stderr.includes("LISTEN-ATTEMPT"), "the server opened a listening socket");
    } finally {
      ws.cleanup();
    }
  });
}
