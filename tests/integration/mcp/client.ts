// Test client of the sdd MCP server (C002-T-016): runs the built server bundle (C002-T-021), starts it
// as a child process with
// tests/no-network.mjs preloaded (C002-NFR-205) and speaks newline-delimited JSON-RPC over its
// standard input and output, keeping every byte the process writes.
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../../helpers.ts";

const ROOT = repoRoot();
const NO_NETWORK = pathToFileURL(join(ROOT, "tests", "no-network.mjs")).href;

/** A preload that reports any listening socket on standard error as `LISTEN-ATTEMPT` (C002-TS-414). */
const NO_LISTEN = `import net from "node:net";
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...a) { process.stderr.write("LISTEN-ATTEMPT\\n"); return listen.apply(this, a); };
`;

let bundled: { file: string; noListen: string; dir: string } | undefined;

/**
 * The built server (`build/npm/sdd-mcp.mjs`, C002-T-021) with the plugin's `scripts/sdd.mjs` beside it,
 * as in the shipped package (`<package>/scripts/`, C002-REQ-407, C002-ADR-004): the command tool runs
 * `sdd …` with it. Both are copied to a temporary folder (once per process).
 */
export async function serverBundle(): Promise<{ file: string; noListen: string }> {
  if (bundled) return bundled;
  const server = join(ROOT, "build", "npm", "sdd-mcp.mjs");
  const cli = join(ROOT, "plugins", "architect", "scripts", "sdd.mjs");
  for (const f of [server, cli]) if (!existsSync(f)) throw new Error(`${f} is missing: run \`npm run build\` first`);
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-mcp-")));
  const file = join(dir, "sdd-mcp.mjs");
  copyFileSync(server, file);
  copyFileSync(cli, join(dir, "sdd.mjs"));
  const noListen = join(dir, "no-listen.mjs");
  writeFileSync(noListen, NO_LISTEN);
  bundled = { file, noListen, dir };
  process.once("exit", () => rmSync(dir, { recursive: true, force: true }));
  return bundled;
}

export const VERSION = (JSON.parse(readFileSync(join(ROOT, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;

function nodeArgs(b: { file: string; noListen: string }, args: string[], preload: string[] = []): string[] {
  return [`--import=${NO_NETWORK}`, `--import=${pathToFileURL(b.noListen).href}`, ...preload.map((p) => `--import=${pathToFileURL(p).href}`), b.file, ...args];
}

function childEnv(env: Record<string, string | undefined>): Record<string, string | undefined> {
  return { ...process.env, SDD_DEBUG: undefined, SDD_TEST_FAULT: undefined, ...env };
}

/** Runs the server to completion with the given standard input. */
export async function runServerSync(args: string[], opts: { cwd: string; input?: string; env?: Record<string, string | undefined> }): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const b = await serverBundle();
  const r = spawnSync(process.execPath, nodeArgs(b, args), { cwd: opts.cwd, env: childEnv(opts.env ?? {}), input: opts.input ?? "", encoding: "utf8", timeout: 20000 });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

export interface RpcMessage {
  jsonrpc: string;
  id?: string | number | null;
  method?: string;
  result?: Record<string, unknown>;
  error?: { code: number; message: string; data?: unknown };
}

export class McpSession {
  stdout = "";
  stderr = "";
  private nextId = 1;
  private waiters: { match: (m: RpcMessage) => boolean; resolve: (m: RpcMessage) => void }[] = [];
  readonly messages: RpcMessage[] = [];
  readonly exited: Promise<number | null>;

  private constructor(private readonly child: ChildProcess) {
    child.stdout!.setEncoding("utf8");
    child.stderr!.setEncoding("utf8");
    let pending = "";
    child.stdout!.on("data", (s: string) => {
      this.stdout += s;
      pending += s;
      for (let i = pending.indexOf("\n"); i >= 0; i = pending.indexOf("\n")) {
        const line = pending.slice(0, i);
        pending = pending.slice(i + 1);
        let m: RpcMessage;
        try {
          m = JSON.parse(line) as RpcMessage;
        } catch {
          continue; // reported by the stdout assertions
        }
        this.messages.push(m);
        const w = this.waiters.findIndex((x) => x.match(m));
        if (w >= 0) this.waiters.splice(w, 1)[0]!.resolve(m);
      }
    });
    child.stderr!.on("data", (s: string) => (this.stderr += s));
    this.exited = new Promise((resolve) => child.on("exit", (code) => resolve(code)));
  }

  /** `preload`: extra modules loaded with `--import` before the server (absolute file paths). */
  static async start(args: string[], opts: { cwd: string; env?: Record<string, string | undefined>; preload?: string[] }): Promise<McpSession> {
    const b = await serverBundle();
    return new McpSession(spawn(process.execPath, nodeArgs(b, args, opts.preload), { cwd: opts.cwd, env: childEnv(opts.env ?? {}), stdio: ["pipe", "pipe", "pipe"] }));
  }

  /** Writes one raw line (a newline is added). */
  writeLine(line: string): void {
    this.child.stdin!.write(line + "\n");
  }

  /** The next message from the server that `match` accepts (fails after 10 s). */
  next(match: (m: RpcMessage) => boolean, what: string): Promise<RpcMessage> {
    const seen = this.messages.find(match);
    if (seen) {
      this.messages.splice(this.messages.indexOf(seen), 1);
      return Promise.resolve(seen);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`no ${what} within 10 s; stdout=${this.stdout} stderr=${this.stderr}`)), 10000);
      this.waiters.push({
        match,
        resolve: (m) => {
          clearTimeout(timer);
          this.messages.splice(this.messages.indexOf(m), 1);
          resolve(m);
        },
      });
    });
  }

  /** Sends a request and waits for the response with its id. */
  request(method: string, params: Record<string, unknown> = {}): Promise<RpcMessage> {
    const id = this.nextId++;
    this.writeLine(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    return this.next((m) => m.id === id && (m.result !== undefined || m.error !== undefined), `response to ${method} #${id}`);
  }

  notify(method: string, params: Record<string, unknown> = {}): void {
    this.writeLine(JSON.stringify({ jsonrpc: "2.0", method, params }));
  }

  /** `initialize` and `notifications/initialized`; returns the initialize result. */
  async initialize(): Promise<Record<string, unknown>> {
    const r = await this.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "sdd-test", version: "1.0.0" } });
    if (!r.result) throw new Error(`initialize failed: ${JSON.stringify(r)}`);
    this.notify("notifications/initialized");
    return r.result;
  }

  /** Closes standard input and waits for the exit code. */
  async close(): Promise<number | null> {
    this.child.stdin!.end();
    return this.exited;
  }

  kill(): void {
    this.child.kill();
  }
}

/** A throwaway repository for the server ("fx-srv"): `.sdd/002-x/a.md` holds "status: draft". */
export function serverWorkspace(): { root: string; cleanup: () => void } {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-srv-")));
  const files: Record<string, string> = { ".sdd/SDD.md": "# SDD workspace\n", ".sdd/002-x/a.md": "status: draft\n", "src/.keep": "" };
  for (const [rel, content] of Object.entries(files)) {
    const p = join(root, ...rel.split("/"));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
