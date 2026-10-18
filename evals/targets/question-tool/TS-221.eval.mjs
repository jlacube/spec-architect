// C002-TC-221 — verifies C002-TS-221 (C002-AC-214.1, C002-REQ-214; C002-T-037): on OpenCode the conductor
// must ask about "Inlining budget for the generated conductor agent" (50 characters); its `question`
// call has a header of at most 30 characters and every option a non-empty description. The interview
// Given is the C001 interview fixture (evals/cap02/interview.mjs) with one hand-back question of that
// topic. OpenCode only: run by C002-T-056 through `run.mjs --host opencode` (runner of C002-T-044), which
// the `host` field selects.
import { checker, toolCalls } from "../../harness/assert.mjs";
import { interviewFixture, PROMPT, q } from "../../cap02/interview.mjs";

const TOPIC = "Inlining budget for the generated conductor agent";

export default [
  {
    id: "TS-221",
    title: "Long topic on the OpenCode question tool: header ≤ 30 characters, every option described (TS-221)",
    host: "opencode",
    agent: "sdd-conductor",
    fixture: interviewFixture({
      "sdd-researcher": [
        q("Q-inlining-budget-01", TOPIC, "How many lines may the inlined skills add to the generated conductor agent?", {
          options: [
            { label: "Up to 1500 lines (Recommended)", rationale: "Fits the host's agent file limit with room for the body.", recommended: true },
            { label: "No limit", rationale: "Risks an agent file the host truncates." },
          ],
        }),
      ],
    }),
    allowTools: ["Write", "Edit"],
    maxTurns: 16,
    maxBudgetUsd: 0.35,
    prompt: PROMPT,
    assert({ transcript }) {
      const { failures, check } = checker();
      // The scenario says 50 characters; the quoted topic has 49. What matters is that it exceeds 30.
      if (TOPIC.length <= 30) failures.push(`TS-221: the topic has ${TOPIC.length} characters, not more than 30`);
      const asks = toolCalls(transcript).filter((c) => c.name === "question" && c.agent === null);
      check(asks.length > 0, "TS-221: no question call");
      for (const [i, c] of asks.entries())
        for (const x of c.input?.questions ?? []) {
          const header = String(x.header ?? "");
          check(header.length <= 30, `TS-221: call ${i + 1} header ${JSON.stringify(header)} has ${header.length} characters`);
          for (const [j, o] of (x.options ?? []).entries()) check(String(o.description ?? "").trim() !== "", `TS-221: call ${i + 1} option ${j + 1} has no description`);
        }
      return failures;
    },
  },
];
