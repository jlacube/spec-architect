---
id: C001-T-082
title: "Blocking criteria of C001-IF-05 §1 in the specialist skills (D-017)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-063]
implements: [C001-REQ-208]
satisfies_ac: [C001-AC-208.2]
verified_by: [C001-TS-223, C001-TC-223, C001-TC-215]
components: [C001-COMP-02]
risk_refs: [C001-RISK-005]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-082 — Blocking criteria of C001-IF-05 §1 in the specialist skills (D-017)

## Intent

Close defect D-017 (P-01, Q-d017-01 "Fix now"). The C001-TS-215 eval trace showed that the real
cartographer surveyed both checkout entry points and marked the scope question non-blocking. The
skill text today says only "`blocking: true` when your work cannot be completed correctly without
the answer". This task replaces that with the four criteria of C001-IF-05 `questions.md` §1, so
specialists flag scope, public-interface and existing-data questions as blocking (C001-REQ-208
note, C001-AC-208.2). It adds the C001-TS-223 eval case and smoke-runs it with C001-TS-215. The
release runs are in C001-T-072.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/skills/sdd-conventions/SKILL.md › Return contract, blocking bullet` | replace the one-line `blocking: true` rule (about line 130) with the four criteria of C001-IF-05 `questions.md` §1 (scope, public interface, existing data, general rule) and the sentence that criteria 1 to 3 hold even when the specialist can cover every option. Link to C001-IF-05 rather than copying its rationale |
| modify (optional) | `plugins/architect/skills/code-discovery/SKILL.md` | one line where the cartographer reports open points: a question that decides which entry points or code paths are in scope is blocking (C001-IF-05 §1 criterion 1) |
| add | `evals/cap02/TS-223.eval.mjs` | C001-TC-223, built like `evals/cap02/TS-215.eval.mjs`: the real cartographer (`architectReal`), a brownfield fixture with two checkout entry points ("web checkout" and "in-store kiosk checkout"), and an ideation that names only "the checkout". The assert reads the cartographer's hand-back: a questions block valid against C001-IF-05 with a question on which checkout entry point is in scope and `"blocking": true` |
| modify | `evals/cap02/TS-215.eval.mjs` | header comment only: cite C001-IF-05 §1 criterion 1 instead of the old one-line rule |

## Preconditions

- C001-T-063 done: the D-013 rework of `evals/cap02/TS-215.eval.mjs` exists (commit b4f18b7).
- C001-IF-05 `questions.md` §1, the C001-REQ-208 note, C001-AC-208.2 and C001-TS-223 are approved
  in the spec. Do not change them.
- Size budgets of C001-NFR-105 (≤ 24,000 characters per skill, ≤ 64,000 per agent with its
  preloaded skills), checked by PLG-SIZE-001 in `npm run check`. `sdd-conventions` is preloaded by
  every agent, so keep the addition short.

## Step outline (no production code)

1. Write `evals/cap02/TS-223.eval.mjs` first and run it once at dev tier on the current skill text.
   Record the result: today's text is expected to give `"blocking": false` or no question.
2. Rewrite the blocking bullet of `sdd-conventions` with the C001-IF-05 §1 criteria. Optionally add
   the line to `code-discovery`. Update the header comment of `TS-215.eval.mjs`.
3. Run `npm run check` (PLG-SIZE-001 and the plugin structure checks must pass) and
   `npm run generate` if the target outputs are checked by a test.
4. Smoke runs at dev tier (C001-ADR-003): C001-TC-223 once and C001-TC-215 once, about 3 USD
   notional on the subscription, no charge. Record both in `evals/results/`. If either fails, read
   the trace. A failure in the cartographer's flag means the wording does not work yet; a failure
   after the flag is a conductor finding, so raise a defect.
5. Report the task; the 10-run release checks of both cases are part of C001-T-072.

## Verification

- `node evals/harness/run.mjs evals/cap02/TS-223.eval.mjs --tier dev --label t082` and `node evals/harness/run.mjs evals/cap02/TS-215.eval.mjs --tier dev --label t082`
- `npm run check` on Node 22.22.3 (exit 0; PLG-SIZE-001 reports nothing)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] `sdd-conventions` carries the four blocking criteria of C001-IF-05 §1; the size budgets hold.
- [ ] `evals/cap02/TS-223.eval.mjs` exists; C001-TC-223 and C001-TC-215 pass once each at dev tier.
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003.
- [ ] Progress reported: `sdd task set C001-T-082 --status done --commit <sha>`. That commit is the
      resolution evidence for closing D-017.
