// C005-TC-009 — verifies C005-TS-109 (C005-AC-103.1, C005-REQ-103): an answer after the G2 approval goes to the
// 20-plan questions log; the approved 10-spec log is untouched.
import { changeAtGate, DIR, noStale, prePhaseCase, read, rounds } from "./pre-phase.mjs";

const ANSWER = "No, import first";

export default prePhaseCase({
  id: "C005-TS-109",
  title: "Answer after the G2 approval goes to the 20-plan log",
  fixture: changeAtGate({ gate: "G2", withImport: true }),
  prompt: "G2 is approved. Before the plan starts, ask me whether the export task comes before the import task",
  reply: ANSWER,
  watch: [`${DIR}/10-spec/questions-log.md`, `${DIR}/20-plan/questions-log.md`],
  check({ root, check, before }) {
    check(before[`${DIR}/20-plan/questions-log.md`] === null, "fixture: 20-plan/questions-log.md existed");
    const log = read(root, `${DIR}/20-plan/questions-log.md`);
    check(log !== null, "20-plan/questions-log.md missing");
    const rs = rounds(log);
    check(rs.length === 1, `expected one round, got ${rs.length}`);
    check(/\*\*Answer:\*\*\s*No, import first\s*$/m.test(rs[0]?.text ?? ""), `the answer is not logged verbatim: ${/\*\*Answer:\*\*.*/.exec(rs[0]?.text ?? "")?.[0]}`);
    check(read(root, `${DIR}/10-spec/questions-log.md`) === before[`${DIR}/10-spec/questions-log.md`], "10-spec/questions-log.md changed");
    noStale(root, check, ["00-ideation", "10-spec"]);
  },
});
