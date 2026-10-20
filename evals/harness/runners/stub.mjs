// Stub OpenCode host for the runner tests (C002-IF-010 §4 "Stub", C002-TS-614, C002-TS-611; C002-T-044):
// a scripted, in-process stand-in for the driver host of ./opencode.mjs. Its session never ends by
// itself: every turn is one assistant message with a `step-finish` part that reports `spendPerTurn` USD
// (or no spend), sent through the runner's `onEvent` as OpenCode's `message.part.updated` event, until
// the runner aborts the session (a cap, an unanswerable question) or `endAfter` turns have run (a session
// that completes). `script[i]` adds tool calls to turn i + 1:
//   { tool: "question", input: { questions } }  answered through the runner's question policy
//   { tool, input, permission }                 a call that asks `permission` first (e.g. "edit")
//   { tool, input }                             a call that runs without a request
//   { text }                                    assistant text of that turn
// No process, socket, network or model is involved; the stub needs no package in the project.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const sleep = () => new Promise((r) => setImmediate(r));

/**
 * Stub Copilot CLI host for the runner tests (C002-IF-010 §4 "Stub", C002-TS-614; C002-T-045): a
 * scripted, in-process stand-in for `cliHost()` of ./copilot-cli.mjs that emits Copilot CLI 1.0.98 JSON
 * events (the shapes recorded in step 1 of C002-T-045) through the runner's `onEvent`. Each turn is one
 * `assistant.message` of the session agent; the session never ends by itself until the runner aborts it
 * or `endAfter` turns have run. At the end it writes the `--usage-output-file` of the arguments with
 * `creditsPerTurn` AI Credits per turn (`aiCreditsStatus` "unavailable" when `reportsSpend` is false).
 * `script[i]` adds to turn i + 1:
 *   { text }                                  session agent text
 *   { tool, input, deny?, error?, result? }   a call of the session agent; `deny: "hook"` makes it a
 *                                             fail-closed hook deny of `hookSource`, `deny: "permission"`
 *                                             a permission refusal
 *   { subagent, calls: [{ tool, input, deny? }], text? }  a `task` call that starts `subagent` (its
 *                                             host name, e.g. "sdd-auditor" or "general-purpose") with
 *                                             those calls
 *   { error: "…" , session: true }            a `session.error` event with that text
 * `calls` records each run's arguments, working folder and environment, for the tests. `sessionCredits` replaces the
 * AI Credits the usage file gives for the whole session (C002-TC-678); `limitText: false` stops at the limit
 * without printing the host's limit text; `hostLog` is written as the host's log file into `--log-dir` (C002-TC-915).
 */
