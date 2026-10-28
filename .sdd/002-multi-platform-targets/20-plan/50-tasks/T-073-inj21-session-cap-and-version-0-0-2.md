---
id: C002-T-073
title: "Fix for revision D-035: session cap of 1.00 USD for INJ-21 on OpenCode, and package version 0.0.2"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: in-progress
depends_on: [C002-T-070]
implements: [C002-REQ-611, C002-NFR-105]
satisfies_ac: [C002-AC-611.1]
verified_by: [C002-TS-679, C002-TS-688, C002-TC-679, C002-TC-917]
components: [C002-COMP-009, C002-COMP-006]
risk_refs: [C002-RISK-015, C002-RISK-036]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-073 — Fix for revision D-035: session cap of 1.00 USD for INJ-21 on OpenCode, and package version 0.0.2

## Intent

In C002-T-071, `INJ-21` on OpenCode needed 0.52 … 0.57 USD a session and ended at the 0.50 USD cap.
Every assertion passed, but under the fail-closed merge of C002-IF-010 §5.2 rule 3 its entry reads
acted upon and is final for 0.0.1. So the OpenCode 0.0.1 release check refuses (ERR-REL-002; defect
D-035). P-01 answered Q-inj21-01 with "0.0.2 + cap for INJ-21 (Recommended)" (`../questions-log.md`).

The revised C002-IF-010 §2.2 adds the **session cap of an exception**: a cap that the harness applies
to every session of the row on the matching host, without `--cap-exception`. `INJ-21` on `opencode`
gets 1.00 USD this way. A **rule for the caps of injection rows** keeps room for a normal session,
and the stop rule's reserve for such a session is at least 1.65 USD.

This task makes that harness change and moves the CHG-002 packages to version **0.0.2**. A new
version starts new injection summaries, at which the paid evidence of both targets is retaken
(C002-T-071).

It is a task of its own rather than part of C002-T-072, because C002-T-071 needs it before its
paid retake. C002-T-072 (the early stop of Claude Code sessions) is not on that path, and the
release tasks should not wait for it.

