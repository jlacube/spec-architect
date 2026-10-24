---
id: C001-T-082
title: "Blocking criteria of C001-IF-05 §1 in the specialist skills (D-017)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: blocked
depends_on: [C001-T-063]
implements: [C001-REQ-208]
satisfies_ac: [C001-AC-208.2]
verified_by: [C001-TS-223, C001-TS-224, C001-TC-223, C001-TC-224, C001-TC-215, C001-TC-209, C001-TC-213, C001-TC-222]
components: [C001-COMP-10]
risk_refs: [C001-RISK-005]
estimate: S
report: { commit: null, completed_at: null, notes: "blocked: waits for C002-T-070 (rule-1 cap 3.00 USD) and the D-019 fix task" }
---

# C001-T-082 — Blocking criteria of C001-IF-05 §1 in the specialist skills (D-017)

## Intent

Close defect D-017 (P-01: Q-d017-01 "Fix now", Q-blocking-scope-01 "Scope only + decidable rule").
The C001-TS-215 eval trace showed the problem. The real cartographer surveyed both checkout entry
points and marked the scope question non-blocking. The skill text today says only "`blocking: true`
when your work cannot be completed correctly without the answer". This task replaces that with the
two criteria of C001-IF-05 `questions.md` §1, scope and stated answer, and their covering-every-option
rule (C001-REQ-208 note, C001-AC-208.2). It adds the C001-TS-223 eval case, shows the fix at
milestone tier, and reruns the other blocking-sensitive cases once. The release runs are in
C001-T-072.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/skills/sdd-conventions/SKILL.md › Return contract, blocking bullet` | replace the one-line `blocking: true` rule (about line 130) with the two criteria of C001-IF-05 `questions.md` §1 (scope; stated answer). Add the rule that covering every option counts as an assumption for a scope question and as no assumption for any other question. Link to C001-IF-05 rather than copying its rationale |
| modify | `plugins/architect/skills/code-discovery/SKILL.md` | one line where the cartographer reports open points: a question that decides which entry points or code paths are in scope is blocking, even when the survey covers all of them (C001-IF-05 §1 criterion 1) |
| modify | `plugins/architect/skills/sdd-conventions/SKILL.md › Return contract, question ID and empty block` | D-018 run findings (TC-223 run 3, TC-224 run 2). Question IDs are `Q-<topic>-<nn>`, with the topic in lowercase letters (for example `Q-scope-01`; IF-05 pattern `^Q-[a-z]+-[0-9]{2,3}$`). When there are no questions, omit the questions block; never return an empty `questions` array. Both follow from the IF-05 schema, so the spec does not change |
| add | `evals/cap02/TS-223.eval.mjs` | C001-TC-223, built like `evals/cap02/TS-215.eval.mjs`: the real cartographer (`architectReal`), a brownfield fixture with two checkout entry points ("web checkout" and "in-store kiosk checkout"), and an ideation that names only "the checkout". The assert reads the cartographer's hand-back: a questions block valid against C001-IF-05 with a question whose text or option labels contain both "web" and "kiosk" (case-insensitive) and `"blocking": true` (C001-TS-223) |
| add | `evals/cap02/TS-224.eval.mjs` | C001-TC-224, the negative case: the C001-TS-223 fixture with the kiosk checkout out of scope and the "coupons" or "promotions" naming question in the ideation's Open questions. The assert reads every specialist hand-back, not only the cartographer's. A hand-back is the specialist's last streamed assistant text: among the messages whose `parent_tool_use_id` is the conductor's Agent call, the last one with text before the session's last result message. If there is no such text, it is the Agent tool result, but only when that result is the final report and not a launch notice ("Async agent launched", "working in the background"). T-082 run 1's spec-writer report came only in the tool result. It needs at least one hand-back. It reads questions blocks as `questionsBlocks` (`evals/harness/questions.mjs`) does, any `json` fence whose content is an object with a `questions` key, and extends that check in the eval case: a fence named `json questions` that does not parse fails the run, where `questionsBlocks` skips it today; each run reports whether the naming question was raised and by which specialist. It also requires that every question whose text or option labels contain both "coupons" and "promotions" (case-insensitive) has `"blocking": false`, never `true` (C001-TS-224 as reworked for D-018) |
| modify | `evals/cap02/TS-215.eval.mjs` | header comment only: cite C001-IF-05 §1 criterion 1 instead of the old one-line rule |

## Preconditions

- C001-T-063 done: the D-013 rework of `evals/cap02/TS-215.eval.mjs` exists (commit b4f18b7).
- C001-IF-05 `questions.md` §1, the C001-REQ-208 note, C001-AC-208.2 and C001-TS-223 are approved
  in the spec. Do not change them.
- Size budgets of C001-NFR-105 (≤ 24,000 characters per skill, ≤ 64,000 per agent with its
  preloaded skills), checked by PLG-SIZE-001 in `npm run check`. `sdd-conventions` is preloaded by
  every agent, so keep the addition short.
- Cross-change dependency (recorded in `../handoff.md`): waits for C002-T-068 (done) and C002-T-069.
  C002-T-069 (CHG-002 defect D-031) is
  done before the reruns of step 4. That task makes the harness enforce the eval cap without telling
  the model a budget. The 2026-10-24 runs (`evals/results/t082-*.json`) showed the conductor
  rationing work against the visible budget. Until then the task is blocked through the CLI.

## Step outline (no production code)

1. Write `evals/cap02/TS-223.eval.mjs` and `TS-224.eval.mjs` first and run each once at dev tier on the current skill text.
   Record the results: for TS-223, today's text is expected to give `"blocking": false` or no question.
2. Rewrite the blocking bullet of `sdd-conventions`, add the question-ID and no-empty-block rules, and
   add the `code-discovery` line. Update the
   header comment of `TS-215.eval.mjs`.
3. Run `npm run check`. Its targets step checks the platform target structures (opencode, copilot), and
   PLG-SIZE-001 and the plugin structure checks must pass.
4. Eval runs on the subscription (notional, no charge; about 12 USD), recorded in `evals/results/`. The
   first pass (2026-10-24) gave C001-TC-223 2 / 3, C001-TC-224 0 / 3, and passes for the other four.
   After C002-T-069 (D-031 harness fix) and the question-ID and empty-block rules, rerun:
   - C001-TC-223 and C001-TC-224 at milestone tier, each of which must pass 3 / 3;
   - C001-TC-215, C001-TC-209, C001-TC-213 and C001-TC-222 once each at dev tier (passed on
     2026-10-24; rerun once, because the new rules change `sdd-conventions` again).
5. When a run fails, read the trace. A wrong flag or question ID in a specialist hand-back means the wording does
   not work yet. A failure after a correct flag is a conductor finding, so raise a defect.
6. Report the task. The 10-run release checks of C001-TC-209, 215, 223 and 224 are part of C001-T-072.
   If C001-TC-215, 223 or 224 ends below 9 / 10 there, D-017 and this task are reopened (step 4
   of C001-T-072).

## Verification

- `node evals/harness/run.mjs evals/cap02/TS-223.eval.mjs evals/cap02/TS-224.eval.mjs --tier milestone --label t082`
- `node evals/harness/run.mjs evals/cap02/TS-215.eval.mjs evals/cap02/TS-209.eval.mjs evals/cap02/TS-213.eval.mjs evals/cap02/TS-222.eval.mjs --tier dev --label t082`
- `npm run check` on Node 22.22.3 (exit 0; the targets step and PLG-SIZE-001 report nothing)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] `sdd-conventions` and `code-discovery` carry the C001-IF-05 §1 rule, the question-ID format and the no-empty-block rule; the size budgets hold.
- [ ] `evals/cap02/TS-223.eval.mjs` and `TS-224.eval.mjs` exist; C001-TC-223 and C001-TC-224 pass 3 / 3 at milestone tier.
- [ ] C001-TC-215, C001-TC-209, C001-TC-213 and C001-TC-222 pass once each at dev tier.
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003.
- [ ] Progress reported: `sdd task set C001-T-082 --status done --commit <sha>`. That commit is the
      resolution evidence for closing D-017 and D-018.
