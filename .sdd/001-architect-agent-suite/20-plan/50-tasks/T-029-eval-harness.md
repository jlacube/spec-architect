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
| add | `evals/harness/metrics.mjs` | per-run metrics record: input, output, cache-read and cache-write tokens per agent/subagent and per model; cost estimate; wall-clock per session, per subagent and per tool call; tool-call counts; pass/fail |
| add | `evals/harness/report.mjs` | aggregates evals/results/*.json into docs/metrics/eval-metrics.md: per scenario, per agent, per milestone (mean, p50, p95, max) and a release-tier projection (runs × scenarios × p95) |

## Preconditions

- T-006 confirmed session model
- Dependencies done: C001-T-006, C001-T-001

## Step outline (no production code)

1. Implement session runner with fixture copy per run.
2. Implement transcript assertions used by eval TCs.
3. Capture token usage (input, output, cache read/write) per agent and model, and timings (session, subagent, tool call) for every run into evals/results/*.json, using Claude Code usage/transcript data.
4. Implement the aggregate metrics report with release-tier cost and duration projection.

## Verification

- A sample eval (C001-TC-206 against a stub agent) runs in all three tiers
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Harness documented
- [ ] Every eval run produces a complete metrics record (tokens by type, agent and model; timings by session, subagent and tool call)
- [ ] docs/metrics/eval-metrics.md generated from results
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-029 --status done --commit <sha>` (or frontmatter fallback before T-026)
