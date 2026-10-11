// Harness self-test (C001-T-029): a main-thread stub delegates to a subagent; the eval asserts the
// Agent call and the relayed reply, and exercises the per-subagent metrics.
import { checker, finalReply, toolCalls } from "../harness/assert.mjs";

export default {
  id: "delegation-stub",
  title: "Delegation to a subagent (stub delegator)",
  agent: "stub:stub-delegator",
  plugins: ["evals/fixtures/stub-plugin"],
  fixture: null,
  allowTools: ["Agent"],
  maxTurns: 8,
  maxBudgetUsd: 0.2,
  prompt: "Go.",
  assert({ transcript }) {
    const { failures, check } = checker();
    const agents = toolCalls(transcript).filter((c) => c.name === "Agent" || c.name === "Task");
    check(agents.length === 1, `expected one Agent call, got ${agents.length}`);
    check(String(agents[0]?.input?.subagent_type ?? "").endsWith("stub-echo"), `delegated to ${agents[0]?.input?.subagent_type}`);
    check(/RELAY: STUB-ECHO-7731/.test(finalReply(transcript)), `final reply: ${finalReply(transcript).slice(0, 80)}`);
    return failures;
  },
};
