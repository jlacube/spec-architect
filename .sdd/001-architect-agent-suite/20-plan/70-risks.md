---
id: C001-PLAN-RISKS
artifact: plan/risks
change: CHG-001
phase: 20-plan
status: draft
---

# CHG-001 — Risk register

Likelihood and impact use low / medium / high. Owner is the person or role who watches the
trigger; P-01 owns acceptance decisions.

| ID | Risk | Likelihood | Impact | Mitigation | Trigger | Owner | Refs |
|---|---|---|---|---|---|---|---|
| C001-RISK-001 | A plugin agent started with `--agent` cannot use AskUserQuestion, breaking the conductor design (D-01) | medium | high | Spike first (T-006); contingency AS-11 in strategy §4; spec revision of CAP-02 before M-3 | S-05 verdict negative | implementer, P-01 decides revision | C001-T-006, C001-T-030, C001-COMP-01 |
| C001-RISK-002 | Hook input does not identify the calling subagent | medium | medium | Spike T-005; fallback guard scope C001-REQ-1105 implemented in T-050 | S-04 verdict | implementer | C001-T-005, C001-T-050, C001-COMP-08 |
| C001-RISK-003 | ripwire Windows preview is unstable or wrong | medium | medium | Spike T-002; fallback ladder; cfg-no-ripwire tests; README marks it optional | S-01 verdict; eval failures on cfg-full | implementer | C001-T-002, C001-T-041, C001-T-074 |
| C001-RISK-004 | Serena setup friction or LSP failures on Windows | medium | low | Spike T-003; Serena optional; LSP/grep layers | S-02 verdict | implementer | C001-T-003, C001-T-041 |
| C001-RISK-005 | Agent evals are flaky or too costly | high | medium | Tiered runs (C001-ADR-003); assertions on tool calls, not prose; cost recorded per run; descriptions tuned in T-063 | Milestone tier 2/3 results; cost per milestone > 2 × previous | implementer, P-01 for budget | C001-T-029, C001-T-063, C001-T-072 |
| C001-RISK-006 | Lint false positives frustrate authors and agents | medium | medium | One positive and one negative fixture per rule; this repository as a clean fixture; severity downgrade path via spec revision (OQ-11) | Authors waive the same rule twice | implementer | C001-T-018, C001-T-019, C001-T-020, C001-T-021, C001-T-022, C001-T-027 |
| C001-RISK-007 | Parser fragility when artifacts deviate from templates | medium | medium | Constrained grammar (C001-ADR-005); parser fixtures from real artifacts; clear LINT errors instead of crashes | Internal errors (ERR-CLI-016) on real files | implementer | C001-T-010, C001-COMP-04 |
| C001-RISK-008 | Claude Code plugin APIs change during the build | medium | medium | `claude plugin validate` in `npm run check`; pin observed versions in docs; spikes record field names | Validation failures after an update | implementer | C001-T-060, C001-T-061, C001-COMP-11 |
| C001-RISK-009 | Archify license is not permissive or headless use fails | low | low | Spike T-004; Mermaid fallback; T-071 droppable with a waiver | S-03 verdict | P-01 | C001-T-004, C001-T-042, C001-T-071 |
| C001-RISK-010 | Scope (213 REQs, 58 tasks) exceeds available time | high | medium | Milestones deliver usable increments (M-2 CLI alone is useful); Should/Could REQs can be deferred to v0.2 by spec revision with waivers | Milestone slips beyond 2 × the estimate weight | P-01 | C001-T-072 |
| C001-RISK-011 | Spec defects found during implementation trigger repeated re-approval | medium | medium | Focused re-review via per-ID hashes (C001-REQ-813); batch defects per milestone | > 5 open defects at once | P-01 | C001-T-044, C001-T-028 |
| C001-RISK-012 | The unknown third-party tool writing `.sdd/metrics/` writes inside change folders | low | medium | Tolerance rule C001-REQ-124; stale check would flag hash changes; identify the tool | Unexpected stale phases | P-01 | C001-T-013, C001-COMP-03 |
| C001-RISK-013 | Token cost per change exceeds C001-NFR-106 | medium | medium | Usage recorded per gate (C001-NFR-701); digest-only returns; recalibrate threshold after T-073 (CR-4) | Dogfood change > 3,000,000 tokens | P-01 | C001-T-073, C001-T-074 |

High-impact risks with their mitigation task: RISK-001 → C001-T-006 (spike) and C001-T-030.
No high-impact risk is accepted without a task.
