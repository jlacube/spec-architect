// C001-T-039 verification: the critic finds ≥ 80 % of the seeded defects of the calibration spec (five
// requirements with one defect each, evals/cap07/critic.mjs SEEDED). A defect counts as found when a
// finding references the seeded requirement ID.
import { checker } from "../harness/assert.mjs";
import { findings, read, SEEDED, SPEC_REPORT } from "./critic.mjs";
import { seededReview } from "./TS-710.eval.mjs";

export default {
  id: "critic-calibration",
  title: "Critic finds seeded defects (≥ 80 %)",
  ...seededReview,
  assert({ root }) {
    const { failures, check } = checker();
    const all = findings(read(root, SPEC_REPORT)).map((f) => f.body).join("\n");
    const found = Object.keys(SEEDED).filter((id) => new RegExp(`\\b${id}\\b`).test(all));
    const missed = Object.keys(SEEDED).filter((id) => !found.includes(id));
    check(found.length / Object.keys(SEEDED).length >= 0.8, `found ${found.length}/${Object.keys(SEEDED).length}; missed: ${missed.map((m) => `${m} (${SEEDED[m]})`).join("; ")}`);
    return failures;
  },
};
