// Eval harness logic on synthetic transcripts (C001-T-029): assertions, metrics, case grading,
// `claude plugin eval` result conversion and the metrics report. No model is called.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { askUserQuestions, finalReply, firstReply, optionProblems, toolCalls, writesOutside } from "../../../evals/harness/assert.mjs";
import { grade, loadCases } from "../../../evals/harness/cases.mjs";
import { runMetrics } from "../../../evals/harness/metrics.mjs";
import { fromAggregate } from "../../../evals/harness/plugin-eval.mjs";
import { renderReport, stats } from "../../../evals/harness/report.mjs";
import { repoRoot } from "../../helpers.ts";

type Rec = Record<string, unknown>;
const assistant = (t: number, id: string, content: Rec[], usage: Rec, extra: Rec = {}): Rec => ({
  t, type: "sdk", message: { type: "assistant", message: { id, model: "claude-haiku-5-5", content, usage }, parent_tool_use_id: null, ...extra },
});
const toolResult = (t: number, id: string, extra: Rec = {}): Rec => ({ t, type: "sdk", message: { type: "user", message: { content: [{ type: "tool_result", tool_use_id: id, content: "ok" }] }, ...extra } });
const usage = (input: number, output: number, read = 0, write = 0) => ({ input_tokens: input, output_tokens: output, cache_read_input_tokens: read, cache_creation_input_tokens: write });

// Main thread asks a question, delegates to a subagent that reads a file, writes a file, and the
// session produces two results (the first before the background subagent finished).
const TRANSCRIPT: Rec[] = [
  assistant(10, "m1", [{ type: "tool_use", id: "q1", name: "AskUserQuestion", input: { questions: [] } }], usage(5, 3, 100, 50)),
  { t: 20, type: "harness", event: "answer", questions: [{ question: "Color?", header: "Color", options: [{ label: "Red (Recommended)", description: "warm" }, { label: "Blue", description: "cool" }] }], answers: { "Color?": "Red (Recommended)" } },
  toolResult(25, "q1"),
  assistant(30, "m2", [{ type: "text", text: "Starting." }, { type: "tool_use", id: "a1", name: "Agent", input: { subagent_type: "architect:sdd-researcher", prompt: "x" } }], usage(2, 1, 150, 20)),
  { t: 31, type: "sdk", message: { type: "system", subtype: "task_started", task_id: "task9", tool_use_id: "a1", subagent_type: "architect:sdd-researcher" } },
  toolResult(32, "a1"),
  assistant(40, "s1", [{ type: "tool_use", id: "r1", name: "Read", input: { file_path: "notes.md" } }], usage(3, 1, 0, 400), { parent_tool_use_id: "a1", agent_id: "task9" }),
  toolResult(55, "r1", { parent_tool_use_id: "a1" }),
  { t: 60, type: "sdk", message: { type: "result", subtype: "success", result: "first", total_cost_usd: 0.001, modelUsage: {} } },
  { t: 70, type: "sdk", message: { type: "system", subtype: "task_notification", task_id: "task9", tool_use_id: "a1", usage: { total_tokens: 453, tool_uses: 1, duration_ms: 1234 } } },
  assistant(80, "m3", [{ type: "tool_use", id: "w1", name: "Write", input: { file_path: "../outside.md", content: "x" } }], usage(1, 1, 200, 0)),
  toolResult(90, "w1"),
  { t: 95, type: "sdk", message: { type: "result", subtype: "success", result: "final answer", total_cost_usd: 0.002, num_turns: 4, duration_api_ms: 900, modelUsage: { "claude-haiku-5-5": { inputTokens: 11, outputTokens: 120, cacheReadInputTokens: 450, cacheCreationInputTokens: 470, costUSD: 0.002 } } } },
];

