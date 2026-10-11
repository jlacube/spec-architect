// C001-TC-320 — verifies C001-TS-320 (C001-AC-318.1, C001-REQ-318): verdict line. The last section of the
// ideation critic report is "Verdict" with exactly one of go, needs-clarification, stop and at least one
// reason. Same ideation review as TS-319.
import { checker } from "../harness/assert.mjs";
import { read } from "../cap07/critic.mjs";
import { ideationReview, REPORT } from "./TS-319.eval.mjs";

export default {
  id: "TS-320",
  title: "Verdict line",
  ...ideationReview,
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, REPORT);
    const sections = [...text.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
    check(sections.at(-1) === "Verdict", `last section is "${sections.at(-1)}"`);
    const lines = text.slice(text.lastIndexOf("## Verdict")).split("\n").slice(1).filter((l) => l.trim());
    // The verdict is the first line of the section, e.g. "**needs-clarification**" or "Verdict: go — …".
    const verdict = /^[\s*_`>-]*(?:verdict:\s*)?[*_`]*(needs-clarification|go|stop)\b/i.exec(lines[0] ?? "")?.[1];
    check(verdict, `first line of Verdict is not go, needs-clarification or stop: ${lines[0] ?? "(empty)"}`);
    const rest = `${(lines[0] ?? "").replace(/^[\s\S]*?(needs-clarification|go|stop)\b[*_`]*/i, "")}\n${lines.slice(1).join("\n")}`;
    check(rest.replace(/[\s.:—-]/g, "").length > 10, "no reason after the verdict");
    return failures;
  },
};
