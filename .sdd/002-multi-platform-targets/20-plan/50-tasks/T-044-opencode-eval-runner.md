---
id: C002-T-044
title: "OpenCode eval runner behind the existing case API"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-037, C002-T-042]
implements: [C002-REQ-608, C002-REQ-609, C002-REQ-610, C002-REQ-611, C002-NFR-105]
satisfies_ac: [C002-AC-608.1, C002-AC-609.1, C002-AC-610.1, C002-AC-611.1]
verified_by: [C002-TS-611, C002-TS-612, C002-TS-613, C002-TS-614, C002-TS-634, C002-TS-635, C002-TC-611, C002-TC-612, C002-TC-613, C002-TC-614, C002-TC-634, C002-TC-635]
components: [C002-COMP-009]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-044 — OpenCode eval runner behind the existing case API

## Intent

Run the existing eval cases on the OpenCode target package through the unchanged case API
(C002-REQ-608, C002-IF-010). The dev tier covers routing and injection (C002-REQ-609), and the
interview, gate and revise scenarios use scripted `question` answers (C002-REQ-610). Every session
ends at 30 turns or $0.50 (C002-REQ-611, C002-NFR-105). The runner also writes the injection summary
of C002-IF-009.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `evals/harness/runners/opencode.mjs` | runner on the C002-T-042 driver; name mapping from the OpenCode table |
| add | `evals/harness/runners/stub.mjs` | stub host that never ends a session, for the cap tests |
| add | `evals/harness/caps.mjs` | turn and spend caps shared by both runners |
| modify | `evals/harness/session.mjs` | host selection without changing the `runSession` signature (three importers) |
| modify | `evals/harness/run.mjs` › `main` | options `--host claude-code\|opencode\|copilot-cli` (default `claude-code`, C002-IF-010 §1) and `--filter <path>`; positional case files and the existing options unchanged; `npm run eval` already calls this file, so `npm run eval -- --host …` needs no `package.json` edit |
| modify | `evals/harness/env.mjs` | `CLAUDE_CODE_EXECPATH` required for the Claude Code host only |
| add | `tests/integration/cap06/runner-caps.test.ts` | caps end the stub session at 30 turns and at $0.50; the `run.mjs` options of step 2 on the stub host (default host, unknown host, a `--filter` that matches no case), with no paid session |
| add | `evals/targets/gate/TS-613.eval.mjs`, `TS-634.eval.mjs`, `TS-635.eval.mjs` | case files of C002-TC-613, 634 and 635 on fx-gate (C002-T-037), with scripted `question` answers; C002-TC-613 also reuses the existing C001-CAP-02 interview and gate cases unchanged; run by C002-T-056 |
| modify | `evals/results/spend-chg002.json` | the spend of the smoke run |

## Preconditions

- C002-T-037 (case files, fx-gate) and C002-T-042 (driver) done. C002-T-042 delivers
  `evals/harness/opencode/driver.mjs` in both S-07 branches (`10-strategy.md` §4).
- For step 6: the ledger check of test plan §4.1 allows the session.

## Step outline (no production code)

1. Select the host by option or environment. With no option, the default stays Claude Code, and the
   `runSession` signature is unchanged (C002-RISK-009).
2. **Runner options** (critic CR-19): give `evals/harness/run.mjs` the option
   `--host claude-code|opencode|copilot-cli` of C002-IF-010 §1, default `claude-code`, passed to
   `runSession` through the harness context; an unknown value exits non-zero before any session. Add
   `--filter <path>`: it selects every `*.eval.mjs` file under the given folder, or whose path relative
   to the repository root contains the given text, in addition to any positional case files. When the
   selection holds no case (no file, or every Examples row left out by `--only`), the runner prints the
   reason and exits non-zero before any session, so a mistyped filter cannot pass with a total of
   0 USD. The `--filter` word is not read as a case file. Every other option keeps its meaning. From
   this step on, the plan's eval commands use `--host claude-code` for Claude Code.
3. Answer `question` calls from the case's scripted answers. If S-07 recorded
   `question_answerable_by_script: false`, the scripted-answer cases are reported not applicable with
   the record cited, and the spec defect of `10-strategy.md` §4 is open.
4. Read spend from the host's usage report. Where the host reports none, the turn cap alone applies,
   and the result says so.
5. Write the three gate case files.
6. **Paid smoke run:** one dev-tier routing case on E-OCE, checked against the ledger before the
   session and added to it after. The carried OpenCode rows run in C002-T-056; the release rows
   (C002-TC-612) in C002-T-049.

## Verification

- `npm test -- cap06` (stub host, no spend; includes the option cases of step 2)
- `node evals/harness/run.mjs --filter evals/does-not-exist --tier dev` exits non-zero without a session
- `node evals/harness/run.mjs --host opencode --tier dev --filter routing --only <one routing case ID>`
  (one paid smoke run, ≤ $0.50)

## Done when

- [ ] Case API unchanged (existing case files unchanged); cap tests pass; smoke run recorded in the ledger
- [ ] `run.mjs` takes `--host` (default `claude-code`) and `--filter`; a filter that selects no case exits non-zero
- [ ] C002-TC-612, 613, 634 and 635 listed in the task report as carried (C002-TC-612 to C002-T-049, the others to C002-T-056)
- [ ] Progress reported: `sdd task set C002-T-044 --status done --commit <sha>`
