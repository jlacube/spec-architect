# C005-T-018 — Manual VS Code runs and checklist record, release 0.1.1

**Purpose:** with the Copilot target package 0.1.1 of the release commit `2fec7a8`, run the four `@manual-vscode`
scenarios of CHG-005 (C005-TS-155 with both Examples rows, C005-TS-157, C005-TS-164 with C005-TS-165) and the
manual checklist `docs/checklists/vscode-copilot.md` for enforcement mode `sdd-mcp-server`, then write the records
and run the release-check dry run.

Task C005-T-018 · cases C005-TC-054, C005-TC-055, C005-TC-062, C005-TC-063 (C005-DOD-009) · records
`docs/releases/copilot/0.1.1/manual-runs.md` and `docs/checklists/records/vscode-<YYYY-MM-DD>-0.1.1.md`

## Ready (done by the conductor)

| Item | State |
|---|---|
| Release commit | `2fec7a8`; `npm run check` passed there (`docs/release-0.1.1-evidence.md`, Check) |
| Package | `dist/architect-copilot-0.1.1.zip`, SHA-256 `4a8ee3930854b4942e5ab340600ddf485ccd9a87fd9cfc859aa696a807c3a33a` |
| CLI | `dist/architect-sdd-0.1.1.tgz` (not on npm yet: install the tarball, as the 0.1.0 checklist run did) |
| Host versions | `sdd host-version vscode`: `vscode 1.145.2`, `copilot-chat 0.73.0`; Copilot CLI 1.0.98. Keep updates off until this task is done. |
| Replay reports | `docs/releases/copilot/0.1.1/replay-sdd-mcp-server.json` and `replay-copilot-hooks.json`: 683 replayed, 26 not applicable, 0 differing, Git Bash and PowerShell 7 |
| Injection summary | `docs/releases/copilot/0.1.1/injection.json` (C005-T-024): 23 cases, 0 acted upon, Copilot CLI 1.0.98 |

## Executor and method

As for 0.1.0, the checklist allows the conductor to run the steps for you (C002-IF-009 §4 Executor), with the
method of `docs/runsheets/T-050-vscode-checklist.md` ("The conductor's method": `code chat -r -m sdd-conductor -a
<package folder>\prompts\<name>.prompt.md "…"`, Local session, Claude Sonnet 5.5 picked in each new window,
`chat.defaultToCopilotHarness` and `chat.editor.preferCopilotHarness` set to `false`). You run the steps that need
typing as one batch after VSC-29: VSC-30 with the free-text half of VSC-20, VSC-12 and the slash-list half of
VSC-01 on a twin. The scenarios below need dialog answers only, so the conductor can answer them through the
`askQuestions` dialog for you, or you answer them yourself; the record names who answered.

Before the run: back up the default profile's user `settings.json` (as T-050 step 0) and restore it at the end.

Run folder: `C:\Sandbox\runs\t018` (new and empty; the twin under `C:\Sandbox\runs\t018\twin`). The package is
unpacked to `C:\Sandbox\runs\t018\architect-copilot-0.1.1`, and its SHA-256 checked against the line above.

## Part A — the four scenarios

Each run is recorded in `docs/releases/copilot/0.1.1/manual-runs.md`: VS Code and Copilot Chat versions, date,
the dialog (screenshot or chat export), the answer, the file contents named by the scenario, and the result.

### A1 — C005-TS-155, row 1, and C005-TS-157 (one shared run)

1. Repository `C:\Sandbox\runs\t018\csv`: `git init`, one committed file `src/orders.ts`
   (`export const orders = [];`), `sdd init`, no change. `sdd install copilot --package <package folder>`, as
   VSC-02 does; open the folder in VS Code (trusted), select `sdd-conductor` in a Local chat.
2. Send the plain message: `I need a new change: export the order list to CSV`.
3. **C005-TS-155 row 1:** an `askQuestions` dialog proposes `lite` or `full` with the size estimate (stories,
   requirements, touched modules against the constitution thresholds). Before you answer, check that
   `.sdd/` holds no `001-*` folder.
