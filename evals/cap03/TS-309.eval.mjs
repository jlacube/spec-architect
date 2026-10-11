// C001-TC-309 — verifies C001-TS-309 (C001-AC-309.1, C001-REQ-309): options analysis shape. Headings in
// order, weights summing to 100 %, 4 or 5 candidate rows with integer scores 1–5; the lint's
// arithmetic check (LINT-OA-001) is clean.
import { checker } from "../harness/assert.mjs";
import { analyses, analystRun, lintFindings, section, tableRows } from "./options.mjs";

const HEADINGS = ["Problem", "Criteria", "Candidates", "Scores", "Sensitivity", "Presented", "Recommendation", "Rejected"];

export default {
  id: "TS-309",
  title: "Options analysis shape",
  ...analystRun("Where should appointment data be stored for v1: which persistence technology?"),
  assert({ root }) {
    const { failures, check } = checker();
    const [name, text = ""] = Object.entries(analyses(root))[0] ?? [];
    check(name, "no OA file written");
    const heads = [...text.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
    check(JSON.stringify(heads.filter((h) => HEADINGS.includes(h))) === JSON.stringify(HEADINGS), `headings: ${heads.join(", ")}`);
    const weights = tableRows(section(text, "Criteria")).map((r) => Number(String(r[1] ?? "").replace(/[%\s]/g, ""))).filter((n) => !Number.isNaN(n));
    const sum = weights.reduce((a, b) => a + b, 0);
    check(Math.abs(sum - 100) < 0.01 || Math.abs(sum - 1) < 0.0001, `criteria weights sum to ${sum}`);
    const rows = tableRows(section(text, "Scores")).filter((r) => r[0] && !/^-+$/.test(r[0]));
    check(rows.length >= 4 && rows.length <= 5, `${rows.length} score rows`);
    for (const r of rows) for (const c of r.slice(1, -1)) check(/^[1-5]$/.test(c.replace(/\*/g, "")), `score "${c}" in row ${r[0]} is not an integer 1–5`);
    check(lintFindings(root, "LINT-OA-001").length === 0, `LINT-OA-001: ${JSON.stringify(lintFindings(root, "LINT-OA-001"))}`);
    return failures;
  },
};
