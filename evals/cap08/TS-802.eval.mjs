// C001-TC-802 — verifies C001-TS-802 (C001-AC-802.1, C001-REQ-802): gate question. Presenting G2 for
// change 004, the conductor's message carries the gate summary and a sentence beginning "Approving
// means", and the question offers Approve, Approve with waivers, Revise, Stop. P-01 answers Revise.
import { askUserQuestions, checker } from "../harness/assert.mjs";
import { answering, gateG2, isGate } from "./gate.mjs";

export default {
  id: "TS-802",
  title: "Gate question",
  ...gateG2,
  answer: answering("Revise"),
  assert({ transcript }) {
    const { failures, check } = checker();
    const at = transcript.findIndex((r) => r.type === "harness" && r.event === "answer" && r.questions.some(isGate));
    check(at >= 0, "no gate question was asked");
    const gate = askUserQuestions(transcript).flatMap((c) => c.questions).find(isGate);
    check(JSON.stringify(gate?.options?.map((o) => o.label)) === JSON.stringify(["Approve", "Approve with waivers", "Revise", "Stop"]), `options: ${JSON.stringify(gate?.options?.map((o) => o.label))}`);
    // The text the conductor showed before the question (main thread, plus the question itself).
    const before = transcript.slice(0, at < 0 ? undefined : at)
      .filter((r) => r.type === "sdk" && r.message.type === "assistant" && !r.message.parent_tool_use_id)
      .flatMap((r) => (r.message.message?.content ?? []).filter((b) => b.type === "text").map((b) => b.text))
      .join("\n") + `\n${gate?.question ?? ""}`;
    check(/Gate G2\b[\s\S]*Lint:[\s\S]*Critic:/.test(before), "the gate summary (sdd gate show output) is not shown");
    check(/(^|[\s>*"“])Approving means\b/.test(before), 'no sentence beginning "Approving means"');
    return failures;
  },
};