test("assertion helpers read tool calls, answers, writes and replies", () => {
  assert.deepEqual(toolCalls(TRANSCRIPT).map((c) => c.name), ["AskUserQuestion", "Agent", "Read", "Write"]);
  assert.equal(toolCalls(TRANSCRIPT, "Read")[0]?.agent, "a1");
  assert.deepEqual(askUserQuestions(TRANSCRIPT)[0]?.answers, { "Color?": "Red (Recommended)" });
  assert.deepEqual(writesOutside(TRANSCRIPT, join("C:", "ws")), ["../outside.md"]);
  assert.equal(firstReply(TRANSCRIPT), "Starting.");
  assert.equal(finalReply(TRANSCRIPT), "final answer");
});

test("option format of C001-TS-207", () => {
  const ok = { options: [{ label: "A (Recommended)", description: "a" }, { label: "B", description: "b" }] };
  assert.deepEqual(optionProblems(ok), []);
  assert.deepEqual(optionProblems({ options: [{ label: "A", description: "" }] }), ["1 options", "option 1 has no description", "first option is not labelled (Recommended)"]);
  assert.deepEqual(optionProblems({ options: [{ label: "A (Recommended)", description: "a" }, { label: "B (Recommended)", description: "b" }, { label: "C", description: "c" }, { label: "D", description: "d" }] }), ["4 options", "option 2 is also labelled (Recommended)"]);
});

test("metrics attribute tokens per model and agent, and time subagents and tool calls", () => {
  const result = TRANSCRIPT.at(-1)!.message as Rec;
  const m = runMetrics(TRANSCRIPT, result, 1000);
  assert.equal(m.cost_usd, 0.002);
  assert.deepEqual(m.tokens_by_model, { "claude-haiku-5-5": { input: 11, output: 120, cache_read: 450, cache_write: 470, cost_usd: 0.002 } });
  // Subagent: input and cache from its request (3 + 400), output = total 453 − 403 = 50.
  const byAgent = m.tokens_by_agent as Record<string, { tokens: Rec }>;
  assert.deepEqual(byAgent["architect:sdd-researcher"]!.tokens, { input: 3, output: 50, cache_read: 0, cache_write: 400 });
  // Main thread: its requests' input and cache, output = model total 120 − subagent 50.
  assert.deepEqual(byAgent.main!.tokens, { input: 8, output: 70, cache_read: 450, cache_write: 70 });
  assert.deepEqual(m.subagents, [{ subagent: "architect:sdd-researcher", task_id: "task9", ms: 1234, tool_uses: 1, total_tokens: 453 }]);
  assert.deepEqual(m.tool_calls, { AskUserQuestion: 1, Agent: 1, Read: 1, Write: 1 });
  assert.deepEqual(m.tool_timings.map((t: Rec) => [t.tool, t.agent, t.ms]), [["AskUserQuestion", "main", 15], ["Agent", "main", 2], ["Read", "architect:sdd-researcher", 15], ["Write", "main", 10]]);
  assert.equal(m.turns, 4);
});

// C002-T-048 step X0 (defect D-025): a subagent still running when the session ended (no
// task_notification, for example at the spend cap) keeps the output its own messages show; the main
// thread keeps its own, and the rest of the model's output goes to "unattributed", never to `main`.
test("metrics: a subagent without a task_notification is not counted under main", () => {
  const T: Rec[] = [
    assistant(10, "m1", [{ type: "tool_use", id: "a1", name: "Agent", input: { subagent_type: "architect:sdd-critic", prompt: "x" } }], usage(2, 30, 100, 10)),
    { t: 11, type: "sdk", message: { type: "system", subtype: "task_started", task_id: "task7", tool_use_id: "a1", subagent_type: "architect:sdd-critic" } },
    assistant(20, "s1", [{ type: "text", text: "reviewing" }], usage(1, 40, 0, 300), { parent_tool_use_id: "a1", agent_id: "task7" }),
    assistant(30, "s2", [{ type: "text", text: "still reviewing" }], usage(1, 25, 300, 50), { parent_tool_use_id: "a1", agent_id: "task7" }),
    { t: 40, type: "sdk", message: { type: "result", subtype: "error_max_budget_usd", total_cost_usd: 0.51, num_turns: 3, modelUsage: { "claude-haiku-5-5": { inputTokens: 4, outputTokens: 1000, cacheReadInputTokens: 400, cacheCreationInputTokens: 360, costUSD: 0.51 } } } },
  ];
  const m = runMetrics(T, T.at(-1)!.message as Rec, 1000);
  const byAgent = m.tokens_by_agent as Record<string, { tokens: Rec; output: string }>;
  assert.equal(byAgent["architect:sdd-critic"]!.tokens.output, 65, "the critic's own messages: 40 + 25");
  assert.equal(byAgent.main!.tokens.output, 30, "main keeps only its own 30, not 1000 − 65");
  assert.equal(byAgent["unattributed"]!.tokens.output, 905, "the rest of the model's 1000");
  assert.match(byAgent["unattributed"]!.output, /not attributed/);
  assert.deepEqual(m.tokens_by_model, { "claude-haiku-5-5": { input: 4, output: 1000, cache_read: 400, cache_write: 360, cost_usd: 0.51 } }, "totals per model unchanged");
  assert.equal(m.cost_usd, 0.51);
  assert.equal((m.subagents as Rec[])[0]!["notified"], false);
});

