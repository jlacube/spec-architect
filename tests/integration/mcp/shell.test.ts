// C002-TC-406, C002-TC-407, C002-TC-408, C002-TC-409, C002-TC-641, C002-TC-642 and C002-TC-352
// (C002-T-019), C002-TC-423 and C002-TC-424 (C002-T-061): the command tool `run_command` of the sdd MCP server's `shell` profile (C002-IF-002
// §5.2; C002-REQ-405 … C002-REQ-407, C002-REQ-325). The server runs as a child process, bundled from the
// sources with the package CLI `sdd.mjs` beside it (tests/integration/mcp/client.ts). A preload wraps
// every `node:child_process` function of the server process and records the options of each call, so
// that each test checks that no process started with a shell (C002-CON-07) and that a refused command
// started no process at all. Every structuredContent is checked against sdd-mcp-tools.schema.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { repoRoot } from "../../helpers.ts";
import { applyFilter, STREAM_CAP } from "../../../src/mcp/tools/shell.ts";
import { McpSession, serverBundle, serverWorkspace, VERSION } from "./client.ts";

const schema = JSON.parse(readFileSync(join(repoRoot(), "src", "mcp", "tools.schema.json"), "utf8")) as object;
const validateResult = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
const WIN = process.platform === "win32";
const HAS_GIT = spawnSync("git", ["--version"], { encoding: "utf8" }).status === 0;
/** The spelling of the PATH variable in this process's environment ("Path" on most Windows hosts). */
const PATH_KEY = Object.keys(process.env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";

/**
 * The child_process stub (C002-T-019 "Done when"): each function of `node:child_process` is wrapped and
 * reports its call on standard error as `SPAWN-CALL <json>` before running it. `exec` and `execSync`
 * always start a shell, so they are recorded with `shell: true`.
 */
const RECORDER = `import { createRequire, syncBuiltinESMExports } from "node:module";
const cp = createRequire(import.meta.url)("node:child_process");
const report = (fn, file, args, options, shell) => process.stderr.write("SPAWN-CALL " + JSON.stringify({ fn, file, args, shell: shell ?? (options && options.shell) ?? false }) + "\\n");
const split = (args, options) => Array.isArray(args) ? [args, options] : [[], args];
for (const fn of ["spawn", "spawnSync", "execFile", "execFileSync", "fork"]) {
  const orig = cp[fn];
  cp[fn] = function (file, a, o) { const [args, options] = split(a, o); report(fn, file, args, options); return orig.apply(this, arguments); };
}
for (const fn of ["exec", "execSync"]) {
  const orig = cp[fn];
  cp[fn] = function (command) { report(fn, command, [], {}, true); return orig.apply(this, arguments); };
}
syncBuiltinESMExports();
`;

let recorderFile: string | undefined;
function recorder(): string {
  if (recorderFile) return recorderFile;
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-spawn-rec-")));
  recorderFile = join(dir, "spawn-recorder.mjs");
  writeFileSync(recorderFile, RECORDER);
  process.once("exit", () => rmSync(dir, { recursive: true, force: true }));
  return recorderFile;
}

interface SpawnCall {
  fn: string;
  file: string;
  args: string[];
  shell: unknown;
}

function spawnCalls(stderr: string): SpawnCall[] {
  return stderr
    .split("\n")
    .filter((l) => l.startsWith("SPAWN-CALL "))
    .map((l) => JSON.parse(l.slice("SPAWN-CALL ".length)) as SpawnCall);
}

interface Fx {
  root: string;
  abs(rel: string): string;
  read(rel: string): string;
  exists(rel: string): boolean;
}

function git(root: string, ...args: string[]): void {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
}

/** `fx-srv` of the CAP-04 acceptance file, as a git repository: `.sdd/002-x/a.md`, `src/app.ts`; all files staged. */
function fxSrv(): Fx & { cleanup: () => void } {
  const ws = serverWorkspace();
  writeFileSync(join(ws.root, "src", "app.ts"), "export const app = 1;\n");
  if (HAS_GIT) {
    git(ws.root, "init", "-q");
    git(ws.root, "add", "-A");
  }
  return fx(ws.root, ws.cleanup);
}

/** `fx-cp-install` (test plan §2): a git repository with `src/app.ts` and `README.md`, without `.github/`, `.vscode/` and `.sdd/`. */
function fxCpInstall(): Fx & { cleanup: () => void } {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-cp-install-")));
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "src", "app.ts"), "export const app = 1;\n");
  writeFileSync(join(root, "README.md"), "# fx-cp-install\n");
  if (HAS_GIT) git(root, "init", "-q");
  return fx(root, () => rmSync(root, { recursive: true, force: true }));
}

