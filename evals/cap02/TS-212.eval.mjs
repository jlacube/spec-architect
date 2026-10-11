// C001-TC-212 — verifies C001-TS-212 (C001-AC-211.1, C001-REQ-211): embedded instruction surfaced.
// P-01 answers the diagram question with the recommended option plus an extra instruction; the
// conductor's next message lists it ("keep IR-ready component IDs") with how it will be applied, and
// the log records it under Extracted instructions.
import { optionProblems } from "../harness/assert.mjs";
import { interviewFixture, PROMPT, q, readLog, roundChecks } from "./interview.mjs";

const EXTRA = "Mermaid now (Recommended) but also keep IR-ready IDs";

const handbacks = {
  "sdd-researcher": [
    q("Q-diagrams-01", "diagrams", "Which diagram format should the architecture views use?", {
      options: [
        { label: "Mermaid now", rationale: "Renders in the repository host with no tooling.", recommended: true },
        { label: "Structurizr DSL", rationale: "Model-based views, needs an extra tool." },
      ],
    }),
  ],
};

export default {
  id: "TS-212",
  title: "Embedded instruction surfaced",
  agent: "architect:sdd-conductor",
  fixture: interviewFixture(handbacks),
  allowTools: ["Write", "Edit"],
  maxTurns: 20,
  prompt: PROMPT,
  answer: (question) => (/diagram/i.test(question.question) ? EXTRA : question.options[0].label),
  assert({ transcript, root }) {
    const { failures, check } = roundChecks(transcript, optionProblems);
    const answeredAt = transcript.findIndex((r) => r.type === "harness" && r.event === "answer");
    const after = transcript.slice(answeredAt + 1)
      .filter((r) => r.type === "sdk" && r.message.type === "assistant" && !r.message.parent_tool_use_id)
      .flatMap((r) => (r.message.message?.content ?? []).filter((b) => b.type === "text").map((b) => b.text))
      .join("\n");
    const result = transcript.filter((r) => r.type === "sdk" && r.message.type === "result").at(-1)?.message?.result ?? "";
    const next = `${after}\n${result}`;
    check(/IR[- ]ready/i.test(next) && /\bIDs?\b|identifier/i.test(next), "next message does not list the IR-ready IDs instruction");
    check(/appl|will|keep/i.test(next), "next message does not say how the instruction is applied");
    const log = readLog(root);
    check(log.includes(EXTRA), "answer not logged verbatim");
    check(/extracted instructions[^\n]*\n?[\s\S]{0,300}IR[- ]ready/i.test(log), "log does not record the extracted instruction");
    return failures;
  },
};
