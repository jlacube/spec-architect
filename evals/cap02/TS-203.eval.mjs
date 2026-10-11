// C001-TC-203 — verifies C001-TS-203 (C001-AC-203.1, C001-REQ-203): no .sdd present.
import { checker, finalReply, toolCalls } from "../harness/assert.mjs";

export default {
  id: "TS-203",
  title: "No .sdd present",
  agent: "architect:sdd-conductor",
  fixture: "fx-empty",
  maxTurns: 10,
  prompt: "let's spec a feature",
  assert({ transcript }) {
    const { failures, check } = checker();
    check(/\/architect:init\b/.test(finalReply(transcript)), `reply does not propose /architect:init: ${finalReply(transcript).slice(0, 120)}`);
    check(toolCalls(transcript, "Write").length === 0, "Write was called");
    check(toolCalls(transcript).every((c) => c.name !== "Agent" && c.name !== "Task"), "an agent was spawned");
    return failures;
  },
};
