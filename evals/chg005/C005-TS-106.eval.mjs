// C005-TC-006 — verifies C005-TS-106 (C005-AC-102.1, C005-REQ-102): the profile and kind answers are passed to
// sdd change new.
import { changeMd, changeNewCalls, isKindQuestion, isProfileQuestion, newChangeCase, pick } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-106",
  title: "Profile and kind passed to sdd change new",
  prompt: "I need a new change: export the order list to CSV",
  reply: (q) => (isProfileQuestion(q) ? pick(q, /\blite\b/i) : isKindQuestion(q) ? pick(q, /\bbrownfield\b/i) : q.options[0].label),
  check({ transcript, root, check }) {
    const runs = changeNewCalls(transcript);
    check(runs.length === 1, `expected exactly one sdd change new call, got ${runs.length}`);
    const cmd = String(runs[0]?.input?.command ?? "");
    check(/--profile[ =]["']?lite\b/.test(cmd), `no --profile lite: ${cmd}`);
    check(/--kind[ =]["']?brownfield\b/.test(cmd), `no --kind brownfield: ${cmd}`);
    const md = changeMd(root, "002");
    check(/^profile: "?lite"?$/m.test(md), "change.md of 002 does not give profile: lite");
    check(/^kind: "?brownfield"?$/m.test(md), "change.md of 002 does not give kind: brownfield");
  },
});
