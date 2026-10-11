// C001-TC-312 — verifies C001-TS-312 (C001-AC-311.1, C001-REQ-311): recommended option scores lower. The
// brief fixes the scores so that A totals 4.10 and C 4.15, with a qualitative argument that favours A;
// the Recommendation section names A and states an explicit tie-breaker.
import { checker } from "../harness/assert.mjs";
import { analyses, analystRun, section } from "./options.mjs";

// Weights 35/45/20; A = 5·0.35 + 3·0.45 + 5·0.20 = 4.10; C = 5·0.35 + 4·0.45 + 3·0.20 = 4.15.
const EXTRA = `The scoring workshop already fixed the criteria, weights and scores; use them exactly:
| Criterion | Weight |
|---|---|
| Low operating cost | 35 % |
| Delivery speed | 45 % |
| Data portability | 20 % |
Scores (cost, speed, portability): A "Managed PostgreSQL" 5, 3, 5; B "SQLite on the app server" 5, 2, 3; C "Vendor booking backend (SaaS)" 5, 4, 3; D "Spreadsheet export" 5, 1, 2.
Context: P-01 stated that patient data must stay exportable without depending on one vendor, and that decisions should stay reversible. Present A and C; recommend the candidate you judge best.`;

export default {
  id: "TS-312",
  title: "Recommended option scores lower",
  ...analystRun("Which backend should store appointments for v1?", EXTRA),
  assert({ root }) {
    const { failures, check } = checker();
    const text = Object.values(analyses(root))[0] ?? "";
    check(text, "no OA file written");
    const rec = section(text, "Recommendation");
    check(/PostgreSQL|\bA\b/.test(rec), `Recommendation does not name A:\n${rec.slice(0, 300)}`);
    const tie = /tie[- ]?break|despite|although|even though|outweigh|lower (weighted )?(total|score)|0\.05/i.test(rec);
    check(tie, "no explicit tie-breaker sentence in Recommendation");
    check(/portab|lock-?in|revers|vendor/i.test(rec), "the tie-breaker names no criterion or argument favouring A");
    return failures;
  },
};
