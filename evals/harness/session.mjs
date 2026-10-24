// One eval session through the Agent SDK (C001-ADR-007): the plugin is loaded, a main-thread agent
// is selected, AskUserQuestion is answered with scripted choices through canUseTool, and every SDK
// message is recorded with its arrival time.
// The Agent SDK is imported when a Claude Code session starts, so that the other hosts (and the runner
// tests, which bundle this module) never need it.
import { checkKeySource, childEnv, claudeExecutable, resolveAuth } from "./env.mjs";

/** Default answer policy: the first option, which the interview protocol marks "(Recommended)". */
export function firstOption(question) {
  return question.options?.[0]?.label ?? "";
}

/** Hosts of `--host` (C002-IF-010 §1); the default is the existing behaviour. */
export const HOSTS = ["claude-code", "opencode", "copilot-cli"];
export const DEFAULT_HOST = "claude-code";

/**
 * Harness context (C002-IF-010 §1, C002-T-044): the host that `runSession` runs on, set by run.mjs from
 * `--host` (else `EVAL_HOST`, else claude-code); a case never names it. `runners` replaces the runner
 * of a host (the stub host of the runner tests). `query` replaces the Agent SDK's `query` on the Claude
 * Code path (the Agent SDK stub sdk-stub of the runner tests, C002-T-048 step X0; test seam only: the
 * Claude Code path, `runSession`'s signature and its defaults are unchanged, C002-RISK-009).
 * `copilotModel` is the run's model substitution on Copilot CLI (C002-IF-010 §1, revision D-027):
 * `{ "<from>": "<to>" }` or null; run.mjs sets it from `--copilot-model` (else
 * `SDD_EVAL_COPILOT_MODEL`) and `runSession` hands it to the Copilot CLI runner.
 */
const context = { host: undefined, runners: {}, query: undefined, copilotModel: null, openRouterKey: null };

/**
 * Sets the harness context: `{ host?, runners?, query?, copilotModel?, openRouterKey? }`; returns the
 * previous one. `openRouterKey` is the OpenRouter key that run.mjs read and checked for a run on
 * `--host opencode` with the real runner (C002-IF-010 §4 Key check); `runSession` hands it to the OpenCode
 * runner, which gives it to the host process and redacts it, and writes it nowhere.
 */
export function setHarnessContext({ host, runners, query, copilotModel, openRouterKey } = {}) {
  const prev = { host: context.host, runners: context.runners, query: context.query, copilotModel: context.copilotModel, openRouterKey: context.openRouterKey };
  if (query !== undefined) context.query = query;
  if (copilotModel !== undefined) context.copilotModel = copilotModel;
  if (openRouterKey !== undefined) context.openRouterKey = openRouterKey;
  if (host !== undefined) {
    if (!HOSTS.includes(host)) throw new Error(`unknown eval host ${host}; use ${HOSTS.join(", ")}`);
    context.host = host;
  }
  if (runners !== undefined) context.runners = runners;
  return prev;
}

/** The host of the harness context (else `EVAL_HOST`, else claude-code). */
export function currentHost() {
  const h = context.host ?? process.env.EVAL_HOST ?? DEFAULT_HOST;
  if (!HOSTS.includes(h)) throw new Error(`unknown eval host ${h}; use ${HOSTS.join(", ")}`);
  return h;
}

/**
 * The names a session result reads (C002-IF-010 §3): "host" for a row whose `host` field names a
 * generated-target host (OpenCode, Copilot CLI), the host's own names; "source" for every other row,
 * the names mapped back.
 */
export const namesOf = (options) => (options?.host === "opencode" || options?.host === "copilot-cli" ? "host" : "source");

/**
 * Runs one session on the host of the harness context (signature unchanged). A case written for one
 * host (`host` option, from the case's `host` field) reads that host's own tool names (runners/opencode.mjs,
 * runners/copilot-cli.mjs).
 */
