---
id: C001-SPEC-DOD
artifact: spec/dod
change: CHG-001
phase: 10-spec
status: approved
---

# C001 — Definition of Done

## 1. Global DoD

The global items (`DOD-G-*`) are those of the repository constitution
(`.sdd/_constitution/constitution.md`), approved at G0 on 2026-10-13, which carried them over from
this table; CHG-001 inherits them. DOD-G-01 below states the eval floor of the constitution's G0
amendment (constitution v2), with C001-ADR-003 as this change's release classification.

| ID | Statement | Evidence type |
|---|---|---|
| DOD-G-01 | Every acceptance scenario of the change is automated (unit, integration, eval) or listed as manual with an executed record, and passes; scenarios verified at level `eval` (agent behaviour, non-deterministic) meet, on the current models of C001-IF-09, this floor: scenarios the change's release ADR (C001-ADR-003 for CHG-001) classes as high-risk pass at least 9 of 10 runs; the others pass 3 of 3, a 2 of 3 result triggering a 10-run check that needs at least 9 of 10; a routing suite passes at least 90% of its runs; an injection suite has 0 runs acting on an injection. A result below the floor needs a P-01 waiver at the gate | test-report |
| DOD-G-02 | `npm run check` passes on the reference machine (REF-WIN) | command-output |
| DOD-G-03 | No new error-severity finding from `sdd lint` on this repository's `.sdd/` | command-output |
| DOD-G-04 | Public interfaces (CLI, schemas, hooks, agents) match their contracts in `50-interfaces/` | review-record |
| DOD-G-05 | Every NFR has its measurement method implemented and a recorded result meeting its threshold | benchmark-report |
| DOD-G-06 | `_living/` updated via archive after implementation | command-output |
| DOD-G-07 | No open spec defects | command-output |

## 2. Feature DoD (CHG-001)

| ID | Statement | Evidence type | Covers |
|---|---|---|---|
| C001-DOD-001 | Workspace, registry and ID commands pass all CAP-01 scenarios | test-report | CAP-01 (C001-REQ-101 … 127) |
| C001-DOD-002 | Conductor and interview behaviours pass all CAP-02 scenarios in the scripted-session/eval harness | test-report | CAP-02 (C001-REQ-201 … 220) |
| C001-DOD-003 | Ideation behaviours (research, options, decisions, readiness) pass all CAP-03 scenarios | test-report | CAP-03 (C001-REQ-301 … 318) |
| C001-DOD-004 | Specification authoring rules pass all CAP-04 scenarios | test-report | CAP-04 (C001-REQ-401 … 422) |
| C001-DOD-005 | Architecture and interface rules pass all CAP-05 scenarios | test-report | CAP-05 (C001-REQ-501 … 503, 507 … 516) |
| C001-DOD-006 | Planning and hand-off rules pass all CAP-06 scenarios, including the Superpowers portability run (C001-TS-621) | test-report | CAP-06 (C001-REQ-601 … 618) |
| C001-DOD-007 | Lint, trace, critic and auditor pass all CAP-07 scenarios | test-report | CAP-07 (C001-REQ-701 … 720) |
| C001-DOD-008 | Gate engine passes all CAP-08 scenarios, including the bootstrap hash check (C001-TS-806) | test-report | CAP-08 (C001-REQ-801 … 815) |
| C001-DOD-009 | Tracking and archive pass all CAP-09 scenarios | test-report | CAP-09 (C001-REQ-901 … 923) |
| C001-DOD-010 | Code-intelligence behaviours pass all CAP-10 scenarios on `cfg-full`, `cfg-no-ripwire` and `cfg-bare` | test-report | CAP-10 (C001-REQ-1001 … 1012) |
| C001-DOD-011 | Performance benchmarks meet thresholds | benchmark-report | C001-NFR-101, 102, 103, 104 |
| C001-DOD-012 | Skill size budgets met (PLG-SIZE-001 clean) | command-output | C001-NFR-105 |
| C001-DOD-013 | Token usage recorded for both dogfood changes and within threshold | metric-snapshot | C001-NFR-106, 701 |
| C001-DOD-014 | Security corpus results: guard corpus 100%, no network, secret detection, tool grants, injection evals 0 failures | test-report | C001-NFR-201 … 205 |
| C001-DOD-015 | Reliability tests: fault injection, determinism, lint fixtures, degradation runs | test-report | C001-NFR-301 … 304 |
| C001-DOD-016 | Compatibility: Windows 11 under PowerShell 7 and Git Bash, Node 20 and 22, encoding scan clean, portability check clean | command-output | C001-NFR-401 … 404 |
| C001-DOD-017 | Maintainability: single-file runtime test, coverage thresholds, rule catalogue complete, debug traces | coverage-report | C001-NFR-501 … 503, 702 |
| C001-DOD-018 | Usability: message catalogue complete; clean-profile install timed ≤ 15 min | review-record | C001-NFR-601, 602 |
| C001-DOD-019 | License compliance check passes; LICENSE and notices present | command-output | C001-NFR-801 |
| C001-DOD-020 | Packaging, guards, MCP config, doctor, docs, evals and dormant CI pass all CAP-11 scenarios | test-report | CAP-11 (C001-REQ-1101 … 1122) |
| C001-DOD-021 | Two dogfood changes (one greenfield, one brownfield) taken through G1–G3 and logged | link | C001-SC-01, SC-03, SC-04, SC-08 |