function fx(native: string, cleanup: () => void): Fx & { cleanup: () => void } {
  const root = native.replace(/\\/g, "/");
  return {
    root,
    abs: (rel) => `${root}/${rel}`,
    read: (rel) => readFileSync(join(native, ...rel.split("/")), "utf8"),
    exists: (rel) => existsSync(join(native, ...rel.split("/"))),
    cleanup,
  };
}

/** A temporary folder for PATH stubs. */
function stubDir(): { dir: string; cleanup: () => void } {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-path-stub-")));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

interface ToolResult {
  content: { type: string; text: string }[];
  structuredContent: Record<string, unknown>;
  isError?: boolean;
}

type Call = (args: Record<string, unknown>) => Promise<ToolResult>;

async function withServer(
  fn: (call: Call, fx: Fx, s: McpSession) => Promise<void>,
  opts: { env?: Record<string, string | undefined>; fixture?: () => Fx & { cleanup: () => void }; serverFile?: string } = {},
): Promise<void> {
  const f = (opts.fixture ?? fxSrv)();
  // C002-TS-641: the server's environment has no CLAUDE_PLUGIN_DATA.
  const s = await McpSession.start(["--profile", "shell"], { cwd: f.root, env: { CLAUDE_PLUGIN_DATA: undefined, ...opts.env }, preload: [recorder()], serverFile: opts.serverFile });
  try {
    await s.initialize();
    const call: Call = async (args) => {
      const r = await s.request("tools/call", { name: "run_command", arguments: args });
      assert.ok(r.result !== undefined && r.error === undefined, JSON.stringify(r));
      const res = r.result as unknown as ToolResult;
      assert.ok(validateResult(res.structuredContent), `structuredContent does not match the schema: ${JSON.stringify(validateResult.errors)} in ${JSON.stringify(res)}`);
      const ok = res.structuredContent["status"] === "completed" || res.structuredContent["status"] === "timed_out";
      assert.equal(res.isError === true, !ok, JSON.stringify(res));
      assert.equal(res.content.length, 1);
      if (res.isError) assert.equal(res.content[0]!.text, res.structuredContent["message"]);
      return res;
    };
    await fn(call, f, s);
    // C002-CON-07: no call of the server started a shell.
    for (const c of spawnCalls(s.stderr)) assert.ok(c.shell === false || c.shell === undefined, `a process started with a shell: ${JSON.stringify(c)}`);
  } finally {
    s.kill();
    await s.exited;
    f.cleanup();
  }
}

/** The spawn calls recorded since `mark` (an index into the recorded list). */
function callsSince(s: McpSession, mark: number): SpawnCall[] {
  return spawnCalls(s.stderr).slice(mark);
}

function assertRefused(r: ToolResult, code: string): void {
  assert.equal(r.isError, true, JSON.stringify(r));
  assert.equal(r.structuredContent["code"], code, JSON.stringify(r));
  assert.equal(r.structuredContent["status"], code.startsWith("GUARD-") ? "refused" : "failed", JSON.stringify(r));
  assert.equal("exit_code" in r.structuredContent, false);
}

function assertCompleted(r: ToolResult): void {
  assert.equal(r.isError, undefined, JSON.stringify(r));
  assert.equal(r.structuredContent["status"], "completed", JSON.stringify(r));
  assert.equal(typeof r.structuredContent["exit_code"], "number");
  const sc = r.structuredContent;
  assert.equal(r.content[0]!.text, `exit ${String(sc["exit_code"])}\n--- stdout ---\n${String(sc["stdout"])}\n--- stderr ---\n${String(sc["stderr"])}`);
}

// C002-TS-406 — command decisions.
const TS406: { command: string; result: "run" | "GUARD-BASH-001" | "GUARD-BASH-002"; git?: boolean }[] = [
  { command: "sdd lint 002", result: "run" },
  { command: "node --version", result: "run" },
  { command: "git log --oneline -3", result: "run", git: true },
  { command: "npm install", result: "GUARD-BASH-001" },
  { command: "echo x > src/marker.txt", result: "GUARD-BASH-002" },
  { command: "git status && echo x > src/marker.txt", result: "GUARD-BASH-002" },
  { command: "echo $(cat src/app.ts)", result: "GUARD-BASH-002" },
];

test("C002-TS-406: command decisions — allowed commands run, others refused with the guard rule and no process started", async () => {
  await withServer(async (call, fx, s) => {
    for (const row of TS406) {
      if (row.git && !HAS_GIT) continue;
      const mark = spawnCalls(s.stderr).length;
      const r = await call({ command: row.command });
      if (row.result === "run") {
        assertCompleted(r);
        assert.ok(callsSince(s, mark).length >= 1, `${row.command}: no process was started`);
      } else {
        assertRefused(r, row.result);
        assert.match(r.structuredContent["message"] as string, new RegExp(`^${row.result}: Bash on .+ denied — .+\\. Allowed: `));
        assert.deepEqual(callsSince(s, mark), [], `${row.command}: a refused command started a process`);
      }
      assert.equal(fx.exists("src/marker.txt"), false, row.command);
    }
  });
});

test("C002-TS-406: node --version runs the PATH node without a shell and returns its version", async () => {
  await withServer(async (call, _fx, s) => {
    const mark = spawnCalls(s.stderr).length;
    const r = await call({ command: "node --version" });
    assertCompleted(r);
    assert.equal(r.structuredContent["exit_code"], 0);
    assert.match(r.structuredContent["stdout"] as string, /^v\d+\.\d+\.\d+\s*$/);
    const [c] = callsSince(s, mark);
    assert.equal(c?.fn, "spawn");
    assert.match(c!.file, WIN ? /[\\/]node\.exe$/i : /[\\/]node$/);
    assert.deepEqual(c!.args, ["--version"]);
    assert.equal(c!.shell, false);
  });
});

// C002-TS-660 (C002-T-063, item g) — the literal ${CLAUDE_PLUGIN_DATA} is not expanded by the command tool
// (decideBash(…, { expands: false }), commit 5b4392b): refused, no folder of that name, no Serena config
// under the data folder. A temporary folder stands for C:/fx-data.
const TS660: { env: "set" | "unset"; command: string }[] = [
  { env: "set", command: 'sdd serena-config "${CLAUDE_PLUGIN_DATA}"' },
  { env: "set", command: "sdd serena-config ${CLAUDE_PLUGIN_DATA}" },
  { env: "set", command: 'sdd serena-launch "${CLAUDE_PLUGIN_DATA}" -- start-mcp-server' },
  { env: "unset", command: 'sdd serena-config "${CLAUDE_PLUGIN_DATA}"' },
];

/** Every file or folder under `dir` whose name is `name` (recursively; `.git` skipped). */
function namedUnder(dir: string, name: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === ".git") continue;
      if (e.name === name) out.push(join(d, e.name));
      if (e.isDirectory()) walk(join(d, e.name));
    }
  };
  walk(dir);
  return out;
}

