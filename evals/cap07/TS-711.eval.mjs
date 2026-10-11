// C001-TC-711 — verifies C001-TS-711 (C001-AC-711.1, C001-REQ-711): rubric coverage. The critique-rubrics
// skill defines 12 items for requirements; the report's rubric table has 12 requirement rows, each
// pass, a finding ID or "n/a: <reason>". Same seeded-spec review as TS-710.
import { checker } from "../harness/assert.mjs";
import { read, section, SPEC_REPORT } from "./critic.mjs";
import { seededReview } from "./TS-710.eval.mjs";

export default {
  id: "TS-711",
  title: "Rubric coverage",
  ...seededReview,
  assert({ root }) {
    const { failures, check } = checker();
    const rubric = section(read(root, SPEC_REPORT), "Rubric");
    const rows = rubric.split("\n").filter((l) => /^\|/.test(l)).map((l) => l.split("|").map((c) => c.trim())).filter((r) => /^requirements?$/i.test(r[1] ?? "") || /^R\d{1,2}\b/.test(r[2] ?? r[1] ?? ""));
    const items = new Set(rows.map((r) => /\bR(\d{1,2})\b/.exec(`${r[1]} ${r[2]}`)?.[1]).filter(Boolean));
    check(items.size === 12, `requirement rubric rows R1…R12: found ${[...items].sort((a, b) => a - b).join(", ") || "none"}`);
    for (const r of rows) {
      const result = r[r.length - 2] ?? "";
      check(/^(pass|CR-\d+(,\s*CR-\d+)*|n\/a:\s*\S.*)$/i.test(result), `row "${r.slice(1, -1).join(" | ")}" has result "${result}"`);
    }
    return failures;
  },
};
