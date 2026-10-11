// C001-TC-307 — verifies C001-TS-307 (C001-AC-306.1, C001-REQ-306): Context7 unreachable. With the Context7
// server removed from the plugin, the note's Method names "Context7 unavailable" and WebSearch/WebFetch
// as substitute, and the note still has sourced findings.
import { checker } from "../harness/assert.mjs";
import { architectWithout } from "../harness/overlay.mjs";
import { notes, researcherRun, section } from "./research.mjs";

export default {
  id: "TS-307",
  title: "Context7 unreachable",
  ...researcherRun("How do I configure retries in the AWS SDK v3 S3 client?"),
  plugins: [architectWithout("context7")],
  assert({ root }) {
    const { failures, check } = checker();
    const all = Object.values(notes(root)).join("\n");
    check(all, "no note written");
    const method = section(all, "Method");
    check(/Context7 unavailable/i.test(method), `Method does not say "Context7 unavailable":\n${method.slice(0, 400)}`);
    check(/WebSearch/.test(method) && /WebFetch/.test(method), "Method does not name WebSearch/WebFetch as substitute");
    const findings = section(all, "Findings");
    check(/https?:\/\/\S+ \(\d{4}-\d{2}-\d{2}\)/.test(findings), "no sourced, dated finding");
    return failures;
  },
};