/** @param {{ creditsPerTurn?: number, sessionCredits?: number, limitText?: boolean, hostLog?: string, reportsSpend?: boolean, endAfter?: number | null, script?: any[][], version?: string, maxTurns?: number, model?: string, hookSource?: string, credential?: boolean, onRun?: (o: any) => void }} [options] */
export function copilotStubHost({ creditsPerTurn = 1, sessionCredits, limitText = true, hostLog, reportsSpend = true, endAfter = null, script = [], version = "1.0.98", maxTurns = 10_000, model = "stub-model", hookSource = ".github_hooks_architect-guard.json", credential = false, onRun } = {}) {
  const calls = [];
  let seq = 0;
  const id = (p) => `${p}-${String(++seq).padStart(6, "0")}`;
  return {
    paid: false,
    // `credential`: the runner gives this host its credential source as for the real host (no paid session).
    credential,
    calls,
    version: () => version,
    async run({ args, cwd, env, onEvent, signal }) {
      calls.push({ args, cwd, env });
      onRun?.({ args, cwd, env });
      if (hostLog !== undefined) {
        const logDir = args[args.indexOf("--log-dir") + 1];
        mkdirSync(logDir, { recursive: true });
        writeFileSync(join(logDir, "process-stub.log"), hostLog);
      }
      const limit = Number(args[args.indexOf("--max-ai-credits") + 1]);
      const ts = () => new Date().toISOString();
      const emit = (type, data, extra = {}) => onEvent({ type, data, id: id("evt"), timestamp: ts(), ...extra });
      const usageFile = args[args.indexOf("--usage-output-file") + 1];
      const complete = (call, agentId, parentToolCallId) => {
        const base = { toolCallId: call.toolCallId, model, ...(parentToolCallId ? { parentToolCallId } : {}) };
        const extra = agentId ? { agentId } : {};
        emit("tool.execution_start", { toolCallId: call.toolCallId, toolName: call.tool, arguments: call.input ?? {}, ...(parentToolCallId ? { parentToolCallId } : {}) }, extra);
        if (call.deny === "hook") emit("tool.execution_complete", { ...base, success: false, error: { message: `Denied by preToolUse hook from "${hookSource}" (hook errored)`, code: "denied" } }, extra);
        else if (call.deny === "permission") emit("tool.execution_complete", { ...base, success: false, error: { message: "Permission denied because no interactive user response was available.", code: "denied" } }, extra);
        else emit("tool.execution_complete", { ...base, success: true, result: { content: call.result ?? "ok" } }, extra);
      };
      emit("session.mcp_servers_loaded", { servers: [] });
      let turns = 0;
      for (let turn = 1; turn <= maxTurns; turn++) {
        if (signal?.aborted) break;
        if (endAfter !== null && turn > endAfter) break;
        turns = turn;
        const actions = script[turn - 1] ?? [];
        const text = actions.filter((a) => a.text !== undefined && !a.subagent).map((a) => a.text).join("");
        const requests = [];
        for (const a of actions) {
          if (a.tool) requests.push({ toolCallId: id("call"), name: a.tool, arguments: a.input ?? {}, action: a });
          if (a.subagent) requests.push({ toolCallId: id("call"), name: "task", arguments: { name: a.subagent, agent_type: a.subagent, prompt: "brief", description: "task" }, action: a });
        }
        emit("assistant.message", { messageId: id("msg"), model, content: text, toolRequests: requests.map(({ action, ...r }) => r), turnId: String(turn - 1) });
        for (const r of requests) {
          const a = r.action;
          if (!a.subagent) {
            complete({ toolCallId: r.toolCallId, tool: a.tool, input: a.input, deny: a.deny, result: a.result });
            continue;
          }
          const agentId = id("agent");
          emit("tool.execution_start", { toolCallId: r.toolCallId, toolName: "task", arguments: r.arguments });
          emit("subagent.started", { toolCallId: r.toolCallId, agentName: a.subagent, agentDisplayName: a.subagent, agentType: a.subagent, model }, { agentId });
          const sub = (a.calls ?? []).map((c) => ({ toolCallId: id("call"), tool: c.tool, input: c.input ?? {}, deny: c.deny }));
          emit("assistant.message", { messageId: id("msg"), model, content: "", toolRequests: sub.map((c) => ({ toolCallId: c.toolCallId, name: c.tool, arguments: c.input })), parentToolCallId: r.toolCallId }, { agentId });
          for (const c of sub) complete(c, agentId, r.toolCallId);
          emit("assistant.message", { messageId: id("msg"), model, content: a.text ?? "sub done", toolRequests: [], parentToolCallId: r.toolCallId }, { agentId });
          emit("subagent.completed", { toolCallId: r.toolCallId, agentName: a.subagent, totalToolCalls: sub.length, totalTokens: 100, durationMs: 1 }, { agentId });
          emit("tool.execution_complete", { toolCallId: r.toolCallId, model, success: true, result: { content: a.text ?? "sub done" } });
        }
        for (const a of actions) if (a.session) emit("session.error", { errorType: "query", message: a.error });
        // The host's session limit (`--max-ai-credits`): the next model call is blocked.
        if (reportsSpend && Number.isFinite(limit) && turn * creditsPerTurn + 1e-9 >= limit) {
          if (limitText) emit("session.error", { errorType: "limits", message: `Session limits reached: ${turn * creditsPerTurn}/${limit} AI credits used. Increase or unset the session limit to continue.` });
          break;
        }
        await sleep();
      }
      if (usageFile) {
        const nano = Math.round((sessionCredits ?? turns * creditsPerTurn) * 1e9);
        writeFileSync(
          usageFile,
          JSON.stringify({ totalPremiumRequestCost: 0, totalNanoAiu: reportsSpend ? nano : 0, aiCreditsStatus: reportsSpend ? "ok" : "unavailable", modelMetrics: { [model]: { requests: { count: turns, cost: 0 }, usage: { inputTokens: 100 * turns, outputTokens: 10 * turns, cacheReadTokens: 0, cacheWriteTokens: 0 }, totalNanoAiu: reportsSpend ? nano : 0 } } }),
        );
      }
      onEvent({ type: "result", timestamp: ts(), exitCode: 0, usage: { premiumRequests: 0 } });
      return { exitCode: signal?.aborted ? null : 0, stderr: "" };
    },
  };
}

/**
 * The stub host factory: `{ needsPackage: false, start() }`, as `driverHost()` of ./opencode.mjs.
 * `calls` records every session the stub ran (agent, text or command), for the tests, with `steps`: the
 * start and finish of each step in order (`{ kind: "start" | "finish", who: "session" | "subagent", step,
 * cost }`). `costs` gives the cost of each step of the session agent (default `spendPerTurn`);
 * `subagent` (`{ step, cost }`, C002-TC-677) runs one subagent step in parallel with that step of the
 * session agent, finishing before it (so before an abort that step's finish would cause takes effect).
 */
