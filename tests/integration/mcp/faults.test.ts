// C002-TC-402 (C002-T-020; C002-NFR-204, C002-DOD-013, C002-CON-08): the sdd MCP server fails closed
// under every fault class — malformed input, unknown tool name, an exception in a guard core, an I/O
// error — injected into each write tool (`write_file`, `replace_text`) and the command tool
// (`run_command`): 0 calls are allowed. A call counts as allowed when its result is a success (status
// `written`, `completed` or `timed_out`), when any file of the fixture changed (temporary files
// included), or when the server started a process. The server runs as a child process (the built
// bundle, tests/integration/mcp/client.ts); faults come from the SDD_TEST_FAULT switches of the guard
// cores and of the atomic writer, and, for the command tool's I/O error, from a preload that exists
// only in this test: it replaces `node:child_process` so that starting a process fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { McpSession, serverWorkspace, type RpcMessage } from "./client.ts";

type Profile = "files" | "shell";

/** Records every `node:child_process` call of the server on standard error as `SPAWN-CALL <fn>`. */
const RECORDER = `import { createRequire, syncBuiltinESMExports } from "node:module";
const cp = createRequire(import.meta.url)("node:child_process");
for (const fn of ["spawn", "spawnSync", "execFile", "execFileSync", "fork", "exec", "execSync"]) {
  const orig = cp[fn];
  cp[fn] = function () { process.stderr.write("SPAWN-CALL " + fn + "\\n"); return orig.apply(this, arguments); };
}
syncBuiltinESMExports();
`;

/**
 * The command tool's I/O fault (test seam): loaded after the recorder, it replaces every process start,
 * so no process can start and the recorder sees none. "throw": the call throws EMFILE; "error": the
 * child reports EACCES asynchronously, as a failed start does.
 */
const spawnFault = (mode: "throw" | "error"): string => `import { createRequire, syncBuiltinESMExports } from "node:module";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
const cp = createRequire(import.meta.url)("node:child_process");
const fail = (code) => Object.assign(new Error(code + ": injected I/O error"), { code });
const fake = () => {
  if (${JSON.stringify(mode)} === "throw") throw fail("EMFILE");
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => true;
  process.nextTick(() => child.emit("error", fail("EACCES")));
  return child;
};
for (const fn of ["spawn", "spawnSync", "execFile", "execFileSync", "fork", "exec", "execSync"]) cp[fn] = fake;
syncBuiltinESMExports();
`;

let preloadDir: string | undefined;
function preload(name: string, text: string): string {
  if (!preloadDir) {
    preloadDir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-mcp-faults-")));
    const dir = preloadDir;
    process.once("exit", () => rmSync(dir, { recursive: true, force: true }));
  }
  const file = join(preloadDir, name);
  writeFileSync(file, text);
  return file;
}

/** Every file and folder under `dir` with its content: any change, a temporary file included, shows. */
function snapshot(dir: string, rel = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of readdirSync(join(dir, rel))) {
    const r = rel ? `${rel}/${name}` : name;
    const abs = join(dir, ...r.split("/"));
    if (statSync(abs).isDirectory()) {
      out[`${r}/`] = "";
      Object.assign(out, snapshot(dir, r));
    } else out[r] = readFileSync(abs, "latin1");
  }
  return out;
}

/** `fx-srv`: `.sdd/002-x/a.md` ("status: draft") and `src/app.ts`. */
function fxSrv(): { root: string; cleanup: () => void } {
  const ws = serverWorkspace();
  writeFileSync(join(ws.root, "src", "app.ts"), "export const app = 1;\n");
  return { root: ws.root.replace(/\\/g, "/"), cleanup: ws.cleanup };
}

interface Outcome {
  what: string;
  /** "error" for a JSON-RPC error response; otherwise the tool result's status. */
  status: string;
  code: string | number | undefined;
}

/**
 * Starts one server, sends each call (a raw line or a tools/call), and checks after each one that it was
 * not allowed: an error response or an error result, the fixture unchanged, no process started.
 */
