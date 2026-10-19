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

const sleep = () => new Promise((r) => setImmediate(r));

/**
 * The stub host factory: `{ needsPackage: false, start() }`, as `driverHost()` of ./opencode.mjs.
 * `calls` records every session the stub ran (agent, text or command), for the tests.
 */
/** @param {{ spendPerTurn?: number, reportsSpend?: boolean, endAfter?: number | null, script?: any[][], version?: string, maxTurns?: number, model?: { providerID: string, modelID: string } }} [options] */
export function stubHost({ spendPerTurn = 0.01, reportsSpend = true, endAfter = null, script = [], version = "1.18.31", maxTurns = 10_000, model = { providerID: "stub", modelID: "stub-model" } } = {}) {
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
          calls.push({ sessionID, agent, ...(command ? { command } : { text }) });
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
            const cost = reportsSpend ? spendPerTurn : 0;
            const tokens = { input: 100, output: 10, reasoning: 0, cache: { read: 0, write: 0 } };
            const finish = { id: id("prt"), sessionID, messageID, type: "step-finish", reason: "tool-calls", cost, tokens };
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
