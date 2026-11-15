---
id: "C005-IDEA-QLOG"
artifact: ideation/questions-log
change: "CHG-005"
phase: 00-ideation
status: draft
---
# CHG-005 — Questions log

## Round 1 — 2026-11-15
<!-- Guidance: written by the conductor after each round (interview-protocol skill): one `### Q-<topic>-<nn> — <question>` entry per question with Blocking/Material, Why it matters, Options (recommended first), Rejected, Sources, Answer (verbatim) and Extracted instructions. -->

| ID | Question | Options presented | Answer | Decision |
|---|---|---|---|---|
| Q-route-01 | How to fix CHG-001 defects D-032, D-034 and D-035: revise CHG-001 before its archive, or release 0.1.0 with known gaps and fix them in a small new change? | A. Revise CHG-001 before the archive (moves the v0.1.0 tag, redoes the release evidence); B. Release 0.1.0 with known gaps, fix in a lite change "0.1.1 fixes" (Recommended) | "go with B" (P-01, 2026-11-15, conductor session) | B: CHG-005 (lite, brownfield) created; CHG-001 is archived by C001-T-075 with the three defects closed as known gaps of 0.1.0 carried to CHG-005 |

### Q-route-01 — Revise CHG-001 or carry the defects to a new change?

- **Blocking/Material:** material (scope of the 0.1.0 release).
- **Why it matters:** the three fixes touch the shared plugin text; fixing them inside CHG-001 moves the local
  `v0.1.0` tag and redoes the release evidence of both hosts.
- **Options:** B (recommended): release 0.1.0 with D-032, D-034 and D-035 as known gaps and fix them in a lite
  change, about 2.5–4M tokens, $2–4 Copilot CLI credits, about one day; A: revise CHG-001 before the archive,
  about 4–6M tokens, $3–5, about 1.5 days, release waits.
- **Answer (verbatim):** "go with B"
- **Extracted instructions:** order is C002-T-075 and C002-T-055 (P-01 publishes 0.1.0), then C001-T-075 (archive,
  P-01's decision, defects closed as carried to CHG-005), then CHG-005 ideation; D-032 needs one P-01 decision in
  the first interview round (must any request to create a change run the new-change procedure?).
