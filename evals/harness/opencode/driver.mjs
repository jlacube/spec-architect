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
// module never needs it.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, createWriteStream } from "node:fs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

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
export function defaultOpenRouterKeyFile() {
  return join(homedir(), ".architect-evals", "openrouter-key.txt");
}

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
 *   paid          { keyFile? }: a session against OpenRouter; the key file's one line goes to the host as
 *                 OPENROUTER_API_KEY; refused when the file is missing or empty
 *   env           extra variables of the host process
 *   startTimeoutMs  default 90 s
 */
export async function startOpenCode(options) {
  const bin = options.bin ?? resolveOpenCodeBinary();
  if (!isAbsolute(bin)) throw new Error(`the pinned OpenCode binary must be an absolute path: ${bin}`);
  if (!existsSync(bin)) throw new Error(`pinned OpenCode binary not found: ${bin}`);
  const { project, runDir } = options;
  mkdirSync(runDir, { recursive: true });
  const extra = { ...(options.env ?? {}) };
  if (options.paid) {
    const keyFile = options.paid.keyFile ?? defaultOpenRouterKeyFile();
    const key = existsSync(keyFile) ? readFileSync(keyFile, "utf8").trim() : "";
    if (!key) throw new Error(`paid OpenCode session refused: no OpenRouter key in ${keyFile}`);
    extra.OPENROUTER_API_KEY = key;
  }
  const env = hostEnv({ runDir, isolate: options.isolate === true, extra });
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
  const client = createOpencodeClient({ baseUrl, directory: project });

  // One event stream; permission and question requests go to the policy of the session that asked.
  const policies = new Map();
  const events = new Map();
  const stream = new AbortController();
  const pump = (async () => {
    const sub = await client.event.subscribe(undefined, { signal: stream.signal });
    for await (const ev of sub.stream) {
      const props = ev?.properties ?? {};
      const sessionID = props.sessionID;
      if (sessionID && events.has(sessionID)) events.get(sessionID).push(ev);
      const policy = sessionID ? policies.get(sessionID) : undefined;
      if (ev.type === "permission.asked") {
        const reply = policy?.permission ? await policy.permission(props) : "reject";
        await client.permission.reply({ requestID: props.id, reply });
      } else if (ev.type === "question.asked") {
        const answer = policy?.question ? await policy.question(props) : null;
        if (answer === null || answer === undefined) await client.question.reject({ requestID: props.id });
        else await client.question.reply({ requestID: props.id, answers: answer });
      }
    }
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
     * given), answer requests by `permission(request) → "once" | "always" | "reject"` and
     * `question(request) → answers | null` (null dismisses), and return
     * { sessionID, messages, parts, events, error } once the prompt has ended.
     */
    async run({ agent, text, model, permission, question, title, timeoutMs }) {
      const created = await client.session.create({ title: title ?? text.slice(0, 60) });
      const sessionID = created.data?.id;
      if (!sessionID) throw new Error(`session not created: ${JSON.stringify(created.error ?? null)}`);
      policies.set(sessionID, { permission, question });
      events.set(sessionID, []);
      let error = null;
      let timer;
      try {
        const prompt = client.session.prompt({ sessionID, agent, ...(model ? { model } : {}), parts: [{ type: "text", text }] });
        const timeout = new Promise((resolve) => {
          if (timeoutMs) timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
        });
        const r = await Promise.race([prompt, timeout]);
        if (r?.timedOut) {
          error = `session timed out after ${timeoutMs} ms`;
          await client.session.abort({ sessionID }).catch(() => {});
        } else if (r?.error) error = r.error;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      } finally {
        clearTimeout(timer);
      }
      const msgs = (await client.session.messages({ sessionID })).data ?? [];
      policies.delete(sessionID);
      const evs = events.get(sessionID) ?? [];
      events.delete(sessionID);
      return { sessionID, messages: msgs, parts: msgs.flatMap((m) => m.parts ?? []), events: evs, error };
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
