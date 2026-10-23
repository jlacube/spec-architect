// OpenCode session driver (C002-ADR-005 host process, C002-IF-010 §4; C002-T-042): starts the pinned
// host binary of the tested OpenCode as `opencode serve` on a loopback port, with a database of its own,
// and drives sessions through the JS SDK of the same release: session start, the event stream,
// permission and question replies, the messages of a session and the command list. Shared by the
// corpus replay (tests/replay/adapters/opencode-permissions.ts, loopback stub model) and the OpenCode
// eval runner (C002-T-044, real provider).
//
// Host process rules (S-07 facts F-7 … F-10):
//   - the binary is named by its absolute path in the harness configuration (`SDD_OPENCODE_BIN`, else
//     the REF-WIN default below); the `opencode` that PATH resolves is never started (F-7);
//   - `OPENCODE_DB` names a database file of the run, so the user's shared database is neither read nor
//     migrated (F-8); `isolate` also points the config, data, cache and state folders at run folders,
//     so no credential store is read (stub replay);
//   - auto-update, sharing and LSP downloads are off; with `isolate` the models fetch is off and every
//     non-loopback request goes to a closed proxy port (F-9);
//   - the driver only reads and returns the binary's version (`hostVersions()`); refusing another
//     version is the caller's decision (the replay adapter refuses, the eval runner records it).
// The SDK (Node.js 22.22.2 or later, F-10) is imported when a host starts, so that importing this
// module never needs it. The SDK's requests go through `untimedFetch` (node:http without timeouts):
// a prompt request answers only when the prompt has ended, and Node's own fetch drops a request whose
// response headers take longer than 300 s (undici `headersTimeout`; C002-T-056, a TS-634 session that
// ended with an empty error at 300 s). The session timeout of the caller bounds a session instead.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, createWriteStream } from "node:fs";
import { request as httpRequest } from "node:http";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { checkOpenRouterKey, defaultOpenRouterKeyFile, readOpenRouterKey } from "../key-usage.mjs";
import { Readable } from "node:stream";

/**
 * `fetch` for the SDK client over node:http with no headers or body timeout (loopback `opencode serve`
 * only). Honours the request's abort signal; the response body streams (the event stream included).
 * @param {Request} req
 * @returns {Promise<Response>}
 */
export async function untimedFetch(req) {
  const body = req.body ? Buffer.from(await req.arrayBuffer()) : null;
  const headers = Object.fromEntries(req.headers);
  if (body) headers["content-length"] = String(body.length);
  return new Promise((resolve, reject) => {
    const r = httpRequest(new URL(req.url), { method: req.method, headers, signal: req.signal ?? undefined }, (res) => {
      const h = new Headers();
      for (const [k, v] of Object.entries(res.headers)) for (const x of [v].flat()) if (x !== undefined) h.append(k, String(x));
      const empty = req.method === "HEAD" || [204, 205, 304].includes(res.statusCode ?? 0);
      if (empty) res.resume();
      resolve(new Response(empty ? null : /** @type {any} */ (Readable.toWeb(res)), { status: res.statusCode, statusText: res.statusMessage, headers: h }));
    });
    r.setTimeout(0);
    r.on("error", reject);
    r.end(body ?? undefined);
  });
}

/** A readable message of an SDK error value (an Error stringifies to "{}"), its cause included. */
export function errorText(e) {
  if (typeof e === "string") return e;
  if (e instanceof Error) {
    const cause = /** @type {any} */ (e).cause;
    return cause ? `${e.message} (cause: ${cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause)})` : e.message;
  }
  const s = JSON.stringify(e);
  return s === "{}" || s === undefined ? String(e) : s;
}

/** Configuration variable naming the pinned host binary (absolute path). */
export const OPENCODE_BIN_VAR = "SDD_OPENCODE_BIN";

/**
 * REF-WIN default of the pinned binary: the npm install of OpenCode 1.18.31
 * (`%APPDATA%\npm\node_modules\opencode-ai\bin\opencode.exe`). Never the `opencode` on PATH: on REF-WIN
 * Git Bash finds an older install (1.15.10) first (S-07 F-7). Null off Windows (set SDD_OPENCODE_BIN).
 */
export function defaultOpenCodeBinary(env = process.env) {
  if (process.platform !== "win32") return null;
  const appData = env.APPDATA ?? join(homedir(), "AppData", "Roaming");
  return join(appData, "npm", "node_modules", "opencode-ai", "bin", "opencode.exe");
}