export async function runSession(options) {
  const host = currentHost();
  const own = context.runners[host];
  // The Copilot CLI runner gets the run's model substitution (C002-IF-010 §1, §2 model rule).
  if (host === "copilot-cli" && context.copilotModel) options = { ...options, copilotModel: context.copilotModel };
  // The OpenCode runner gets the key that run.mjs checked (C002-IF-010 §4).
  if (host === "opencode" && context.openRouterKey) options = { ...options, openRouterKey: context.openRouterKey };
  if (own) return own(options);
  if (host === "claude-code") return runClaudeCodeSession(options);
  if (host === "opencode") {
    const { paidOpenCodeRunner } = await import("./runners/opencode.mjs");
    return paidOpenCodeRunner()(options);
  }
  const { runCopilotCliSession } = await import("./runners/copilot-cli.mjs");
  return runCopilotCliSession({ ...options, names: namesOf(options) });
}

/** The Claude Code spend cap's times (C002-IF-010 §2.2 Claude Code spend cap, items 4 and 8); no option or variable changes them. */
export const USAGE_TIMEOUT_MS = 30_000;
export const SETTLE_MS = 5_000;
export const INTERRUPT_WAIT_MS = 30_000;
const USAGE_METHOD = "usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET";

/** An amount in USD rounded to 1e-6 (the differences of the `cap-close` record). */
const usd6 = (x) => Math.round(x * 1e6) / 1e6;
/** An amount in USD as text: at least two decimals, up to six, e.g. 0.20, 0.1234. */
export function usdText(x) {
  const s = usd6(x).toFixed(6).replace(/0+$/, "");
  const [i, d = ""] = s.split(".");
  return `${i}.${d.padEnd(2, "0")}`;
}

/**
 * Runs one Claude Code session and returns `{ transcript, answers, result, wallMs, auth, apiKeySource, claudeCodeVersion }`.
 * - `auth`: billing route, `api-key` or `subscription` (env.mjs); a subscription session whose
 *   init message reports another key source is aborted before its first turn
 * - `agent`: main-thread agent, e.g. "architect:sdd-conductor"
 * - `plugins`: plugin directories to load
 * - `answer(question, call)`: returns the label (or labels) to answer each AskUserQuestion question
 * - `allowTools`: tools approved without asking (others are denied, so a run cannot wander)
 * - `maxTurns`: passed to the Agent SDK, which ends the session with `error_max_turns`
 * - `maxBudgetUsd`: the spend cap, applied by this runner itself and never passed to the Agent SDK
 *   (defect D-031, C002-IF-010 §2.2 Claude Code spend cap): the host would show it to the model
 * - `env`: extra environment variables for the session (for example CLAUDE_CODE_ENABLE_TODO_TOOLS)
 * - `startDelayMs`: send the prompt only after this delay (MCP servers connect first)
 *
 * The spend cap (C002-IF-010 §2.2 Claude Code spend cap, items 1 … 8). The **query is open** from the
 * `query()` call until the runner begins to stop the session or the stream ends. R, the running cost,
 * is the highest `total_cost_usd` read: from each `result` message and each answer to the usage request
 * (`session.total_cost_usd`). A usage request is sent at each **trigger** (an assistant message of the
 * session agent or a subagent with a message ID not seen before) when none is open; the triggers that
 * arrive while one is open coalesce into one follow-up when it ends. After each reading R is compared with
 * the cap; at R ≥ cap while the query is open the runner stops the session: the `cap` record, every later
 * permission request denied, `interrupt()` once, the stream read on until a `result` message or 30 s,
 * the close (`abortController.abort()`) and the `cap-close` record. When the stream's last message is a
 * `result`, the runner first waits for the next message (none: the session ended by itself). A failed
 * reading (refused, no answer within 30 s, or no finite cost of at least 0) counts when the query is still
 * open 5 s later: the session is stopped as at the cap, without the cap records, and the call rejects with
 * `claude-code spend check failed: <reason>; notional cost read <R> USD` (property `costUsd`).
 */
