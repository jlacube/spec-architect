// C005-TC-010 — verifies C005-TS-110 (C005-AC-103.1, C005-REQ-103): a second pre-phase round is appended after
// the first. Round 1 of C005-TS-108 is in the log when the case starts.
import { changeAtGate, DIR, prePhaseCase, read, ROUND_1, rounds } from "./pre-phase.mjs";

export default prePhaseCase({
  id: "C005-TS-110",
  title: "Second pre-phase round appended after the first",
  fixture: changeAtGate({ gate: "G1", preRound: ROUND_1 }),
  prompt: "Also ask me whether empty orders are exported",
  reply: "No",
  watch: [`${DIR}/10-spec/questions-log.md`],
  check({ root, check }) {
    const rs = rounds(read(root, `${DIR}/10-spec/questions-log.md`));
    check(rs.length === 2, `expected exactly 2 rounds, got ${rs.length}`);
    check(rs[0]?.n === 1 && rs[0].text.trimEnd() === ROUND_1.trimEnd(), "round 1 changed");
    check(rs[1]?.n === 2, `the second round is numbered ${rs[1]?.n}`);
    check(/\*\*Answer:\*\*\s*No\s*$/m.test(rs[1]?.text ?? ""), `round 2 does not log the answer "No" verbatim: ${/\*\*Answer:\*\*.*/.exec(rs[1]?.text ?? "")?.[0]}`);
  },
});
