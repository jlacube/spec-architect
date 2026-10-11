// C001-TC-201 — verifies C001-TS-201 (C001-AC-201.1, C001-REQ-201): launch the conductor.
// The plugin is loaded from the repository (the SDK equivalent of the local-marketplace install,
// spike S-05 B1/B2); the session reports the conductor's model and exact tool set, AskUserQuestion
// included.
import { checker } from "../harness/assert.mjs";

const TOOLS = ["AskUserQuestion", "Read", "Glob", "Grep", "Write", "Edit", "Bash", "TaskCreate", "TaskUpdate", "TaskList", "Skill"];

export default {
  id: "TS-201",
  title: "Launch the conductor",
  agent: "architect:sdd-conductor",
  fixture: "fx-bootstrap",
  // Task tools exist on current models only with this opt-in (C001-IF-09 notes).
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  maxTurns: 12,
  prompt: "hi",
  assert({ transcript }) {
    const { failures, check } = checker();
    const init = transcript.find((r) => r.type === "sdk" && r.message.type === "system" && r.message.subtype === "init")?.message;
    check(init, "no init message");
    check(/opus/.test(String(init?.model)), `model ${init?.model}`);
    for (const t of TOOLS) check(init?.tools?.includes(t), `tool ${t} not available`);
    check(init?.tools?.some((t) => t === "Agent" || t === "Task"), "Agent tool not available");
    check(init?.agents?.includes("architect:sdd-conductor"), "plugin agent architect:sdd-conductor not registered");
    check(init?.skills?.some((s) => /sdd-conventions/.test(s)), "skill sdd-conventions not loaded");
    return failures;
  },
};
