// C001-TC-712 — verifies C001-TS-712 (C001-AC-712.1, C001-REQ-712): a clean review is justified. On the
// clean lite spec, when the critic reports fewer than three findings, the report has a "Why no further
// findings" section with one paragraph per rubric section it applied.
import { checker } from "../harness/assert.mjs";
import { cleanSpec, criticRun, findings, read, section, SPEC_REPORT, specBrief } from "./critic.mjs";

export default {
  id: "TS-712",
  title: "Clean review justified",
  ...criticRun(specBrief(), cleanSpec),
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, SPEC_REPORT);
    check(text, "no critic report");
    const n = findings(text).length;
    if (n >= 3) return failures; // the rule applies only below three findings
    const rubricSections = new Set(section(text, "Rubric").split("\n").filter((l) => /^\|/.test(l)).map((l) => l.split("|")[1]?.trim().toLowerCase()).filter((s) => s && !/^(rubric|-+)$/.test(s)));
    const why = section(text, "Why no further findings");
    check(why.trim(), `${n} findings and no "Why no further findings" section`);
    const paragraphs = why.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    check(paragraphs.length >= rubricSections.size, `${paragraphs.length} paragraphs for ${rubricSections.size} rubric sections (${[...rubricSections].join(", ")})`);
    for (const s of rubricSections) check(new RegExp(s.replace(/s$/, ""), "i").test(why), `no justification for rubric section "${s}"`);
    return failures;
  },
};