4. Answer profile **lite** and kind **brownfield**.
5. **C005-TS-157:** the chat shows exactly one `sdd change new` run, with `--profile lite` and `--kind brownfield`;
   `.sdd/001-*/change.md` gives `profile: lite` and `kind: brownfield`.

### A2 — C005-TS-155, row 2

The toy repository of the checklist at VSC-16 is in this state (initialised `.sdd/`, no change), and VSC-16 sends
the new-change prompt with the title "Toy change". One run serves both: the record of A2 quotes the VSC-16 dialog
(profile with the size estimate, no change folder before the answer). If VSC-16 fails, A2 fails too.

### A3 — C005-TS-164 and C005-TS-165 (one shared run)

1. Repository `C:\Sandbox\runs\t018\export`: the conductor builds the full-profile change `001` "Export to CSV"
   with the sdd CLI 0.1.1 (constitution approved; ideation and its questions log written; gate G1 approved;
   `10-spec` `not-started`; no `001-export-to-csv/10-spec/questions-log.md`), as the eval fixture
   `evals/chg005/pre-phase.mjs` (`changeAtGate`, gate G1) does for change 002, and commits it.
   `sdd install copilot`, open in VS Code, `sdd-conductor` in a Local chat.
2. Note the SHA-256 of `001-export-to-csv/00-ideation/questions-log.md`.
3. Send: `G1 is approved. Before the spec starts, ask me whether the CSV export writes a header row`.
4. Answer the `askQuestions` dialog with the free text `Yes, and use a semicolon separator`.
5. **C005-TS-164:** `001-export-to-csv/10-spec/questions-log.md` exists and holds one round with that answer
   verbatim; the ideation log's SHA-256 is unchanged; `sdd stale check 001` in the terminal reports no stale phase.
6. **C005-TS-165:** the round entry states that the round was given before `10-spec` started, after the approval
   of gate G1.

## Part B — the checklist, `sdd-mcp-server`

Run order of the checklist (`vscode-copilot.md`, Run order, sdd-mcp-server): VSC-01, VSC-02, VSC-03, VSC-04,
VSC-07, VSC-08, VSC-10, VSC-11, VSC-12, VSC-13, VSC-14, VSC-15, VSC-16, VSC-17, VSC-18, VSC-19, VSC-20, VSC-21,
VSC-22, VSC-23, VSC-24, VSC-27, VSC-28, VSC-29, VSC-30, VSC-31, VSC-54; every `copilot-hooks` step is
`not-applicable`. Follow `docs/runsheets/T-050-vscode-checklist.md` steps 0 to 11 with these changes:

- version 0.1.1, run folder `C:\Sandbox\runs\t018`, package and tarball of the table above;
- the record is `docs/checklists/records/vscode-<YYYY-MM-DD>-0.1.1.md`, in the form of
  `docs/checklists/records/vscode-2026-11-13-0.1.0.md`;
- VSC-20's free-text half is typed while the toy ideation is open (in VSC-30's rework, or inside VSC-31 after the
  revise). With 0.1.1, an answer typed after G1 and before `10-spec` starts is logged in the `10-spec` questions log
  (C005-REQ-103), but the checklist step still asks for the open-phase form, so keep to it;
- the injection evidence of this mode is the summary of C005-T-024, not checklist steps.

## After the runs (conductor)

1. Write `manual-runs.md` (Part A) and the checklist record (Part B); restore your `settings.json`.
2. `node scripts/release-check.mjs --target copilot --dry-run`: it must print `released`, with no ERR-REL-002,
   ERR-REL-003, ERR-REL-006 or ERR-REL-009.
3. Commit the records and the replay reports with a message starting with C005-T-018; report C005-T-018 done.

A failed step or scenario: the conductor records it, opens a defect, and asks you. A fix to `src/`, `scripts/` or
`plugins/` takes the route "Fix after the floor runs or the release commit" of the plan (new release commit,
C005-T-024 and this task again).
