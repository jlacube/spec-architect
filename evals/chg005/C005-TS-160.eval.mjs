// C005-TC-058 — verifies C005-TS-160 (C005-AC-123.1, C005-REQ-123): the kind is asked in a repository without
// code (no file outside .sdd/ and .git/, no change).
import { caseWorkspace, isKindQuestion, isProfileQuestion, newChangeCase } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-160",
  title: "Kind asked in a repository without code",
  prompt: "I need a new change: a CSV export tool",
  fixture: caseWorkspace({ code: false, archived: false }),
  check({ calls, check }) {
    const i = calls.findIndex((c) => c.questions.some(isProfileQuestion));
    check(i >= 0, "no question call proposes lite or full");
    if (i < 0) return;
    check(calls[i].questions.some(isKindQuestion), "the profile call does not ask for the kind with greenfield, brownfield and mixed");
    check(!calls[i].folders.some((d) => d.startsWith("001-")), "a folder .sdd/001-* existed before the answer");
  },
});
