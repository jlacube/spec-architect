// Per-run metrics record (C001-ADR-003 consequences, C001-T-029): tokens by type per model and per
// agent, cost estimate, wall-clock time per session, subagent and tool call, tool-call counts.
//
// Sources (Agent SDK, Claude Code 2.1.295):
// - per model: the result message's `modelUsage` (exact, with the list-price cost);
// - per agent, input and cache tokens: the `usage` of each API request (assistant messages, keyed by
//   message id; `agent_id` names the subagent, absent on the main thread);
// - per agent, output tokens: assistant messages only carry a streaming snapshot, so a subagent's
//   output is its `task_notification` `usage.total_tokens` minus its input and cache tokens, and the
//   main thread's output is the model total minus the subagents' (marked `output: "derived"`); a
//   subagent still running when the session ended has no notification: it and the main thread then keep
//   the output their own messages show (`output: "shown"`) and the rest of that model's output goes to
//   the entry `unattributed` (C002-T-048 step X0, defect D-025);
// - subagent wall-clock time and tool uses: `task_notification.usage`;
// - tool-call time: from the assistant message carrying the call to the message with its result.
import { toolCalls } from "./assert.mjs";

const IN_FIELDS = [
  ["input", "input_tokens"],
  ["cache_read", "cache_read_input_tokens"],
  ["cache_write", "cache_creation_input_tokens"],
];

