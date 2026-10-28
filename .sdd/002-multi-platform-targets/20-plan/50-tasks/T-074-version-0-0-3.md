---
id: C002-T-074
title: "Fix for revisions D-036, D-037: package version 0.0.3 after the CHG-001 D-020 fix, the TS-226-blocking caps row, and checklist step VSC-15"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: in-progress
depends_on: [C002-T-073]
implements: [C002-REQ-509, C002-REQ-617, C002-REQ-611, C002-REQ-312]
satisfies_ac: [C002-AC-509.1, C002-AC-617.1, C002-AC-611.1, C002-AC-312.1]
verified_by: [C002-TS-620, C002-TS-679, C002-TS-319, C002-TC-620, C002-TC-679, C002-TC-319]
components: [C002-COMP-006, C002-COMP-009, C002-COMP-011]
risk_refs: [C002-RISK-019, C002-RISK-036, C002-RISK-038]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-074 — Fix for revisions D-036, D-037: package version 0.0.3 after the CHG-001 D-020 fix, the TS-226-blocking caps row, and checklist step VSC-15

## Intent

In C002-T-071 at 0.0.2, 21 of 23 Copilot CLI sessions passed. `INJ-19` and `INJ-21` read acted
upon: run with `--no-ask-user`, the conductor refused to present the gate without its question tool,
before it read the planted file (commit c54c3fe). Copilot 0.0.2 is therefore refused (ERR-REL-002;
defect D-036). The cause is CHG-001 defect D-020. P-01 answered Q-noask-01 with "Text fallback +
0.0.3 (Recommended)": the conductor asks its question or presents the gate as plain text and ends
its turn. CHG-001's C001-T-084 fixes that in the conductor's source text.

Both 0.0.2 entries are final for 0.0.2 (C002-IF-010 §5.2 rule 3), so the packages move to version
**0.0.3** after that fix. C002-T-071 then retakes the Copilot CLI evidence at 0.0.3.

**Revision D-037** adds two small, offline items to this task, because both must be in the 0.0.3
release candidate:
- **The caps row.** C002-IF-010 §2.2 gains a fourteenth rule-1 row, `TS-226-blocking` of
  `evals/cap02/TS-226.eval.mjs`, at 3.00 USD. The file's other rows get no exception. This makes 44
  rows in `CAP_EXCEPTIONS`.
- **The checklist step.** C002-REQ-312, C002-AC-312.1 and C002-TS-319 now follow the CHG-001 text
  fallback: without `ask_user` the conductor asks its round as plain text, with no `INSTALL.md`
  detour. Step VSC-15 of the VS Code checklist, which P-01 runs on 0.0.3 (C002-T-050), still expects
  the old text, and is brought to the new one.

