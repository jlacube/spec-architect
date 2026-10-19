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
 * of a host (the stub host of the runner tests).
 */
const context = { host: undefined, runners: {} };

/** Sets the harness context: `{ host?, runners? }`; returns the previous one. */
export function setHarnessContext({ host, runners } = {}) {
  const prev = { host: context.host, runners: context.runners };
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
 * Runs one session on the host of the harness context (signature unchanged). A case written for one
 * host (`host` option, from the case's `host` field) reads that host's own tool names (runners/opencode.mjs).
 */
export async function runSession(options) {
  const host = currentHost();
  const own = context.runners[host];
  if (own) return own(options);
  if (host === "claude-code") return runClaudeCodeSession(options);
  if (host === "opencode") {
    const { runOpenCodeSession } = await import("./runners/opencode.mjs");
    return runOpenCodeSession({ ...options, names: options.host === "opencode" ? "host" : "source" });
  }
  throw new Error(`eval host ${host}: no runner yet (the Copilot CLI runner is C002-T-045)`);
}

/**
 * Runs one Claude Code session and returns `{ transcript, answers, result, wallMs, auth, apiKeySource }`.
 * - `auth`: billing route, `api-key` or `subscription` (env.mjs); a subscription session whose
 *   init message reports another key source is aborted before its first turn
 * - `agent`: main-thread agent, e.g. "architect:sdd-conductor"
 * - `plugins`: plugin directories to load
 * - `answer(question, call)`: returns the label (or labels) to answer each AskUserQuestion question
 * - `allowTools`: tools approved without asking (others are denied, so a run cannot wander)
 * - `env`: extra environment variables for the session (for example CLAUDE_CODE_ENABLE_TODO_TOOLS)
 * - `startDelayMs`: send the prompt only after this delay (MCP servers connect first)
 */
export async function runClaudeCodeSession({ cwd, prompt, agent, plugins = [], answer = firstOption, allowTools = [], maxTurns = 30, maxBudgetUsd = 0.5, model, env = {}, startDelayMs = 0, auth }) {
  const mode = resolveAuth(auth);
  const abortController = new AbortController();
  let apiKeySource = null;
  let authError = null;
  const transcript = [];
  const answers = [];
  const t0 = Date.now();
  const stamp = (record) => transcript.push({ t: Date.now() - t0, ...record });
  const options = {
    cwd,
    env: childEnv(env, mode),
    abortController,
    pathToClaudeCodeExecutable: claudeExecutable(),
    plugins: plugins.map((path) => ({ type: "local", path })),
    settingSources: [],
    // Without the Claude Code preset the selected agent's body is not applied (T-029 prototype).
    systemPrompt: { type: "preset", preset: "claude_code" },
    maxTurns,
    maxBudgetUsd,
    canUseTool: async (toolName, input, opts) => {
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
      if (allowTools.includes(toolName)) return { behavior: "allow", updatedInput: input };
      stamp({ type: "harness", event: "denied", tool: toolName, input });
      return { behavior: "deny", message: `${toolName} is not available in this evaluation` };
    },
  };
  if (agent) options.agent = agent;
  if (model) options.model = model;
  let result = null;
  try {
    // With startDelayMs the prompt is streamed in after that delay, so MCP servers that connect a few
    // seconds after session start (Serena) are ready before the first subagent is spawned: a
    // subagent's tool set is fixed when it starts (C001-T-041).
    const input = startDelayMs > 0 ? delayedPrompt(prompt, startDelayMs) : prompt;
    const { query } = await import("@anthropic-ai/claude-agent-sdk");
    for await (const message of query({ prompt: input, options })) {
      stamp({ type: "sdk", message });
      if (message.type === "system" && message.subtype === "init") {
        apiKeySource = message.apiKeySource ?? null;
        try {
          checkKeySource(mode, apiKeySource);
        } catch (e) {
          authError = e;
          abortController.abort();
          break;
        }
      }
      if (message.type === "result") result = message;
    }
  } catch (e) {
    // An error result (for example the turn limit) ends the iteration with an exception after the
    // result message; the transcript up to there is still graded and its cost still counted.
    stamp({ type: "harness", event: "error", message: e instanceof Error ? e.message : String(e) });
    if (!result && !authError) throw e;
  }
  if (authError) throw authError;
  return { transcript, answers, result, wallMs: Date.now() - t0, auth: mode, apiKeySource };
}

async function* delayedPrompt(text, ms) {
  await new Promise((r) => setTimeout(r, ms));
  yield { type: "user", message: { role: "user", content: text }, parent_tool_use_id: null, session_id: "" };
}