for (const row of TS660)
  test(`C002-TS-660 (C002-TC-660): CLAUDE_PLUGIN_DATA ${row.env === "set" ? "set to the fx-data folder" : "unset"}, ${row.command} (dialect bash) → GUARD-BASH-001; no \${CLAUDE_PLUGIN_DATA} folder, no serena_config.yml`, async () => {
    const data = stubDir();
    try {
      await withServer(
        async (call, fx, s) => {
          const mark = spawnCalls(s.stderr).length;
          const r = await call({ command: row.command, dialect: "bash" });
          assertRefused(r, "GUARD-BASH-001");
          assert.deepEqual(callsSince(s, mark), [], "no process started");
          assert.deepEqual(namedUnder(fx.root, "${CLAUDE_PLUGIN_DATA}"), [], "no file or folder named ${CLAUDE_PLUGIN_DATA} in fx-srv");
          assert.deepEqual(namedUnder(data.dir, "serena_config.yml"), [], "no serena_config.yml under the data folder");
        },
        { env: { CLAUDE_PLUGIN_DATA: row.env === "set" ? data.dir.replace(/\\/g, "/") : undefined } },
      );
    } finally {
      data.cleanup();
    }
  });

// C002-TS-641 — the dialect argument.
const TS641: { dialect: string; command: (fx: Fx) => string; result: "run" | "GUARD-BASH-001" | "GUARD-BASH-002" | "ERR-MCP-001" }[] = [
  { dialect: "powershell", command: () => "sdd status", result: "run" },
  { dialect: "powershell", command: () => "Remove-Item -Recurse src", result: "GUARD-BASH-001" },
  { dialect: "powershell", command: () => "sdd status > src/marker.txt", result: "GUARD-BASH-002" },
  { dialect: "powershell", command: () => "sdd serena-launch src -- start-mcp-server", result: "GUARD-BASH-001" },
  { dialect: "bash", command: () => "sdd serena-config src", result: "GUARD-BASH-001" },
  { dialect: "bash", command: (fx) => `sdd serena-config ${fx.abs(".sdd")}`, result: "GUARD-BASH-001" },
  { dialect: "zsh", command: () => "sdd status", result: "ERR-MCP-001" },
];

