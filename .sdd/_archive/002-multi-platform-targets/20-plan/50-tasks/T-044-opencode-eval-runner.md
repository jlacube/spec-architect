---
id: C002-T-044
title: "OpenCode eval runner behind the existing case API"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: done
depends_on: [C002-T-037, C002-T-042]
implements: [C002-REQ-608, C002-REQ-609, C002-REQ-610, C002-REQ-611, C002-NFR-105]
satisfies_ac: [C002-AC-608.1, C002-AC-609.1, C002-AC-610.1, C002-AC-611.1]
verified_by: [C002-TS-230, C002-TS-611, C002-TS-612, C002-TS-613, C002-TS-614, C002-TS-634, C002-TS-635, C002-TC-230, C002-TC-611, C002-TC-612, C002-TC-613, C002-TC-614, C002-TC-634, C002-TC-635]
components: [C002-COMP-009]
risk_refs: [C002-RISK-020]
estimate: L
report: { commit: d78c99f, completed_at: 2026-10-19, notes: "cap06 163 pass (runner-caps 20). Smoke TS-207 pass, 7 turns, runner 0.2262 USD; OpenRouter key usage read 0 before and 16 min after (P-01 to check the activity page; ledger keeps runner figure). Carried TC-230/613/634/635 to T-056, TC-612 to T-049. Candidate defects: IF-010 §3 tool names; answers vs answer; opencode-host folder; key file vs credential store; allowTools cannot gate non-asking tools; no eval-dispatcher relay on OpenCode; doctor rows without host field." }
---

# C002-T-044 — OpenCode eval runner behind the existing case API

## Intent

Run the existing eval cases on the OpenCode target package through the unchanged case API
(C002-REQ-608, C002-IF-010). The dev tier covers routing and injection (C002-REQ-609), and the
interview, gate and revise scenarios use scripted `question` answers (C002-REQ-610). Every session
ends at 30 turns or at its spend cap, checked after each step: 0.50 USD, or the cap of a cap exception
that C002-IF-010 §2.2 lists for the row and host (C002-REQ-611, C002-NFR-105). The runner also writes the injection summary
of C002-IF-009. It drives `opencode serve` of the pinned host binary through the C002-T-042 driver,
with a database of its own (`OPENCODE_DB`) and isolated configuration, data, cache and state
folders, so the user's OpenCode credential store is not read; a paid session reads the OpenRouter key
from P-01's key file `%USERPROFILE%\.architect-evals\openrouter-key.txt` and is refused without it
(C002-IF-010 §4 "OpenCode host process", revised for defect D-015 item 4; C002-ADR-005).
Scripted answers go through the SDK's reply route (`question.reply`), which works because the
conductor holds `question: allow` (C002-REQ-217, C002-TS-230).

**Follow-up (revision D-015 … D-017), not a reopening.** The candidate defects of this task's report
went into C002-IF-010 (defect D-015 items 1 … 7). The runner code they still need, the `host` field
of the Claude Code doctor rows, the package version written into the source copy's
`.claude-plugin/plugin.json` (C002-TS-515) and the runner cases C002-TC-906 … C002-TC-908 (rows by
`host`, refusal without the key file, direct relay) are done by C002-T-064.

**Follow-up (revision D-018 … D-020), not a reopening.** Defect D-020 items 2 … 4 (found in
C002-T-056) revised C002-IF-010 §2.2 and §4: the spend cap checked after each step, a cap above
0.50 USD only for a listed cap exception (P-01 answer to Q-ts634-budget-01: C002-TS-634 on OpenCode
at 1.00 USD, raised to 2.00 USD for one run by Q-ts634-budget-02, defect D-022), and the PATH lead of
the pinned host binary. The exception check in `run.mjs`, the TS-634 case cap, the PATH lead in
`driverHost` and the machine configurations, and C002-TC-676, C002-TC-677 and C002-TC-679 are done by
C002-T-065; the 2.00 USD cap, its C002-TC-679 rows and the stop rule's H for an exception row by
C002-T-056 rerun plan step X0.

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
| add | `evals/targets/question-tool/TS-230.eval.mjs` | case file of C002-TC-230 on a copy of fx-bootstrap: the conductor's `question` call answered through the reply route, no `unavailable tool` part, no `question unanswerable` end; run by C002-T-056 |
| modify | `evals/results/spend-chg002.json` | the spend of the smoke run |

## Preconditions

- C002-T-037 (case files, fx-gate) and C002-T-042 (driver) done. C002-T-042 delivers
  `evals/harness/opencode/driver.mjs` in both S-07 branches (`10-strategy.md` §4).
- For step 6: OpenCode on REF-WIN uses P-01's OpenRouter account with the S-07 model ids
  (C002-T-001 step 1), and the general pool's stop rule of test plan §4.1 allows the session.
- REF-WIN runs Node.js 22.22.2 or later for the OpenCode JS SDK (S-07 fact F-10; P-01 upgrades it,
  Q-s07-02); the harness configuration names the pinned host binary of OpenCode 1.18.31.

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
3. Answer `question` calls from the case's scripted answers through `question.reply`, and dismiss
   with `question.reject` where a case scripts a dismissal (S-07 §5: `question_answerable_by_script:
   true`). A `question` call that the answers do not cover ends the session with `question
   unanswerable` (C002-IF-010 §4). Write the case file of C002-TC-230.
3a. Record in `host_versions.opencode` the version that the pinned binary reports at session start; a
   version other than the tested one is recorded as read (the release check refuses it, ERR-REL-006).
4. Read spend from the host's usage report. Where the host reports none, the turn cap alone applies,
   and the result says so. Each result records `provider` `openrouter` and the model ids used.
5. Write the three gate case files.
6. **Paid smoke run (OpenRouter, general pool):** one dev-tier routing case on E-OCE, checked
   against the ledger before the session and added to it after (`provider` `openrouter`, pool
   `general`). Compare the runner's spend with OpenRouter's usage view for that session; when they
   differ by more than 10 %, or the host reports none, the ledger takes OpenRouter's figure for every
   later OpenCode session, and the report says so. The smoke cost feeds the checkpoint of test plan
   §4.1. The carried OpenCode rows run in C002-T-056; the release rows (C002-TC-612) in C002-T-049.

## Verification

- `npm test -- cap06` (stub host, no spend; includes the option cases of step 2)
- `node evals/harness/run.mjs --filter evals/does-not-exist --tier dev` exits non-zero without a session
- `node evals/harness/run.mjs --host opencode --tier dev evals/cap02/TS-207.eval.mjs` (one routing
  case, the paid smoke run, ≤ $0.50; the run of commit d78c99f)

## Done when

- [ ] Case API unchanged (existing case files unchanged); cap tests pass; smoke run recorded in the ledger
- [ ] `run.mjs` takes `--host` (default `claude-code`) and `--filter`; a filter that selects no case exits non-zero
- [ ] C002-TC-230, 612, 613, 634 and 635 listed in the task report as carried (C002-TC-612 to C002-T-049, the others to C002-T-056)
- [ ] Progress reported: `sdd task set C002-T-044 --status done --commit <sha>`
