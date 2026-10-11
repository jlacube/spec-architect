// C001-TC-301 — verifies C001-TS-301 (C001-AC-301.1, C001-REQ-301): research note shape.
import { checker } from "../harness/assert.mjs";
import { notes, researcherRun } from "./research.mjs";

const HEADINGS = ["Question", "Method", "Findings", "Confidence", "Implications", "Conflicting evidence", "Follow-up questions"];

export default {
  id: "TS-301",
  title: "Research note shape",
  ...researcherRun("Which S3 SDK supports client-side encryption in Node 20?"),
  assert({ root }) {
    const { failures, check } = checker();
    const files = Object.keys(notes(root));
    const note = files.find((f) => /^R-\d{3}-.+\.md$/.test(f));
    check(note, `no note matching R-\\d{3}-.+\\.md (found: ${files.join(", ") || "none"})`);
    const text = note ? notes(root)[note] : "";
    for (const h of HEADINGS) check(new RegExp(`^## ${h}\\s*$`, "m").test(text), `heading "${h}" missing`);
    return failures;
  },
};