test("C002-TS-641: command decisions with the dialect argument; src/app.ts unchanged, no marker, no process for a refusal", async () => {
  await withServer(async (call, fx, s) => {
    for (const row of TS641) {
      const command = row.command(fx);
      const mark = spawnCalls(s.stderr).length;
      const r = await call({ command, dialect: row.dialect });
      if (row.result === "run") {
        assertCompleted(r);
        assert.equal(r.structuredContent["exit_code"], 0, JSON.stringify(r));
        assert.ok((r.structuredContent["stdout"] as string).length > 0, JSON.stringify(r));
        const [c] = callsSince(s, mark);
        assert.equal(c?.file, process.execPath, JSON.stringify(c));
        assert.match(c!.args[0]!, /[\\/]sdd\.mjs$/);
        assert.deepEqual(c!.args.slice(1), ["status"]);
      } else {
        assertRefused(r, row.result);
        if (row.result !== "ERR-MCP-001") {
          const tool = row.dialect === "powershell" ? "PowerShell" : "Bash";
          assert.match(r.structuredContent["message"] as string, new RegExp(`^${row.result}: ${tool} on `));
        } else assert.match(r.structuredContent["message"] as string, /^invalid arguments for run_command: \/dialect /);
        assert.deepEqual(callsSince(s, mark), [], `${command}: a refused command started a process`);
      }
      assert.equal(fx.read("src/app.ts"), "export const app = 1;\n", command);
      assert.equal(fx.exists("src/marker.txt"), false, command);
    }
  });
});

// C002-TS-642 — an allowed command whose executable cannot start without a shell.
test("C002-TS-642: ast-grep only as a .cmd shim → ERR-MCP-006, the shim records no start", { skip: !WIN && "a .cmd shim is a Windows case" }, async () => {
  const stub = stubDir();
  try {
    writeFileSync(join(stub.dir, "ast-grep.cmd"), `@echo off\r\necho started>> "%~dp0starts.txt"\r\n`);
    await withServer(
      async (call, _fx, s) => {
        const mark = spawnCalls(s.stderr).length;
        const r = await call({ command: "ast-grep --version" });
        assertRefused(r, "ERR-MCP-006");
        assert.equal(r.structuredContent["message"], 'could not start "ast-grep": only a .cmd or .bat shim was found');
        assert.deepEqual(callsSince(s, mark), []);
        assert.equal(existsSync(join(stub.dir, "starts.txt")), false, "the shim was started");
      },
      { env: { [PATH_KEY]: stub.dir } },
    );
  } finally {
    stub.cleanup();
  }
});

test("C002-TS-642: ast-grep not on PATH → ERR-MCP-006 'not found on PATH', no process, no marker", async () => {
  const stub = stubDir();
  try {
    await withServer(
      async (call, fx, s) => {
        const mark = spawnCalls(s.stderr).length;
        const r = await call({ command: "ast-grep --version" });
        assertRefused(r, "ERR-MCP-006");
        assert.equal(r.structuredContent["message"], 'could not start "ast-grep": not found on PATH');
        assert.deepEqual(callsSince(s, mark), []);
        assert.equal(fx.exists("src/marker.txt"), false);
      },
      { env: { [PATH_KEY]: stub.dir } },
    );
  } finally {
    stub.cleanup();
  }
});