/** The pinned binary's absolute path from the configuration; throws when it is missing, relative or absent. */
export function resolveOpenCodeBinary(env = process.env) {
  const configured = env[OPENCODE_BIN_VAR];
  const bin = configured && configured.trim() !== "" ? configured.trim() : defaultOpenCodeBinary(env);
  if (!bin) throw new Error(`no pinned OpenCode binary: set ${OPENCODE_BIN_VAR} to the absolute path of the tested opencode executable`);
  if (!isAbsolute(bin)) throw new Error(`${OPENCODE_BIN_VAR} must be an absolute path, not ${JSON.stringify(bin)} (the opencode on PATH is never used)`);
  if (!existsSync(bin)) throw new Error(`pinned OpenCode binary not found: ${bin} (${configured ? OPENCODE_BIN_VAR : "REF-WIN default"}; set ${OPENCODE_BIN_VAR})`);
  return bin;
}

/** The version the binary reports (`opencode --version`), trimmed; throws when it cannot be read. */
export function readOpenCodeVersion(bin, env = process.env) {
  const r = spawnSync(bin, ["--version"], { encoding: "utf8", env, windowsHide: true, timeout: 60_000 });
  const v = (r.stdout ?? "").trim().split(/\r?\n/).pop()?.trim() ?? "";
  if (r.error || r.status !== 0 || !/^\d+\.\d+\.\d+/.test(v)) throw new Error(`cannot read the version of ${bin}: ${r.error?.message ?? (r.stderr || v || `exit ${r.status}`)}`);
  return v;
}

/** Default file of the OpenRouter key of paid sessions (one line; never printed, logged or committed). */
export { defaultOpenRouterKeyFile };

/** A free loopback port. */
export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      srv.close(() => resolve(typeof address === "object" && address ? address.port : 0));
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PROVIDER_VARS = /^(OPENROUTER|ANTHROPIC|OPENAI|CLAUDE|GEMINI|GOOGLE_GENERATIVE|AWS_BEARER|AZURE_OPENAI|GROQ|MISTRAL|XAI|DEEPSEEK)/i;

/**
 * The environment of the host process. `runDir` holds the database (and, with `isolate`, the XDG
 * folders). `extra` is merged last (PATH prepends, variables of the caller).
 */
export function hostEnv({ runDir, isolate, extra = {}, base = process.env }) {
  const env = Object.fromEntries(Object.entries(base).filter(([k]) => !PROVIDER_VARS.test(k) && k !== "NODE_OPTIONS"));
  Object.assign(env, {
    OPENCODE_DB: join(runDir, "opencode.db"),
    OPENCODE_DISABLE_AUTOUPDATE: "1",
    OPENCODE_DISABLE_SHARE: "1",
    OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
    npm_config_audit: "false",
    npm_config_fund: "false",
  });
  if (isolate) {
    const xdg = join(runDir, "xdg");
    for (const d of ["config", "data", "cache", "state"]) mkdirSync(join(xdg, d), { recursive: true });
    Object.assign(env, {
      XDG_CONFIG_HOME: join(xdg, "config"),
      XDG_DATA_HOME: join(xdg, "data"),
      XDG_CACHE_HOME: join(xdg, "cache"),
      XDG_STATE_HOME: join(xdg, "state"),
      OPENCODE_DISABLE_MODELS_FETCH: "1",
      HTTP_PROXY: "http://127.0.0.1:9",
      HTTPS_PROXY: "http://127.0.0.1:9",
      http_proxy: "http://127.0.0.1:9",
      https_proxy: "http://127.0.0.1:9",
      NO_PROXY: "127.0.0.1,localhost",
      no_proxy: "127.0.0.1,localhost",
      npm_config_offline: "true",
    });
  }
  return { ...env, ...extra };
}

function killTree(child) {
  if (!child || child.exitCode !== null || child.pid === undefined) return;
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
    else child.kill("SIGKILL");
  } catch {
    // already gone
  }
}

/**
 * Starts the pinned host binary as `opencode serve` in `project` and returns the driver:
 *   { version, baseUrl, logFile, hostVersions(), shell(), run(options), commands(), stop() }
 * Options:
 *   bin           absolute path of the pinned binary (default: resolveOpenCodeBinary())
 *   project       the project folder OpenCode runs in (its `opencode.json`, `.opencode/`)
 *   runDir        folder of the run: database, XDG folders (isolate), server log
 *   isolate       true for the stub-model replay: no credential store, models fetch off, proxy closed
 *   paid          { keyFile?, key? }: a session against OpenRouter; the key (`key`, already read, else the
 *                 key file's content with the white space at its ends removed) goes to the host as
 *                 OPENROUTER_API_KEY; refused by the key check of C002-IF-010 §4 (missing file; an
 *                 empty, short or JSON-escaped value)
 *   env           extra variables of the host process
 *   startTimeoutMs  default 90 s
 */
