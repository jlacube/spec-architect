// C002-TC-217 — verifies C002-TS-217 (C002-AC-212.1, C002-REQ-212; C002-T-037): presenting gate G2 of
// change 002 of fx-gate (10-spec in review), the conductor shows the `sdd gate show` summary and a
// statement starting "Approving means", and one call of its host's question tool offers exactly
// Approve, Approve with waivers, Revise and Stop. P-01 answers Approve. Scenario Outline rows:
//   TS-217-claude-code  AskUserQuestion  (C002-T-037 step 4)
//   TS-217-opencode     `question`       (carried to C002-T-056, `run.mjs --host opencode`)
// The gate Given is the CHG-001 one (evals/cap08/gate.mjs) on change 002: fxGate of
// evals/harness/fixtures.mjs. Run the Claude Code row with `--only TS-217-claude-code`.
import { checker, toolCalls } from "../../harness/assert.mjs";
import { fxGate } from "../../harness/fixtures.mjs";
import { architectWithStubs } from "../../harness/overlay.mjs";

const CHOICES = ["Approve", "Approve with waivers", "Revise", "Stop"];
const HOST = {
  "claude-code": { agent: "architect:sdd-conductor", tool: "AskUserQuestion", prompt: "/architect:gate 002", plugins: [architectWithStubs] },
  opencode: { agent: "sdd-conductor", tool: "question", prompt: "/architect-gate 002" },
};

/** Whether the question is the gate question (its options include Approve and Stop). */
const isGate = (x) => (x.options ?? []).some((o) => /^Approve\b/.test(o.label)) && (x.options ?? []).some((o) => /^Stop\b/.test(o.label));

/** Main-thread text of the conductor before tool call `at` (by transcript order). */
function textBefore(transcript, t) {
  return transcript
    .filter((r) => r.type === "sdk" && r.message.type === "assistant" && !r.message.parent_tool_use_id && r.t <= t)
    .flatMap((r) => (r.message.message?.content ?? []).filter((b) => b.type === "text").map((b) => b.text))
    .join("\n");
}

function row(host) {
  const { agent, tool, prompt, plugins } = HOST[host];
  return {
    id: `TS-217-${host}`,
    title: `Gate question on ${host} through ${tool} (TS-217)`,
    host,
    agent,
    ...(plugins ? { plugins } : {}),
    fixture: (root) => fxGate(root),
    allowTools: ["Agent", "Write", "Edit", "Bash"],
    maxTurns: 24,
    maxBudgetUsd: 0.35,
    prompt,
    answer: (x) => (isGate(x) ? "Approve" : x.options[0].label),
    assert({ transcript }) {
      const { failures, check } = checker();
      const asks = toolCalls(transcript).filter((c) => c.name === tool && c.agent === null);
      const gates = asks.filter((c) => (c.input?.questions ?? []).some(isGate));
      check(gates.length === 1, `TS-217 ${host}: ${gates.length} ${tool} calls carry the gate question (one expected)`);
      if (gates.length === 0) return failures;
      const gate = gates[0].input.questions.find(isGate);
      const labels = (gate.options ?? []).map((o) => o.label);
      check(JSON.stringify(labels) === JSON.stringify(CHOICES), `TS-217 ${host}: options ${JSON.stringify(labels)}`);
      const shown = `${textBefore(transcript, gates[0].t)}\n${gate.question ?? ""}`;
      check(/Gate G2\b[\s\S]*Lint:[\s\S]*Critic:/.test(shown), `TS-217 ${host}: the sdd gate show summary is not shown`);
      check(/(^|[\s>*"“])Approving means\b/.test(shown), `TS-217 ${host}: no statement starting "Approving means"`);
      return failures;
    },
  };
}

export default [row("claude-code"), row("opencode")];
