// One seeded-spec critic review graded against C001-TS-710, 711, 713 and the calibration rule together:
// the four scenarios share the same Given and When, so one session evidences all of them (each file
// can still be run on its own). Failures are prefixed with the scenario they belong to.
import ts710 from "./TS-710.eval.mjs";
import ts711 from "./TS-711.eval.mjs";
import ts713 from "./TS-713.eval.mjs";
import calibration from "./calibration.eval.mjs";

const PARTS = [ts710, ts711, ts713, calibration];

export default {
  ...ts710,
  id: "seeded-review",
  title: "Seeded-spec critic review (TS-710, TS-711, TS-713, calibration)",
  async assert(run) {
    const failures = [];
    for (const p of PARTS) for (const f of (await p.assert(run)) ?? []) failures.push(`${p.id}: ${f}`);
    return failures;
  },
};
