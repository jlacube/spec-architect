// C005-TC-056 — verifies C005-TS-158 (C005-AC-123.1, C005-REQ-123): the kind is asked in the round that
// proposes the profile, and no other question call comes before sdd change new.
import { answerPositions, firstChangeNewAt, isKindQuestion, isProfileQuestion, newChangeCase } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-158",
  title: "Kind asked in the round that proposes the profile",
  prompt: "I need a new change: export the order list to CSV",
  check({ transcript, calls, check }) {
    const i = calls.findIndex((c) => c.questions.some(isProfileQuestion));
    check(i >= 0, "no question call proposes lite or full");
    if (i < 0) return;
    check(calls[i].questions.some(isKindQuestion), "the profile call does not ask for the kind with greenfield, brownfield and mixed");
    const create = firstChangeNewAt(transcript);
    const before = answerPositions(transcript).filter((p) => create < 0 || p < create);
    check(before.length === 1, `expected one question call before sdd change new, got ${before.length}`);
  },
});
