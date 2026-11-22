# Manual VS Code runs — Copilot target package 0.1.1

C005-T-018 (C005-DOD-009): one recorded run per `@manual-vscode` scenario of CHG-005, on the Copilot target
package 0.1.1 of the release commit `2fec7a8` (`dist/architect-copilot-0.1.1.zip`, SHA-256
`4a8ee3930854b4942e5ab340600ddf485ccd9a87fd9cfc859aa696a807c3a33a`) with the `architect-sdd` 0.1.1 tarball of
the same commit. Run sheet: `docs/runsheets/T-018-vscode-0.1.1.md`; run folder `C:\Sandbox\runs\t018`.

| Host | Version |
|---|---|
| VS Code (stable) | 1.145.2 |
| GitHub Copilot Chat (built in) | 0.73.0 |
| Session type | Local |
| Model | Claude Sonnet 5.5 (Copilot) |

Dialog screenshots are in `manual-runs/`. Chat session files and the hooks log stay on the executor's machine.

## Results

| Case | Scenario | Run | Result |
|---|---|---|---|
| C005-TC-054 row 1 | C005-TS-155, the message "I need a new change: export the order list to CSV" | A1, 2026-11-19 | passed |
| C005-TC-054 row 2 | C005-TS-155, the new-change prompt with the title "Toy change" | A2 = checklist step VSC-16, 2026-11-19 | passed |
| C005-TC-055 | C005-TS-157 | A1 (shared with row 1) | passed |
| C005-TC-062 | C005-TS-164 | A3, 2026-11-22 | passed |
| C005-TC-063 | C005-TS-165 | A3 (shared with C005-TC-062) | passed |

## A1 — C005-TS-155 row 1 and C005-TS-157

- **Repository:** `C:\Sandbox\runs\t018\csv`, fixture commit `ebf9148`: `src/orders.ts`, `package.json`, `sdd init`
  0.1.1, constitution approved, `sdd install copilot`; no change. Opened in VS Code, folder trusted.
- **Date:** 2026-11-19 08:16. Session agent `sdd-conductor` (workspace copy, from the chat session file).
- **Request:** the plain message `I need a new change: export the order list to CSV` (no prompt file).
- **Dialog** (`vscode_askQuestions`, screenshot `manual-runs/TS-155-row1-profile-dialog.jpg`): "Which profile should
  the change "Export the order list to CSV" use?" — 1 **lite (Recommended)**, "Estimate: about 2 stories, about 6
  requirements, 1 touched module (src/orders.ts); within the defaults of 3 stories, 10 requirements, 2 modules.";
  2 full. Second question: "Which kind is this change?" — brownfield (Recommended), mixed, greenfield.
- **Before the answer:** `.sdd/` held `_archive`, `_constitution`, `_decisions`, `_living`, `_templates` and no
  change folder.
- **Answer:** profile **lite**, kind **brownfield** (selected by the executor).
- **Result:** exactly one `sdd change new` run, `sdd change new "Export the order list to CSV" --profile lite --kind
  brownfield` (the session's other command was a status refresh); `.sdd/001-export-the-order-list-to-csv/change.md`
  gives `profile: "lite"` and `kind: "brownfield"`. **C005-TS-155 row 1 passed; C005-TS-157 passed.**

## A2 — C005-TS-155 row 2 (shared with checklist step VSC-16)

- **Repository:** the checklist's toy repository `C:\Sandbox\runs\t018\toy` after VSC-14 (initialised `.sdd/`,
  constitution approved at G0, no change).
- **Date:** 2026-11-19 07:07. Session agent `sdd-conductor` (plugin copy).
- **Request:** the new-change prompt (`prompts/new.prompt.md` attached) with the title "Toy change".
- **Dialog** (`vscode_askQuestions`, screenshot `manual-runs/TS-155-row2-VSC-16-profile-dialog.jpg`): "Which profile
  should CHG "Toy change" use?" — 1 **lite (Recommended)**, "Estimate: about 2 stories, 5 requirements, 1 module
  (src/app.ts), within the constitution thresholds (stories ≤ 3, requirements ≤ 10, modules ≤ 2)."; 2 full.
- **Before the answer:** no `.sdd/001-*` folder.
- **Answer:** lite, brownfield (recommended options).
- **Result:** `sdd change new "Toy change" --profile lite --kind brownfield` → CHG-001 in `001-toy-change`.
  **Passed.** Recorded as VSC-16 in `docs/checklists/records/vscode-2026-11-22-0.1.1.md`.

## A3 — C005-TS-164 and C005-TS-165

- **Repository:** `C:\Sandbox\runs\t018\export`, fixture commit `2888f58`: full-profile change `001` "Export to CSV"
  built with the sdd CLI 0.1.1 (constitution approved; ideation and its questions log as in
  `evals/chg005/pre-phase.mjs`, renumbered to 001; gate G1 approved; `10-spec` `not-started`; no
  `001-export-to-csv/10-spec/questions-log.md`); `sdd install copilot`. SHA-256 of
  `00-ideation/questions-log.md` before the turn: `BA9BEAEC9DCEFCF1294A5FF8634D1108C8DEF9482D9DE90C380DB3C4F9530A46`.
- **Date:** 2026-11-22 08:47. Session agent `sdd-conductor` (workspace copy), model `copilot/claude-sonnet-5.5`.
- **Request:** `G1 is approved. Before the spec starts, ask me whether the CSV export writes a header row`.
- **Dialog** (`vscode_askQuestions`, screenshot `manual-runs/TS-164-header-row-dialog.jpg`): "Does the CSV export
  write a header row as the first line of the file?" — 1 Yes, header row (Recommended); 2 No header row; 3 free text.
- **Answer:** P-01 typed `Yes, and use a semicolon separator` in the free-text field and submitted.
- **File contents:** `001-export-to-csv/10-spec/questions-log.md` was created with one round:

  ```text
  ## Round 1 — 2026-11-22

  **Pre-phase round:** answered after the approval of G1, before `10-spec` started.

  ### Q-export-02 — Does the CSV export write a header row?
  …
  - **Answer:** Yes, and use a semicolon separator
  - **Extracted instructions:**
    - Use a semicolon as the field separator in the CSV export.
  ```

- **Checks:** `00-ideation/questions-log.md` SHA-256 after the turn equals the value before;
  `sdd stale check 001` in the executor's own shell: `CHG-001 00-ideation: approved (hash matches)`, exit 0.
- **Result:** **C005-TS-164 passed** (one round, the answer verbatim, the ideation log byte-identical, no stale
  phase). **C005-TS-165 passed** (the entry states that the round was given before `10-spec` started, after the
  approval of gate G1).
- **Discarded tries** (not counted, nothing written): on 2026-11-19 a first try ran on VS Code's default agent
  (`code chat -m sdd-conductor` did not apply in the freshly opened window); its dialog was closed unanswered. A
  second try was interrupted by a laptop restart before the answer. Neither wrote a file
  (`git status` clean, ideation log hash unchanged).
