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
verified_by: [C002-TS-611, C002-TS-612, C002-TS-613, C002-TS-614, C002-TS-634, C002-TS-635]
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
| modify | `evals/harness/env.mjs` | `CLAUDE_CODE_EXECPATH` required for the Claude Code host only |
| add | `tests/integration/cap06/runner-caps.test.ts` | caps end the stub session at 30 turns and at $0.50 |

## Preconditions

- C002-T-037 (case files) and C002-T-042 (driver) done.

## Step outline (no production code)

1. Select the host by option or environment. With no option, the default stays Claude Code.
2. Answer `question` calls from the case's scripted answers.
3. Read spend from the host's usage report. Where the host reports none, the turn cap alone applies,
   and the result says so.
4. Keep the paid runs inside the API-key budget: one dev-tier run here as a smoke; the release runs
   are C002-T-049.

## Verification

- `npm test -- cap06` (stub host, no spend)
- `node evals/harness/run.mjs --host opencode --tier dev --filter routing` (one paid smoke run, ≤ $0.50)

## Done when

- [ ] Case files unchanged; cap tests pass; smoke run recorded
- [ ] Progress reported: `sdd task set C002-T-044 --status done --commit <sha>`
