---
id: C001-PLAN-RISKS
artifact: plan/risks
change: CHG-001
phase: 20-plan
status: approved
---

# CHG-001 — Risk register

Likelihood and impact use low / medium / high. Owner is the person or role who watches the
trigger; P-01 owns acceptance decisions.

| ID | Risk | Likelihood | Impact | Mitigation | Trigger | Owner | Refs |
|---|---|---|---|---|---|---|---|
| C001-RISK-001 | A plugin agent started with `--agent` cannot use AskUserQuestion, breaking the conductor design (D-01) | medium | high | Spike first (T-006); contingency AS-11 in strategy §4; spec revision of CAP-02 before M-3. Closed 2026-10-10: S-05 verified AskUserQuestion for a plugin agent run as the main session. | S-05 verdict negative | implementer, P-01 decides revision | C001-T-006, C001-T-030, C001-COMP-01 |
| C001-RISK-002 | Hook input does not identify the calling subagent | medium | medium | Spike T-005; fallback guard scope (former C001-REQ-1105, replaced by C001-REQ-1123). Closed 2026-10-10: S-04 verified `agent_type` in hook input (primary design). | S-04 verdict | implementer | C001-T-005, C001-T-050, C001-COMP-08 |
| C001-RISK-003 | ripwire Windows preview is unstable or wrong | medium | medium | Spike T-002; fallback ladder; cfg-no-ripwire tests; README marks it optional | S-01 verdict (2026-10-10: works-with-caveats; budget flags and exit codes corrected by the G2 revision, C001-IF-14 §2); eval failures on cfg-full | implementer | C001-T-002, C001-T-041, C001-T-074 |
| C001-RISK-004 | Serena setup friction or LSP failures on Windows | medium | low | Spike T-003; Serena optional; LSP/grep layers. S-02 (2026-10-10): installs and resolves references; launch and data-location caveats handled by C001-REQ-1006/1013. | S-02 verdict | implementer | C001-T-003, C001-T-041 |
| C001-RISK-005 | Agent evals are flaky or too costly | high | medium | Tiered runs (C001-ADR-003); assertions on tool calls, not prose; cost recorded per run; descriptions tuned in T-063. S-05 (2026-10-10): AskUserQuestion is unavailable headless; T-029 must provide an interactive or SDK harness first. | Milestone tier 2/3 results; cost per milestone > 2 × previous | implementer, P-01 for budget | C001-T-029, C001-T-063, C001-T-072 |
| C001-RISK-006 | Lint false positives frustrate authors and agents | medium | medium | One positive and one negative fixture per rule; this repository as a clean fixture; severity downgrade path via spec revision (OQ-11) | Authors waive the same rule twice | implementer | C001-T-018, C001-T-019, C001-T-020, C001-T-021, C001-T-022, C001-T-027 |
| C001-RISK-007 | Parser fragility when artifacts deviate from templates | medium | medium | Constrained grammar (C001-ADR-005); parser fixtures from real artifacts; clear LINT errors instead of crashes | Internal errors (ERR-CLI-016) on real files | implementer | C001-T-010, C001-COMP-04 |
| C001-RISK-008 | Claude Code plugin APIs change during the build | medium | medium | `claude plugin validate` in `npm run check`; pin observed versions in docs; spikes record field names | Validation failures after an update | implementer | C001-T-060, C001-T-061, C001-COMP-11 |
| C001-RISK-009 | Archify license is not permissive or headless use fails | low | low | Spike T-004; Mermaid fallback; T-071 droppable with a waiver. Materialised 2026-10-10 (S-03: no output on Windows 11): Mermaid only, T-071 dropped | S-03 verdict | P-01 | C001-T-004, C001-T-042, C001-T-071 |
| C001-RISK-010 | Scope (213 REQs, 58 tasks) exceeds available time | high | medium | Milestones deliver usable increments (M-2 CLI alone is useful); Should/Could REQs can be deferred to v0.2 by spec revision with waivers | Milestone slips beyond 2 × the estimate weight | P-01 | C001-T-072 |
| C001-RISK-011 | Spec defects found during implementation trigger repeated re-approval | medium | medium | Focused re-review via per-ID hashes (C001-REQ-813); batch defects per milestone | > 5 open defects at once | P-01 | C001-T-044, C001-T-028 |
| C001-RISK-012 | The unknown third-party tool writing `.sdd/metrics/` writes inside change folders | low | medium | Tolerance rule C001-REQ-124; stale check would flag hash changes; identify the tool | Unexpected stale phases | P-01 | C001-T-013, C001-COMP-03 |
| C001-RISK-013 | Token cost per change exceeds C001-NFR-106 | medium | medium | Usage recorded per gate (C001-NFR-701); digest-only returns; recalibrate threshold after T-073 (CR-4) | Dogfood change > 3,000,000 tokens | P-01 | C001-T-073, C001-T-074 |
| C001-RISK-014 | Getting from 79.99% to 85% lines takes about 500 more covered lines in `src/`, and the coverage step reruns the whole suite. So C001-T-080 can exceed its L estimate, and `npm run check` can take about twice as long. Tests written only to raise the figure would add cost without catching regressions | medium | medium | C001-T-080: tests are added in order of uncovered lines and must assert behaviour the spec states; no exclusions or lowered thresholds (Q-coverage-01); the coverage step runs last and can be skipped in the inner loop with `--steps`; the check duration of the four runs is recorded in `docs/nfr-results.md` §2 | C001-T-080 is still in progress after 2 days, or one `npm run check` run takes longer than 15 min | implementer; P-01 decides a split of C001-T-080 or a separate coverage command | C001-T-080, C001-COMP-12 |
| C001-RISK-015 | The already-applied checks of C001-T-081 take a merge as done when it is not, for example an entry with the same ID from another change or a History row of an earlier run. A resumed `archive` then skips a merge without an error, and a living spec misses a requirement | low | medium | C001-T-081: every check matches the requirement ID and the change ID together (`Source` line, History Change cell); C001-TC-1131 compares the resumed result byte for byte with one uninterrupted run; a wrong merge is reverted with C001-RB-004 | C001-TC-1131 or one of C001-TC-914 … 922 fails; the archive of CHG-001 (C001-T-075) differs from its dry-run preview | implementer | C001-T-081, C001-T-075, C001-COMP-06 |

High-impact risks with their mitigation task: RISK-001 → C001-T-006 (spike) and C001-T-030.
No high-impact risk is accepted without a task.
