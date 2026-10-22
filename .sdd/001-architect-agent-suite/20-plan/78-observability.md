---
id: C001-PLAN-OBS
artifact: plan/observability
change: CHG-001
phase: 20-plan
status: approved
---

# CHG-001 — Observability plan

The suite has no production servers. "Signals" are measurements and records produced by the
tooling, which prove each NFR during development and in use.

| NFR | Signal | Kind | Produced by task |
|---|---|---|---|
| C001-NFR-101 | `bench/results/lint-*.json` p95 | metric | C001-T-027, C001-T-065 |
| C001-NFR-102 | `bench/results/lint-quick-*.json` p95 | metric | C001-T-027, C001-T-065 |
| C001-NFR-103 | `bench/results/guards-*.json` p95 | metric | C001-T-050, C001-T-065 |
| C001-NFR-104 | `bench/results/session-start-*.json` p95 | metric | C001-T-052, C001-T-065 |
| C001-NFR-105 | PLG-SIZE-001 report in `npm run check` output | log | C001-T-061 |
| C001-NFR-106 | Gate-log Usage cells; `docs/dogfood.md` token totals | metric | C001-T-073, C001-T-074 |
| C001-NFR-201 | Guard corpus report (allow/deny confusion matrix) | log | C001-T-050, C001-T-054 |
| C001-NFR-202 | `tests/no-network.mjs` recorded-call count | metric | C001-T-054 |
| C001-NFR-203 | Secret-fixture detection report | metric | C001-T-054 |
| C001-NFR-204 | PLG-TOOLS-001 result | log | C001-T-060, C001-T-061 |
| C001-NFR-205 | Injection eval results `evals/results/injection-*.json` | metric | C001-T-054 |
| C001-NFR-301 | Fault-injection test report; `bench/results/faults-*.json` (all four commands from C001-T-080) | log | C001-T-027, C001-T-080 |
| C001-NFR-302 | Determinism test report | log | C001-T-027 |
| C001-NFR-303 | Lint fixture suite results | log | C001-T-018, C001-T-027 |
| C001-NFR-304 | Dogfood log per machine configuration | log | C001-T-041, C001-T-074 |
| C001-NFR-401 | `npm run check` transcripts under PowerShell 7 and Git Bash, each on Node 20 and 22 (C001-TC-1127) | log | C001-T-065, C001-T-080 |
| C001-NFR-402 | PLG-PORT-002 result; dormant CI definition | log | C001-T-061, C001-T-064 |
| C001-NFR-403 | Test results under Node 20 and 22 | log | C001-T-065, C001-T-080 |
| C001-NFR-404 | Encoding scan report: output of the `encoding` step of `npm run check` | log | C001-T-061, C001-T-080 |
| C001-NFR-501 | Run-from-clean-folder test result | log | C001-T-061 |
| C001-NFR-502 | Coverage report (`coverage/lcov.info`) and the lines/branches figures that the `coverage` step of `npm run check` prints | metric | C001-T-065, C001-T-080 |
| C001-NFR-503 | PLG-RULES-001 result | log | C001-T-061 |
| C001-NFR-601 | PLG-MSG-001 result | log | C001-T-061 |
| C001-NFR-602 | Timed clean-profile install record | metric | C001-T-062, C001-T-072 |
| C001-NFR-701 | LINT-GATE-001 result on change.md files | log | C001-T-022, C001-T-073 |
| C001-NFR-702 | `SDD_DEBUG=1` trace test | trace | C001-T-012 |
| C001-NFR-801 | License check output and THIRD_PARTY_NOTICES.md | log | C001-T-061 |

Alerting is not applicable (no running service). Thresholds are compared in
`docs/nfr-results.md` (T-065), and a miss becomes a defect.