test("plugin eval case files load and deterministic graders score them", () => {
  const cases = loadCases(join(repoRoot(), "evals", "fixtures", "stub-plugin", "evals"));
  assert.deepEqual(cases.map((c: Rec) => c.name), ["route-echo"]);
  assert.equal(cases[0].graders[0].type, "tool_used");
  const t = [assistant(1, "x", [{ type: "tool_use", id: "a", name: "Agent", input: { subagent_type: "stub:stub-echo" } }, { type: "tool_use", id: "b", name: "Read", input: {} }], usage(1, 1))];
  const graded = grade(
    [
      { name: "routed", type: "tool_used", tool: "Agent", input_match: '"subagent_type"\\s*:\\s*"stub:stub-echo"' },
      { name: "no-bash", type: "tool_used", tool: "Bash", min: 0, max: 0 },
      { name: "order", type: "tool_order", before: "Agent", after: "Read" },
      { name: "made", type: "file_exists", path: "out/*.md" },
      { name: "judge", type: "llm" },
    ],
    { transcript: t, created: ["out/a.md"] },
  );
  assert.deepEqual(graded.map((g: Rec) => [g.name, g.passed]), [["routed", true], ["no-bash", true], ["order", true], ["made", true], ["judge", false]]);
});

test("claude plugin eval results convert into result documents", () => {
  const doc = fromAggregate(
    { costUsd: 0.01, partial: false, aggregates: { overallScore: 0.5 }, cases: [{ name: "c1", arms: { with: [{ passed: true, score: 1, costUsd: 0.004, durationSeconds: 3, error: null, graders: [] }, { passed: false, score: 0, costUsd: 0.006, durationSeconds: 4, error: null, graders: [{ name: "routed", passed: false, scored: true, explanation: "Agent called 0x" }] }] } }] },
    { label: "t", suite: "s" },
  );
  assert.deepEqual([doc.runs, doc.passed, doc.pass, doc.overall_score], [2, 1, false, 0.5]);
  assert.deepEqual(doc.records[1]!.failures, ["routed: Agent called 0x"]);
  assert.equal(doc.records[0]!.metrics.session_ms, 3000);
});

test("metrics report: statistics, sections and release projection", () => {
  assert.deepEqual(stats([4, 1, 3, 2]), { n: 4, mean: 2.5, p50: 2, p95: 4, max: 4 });
  const m = runMetrics(TRANSCRIPT, TRANSCRIPT.at(-1)!.message as Rec, 1000);
  const md = renderReport([{ scenario: "TS-x", label: "dev", records: [{ pass: true, metrics: m }] }], new Date("2026-10-11T00:00:00Z"));
  for (const h of ["## Per scenario", "## Per agent", "## Subagents and tool calls", "## Per tier label", "## Release-tier projection"]) assert.ok(md.includes(h), h);
  assert.match(md, /\| TS-x \| 1 \| 1 \| \$0\.0020 \|/);
  assert.match(md, /\| subagent \| architect:sdd-researcher \| 1 \| 1\.2 s \|/);
  assert.match(md, /cost \$0\.0200, sequential duration 10\.0 s/);
});
