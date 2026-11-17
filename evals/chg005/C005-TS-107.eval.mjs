// C005-TC-007 — verifies C005-TS-107 (C005-AC-102.1, C005-REQ-102): answers equal to the CLI defaults are
// passed as options.
import { changeMd, changeNewCalls, isKindQuestion, isProfileQuestion, newChangeCase, pick } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-107",
  title: "Answers equal to the CLI defaults are passed as options",
  prompt: "I need a new change: export the order list to CSV",
  reply: (q) => (isProfileQuestion(q) ? pick(q, /\bfull\b/i) : isKindQuestion(q) ? pick(q, /\bgreenfield\b/i) : q.options[0].label),
  check({ transcript, root, check }) {
    const runs = changeNewCalls(transcript);
    check(runs.length === 1, `expected exactly one sdd change new call, got ${runs.length}`);
    const cmd = String(runs[0]?.input?.command ?? "");
    check(/--profile[ =]["']?full\b/.test(cmd), `no --profile full: ${cmd}`);
    check(/--kind[ =]["']?greenfield\b/.test(cmd), `no --kind greenfield: ${cmd}`);
    const md = changeMd(root, "002");
    check(/^profile: "?full"?$/m.test(md), "change.md of 002 does not give profile: full");
    check(/^kind: "?greenfield"?$/m.test(md), "change.md of 002 does not give kind: greenfield");
  },
});
