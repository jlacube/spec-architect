---
id: C001-T-029
title: "Agent eval harness and tiered runs"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-3
status: done
depends_on: [C001-T-006, C001-T-001]
implements: []
satisfies_ac: [C001-AC-206.1, C001-AC-1116.1]
verified_by: [C001-TS-207, C001-TS-1117, C001-TC-207, C001-TC-1117]
components: [C001-COMP-12]
risk_refs: [C001-RISK-005]
estimate: L
report: { commit: 7ad65b2, completed_at: 2026-10-11, notes: "Harness done (C001-ADR-007, G3 re-approved): Agent SDK sessions with scripted AskUserQuestion answers; stub interviewer passes dev 1/1, milestone 3/3, release 10/10; metrics per model/agent/subagent/tool call; docs/metrics/eval-metrics.md generated. TC-207 and TC-1117 belong to C001-T-031 and C001-T-063 per the test plan; their assertions (optionProblems) and case-file runner are in place. claude plugin eval needs an auth token for its children (README). Spend for T-029: about $0.05." }
---

# C001-T-029 — Agent eval harness and tiered runs

## Intent

Build the harness that runs agent-behaviour scenarios (level eval): scripted Claude Code sessions with `--agent` on fixtures, transcript parsing and assertions, `claude plugin eval` integration, and the tiered run policy of C001-ADR-003 with per-run cost capture.

**Prerequisite from spike S-05 (D-S05-2):** AskUserQuestion is unavailable in headless Claude Code (`-p`,
also with stream-json input). Before any M-3 eval is written, this task must establish a harness that
can run interview scenarios and answer AskUserQuestion with scripted choices: either by driving
interactive sessions (for example through a pseudo-terminal) or through the Agent SDK. The mechanism is
chosen in this task, recorded as an ADR, and demonstrated by one scenario that asserts an
AskUserQuestion call and its answer. Headless runs use the desktop-bundled Claude Code (≥ 2.1.295,
C001-REQ-1123) with the parent session's environment variables removed (`docs/spikes/S-04-hooks.md`).

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

1. Choose and prototype the interview-capable session mechanism (pseudo-terminal or Agent SDK); record the decision as an ADR.
2. Implement session runner with fixture copy per run.
3. Implement transcript assertions used by eval TCs.
4. Capture token usage (input, output, cache read/write) per agent and model, and timings (session, subagent, tool call) for every run into evals/results/*.json, using Claude Code usage/transcript data.
5. Implement the aggregate metrics report with release-tier cost and duration projection.

## Verification

- A sample eval (C001-TC-206 against a stub agent) runs in all three tiers
- One sample interview scenario asserts an AskUserQuestion call answered with a scripted choice
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Harness documented
- [ ] Every eval run produces a complete metrics record (tokens by type, agent and model; timings by session, subagent and tool call)
- [ ] docs/metrics/eval-metrics.md generated from results
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-029 --status done --commit <sha>` (or frontmatter fallback before T-026)