export async function runClaudeCodeSession({ cwd, prompt, agent, plugins = [], answer = firstOption, allowTools = [], maxTurns = 30, maxBudgetUsd = 0.5, model, env = {}, startDelayMs = 0, auth }) {
  const mode = resolveAuth(auth);
  const cap = maxBudgetUsd;
  const abortController = new AbortController();
  let apiKeySource = null;
  let claudeCodeVersion = null;
  let authError = null;
  const transcript = [];
  const answers = [];
  const t0 = Date.now();
  const now = () => Date.now() - t0;
  const stamp = (record) => transcript.push({ t: now(), ...record });

  // --- Spend cap state (items 1 … 8) ---
  let open = false; // the query is open (item 1)
  let ended = false; // the stream ended or the runner closed the query
  /** @type {null | "cap" | "failed"} */
  let stopping = null;
  let interruptSent = false;
  let R = 0;
  let usdAtCap = null;
  let lastWasResult = false;
  let armed = false; // R reached the cap at a reading taken while the last message was a result (item 4)
  let failure = null; // the failed reading that counts (item 8)
  let stopTimer = null;
  let closeResolve = () => {};
  const closed = new Promise((r) => (closeResolve = r));
  const seen = new Set();
  /** @type {null | { messageId: string, sentT: number, settled: Promise<void> }} */
  let pending = null;
  let coalesced = null; // the latest trigger that arrived while a request was open
  const timers = new Set();
  /** Failed readings waiting for their settle time: record → timer. */
  const settling = new Map();
  let q = null;

  const later = (ms, fn) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const cancel = (id) => {
    if (id === null) return;
    clearTimeout(id);
    timers.delete(id);
  };
  const usageRecord = (fields) => ({ type: "harness", event: "usage", ...fields });

  const close = (by) => {
    if (ended) return;
    ended = true;
    open = false;
    cancel(stopTimer);
    if (!abortController.signal.aborted) abortController.abort();
    if (stopping === "cap") stamp({ type: "harness", event: "cap-close", usd: R, usd_at_cap: usdAtCap, after_cap_usd: usd6(R - usdAtCap), overshoot_usd: usd6(R - cap), closed_by: by });
    closeResolve();
  };

  const beginStop = (kind) => {
    if (stopping || ended) return;
    stopping = kind;
    open = false;
    armed = false;
    // The triggers waiting for a follow-up are covered by the stop: the result after the interrupt gives the
    // final cost. A message that arrives after this point is still a trigger (item 6).
    coalesced = null;
    if (kind === "cap") {
      usdAtCap = R;
      stamp({ type: "harness", event: "cap", reason: "spend cap", usd: R, cap_usd: cap });
    }
    interruptSent = true;
    Promise.resolve()
      .then(() => q.interrupt())
      .catch((e) => stamp({ type: "harness", event: "error", message: `interrupt failed: ${e instanceof Error ? e.message : String(e)}` }));
    stopTimer = later(INTERRUPT_WAIT_MS, () => close("timeout"));
  };

  const compare = () => {
    if (!open || !(R >= cap)) return;
    if (lastWasResult) {
      armed = true;
      return;
    }
    beginStop("cap");
  };

  const failed = (rec) => {
    if (!open) {
      transcript.push({ ...rec, ignored: true });
      return;
    }
    const timer = later(SETTLE_MS, () => {
      settling.delete(rec);
      if (open && !failure) {
        transcript.push(rec);
        failure = { reason: rec.error };
        beginStop("failed");
      } else transcript.push({ ...rec, ignored: true });
    });
    settling.set(rec, timer);
  };

  const sendRequest = (messageId) => {
    const sentT = now();
    const req = { messageId, sentT, settled: Promise.resolve() };
    pending = req;
    let timer = null;
    const timeout = new Promise((resolve) => (timer = later(USAGE_TIMEOUT_MS, () => resolve({ timeout: true }))));
    const call = Promise.resolve()
      .then(() => q[USAGE_METHOD]({ skipBehaviors: true }))
      .then(
        (answer) => ({ answer }),
        (error) => ({ error }),
      );
    req.settled = Promise.race([call, timeout]).then((out) => {
      cancel(timer);
      requestEnded(req, out);
    });
  };

  const requestEnded = (req, out) => {
    if (pending === req) pending = null;
    const base = { t: now(), source: "request", message_id: req.messageId, sent_t: req.sentT };
    const cost = out.answer?.session?.total_cost_usd;
    if (out.answer && typeof cost === "number" && Number.isFinite(cost) && cost >= 0) {
      transcript.push(usageRecord({ ...base, usd: cost }));
      R = Math.max(R, cost);
      compare();
    } else {
      const reason = out.timeout
        ? `no answer to the usage request within ${USAGE_TIMEOUT_MS / 1000} s`
        : out.error
          ? `usage request refused: ${out.error instanceof Error ? out.error.message : String(out.error)}`
          : "the usage answer gave no finite session.total_cost_usd of at least 0";
      failed(usageRecord({ ...base, usd: null, error: reason }));
    }
    if (coalesced !== null && !ended) {
      const id = coalesced;
      coalesced = null;
      sendRequest(id);
    }
  };

  const trigger = (messageId) => {
    if (ended) return;
    if (pending) coalesced = messageId;
    else sendRequest(messageId);
  };

  const options = {
    cwd,
    env: childEnv(env, mode),
    abortController,
    pathToClaudeCodeExecutable: claudeExecutable(),
    plugins: plugins.map((path) => ({ type: "local", path })),
    settingSources: [],
    // Without the Claude Code preset the selected agent's body is not applied (T-029 prototype).
    systemPrompt: { type: "preset", preset: "claude_code" },
    // The turn cap only: the spend cap is applied by this runner (no maxBudgetUsd, no taskBudget; D-031).
    maxTurns,
    canUseTool: async (toolName, input, opts) => {
      // After a stop every permission request is denied, AskUserQuestion included (item 4).
      if (stopping) {
        stamp({ type: "harness", event: "denied", tool: toolName, input });
        return { behavior: "deny", message: `${toolName} is not available in this evaluation` };
      }
      if (toolName === "AskUserQuestion") {
        const given = {};
        for (const q of input.questions ?? []) {
          const a = answer(q, input);
          given[q.question] = Array.isArray(a) ? a.join(", ") : a;
        }
        answers.push({ toolUseId: opts?.toolUseID ?? null, questions: input.questions ?? [], answers: given });
        stamp({ type: "harness", event: "answer", questions: input.questions ?? [], answers: given });
        return { behavior: "allow", updatedInput: { questions: input.questions, answers: given } };
      }
      if (allowTools.includes(toolName)) {
        // Recorded so that the bound condition 2 of item 7 is decided from the transcript.
        stamp({ type: "harness", event: "allowed", tool: toolName });
        return { behavior: "allow", updatedInput: input };
      }
      stamp({ type: "harness", event: "denied", tool: toolName, input });
      return { behavior: "deny", message: `${toolName} is not available in this evaluation` };
    },
  };
  if (agent) options.agent = agent;
  if (model) options.model = model;
  let result = null;
  let streamError = null;
  try {
    // With startDelayMs the prompt is streamed in after that delay, so MCP servers that connect a few
    // seconds after session start (Serena) are ready before the first subagent is spawned: a
    // subagent's tool set is fixed when it starts (C001-T-041).
    const input = startDelayMs > 0 ? delayedPrompt(prompt, startDelayMs) : prompt;
    const query = context.query ?? (await import("@anthropic-ai/claude-agent-sdk")).query;
    q = query({ prompt: input, options });
    open = true;
    const it = q[Symbol.asyncIterator]();
    const closedNext = closed.then(() => ({ closed: true }));
    for (;;) {
      const p = it.next();
      p.catch(() => {}); // a read left behind by the close must not reject unhandled
      const next = await Promise.race([p, closedNext]);
      if ("closed" in next || next.done) break;
      const message = next.value;
      // The message that arrived after the interrupt was sent (a result then ends the wait of item 4).
      const afterInterrupt = interruptSent;
      stamp({ type: "sdk", message });
      // R reached the cap at a result: the session went on past it, so it is stopped at this message.
      if (armed && open) beginStop("cap");
      lastWasResult = message.type === "result";
      if (message.type === "system" && message.subtype === "init") {
        apiKeySource = message.apiKeySource ?? null;
        claudeCodeVersion = typeof message.claude_code_version === "string" ? message.claude_code_version : null;
        try {
          checkKeySource(mode, apiKeySource);
        } catch (e) {
          authError = e;
          open = false;
          ended = true;
          abortController.abort();
          break;
        }
      }
      if (message.type === "assistant") {
        const id = message.message?.id;
        if (typeof id === "string" && !seen.has(id)) {
          seen.add(id);
          trigger(id);
        }
      }
      if (message.type === "result") {
        result = message;
        const cost = message.total_cost_usd;
        const usd = typeof cost === "number" && Number.isFinite(cost) ? cost : null;
        transcript.push(usageRecord({ t: now(), source: "result", usd, message_id: null, sent_t: null }));
        if (usd !== null) R = Math.max(R, usd);
        compare();
        if (stopping && afterInterrupt) close("result");
      }
    }
  } catch (e) {
    // An error result (for example the turn limit) ends the iteration with an exception after the
    // result message; the transcript up to there is still graded and its cost still counted.
    stamp({ type: "harness", event: "error", message: e instanceof Error ? e.message : String(e) });
    streamError = e;
  }
  // The stream ended: during a stop the query is closed now; else the session ended by itself.
  open = false;
  armed = false;
  if (stopping && !ended) close("stream-end");
  ended = true;
  if (!abortController.signal.aborted && stopping) abortController.abort();
  // The open request ends when the query closes (the SDK refuses it); its reading is then ignored.
  if (pending) {
    const req = pending;
    let timer = null;
    const waited = await Promise.race([req.settled.then(() => true), new Promise((r) => (timer = later(SETTLE_MS, () => r(false))))]);
    cancel(timer);
    if (!waited && pending === req) {
      pending = null;
      transcript.push(usageRecord({ t: now(), source: "request", usd: null, message_id: req.messageId, sent_t: req.sentT, error: "no answer to the usage request before the query closed", ignored: true }));
    }
  }
  // Failures still in their settle time: the stream has ended, so each is ignored.
  for (const [rec, timer] of settling) {
    cancel(timer);
    transcript.push({ ...rec, ignored: true });
  }
  settling.clear();
  for (const id of timers) clearTimeout(id);
  timers.clear();
  if (authError) throw authError;
  if (failure) {
    const err = new Error(`claude-code spend check failed: ${failure.reason}; notional cost read ${usdText(R)} USD`);
    Object.assign(err, { costUsd: R });
    // The transcript goes with the error (not enumerable), so run.mjs can keep it beside the ledger entry.
    for (const [k, v] of Object.entries({ transcript, claudeCodeVersion, apiKeySource, wallMs: Date.now() - t0 })) Object.defineProperty(err, k, { value: v, enumerable: false });
    throw err;
  }
  if (streamError && !result && !stopping) throw streamError;
  // The result (items 5 and 6): a session the runner stopped ends with `error_max_budget_usd` at the
  // highest cost read; a session that ended by itself keeps its last result as it came.
  if (stopping === "cap") result = { ...(result ?? { type: "result", num_turns: null, modelUsage: {} }), subtype: "error_max_budget_usd", is_error: true, total_cost_usd: R };
  return { transcript, answers, result, wallMs: Date.now() - t0, auth: mode, apiKeySource, claudeCodeVersion };
}

