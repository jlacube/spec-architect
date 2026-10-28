// Agent SDK stub (test plan §2, sdk-stub; C002-T-048 step X0, revised for defect D-031 in C002-T-069): a
// replacement for the SDK's `query` that the runner tests put in place through the harness context of
// session.mjs (`setHarnessContext({ query })`), so that the Claude Code path of `runSession` runs without a
// Claude Code process and bills nothing. It runs on the timers of the process (`setTimeout`, `Date.now`),
// which the tests replace with the mock timers of `node:test`, so its schedule takes no real time.
//
// What it does (C002-IF-010 §2.2 Claude Code spend cap, items 1 … 8):
// - records the options, the prompt and the system prompt it receives (`log({ ev: "options", … })`),
//   `maxBudgetUsd` and `taskBudget` included when given, so that a test can show that none is passed;
// - sends an `init` message (`apiKeySource` `none` under the subscription route, whose environment
//   carries CLAUDE_CODE_OAUTH_TOKEN, else the key's source; `claude_code_version` `version`);
// - starts model calls of the session agent on a schedule (`schedule`, else one each `everyMs` from
//   `firstAtMs`); each call streams its assistant message once per content block (`blocks`), all with
//   the call's one message ID, and ends after its last block: only then is its cost (`usdPerCall`) added
//   to the notional cost and a turn counted;
// - answers each usage request (`usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET`) after
//   `usageDelayMs` with `session.total_cost_usd` the cost of the calls ended by then, or per request
//   (`answers[i]`, else `then`): a fixed number, `refuse`, `negative` (-1), `nocost` (no
//   `session.total_cost_usd`) or `hang` (never answers); every request still open when the query closes
//   (its stream ends or the abort controller fires) is refused with `Query closed before response received`;
// - ends a session itself only at `maxTurns` (`error_max_turns`) or by `selfEnd` (`{ afterCall, result }`:
//   that result right after the call ends, then the end of its stream);
// - `subagent` (`{ atCall }`): a subagent's model call that starts in parallel with that call of the
//   session agent and streams its message (a new message ID, `parent_tool_use_id` set); its end and cost
//   come after the interrupt (`afterInterrupt` `{ endCall }`);
// - `ask` (`{ atCall, questions? }`; C002-T-072): an AskUserQuestion permission request sent through
//   `canUseTool` in that model call, after its blocks and before its end, so that the runner writes its
//   `answer` record (`log({ ev: "ask", t, call, behavior })`);
// - records `interrupt()` and the close (`log({ ev: "interrupt" | "close", t })`); after the interrupt it
//   starts no further call and runs `afterInterrupt` in order: `{ endCall: usd }` ends the call then
//   running with that cost, `{ newCall: true }` streams the message of a new model call (a new message ID)
//   and ends it, `{ permission: tool }` sends a permission request through `canUseTool`, `{ result }`
//   streams a result message at once and ends the stream; with no `result` step it streams nothing more.
// `log(event)` receives every record; the driver of the tests writes them to a file.

/** Rounds an amount to 1e-9 USD, so that sums of the stub's costs compare exactly. */
const round = (x) => Math.round(x * 1e9) / 1e9;

/**
 * The stub `query`.
 * @param {{ usdPerCall?: number, usdPerTurn?: number, everyMs?: number, firstAtMs?: number, schedule?: number[], blocks?: number, usageDelayMs?: number, answers?: (string | number)[], then?: string | number, keySource?: string, model?: string, version?: string, selfEnd?: { afterCall: number, result?: Record<string, any> } | null, subagent?: { atCall: number } | null, ask?: { atCall: number, questions?: Record<string, any>[] } | null, afterInterrupt?: Record<string, any>[], log?: (e: any) => void, onOptions?: (o: any) => void }} [config]
 */
