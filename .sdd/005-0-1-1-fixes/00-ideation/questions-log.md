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
- **Extracted instructions:** none from P-01's words. Conductor's sequencing note (not P-01's answer): order is C002-T-075 and C002-T-055 (P-01 publishes 0.1.0), then C001-T-075 (archive,
  P-01's decision, defects closed as carried to CHG-005), then CHG-005 ideation; D-032 needs one P-01 decision in
  the first interview round (must any request to create a change run the new-change procedure?).

## Round 2 — 2026-11-17

### Q-scope-01 — What should CHG-005 cover besides D-032, D-034 and D-035?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 4 (conductor analysis; lite profile, recorded in ideation.md §7)
- **Why it matters:** sets the scope of the lite change and of what the cartographer surveys.
- **Options:**
  1. Add archive precondition (Recommended) — also fix the self-blocking archive precondition noted in C001-T-075; small, CLI-side, the next archive hits it again.
  2. Three defects only — smallest 0.1.1; the archive precondition waits for a later change.
  3. Open a wider 0.1.1 list — cartographer collects all other 0.1.0 gaps first; slower, beyond a lite change.
- **Rejected:** Fold CHG-004 cost items into 0.1.1 — different goal and size; CHG-004 owns them.
- **Sources:** C001-T-075 report note; registry CHG-001 D-032, D-034, D-035.
- **Answer:** Add archive precondition + sdd hash can't has an archived change - both to fix
- **Extracted instructions:**
  - "sdd hash can't has an archived change" → scope adds a fifth item: `sdd hash` fails on a change that has been archived (moved to `_archive/`); fix it in CHG-005. Exact symptom to be confirmed by the cartographer.

### Q-newchange-01 — D-032: what should happen when P-01 asks for a new change in plain words, without /architect:new?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 4 (conductor analysis; ideation.md §7)
- **Why it matters:** C001-REQ-116 binds only when /architect:new runs; the plain-words path skips the profile round.
- **Options:**
  1. Always run new procedure (Recommended) — same new-change procedure for any create-change request; text-only, both hosts, CLI unchanged.
  2. Procedure + CLI requires --profile — also make `sdd change new` refuse without --profile; changes C001-IF-01.
  3. Redirect to /architect:new — create nothing, tell P-01 to run the command.
- **Rejected:** Keep as is and document — leaves C001-REQ-116's intent unmet on the most natural path.
- **Sources:** CHG-001 D-032.
- **Answer:** Always run new procedure (Recommended)
- **Extracted instructions:** none

### Q-postgate-01 — D-034: where should the conductor log an answer that arrives after a gate approval and before the next phase starts?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (conductor analysis; ideation.md §7)
- **Why it matters:** C001-REQ-210 needs every answer verbatim in a questions log; approved phases must not be edited outside a revision.
- **Options:**
  1. Next phase's log (Recommended) — next phase's questions-log.md, created on first use, marked as given before the phase started.
  2. Require a revision — reopen the approved phase; heavy for minor answers, makes later phases stale.
  3. Hold until next phase — no asking between phases; delays, may ask twice.
- **Rejected:** Log in change.md — change.md holds CLI-owned state and the Gate log, not interview content.
- **Sources:** CHG-001 D-034.
- **Answer:** Next phase's log (Recommended)
- **Extracted instructions:** none

## Round 3 — 2026-11-17

### Q-scope-02 — Which commands should accept an archived change?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 5 (cartographer reported 4; five are listed below)
- **Why it matters:** the change resolver is shared by twelve command paths; writing commands (task set, defect close, stale, trace --write, gate approve) would modify a closed change.
- **Options:**
  1. Read-only lookups (Recommended) — hash, gate show and other read-only commands resolve archived changes; writing commands keep refusing.
  2. Hash only — smallest; gate show and similar reads stay broken.
  3. Every command — uniform resolver; writing commands need an explicit refusal and more tests.
- **Rejected:** Clearer error only — leaves the reported failure in place; Move archived changes back to .sdd — breaks the archive layout and the status block.
- **Sources:** evidence/baseline-survey.md E-46, E-48, E-51
- **Answer:** Read-only lookups (Recommended)
- **Extracted instructions:** none

### Q-scope-03 — Should the archive precondition fix also cover the tasks of a lite change?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 4 (cartographer)
- **Why it matters:** `archiveBlockers` reads only `50-tasks/`; open lite tasks (plan.md sections) never block an archive.
- **Options:**
  1. Include lite tasks (Recommended) — one fix for both profiles; open lite tasks block as C001-REQ-913 states; needs a lite archive test.
  2. Self-blocking only — smaller; lite changes can still be archived with open tasks.
- **Rejected:** Drop the task precondition — contradicts C001-REQ-913; Defer to a later change — same function being edited.
- **Sources:** evidence/baseline-survey.md E-37, E-42, E-43
- **Answer:** Include lite tasks (Recommended)
- **Extracted instructions:** none

### Q-handoff-01 — D-035: what command should the hand-off give an implementer without the Architect plugin for reporting progress?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 5 (cartographer reported 4; five are listed below; merged with research R-001)
- **Why it matters:** both hand-off templates use `node <plugin-root>/scripts/sdd.mjs`; the npm rewrite, pinned test lines (C002-TS-529) and C002-REQ-518/519 depend on that shape.
- **Options:**
  1. Bare sdd + install line (Recommended) — `sdd …` after a one-time `npm install -g architect-sdd@<version>`; matches generated targets, npm rewrite becomes a no-op.
  2. Pinned npx line — `npx --yes --package architect-sdd@<version> sdd …`; no install, pinned; untested, first-run download, long lines.
  3. Plugin path + sdd fallback — widest coverage; longer text, tests still depend on the old line.
- **Rejected:** Frontmatter fallback only — drops the CLI reporting C001-REQ-616 requires; Planner substitutes a concrete path — works only where the plugin folder exists.
- **Sources:** evidence/baseline-survey.md E-27, E-30, E-33, E-36; research/R-001-sdd-without-plugin.md
- **Answer:** Bare sdd + install line (Recommended)
- **Extracted instructions:** none

## Round 4 — 2026-11-17

### Q-release-01 — Is the 0.1.1 release part of CHG-005?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (critic, CR-5)
- **Why it matters:** G-6 rested on an assumption; G-3's install line names `architect-sdd` at the plugin version, so 0.1.1 must be on npm.
- **Options:**
  1. Release 0.1.1 here (Recommended) — makes the G-3 install line work; the change title already says 0.1.1.
  2. Fixes only, release later — smaller; hand-offs would name an unpublished version or need another version rule.
- **Rejected:** Release the plugin without publishing npm — the hand-off install line fails; Publish npm only, no plugin release — the text fixes would not reach plugin users.
- **Sources:** C002-REQ-502, research/R-001-sdd-without-plugin.md, critic-report.md CR-5
- **Answer:** Release 0.1.1 here (Recommended)
- **Extracted instructions:** none

### Q-scope-04 — Should CHG-005 also decide where an answer given after the G3 approval (or after a Stop) is logged?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 4 (critic, CR-3)
- **Why it matters:** G-2 covers only the window between a gate approval and the next phase; after G3 there is no next phase.
- **Options:**
  1. Mark as non-goal (Recommended) — D-034 names only the window between phases; keeps the lite change small and G-2 testable.
  2. Cover it in CHG-005 — one more decision and scenario.
- **Rejected:** Leave it unstated — G-2's "every answer" stays ambiguous; Log it in the approved 20-plan log — edits an approved phase.
- **Sources:** C001-REQ-210, critic-report.md CR-3
- **Answer:** Mark as non-goal (Recommended)
- **Extracted instructions:** none
