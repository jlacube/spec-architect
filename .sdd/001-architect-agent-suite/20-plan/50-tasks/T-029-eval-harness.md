---
id: C001-T-029
title: "Agent eval harness and tiered runs"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: todo
depends_on: [C001-T-006, C001-T-001]
implements: []
satisfies_ac: [C001-AC-206.1, C001-AC-1116.1]
verified_by: [C001-TS-207, C001-TS-1117, C001-TC-207, C001-TC-1117]
components: [C001-COMP-12]
risk_refs: [C001-RISK-005]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-029 — Agent eval harness and tiered runs

## Intent

Build the harness that runs agent-behaviour scenarios (level eval): scripted `claude -p --agent` sessions on fixtures, transcript parsing and assertions, `claude plugin eval` integration, and the tiered run policy of C001-ADR-003 with per-run cost capture.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `evals/harness/run.mjs` | spawn sessions, capture transcript JSON, apply assertions, N runs, pass rate |
| add | `evals/harness/assert.mjs` | helpers: toolCalls(), askUserQuestions(), writesOutside(), firstReply() |
| add | `evals/README.md` | tiers: dev 1 run, milestone 3 runs, release 10 runs (≥ 9/10 pass) |

## Preconditions

- T-006 confirmed session model
- Dependencies done: C001-T-006, C001-T-001

## Step outline (no production code)

1. Implement session runner with fixture copy per run.
2. Implement transcript assertions used by eval TCs.
3. Record tokens per run into evals/results/*.json.

## Verification

- A sample eval (C001-TC-206 against a stub agent) runs in all three tiers
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Harness documented; cost per run reported
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-029 --status done --commit <sha>` (or frontmatter fallback before T-026)
