// One ideation critic review graded against C001-TS-319 and C001-TS-320 together (same Given and When).
import ts319 from "./TS-319.eval.mjs";
import ts320 from "./TS-320.eval.mjs";

export default {
  ...ts319,
  id: "ideation-review",
  title: "Ideation critic review (TS-319, TS-320)",
  async assert(run) {
    const failures = [];
    for (const p of [ts319, ts320]) for (const f of (await p.assert(run)) ?? []) failures.push(`${p.id}: ${f}`);
    return failures;
  },
};