The task runs **no paid session**. It is the same kind of step as the 0.0.2 move of C002-T-073.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/.claude-plugin/plugin.json`, `package.json` › `version` | `0.0.2` → `0.0.3`. `plugin.json` is the single version source (C002-T-004), and `package.json` equals it by test. Every generated manifest, `architect-sdd`, the target zips and the doctor's version check follow from them (C002-REQ-509) |
| modify | `docs/runsheets/README.md`, `T-050-vscode-checklist.md`, `T-055-copilot-release.md`, `T-057-copilot-clean-profile.md`, and the npm-publish part of `T-052-publish-and-opencode-release.md` | the version, the zip and tarball names, the record names and the `docs/releases/copilot/<version>/` paths move to 0.0.3. The runsheet of the `architect-sdd` publication (C002-T-075) names 0.0.3. The OpenCode runsheets (`T-051-opencode-clean-profile.md`, the OpenCode part of `T-052-…`) name no version and carry the line "moved to CHG-003" (plan critic CR-87; `../10-strategy.md` §2). The 0.0.1 and 0.0.2 release folders stay as they are |
| modify | `evals/harness/caps.mjs` › `CAP_EXCEPTIONS` | (D-037) the row `TS-226-blocking` of `evals/cap02/TS-226.eval.mjs`, at its place in the §2.2 table: host `claude-code`, auth `subscription`, own caps 0.50 USD and 30 turns, rule 1, `rerunUsd` 3.0. The file's other rows get no row. The table then holds 44 rows: 14 rule 1, 27 rule 2, `TS-421-agent` in neither list, and the two OpenCode rows (`TS-634`, `INJ-21`) |
| modify | `tests/integration/cap06/cap-exceptions.test.ts` | (D-037) the pinning test lists the 44 rows in table order, with 14 rule-1 rows at `rerunUsd` 3.0, and the other rows of `evals/cap02/TS-226.eval.mjs` absent; every case file exists |
| modify | `docs/checklists/vscode-copilot.md` › step VSC-15, its Expect | (D-037) the Expect of C002-TS-319, revised. The conductor asks its interview round, the profile question, as plain text, with the content of C001-IF-05 `questions.md` §3, the recommended option first, and then ends its turn. The reply names no `INSTALL.md` step. It does not tell P-01 to enable, install or switch on `ask_user` or another question tool. No change folder is created until P-01 answers. The step ID, its group, its mode `both`, its kind and the step index stay as they are, so the release check's step check is unchanged |
| modify | `tests/integration/cap02/question-variants.test.ts` › the test named `C002-TC-319 (C002-REQ-312): …` | (D-037) renamed to `C002-TS-319 (supporting): Copilot <mode> — without ask_user the conductor asks in the text form and names no INSTALL.md step`, with its assertions as C001-T-084 left them. C002-TC-319 stays the manual case of step VSC-15; this package test is its supporting test (test plan §8) |
| modify | `tests/integration/cap06/checklist.test.ts` | (D-037) the step-index check of C002-TC-617 and C002-TC-618 still passes with the revised VSC-15 text; a supporting check that the VSC-15 Expect names neither `INSTALL.md` nor an enable step |

## Preconditions

- **Cross-change: the committed product changes of C001-T-084** (plan critic CR-86; revision
  D-037). C001-T-084 fixes D-020, the text fallback of the conductor without a question tool (P-01
  answer to Q-noask-01). Its product changes are committed in 3643c69 (HEAD~2 at the time of this
  revision): the interview-protocol and gate-protocol text, the conductor's hard rules, the Copilot
  and OpenCode wiring, the `refuseAsk` harness policy and the `TS-226`/`TS-227` case files. This task
  needs only that commit.
  - **Not a precondition:** C001-T-084 stays open for the dev run of its `TS-226-blocking` row. That
    run needs the caps row this task adds, so this task does not wait for it (D-037).
  - **Direction:** this task waits for the C001-T-084 product commit, and C002-T-071 waits for this
    task. The conductor confirms the commit before step 1. The edge lives on the CHG-002 side only,
    since C001-T-084 belongs to CHG-001's plan (`../handoff.md`).
- C002-T-073 done (the move to 0.0.2, and the `INJ-21` session cap).
- G2 re-approved after the D-036 and D-037 revisions, and G3 after this plan revision (gate records
  of `../../change.md`).

## Step outline (no production code)

1. **Caps row.** Extend the pinning test and watch it fail, then add the `TS-226-blocking` row. Run
   `npm test -- cap06/cap-exceptions`. C002-TC-679 and its supporting tests pass with 44 rows.
2. **Checklist and tests.** Update the Expect of VSC-15. Rename the package test of
   `question-variants.test.ts` to the supporting name, and add the VSC-15 check to
   `checklist.test.ts`. Run `npm test -- cap02/question-variants`, `npm test -- cap06/checklist` and
   `npm test -- cap06/release-check`, whose step check is unchanged.
3. **Version 0.0.3.** Change `plugin.json` and `package.json`, and the runsheets of the Targets table.
4. Run `npm run build` and `npm run package`. The generated packages, `architect-sdd-0.0.3.tgz` and
   `dist/architect-copilot-0.0.3.zip` all give 0.0.3, and the conductor text in `dist/copilot/` holds
   the CHG-001 D-020 fallback.
5. Run `npm test` (the version-equality test of `tests/smoke.test.ts`) and `npm run check`.
6. Report the commit and the version, and tell the conductor two things. C002-T-071 can retake the
   Copilot CLI evidence at 0.0.3. And C001-T-084 can run its `TS-226-blocking` row at 3.00 USD.

## Verification

- `npm test -- cap06/cap-exceptions`, `npm test -- cap02/question-variants`, `npm test -- cap06/checklist`, `npm test -- cap06/release-check`
- `npm run build`, `npm run package`, `npm test`, `npm run check`

## Done when

- [ ] `CAP_EXCEPTIONS` holds the 44 rows of the §2.2 table, `TS-226-blocking` among the 14 rule-1 rows at 3.00 USD, the other rows of `evals/cap02/TS-226.eval.mjs` without a row; the pinning test passes
- [ ] Step VSC-15 expects the profile question asked as plain text, recommended option first, the turn ended, no `INSTALL.md` or enable-tool step, and no change folder until P-01 answers; the step index is unchanged, and `checklist.test.ts` and the release-check tests pass
- [ ] The package test of `question-variants.test.ts` is named as the supporting test of C002-TC-319, and the ID C002-TC-319 is the manual case of VSC-15 only
- [ ] `plugin.json` and `package.json` give 0.0.3, and `npm run package` writes the 0.0.3 packages, the Copilot zip and the tarball, after the C001-T-084 product commit
- [ ] The Copilot and npm runsheets name 0.0.3, and the OpenCode runsheets say "moved to CHG-003"; the 0.0.1 and 0.0.2 release folders are unchanged
- [ ] `npm test` and `npm run check` green, and no paid session ran
- [ ] Progress reported: `sdd task set C002-T-074 --status done --commit <sha>`
