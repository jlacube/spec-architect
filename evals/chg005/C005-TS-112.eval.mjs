// C005-TC-012 — verifies C005-TS-112 (C005-AC-104.1, C005-REQ-104): the pre-phase round states the gate after
// which it was given; one case per Examples row.
import { changeAtGate, DIR, markedPrePhase, prePhaseCase, read, rounds } from "./pre-phase.mjs";

const ROWS = [
  ["G1", "10-spec", "G1 is approved. Before the spec starts, ask me whether the CSV export writes a header row"],
  ["G2", "20-plan", "G2 is approved. Before the plan starts, ask me whether the CSV export writes a header row"],
];

export default ROWS.map(([gate, phase, message]) =>
  prePhaseCase({
    id: `C005-TS-112-${gate}`,
    title: `Pre-phase round marked with its gate (${gate}, ${phase})`,
    fixture: changeAtGate({ gate }),
    prompt: message,
    reply: "Yes",
    check({ root, check }) {
      const rs = rounds(read(root, `${DIR}/${phase}/questions-log.md`));
      check(rs.length >= 1, `${phase}/questions-log.md has no round`);
      const r = rs.at(-1)?.text ?? "";
      check(markedPrePhase(r, gate, phase), `the round does not state it was given after ${gate}, before ${phase} started: ${r.slice(0, 200)}`);
    },
  }),
);
