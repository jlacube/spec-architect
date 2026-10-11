// C001-TC-815 — verifies C001-TS-815 (C001-AC-813.1, C001-REQ-813): changed IDs and dependents. The approved
// spec of change 004 is in revision with REQ-012 modified, TS-044 added and REQ-020 tombstoned; when the
// conductor presents G2 again, the presentation shows those three changes and the tasks that implement or
// verify them (T-001, T-002). P-01 answers Revise, so nothing is approved.
import { askUserQuestions, checker, finalReply } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { isGate } from "./gate.mjs";
import { revised } from "./revise.mjs";

export default {
  id: "TS-815",
  title: "Changed IDs and dependents",
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: revised,
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 24,
  prompt: "/architect:gate 004",
  answer: (q) => (isGate(q) ? "Revise" : q.options[0].label),
  assert({ transcript }) {
    const { failures, check } = checker();
    const shown = [
      ...transcript.filter((r) => r.type === "sdk" && r.message.type === "assistant" && !r.message.parent_tool_use_id).flatMap((r) => (r.message.message?.content ?? []).filter((b) => b.type === "text").map((b) => b.text)),
      ...askUserQuestions(transcript).flatMap((c) => c.questions.map((q) => q.question)),
      finalReply(transcript),
    ].join("\n");
    check(/modified[^\n]*C004-REQ-012|C004-REQ-012[^\n]*modified/i.test(shown), "modified C004-REQ-012 not shown");
    check(/added[^\n]*C004-TS-044|C004-TS-044[^\n]*added/i.test(shown), "added C004-TS-044 not shown");
    check(/removed[^\n]*C004-REQ-020|C004-REQ-020[^\n]*(removed|tombstoned)/i.test(shown), "removed C004-REQ-020 not shown");
    for (const t of ["C004-T-001", "C004-T-002"]) check(shown.includes(t), `downstream task ${t} not shown`);
    return failures;
  },
};
