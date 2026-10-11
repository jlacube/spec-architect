// C001-TC-710 — verifies C001-TS-710 (C001-AC-710.1, C001-REQ-710): critic finding fields. On the
// seeded-defect spec, every finding of 90-critic-report.md has an ID CR-<n>, a severity, at least one
// artifact ID, a quote with file:line, a reason and a suggested fix.
import { checker } from "../harness/assert.mjs";
import { criticRun, findings, read, seededSpec, SPEC_REPORT, specBrief } from "./critic.mjs";

export const seededReview = criticRun(specBrief(), seededSpec);

export default {
  id: "TS-710",
  title: "Critic finding fields",
  ...seededReview,
  assert({ root }) {
    const { failures, check } = checker();
    const all = findings(read(root, SPEC_REPORT));
    check(all.length > 0, "no finding in 90-critic-report.md");
    for (const f of all) {
      check(/\*\*Severity:\*\*\s*(blocker|major|minor)\b/.test(f.body), `${f.id}: severity`);
      check(/\*\*Refs:\*\*[^\n]*C001-[A-Z]+-\d+/.test(f.body), `${f.id}: no artifact ID`);
      check(/\*\*Evidence:\*\*[^\n]*["“][^\n]+["”][^\n]*[\w./-]+\.md:\d+/.test(f.body), `${f.id}: no quote with file:line`);
      check(/\*\*Why it matters:\*\*\s*\S/.test(f.body), `${f.id}: no reason`);
      check(/\*\*Suggested fix:\*\*\s*\S/.test(f.body), `${f.id}: no suggested fix`);
    }
    return failures;
  },
};