async function faultRun(
  profile: Profile,
  opts: { env?: Record<string, string>; preload?: string[] },
  calls: { what: string; line?: string; name?: string; params?: Record<string, unknown> }[],
): Promise<Outcome[]> {
  const fx = fxSrv();
  const s = await McpSession.start(["--profile", profile], { cwd: fx.root, env: opts.env ?? {}, preload: [preload("recorder.mjs", RECORDER), ...(opts.preload ?? [])] });
  const outcomes: Outcome[] = [];
  try {
    await s.initialize();
    const before = snapshot(fx.root);
    for (const c of calls) {
      let m: RpcMessage;
      if (c.line !== undefined) {
        s.writeLine(c.line);
        m = await s.next((x) => x.id === null && x.error !== undefined, `error response to ${c.what}`);
      } else m = await s.request("tools/call", c.params ?? { name: c.name });
      let outcome: Outcome;
      if (m.error !== undefined) {
        assert.equal(m.result, undefined, `${c.what}: ${JSON.stringify(m)}`);
        outcome = { what: c.what, status: "error", code: m.error.code };
      } else {
        const r = m.result as { isError?: boolean; structuredContent?: { status?: string; code?: string } };
        assert.equal(r.isError, true, `${c.what}: allowed: ${JSON.stringify(m)}`);
        outcome = { what: c.what, status: r.structuredContent?.status ?? "", code: r.structuredContent?.code };
      }
      assert.ok(outcome.status === "error" || outcome.status === "failed" || outcome.status === "refused", `${c.what}: ${JSON.stringify(m)}`);
      assert.deepEqual(snapshot(fx.root), before, `${c.what}: the fixture changed`);
      assert.ok(!s.stderr.includes("SPAWN-CALL"), `${c.what}: a process was started: ${s.stderr}`);
      outcomes.push(outcome);
    }
    assert.equal(await s.close(), 0, `the server did not end cleanly: ${s.stderr}`);
  } finally {
    s.kill();
    await s.exited;
    fx.cleanup();
  }
  return outcomes;
}

const tool = (name: string, args: Record<string, unknown>) => ({ name, params: { name, arguments: args } });

/** Calls each tool would allow without a fault. */
const ALLOWED: Record<string, Record<string, unknown>> = {
  write_file: { path: ".sdd/002-x/a.md", content: "status: approved" },
  replace_text: { path: ".sdd/002-x/a.md", old_text: "draft", new_text: "approved" },
  run_command: { command: "node --version" },
};

function assertCodes(outcomes: Outcome[], expected: (string | number)[]): void {
  assert.deepEqual(
    outcomes.map((o) => `${o.what} → ${String(o.code)}`),
    outcomes.map((o, i) => `${o.what} → ${String(expected[i])}`),
  );
}

// --- fault class 1: malformed input ---

test("C002-TS-402 malformed input: arguments outside each write tool's input schema → ERR-MCP-001, 0 allowed", async () => {
  const calls = [
    { what: "write_file without content", ...tool("write_file", { path: ".sdd/002-x/a.md" }) },
    { what: "write_file with a number as content", ...tool("write_file", { path: ".sdd/002-x/a.md", content: 42 }) },
    { what: "write_file with an extra argument", ...tool("write_file", { ...ALLOWED["write_file"], mode: "0777" }) },
    { what: "write_file without arguments", name: "write_file", params: { name: "write_file" } },
    { what: "replace_text without new_text", ...tool("replace_text", { path: ".sdd/002-x/a.md", old_text: "draft" }) },
    { what: "replace_text with an empty old_text", ...tool("replace_text", { path: ".sdd/002-x/a.md", old_text: "", new_text: "x" }) },
    { what: "replace_text with a null path", ...tool("replace_text", { path: null, old_text: "draft", new_text: "x" }) },
  ];
  const out = await faultRun("files", {}, calls);
  assertCodes(out, calls.map(() => "ERR-MCP-001"));
});

test("C002-TS-402 malformed input: arguments outside run_command's input schema → ERR-MCP-001, no process", async () => {
  const calls = [
    { what: "run_command without command", ...tool("run_command", { dialect: "bash" }) },
    { what: "run_command with an array as command", ...tool("run_command", { command: ["node", "--version"] }) },
    { what: "run_command with an unknown dialect", ...tool("run_command", { command: "sdd status", dialect: "zsh" }) },
    { what: "run_command with an extra argument", ...tool("run_command", { command: "node --version", shell: true }) },
    { what: "run_command with a negative timeout", ...tool("run_command", { command: "node --version", timeout_ms: -1 }) },
    { what: "run_command without arguments", name: "run_command", params: { name: "run_command" } },
  ];
  const out = await faultRun("shell", {}, calls);
  assertCodes(out, calls.map(() => "ERR-MCP-001"));
});