// C002-TS-407 — successful command.
test("C002-TS-407: git rev-parse --is-inside-work-tree → exit 0, stdout true, empty stderr", { skip: !HAS_GIT && "git is not installed" }, async () => {
  await withServer(async (call) => {
    const r = await call({ command: "git rev-parse --is-inside-work-tree" });
    assertCompleted(r);
    assert.equal(r.structuredContent["exit_code"], 0);
    assert.equal((r.structuredContent["stdout"] as string).trim(), "true");
    assert.equal(r.structuredContent["stderr"], "");
    assert.deepEqual(r.structuredContent["truncated"], { stdout: false, stderr: false });
    assert.equal(typeof r.structuredContent["duration_ms"], "number");
  });
});

// C002-TS-408 — failing command.
test("C002-TS-408: sdd lint 999 → its non-zero exit code and standard error, not an error result", async () => {
  await withServer(async (call) => {
    const r = await call({ command: "sdd lint 999" });
    assertCompleted(r);
    assert.notEqual(r.structuredContent["exit_code"], 0);
    assert.ok((r.structuredContent["stderr"] as string).length > 0, JSON.stringify(r));
    assert.match(r.content[0]!.text, /^exit [1-9]\d*\n--- stdout ---\n/);
  });
});

// C002-TS-409 — another sdd on PATH.
test("C002-TS-409: an sdd first on PATH is never used; sdd --version prints the server's package version", async () => {
  const stub = stubDir();
  try {
    writeFileSync(join(stub.dir, "sdd.cmd"), "@echo 0.0.1-fake\r\n");
    writeFileSync(join(stub.dir, "sdd"), "#!/bin/sh\necho 0.0.1-fake\n");
    chmodSync(join(stub.dir, "sdd"), 0o755);
    await withServer(
      async (call, _fx, s) => {
        const mark = spawnCalls(s.stderr).length;
        const r = await call({ command: "sdd --version" });
        assertCompleted(r);
        assert.equal((r.structuredContent["stdout"] as string).trim(), VERSION);
        const [c] = callsSince(s, mark);
        assert.equal(c?.file, process.execPath);
        assert.match(c!.args[0]!, /[\\/]sdd\.mjs$/);
      },
      { env: { [PATH_KEY]: `${stub.dir}${delimiter}${process.env[PATH_KEY] ?? ""}` } },
    );
  } finally {
    stub.cleanup();
  }
});

/** A PATH stub `sdd` (`sdd.cmd` on Windows, a shell script elsewhere) that appends a line to `starts.txt` beside it. */
function recordingSdd(dir: string): void {
  writeFileSync(join(dir, "sdd.cmd"), `@echo off\r\necho started>> "%~dp0starts.txt"\r\n`);
  writeFileSync(join(dir, "sdd"), `#!/bin/sh\necho started >> "$(dirname "$0")/starts.txt"\n`);
  chmodSync(join(dir, "sdd"), 0o755);
}

// C002-TS-423 — own CLI not found beside the server (C002-TC-423, C002-T-061).
test("C002-TS-423: the package's scripts/sdd.mjs deleted → ERR-MCP-006 'not found beside the server (<absolute path>)', no PATH sdd started", async () => {
  const b = await serverBundle();
  const pkg = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-pkg-sdd-")));
  const stub = stubDir();
  try {
    // An unpacked package whose scripts/ holds the server but not its CLI (deleted before the start).
    mkdirSync(join(pkg, "scripts"));
    const server = join(pkg, "scripts", "sdd-mcp.mjs");
    copyFileSync(b.file, server);
    copyFileSync(join(dirname(b.file), "sdd.mjs"), join(pkg, "scripts", "sdd.mjs"));
    rmSync(join(pkg, "scripts", "sdd.mjs"));
    recordingSdd(stub.dir);
    await withServer(
      async (call, _fx, s) => {
        const mark = spawnCalls(s.stderr).length;
        const r = await call({ command: "sdd status" });
        assertRefused(r, "ERR-MCP-006");
        const message = r.structuredContent["message"] as string;
        assert.ok(message.startsWith('could not start "sdd": not found beside the server ('), message);
        assert.equal(message, `could not start "sdd": not found beside the server (${join(pkg, "scripts", "sdd.mjs")})`);
        assert.ok(isAbsolute(message.slice(message.indexOf("(") + 1, -1)), message);
        assert.deepEqual(callsSince(s, mark), [], "a process was started");
        assert.equal(existsSync(join(stub.dir, "starts.txt")), false, "the PATH sdd was started");
      },
      { serverFile: server, env: { [PATH_KEY]: `${stub.dir}${delimiter}${process.env[PATH_KEY] ?? ""}` } },
    );
  } finally {
    stub.cleanup();
    rmSync(pkg, { recursive: true, force: true });
  }
});