/** @param {{ spendPerTurn?: number, costs?: number[], subagent?: { step: number, cost: number }, reportsSpend?: boolean, endAfter?: number | null, script?: any[][], version?: string, maxTurns?: number, model?: { providerID: string, modelID: string } }} [options] */
export function stubHost({ spendPerTurn = 0.01, costs, subagent, reportsSpend = true, endAfter = null, script = [], version = "1.18.31", maxTurns = 10_000, model = { providerID: "stub", modelID: "stub-model" } } = {}) {
  const calls = [];
  return {
    needsPackage: false,
    calls,
    async start() {
      let seq = 0;
      const id = (p) => `${p}_${String(++seq).padStart(6, "0")}`;
      return {
        version,
        /** @param {{ agent?: string, text?: string, command?: { name: string, arguments?: string }, model?: { providerID: string, modelID: string }, permission?: (req: any) => any, question?: (req: any) => any, onEvent?: (ev: any, root: string) => void, signal?: AbortSignal, title?: string, timeoutMs?: number }} options */
        async run({ agent, text, command, permission, question, onEvent, signal }) {
          const sessionID = id("ses");
          const steps = [];
          calls.push({ sessionID, agent, ...(command ? { command } : { text }), steps });
          const messages = [];
          let aborted = false;
          for (let turn = 1; turn <= maxTurns; turn++) {
            if (signal?.aborted) {
              aborted = true;
              break;
            }
            if (endAfter !== null && turn > endAfter) break;
            const messageID = id("msg");
            const now = Date.now();
            steps.push({ kind: "start", who: "session", step: turn });
            const parts = [{ id: id("prt"), sessionID, messageID, type: "step-start" }];
            for (const action of script[turn - 1] ?? []) {
              if (action.text !== undefined) {
                parts.push({ id: id("prt"), sessionID, messageID, type: "text", text: action.text });
                continue;
              }
              const callID = id("call");
              const part = { id: id("prt"), sessionID, messageID, type: "tool", callID, tool: action.tool, state: { status: "completed", input: action.input ?? {}, output: "ok", title: action.tool, metadata: {}, time: { start: now, end: now } } };
              if (action.tool === "question") {
                const a = await question?.({ id: id("que"), sessionID, questions: action.input?.questions ?? [], tool: { messageID, callID } });
                if (a === null || a === undefined) part.state = { status: "error", input: action.input ?? {}, error: "The user dismissed this question", time: { start: now, end: now } };
                else part.state.metadata = { answers: a };
              } else if (action.permission) {
                const reply = await permission?.({ id: id("per"), sessionID, permission: action.permission, patterns: action.patterns ?? ["*"], metadata: {}, always: [], tool: { messageID, callID } });
                if (reply === "reject") part.state = { status: "error", input: action.input ?? {}, error: "The user rejected permission to use this specific tool call.", time: { start: now, end: now } };
              }
              parts.push(part);
            }
            const cost = reportsSpend ? (costs?.[turn - 1] ?? spendPerTurn) : 0;
            const tokens = { input: 100, output: 10, reasoning: 0, cache: { read: 0, write: 0 } };
            // A subagent step in parallel with this step: it starts and finishes while this step runs.
            if (subagent && subagent.step === turn) {
              const child = id("ses");
              steps.push({ kind: "start", who: "subagent", step: 1 });
              const sub = { id: id("prt"), sessionID: child, messageID: id("msg"), type: "step-finish", reason: "stop", cost: reportsSpend ? subagent.cost : 0, tokens };
              steps.push({ kind: "finish", who: "subagent", step: 1, cost: sub.cost });
              onEvent?.({ id: id("evt"), type: "message.part.updated", properties: { sessionID: child, part: sub, time: now } }, sessionID);
            }
            const finish = { id: id("prt"), sessionID, messageID, type: "step-finish", reason: "tool-calls", cost, tokens };
            steps.push({ kind: "finish", who: "session", step: turn, cost });
            parts.push(finish);
            messages.push({ info: { id: messageID, sessionID, role: "assistant", time: { created: now, completed: now }, parentID: "", modelID: model.modelID, providerID: model.providerID, mode: agent, agent, path: { cwd: "", root: "" }, cost, tokens }, parts });
            onEvent?.({ id: id("evt"), type: "message.part.updated", properties: { sessionID, part: finish, time: now } }, sessionID);
            await sleep();
          }
          return { sessionID, messages, parts: messages.flatMap((m) => m.parts), events: [], children: [], error: null, aborted };
        },
        async stop() {},
      };
    },
  };
}
