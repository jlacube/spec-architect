// sdd MCP server (C002-COMP-005, C002-IF-002): `sdd-mcp --profile files|shell [--root <dir>]`.
// The MCP SDK's low-level server on its stdio transport (C002-ADR-001): the SDK negotiates the protocol
// version and runs the lifecycle; this module owns the profile's tool list with the served schemas
// (C002-REQ-415), the error codes, and one `tools/call` at a time in arrival order (C001-CON-11).
//
// Standard output carries JSON-RPC messages only (C002-REQ-410): the transport is its only writer, and
// console output of any module is sent to standard error. The SDK transport reports an unparsable line
// or a JSON value that is not a JSON-RPC message only through its error callback, so the server writes
// the `-32700` or `-32600` response itself. Closing standard input ends the process with exit code 0,
// before or after initialisation (C002-REQ-411). Exit 2: usage error (ERR-MCP-007); exit 3: fatal
// error at start, no tool served (C002-IF-002 §1).
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport, TransportSendOptions } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type CallToolResult,
  type JSONRPCMessage,
  type MessageExtraInfo,
} from "@modelcontextprotocol/sdk/types.js";
import { normalisePath } from "../io/paths.ts";
import { VERSION } from "../version.ts";
import { findWorkspace } from "../workspace/find.ts";
import { HANDLERS, type ToolContext } from "./handlers.ts";
import { loadToolSchemas, PROFILE_TOOLS, StartError, type Profile, type ToolName, type ToolSchemas } from "./schemas.ts";

const USAGE = "usage: sdd-mcp --profile files|shell [--root <dir>]";

type Data = Record<string, string | number | boolean | null | undefined>;

export interface Options {
  profile: Profile;
  root?: string;
}

class UsageError extends Error {}

/** Parses the command line (C002-IF-002 §1); throws UsageError (ERR-MCP-007). */
export function parseArgs(argv: readonly string[]): Options {
  let profile: string | undefined;
  let root: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    const eq = a.indexOf("=");
    const name = a.startsWith("--") && eq > 0 ? a.slice(0, eq) : a;
    const inline = a.startsWith("--") && eq > 0 ? a.slice(eq + 1) : undefined;
    if (name !== "--profile" && name !== "--root") throw new UsageError(`unknown argument ${JSON.stringify(a)}`);
    const value = inline ?? argv[++i];
    if (value === undefined || value === "") throw new UsageError(`${name} needs a value`);
    if (name === "--profile") profile = value;
    else root = value;
  }
  if (profile === undefined) throw new UsageError("--profile is missing");
  if (profile !== "files" && profile !== "shell") throw new UsageError(`unknown profile ${JSON.stringify(profile)}`);
  if (root !== undefined) {
    let dir = false;
    try {
      dir = statSync(root).isDirectory();
    } catch {
      dir = false;
    }
    if (!dir) throw new UsageError(`--root ${JSON.stringify(root)} is not a folder`);
  }
  return root === undefined ? { profile } : { profile, root };
}

/** The repository root from a start folder: the first folder upward that holds `.sdd/`, else the folder (§3). */
function rootFrom(start: string): string {
  const dir = normalisePath(start);
  return findWorkspace(dir) ?? dir;
}