for (const profile of ["files", "shell"] as const) {
  test(`C002-TS-402 malformed input (${profile}): unparsable lines, invalid requests and malformed tools/call params → JSON-RPC errors, 0 allowed`, async () => {
    const name = profile === "files" ? "write_file" : "run_command";
    const calls = [
      { what: "an unparsable line", line: '{"jsonrpc":"2.0","id":7,"method":"tools/call",' },
      { what: "a JSON value that is no JSON-RPC message", line: JSON.stringify({ id: 8, call: name, arguments: ALLOWED[name] }) },
      { what: `${name} with a string as arguments`, params: { name, arguments: JSON.stringify(ALLOWED[name]) } },
      { what: `${name} with an array as arguments`, params: { name, arguments: [ALLOWED[name]] } },
      { what: "tools/call without a tool name", params: { arguments: ALLOWED[name] } },
      { what: "tools/call with a number as tool name", params: { name: 42, arguments: ALLOWED[name] } },
    ];
    const out = await faultRun(profile, {}, calls);
    for (const o of out) assert.equal(o.status, "error", o.what);
    assert.deepEqual(out.slice(0, 2).map((o) => o.code), [-32700, -32600]);
  });
}

// --- fault class 2: unknown tool name ---

test("C002-TS-402 unknown tool name: names outside each profile, close to each tool's name → InvalidParams, 0 allowed", async () => {
  const files = ["run_command", "Write_File", "write_file ", "replace-text", "REPLACE_TEXT", "delete_file", ""].map((n) => ({
    what: `files profile: ${JSON.stringify(n)}`,
    params: { name: n, arguments: n.toLowerCase().includes("command") ? ALLOWED["run_command"] : ALLOWED["write_file"] },
  }));
  const shell = ["write_file", "replace_text", "Run_Command", "run_command\u0000", "run", "bash"].map((n) => ({
    what: `shell profile: ${JSON.stringify(n)}`,
    params: { name: n, arguments: n.startsWith("write") || n.startsWith("replace") ? ALLOWED[n] : ALLOWED["run_command"] },
  }));
  const a = await faultRun("files", {}, files);
  const b = await faultRun("shell", {}, shell);
  for (const o of [...a, ...b]) assert.deepEqual([o.status, o.code], ["error", -32602], o.what);
});

// --- fault class 3: an exception in a guard core ---

test("C002-TS-402 guard exception: the path guard core throws in write_file and replace_text → ERR-MCP-002, 0 allowed", async () => {
  const calls = [
    { what: "write_file of an existing .sdd/ file", ...tool("write_file", ALLOWED["write_file"]!) },
    { what: "write_file of a new .sdd/ file", ...tool("write_file", { path: ".sdd/002-x/new/b.md", content: "x" }) },
    { what: "replace_text in an .sdd/ file", ...tool("replace_text", ALLOWED["replace_text"]!) },
  ];
  const out = await faultRun("files", { env: { SDD_TEST_FAULT: "mcp-guard-throw" } }, calls);
  assertCodes(out, calls.map(() => "ERR-MCP-002"));
  for (const o of out) assert.equal(o.status, "failed");
});

test("C002-TS-402 guard exception: the bash guard core throws in run_command → ERR-MCP-002, no process", async () => {
  const calls = [
    { what: "node --version", ...tool("run_command", { command: "node --version" }) },
    { what: "sdd status", ...tool("run_command", { command: "sdd status" }) },
    { what: "sdd status (powershell)", ...tool("run_command", { command: "sdd status", dialect: "powershell" }) },
  ];
  const out = await faultRun("shell", { env: { SDD_TEST_FAULT: "mcp-bash-guard-throw" } }, calls);
  assertCodes(out, calls.map(() => "ERR-MCP-002"));
});

// --- fault class 4: an I/O error ---

test("C002-TS-402 I/O error: the atomic write fails in write_file and replace_text → ERR-MCP-003, previous content kept", async () => {
  // atomic-write-fail-at=k fails the k-th atomic write of the process: one server per call.
  for (const c of [
    { what: "write_file of an existing .sdd/ file", ...tool("write_file", ALLOWED["write_file"]!) },
    { what: "write_file of a new .sdd/ file", ...tool("write_file", { path: ".sdd/002-x/b.md", content: "x" }) },
    { what: "replace_text in an .sdd/ file", ...tool("replace_text", ALLOWED["replace_text"]!) },
  ]) {
    const out = await faultRun("files", { env: { SDD_TEST_FAULT: "atomic-write-fail-at=1" } }, [c]);
    assertCodes(out, ["ERR-MCP-003"]);
  }
});

for (const mode of ["throw", "error"] as const) {
  test(`C002-TS-402 I/O error: starting the process fails (${mode === "throw" ? "spawn throws EMFILE" : "EACCES reported by the child"}) → ERR-MCP-006, no process`, async () => {
    const calls = [
      { what: "node --version", ...tool("run_command", { command: "node --version" }) },
      { what: "sdd status", ...tool("run_command", { command: "sdd status" }) },
    ];
    const out = await faultRun("shell", { preload: [preload(`spawn-${mode}.mjs`, spawnFault(mode))] }, calls);
    assertCodes(out, calls.map(() => "ERR-MCP-006"));
  });
}