/**
 * The environment of the host process of `startOpenCode` (`runDir`, `isolate`, `paid`, `env` as there):
 * a paid session takes the OpenRouter key from the key file as OPENROUTER_API_KEY and is refused, before
 * any process starts, by the key check of C002-IF-010 §4 (Provider key, Key check): one refusal text for a
 * missing file, one for an empty value, a value shorter than 20 characters or one that JSON escapes.
 */
export function hostProcessEnv(options) {
  mkdirSync(options.runDir, { recursive: true });
  const extra = { ...(options.env ?? {}) };
  if (options.paid) {
    const keyFile = options.paid.keyFile ?? defaultOpenRouterKeyFile();
    extra.OPENROUTER_API_KEY = options.paid.key !== undefined ? checkOpenRouterKey(options.paid.key, keyFile) : readOpenRouterKey(keyFile);
  }
  return hostEnv({ runDir: options.runDir, isolate: options.isolate === true, extra });
}

export async function startOpenCode(options) {
  const bin = options.bin ?? resolveOpenCodeBinary();
  if (!isAbsolute(bin)) throw new Error(`the pinned OpenCode binary must be an absolute path: ${bin}`);
  if (!existsSync(bin)) throw new Error(`pinned OpenCode binary not found: ${bin}`);
  const { project, runDir } = options;
  const env = hostProcessEnv(options);
  const version = readOpenCodeVersion(bin, env);
  const { createOpencodeClient } = await import("@opencode-ai/sdk/v2/client");

  const port = await freePort();
  const log = createWriteStream(join(runDir, "opencode-serve.log"), { flags: "a" });
  const child = spawn(bin, ["serve", "--port", String(port), "--hostname", "127.0.0.1", "--print-logs", "--log-level", "INFO"], {
    cwd: project,
    env,
    shell: false,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  let exited = null;
  child.on("exit", (code, signal) => (exited = { code, signal }));
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + (options.startTimeoutMs ?? 90_000);
  for (;;) {
    if (exited) throw new Error(`opencode serve exited at start (code ${exited.code}); see ${join(runDir, "opencode-serve.log")}`);
    try {
      const r = await fetch(`${baseUrl}/global/health`, { signal: AbortSignal.timeout(5000) });
      if (r.ok) break;
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) {
      killTree(child);
      throw new Error(`opencode serve did not answer on ${baseUrl} within the start timeout`);
    }
    await sleep(250);
  }
  const client = createOpencodeClient({ baseUrl, directory: project, fetch: untimedFetch });

  // One event stream; permission and question requests go to the policy of the session that asked.
  // A child session (a subagent started by the `task` tool, `info.parentID` set) shares the context of
  // its root session: the same policy, event list and `onEvent` callback (C002-T-044).
  const contexts = new Map();
  const stream = new AbortController();
  const pump = (async () => {
    const sub = await client.event.subscribe(undefined, { signal: stream.signal });
    for await (const ev of sub.stream) await routeEvent(client, contexts, ev);
  })().catch(() => {
    // the stream ends when the host stops
  });

  return {
    version,
    baseUrl,
    bin,
    logFile: join(runDir, "opencode-serve.log"),
    hostVersions: () => ({ opencode: version }),
    /** The executable of OpenCode's shell tool, from the server log once a shell call ran; else null. */
    shell() {
      try {
        const m = /message="shell tool using shell" shell="((?:[^"\\]|\\.)*)"/.exec(readFileSync(join(runDir, "opencode-serve.log"), "utf8"));
        return m ? m[1].replace(/\\\\/g, "\\") : null;
      } catch {
        return null;
      }
    },
    /**
     * One session: create it, prompt `agent` with `text` (and `model` { providerID, modelID } when
     * given) — or, with `command` { name, arguments }, run that command of the server (`session.command`,
     * as the TUI does for `/name arguments`) — answer requests by
     * `permission(request) → "once" | "always" | "reject"` and `question(request) → answers | null`
     * (null dismisses), pass every event of the session and its child sessions to `onEvent(event, rootSessionID)`, and
     * return { sessionID, messages, parts, events, children, error, aborted } once the prompt has ended.
     * `children` holds the messages of each child session: `[{ sessionID, messages }]`. An abort of
     * `signal` (the eval runner's caps) aborts the session and its children (`session.abort`).
     */
    /** @param {{ agent?: string, text?: string, command?: { name: string, arguments?: string }, model?: { providerID: string, modelID: string }, permission?: (req: any) => any, question?: (req: any) => any, onEvent?: (ev: any, root: string) => void, signal?: AbortSignal, title?: string, timeoutMs?: number }} options */
    run(options) {
      return runOnClient(client, contexts, options);
    },
    /** The command list of the server API (`GET /command`), without a model call. */
    async commands() {
      const r = await client.command.list();
      if (r.error) throw new Error(`command list failed: ${JSON.stringify(r.error)}`);
      return r.data ?? [];
    },
    async stop() {
      stream.abort();
      killTree(child);
      await Promise.race([pump, sleep(2000)]);
      log.end();
    },
  };
}