/**
 * The four bound conditions of C002-IF-010 §2.2 Claude Code spend cap, item 7, decided from the
 * transcript of a session that the runner stopped at the spend cap (the `cap` record), and the
 * checker that C002-T-069 step 6(c) applies to the paid check. `closeMs` is the time allowed for the
 * close itself in condition 4. Returns `{ applies: false }` for a transcript without a `cap` record.
 * @param {any[]} transcript
 */
export function capBoundConditions(transcript, { closeMs = SETTLE_MS } = {}) {
  const capIdx = transcript.findIndex((r) => r.type === "harness" && r.event === "cap");
  if (capIdx < 0) return { applies: false, conditions: [] };
  const capRec = transcript[capIdx];
  const usage = transcript.map((r, i) => ({ r, i })).filter(({ r }) => r.type === "harness" && r.event === "usage");
  const before = usage.filter(({ i }) => i < capIdx).map(({ r }) => r);
  const readings = before.filter((r) => typeof r.usd === "number");
  const firstAtCap = readings.find((r) => r.usd >= capRec.cap_usd);
  const belowBeforeFirst = readings.slice(0, firstAtCap ? readings.indexOf(firstAtCap) : readings.length).every((r) => r.usd < capRec.cap_usd);
  const c1 = belowBeforeFirst && firstAtCap !== undefined && readings.indexOf(firstAtCap) === readings.length - 1 && firstAtCap.usd === capRec.usd;
  const after = transcript.slice(capIdx + 1);
  const allowedAfter = after.filter((r) => r.type === "harness" && (r.event === "allowed" || r.event === "answer"));
  const c2 = allowedAfter.length === 0;
  const seenIds = new Set(transcript.slice(0, capIdx).filter((r) => r.type === "sdk" && r.message?.type === "assistant").map((r) => r.message.message?.id));
  const firstResult = after.findIndex((r) => r.type === "sdk" && r.message?.type === "result");
  const lateIds = [];
  if (firstResult >= 0) {
    for (const r of after.slice(0, firstResult)) if (r.type === "sdk" && r.message?.type === "assistant") seenIds.add(r.message.message?.id);
    for (const r of after.slice(firstResult + 1)) if (r.type === "sdk" && r.message?.type === "assistant" && !seenIds.has(r.message.message?.id)) lateIds.push(r.message.message?.id);
  }
  const c3 = lateIds.length === 0;
  const closeRec = after.find((r) => r.type === "harness" && r.event === "cap-close");
  const gap = closeRec ? closeRec.t - capRec.t : null;
  const c4 = closeRec !== undefined && gap !== null && gap <= INTERRUPT_WAIT_MS + closeMs;
  return {
    applies: true,
    conditions: [
      { n: 1, holds: c1, detail: `${readings.length} reading(s) before the cap record; first at or above ${capRec.cap_usd}: ${firstAtCap ? firstAtCap.usd : "none"}; cap record usd ${capRec.usd}` },
      { n: 2, holds: c2, detail: `${allowedAfter.length} permission(s) allowed after the cap record; ${after.filter((r) => r.type === "harness" && r.event === "denied").length} denied` },
      { n: 3, holds: c3, detail: firstResult < 0 ? "no result message after the cap record" : `${lateIds.length} new message ID(s) after the first result that follows the cap record${lateIds.length ? `: ${lateIds.join(", ")}` : ""}` },
      { n: 4, holds: c4, detail: closeRec ? `cap-close ${gap} ms after the cap record, closed_by ${closeRec.closed_by}` : "no cap-close record" },
    ],
  };
}

async function* delayedPrompt(text, ms) {
  await new Promise((r) => setTimeout(r, ms));
  yield { type: "user", message: { role: "user", content: text }, parent_tool_use_id: null, session_id: "" };
}
