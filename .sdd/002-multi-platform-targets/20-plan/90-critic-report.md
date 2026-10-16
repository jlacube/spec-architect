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
unless they start with `evals/`, `tests/`, `scripts/` or `.sdd/`.

Tool state on 2026-10-16: `sdd lint 002 --json` reports exactly the 9 LINT-DELTA-001 errors waived
under C002-DEC-008; `sdd trace 002` reports TR-01 … TR-11 at 100 % and a cycle-free task DAG. Those
9 findings and the waiver of DOD-G-01's 9-of-10 clause for CHG-002 are accepted waivers, not findings.

## Summary
| blocker | major | minor |
|---|---|---|
| 1 | 11 | 9 |

Round 1 raised CR-1 … CR-16 (1 blocker, 9 major, 6 minor); re-review 1 resolved all of them and
raised CR-17 … CR-21 (2 major, 3 minor). Open after re-review 1: 0 blocker, 2 major (CR-17, CR-18),
3 minor (CR-19, CR-20, CR-21).

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
- **Status:** resolved — re-review 1: P-01 answered Q-evalbudget-03; estimate, stop rule, reserve, top-up and probe limit in place (evidence in "Re-review 1"); remaining gaps raised as CR-18 and CR-20

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1"); the placement of `opencode-host.test.ts` before the `npm test` exclusion is raised as CR-17

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1"); an overstated decoupling sentence is item 3 of CR-21

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
- **Status:** resolved — re-review 1: C002-T-053 and commit 9565f2f (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1"); the wrong task ID in the new precondition is item 1 of CR-21

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
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

### CR-16 — C002-T-025's writer step keeps an old package on error, against C002-INV-02
- **Severity:** minor
- **Refs:** C002-T-025, C002-T-034, C002-INV-02, ERR-GEN-010, C002-TS-104
- **Evidence:**
  - "3. Write to `dist/.staging-<target>` and rename over `dist/<target>` only when no diagnostic exists." — `20-plan/50-tasks/T-025-generator-skeleton.md:47`
  - "`C002-INV-02` After a generation run, the output folder of each selected target holds exactly the files of that run, or does not exist when the run found an error." — `10-spec/40-domain/domain-model.md:67`
  - "2. A generator failure leaves no `dist/opencode` and no `dist/copilot`, and no tarball is packed." — `20-plan/50-tasks/T-034-packaging-runs-generator.md:42`
- **Why it matters:** Read literally, step 3 keeps the previous `dist/<target>` when a diagnostic exists, and a write error on the second rename keeps the first target's new package. C002-INV-02, ERR-GEN-010 ("no target package was kept") and C002-T-034 require that neither folder exists after a failed run.
- **Suggested fix:** Reword step 3: stage every selected target, then replace the old folders; on any diagnostic or write error remove every selected `dist/<target>`. Cover both cases in `generator-frame.test.ts`.
- **Owner:** sdd-planner
- **Status:** resolved — re-review 1 (evidence in "Re-review 1")

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

Round 1 (superseded by the verdict of "Re-review 1"):

**needs-clarification.** The plan is not approvable at G3 as it stands. CR-1 is a blocker that only
P-01 can resolve: the budget decision of Q-evalbudget-01 rests on an estimate that the CHG-001
results contradict (question Q-evalbudget-03 in the hand-back). CR-2 … CR-10 are corrections for
sdd-planner and sdd-test-designer; CR-8 also needs P-01's reading of C002-REQ-623 (Q-regression-01).
The spike-first ordering, the critical-path arithmetic, the requirement and NFR coverage and the
ADR set are sound.

## Re-review 1

Date 2026-10-16. Scope: the plan changes of `git diff 1a2529f HEAD -- .sdd/002-multi-platform-targets/20-plan`
(commits 3bbc023, 3bbb7b7, f0afe12, f5d2cd4), commit 9565f2f (`tests/integration/cli/frontend.test.ts`),
`questions-log.md` round 4 (Q-evalbudget-03, Q-regression-01) and round 3 (Q-release-01). The
revision D-002 of `10-spec/70-dod.md` (DOD-G-01 note now points at test plan §4.1) is read as context
only; its re-approval at the same round as G3 is not a finding.

Re-reviewed set: `10-strategy.md` §2, §3, §3a, §4; `30-impact/regression-set.md` §1, §3, §4 (reading
of C002-REQ-623), §4.2, §4.5, §5; `40-work-breakdown.md`; C002-T-001, 002, 003, 005, 006, 008, 010,
011, 024, 025, 026, 027, 029, 030, 031, 034, 035, 037, 038, 040, 042, 044, 045, 047, 048, 049, 050,
051, 052 and the new C002-T-053 … C002-T-057; `60-test-plan.md` §1–§8.1; `70-risks.md` C002-RISK-004,
009, 012, 013, 014, 015, 016 and the new C002-RISK-026 … C002-RISK-029; `75-rollout.md` §1, §4, §5;
`78-observability.md`; `handoff.md`; the C002-M-01 … C002-M-07 rows; C002-RB-002, C002-RB-003.

Tool state: `sdd lint 002 --json` reports exactly the 9 waived LINT-DELTA-001 errors; `sdd trace 002`
reports TR-01 … TR-11 at 100 % (TR-07 57/57 tasks, TR-08 206/206, TR-11 acyclic).

Report note: commit 3bbb7b7 (planner) changed the CR-16 quote of C002-INV-02 in this report from bold
to backticks. The words are unchanged and the backticks keep lint from reading a second definition
of C002-INV-02, so the form stays; edits to this report belong to the critic only.

### Status of CR-1 … CR-16

| CR | Result | Evidence |
|---|---|---|
| CR-1 | resolved | "$40 with M-07 reserve (Recommended)" — `20-plan/questions-log.md:58`; "- **Stop rule, checked before every paid session on the prepaid key** by the runner," — `20-plan/60-test-plan.md:99`; "| **Total** | | **108** (112 in the branch) | **31.40 USD** (32.80 USD in the branch)" — `20-plan/60-test-plan.md:151`; rerun room and reserve order — `20-plan/60-test-plan.md:155-170`; "1. **P-01 step — top-up.** P-01 tops up the prepaid API key by at least about 35.23 USD" — `20-plan/50-tasks/T-001-spike-s07-opencode.md:44`; "**Probe spend limit:**" — `20-plan/50-tasks/T-001-spike-s07-opencode.md:49`; "- Before the paid runs of step 5: P-01's top-up of C002-T-001 step 1 is done" — `20-plan/50-tasks/T-010-bash-guard-serena-confinement.md:43`. Remaining gaps: CR-18, CR-20 |
| CR-2 | resolved | "then one zip per generated target with the existing `zipDir` helper" — `20-plan/50-tasks/T-034-packaging-runs-generator.md:33`; "| add | `tests/integration/build/target-zips.test.ts` |" — `:35`; "4. Compare the regenerated package with the target zip that P-01 will release" — `20-plan/50-tasks/T-047-release-check.md:47`; "3. **P-01 step:** release `dist/architect-opencode-<version>.zip` through the channel of" — `20-plan/50-tasks/T-052-publish-and-release.md:50`; "**Retention of released zips.**" — `20-plan/75-rollout.md:27`; "A **first release can only be withdrawn**" — `20-plan/75-rollout.md:53` |
| CR-3 | resolved | "Every paid session belongs to one task step." — `20-plan/10-strategy.md:71` with one row per group at `:78-89`; C002-M-05 exit "the 10 E-CC sessions pass" — `:65`; C002-M-06 exit "the carried OpenCode eval rows pass on E-OCE (C002-T-056)" — `:66`; "| add | `evals/targets/doctor/TS-537.eval.mjs` |" — `20-plan/50-tasks/T-010-bash-guard-serena-confinement.md:37`; "the 3 cases of regression-set §5 row 1" — `:59-60`, matching `20-plan/60-test-plan.md:139` |
| CR-4 | resolved | "(2) C002-T-042 still delivers the session driver `evals/harness/opencode/driver.mjs` against the real provider" — `20-plan/10-strategy.md:107`; "| S-07 `question_answerable_by_script: false` |" — `:108`; the `copilot_cli_loads_package: false` row names the moved, replayed and not-applicable rows — `:105`; "1. Build the session driver `evals/harness/opencode/driver.mjs` in **both** branches" — `20-plan/50-tasks/T-042-opencode-driver-replay-adapter.md:45`; "### 8.1 Cases re-levelled in the S-07 infeasible-driver branch" — `20-plan/60-test-plan.md:454`; C002-RISK-029 — `20-plan/70-risks.md:41` |
| CR-5 | resolved | C002-TC-125 "| E-SER | C002-T-029 |" — `20-plan/60-test-plan.md:268`; C002-TC-126 and C002-TC-640 owned by C002-T-035 — `:269`, `:277`; C002-TC-637 owned by C002-T-047 — `:438`; `verified_by` of `20-plan/50-tasks/T-035-target-structure-checks.md:12` and `20-plan/50-tasks/T-047-release-check.md:12` now list C002-TS-126, C002-TS-640 and C002-TS-637 |
| CR-6 | resolved | "| add | `tests/integration/contracts/claude-behaviour.test.ts` |" — `20-plan/50-tasks/T-048-claude-regression-run.md:36`; "| add | `tests/integration/cli/guard-message.test.ts` |" — `20-plan/50-tasks/T-008-bash-guard-bare-sdd-node-version.md:34`; "| add | `tests/replay/scenarios/suite.test.ts` |" — `20-plan/50-tasks/T-040-replay-suite-framework.md:39`; `opencode-host.test.ts` — `T-026…:36`, `T-029…:37`, `T-030…:37`; `serena-launch.test.ts` — `20-plan/50-tasks/T-029-opencode-emitter.md:38`; gate cases — `20-plan/50-tasks/T-044-opencode-eval-runner.md:39`; generator cases — `T-026…:35`, `20-plan/50-tasks/T-027-translator-body-constructs.md:35`; fx-gate builder — `20-plan/50-tasks/T-037-conductor-question-variants.md:37`. New issue from the placement: CR-17 |
| CR-7 | resolved | "depends_on: [C002-T-022, C002-T-035, C002-T-037, C002-T-038, C002-T-042, C002-T-044, C002-T-045, C002-T-047]" — `20-plan/50-tasks/T-048-claude-regression-run.md:9`; "its commit is the release-candidate commit that C002-T-049 and C002-T-054 package" — `:29-30`; C002-T-049 precondition "The release-candidate commit is the commit recorded by C002-T-048." — `20-plan/50-tasks/T-049-release-evidence-runs.md:41` |
| CR-8 | resolved | "**Reading of C002-REQ-623 (Q-regression-01, `questions-log.md` round 4).**" — `20-plan/30-impact/regression-set.md:74`; the addition and changed-expectation classes at `:78-91`; C002-T-048 step 2 classifies by the same reading — `20-plan/50-tasks/T-048-claude-regression-run.md:53-62`; P-01's answer "No, additions only (Recommended)" — `20-plan/questions-log.md:65` |
| CR-9 | resolved | "depends_on: [C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-049, C002-T-051]" — `20-plan/50-tasks/T-052-publish-and-release.md:9`; Copilot evidence, clean-profile and release in C002-T-054, C002-T-057, C002-T-055; "the OpenCode release ends one unit earlier, at 32, and no longer waits for any Copilot release task" — `20-plan/40-work-breakdown.md:219-220`; the remaining shared-tooling coupling is stated at `:244-248`. Residual wording: CR-21 item 3 |
| CR-10 | resolved | C002-T-053 "reads the `waivers` list of each linted change's `change.md` frontmatter" — `20-plan/50-tasks/T-053-lint-loop-honours-waivers.md:37`; commit 9565f2f: "const open = findings.filter((f) => f.severity !== \"info\" && !waived.has(f.code) && !(f.ids ?? []).some((id) => waived.has(id)));" — `tests/integration/cli/frontend.test.ts:166`; C002-RISK-004 mitigation updated — `20-plan/70-risks.md:23`; strategy row — `20-plan/10-strategy.md:53` |
| CR-11 | resolved | "- an integration or structure case whose test file, code, fixture or record is written by a later task" — `20-plan/60-test-plan.md:203-204`; "A done-check of the form \"all listed scenarios pass\" reads as \"all listed scenarios that are not carried pass\"." — `:209-210`; carried lists added to C002-T-001, 002, 003, 005, 011, 024, 026, 027, 031 |
| CR-12 | resolved | §6 now says "they run under `npm run replay -- opencode-host` from C002-T-042 on" — `20-plan/60-test-plan.md:211-212`; "The spend rule for CHG-002 is that of `60-test-plan.md` §4.1" — `20-plan/30-impact/regression-set.md:27-28`; "G2 was re-approved after defect D-001 (eval tier, closed)" — `20-plan/handoff.md:15-16`; "| Pool | Limit | Sessions | Estimate | Room (limit − estimate) |" — `20-plan/60-test-plan.md:155` |
| CR-13 | resolved | C002-RISK-027 (`src/cli/run.ts`, rank 12) — `20-plan/70-risks.md:29`; C002-RISK-028 (`resolveTemplate`, rank 20) — `:30`; "### 4.5 Template resolution (C002-T-012, hotspot rank 20)" — `20-plan/30-impact/regression-set.md:143` |
| CR-14 | resolved | "- **P-01 precondition: the GitHub Copilot subscription.**" — `20-plan/50-tasks/T-002-spike-s08-copilot-vscode.md:39`; C002-RISK-026 — `20-plan/70-risks.md:49`; E-CPC "billed to the Copilot subscription that P-01 names in C002-T-002" — `20-plan/60-test-plan.md:67`. Wrong task ID in the precondition: CR-21 item 1 |
| CR-15 | resolved | "P-01 steps are done by P-01: C002-T-003, C002-T-050, C002-T-051, C002-T-052, C002-T-055 and C002-T-057" — `20-plan/handoff.md:58-59`; "## Reference machine" with the installs and `nvm use 20` / `nvm use 22` — `20-plan/handoff.md:80-96` |
| CR-16 | resolved | "3. Stage every selected target in `dist/.staging-<target>` first." and "remove every selected `dist/<target>` and every staging folder" — `20-plan/50-tasks/T-025-generator-skeleton.md:47-50`; the write-error case in `generator-frame.test.ts` — `:37` |

### Checked without finding

- **Budget arithmetic** (test plan §4.2, §4.3): 10 + 5 + 3 + 7 + 1 + 47 + 5 + 30 = 108 sessions and
  5.00 + 1.25 + 1.05 + 1.75 + 0.15 + 14.45 + 1.25 + 6.50 = 31.40 USD (32.80 USD with the 4 branch
  sessions); upper bounds 70.20 and 72.80 USD at 0.65 USD per session; general pool 77 sessions,
  25.05 USD, room 4.95 USD; reserve 35 sessions, 7.75 USD, room 2.25 USD; weighted rate 31.40 / 108 =
  0.29 USD. The C002-T-056 sub-counts (1 + 1 + 7 + 19 + 19 = 47) and the M-05 counts (3 + 7) match
  C002-M-05's "10 E-CC sessions" and the task steps.
- **Rates against the CHG-001 files:** interview and gate family 21 sessions, 0.147–0.506 USD, mean
  0.357; doctor family 27 sessions, 0.051–0.514 USD, mean 0.186; injection 22 sessions,
  0.0025–0.519 USD, mean 0.193; routing 8 sessions, mean 0.14 (the label "`t031-TS-206` …
  `t031-TS-212`" also covers `t031-TS-222`; immaterial). The raised doctor and injection rates
  (0.25 USD) and H ≥ 0.65 USD follow from the 0.62 USD session.
- **Budget figures everywhere:** 40 USD budget, 30 USD general pool, 10 USD reserve, top-up of at
  least about 35.23 USD from about 4.77 USD agree in test plan §4.1 and §4.3, strategy §2 and §3a,
  C002-T-001, C002-T-010, C002-T-048, C002-T-049, C002-T-056, C002-RISK-015, `78-observability.md`,
  `handoff.md` and `questions-log.md:58`; no plan file still names 25 USD as the budget, and the DoD
  points at test plan §4.1.
- **Critical path recomputed** from `depends_on`: 115 weight units (16 S, 24 M, 17 L); 33 to
  C002-T-055 and 32 to C002-T-052 as stated; C002-T-056 finishes at 28 and C002-T-048 at 29; 31 under
  the Copilot defer branch; the slack figures of `40-work-breakdown.md:252-254` are correct. The
  hand-off order is topological and puts C002-T-053 first.
- **Commit 9565f2f** does what C002-T-053 steps 3 and 4 specify: findings whose `code` or `ids` match a
  waiver `item` are excluded, exit 1 is accepted only when no unwaived non-info finding remains, and
  `sdd lint` itself is unchanged. The filter is per waived item, so a future finding of another code
  that names a waived requirement is also excluded from this test; T-053 step 3 states that rule and
  `sdd lint` still reports such a finding, so it is not a finding. The edit was made before G3 by
  design (`10-strategy.md:53`, `handoff.md:61-62`).
- **Spike branches** (strategy §4, test plan §8.1, C002-RISK-012, C002-RISK-029, C002-T-042,
  C002-T-056): every moved case has a target task, level and condition; C002-TC-222 and C002-TC-223
  keep the `post_write_feedback_channel` condition (`60-test-plan.md:468-469`).

### CR-17 — The OpenCode-host replay test file lands in `npm test` before C002-T-040 excludes `tests/replay/`
- **Severity:** major
- **Refs:** C002-T-026, C002-T-029, C002-T-030, C002-T-040, C002-T-042, C002-TC-133, C002-TC-207, C002-TC-226, C002-RISK-005, `20-plan/30-impact/regression-set.md` §4.3, `20-plan/handoff.md` (ordered task list)
- **Evidence:**
  - "| add | `tests/replay/scenarios/opencode-host.test.ts` | the file of the OpenCode-host replay scenarios, with the expectation of C002-TC-133 (adopter MCP tool `fx-fs` not available to `sdd-spec-writer`); C002-T-029 and C002-T-030 add their scenarios to it; it runs under `npm run replay -- opencode-host` from C002-T-042 on |" — `20-plan/50-tasks/T-026-translator-frontmatter.md:36`
  - "depends_on: [C002-T-025]" — `20-plan/50-tasks/T-026-translator-frontmatter.md:9`
  - "| modify | `scripts/test.mjs` | `findTests` leaves out `tests/replay/` |" — `20-plan/50-tasks/T-040-replay-suite-framework.md:36`
  - "if (e.isDirectory()) return e.name === \"fixtures\" ? [] : findTests(p);" — `scripts/test.mjs:15` (every other `*.test.ts` under `tests/` is built and run by `npm test`)
  - "| 26 | C002-T-026 |" and "| 40 | C002-T-040 |" — `20-plan/handoff.md:144` and `:158`
  - "Run `npm run check` before reporting any task done." — `20-plan/10-strategy.md:120-121`
- **Why it matters:** No path in the task graph puts C002-T-040 before C002-T-026, C002-T-029 or C002-T-030 (C002-T-026 needs only C002-T-025; C002-T-040 needs C002-T-006 and C002-T-007), and the hand-off's ordered list puts C002-T-026 fourteen places before C002-T-040. Until C002-T-040's edit, `npm test` bundles and runs `opencode-host.test.ts`, which needs the replay framework of C002-T-040 and the driver of C002-T-042 and opens a loopback socket that `tests/no-network.mjs` fails. `npm test`, and with it `npm run check`, is then red from C002-T-026 onward, so the tasks between C002-T-026 and C002-T-040 cannot be reported done under the plan's own rule, unless the implementer edits `scripts/test.mjs` (hotspot rank 4, C002-RISK-005) outside any task.
- **Suggested fix:** Either add C002-T-040 to the `depends_on` of C002-T-026 and reorder the hand-off list (C002-T-040 finishes at 6 and C002-T-025 at 8, so the critical path does not move), or move the `scripts/test.mjs` exclusion of `tests/replay/` into C002-T-026 and keep C002-T-040's step "Keep `npm test` free of the replay tests" as a check. Update regression-set §4.3 and the test plan §5 row that names C002-T-040 for the exclusion.
- **Owner:** sdd-planner
- **Status:** open

### CR-18 — P-01's OpenCode run to G1 in C002-T-051 is a paid session outside §3a, §4.2 and the ledger
- **Severity:** major
- **Refs:** C002-T-051, C002-TC-902, C002-DOD-019, C002-DOD-021, C002-RISK-015, C002-RISK-026, C002-T-002, C002-T-050, C002-T-057, Q-evalbudget-03, `20-plan/10-strategy.md` §3a, `20-plan/60-test-plan.md` §4.1–§4.3
- **Evidence:**
  - "- Paid sessions run only at the task steps that `10-strategy.md` §3a names, never elsewhere." — `20-plan/60-test-plan.md:77`
  - "Every paid session belongs to one task step." — `20-plan/10-strategy.md:71`
  - "3. **P-01 step:** continue the toy change to G1 and link the transcript." — `20-plan/50-tasks/T-051-clean-profile-runs.md:47`
  - "| E-OCE | OpenCode at its tested version with the Claude model tiers of C002-REQ-105 through the provider of the S-07 record; billed to the prepaid API key" — `20-plan/60-test-plan.md:66`
  - "| C002-M-07 reserve: C002-T-048 step 4, C002-T-049 step 3 | 10.00 USD | 35 | 7.75 USD | 2.25 USD |" — `20-plan/60-test-plan.md:158`
  - "P-01's GitHub Copilot subscription cannot carry the about 55 Copilot sessions (S-08 probes, Copilot CLI runs of C002-T-045 and C002-T-054)" — `20-plan/70-risks.md:49`
- **Why it matters:** C002-T-051 drives the OpenCode conductor through an interview and gate G1 with the Claude tiers of C002-REQ-105: several agent sessions of the interview and gate family, which the CHG-001 files put at 0.36 USD per session (test plan §4.2). Neither §3a nor §4.2 lists the run, C002-T-051 has no ledger target and no stop-rule precondition, and no text names the account that pays. So the run either bypasses the stop rule that the plan now applies to every paid session on the prepaid key, or the rule stops it: C002-T-051 runs at the end of the change, when the general pool keeps 4.95 USD for all reruns and the reserve is closed to everything except C002-T-048 step 4 and C002-T-049 step 3. The run is release-blocking OpenCode evidence (C002-DOD-019, C002-DOD-021). The Copilot side has the same gap on a smaller scale: the VS Code runs of C002-T-050 (repeated after every failed step, its step 3) and C002-T-057 use the Copilot allowance but are not among the about 55 sessions of C002-RISK-026 and C002-T-002.
- **Suggested fix:** Add a §3a row and a §4.2 row for C002-T-051 step 3 (session estimate, account, pool). As C002-M-07 release evidence it fits the reserve of Q-evalbudget-03. Give C002-T-051 the ledger target and the stop-rule precondition that C002-T-049 has, then recompute §4.3. Add the VS Code checklist and clean-profile runs to the Copilot session count of C002-T-002 and C002-RISK-026. If P-01 bills the run to another account, state that account (question Q-evalbudget-04 of this hand-back).
- **Owner:** sdd-test-designer (§4.2, §4.3); sdd-planner (§3a, C002-T-051, C002-T-002, C002-RISK-026); P-01 (account for the run)
- **Status:** open

### CR-19 — The `run.mjs` options used by the plan's eval commands have no owning task, and `--host claude` differs from C002-IF-010 §1
- **Severity:** minor
- **Refs:** C002-IF-010, C002-REQ-608, C002-T-044, C002-T-037, C002-T-010, C002-T-045, C002-T-048, `20-plan/60-test-plan.md` §5, §8, §8.1
- **Evidence:**
  - "evals `node evals/harness/run.mjs --host <host> --tier dev --filter <case path>`" — `20-plan/60-test-plan.md:238`
  - "- `node evals/harness/run.mjs --tier dev --filter evals/targets/question-tool` (Claude Code rows)" — `20-plan/50-tasks/T-037-conductor-question-variants.md:61`
  - "const files = argv.filter((a, i) => !a.startsWith(\"--\") && !argv[i - 1]?.startsWith(\"--\"));" — `evals/harness/run.mjs:88` (usage: "node evals/harness/run.mjs <scenario.eval.mjs>… [--tier dev|milestone|release] [--runs N]" — `evals/harness/run.mjs:2`)
  - "`npm run eval -- --host claude-code|opencode|copilot-cli` (default `claude-code`, the existing" — `10-spec/50-interfaces/eval-runner.md:18`
  - "| modify | `evals/harness/session.mjs` | host selection without changing the `runSession` signature (three importers) |" — `20-plan/50-tasks/T-044-opencode-eval-runner.md:36` (no Targets row for `evals/harness/run.mjs`)
- **Why it matters:** Today `run.mjs` takes case files as positional arguments and drops the word that follows any `--` flag. C002-T-037's C002-M-05 command `--filter evals/targets/question-tool` therefore selects no case, prints a total of 0 USD and exits 0. That is a vacuous pass of a step budgeted at 1.05 USD; only the done-check, which asks for passing rows in the ledger, would catch it. No task adds `--host` or `--filter` to `run.mjs`: C002-T-044's "Select the host by option or environment" names only `session.mjs`. The plan also writes `--host claude` (test plan §5, C002-T-010, C002-T-048) where C002-IF-010 §1 says `claude-code`.
- **Suggested fix:** Add `evals/harness/run.mjs` (and the `eval` script, if the spec's `npm run eval -- --host` form is the entry point) to C002-T-044's Targets. Give it `--host claude-code|opencode|copilot-cli` as C002-IF-010 §1 defines, and a `--filter <path>` that selects the case files under a folder and fails when nothing matches. Until C002-T-044 exists, write the commands of C002-T-010, C002-T-037, C002-T-038 and C002-T-048 with positional case files and without `--host`. Elsewhere, replace `--host claude` with `--host claude-code`.
- **Owner:** sdd-planner; sdd-test-designer (test plan commands)
- **Status:** open

### CR-20 — The stop rule mixes the two pools, and the reserve does not cover the re-run that C002-T-049 prescribes after a fix
- **Severity:** minor
- **Refs:** C002-T-048, C002-T-049, C002-T-056, C002-RISK-015, `20-plan/60-test-plan.md` §4.1, §4.3
- **Evidence:**
  - "1. T = the ledger total; H = the highest session cost seen so far, at least 0.65 USD" — `20-plan/60-test-plan.md:101`
  - "2. L = 30 USD for a session of the general pool; 40 USD for a session of the reserve." — `20-plan/60-test-plan.md:105`
  - "depends_on: [C002-T-022, C002-T-035, C002-T-037, C002-T-038, C002-T-042, C002-T-044, C002-T-045, C002-T-047]" — `20-plan/50-tasks/T-048-claude-regression-run.md:9` (no C002-T-056), against "depends_on: [C002-T-038, C002-T-044]" — `20-plan/50-tasks/T-056-opencode-carried-eval-runs.md:9`
  - "A fix moves the release-candidate commit: re-run C002-T-048 step 5 and this task from step 1." — `20-plan/50-tasks/T-049-release-evidence-runs.md:55`
  - "| C002-M-07 reserve: C002-T-048 step 4, C002-T-049 step 3 | 10.00 USD | 35 | 7.75 USD | 2.25 USD |" — `20-plan/60-test-plan.md:158`
- **Why it matters:** (1) T includes the reserve spend, and the task graph lets C002-T-048 step 4 (1.25 USD estimate) run while C002-T-056 is still running. The general pool then stops at about 28.75 USD of general spend instead of the 30 USD of §4.3, and its rerun room drops from 4.95 to about 3.70 USD. The rule never overspends, but the pool sizes the plan reports do not hold. (2) "This task from step 1" includes the 30 paid sessions of step 3 (6.50 USD estimate) against 2.25 USD of reserve room. The first product fix found in the OpenCode release evidence therefore runs into the stop rule, and the plan does not say which paid rows a fix actually requires to re-run.
- **Suggested fix:** Define T per pool: a general-pool session compares the general-pool total with 30 USD, and a reserve session compares the ledger total with 40 USD. Or make C002-T-048 step 4 wait for C002-T-056. In C002-T-049 step 4, name the rows that are re-run after a fix (for example, the replay and the release check always, and the paid rows only when their case exercises a changed file), and state that the stop rule applies, so P-01 decides before the reserve is exceeded.
- **Owner:** sdd-test-designer (§4.1); sdd-planner (C002-T-048, C002-T-049)
- **Status:** open

### CR-21 — Six statements that the fixes left inconsistent
- **Severity:** minor
- **Refs:** C002-T-002, C002-T-045, C002-T-049, C002-T-050, C002-T-054, C002-T-038, C002-T-048, C002-TC-537, C002-RISK-014, `20-plan/10-strategy.md` §2 and §4, `20-plan/75-rollout.md` §1, `20-plan/60-test-plan.md` §5, `20-plan/30-impact/regression-set.md` §1
- **Evidence:**
  1. "request allowance covers about 10 S-08 probe sessions here plus about 45 Copilot CLI sessions in C002-T-045 and C002-T-049" — `20-plan/50-tasks/T-002-spike-s08-copilot-vscode.md:41-42`, while the Copilot CLI release rows belong to C002-T-054: "| C002-M-07 | C002-T-054 step 3 | 0 | 0 | 0 | about 40: C002-TC-615 |" — `20-plan/60-test-plan.md:150`
  2. "P-01 runs them in C002-T-050, and C002-T-054 takes the Copilot injection evidence from that record" — `20-plan/10-strategy.md:105`, against "whose evidence is the checklist record of C002-T-050, which the release check reads directly (this task does not wait for it)" — `20-plan/50-tasks/T-054-copilot-release-evidence.md:54-55` and "depends_on: [C002-T-046, C002-T-054]" — `20-plan/50-tasks/T-050-vscode-checklist-run.md:9`
  3. "so a slipping Copilot task does not hold back the OpenCode release." — `20-plan/75-rollout.md:25`, against "C002-T-048 waits for C002-T-045 (shared `evals/harness/session.mjs`, critic CR-7), C002-T-047 for the checklist template of C002-T-046, and C002-T-039 and C002-T-041 for C002-T-033." — `20-plan/40-work-breakdown.md:245-246`
  4. "| C002-TC-537 | C002-T-010, C002-T-038, C002-T-048 | once at C002-M-02, C002-M-05 and C002-M-07" — `20-plan/60-test-plan.md:186`, while the C002-M-05 row runs only "`evals/cap11/doctor-no-ripwire.eval.mjs` (1)" of that group and no C002-TC-537 — `20-plan/60-test-plan.md:143`
  5. "Evals are paid, at most 0.50 USD per session." — `20-plan/30-impact/regression-set.md:27`, against "the 0.50 USD spend cap of C002-NFR-105 is checked after a turn and can be overrun" — `20-plan/60-test-plan.md:102-103`
  6. "| Paid evals only at named task steps, each case once |" — `20-plan/10-strategy.md:54`, while C002-TC-537 and the three regression-set §5 row-1 cases run at C002-T-010 step 5 and again at C002-T-048 step 4 (`20-plan/60-test-plan.md:139`, `:148`)
- **Why it matters:** Each statement contradicts another artifact or the task graph. Item 1 has P-01 check the Copilot allowance against the OpenCode task. Item 2 reads as C002-T-054 waiting for the checklist record, which with C002-T-050's dependency would be a cycle. Item 3 overstates the decoupling that `40-work-breakdown.md` itself qualifies: C002-T-033, C002-T-045 and C002-T-046 are Copilot tasks upstream of the OpenCode release, and they are the ones that grow under the hooks fallback (C002-RISK-014). Items 4 to 6 misstate the cadence of the regression evals and the cap.
- **Suggested fix:** (1) Name C002-T-045 and C002-T-054. (2) Write "the release check reads the Copilot injection evidence from that record". (3) Write "no Copilot evidence or release task holds back the OpenCode release; the shared tooling of `40-work-breakdown.md` still does". (4) State that C002-M-05 runs only the doctor eval of row 1. (5) Write "capped at 0.50 USD per session; the cap can be overrun (test plan §4.1)". (6) Write "each case once per owning step".
- **Owner:** sdd-planner (items 1–3 and 6); sdd-test-designer (item 4); sdd-cartographer (item 5)
- **Status:** open

### Rubric (re-review 1, applied to the re-reviewed set)
| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: TR-06 121/121; the new C002-T-053 … C002-T-057 link ACs and TCs (TR-07 57/57) |
| plan | P2 Each task has targets, verification and done-checks | CR-17, CR-18, CR-19 |
| plan | P3 Dependency graph acyclic, milestones coherent | CR-17 (missing edge); TR-11 acyclic and the critical path recomputed: pass |
| plan | P4 Every scenario maps to a planned test | pass: TR-08 206/206; ownership moves of CR-5 consistent between `verified_by` and the Task column; CR-19 for the eval commands |
| plan | P5 Risks cover the hotspots touched | pass: C002-RISK-027, C002-RISK-028 cover ranks 12 and 20; C002-RISK-026, C002-RISK-029 cover the new prerequisites and the S-07 question-tool outcome |
| plan | P6 Rollout and rollback stated | pass: zips, retention and first-release withdrawal in rollout §1 and C002-RB-002/003; CR-21 item 3 for wording |
| plan | P7 ADRs for every remaining technical decision | pass: unchanged; the superseding ADR of the S-07 fallback stays planned (C002-T-042 step 3) |
| brief focus | Each round-1 finding confirmed with evidence | pass: CR-1 … CR-16 resolved (table above) |
| brief focus | Tasks vs. strategy vs. test plan vs. hand-off without contradiction | CR-17, CR-21 |
| brief focus | Budget figures consistent everywhere | pass for the figures (checked above); CR-18, CR-20 for coverage and pool accounting |
| ideation, stories, requirements, NFRs, acceptance, domain, DoD and index | all items | n/a: approved phases; the D-002 DoD revision is reviewed at its own re-approval |

### Verdict (re-review 1)

**needs-revision.** No blocker remains. CR-1 … CR-16 are resolved, P-01's answers of rounds 3 and 4
are applied, and the budget arithmetic, rates and critical path check out. Two major findings remain
and need a short planner and test-designer pass before G3: CR-17, a missing dependency that turns
`npm run check` red from C002-T-026 onward, and CR-18, the OpenCode G1 run of C002-T-051, which is
outside the budget and the ledger. CR-19 … CR-21 are minor and can be fixed in the same pass. P-01's
choice of account for the C002-T-051 run (Q-evalbudget-04) does not block the fix: the plan can take
the recommended option as an assumption. A confirmation pass on CR-17 … CR-21 only is enough after
the fixes.