export function sdkStub(config = {}) {
  const {
    usdPerTurn,
    everyMs = 1000,
    firstAtMs = 0,
    schedule,
    blocks = 2,
    usageDelayMs = 100,
    answers = [],
    then = "ok",
    keySource = "/login managed key",
    model = "claude-opus-5-5",
    version = "2.1.299",
    selfEnd = null,
    subagent = null,
    ask = null,
    afterInterrupt = [{ result: {} }],
    log = () => {},
    onOptions = () => {},
  } = config;
  const usdPerCall = config.usdPerCall ?? usdPerTurn ?? 0.01;
  return function query({ prompt, options }) {
    onOptions(options);
    const t0 = Date.now();
    const now = () => Date.now() - t0;
    log({
      ev: "options",
      t: 0,
      keys: Object.keys(options).sort(),
      maxTurns: options.maxTurns ?? null,
      maxBudgetUsd: "maxBudgetUsd" in options ? options.maxBudgetUsd : "absent",
      taskBudget: "taskBudget" in options ? options.taskBudget : "absent",
      extraArgs: options.extraArgs ?? null,
      systemPrompt: options.systemPrompt ?? null,
      appendSystemPrompt: options.appendSystemPrompt ?? null,
      prompt: typeof prompt === "string" ? prompt : "<stream>",
    });
    const subscription = typeof options.env?.CLAUDE_CODE_OAUTH_TOKEN === "string" && options.env.CLAUDE_CODE_OAUTH_TOKEN !== "";
    const signal = options.abortController?.signal;
    let usd = 0;
    let turns = 0;
    let interrupted = false;
    let closed = false;
    let requests = 0;
    let openRequests = 0;
    /** @type {Set<{ reject: (e: Error) => void }>} */
    const pending = new Set();
    let wake = null;
    const wakeUp = () => {
      const w = wake;
      wake = null;
      w?.();
    };
    /** Sleeps until `at` ms after the start (Infinity: until woken), or until an interrupt or the close wakes it. */
    const sleepUntil = (at) =>
      new Promise((resolve) => {
        const timer = Number.isFinite(at) ? setTimeout(() => ((wake = null), resolve(undefined)), Math.max(0, at - now())) : null;
        wake = () => {
          if (timer) clearTimeout(timer);
          resolve(undefined);
        };
      });
    const close = (why) => {
      if (closed) return;
      closed = true;
      log({ ev: "close", t: now(), why });
      for (const p of [...pending]) p.reject(new Error("Query closed before response received"));
      wakeUp();
    };
    signal?.addEventListener("abort", () => close("abort"), { once: true });
    const usage = { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
    const assistant = (id, block, parent = null) => ({ type: "assistant", message: { id, type: "message", role: "assistant", model, content: [{ type: "text", text: `block ${block}` }], usage }, parent_tool_use_id: parent, session_id: "stub" });
    const resultMessage = (r = {}) => {
      const subtype = r.subtype ?? "error_during_execution";
      const cost = r.total_cost_usd ?? usd;
      return { type: "result", subtype, is_error: subtype !== "success", num_turns: turns, total_cost_usd: cost, duration_api_ms: 0, session_id: "stub", modelUsage: { [model]: { inputTokens: turns, outputTokens: turns, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, costUSD: cost } } };
    };
    const endCall = (cost) => {
      usd = round(usd + cost);
    };

    async function* stream() {
      try {
        yield { type: "system", subtype: "init", apiKeySource: subscription ? "none" : keySource, model, claude_code_version: version, session_id: "stub" };
        for (let call = 1; ; call++) {
          if (closed || interrupted) break;
          const at = schedule ? schedule[call - 1] : firstAtMs + (call - 1) * everyMs;
          await sleepUntil(at ?? Infinity);
          if (closed || interrupted) break;
          const id = `msg_${String(call).padStart(3, "0")}`;
          for (let b = 1; b <= blocks; b++) yield assistant(id, b);
          if (subagent && subagent.atCall === call) yield assistant(`msg_sub_${String(call).padStart(3, "0")}`, 1, "toolu_agent_1");
          if (ask && ask.atCall === call) {
            const questions = ask.questions ?? [{ question: "Which checkout is in scope?", header: "Scope", multiSelect: false, options: [{ label: "Web (Recommended)", description: "the web checkout" }, { label: "Kiosk", description: "the kiosk checkout" }] }];
            const r = await options.canUseTool("AskUserQuestion", { questions }, { signal, toolUseID: `toolu_ask_${call}` });
            log({ ev: "ask", t: now(), call, behavior: r?.behavior ?? null });
          }
          // The call ends after its last block: its cost counts from now on, and so does its turn.
          turns += 1;
          endCall(usdPerCall);
          log({ ev: "call-end", t: now(), call, usd });
          if (selfEnd && selfEnd.afterCall === call) {
            yield resultMessage({ subtype: "success", ...(selfEnd.result ?? {}) });
            return;
          }
          if (turns >= options.maxTurns) {
            yield resultMessage({ subtype: "error_max_turns" });
            return;
          }
        }
        if (closed) return;
        let extra = 0;
        for (const step of afterInterrupt) {
          if (closed) return;
          if (step.endCall !== undefined) {
            endCall(step.endCall);
            log({ ev: "call-end", t: now(), call: "running", usd });
          }
          if (step.newCall) {
            extra += 1;
            yield assistant(`msg_after_${String(extra).padStart(3, "0")}`, 1);
            endCall(usdPerCall);
            log({ ev: "call-end", t: now(), call: `after-${extra}`, usd });
          }
          if (step.permission) {
            const r = await options.canUseTool(step.permission, { stub: true }, { signal, toolUseID: `toolu_perm_${step.permission}` });
            log({ ev: "permission", t: now(), tool: step.permission, behavior: r?.behavior ?? null, message: r?.message ?? null });
          }
          if (step.result) {
            yield resultMessage(step.result);
            return;
          }
        }
        while (!closed) await sleepUntil(Infinity);
      } finally {
        close("stream end");
      }
    }

    const it = stream();
    return Object.assign(it, {
      interrupt() {
        log({ ev: "interrupt", t: now() });
        interrupted = true;
        wakeUp();
        return Promise.resolve(undefined);
      },
      usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET(opts) {
        requests += 1;
        const n = requests;
        const kind = answers[n - 1] ?? then;
        openRequests += 1;
        log({ ev: "request", t: now(), n, open: openRequests, opts: opts ?? null });
        return new Promise((resolve, reject) => {
          let timer = null;
          const entry = {
            reject(e) {
              done();
              log({ ev: "refused", t: now(), n, message: e.message });
              reject(e);
            },
          };
          const done = () => {
            if (!pending.has(entry)) return;
            pending.delete(entry);
            openRequests -= 1;
            if (timer) clearTimeout(timer);
          };
          pending.add(entry);
          if (closed) return entry.reject(new Error("Query closed before response received"));
          if (kind === "hang") return;
          timer = setTimeout(() => {
            if (!pending.has(entry)) return;
            if (kind === "refuse") return entry.reject(new Error("usage request refused (stub)"));
            done();
            const session = kind === "nocost" ? { model_usage: {} } : { total_cost_usd: kind === "negative" ? -1 : typeof kind === "number" ? kind : usd, model_usage: { [model]: { inputTokens: turns, outputTokens: turns, costUSD: usd } } };
            log({ ev: "answer", t: now(), n, usd: session.total_cost_usd ?? null });
            resolve({ session, rate_limits_available: false, rate_limits: null, behaviors: null });
          }, usageDelayMs);
        });
      },
    });
  };
}