// C002-TS-424 — the plugin-root variable reaches node as literal text (C002-TC-424, C002-T-061).
test("C002-TS-424: node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs status → node's non-zero exit naming the literal variable; the plugin's sdd.mjs records no start", async () => {
  const plugin = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-plugin-")));
  try {
    mkdirSync(join(plugin, "scripts"));
    const starts = join(plugin, "starts.txt");
    writeFileSync(join(plugin, "scripts", "sdd.mjs"), `import { appendFileSync } from "node:fs";\nappendFileSync(${JSON.stringify(starts)}, "started\\n");\n`);
    await withServer(
      async (call, _fx, s) => {
        const mark = spawnCalls(s.stderr).length;
        const r = await call({ command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs status" });
        assertCompleted(r);
        assert.notEqual(r.structuredContent["exit_code"], 0, JSON.stringify(r));
        assert.ok((r.structuredContent["stderr"] as string).includes("${CLAUDE_PLUGIN_ROOT}"), JSON.stringify(r));
        const [c] = callsSince(s, mark);
        assert.match(c!.file, WIN ? /[\\/]node\.exe$/i : /[\\/]node$/);
        assert.deepEqual(c!.args, ["${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs", "status"]);
        assert.equal(existsSync(starts), false, "the plugin's scripts/sdd.mjs was started");
      },
      { env: { CLAUDE_PLUGIN_ROOT: plugin.replace(/\\/g, "/") } },
    );
  } finally {
    rmSync(plugin, { recursive: true, force: true });
  }
});

// C002-TS-352 — the install command through the command tool.
test("C002-TS-352: sdd install copilot through run_command → GUARD-BASH-001, no process started, no .github/ or .vscode/", async () => {
  const pkg = join(tmpdir(), "sdd-fx-pkg-cp-absent").replace(/\\/g, "/");
  await withServer(
    async (call, fx, s) => {
      const mark = spawnCalls(s.stderr).length;
      const r = await call({ command: `sdd install copilot --package ${pkg}` });
      assertRefused(r, "GUARD-BASH-001");
      assert.match(r.structuredContent["message"] as string, /sdd install writes outside \.sdd\/; P-03 runs it in their own terminal/);
      assert.deepEqual(callsSince(s, mark), [], "the install command started a process");
      assert.equal(fx.exists(".github"), false);
      assert.equal(fx.exists(".vscode"), false);
      assert.equal(fx.exists(".sdd"), false);
    },
    { fixture: fxCpInstall },
  );
});

// Pipe-only filters, applied in process (C002-IF-002 §5.2 step 3).
test("pipe-only segments run in process: only the first segment starts a process", { skip: !HAS_GIT && "git is not installed" }, async () => {
  await withServer(async (call, _fx, s) => {
    let mark = spawnCalls(s.stderr).length;
    const sorted = await call({ command: "git ls-files | sort -r | head -n 2" });
    assertCompleted(sorted);
    assert.equal(sorted.structuredContent["stdout"], "src/app.ts\nsrc/.keep\n");
    const calls = callsSince(s, mark);
    assert.equal(calls.length, 1, JSON.stringify(calls));
    assert.deepEqual(calls[0]!.args, ["ls-files"]);
    mark = spawnCalls(s.stderr).length;
    const counted = await call({ command: "git ls-files | wc -l" });
    assert.equal(counted.structuredContent["stdout"], "4\n");
    assert.equal(callsSince(s, mark).length, 1);
  });
});

test("applyFilter: head, tail, wc -l, sort and uniq as C001-IF-07 §3 lists them", () => {
  const text = "b\na\nc\na\na\n10\n9\n";
  assert.equal(applyFilter(text, ["head", "-n", "2"]), "b\na\n");
  assert.equal(applyFilter(text, ["head", "-3"]), "b\na\nc\n");
  assert.equal(applyFilter(text, ["head", "-n1"]), "b\n");
  assert.equal(applyFilter(text, ["tail", "-n", "2"]), "10\n9\n");
  assert.equal(applyFilter(text, ["tail", "-n", "0"]), "");
  assert.equal(applyFilter("1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n", ["head"]), "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n");
  assert.equal(applyFilter(text, ["wc", "-l"]), "7\n");
  assert.equal(applyFilter("no newline", ["wc", "-l"]), "0\n");
  assert.equal(applyFilter(text, ["sort"]), "10\n9\na\na\na\nb\nc\n");
  assert.equal(applyFilter(text, ["sort", "-u"]), "10\n9\na\nb\nc\n");
  assert.equal(applyFilter("10\n9\n100\n", ["sort", "-n"]), "9\n10\n100\n");
  assert.equal(applyFilter("10\n9\n100\n", ["sort", "-n", "-r"]), "100\n10\n9\n");
  assert.equal(applyFilter("B\na\nC\n", ["sort", "-f"]), "a\nB\nC\n");
  assert.equal(applyFilter("a\na\nb\na\n", ["uniq"]), "a\nb\na\n");
  assert.equal(applyFilter("a\na\nb\na\n", ["uniq", "-c"]), "      2 a\n      1 b\n      1 a\n");
  assert.equal(applyFilter("a\na\nb\n", ["uniq", "-d"]), "a\n");
  assert.equal(applyFilter("a\na\nb\n", ["uniq", "-u"]), "b\n");
  assert.equal(applyFilter("", ["sort"]), "");
  assert.throws(() => applyFilter("x\n", ["cat"]));
});

/**
 * A native stand-in for `git` first on PATH: a link to (or copy of) the Node.js executable, so that
 * `git log` runs the script `log` and `git show` the script `show` of the fixture root.
 */
function fakeGit(fxRoot: string, scripts: Record<string, string>): { path: string; cleanup: () => void } {
  const stub = stubDir();
  const target = join(stub.dir, WIN ? "git.exe" : "git");
  try {
    linkSync(process.execPath, target);
  } catch {
    copyFileSync(process.execPath, target);
    chmodSync(target, 0o755);
  }
  for (const [name, body] of Object.entries(scripts)) writeFileSync(join(fxRoot, name), body);
  return { path: `${stub.dir}${delimiter}${process.env[PATH_KEY] ?? ""}`, cleanup: stub.cleanup };
}

test("output caps and timeout: each stream cut at 1,048,576 characters; at timeout_ms the process is killed", async () => {
  const fxf = fxSrv();
  const g = fakeGit(fxf.root, {
    show: `process.stdout.write("a".repeat(${STREAM_CAP + 1000})); process.stderr.write("b".repeat(${STREAM_CAP + 10}));`,
    log: `process.stdout.write("started\\n"); setInterval(() => {}, 1000);`,
  });
  try {
    await withServer(
      async (call) => {
        const big = await call({ command: "git show" });
        assertCompleted(big);
        assert.equal(big.structuredContent["exit_code"], 0);
        assert.equal((big.structuredContent["stdout"] as string).length, STREAM_CAP);
        assert.equal((big.structuredContent["stderr"] as string).length, STREAM_CAP);
        assert.deepEqual(big.structuredContent["truncated"], { stdout: true, stderr: true });

        const started = Date.now();
        const slow = await call({ command: "git log", timeout_ms: 1000 });
        assert.equal(slow.isError, undefined, JSON.stringify(slow));
        assert.equal(slow.structuredContent["status"], "timed_out");
        assert.equal(slow.structuredContent["exit_code"], null);
        assert.match(slow.content[0]!.text, /^timed out after 1000 ms\n--- stdout ---\n/);
        assert.ok(Date.now() - started < 8000, "the timed-out process was not killed in time");
        assert.ok((slow.structuredContent["duration_ms"] as number) >= 900);
      },
      { fixture: () => fxf, env: { [PATH_KEY]: g.path } },
    );
  } finally {
    g.cleanup();
  }
});