function debugWriter(env: NodeJS.ProcessEnv): (event: string, data?: Data) => void {
  const on = (env["SDD_DEBUG"] ?? "") !== "" && env["SDD_DEBUG"] !== "0";
  const started = Date.now();
  return (event, data = {}) => {
    if (!on) return;
    const kv = Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${typeof v === "string" && /\s/.test(v) ? JSON.stringify(v) : String(v)}`)
      .join(" ");
    process.stderr.write(`sdd-mcp: +${Date.now() - started}ms ${event}${kv ? " " + kv : ""}\n`);
  };
}

/** Sends console output of every module to standard error, so standard output stays JSON-RPC only. */
function consoleToStderr(): void {
  const toErr = (...args: unknown[]): void => console.error(...args);
  console.log = toErr;
  console.info = toErr;
  console.debug = toErr;
  console.trace = toErr;
  console.dir = toErr;
  console.table = toErr;
}

/**
 * The SDK's stdio transport, plus the JSON-RPC error responses for malformed input: the SDK only
 * reports a line it cannot parse (SyntaxError) or validate as a JSON-RPC message (ZodError) to its
 * error callback and answers nothing.
 */
export class LineTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: <T extends JSONRPCMessage>(message: T, extra?: MessageExtraInfo) => void;
  private readonly inner: StdioServerTransport;

  constructor(private readonly debug: (event: string, data?: Data) => void) {
    this.inner = new StdioServerTransport();
  }

  async start(): Promise<void> {
    this.inner.onmessage = (m) => this.onmessage?.(m);
    this.inner.onclose = () => this.onclose?.();
    this.inner.onerror = (e) => {
      const code = e instanceof SyntaxError ? ErrorCode.ParseError : e?.name === "ZodError" ? ErrorCode.InvalidRequest : undefined;
      if (code === undefined) {
        this.onerror?.(e);
        return;
      }
      const message = code === ErrorCode.ParseError ? "Parse error" : "Invalid Request";
      this.debug("malformed-message", { code, reason: e.message.split("\n")[0] });
      const response = { jsonrpc: "2.0", id: null, error: { code, message } } as unknown as JSONRPCMessage;
      this.inner.send(response).catch((err: unknown) => this.onerror?.(err instanceof Error ? err : new Error(String(err))));
    };
    await this.inner.start();
  }

  send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    return this.inner.send(message);
  }

  close(): Promise<void> {
    return this.inner.close();
  }
}

/** A FIFO queue of one slot: each task starts when the previous one has settled. */
function serialQueue(): { run<T>(task: () => Promise<T>): Promise<T>; idle(): Promise<void> } {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const next = tail.then(task, task);
      tail = next.catch(() => undefined);
      return next;
    },
    idle: () => tail.then(() => undefined),
  };
}

/** The first `file:` root the client offers (C002-IF-002 §3 step 2), or null. */
async function clientRoot(server: Server): Promise<string | null> {
  const { roots } = await server.listRoots();
  const uri = roots.find((r) => r.uri.startsWith("file:"))?.uri;
  return uri === undefined ? null : fileURLToPath(uri);
}

export function createServer(opts: Options, schemas: ToolSchemas, debug: (event: string, data?: Data) => void): { server: Server; idle(): Promise<void> } {
  const server = new Server({ name: "sdd-mcp", version: VERSION }, { capabilities: { tools: { listChanged: false } } });
  const queue = serialQueue();
  const tools = new Set<string>(PROFILE_TOOLS[opts.profile]);

  // §3: --root, else the client's first root, else the working folder; fixed at initialisation.
  let root: Promise<string> = Promise.resolve(rootFrom(opts.root ?? process.cwd()));
  server.oninitialized = () => {
    const client = server.getClientVersion();
    debug("initialized", { client: client ? `${client.name}@${client.version}` : undefined });
    if (opts.root === undefined && server.getClientCapabilities()?.roots !== undefined) {
      root = clientRoot(server)
        .then((r) => rootFrom(r ?? process.cwd()))
        .catch((e: unknown) => {
          debug("roots-list-failed", { reason: e instanceof Error ? e.message : String(e) });
          return rootFrom(process.cwd());
        });
    }
    void root.then((r) => debug("root", { root: r }));
  };
  server.onerror = (e) => debug("protocol-error", { reason: e.message });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    debug("tools/list", { profile: opts.profile, tools: schemas.tools.map((t) => t.name).join(",") });
    return { tools: schemas.tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema, outputSchema: t.outputSchema })) };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const name = request.params.name;
    if (!tools.has(name)) {
      debug("tools/call-unknown", { tool: name, profile: opts.profile, code: ErrorCode.InvalidParams });
      throw new McpError(ErrorCode.InvalidParams, `unknown tool ${JSON.stringify(name)}: the ${opts.profile} profile serves ${[...tools].join(", ")}`);
    }
    const tool = name as ToolName;
    return queue.run(async () => {
      const ctx: ToolContext = { root: await root, schemas, debug };
      debug("tools/call", { tool });
      const result = await HANDLERS[tool]((request.params.arguments ?? {}) as Record<string, unknown>, ctx);
      const code = (result.structuredContent as { code?: string } | undefined)?.code;
      debug("tools/call-done", { tool, isError: result.isError === true, code });
      return result;
    });
  });

  return { server, idle: () => queue.idle() };
}

/** Runs the server; resolves with the exit code for a start failure, or keeps running until stdin closes. */
export async function main(argv: readonly string[], env: NodeJS.ProcessEnv = process.env): Promise<number | undefined> {
  consoleToStderr();
  const debug = debugWriter(env);
  let opts: Options;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    process.stderr.write(`sdd-mcp: ERR-MCP-007: ${USAGE}: ${e.message}\n`);
    return 2;
  }
  let schemas: ToolSchemas;
  try {
    schemas = loadToolSchemas(opts.profile);
  } catch (e) {
    if (!(e instanceof StartError)) throw e;
    process.stderr.write(`sdd-mcp: fatal: ${e.message}; no tool was served\n`);
    return 3;
  }
  debug("start", { version: VERSION, profile: opts.profile, root: opts.root, pid: process.pid });
  const { server, idle } = createServer(opts, schemas, debug);
  const transport = new LineTransport(debug);
  // C002-REQ-411: the host closes standard input to end the session; the running call completes first.
  process.stdin.once("end", () => {
    debug("stdin-closed");
    void idle()
      .then(() => server.close())
      .finally(() => {
        process.exitCode = 0;
      });
  });
  await server.connect(transport);
  return undefined;
}

main(process.argv.slice(2)).then(
  (code) => {
    if (code !== undefined) process.exitCode = code;
  },
  (e: unknown) => {
    process.stderr.write(`sdd-mcp: fatal: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
    process.exitCode = 3;
  },
);
