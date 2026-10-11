// C001-TC-423 — verifies C001-TS-423 (C001-AC-421.1, C001-REQ-421): the author lacks a threshold value.
// Nothing records the p95 latency target of C004-NFR-101; the Threshold field holds
// "[NEEDS CLARIFICATION: Q-spec-03]" and the hand-back's questions block has a question Q-spec-03.
import { checker } from "../harness/assert.mjs";
import { questionsBlocks } from "../harness/questions.mjs";
import { handback } from "../cap03/research.mjs";
import { brief, read, SPEC, writerRun } from "./spec.mjs";

export default {
  id: "TS-423",
  title: "Author lacks a threshold value",
  ...writerRun(brief("step 3 — NFRs", "write C004-NFR-101: the p95 response time of the invoice download. No document records a latency target and P-01 has not set one. Questions Q-spec-01 and Q-spec-02 are already used in this phase, so your next question ID is Q-spec-03.", `\`${SPEC}/30-nfr/nfr.md\`.`)),
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const nfr = read(root, `${SPEC}/30-nfr/nfr.md`);
    const threshold = /\*\*Threshold:\*\*([^\n]*)/.exec(nfr.slice(nfr.indexOf("NFR-101")))?.[1] ?? "";
    check(/\[NEEDS CLARIFICATION: Q-spec-03\]/.test(threshold), `Threshold: ${threshold.trim() || "(none)"}`);
    const back = handback(transcript, "sdd-spec-writer");
    const qs = questionsBlocks(back).flatMap((b) => b.questions ?? []);
    check(qs.some((q) => q.id === "Q-spec-03"), `no question Q-spec-03 in the hand-back (ids: ${qs.map((q) => q.id).join(", ") || "none"})`);
    return failures;
  },
};
