---
id: C002-T-078
title: "Fix for revision D-053: the session-start brief as JSON hookSpecificOutput under --host copilot"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: done
depends_on: [C002-T-032, C002-T-076]
implements: [C002-REQ-313, C002-REQ-314]
satisfies_ac: [C002-AC-313.1, C002-AC-314.1]
verified_by: [C002-TS-320, C002-TS-321, C002-TS-322, C002-TS-708, C002-TC-320, C002-TC-321, C002-TC-322, C002-TC-934]
components: [C002-COMP-012, C002-COMP-018]
risk_refs: [C002-RISK-042]
estimate: S
report: { commit: e8279e1, completed_at: 2026-11-11, notes: "npm run check green" }
---

# C002-T-078 — Fix for revision D-053: the session-start brief as JSON hookSpecificOutput under --host copilot

## Intent

In the findings pass the SessionStart hook ran and printed the plain-text brief, which Copilot Chat
0.73.0 ignores: it adds context only from a JSON object `{ "hookSpecificOutput": { "additionalContext":
… } }` (defect D-053; digest fact 5). Under `--host copilot` the command
`sdd hook session-start` now prints one JSON object
`{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"<brief lines>"}}`, the
brief lines being those of C001-IF-07 §4; without a workspace it prints nothing (C002-REQ-314). Under
`--host claude-code` and without `--host` the output stays the plain-text brief (C001-REQ-911,
C002-TS-708).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/hooks/session-start.ts` | the brief lines built once; an output form per host: JSON object for `copilot`, plain text otherwise (C002-IF-008 hooks contract as revised) |
| modify | `src/cli/hook-cmds.ts` › `hook session-start` | passes `--host` to the output form; exit 0 in every case, as before |
| modify | `tests/integration/cap03/hook-adapter.test.ts` | C002-TC-320 (one JSON object, exactly the two keys, at most 10 lines in `additionalContext`, first line `SDD workspace: 2 active change(s)`), C002-TC-322 (no `.sdd/`: exit 0, empty output) and C002-TC-934, the two Examples rows of C002-TS-708 |
| modify | `plugins/architect/scripts/sdd.mjs` | rebuilt bundle |

## Preconditions

- The G3 approval of the D-051 … D-053 revision (the revised C002-TS-320 and the new C002-TS-708).
- C002-T-032 and C002-T-076 done.

## Step outline (no production code)

1. Write the test rows of C002-TC-320, C002-TC-322 and C002-TC-934 first, on the bundled CLI of
   `pkg-cp` and on the Claude Code plugin's hook command with `fx-cp`.
2. Change the output form in `session-start.ts`; serialise with the JSON writer, so that line breaks
   and quotes of the brief are escaped, and nothing else is written to standard output.
3. Keep the Claude Code path byte for byte: the CHG-001 session-start tests (C001-REQ-911,
   C001-REQ-912) run unchanged (regression set, `30-impact/regression-set.md` §3).
4. `npm run build`, then `npm run check`.
5. The VS Code half (C002-TS-321: the reply names the toy change without a status command and the
   "GitHub Copilot Chat Hooks" log shows the JSON output) is checked in VSC-21 of C002-T-050; the
   Copilot CLI sessions of C002-T-081 run the same hook in `fx-cp` copies, and a session that fails on
   the hook output is a defect of this task (C002-RISK-042).

## Verification

- `npm test -- cap03/hook-adapter`
- `npm test` (the CHG-001 session-start tests unchanged) and `npm run check`

## Done when

- [ ] `sdd hook session-start --host copilot` prints one JSON object with `hookSpecificOutput.hookEventName` `SessionStart` and the brief in `additionalContext`, and nothing without a workspace
- [ ] Without `--host` and with `--host claude-code` the output is the plain-text brief, unchanged; no CHG-001 test edited
- [ ] `npm run check` green with the rebuilt bundle
- [ ] Progress reported: `sdd task set C002-T-078 --status done --commit <sha>`