The task runs **no paid session**: the tests use the stub host and the ledger tests of the stop rule.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/caps.mjs` › the exception shape and `CAP_EXCEPTIONS` | an optional **session cap** field of an exception (C002-IF-010 §2.2 Session cap of an exception). The row `INJ-21` of `evals/injection/injection.eval.mjs` is added at its place in the §2.2 table: host `opencode`, no auth mode, the row's own caps (0.50 USD default, its `maxTurns` 16), session cap 1.00 USD, no rerun cap, paid class |
| modify | `evals/harness/caps.mjs` › `capCheck` | for a matching exception with a session cap, without `--cap-exception`, the caps are `{ turns: <row's turns>, usd: <session cap> }`. With `--cap-exception` the run is refused before any session, since the exception gives no rerun cap. On another host or auth mode no exception matches, so the row keeps its own caps: 0.50 USD on Claude Code and Copilot CLI |
| modify | `evals/harness/run.mjs` › the stop-rule reserve | for a session of a row that a paid-class exception matches, the reserve H takes the exception's session cap when it gives one, else its cap: H = 1.00 + max(0.65, highest ordinary cost), at least 1.65 USD for `INJ-21` (C002-IF-010 §2.2 Reserve of a cap-exception session; test plan §4.1 rule 1). The `caps_usd` of its ledger entry is 1.00, so it stays out of the ordinary H |
| modify | `tests/integration/cap06/cap-exceptions.test.ts` | the pinning test lists the `INJ-21` row with its session cap. The four `INJ-21` rows of C002-TC-679 assert: 1.00 USD on `opencode` without the option; refused with `--cap-exception`; 0.50 USD and 16 turns on `claude-code` with `--auth subscription`; and `--max-ai-credits 50` on `copilot-cli` |
| modify | `tests/integration/cap06/runner-caps.test.ts` | the two reserve rows of C002-TC-917: `INJ-21` with an ordinary highest cost of 0.40 USD and H 1.65 USD; at a general-pool total of 28.35 USD the session starts (28.35 + 1.65 = 30.00), and at 28.36 USD no session starts and the ledger is unchanged (30.01 > 30) |
| modify | `plugins/architect/.claude-plugin/plugin.json`, `package.json` › `version` | `0.0.1` → `0.0.2`. `plugin.json` is the single version source (C002-T-004), and `package.json` equals it by test. Every generated manifest, `architect-sdd`, the target zips and the doctor's version check follow from them (C002-REQ-509) |
| modify | `docs/runsheets/README.md`, `T-050-vscode-checklist.md`, `T-051-opencode-clean-profile.md`, `T-052-publish-and-opencode-release.md`, `T-055-copilot-release.md`, `T-057-copilot-clean-profile.md` | the version, the zip and tarball names, the record names and the `docs/releases/<target>/<version>/` paths move to 0.0.2. The 0.0.1 release folders stay as they are: they hold the 0.0.1 evidence, which is never moved or edited (C002-IF-010 §5.2) |

## Preconditions

- C002-T-070 done: both tasks edit `CAP_EXCEPTIONS` and its pinning test.
- G2 re-approved after the D-034/D-035 revision, and G3 after this plan revision (gate records of
  `../../change.md`).
- The rows' case file `evals/injection/injection.eval.mjs` is shared by every host and does not
  change: the session cap lives in the exception (C002-IF-010 §2.2).

## Step outline (no production code)

1. **Tests first.** Extend the pinning test, the four `INJ-21` rows of C002-TC-679 and the two reserve
   rows of C002-TC-917, and watch them fail: today `INJ-21` has no exception and runs at 0.50 USD on every
   host.
2. **Session cap.** Add the field, the `INJ-21` row and the `capCheck` branch. Then take the stop
   rule's H from the session cap. Run `npm test -- cap06/cap-exceptions` and `npm test --
   cap06/runner-caps`, then `npm test -- cap06/claude-runner` and `npm test -- cap06/copilot-runner`.
   C002-TC-614 and 928 … 932 stay unchanged.
3. **Version 0.0.2.** Change `plugin.json` and `package.json`, and the runsheets of the Targets table.
   Run `npm run build` and `npm run package`. The generated packages, `architect-sdd-0.0.2.tgz` and the
   zips `dist/architect-opencode-0.0.2.zip` and `dist/architect-copilot-0.0.2.zip` all give 0.0.2. Then
   run `npm test` (the version-equality test of `tests/smoke.test.ts`) and `npm run check`.
4. Report the commit and the version, and tell the conductor so that C002-T-071 can retake both
   targets' evidence at 0.0.2. This commit is part of the release candidate that C002-T-071 records.

## Verification

- `npm test -- cap06/cap-exceptions`, `npm test -- cap06/runner-caps`, `npm test -- cap06/claude-runner`, `npm test -- cap06/copilot-runner`
- `npm run build`, `npm run package`, `npm test`, `npm run check`

## Done when

- [ ] `CAP_EXCEPTIONS` holds the `INJ-21` row on `opencode` with the session cap 1.00 USD and no rerun cap, and the pinning test passes
- [ ] `capCheck` applies the session cap on the matching host without `--cap-exception`, and refuses the option for that row; the stop rule takes H = 1.00 + max(0.65, highest ordinary cost) for it; C002-TC-679 (twenty-four rows) and C002-TC-917 (seven rows) pass
- [ ] `plugin.json` and `package.json` give 0.0.2, and `npm run package` writes the 0.0.2 packages, zips and tarball; the runsheets name 0.0.2; the 0.0.1 release folders are unchanged
- [ ] `npm test` and `npm run check` green, and no paid session ran
- [ ] Progress reported: `sdd task set C002-T-073 --status done --commit <sha>`
