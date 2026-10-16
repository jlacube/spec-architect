---
artifact: critic-report
change: CHG-002
phase: 20-plan
reviewed_ids: all
---
# Critic report — CHG-002 20-plan

Scope: the whole plan (`10-strategy.md`, ADR-001 … ADR-005 with OA-005 … OA-009, `30-impact/`,
`40-work-breakdown.md`, C002-T-001 … C002-T-052, `60-test-plan.md`, `70-risks.md`, `75-rollout.md`,
`78-observability.md`, `handoff.md`, `questions-log.md` rounds 1–3) against the approved spec (G2
re-approved, commit 08d6356). Paths in Evidence are relative to `.sdd/002-multi-platform-targets/`
unless they start with `evals/`, `tests/` or `.sdd/`.

Tool state on 2026-10-16: `sdd lint 002 --json` reports exactly the 9 LINT-DELTA-001 errors waived
under C002-DEC-008; `sdd trace 002` reports TR-01 … TR-11 at 100 % and a cycle-free task DAG. Those
9 findings and the waiver of DOD-G-01's 9-of-10 clause for CHG-002 are accepted waivers, not findings.

## Summary
| blocker | major | minor |
|---|---|---|
| 1 | 9 | 6 |

## Findings

### CR-1 — The eval budget estimate rests on a session cost that the repository's own results contradict
- **Severity:** blocker
- **Refs:** C002-RISK-015, C002-T-001, C002-T-010, C002-T-044, C002-NFR-105, C002-DOD-009, Q-evalbudget-01, `20-plan/60-test-plan.md` §4.1–§4.2
- **Evidence:**
  - "Planning rate 0.15 USD per session: the CHG-001 dev-tier results in `evals/results/` cost 0.08 to 0.39 USD per session. The upper bound uses the 0.50 USD cap." — `20-plan/60-test-plan.md:90-91`
  - "The estimate stays within the 25 USD budget with room for reruns" — `20-plan/60-test-plan.md:104`
  - "\"cost_usd\": 0.620886805," and "\"result_subtype\": \"error_max_budget_usd\"," — `evals/results/t039-TS-712-2026-10-11T14-05-22-879Z.json:12` and `:23` (one dev-tier run, `"runs": 1`)
  - "\"cost_usd\": 0.46325848000000003" — `evals/results/t032-TS-213-2026-10-11T10-11-04-743Z.json:12` (a C001-CAP-02 gate case; C002-M-06 plans about 17 of these on OpenCode)
  - "\"cost_usd\": 0.5192108" — `evals/results/t054-INJ-21-2026-10-11T21-39-08-270Z.json:12` (an injection case; C002-M-07 plans 20 per target)
  - "Before a milestone's runs, the runner compares the total plus the milestone estimate with P-01's stop" — `20-plan/60-test-plan.md:80-81`
  - "P-01 tops up the prepaid key (about 4.77 USD left on 2026-10-16) before the first paid run" — `20-plan/50-tasks/T-001-spike-s07-opencode.md:33` (a Targets cell; not in the task's Preconditions)
- **Why it matters:** 70 of the CHG-001 result files under `evals/results/t0*.json` record a session cost of 0.20 USD or more; the gate, interview, doctor and injection families that dominate C002-M-05 … C002-M-07 cost about 0.22–0.52 USD per session, and several sessions passed the 0.50 USD cap. At the 0.25–0.30 USD these files suggest, the 108 planned API-key sessions cost about 27–32 USD before any rerun, so the 25 USD budget that P-01 set in Q-evalbudget-01 on the strength of this estimate is likely reached inside C002-M-06 (upper bound 24.00 USD for that milestone alone). That is before the release-blocking injection evidence of C002-DOD-009 is produced in C002-M-07. Three controls make it worse: the stop rule runs only before a milestone and against the estimate, so a milestone can overrun by its whole upper bound; the "upper bound" assumes the cap holds, which the 0.62 USD run shows it does not; and the S-07 probe sessions of C002-T-001 bill the key before `evals/harness/caps.mjs` exists (C002-T-044), so they run without harness caps. The top-up has no amount, and the M-02 paid run of C002-T-010 can start in parallel with C002-M-01 without that precondition. CHG-001 also needed up to four runs of one case (four `t032-TS-214-*` result files), while the total "excludes reruns".
- **Suggested fix:** Re-estimate §4.2 per case family from the CHG-001 result files, cite them, and add a rerun allowance. Put the budget question to P-01 (Q-evalbudget-03 in the hand-back). Whatever the answer: check the ledger before every session (running total plus the highest observed session cost against the budget); ring-fence the C002-M-07 release evidence (C002-TC-612 injection rows, C002-T-048) and schedule it before optional rows; state the top-up amount ("key holds at least the budget minus the ledger total") in the Preconditions of C002-T-001 and C002-T-010; give the S-07 probes an explicit turn and spend limit.
- **Owner:** P-01 (budget decision); sdd-test-designer (estimate, stop rule); sdd-planner (task preconditions)
- **Status:** open

### CR-2 — The answer to Q-release-01 (zips in dist/) is applied nowhere in the plan
- **Severity:** major
- **Refs:** Q-release-01, C002-T-034, C002-T-047, C002-T-052, C002-RB-002, C002-RB-003, `20-plan/75-rollout.md` §1
- **Evidence:**
  - "- **Answer:** Zips in dist/ (Recommended)" — `20-plan/questions-log.md:47`
  - "| 3 | OpenCode target package (`dist/opencode/`) | Release by P-01 with its release record under `docs/releases/opencode/<version>/` |" — `20-plan/75-rollout.md:20`
  - "3. **P-01 step:** release each passing target package." — `20-plan/50-tasks/T-052-publish-and-release.md:44`
  - "- [ ] One command writes all four outputs" — `20-plan/50-tasks/T-034-packaging-runs-generator.md:50`
  - "P-01 withdraws the release and points the README section and install notes to the previous released version." — `20-plan/75-rollout.md:47`
- **Why it matters:** Commit 5af774f logged the answer but changed only `questions-log.md`, `change.md`, `SDD.md` and `registry.json` (`git show --stat 5af774f`). No task builds, names or tests a per-target zip, T-052's release step has no concrete action, the release check (C002-T-047) compares a regenerated folder rather than the archive adopters receive, and C002-RB-002/C002-RB-003 have nothing to point back to unless released zips are kept. A cold-start implementer cannot tell what "release" produces.
- **Suggested fix:** Add a zip step to C002-T-034 (or a new task after C002-T-047): one zip per target in `dist/`, built from `dist/opencode/` and `dist/copilot/` the way `scripts/package.mjs` zips the Claude Code staging today, with a test that the zip content equals the folder and its generation manifest. Name the zip in rollout §1 (Channel), in C002-T-052 step 3 and in the release record; say where released zips are retained for C002-RB-002/C002-RB-003 and that a first release can only be withdrawn.
- **Owner:** sdd-planner
- **Status:** open

### CR-3 — 56 planned API-key eval sessions have no task step that runs them
- **Severity:** major
- **Refs:** C002-T-010, C002-T-037, C002-T-038, C002-T-044, C002-T-049, C002-M-05, C002-M-06, C002-TC-537, C002-DOD-001, C002-DOD-002, C002-DOD-006
- **Evidence:**
  - "| C002-M-05 | 10 on E-CC: the Claude Code rows of C002-TC-215, 217, 219, 506, 509, 510, 511 (9) and the doctor eval of regression-set §5 row 1 (1) |" — `20-plan/60-test-plan.md:99`
  - "3. Run the generated-body test now. The eval runs happen at the end of M-06, once the runners exist." — `20-plan/50-tasks/T-037-conductor-question-variants.md:48`
  - "| C002-M-06 | 48 on E-OCE: the 28 carried OpenCode rows of C002-TC-113 … C002-TC-639, C002-TC-613 with the C001-CAP-02 interview and gate cases (about 17), C002-TC-634, C002-TC-635 and the C002-T-044 smoke |" — `20-plan/60-test-plan.md:100`
  - "4. Keep the paid runs inside the API-key budget: one dev-tier run here as a smoke; the release runs are C002-T-049." — `20-plan/50-tasks/T-044-opencode-eval-runner.md:50-51`
  - "both eval runners pass their stub-host tests (caps)" — `20-plan/10-strategy.md:64` (the C002-M-06 exit criterion)
  - "| C002-M-02 | 5 on E-CC: C002-TC-537 (2 rows) and regression-set §5 row 1 (3 cases) at C002-T-010 |" — `20-plan/60-test-plan.md:96`, against "The milestone eval run: `evals/cap11/doctor-no-ripwire.eval.mjs` (one run)" — `20-plan/50-tasks/T-010-bash-guard-serena-confinement.md:57`, and "| add | `evals/targets/doctor/*.eval.mjs` |" — `20-plan/50-tasks/T-038-doctor-host-rows.md:36` (C002-M-05)
- **Why it matters:** The 9 Claude Code rows of C002-M-05 need no new runner, yet C002-T-037 postpones them and C002-T-038 runs only the regression doctor eval. The 47 non-smoke OpenCode sessions of C002-M-06 belong to no task: C002-T-044 plans one smoke run, C002-T-049 is budgeted for the 35 release sessions of C002-M-07, and no milestone exit criterion asks for them. These rows are the evidence of C002-DOD-001, C002-DOD-002 and C002-DOD-006. Either nobody produces it, or C002-T-049 runs every dev-tier case and §4.2 under-counts it. The C002-M-02 run of C002-TC-537 needs a case file (`evals/targets/doctor/TS-537.eval.mjs`) that only C002-T-038 creates, and §4.2 counts 3 regression cases where C002-T-010 runs one.
- **Suggested fix:** Give each eval group an owning step and an exit-criterion line: C002-T-037 or C002-T-038 runs the 9 E-CC rows at the C002-M-05 exit; a step of C002-T-044 (or a task between C002-T-044 and C002-T-049) runs and records the carried E-OCE rows; C002-T-049 runs only the M-07 rows of §4.2. Move `TS-537.eval.mjs` into C002-T-010's Targets (or move the C002-TC-537 run to C002-M-05) and make the regression-set §5 row-1 count the same in §4.2 and C002-T-010.
- **Owner:** sdd-planner; sdd-test-designer
- **Status:** open

### CR-4 — Spike outcome branches leave session scenarios, the eval driver and two outcomes without a path
- **Severity:** major
- **Refs:** C002-T-001, C002-T-002, C002-T-042, C002-T-044, C002-T-045, C002-ADR-005, Q-replay-01, C002-RISK-012, C002-REQ-610, C002-TC-133, C002-TC-211, C002-TC-222, C002-TC-223, C002-TC-613, C002-TC-634, C002-TC-635, C002-TC-513, C002-TC-526, C002-TC-615
- **Evidence:**
  - "| S-07 stub-model driver infeasible | A new ADR supersedes C002-ADR-005 with P-01's answer to Q-replay-01: C002-T-042 evaluates OpenCode's permission module from its source at the tested tag" — `20-plan/10-strategy.md:80`
  - "2. If S-07 recorded it as infeasible, stop. Raise the new ADR that supersedes C002-ADR-005 with P-01's answer to Q-replay-01, then build the fallback adapter: evaluate OpenCode's permission module from its source at the tested tag." — `20-plan/50-tasks/T-042-opencode-driver-replay-adapter.md:46-48`
  - "| add | `evals/harness/runners/opencode.mjs` | runner on the C002-T-042 driver;" — `20-plan/50-tasks/T-044-opencode-eval-runner.md:33`
  - "Given the OpenCode target package has a post-write feedback channel (spike S-07)" / "And an OpenCode session at the tested version on \"fx-oc\"" — `10-spec/20-capabilities/CAP-02-opencode-target/acceptance.md:291-292`
  - "C002-TC-613, C002-TC-634 and C002-TC-635 need the S-07 finding that a script can answer `question` calls (their Given)." — `20-plan/60-test-plan.md:33-34`
  - "the scenarios needing a session (C002-TC-613, C002-TC-634, C002-TC-635) keep their Given and are reported not applicable with the record cited" — `20-plan/70-risks.md:36`
  - "| S-08 `copilot_cli_loads_package: false` | Copilot injection cases move to the checklist (C002-REQ-613). C002-T-045 keeps the routing and server cases that Copilot CLI can run |" — `20-plan/10-strategy.md:78`
- **Why it matters:** (1) With the stub-model driver infeasible, the fallback decides permission rules only. The replay scenarios in which an agent must issue a call in a running session — C002-TC-133 (adopter MCP tool), C002-TC-211 (edit applied), C002-TC-222 and C002-TC-223 (post-write feedback) — then have no execution path, and C002-T-042 does not say whether the shared session driver that C002-T-044 builds on is still delivered. (2) `10-strategy.md` §4 has no row for `question_answerable_by_script: false`, although every scripted-answer eval depends on it (C002-REQ-610; C002-TC-215 … C002-TC-221, C002-TC-316, C002-TC-613, C002-TC-634, C002-TC-635); C002-RISK-012 instead attaches three of them to the stub-model outcome, which does not affect real-model eval sessions. (3) If Copilot CLI cannot load the package, its package-based rows (the Copilot rows of C002-TC-513, C002-TC-526, the routing cases of C002-TC-615) have no stated home. The brief's "spikes first" ordering holds; what is missing is the plan for these outcomes.
- **Suggested fix:** Extend `10-strategy.md` §4 and C002-RISK-012: stub-model infeasible → C002-T-042 still delivers `evals/harness/opencode/driver.mjs` for the real-model runner, and C002-TC-133, 211, 222, 223 move to the OpenCode eval runner (budgeted under CR-1) or are raised as a spec defect; `question_answerable_by_script: false` → spec defect against C002-REQ-610 listing the affected TCs; `copilot_cli_loads_package: false` → name the Copilot CLI rows that move to the checklist of C002-T-046 and those reported not applicable.
- **Owner:** sdd-planner; sdd-test-designer (TC moves)
- **Status:** open

### CR-5 — Four scenarios are owned by tasks that do not build what they test
- **Severity:** major
- **Refs:** C002-TS-125, C002-TS-126, C002-TS-637, C002-TS-640, C002-T-026, C002-T-029, C002-T-031, C002-T-035, C002-T-040, C002-T-047, C002-REQ-114
- **Evidence:**
  - "Scenario: C002-TS-125 — Serena started from the OpenCode declaration" — `10-spec/20-capabilities/CAP-01-target-generator/acceptance.md:359`; its only owner: "| C002-TC-125 | C002-TS-125 | integration | `tests/integration/cap01/serena-launch.test.ts` | `npm test -- cap01/serena-launch` | fx-tgz, fx-oc copy, `LOCALAPPDATA` = `C:/fx-home/AppData/Local` | E-SER | C002-T-031 |" — `20-plan/60-test-plan.md:177`
  - "The plan then drops C002-T-031, C002-T-032, C002-T-033, C002-T-045, C002-T-046 and C002-T-050" — `20-plan/10-strategy.md:76`
  - "| C002-TC-126 | C002-TS-126 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad | E-W | C002-T-031 |" — `20-plan/60-test-plan.md:178`
  - "| C002-TC-640 | C002-TS-640 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad (tool map rows) | E-W | C002-T-026 |" — `20-plan/60-test-plan.md:186`
  - "| C002-TC-637 | C002-TS-637 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release with incomplete replay reports | E-W | C002-T-040 |" — `20-plan/60-test-plan.md:347`
  - "verified_by: [C002-TS-116, C002-TS-121, C002-TS-122, C002-TS-601, …" — `20-plan/50-tasks/T-035-target-structure-checks.md:12` (no C002-TS-126, no C002-TS-640); `20-plan/50-tasks/T-047-release-check.md:12` lists no C002-TS-637
- **Why it matters:** C002-TS-125 runs the OpenCode Serena declaration but sits only with the Copilot emitter; in the deferred-Copilot branch it is dropped with C002-T-031 and the runtime evidence of C002-REQ-114 for OpenCode is lost. C002-TS-126 (TGT-SERENA-001) and C002-TS-640 (TGT-TOOLS-001) are target structure checks, which C002-T-035 writes after C002-T-031 and C002-T-026 are done, without listing them. C002-TS-637 is an ERR-REL-012 refusal of the release check, which C002-T-047 builds after C002-T-040. The listed owners cannot make these scenarios pass, and the tasks that can are not told to.
- **Suggested fix:** Move C002-TS-125 and C002-TC-125 to C002-T-029; C002-TS-126 and C002-TS-640 to C002-T-035; C002-TS-637 to C002-T-047. Update `verified_by` and the TC Task column together; keep the earlier tasks as contributors only if the test plan defines that role (see CR-11).
- **Owner:** sdd-test-designer; sdd-planner
- **Status:** open

### CR-6 — Test and eval files of 18 test cases are in no task's Targets, including C002-TC-627
- **Severity:** major
- **Refs:** C002-TC-627, C002-TS-627, C002-TC-125, C002-TC-505, C002-TC-609, C002-TC-628, C002-TC-629, C002-TC-631, C002-TC-638, C002-TC-643, C002-TC-644, C002-TC-645, C002-TC-649, C002-TC-650, C002-TC-113, C002-TC-132, C002-TC-613, C002-TC-634, C002-TC-635, C002-T-006, C002-T-008, C002-T-040, C002-T-044, C002-T-048, C002-DOD-022
- **Evidence:**
  - "| C002-TC-627 | C002-TS-627 | integration | `tests/integration/contracts/claude-behaviour.test.ts` | `npm test -- contracts/claude-behaviour` | fx-src with a planted Claude Code behaviour change per row | E-W | C002-T-006, C002-T-048 |" — `20-plan/60-test-plan.md:337`; C002-T-048's only target is "| add | `docs/releases/regression-CHG-002.md` |" — `20-plan/50-tasks/T-048-claude-regression-run.md:33`; C002-T-006 has "depends_on: []" — `20-plan/50-tasks/T-006-spec-locator-and-coupled-tests.md:9`
  - "| makes the bash guard deny the Serena step of the Claude Code doctor command (the command of C002-TS-528) | the test of the doctor's Serena step on Claude Code |" — `10-spec/20-capabilities/CAP-06-cross-target-verification/acceptance.md:459`
  - "| C002-TC-505 | C002-TS-505 | integration | `tests/integration/cli/guard-message.test.ts` |" — `20-plan/60-test-plan.md:277` (C002-T-008's Targets, lines 31-33, do not list it)
  - "| C002-TC-609 | C002-TS-609 | replay | `tests/replay/scenarios/suite.test.ts` |" — `20-plan/60-test-plan.md:319`; C002-T-040 adds only "`tests/replay/run.mjs`, `tests/replay/expect.ts`, `tests/replay/report.ts`, `tests/replay/adapter.ts`" — `20-plan/50-tasks/T-040-replay-suite-framework.md:34`
  - "| C002-TC-613 | C002-TS-613 | eval | `evals/targets/gate/TS-613.eval.mjs` and the C001-CAP-02 interview and gate cases |" — `20-plan/60-test-plan.md:323`; "| C002-TC-113 | C002-TS-113 | eval | `evals/targets/generator/TS-113.eval.mjs` |" — `20-plan/60-test-plan.md:165`
- **Why it matters:** Implementers work from the Targets tables. No task is told to write `claude-behaviour.test.ts` (C002-TC-627, the planted-change test behind C002-DOD-022), `serena-launch.test.ts` (C002-TC-125), `guard-message.test.ts` (C002-TC-505), `tests/replay/scenarios/suite.test.ts` (C002-TC-609, 628, 629, 631, 638, 643, 644, 645, 649, 650), or the case files under `evals/targets/gate/` and `evals/targets/generator/` (C002-TC-113, 132, 613, 634, 635). `tests/replay/scenarios/opencode-host.test.ts` appears only in the Verification notes of C002-T-029 and C002-T-030, and the `fx-gate` fixture attributed to C002-T-037 is not in its Targets. C002-TS-627's owner C002-T-006 also runs before C002-T-010, whose doctor Serena test its second Examples row needs.
- **Suggested fix:** Add every file to the Targets of the task that writes it: `claude-behaviour.test.ts` to C002-T-048 (or to a task that depends on C002-T-010); `guard-message.test.ts` to C002-T-008; `suite.test.ts` to C002-T-040; `opencode-host.test.ts` to C002-T-029 and C002-T-030; `serena-launch.test.ts` to C002-T-029 (with CR-5); the gate and generator eval cases to the tasks that own their scenarios (as C002-T-037 and C002-T-038 do for theirs); `fx-gate` to C002-T-037.
- **Owner:** sdd-planner
- **Status:** open

### CR-7 — The Claude Code regression run can finish before the last changes to shared harness files
- **Severity:** major
- **Refs:** C002-T-048, C002-T-042, C002-T-044, C002-T-045, C002-T-047, C002-T-049, C002-RISK-009, C002-DOD-022
- **Evidence:**
  - "depends_on: [C002-T-022, C002-T-035, C002-T-037, C002-T-038]" — `20-plan/50-tasks/T-048-claude-regression-run.md:9`
  - "- C002-T-022, C002-T-035, C002-T-037 and C002-T-038 done (last source-affecting tasks)." — `20-plan/50-tasks/T-048-claude-regression-run.md:37`
  - "| modify | `evals/harness/session.mjs` | host selection without changing the `runSession` signature (three importers) |" — `20-plan/50-tasks/T-044-opencode-eval-runner.md:36`
  - "C002-T-048 re-runs the Claude Code evals of regression-set §5" — `20-plan/70-risks.md:28` (mitigation of C002-RISK-009)
- **Why it matters:** With the plan's weights C002-T-048 can be done at 24, while C002-T-044 (session.mjs and env.mjs, hotspot rank 10) finishes at 25 and C002-T-045 at 27; C002-T-042 adds a root devDependency (hotspot rank 5) in the same window. The mitigation of C002-RISK-009 then never happens, and the C002-DOD-022 evidence can come from an older commit than the release candidate that C002-T-049 builds.
- **Suggested fix:** Make C002-T-048 depend on C002-T-042, C002-T-044, C002-T-045 and C002-T-047 (or on C002-T-049), run it at the release-candidate commit of C002-T-049, and record that commit in its report.
- **Owner:** sdd-planner
- **Status:** open

### CR-8 — C002-T-048's done-check conflicts with test edits the plan itself makes (C002-REQ-623)
- **Severity:** major
- **Refs:** C002-REQ-623, C002-T-048, C002-T-006, C002-T-004, C002-T-021, `20-plan/30-impact/regression-set.md` §4.2–§4.3
- **Evidence:**
  - "THE plugin SHALL pass every test and eval of the regression set, with the corpus cases and deny-message texts changed by C002-REQ-503, C002-REQ-517 and C002-REQ-521 as the only changed expectations." — `10-spec/20-capabilities/CAP-06-cross-target-verification/requirements.md:220`
  - "- [ ] Report written; every changed expectation traces to C002-REQ-503, C002-REQ-517 or C002-REQ-521" — `20-plan/50-tasks/T-048-claude-regression-run.md:55`
  - "| modify | `tests/integration/cli/frontend.test.ts` | catalogue mirror reads the ERR-CLI and WARN-CLI rows of the CHG-001 and CHG-002 `errors.md`; command list reads C001-IF-01 and C002-IF-007;" — `20-plan/50-tasks/T-006-spec-locator-and-coupled-tests.md:35`
- **Why it matters:** The regression set's own §4.2 and §4.3 edits change asserted values that trace to other IDs: the command list of `frontend.test.ts` gains `host-version`, `template show`, `template list`, `hook guard` and `hook subagent-stop` (C002-REQ-508, 513, 520, 308, 315), the catalogue gains ERR-CLI-019 and ERR-CLI-020 (C002-REQ-514, 516), and `smoke.test.ts` compares with `plugin.json` (C002-CON-16). C002-T-048 step 2 lists every change of `git diff 85bee21 -- tests/`, so its done-check fails on the plan's own work unless "changed expectation" is defined, and P-01 meets the conflict only at the last evidence task.
- **Suggested fix:** In regression-set §4, classify each planned test edit as an addition (new rows, cases, harness options) or a changed expectation, and word C002-T-048's done-check by that classification. If P-01 reads any edit as a changed expectation outside C002-REQ-503, 517 and 521, raise a spec defect against C002-REQ-623 before implementation (Q-regression-01 in the hand-back).
- **Owner:** sdd-planner; P-01 (reading of C002-REQ-623)
- **Status:** open

### CR-9 — The OpenCode release waits for every Copilot task, against the rollout's independent release
- **Severity:** major
- **Refs:** C002-T-045, C002-T-049, C002-T-050, C002-T-052, C002-REQ-619, C002-RISK-013, C002-RISK-014, `20-plan/75-rollout.md` §1, `20-plan/40-work-breakdown.md` (critical path)
- **Evidence:**
  - "The two targets are decided independently: a refused target is not released and its refusal stays recorded; the other target still ships." — `20-plan/75-rollout.md:23-24`
  - "depends_on: [C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-049, C002-T-050, C002-T-051]" — `20-plan/50-tasks/T-052-publish-and-release.md:9`
  - "depends_on: [C002-T-036, C002-T-041, C002-T-043, C002-T-044, C002-T-045]" — `20-plan/50-tasks/T-049-release-evidence-runs.md:9`
  - "10. C002-T-045 — Copilot CLI eval runner (M)" and "12. C002-T-050 — P-01: run the manual VS Code checklist and record it (S)" — `20-plan/40-work-breakdown.md:202` and `:204`
- **Why it matters:** "Decided independently" holds only for a refusal. A Copilot task that slips — the hooks fallback grows P-01's checklist (C002-RISK-014), and a failed checklist step "reopens the owning task" (C002-T-050 step 3) — holds back the OpenCode release, because one C002-T-049 and one C002-T-052 serve both targets. Two of the 13 critical-path tasks are Copilot-only; without them the OpenCode chain ends 3 weight units earlier (28 instead of 31). The critical-path arithmetic itself is correct (31 of 107, slack as stated); its credibility suffers because the end date rides on the riskiest target and on two P-01 tasks.
- **Suggested fix:** Split C002-T-049 and C002-T-052 per target (OpenCode evidence and release after C002-T-036, C002-T-041, C002-T-043, C002-T-044; Copilot after C002-T-045, C002-T-046, C002-T-050), keep the `architect-sdd` publication before the first target release, and give the critical path per target.
- **Owner:** sdd-planner
- **Status:** open

### CR-10 — The approved-phase lint loop of `frontend.test.ts` fails on CHG-002, and no task fixes it
- **Severity:** major
- **Refs:** C002-T-006, C002-RISK-004, C002-DEC-008, `20-plan/30-impact/regression-set.md` §4.2
- **Evidence:**
  - "4. Check that the approved-phase lint loop (`frontend.test.ts:147-165`) still passes once CHG-002's plan is approved, with the LINT-DELTA-001 waiver in effect (regression-set §4.2)." — `20-plan/50-tasks/T-006-spec-locator-and-coupled-tests.md:50-51`
  - "assert.equal(r.code, 0, r.stdout);" — `tests/integration/cli/frontend.test.ts:158` (inside the loop over every change whose current phase is approved)
  - "`sdd lint 002` is expected to report exactly the 9 waived LINT-DELTA-001 findings." — `20-plan/handoff.md:67`; `sdd lint 002 --json` on 2026-10-16 returns `"error": 9` and exit code 1
  - "its lint-every-approved-change test fails on CHG-002 once G3 is approved unless the LINT-DELTA-001 waiver is effective in that run" — `20-plan/70-risks.md:23`
  - "\"phase\": \"10-spec\"," — `.sdd/registry.json:164` (CHG-002; `10-spec` is approved)
- **Why it matters:** Lint reports the waived findings as errors with exit 1, and nothing in the plan makes a waiver "effective" in that test. Once CHG-002's current phase is an approved one (at the latest at G3; the registry already records the approved `10-spec` as current), the loop lints CHG-002 and fails. `npm test`, and with it `npm run check`, which every task must pass before it is reported done (`20-plan/10-strategy.md:92-93`), stays red from C002-T-001 until CHG-001 is archived (C001-T-075). C002-RISK-004's mitigation covers the locator only; C002-T-006 checks the loop but has no step that fixes it.
- **Suggested fix:** Decide the mechanism in the plan and schedule it first: either C002-T-006 makes the loop ignore findings whose item is waived in that change's `change.md` (a §4.2 edit, recorded for C002-T-048), or CHG-001 is archived (C001-T-075) before CHG-002 implementation starts so the cited IDs reach `_living/`. Update C002-RISK-004's mitigation to match.
- **Owner:** sdd-planner
- **Status:** open

### CR-11 — Early tasks list integration cases they cannot pass, and some done-checks claim carried scenarios
- **Severity:** minor
- **Refs:** C002-T-001, C002-T-002, C002-T-003, C002-T-005, C002-T-011, C002-T-024, C002-T-026, C002-T-027, C002-T-031, `20-plan/60-test-plan.md` §6
- **Evidence:**
  - "- **Exit (task)**: the integration and structure cases of its `verified_by` pass on E-W. Its replay and eval cases that wait for a later runner are listed in the task report as carried" — `20-plan/60-test-plan.md:124-125`
  - "verified_by: [C002-TS-525, C002-TS-527, C002-TS-536, C002-TC-525, C002-TC-527, C002-TC-536]" — `20-plan/50-tasks/T-005-repository-root-helper.md:12`
  - "verified_by: [C002-TS-401, C002-TS-628, C002-TC-401, C002-TC-628]" — `20-plan/50-tasks/T-011-path-guard-memory-option.md:12`
  - "verified_by: [C002-TS-106, C002-TS-109, C002-TS-110, C002-TC-106, C002-TC-109, C002-TC-110]" — `20-plan/50-tasks/T-024-mapping-tables.md:12`
  - "- [ ] All listed scenarios pass for both targets" — `20-plan/50-tasks/T-026-translator-frontmatter.md:53`
- **Why it matters:** The exit rule carries only replay and eval cases, but C002-T-005's cases are written by C002-T-009, C002-T-010 and C002-T-013, C002-T-011's C002-TC-401 needs the server and tarball of C002-T-017 and C002-T-022, C002-T-024's cases are translator tests of C002-T-026 and C002-T-027, and the release-check cases of C002-T-001 and C002-T-002 (C002-TC-620, 623, 648) need C002-T-047. The done-checks of C002-T-026 (eval C002-TS-113, replay C002-TS-133), C002-T-027 (eval C002-TS-132) and C002-T-031 (manual C002-TS-309, C002-TS-329) claim scenarios that can only run later.
- **Suggested fix:** Extend the carry rule of §6 to integration and structure cases whose code lands in a later task (naming that task), or separate contributing tasks from the owning task; reword those done-checks to "integration and structure scenarios pass; eval, replay and manual scenarios carried to <task>".
- **Owner:** sdd-test-designer; sdd-planner
- **Status:** open

### CR-12 — Stale or inconsistent statements in the test plan, regression set and hand-off
- **Severity:** minor
- **Refs:** `20-plan/60-test-plan.md` §4.2 and §6, `20-plan/30-impact/regression-set.md` §1, `20-plan/handoff.md`, D-001
- **Evidence:**
  - "not under `npm test -- cap02` as the task bodies' Verification sections state." — `20-plan/60-test-plan.md:127-128` (C002-T-029 and C002-T-030 now state `npm run replay -- opencode-host`)
  - "stop and discuss at $10 spent of the $20 top-up" — `20-plan/30-impact/regression-set.md:27-28` (replaced by the 25 USD CHG-002 budget, test plan §4.1)
  - "the G2 revision for defect D-001 (eval tier) must be approved first." — `20-plan/handoff.md:15-16`; D-001 has "status: closed" — `change.md:16`
  - "room for reruns (about 3.75 USD after C002-M-05)" — `20-plan/60-test-plan.md:104`
- **Why it matters:** Each sentence contradicts another artifact or the current state; 3.75 USD is the cumulative estimate of C002-M-01, C002-M-02 and C002-M-05 (1.50 + 0.75 + 1.50), not room. A reader can follow the wrong rule (old stop at 10 USD) or wait for an approval that already happened.
- **Suggested fix:** Drop the trailing clause of §6; point regression-set §1 to test plan §4.1; reword the hand-off to "G2 was re-approved after D-001 (closed)"; state the room as budget minus estimate (after CR-1's re-estimate).
- **Owner:** sdd-test-designer; sdd-cartographer (regression set); sdd-planner (hand-off)
- **Status:** open

### CR-13 — Two touched hotspots have no risk row, and a regression note points to a missing entry
- **Severity:** minor
- **Refs:** C002-T-012, C002-T-004, `20-plan/30-impact/hotspots.md` ranks 12 and 20, `20-plan/30-impact/regression-set.md` §3–§4
- **Evidence:**
  - "| 20 | `src/workspace/templates.ts`, `serena-launch.ts`, `serena-config.ts` | 1 / — / — | 77 / 20 / 46 | 2-3 each | C002-COMP-018 | Small and single-purpose; `resolveTemplate` has no path confinement, which `template show` needs |" — `20-plan/30-impact/hotspots.md:53`
  - "1. Put the confinement in the one resolution function, so that `change new` and `upgrade` inherit it." — `20-plan/50-tasks/T-012-cli-template-commands.md:43`
  - "green if the `template` confinement is added beside `resolveTemplate`; see section 4 if it is inside" — `20-plan/30-impact/regression-set.md:64` (§4 has no templates entry)
  - "| 12 | `src/cli/run.ts` | 3 | 143 | all invocations | C002-COMP-018 | Dispatch, `GROUPS`, global `--cwd`; gains `--version` and relies on the `findCommand` rule for the writing-command table |" — `20-plan/30-impact/hotspots.md:45`
- **Why it matters:** C002-T-012 picks the "inside" variant, which changes what `change new` and `upgrade` accept (CHG-001 behaviour, including `.sdd/_templates` overrides), and the `--version` branch sits in the dispatch of every command (regression-set line 68). Neither has a risk row with trigger and owner, and the regression set's "see section 4" leads nowhere.
- **Suggested fix:** Add risk rows for hotspot ranks 12 and 20 (triggers: `templates.test.ts`, `cap01/TS-123` or a `cap01` … `cap09` dispatch test fails), and add the templates entry to regression-set §4.
- **Owner:** sdd-planner; sdd-cartographer
- **Status:** open

### CR-14 — The Copilot subscription is an unstated prerequisite of about 55 sessions
- **Severity:** minor
- **Refs:** C002-T-002, C002-T-045, C002-T-049, C002-RISK-015, C002-REQ-105, `20-plan/60-test-plan.md` §3
- **Evidence:**
  - "| E-CPC | Copilot CLI at its S-08 tested version, non-interactive with `--no-ask-user`; billed to P-01's Copilot subscription |" — `20-plan/60-test-plan.md:67`
  - "| **Total** | about 108 | **16.20 USD** | 54.00 USD | about 55 |" — `20-plan/60-test-plan.md:102`
  - "- REF-WIN with VS Code, GitHub Copilot Chat and Copilot CLI installed; P-01 names the versions." — `20-plan/50-tasks/T-002-spike-s08-copilot-vscode.md:37`
- **Why it matters:** About 55 sessions with the Claude model tiers of C002-REQ-105 draw on P-01's Copilot plan. No precondition names the plan, that Claude models are enabled in it, or its request allowance, and C002-RISK-015 covers the API key only. A plan without Claude models, or an exhausted allowance, stops C002-T-002 and C002-T-049.
- **Suggested fix:** Add the subscription (plan, Claude models enabled, allowance for about 55 sessions) to C002-T-002's Preconditions and a risk row with P-01 as owner.
- **Owner:** sdd-planner
- **Status:** open

### CR-15 — The hand-off omits one P-01 task and the reference-machine set-up
- **Severity:** minor
- **Refs:** C002-T-051, `20-plan/handoff.md`, `20-plan/60-test-plan.md` §3
- **Evidence:**
  - "- P-01 steps (C002-T-003, C002-T-050, C002-T-052 and the sign-offs) are done by P-01;" — `20-plan/handoff.md:52`
  - "1. **P-01 step:** use a fresh Windows user profile with only Node.js and the host installed." — `20-plan/50-tasks/T-051-clean-profile-runs.md:40`
  - "| E-W4 | REF-WIN, PowerShell 7 and Git Bash, each with Node.js 20 LTS and 22 LTS (C002-DOD-015, C002-DOD-016) |" — `20-plan/60-test-plan.md:62`
- **Why it matters:** A cold-start implementer is not told that C002-T-051 is P-01's, nor that REF-WIN needs two Node.js versions (and how to switch them), Serena 1.7.x (E-SER), Developer Mode (E-OC), and OpenCode, VS Code and Copilot CLI at the spike versions. These facts are spread over test plan §3 and task preconditions, and the reading order sends the implementer to test-plan rows, not to §3.
- **Suggested fix:** Add C002-T-051 to the P-01 list; add a short "Reference machine" section to the hand-off that lists the installs, points to test plan §3, and names the Node.js switch method.
- **Owner:** sdd-planner
- **Status:** open

### CR-16 — C002-T-025's writer step keeps an old package on error, against C002-INV-02
- **Severity:** minor
- **Refs:** C002-T-025, C002-T-034, C002-INV-02, ERR-GEN-010, C002-TS-104
- **Evidence:**
  - "3. Write to `dist/.staging-<target>` and rename over `dist/<target>` only when no diagnostic exists." — `20-plan/50-tasks/T-025-generator-skeleton.md:47`
  - "**C002-INV-02** After a generation run, the output folder of each selected target holds exactly the files of that run, or does not exist when the run found an error." — `10-spec/40-domain/domain-model.md:67`
  - "2. A generator failure leaves no `dist/opencode` and no `dist/copilot`, and no tarball is packed." — `20-plan/50-tasks/T-034-packaging-runs-generator.md:42`
- **Why it matters:** Read literally, step 3 keeps the previous `dist/<target>` when a diagnostic exists, and a write error on the second rename keeps the first target's new package. C002-INV-02, ERR-GEN-010 ("no target package was kept") and C002-T-034 require that neither folder exists after a failed run.
- **Suggested fix:** Reword step 3: stage every selected target, then replace the old folders; on any diagnostic or write error remove every selected `dist/<target>`. Cover both cases in `generator-frame.test.ts`.
- **Owner:** sdd-planner
- **Status:** open

## Verified without finding

- Critical path recomputed from the `depends_on` fields: 31 of 107 weight units (13 S, 23 M, 16 L);
  the slack figures (C002-T-021 at 7 → C002-T-031 at 13, C002-T-022 at 10 → C002-T-034 at 16,
  C002-T-020 at 12 → C002-T-041 at 18) are correct.
- The hand-off's numeric task order is a topological order: every dependency has a lower number.
- Spikes first: C002-T-001 and C002-T-002 have no dependencies, C002-T-024 waits for both records,
  and C002-M-02 and C002-M-03 need no spike value.
- Test-plan level counts (98 integration, 47 structure, 23 replay, 24 eval, 17 manual = 209) match
  the table; every C002-TS has a C002-TC (TR-08 206/206).
- All 16 NFRs have an implementing task and a row in `78-observability.md`; all 121 REQs have a task
  (TR-06).
- The three questions of `30-impact/blast-radius.md` §5 are answered by C002-T-009, C002-T-005 and
  C002-T-021; ADR-001 … ADR-005 each record their OA, options and consequences.

## Rubric
| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: TR-06 121/121; every NFR has an implementing task |
| plan | P2 Each task has targets, verification and done-checks | CR-6, CR-8, CR-10, CR-11, CR-16 |
| plan | P3 Dependency graph acyclic, milestones coherent | CR-3, CR-7, CR-9 (TR-11 acyclic: pass) |
| plan | P4 Every scenario maps to a planned test | CR-1, CR-5, CR-6 (TR-08 206/206 by mapping) |
| plan | P5 Risks cover the hotspots touched | CR-13, CR-14 |
| plan | P6 Rollout and rollback stated | CR-2 |
| plan | P7 ADRs for every remaining technical decision | pass: ADR-001 … ADR-005 cover binding, validation, tool language, pack and replay driver; the superseding ADR for the S-07 fallback is planned (C002-T-042) |
| brief focus | Spikes first; S-07 and S-08 outcome branches | CR-4 |
| brief focus | Estimates and critical path credible | CR-9 |
| brief focus | Test plan executable within the 25 USD eval budget | CR-1, CR-3, CR-14 |
| brief focus | Risks and rollback concrete | CR-2, CR-13 |
| brief focus | Hand-off sufficient for a cold-start implementer | CR-12, CR-15 |
| brief focus | Brownfield regression set covered | CR-6, CR-7, CR-8, CR-10 |
| ideation I1–I10, stories S1–S6, requirements R1–R12, NFRs N1–N5, acceptance A1–A5, domain D1–D5, DoD and index O1–O3, X1 | all items | n/a: approved at G1 and G2 (G2 re-approved 08d6356); this review covers the plan |

## Verdict

**needs-clarification.** The plan is not approvable at G3 as it stands. CR-1 is a blocker that only
P-01 can resolve: the budget decision of Q-evalbudget-01 rests on an estimate that the CHG-001
results contradict (question Q-evalbudget-03 in the hand-back). CR-2 … CR-10 are corrections for
sdd-planner and sdd-test-designer; CR-8 also needs P-01's reading of C002-REQ-623 (Q-regression-01).
The spike-first ordering, the critical-path arithmetic, the requirement and NFR coverage and the
ADR set are sound.