export function runMetrics(transcript, result, wallMs) {
  const sdk = transcript.filter((r) => r.type === "sdk");
  const started = new Map(); // task_id → { subagent, tool_use_id }
  const finished = new Map(); // task_id → usage
  for (const { message: m } of sdk) {
    if (m.type !== "system") continue;
    if (m.subtype === "task_started") started.set(m.task_id, { subagent: m.subagent_type ?? "subagent", tool_use_id: m.tool_use_id });
    if (m.subtype === "task_notification") finished.set(m.task_id, m.usage ?? {});
  }
  const agentName = (m) => (m.agent_id ? (started.get(m.agent_id)?.subagent ?? "subagent") : "main");

  // Input and cache tokens per API request, once per message id; `shown` the output its messages show.
  const requests = new Map();
  for (const { message: m } of sdk) {
    if (m.type !== "assistant") continue;
    const msg = m.message ?? {};
    const key = `${m.agent_id ?? "main"}:${msg.id ?? requests.size}`;
    const cur = requests.get(key) ?? { agent: agentName(m), task: m.agent_id ?? null, model: msg.model ?? "unknown", usage: {}, shown: 0 };
    for (const [k, f] of IN_FIELDS) cur.usage[k] = Math.max(cur.usage[k] ?? 0, Number(msg.usage?.[f]) || 0);
    cur.shown = Math.max(cur.shown, Number(msg.usage?.output_tokens) || 0);
    requests.set(key, cur);
  }
  const byAgent = {};
  const perTask = new Map();
  for (const r of requests.values()) {
    const entry = (byAgent[r.agent] ??= { models: [], tokens: { input: 0, output: 0, cache_read: 0, cache_write: 0 }, output: "derived" });
    if (!entry.models.includes(r.model)) entry.models.push(r.model);
    for (const [k] of IN_FIELDS) entry.tokens[k] += r.usage[k];
    if (r.task) {
      const t = perTask.get(r.task) ?? { agent: r.agent, model: r.model, inputs: 0 };
      t.inputs += r.usage.input + r.usage.cache_read + r.usage.cache_write;
      perTask.set(r.task, t);
    }
  }

  const byModel = {};
  for (const [model, u] of Object.entries(result?.modelUsage ?? {}))
    byModel[model] = { input: u.inputTokens ?? 0, output: u.outputTokens ?? 0, cache_read: u.cacheReadInputTokens ?? 0, cache_write: u.cacheCreationInputTokens ?? 0, cost_usd: u.costUSD ?? 0 };

  // Output tokens: a notified subagent from its total; a subagent still running when the session ended
  // (no task_notification) from the output its own messages show. The main thread gets the rest of its
  // model's output, unless a subagent without a notification ran on that model (C002-T-048 step X0,
  // defect D-025): then the main thread keeps the output its own messages show, and the rest of that
  // model's total goes to the entry "unattributed" instead of to `main` by subtraction.
  const shownByTask = new Map();
  const shownMainByModel = {};
  for (const r of requests.values()) {
    if (r.task) shownByTask.set(r.task, (shownByTask.get(r.task) ?? 0) + r.shown);
    else if (r.agent === "main") shownMainByModel[r.model] = (shownMainByModel[r.model] ?? 0) + r.shown;
  }
  const subOutputByModel = {};
  const unnotifiedModels = new Set();
  const subagents = [];
  for (const [task, info] of started) {
    const notified = finished.has(task);
    const usage = finished.get(task) ?? {};
    const t = perTask.get(task);
    const output = notified ? Math.max(0, (Number(usage.total_tokens) || 0) - (t?.inputs ?? 0)) : (shownByTask.get(task) ?? 0);
    if (t) {
      byAgent[t.agent].tokens.output += output;
      if (!notified) {
        byAgent[t.agent].output = "shown";
        unnotifiedModels.add(t.model);
      }
      subOutputByModel[t.model] = (subOutputByModel[t.model] ?? 0) + output;
    }
    subagents.push({ subagent: info.subagent, task_id: task, ms: usage.duration_ms ?? null, tool_uses: usage.tool_uses ?? null, total_tokens: usage.total_tokens ?? null, ...(notified ? {} : { notified: false }) });
  }
  if (byAgent.main)
    for (const model of byAgent.main.models) {
      const total = byModel[model]?.output ?? 0;
      if (!unnotifiedModels.has(model)) {
        byAgent.main.tokens.output += Math.max(0, total - (subOutputByModel[model] ?? 0));
        continue;
      }
      const own = shownMainByModel[model] ?? 0;
      byAgent.main.tokens.output += own;
      byAgent.main.output = "shown";
      const rest = Math.max(0, total - own - (subOutputByModel[model] ?? 0));
      if (rest > 0) {
        const u = (byAgent.unattributed ??= { models: [], tokens: { input: 0, output: 0, cache_read: 0, cache_write: 0 }, output: "not attributed: a subagent ended without a task_notification" });
        if (!u.models.includes(model)) u.models.push(model);
        u.tokens.output += rest;
      }
    }
  for (const model of unnotifiedModels) {
    if (byAgent.main?.models.includes(model)) continue;
    const rest = Math.max(0, (byModel[model]?.output ?? 0) - (subOutputByModel[model] ?? 0));
    if (rest > 0) {
      const u = (byAgent.unattributed ??= { models: [], tokens: { input: 0, output: 0, cache_read: 0, cache_write: 0 }, output: "not attributed: a subagent ended without a task_notification" });
      if (!u.models.includes(model)) u.models.push(model);
      u.tokens.output += rest;
    }
  }

  const calls = toolCalls(transcript);
  const resultAt = new Map();
  for (const r of sdk)
    if (r.message.type === "user")
      for (const b of Array.isArray(r.message.message?.content) ? r.message.message.content : [])
        if (b.type === "tool_result" && !resultAt.has(b.tool_use_id)) resultAt.set(b.tool_use_id, r.t);
  const subagentOfCall = new Map([...started.values()].map((s) => [s.tool_use_id, s.subagent]));
  const toolCounts = {};
  for (const c of calls) toolCounts[c.name] = (toolCounts[c.name] ?? 0) + 1;

  return {
    cost_usd: result?.total_cost_usd ?? 0,
    session_ms: wallMs,
    api_ms: result?.duration_api_ms ?? null,
    turns: result?.num_turns ?? null,
    result_subtype: result?.subtype ?? "none",
    tokens_by_model: byModel,
    tokens_by_agent: byAgent,
    subagents,
    tool_calls: toolCounts,
    tool_timings: calls.map((c) => ({
      tool: c.name,
      agent: c.agent ? (subagentOfCall.get(c.agent) ?? "subagent") : "main",
      ...(subagentOfCall.has(c.id) ? { subagent: subagentOfCall.get(c.id) } : {}),
      ms: resultAt.has(c.id) ? resultAt.get(c.id) - c.t : null,
    })),
  };
}
