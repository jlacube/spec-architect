// C005-TC-008 — verifies C005-TS-108 (C005-AC-103.1, C005-REQ-103): an answer after the G1 approval is logged
// as round 1 of the 10-spec questions log; the approved ideation log and its hash are untouched.
import { changeAtGate, DIR, noStale, prePhaseCase, read, rounds } from "./pre-phase.mjs";

const ANSWER = "Yes, and use a semicolon separator";
const today = () => new Date().toISOString().slice(0, 10);

export default prePhaseCase({
  id: "C005-TS-108",
  title: "Answer after the G1 approval logged in the 10-spec questions log",
  fixture: changeAtGate({ gate: "G1" }),
  prompt: "G1 is approved. Before the spec starts, ask me whether the CSV export writes a header row",
  reply: ANSWER,
  watch: [`${DIR}/00-ideation/questions-log.md`, `${DIR}/10-spec/questions-log.md`],
  check({ root, check, before, asked }) {
    check(before[`${DIR}/10-spec/questions-log.md`] === null, "fixture: 10-spec/questions-log.md existed");
    check(asked.length >= 1, "no question call");
    const log = read(root, `${DIR}/10-spec/questions-log.md`);
    check(log !== null, "10-spec/questions-log.md missing");
    const rs = rounds(log);
    check(rs.length === 1 && rs[0].n === 1, `expected one round numbered 1, got ${rs.map((r) => r.n).join(", ")}`);
    const r = rs[0]?.text ?? "";
    check(r.split("\n")[0].includes(today()) || r.split("\n")[0].includes(new Date().toLocaleDateString("sv-SE")), `round heading has not the date of the run: ${r.split("\n")[0]}`);
    const q = asked.flatMap((a) => a.questions).find((x) => /header/i.test(`${x.question} ${x.header}`));
    check(q, "no question on the header row was asked");
    if (q) {
      for (const o of q.options ?? []) check(r.includes(o.label.replace(/\s*\(Recommended\)\s*$/, "")), `the log lacks the option "${o.label}"`);
      check(/\(Recommended\)/.test(r) || (q.options ?? []).every((o) => !/\(Recommended\)/.test(o.label)), "the log lacks the recommendation");
    }
    const logged = r.split("\n").find((l) => l.startsWith("- **Answer:**"))?.slice("- **Answer:**".length).trim();
    check(logged === ANSWER, `the answer is not logged verbatim: ${logged}`);
    check(read(root, `${DIR}/00-ideation/questions-log.md`) === before[`${DIR}/00-ideation/questions-log.md`], "00-ideation/questions-log.md changed");
    noStale(root, check, ["00-ideation"]);
  },
});
