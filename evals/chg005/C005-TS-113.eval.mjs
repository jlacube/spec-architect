// C005-TC-013 — verifies C005-TS-113 (C005-AC-104.1, C005-REQ-104): a round answered after the phase started
// carries no pre-phase mark.
import { changeAtGate, DIR, markedPrePhase, prePhaseCase, read, rounds } from "./pre-phase.mjs";

export default prePhaseCase({
  id: "C005-TS-113",
  title: "Round answered after the phase started carries no pre-phase mark",
  fixture: changeAtGate({ gate: "G1", specDraft: true }),
  prompt: "Ask me whether the CSV export writes a header row",
  reply: "Yes",
  check({ root, check }) {
    const rs = rounds(read(root, `${DIR}/10-spec/questions-log.md`));
    check(rs.length >= 1, "10-spec/questions-log.md has no round");
    const r = rs.at(-1)?.text ?? "";
    check(/\*\*Answer:\*\*\s*Yes\s*$/m.test(r), `the answer "Yes" is not logged verbatim: ${/\*\*Answer:\*\*.*/.exec(r)?.[0]}`);
    check(!markedPrePhase(r, "G1", "10-spec") && !/pre-phase/i.test(r), "the round states it was given before 10-spec started");
  },
});
