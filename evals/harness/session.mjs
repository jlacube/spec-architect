// One eval session through the Agent SDK (C001-ADR-007): the plugin is loaded, a main-thread agent
// is selected, AskUserQuestion is answered with scripted choices through canUseTool, and every SDK
// message is recorded with its arrival time.
import { query } from "@anthropic-ai/claude-agent-sdk";
import { childEnv, claudeExecutable } from "./env.mjs";

/** Default answer policy: the first option, which the interview protocol marks "(Recommended)". */
export function firstOption(question) {
  return question.options?.[0]?.label ?? "";
}

/**
 * Runs one session and returns `{ transcript, answers, result, wallMs }`.
 * - `agent`: main-thread agent, e.g. "architect:sdd-conductor"
 * - `plugins`: plugin directories to load
 * - `answer(question, call)`: returns the label (or labels) to answer each AskUserQuestion question
 * - `allowTools`: tools approved without asking (others are denied, so a run cannot wander)
 * - `env`: extra environment variables for the session (for example CLAUDE_CODE_ENABLE_TODO_TOOLS)
 * - `startDelayMs`: send the prompt only after this delay (MCP servers connect first)
 */
export async function runSession({ cwd, prompt, agent, plugins = [], answer = firstOption, allowTools = [], maxTurns = 30, maxBudgetUsd = 0.5, model, env = {}, startDelayMs = 0 }) {
  const transcript = [];
  const answers = [];
  const t0 = Date.now();
  const stamp = (record) => transcript.push({ t: Date.now() - t0, ...record });
  const options = {
    cwd,
    env: childEnv(env),
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
    for await (const message of query({ prompt: input, options })) {
      stamp({ type: "sdk", message });
      if (message.type === "result") result = message;
    }
  } catch (e) {
    // An error result (for example the turn limit) ends the iteration with an exception after the
    // result message; the transcript up to there is still graded and its cost still counted.
    stamp({ type: "harness", event: "error", message: e instanceof Error ? e.message : String(e) });
    if (!result) throw e;
  }
  return { transcript, answers, result, wallMs: Date.now() - t0 };
}

async function* delayedPrompt(text, ms) {
  await new Promise((r) => setTimeout(r, ms));
  yield { type: "user", message: { role: "user", content: text }, parent_tool_use_id: null, session_id: "" };
}