/**
 * Routes one event of the server's stream to the context of the session it belongs to (a child session,
 * `info.parentID` set, joins its root's context), passes it to that context's `onEvent`, and answers
 * permission and question requests by the context's policies through `client`.
 */
export async function routeEvent(client, contexts, ev) {
  const props = ev?.properties ?? {};
  const sessionID = props.sessionID ?? props.part?.sessionID ?? props.info?.sessionID;
  if ((ev.type === "session.created" || ev.type === "session.updated") && props.info?.parentID && contexts.has(props.info.parentID) && !contexts.has(props.info.id)) {
    const ctx = contexts.get(props.info.parentID);
    ctx.children.add(props.info.id);
    contexts.set(props.info.id, ctx);
  }
  const ctx = sessionID ? contexts.get(sessionID) : undefined;
  if (ctx) {
    ctx.events.push(ev);
    try {
      ctx.onEvent?.(ev, ctx.rootID);
    } catch {
      // a callback error never stops the stream
    }
  }
  if (ev.type === "permission.asked") {
    const reply = ctx?.permission ? await ctx.permission(props) : "reject";
    await client.permission.reply({ requestID: props.id, reply });
  } else if (ev.type === "question.asked") {
    const answer = ctx?.question ? await ctx.question(props) : null;
    if (answer === null || answer === undefined) await client.question.reject({ requestID: props.id });
    else await client.question.reply({ requestID: props.id, answers: answer });
  }
}

/**
 * One session on an SDK client (the driver's `run`; a test passes a stub client, C002-TC-919): create it,
 * send the prompt (or the command) and wait until it ends, the caller's `signal` aborts it (a cap), or
 * `timeoutMs` passes from the moment the prompt was sent (the session timeout of C002-IF-010 §4, 20 minutes
 * in the eval runner). At an abort or the timeout every session of the context, the root and its child
 * sessions, is aborted through `client.session.abort`; the timeout gives the error
 * `session timed out after <timeoutMs> ms`. Then the messages of the root and child sessions are read.
 * @param {{ agent?: string, text?: string, command?: { name: string, arguments?: string }, model?: { providerID: string, modelID: string }, permission?: (req: any) => any, question?: (req: any) => any, onEvent?: (ev: any, root: string) => void, signal?: AbortSignal, title?: string, timeoutMs?: number }} options
 */
export async function runOnClient(client, contexts, { agent, text, command, model, permission, question, onEvent, signal, title, timeoutMs }) {
  const created = await client.session.create({ title: title ?? String(text ?? command?.name ?? "session").slice(0, 60) });
  const sessionID = created.data?.id;
  if (!sessionID) throw new Error(`session not created: ${JSON.stringify(created.error ?? null)}`);
  const ctx = { rootID: sessionID, permission, question, onEvent, events: [], children: new Set() };
  contexts.set(sessionID, ctx);
  let error = null;
  let aborted = false;
  let timer;
  const abortAll = async () => {
    for (const id of [sessionID, ...ctx.children]) await client.session.abort({ sessionID: id }).catch(() => {});
  };
  let onAbort;
  try {
    const call = command
      ? client.session.command({ sessionID, command: command.name, arguments: command.arguments ?? "", ...(agent ? { agent } : {}), ...(model ? { model: `${model.providerID}/${model.modelID}` } : {}) })
      : client.session.prompt({ sessionID, agent, ...(model ? { model } : {}), parts: [{ type: "text", text }] });
    // The session timeout counts from here: the prompt has been sent.
    const stop = new Promise((resolve) => {
      if (timeoutMs) timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
      if (signal) {
        onAbort = () => resolve({ aborted: true });
        if (signal.aborted) onAbort();
        else signal.addEventListener("abort", onAbort, { once: true });
      }
    });
    const r = await Promise.race([call, stop]);
    if (r?.timedOut) {
      error = `session timed out after ${timeoutMs} ms`;
      await abortAll();
    } else if (r?.aborted) {
      aborted = true;
      await abortAll();
      await Promise.race([call.catch(() => {}), sleep(10_000)]);
    } else if (r?.error) error = errorText(r.error);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    clearTimeout(timer);
    if (signal && onAbort) signal.removeEventListener("abort", onAbort);
  }
  const msgs = (await client.session.messages({ sessionID })).data ?? [];
  const children = [];
  for (const id of ctx.children) children.push({ sessionID: id, messages: (await client.session.messages({ sessionID: id })).data ?? [] });
  for (const id of [sessionID, ...ctx.children]) contexts.delete(id);
  return { sessionID, messages: msgs, parts: msgs.flatMap((m) => m.parts ?? []), events: ctx.events, children, error, aborted };
}
