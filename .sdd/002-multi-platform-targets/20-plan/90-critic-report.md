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
| 1 | 13 | 13 |

Round 1 raised CR-1 … CR-16 (1 blocker, 9 major, 6 minor); re-review 1 resolved all of them and
raised CR-17 … CR-21 (2 major, 3 minor); re-review 2 resolved CR-17 … CR-21 and raised CR-22 and
CR-23 (2 minor). Open after re-review 2: 0 blocker, 0 major, 2 minor (CR-22, CR-23); both fixed by the conductor afterwards, open: none.
The D-003 review (2026-10-17) raised CR-24 … CR-26 (1 major, 2 minor).
The D-003 fix-round confirmation (2026-10-18, at the end of this report) resolved CR-24 … CR-26 and
raised CR-27 (1 major). Open after it: 0 blocker, 1 major (CR-27), 0 minor.

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

Round 1 (superseded by the verdicts of "Re-review 1" and "Re-review 2"):

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
- **Status:** resolved — re-review 2 (evidence in "Re-review 2")

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
- **Status:** resolved — re-review 2 (evidence in "Re-review 2"); the in-run check of the by-hand run is raised as CR-22

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
- **Status:** resolved — re-review 2 (evidence in "Re-review 2"); the smoke commands' `--filter routing` is raised as CR-23

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
- **Status:** resolved — re-review 2 (evidence in "Re-review 2")

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
- **Status:** resolved — re-review 2 (evidence in "Re-review 2")

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

Superseded by the verdict of "Re-review 2".

**needs-revision.** No blocker remains. CR-1 … CR-16 are resolved, P-01's answers of rounds 3 and 4
are applied, and the budget arithmetic, rates and critical path check out. Two major findings remain
and need a short planner and test-designer pass before G3: CR-17, a missing dependency that turns
`npm run check` red from C002-T-026 onward, and CR-18, the OpenCode G1 run of C002-T-051, which is
outside the budget and the ledger. CR-19 … CR-21 are minor and can be fixed in the same pass. P-01's
choice of account for the C002-T-051 run (Q-evalbudget-04) does not block the fix: the plan can take
the recommended option as an assumption. A confirmation pass on CR-17 … CR-21 only is enough after
the fixes.

## Re-review 2

Date 2026-10-16. Confirmation pass before G3. Scope (brief): CR-17 … CR-21 only, checked against
`git diff 21bb57d d96517f -- .sdd/002-multi-platform-targets/20-plan` (commits 9d6e0dd and d96517f,
24 files) and `questions-log.md` round 5, whose answer is "- **Answer:** Key, M-07 reserve
(Recommended)" — `20-plan/questions-log.md:76` (Q-evalbudget-04, `:72`). The rest of the plan is not
re-reviewed. Accepted by design per the brief, so not findings: the reserve keeps only about 0.85 USD
for reruns, and when a pool's stop rule halts the runs, P-01 decides.

Re-reviewed set: C002-T-026 and C002-T-040 with `40-work-breakdown.md` (graph, critical-path note,
table row), the hand-off's ordered list, regression-set §4.3 and test plan §5 (CR-17); C002-T-051,
C002-T-048 step 4, C002-T-049 steps 3 and 4, C002-T-056, C002-T-001 (ledger target), C002-T-002,
C002-T-050, C002-T-057, C002-RISK-015, C002-RISK-026, strategy §2 and §3a, test plan §3 (E-CPC,
E-VSC) and §4.1–§4.3, the C002-NFR-105 row of `78-observability.md` and the hand-off's budget bullet
(CR-18, CR-20); C002-T-044, C002-T-010, C002-T-037, C002-T-038, C002-T-045, C002-T-048 verification,
the test plan's eval command lines (§1, §5, §8) and the TC rows that name `--host` (CR-19); the six
statements of CR-21 (C002-T-002, strategy §2 and §4, rollout §1, test plan §5, regression-set §1 and
§5).

Tool state: `sdd lint 002 --json` reports exactly the 9 waived LINT-DELTA-001 errors and nothing
else; `sdd trace 002` reports TR-01 … TR-11 at 100 % (TR-07 57/57, TR-08 206/206, TR-11 acyclic with
the new C002-T-040 → C002-T-026 edge).

### Status of CR-17 … CR-21

- **CR-17 — resolved.** "depends_on: [C002-T-025, C002-T-040]" — `20-plan/50-tasks/T-026-translator-frontmatter.md:9`;
  "- C002-T-040 done: `scripts/test.mjs` already leaves out `tests/replay/`, so the new" — `:41`;
  step 4 "so the file must not import it" — `:53`; "- `npm run check` (green: `tests/replay/` is outside
  `npm test`)" — `:59`; "C002_T_040 --> C002_T_026" — `20-plan/40-work-breakdown.md:121`, with the
  table row `:290` and the note `:253-255`; "| 26 | C002-T-040 |" and "| 27 | C002-T-026 |" —
  `20-plan/handoff.md:147-148`; "C002-T-040 makes the exclusion; C002-T-026, which adds the first other
  file under `tests/replay/`, depends on C002-T-040" — `20-plan/30-impact/regression-set.md:133`; test
  plan §5 — `20-plan/60-test-plan.md:211`. Recomputed: C002-T-053 ends at 1, C002-T-006 at 3,
  C002-T-007 at 2, C002-T-040 (L) at 6, before C002-T-025 at 8, so the critical path does not move.
  The other files added under `tests/replay/` before C002-T-042 come from C002-T-029 and C002-T-030
  (both after C002-T-026) and from C002-T-041 (after C002-T-040). The `tests/replay/adapter.ts` that
  step 4 relies on is a C002-T-040 target (`20-plan/50-tasks/T-040-replay-suite-framework.md:34`).
- **CR-18 — resolved.** §3a row "P-01's OpenCode toy change to G1 (C002-TC-902, C002-DOD-021)" with
  "prepaid key (Q-evalbudget-04)" and "C002-T-051 step 3 (P-01)" — `20-plan/10-strategy.md:89`; §4.2 row
  "C002-T-051 step 3 (P-01, by hand)" with "1.40 USD" and "2.60 USD" — `20-plan/60-test-plan.md:166`;
  §4.3 reserve "10.00 USD", "39", "9.15 USD", "0.85 USD" — `:177`; C002-T-051 `risk_refs: [C002-RISK-015]`
  — `20-plan/50-tasks/T-051-clean-profile-runs.md:14`, ledger target `:34`, stop-rule precondition
  "**Before step 3:** the reserve's stop rule of test plan §4.1 allows the run." — `:41`, step 3 `:53-58`,
  done-check `:68`. Copilot side: "request allowance covers about 76 sessions" —
  `20-plan/50-tasks/T-002-spike-s08-copilot-vscode.md:41`; C002-RISK-026 "the about 76 Copilot
  sessions" — `20-plan/70-risks.md:49`; preconditions of `20-plan/50-tasks/T-050-vscode-checklist-run.md:39-41`
  and `20-plan/50-tasks/T-057-copilot-clean-profile-run.md:38-39`; E-VSC "billed to the same Copilot
  subscription" — `20-plan/60-test-plan.md:68`; §4.2 rows `:168-169`. P-01's answer (reserve) is applied
  in §4.1 (`:86-88`), §3a, C002-T-051, C002-RISK-015 (`20-plan/70-risks.md:47`) and the hand-off
  (`20-plan/handoff.md:52-55`). Arithmetic: 108 + 4 = 112 sessions (116 in the branch); 31.40 + 1.40 =
  32.80 USD (34.20); 112 × 0.65 = 72.80 and 116 × 0.65 = 75.40 USD; reserve 35 + 4 = 39 sessions,
  7.75 + 1.40 = 9.15 USD, room 0.85 USD (about 3 reruns, one in thirteen); budget 116 sessions,
  34.20 USD, room 5.80 USD; weighted rate 32.80 / 112 = 0.29 USD; "7.75 USD + 2.60 USD = 10.35 USD" —
  `:184` is correct; Copilot 10 + 5 + 40 + 20 + 1 = 76. The in-run check of the by-hand run is a new
  issue: CR-22.
- **CR-19 — resolved.** C002-T-044 Targets: "options `--host claude-code\|opencode\|copilot-cli`
  (default `claude-code`, C002-IF-010 §1) and `--filter <path>`" — `20-plan/50-tasks/T-044-opencode-eval-runner.md:37`;
  step 2 "**Runner options** (critic CR-19)" with "the runner prints the reason and exits non-zero before
  any session" — `:53-60`; stub tests of the options `:39`; verification "exits non-zero without a
  session" `:75`; done-check `:82`. Commands before C002-T-044 are positional: C002-T-010
  `20-plan/50-tasks/T-010-bash-guard-serena-confinement.md:70-73`, C002-T-037
  `20-plan/50-tasks/T-037-conductor-question-variants.md:62-64` ("a total of 0 cases is a failure"),
  C002-T-038 `20-plan/50-tasks/T-038-doctor-host-rows.md:62-65`; C002-T-048 uses `--host claude-code`
  — `20-plan/50-tasks/T-048-claude-regression-run.md:75-76` and depends on C002-T-044 (`:9`); test plan
  §8 note — `20-plan/60-test-plan.md:265-269`. A search for `--host claude` not followed by `-code` in
  `20-plan/` finds only this report. The runner already has `--only`: "[--max-total-usd X] [--label
  NAME] [--only ID,ID…]" — `evals/harness/run.mjs:3`; `npm run eval` calls the file: "\"eval\": \"node
  evals/harness/run.mjs\"," — `package.json:17`. Residual in the two smoke commands: CR-23.
- **CR-20 — resolved.** "T = the ledger total **of that pool only**" — `20-plan/60-test-plan.md:104-105`;
  "L = 30 USD for a general-pool session; L = 10 USD for a reserve session." — `:110`; rule 5 "they never
  draw on the reserve." — `:119-121`; §4.3 "general-pool sessions at 30 USD of general spend, whatever
  the reserve has spent," — `:196`; C002-T-049 step 4 lists the unpaid re-runs ("always, unpaid") and
  the paid rows a fix can change ("paid, only the step 3 rows that the fix can change") and makes them
  "**general-pool** sessions" — `20-plan/50-tasks/T-049-release-evidence-runs.md:55-66`, ledger target
  `:35`, done-check `:76`; C002-T-048 step 4 "by the reserve's stop rule" and "with pool `reserve`" —
  `20-plan/50-tasks/T-048-claude-regression-run.md:67-68`; C002-T-056 "reserve spend does not count
  against it" — `20-plan/50-tasks/T-056-opencode-carried-eval-runs.md:43-44`, step 5 `:59-61`,
  verification `:66`; strategy §3a `20-plan/10-strategy.md:90` and `:95-98`. With per-pool totals,
  C002-T-048 step 4 running next to C002-T-056 no longer shrinks the general pool, and a re-run after a
  fix has a named pool and a defined stop.
- **CR-21 — resolved.** (1) "about 45 Copilot CLI sessions in C002-T-045 and C002-T-054" —
  `20-plan/50-tasks/T-002-spike-s08-copilot-vscode.md:41-42`; (2) "the release check reads the Copilot
  injection evidence from that record" — `20-plan/10-strategy.md:111`; (3) "so no Copilot evidence or
  release task holds back the OpenCode release; the shared tooling named in `40-work-breakdown.md`
  ("Critical path") still does." — `20-plan/75-rollout.md:25-26` (heading "## Critical path" —
  `20-plan/40-work-breakdown.md:217`); (4) "at C002-M-05 only `doctor-no-ripwire.eval.mjs` (C002-T-038
  step 4), not C002-TC-537" — `20-plan/60-test-plan.md:213`, matching
  `20-plan/30-impact/regression-set.md:165-167`; (5) "Evals are paid, capped at 0.50 USD per session;
  the cap is checked after a turn and can be overrun" — `20-plan/30-impact/regression-set.md:27`;
  (6) "Paid evals only at named task steps, each case once per owning step" — `20-plan/10-strategy.md:54`.

### CR-22 — The by-hand C002-T-051 run is checked against the reserve by a looser rule than every other reserve session
- **Severity:** minor
- **Refs:** C002-T-051, C002-T-048, C002-T-049, C002-RISK-015, C002-DOD-009, C002-DOD-021, Q-evalbudget-04, `20-plan/60-test-plan.md` §4.1 (rules 1, 2, 3, 6) and §4.3
- **Evidence:**
  - "6. **C002-T-051 step 3** is driven by hand, outside the harness caps, as one run of about 4 agent sessions: rule 3 is checked once before the run, with the run's §4.2 estimate (1.40 USD) added to T, and P-01 pauses the run for a decision when the reserve total plus the run's spend so far, read from the provider's usage view, reaches 10 USD. The run is one ledger entry." — `20-plan/60-test-plan.md:122-125`
  - "For a reserve session of C002-T-051 step 3, T also counts the §4.2 estimate of each of C002-T-048 step 4 and C002-T-049 step 3 that has not run yet, so the release evidence keeps its share." — `20-plan/60-test-plan.md:110-112`
  - "3. The session starts only if T + H ≤ L." and "A pool never spends the other pool's room, so the ledger total stays within 40 USD." — `20-plan/60-test-plan.md:113` and `:115-116`
  - "H = the highest session cost seen so far in either pool, at least 0.65 USD" — `20-plan/60-test-plan.md:105-106`; the ledger holds "one entry per paid session on the prepaid key" — `:98`
  - "P-01 reads the provider's usage view at each interview round and at the gate, and pauses for a decision when the reserve total plus the run's spend so far reaches 10 USD." — `20-plan/50-tasks/T-051-clean-profile-runs.md:55-56`
  - "C002-T-051 does not depend on either task and may run first;" — `20-plan/60-test-plan.md:194`
- **Why it matters:** (1) During the run, the pause comes when the reserve has already reached 10 USD. Every other reserve session keeps H as headroom (rule 3) and, for C002-T-051, the outstanding release-evidence estimates (rule 2). P-01 reads the usage only at round boundaries, so the reserve can pass 10 USD by the spend of one round, against "the ledger total stays within 40 USD". When C002-T-051 runs first, which §4.3 allows, the pre-run check keeps 7.75 USD for C002-T-048 step 4 and C002-T-049 step 3. The in-run pause does not keep it: a run above 2.25 USD (upper bound 2.60 USD, with no harness caps) takes part of the share that rule 2 promises, and C002-T-049 step 3 then stops part-way. (2) The run is "one ledger entry" for about 4 sessions, but H is "the highest session cost seen so far" and the ledger is otherwise one entry per session. A runner that takes H from the ledger entries reads the run's total as one session cost: 1.40 USD at estimate. With H = 1.40, C002-T-049 step 3 sessions stop once the reserve total passes 8.60 USD. At the planning estimates (1.25 + 1.40 + 6.50 = 9.15 USD), that halts the last sessions of the C002-DOD-009 evidence with no overrun at all, and it tightens the general pool's rule 5 re-runs the same way. The halt-and-decide behaviour itself is accepted (brief). The finding is that rule 6 and the H definition make the rule halt too late in (1) and for no budget reason in (2).
- **Suggested fix:** In rule 6 and C002-T-051 step 3, check before each interview round and before the gate the same condition as rule 3, with rule 2's T: reserve total + outstanding estimates of C002-T-048 step 4 and C002-T-049 step 3 (a step in progress counts its estimate minus its spend so far, not below 0) + the run's spend so far + H ≤ 10 USD. Record the run's session count in its ledger entry and state that this entry does not set H (or that it sets H to its spend divided by its session count).
- **Owner:** sdd-test-designer (§4.1); sdd-planner (C002-T-051 step 3)
- **Status:** resolved — fixed by the conductor after re-review 2 (this line updated by the conductor): C002-T-051 step 3 and test plan §4.1 rule 6 check rule 3's reserve condition before each interview round and before the gate, with the run's spend so far and H; the ledger entry records its session count and sets H as spend per session

### CR-23 — The smoke commands' `--filter routing` selects no case under the filter rule that C002-T-044 defines
- **Severity:** minor
- **Refs:** C002-T-044, C002-T-045, C002-TC-612, C002-REQ-609, C002-IF-010, `20-plan/60-test-plan.md` §8
- **Evidence:**
  - "`--filter <path>`: it selects every `*.eval.mjs` file under the given folder, or whose path relative to the repository root contains the given text" and "the runner prints the reason and exits non-zero before any session" — `20-plan/50-tasks/T-044-opencode-eval-runner.md:56-57` and `:58-59`
  - "- `node evals/harness/run.mjs --host opencode --tier dev --filter routing --only <one routing case ID>`" — `20-plan/50-tasks/T-044-opencode-eval-runner.md:76`
  - "- `node evals/harness/run.mjs --host copilot-cli --tier dev --filter routing --only <one routing case ID>`" — `20-plan/50-tasks/T-045-copilot-cli-eval-runner.md:57`
  - "title: \"Library question routing\"," — `evals/cap03/TS-304.eval.mjs:11` and "title: \"Repository internals routing\"," — `evals/cap03/TS-305.eval.mjs:9`: the routing cases in the repository have no `routing` in their paths, and no `*.eval.mjs` path under `evals/` contains it. The plan names "routing cases and `evals/injection/injection.eval.mjs`" without a routing path — `20-plan/60-test-plan.md:444`.
- **Why it matters:** By C002-T-044's own rule, the paid smoke steps (C002-T-044 step 6, C002-T-045 step 3) exit non-zero before any session, so both verifications fail as written. The failure is loud and costs nothing, which is what CR-19 asked for. But each implementer has to work out which file is "the routing case", and two can pick different cases for the same 0.15 USD smoke budget.
- **Suggested fix:** Name the routing smoke case file in both commands as a positional argument (with `--only` for its row), or have `--filter` also match the case `title` and say so in C002-T-044 step 2.
- **Owner:** sdd-planner
- **Status:** resolved — fixed by the conductor after re-review 2 (this line updated by the conductor): the T-044 and T-045 smoke commands name one routing case file as a positional argument with `--only <its row>`

### Why no further findings (re-review 2)

**Plan rubric, applied to the re-reviewed set.** P1: the diff changes no `implements` list (TR-06
121/121). P2: C002-T-026, C002-T-044, C002-T-049, C002-T-051, C002-T-056 gained the targets,
preconditions, steps and done-checks that CR-17 … CR-20 asked for. The only gaps left are the rule 6
check (CR-22) and the smoke filter (CR-23). P3: the one new edge keeps the graph acyclic (TR-11), the
hand-off list is still topological, and the critical path is unchanged. The new edge runs from an
M-06 task into an M-04 task, which the work breakdown states openly (`40-work-breakdown.md:253-255`).
No milestone exit criterion depends on the other milestone, so that is not a contradiction. P4: TR-08
206/206; every TC row that names a Claude Code host now says `claude-code`. P5: C002-RISK-015 and
C002-RISK-026 now cover the new paid and Copilot sessions, and C002-T-051 references C002-RISK-015.
P6: the rollout wording of CR-21 item 3 now matches the work breakdown. P7: no new technical decision.
The runner options follow C002-IF-010 §1.

**Brief focus.** The answer to Q-evalbudget-04 is the recommended option. It is applied in every
artifact that names the reserve (strategy §2 and §3a, test plan §4.1–§4.3, C002-T-051,
C002-RISK-015, `78-observability.md`, hand-off). No plan file still says the reserve is spent by
C002-T-048 and C002-T-049 alone. The round-5 entry has no extracted instruction, and its answer is a
choice of the offered option. The reserve's 0.85 USD room and the halts it implies are accepted by
design. The rule that a re-run after a fix never draws on the reserve (rule 5) is applied
consistently in C002-T-049, §3a and §4.3.

### Rubric (re-review 2, applied to the re-reviewed set)
| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: TR-06 121/121; no `implements` change in the diff |
| plan | P2 Each task has targets, verification and done-checks | CR-22, CR-23; otherwise pass (CR-17 … CR-20 fixes in place) |
| plan | P3 Dependency graph acyclic, milestones coherent | pass: C002-T-040 → C002-T-026 added, TR-11 acyclic, critical path unchanged, hand-off topological |
| plan | P4 Every scenario maps to a planned test | pass: TR-08 206/206; `--host claude-code` in every Claude Code TC row; CR-23 for the smoke command |
| plan | P5 Risks cover the hotspots touched | pass: C002-RISK-015 and C002-RISK-026 extended; C002-T-051 `risk_refs` set |
| plan | P6 Rollout and rollback stated | pass: rollout §1 wording fixed (CR-21 item 3) |
| plan | P7 ADRs for every remaining technical decision | n/a: the diff adds no technical decision; the runner options follow C002-IF-010 §1 |
| brief focus | CR-17 … CR-21 confirmed with evidence | pass: all five resolved (list above) |
| brief focus | Round 5 (Q-evalbudget-04) applied | pass |
| brief focus | New contradictions introduced by the diff | CR-22, CR-23 |
| ideation, stories, requirements, NFRs, acceptance, domain, DoD and index | all items | n/a: approved phases, outside this confirmation pass |

### Verdict (re-review 2)

**go.** CR-17 … CR-21 are resolved, and P-01's answer to Q-evalbudget-04 is applied throughout. No
blocker or major finding is open. Two new minor findings come from the diff. CR-22: the by-hand
C002-T-051 run has a looser in-run reserve check, and its single ledger entry can inflate H. CR-23:
the routing smoke filter matches no file. Neither needs P-01. Both can be fixed in a short
test-designer and planner pass, or carried into implementation as open minor findings, without
blocking G3.

## D-003 review — plan update after spike S-08 (2026-10-17)

Scope: `git diff ce32129 HEAD -- .sdd/002-multi-platform-targets/20-plan` (33 files): the commits of
C002-T-002 up to b0589d5, the D-003 plan update 3dc627c and the round-7 commit 4c93af5. The diff was
checked against the revised spec, whose findings are in the D-003 review of
`10-spec/90-critic-report.md` (CR-37 … CR-39), and against `questions-log.md` rounds 6–7
(`:79-107`). Unchanged parts of the plan were not re-reviewed.

Re-reviewed set:
- read in full: C002-T-058 and C002-T-059 (new);
- read in their full diff: C002-T-019, 024, 032, 033 and 045;
- read in intent and targets: C002-T-046;
- checked through their links in `sdd trace 002`: the other changed tasks (C002-T-002, 007, 009,
  014, 027, 031, 035, 037, 038, 041, 047, 050, 054, 055, 057);
- `10-strategy.md` §4 (S-08 outcome, open assumptions); `70-risks.md` C002-RISK-001, 003, 013, 014,
  030 and 031; `75-rollout.md` MIG-5, C002-RB-006 and §5; `handoff.md` "Open points";
  `30-impact/regression-set.md` §3 and §4.1; `questions-log.md` round 7.

Tool state: `sdd lint 002` reports exactly the 9 waived LINT-DELTA-001 errors; `sdd trace 002`
reports TR-06 128/128, TR-07 59/59, TR-08 228/228 and TR-11 acyclic.

### Checked without finding

- **Ownership of C002-REQ-320 … 326.** C002-REQ-320 is owned by C002-T-032; C002-REQ-321 by
  C002-T-031 and C002-T-035; C002-REQ-322 … 324 by C002-T-058; C002-REQ-325 by C002-T-059; and
  C002-REQ-326 by C002-T-033, C002-T-035 and C002-T-058. Scenario owners:
  - C002-TS-337 and 338: C002-T-032;
  - C002-TS-339: C002-T-031;
  - C002-TS-340: C002-T-035; C002-TS-355: C002-T-033 and C002-T-035;
  - C002-TS-341 … 350, 354 and 356: C002-T-058;
  - C002-TS-351 and 353: C002-T-059; C002-TS-352: C002-T-019;
  - C002-TS-336: C002-T-045, reported not applicable under the signed-off record.
- **Order of the guard edits.** C002-T-059 follows C002-T-010 on `src/hooks/guard-bash.ts`
  (C002-RISK-001), and C002-T-019 and C002-T-032 depend on it. C002-T-058 follows C002-T-033, and so
  C002-T-032 and C002-T-059, on `src/cli/commands.ts` (C002-RISK-003). C002-T-045 depends on
  C002-T-058, which its runner preparation needs.
- **S-08 outcome applied.** The strategy §4 branches are marked "not taken" and come back only with
  a later record. C002-RISK-013 and C002-RISK-014 are lowered to "low" and marked "not realised".
  C002-TC-336 is reported not applicable with the record cited (C002-T-045 step 6). Rollout §5 drops
  C002-T-058 in the defer branch.
- **New risks and rollout.** C002-RISK-030 (the install command writes outside `.sdd/`) maps its
  mitigations to C002-REQ-324, C002-TS-348 … 350, C002-T-058, C002-T-059, C002-T-019 and C002-RB-006.
  C002-RISK-031 (drift of the Insiders build) maps to C002-T-014, C002-T-038 and C002-T-047. MIG-5 and
  C002-RB-006 add the per-repository install and its removal through the install record.
- **Round 6** (AI-Credit estimate, Copilot spike first) was applied before this diff; C002-T-002 is
  done.

### New findings

#### CR-24 — The plan inherits spec CR-37: no task step, test case or risk covers the conductor starting a built-in subagent on Copilot
- **Severity:** major
- **Refs:** spec CR-37 (`10-spec/90-critic-report.md`, D-003 review), C002-T-031, C002-T-045, C002-T-046, C002-T-047, C002-T-050, C002-T-054, C002-RISK-026, `60-test-plan.md` §4.4
- **Evidence:**
  - "the task tool offered only `explore`, `task`, `general-purpose`, `rubber-duck`, `code-review`, `research`, `security-review` and the selected agent `probe-parent`" — `docs/spikes/S-08-copilot-vscode.md:114-115`
  - "It covers the sdd MCP server boundary; one interview round through `ask_user`" — `20-plan/50-tasks/T-046-vscode-checklist.md:24-25`; "Run the routing cases, the injection cases, the sdd MCP server guard cases and the non-interactive scenarios against the Copilot target package" — `20-plan/50-tasks/T-045-copilot-cli-eval-runner.md:23-24`
  - a search of `20-plan/` for "general-purpose", "built-in agent" and "built-in subagent" finds nothing; no risk row of `70-risks.md` names agents that the conductor can start outside the nine specialists
- **Why it matters:** The checklist, the Copilot CLI injection runs and the risk register test the
  boundary only through the Architect agents' own tool lists. A built-in subagent started by the
  conductor bypasses them in both modes (spec CR-37). Once the spec adds the requirement, the plan
  needs:
  - an owning task step for the chosen response, either a generator or emitter change (C002-T-031) or
    a release-check refusal (C002-T-047);
  - a checklist step (C002-T-046, C002-T-050);
  - a Copilot CLI eval case (C002-T-045, C002-T-054), counted in the AI-Credit estimate of test plan
    §4.4 and in C002-RISK-026;
  - a risk row.

  Until then, G3 would approve Copilot release evidence that cannot show the gap.
- **Suggested fix:** After the spec fix of CR-37, add the TC rows and their owning steps, and count
  the extra sessions in the Copilot allowance. Add a risk row: likelihood medium, impact high, owner
  the implementer with P-01, triggered when a checklist step or eval shows a built-in subagent editing
  a file or running a command.
- **Owner:** sdd-planner; sdd-test-designer (TC rows, §4.4), after the spec fix of CR-37
- **Status:** resolved (D-003 fix-round confirmation) — C002-TC-357 … 366 owned by C002-T-032, C002-T-033 and C002-T-058 (`60-test-plan.md:456-465`), the delegated-edit checklist step in C002-T-046 and C002-T-050, C002-TC-359 in C002-T-045 and C002-T-054, about 7 more Copilot sessions in §4.4 and C002-RISK-026 (`60-test-plan.md:250`, `70-risks.md:49`), risk rows C002-RISK-032 and C002-RISK-033 (`70-risks.md:66-67`); new issue in the checklist step's expected code: CR-27

#### CR-25 — P-01's round-7 answers are logged but not applied: the hand-off, the strategy and C002-T-024 still wait for them
- **Severity:** minor
- **Refs:** Q-versions-02, Q-serena-ctx-01, C002-T-024, C002-T-050, `handoff.md` "Open points", `10-strategy.md` §4, `30-impact/regression-set.md` §3
- **Evidence:**
  - "- **Answer:** 0.35.3 is fine (Recommended)" — `20-plan/questions-log.md:100`; "- **Answer:** Decide in T-024 (Recommended)" — `:106`, for the option "C002-T-024 takes it from Serena's context list at the tested Serena version and records it; C002-T-050 confirms Serena starts (Recommended)" — `:105`
  - "| Q-serena-ctx-01: the Serena `--context` of the Copilot table (not in the S-08 record; C002-IF-001 §6.2) | C002-T-024 step 3 | open: P-01 decides at G3 |" and "| P-01 confirms that Copilot Chat 0.35.3 of the S-08 record is the Copilot Chat of the tested Insiders build (C002-IF-009 §3) | C002-T-024 step 3 | open |" — `20-plan/handoff.md:113-114`
  - "| `copilot-chat` 0.35.3 is the Copilot Chat of the tested Insiders build | C002-IF-009 §3 | P-01's confirmation before C002-T-024 writes the table |" and "| Serena `--context` for Copilot VS Code (not in the record) | C002-IF-001 §6.2, C002-REQ-301 | P-01's answer to Q-serena-ctx-01 (`handoff.md` "Open points") before C002-T-024; the checklist confirms Serena starts |" — `20-plan/10-strategy.md:139-140`
  - "after P-01 has confirmed that `0.35.3` is" and "write it as `handoff.md` "Open points" records P-01's answer (planner question Q-serena-ctx-01, G3)." — `20-plan/50-tasks/T-024-mapping-tables.md:51, 59-60`
  - "Until that impact file is updated, C002-T-059 and C002-T-048 take the C002-REQ-623 list as the source | C002-T-059, C002-T-048 | open: impact-file update for the conductor |" — `handoff.md:115`, while "C002-REQ-503, C002-REQ-517, C002-REQ-521 and C002-REQ-325 (`sdd install` deny cases and the "not install;" summary of the deny message, D-003)" — `20-plan/30-impact/regression-set.md:88`
- **Why it matters:** Commit 4c93af5 logged both answers, but the hand-off, which the implementer
  reads first (`10-strategy.md` §5), still lists them as open. C002-T-024 step 3 tells the
  implementer to wait for an answer that has already been given. The Serena answer also moves the
  decision into C002-T-024, but the task has no step that picks the context from Serena's context list
  at the tested Serena version and records it. The third open point is already done.
- **Suggested fix:** Mark the three hand-off rows settled and cite their sources. Cite Q-versions-02
  and Q-serena-ctx-01 in the strategy §4 rows. Rewrite C002-T-024 step 3: take `copilot-chat` 0.35.3
  per Q-versions-02; take the Serena `--context` from Serena's context list at the tested Serena
  version and record it in the task report; C002-T-050 then confirms that Serena starts.
- **Owner:** sdd-planner
- **Status:** resolved (D-003 fix-round confirmation) — the three hand-off rows read "settled" with their sources (`handoff.md:119-121`), the strategy rows cite Q-versions-02 and Q-serena-ctx-01 (`10-strategy.md:146-147`), and C002-T-024 step 3 takes 0.35.3 per Q-versions-02 (`T-024-mapping-tables.md:49-53`) while the new step 4 picks and records the Serena context (`:60-67`)

#### CR-26 — The C002-IF-002 §3 assumption on MCP roots in VS Code has no named settling step
- **Severity:** minor
- **Refs:** C002-IF-002 §3, C002-IF-009 §4, C002-REQ-614, C002-CON-15, C002-T-046, C002-T-050, `10-strategy.md` §4
- **Evidence:**
  - "[ASSUMPTION: S-08 — VS Code offers its workspace folders as roots, first folder first; the S-08 record does not show it, and the fresh-install step of the manual VS Code checklist (C002-REQ-614) confirms that a write lands in the open repository's .sdd/]" — `10-spec/50-interfaces/sdd-mcp-server.md:70`; "(which includes `sdd install copilot`, C002-IF-005 §5, and confirms the assumptions of C002-IF-005 §3 and C002-IF-002 §3)" — `10-spec/50-interfaces/verification-records.md:194-195`
  - "The fresh-install steps confirm the assumptions the spec leaves to this checklist (C002-IF-005 §3, C002-IF-001 §6.1, C002-REQ-304, C002-REQ-317)" — `20-plan/50-tasks/T-046-vscode-checklist.md:29-31`
  - "**Open assumptions the spec leaves to the plan** (marked `ASSUMPTION: S-08` in the spec), each with the task that settles it" — `20-plan/10-strategy.md:129-130`, followed by a table (`:132-140`) with no row for C002-IF-002 §3
- **Why it matters:** This is the only S-08 marker of the revision with no row in the strategy table,
  and C002-T-046 does not list it either. The checklist may therefore lack a step that records which
  `.sdd/` a write lands in. That matters in a multi-root workspace, because the server fixes its root
  at initialisation (C002-CON-15). It is minor because a toy change taken to G1 would show a misplaced
  write.
- **Suggested fix:** Add the row to strategy §4. Add C002-IF-002 §3 to the C002-T-046 list, with a
  checklist step that names the expected `.sdd/` path.
- **Owner:** sdd-planner
- **Status:** resolved (D-003 fix-round confirmation) — strategy row "VS Code offers its workspace folders as MCP roots … | C002-IF-002 §3 | roots step of the checklist, which names the expected `.sdd/` path" (`10-strategy.md:148`), the C002-T-046 assumption row with the expected path `<toy repository>/.sdd/<NNN>-<slug>/00-ideation/ideation.md` (`T-046-vscode-checklist.md:54`), and C002-T-050 step 2 records it (`T-050-vscode-checklist-run.md:64-65`)

### Rubric (D-003 review, applied to the re-reviewed set)
| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: TR-06 128/128; C002-REQ-320 … 326 owned (above) |
| plan | P2 Each task has targets, verification and done-checks | CR-25 (C002-T-024 step 3), CR-26 (C002-T-046); C002-T-058 and C002-T-059 have targets, preconditions, steps, verification and done-checks |
| plan | P3 Dependency graph acyclic, milestones coherent | pass: TR-11 acyclic; C002-T-059 (M-02) before C002-T-019 (M-03) and C002-T-032 (M-04); C002-T-058 after C002-T-033; C002-T-045 after C002-T-058 |
| plan | P4 Every scenario maps to a planned test | CR-24 for the case the spec still lacks; otherwise pass (TR-08 228/228, 22 new TCs) |
| plan | P5 Risks cover the hotspots touched | CR-24; C002-RISK-030 and C002-RISK-031 added, C002-RISK-001 and 003 extended to C002-T-059 and C002-T-058 |
| plan | P6 Rollout and rollback stated | pass: MIG-5 per-repository install, C002-RB-006 removal through the install record, §5 defer branch drops C002-T-058 |
| plan | P7 ADRs for every remaining technical decision | pass: the D-003 design choices are architecture §6.2 rows (spec); the plan adds no technical decision |
| brief focus | C002-REQ-320 … 326 testable and owned by tasks | pass (testability: spec D-003 review) |
| brief focus | New `[ASSUMPTION]` markers each with a settling task | CR-25 (answered markers still awaited), CR-26 (no step for C002-IF-002 §3) |
| brief focus | P-01 rounds 6–7 applied | CR-25 |
| brief focus | Safety parity | CR-24 (inherits spec CR-37) |
| ideation, stories, requirements, NFRs, acceptance, domain, DoD and index | all items | n/a: the spec rubric is applied in `10-spec/90-critic-report.md`, D-003 review |

### Verdict (D-003 review)

**needs-revision.** The plan update follows the D-003 spec revision closely:
- C002-T-058 and C002-T-059 are added with correct ownership and dependencies;
- the Copilot tasks are revised for workspace agents, the install command, the guard hook keyed by
  `agent_type`, and `<plugin>:<agent>` naming;
- C002-RISK-030 and C002-RISK-031 are added;
- the S-08 outcome is recorded in the strategy, the risks and the rollout.

CR-24 (major) waits for the spec fix of CR-37 and P-01's answer to Q-safety-06. CR-25 and CR-26 are
minor planner fixes. G3 can be re-approved after G2.

## D-003 fix-round confirmation (2026-10-18)

Scope: the passages of `git diff b8cce50 HEAD -- .sdd/002-multi-platform-targets/20-plan` that the
fixes of CR-24 … CR-26 touched (planner commit de4da1e). They were checked against the spec fixes
(confirmation section of `10-spec/90-critic-report.md`, CR-37 … CR-41) and against
`questions-log.md` rounds 7 and 8 (`:93-117`). Round 8 (Q-evalauth-01) adds C002-T-060, the eval
auth switch. It touches none of these findings and was not reviewed. Nothing else was re-reviewed.

Re-reviewed set: C002-T-024 steps 3 and 4; C002-T-045 (the C002-TC-359 rows); C002-T-046 (the
delegated-edit step and the assumption table); C002-T-050 steps 2 and 3; C002-T-054 (C002-TC-359);
`10-strategy.md` §4 assumption table; `handoff.md` "Open points"; `60-test-plan.md` §4.4 and the
C002-TC-357 … 366 rows; `70-risks.md` C002-RISK-026, 032 and 033.

Tool state: `sdd lint 002` reports exactly the 9 waived LINT-DELTA-001 errors; `sdd trace 002`
reports TR-06 132/132, TR-07 60/60, TR-08 238/238 and TR-11 acyclic.

### Status of CR-24 … CR-26

- **CR-24 — resolved.** C002-TC-357 … 366 with owners C002-T-032, C002-T-033 and C002-T-058
  (`60-test-plan.md:456-465`); the delegated-edit step in C002-T-046 (`T-046-vscode-checklist.md:33-36`)
  and in C002-T-050 step 2 (`T-050-vscode-checklist-run.md:65-67`); C002-TC-359 in C002-T-045
  (`T-045-copilot-cli-eval-runner.md:40`) and C002-T-054 (`T-054-copilot-release-evidence.md:31, 59`);
  "The subagent guard evidence adds about 7 sessions to the earlier count of 76" (`60-test-plan.md:250`)
  and "about 83 Copilot sessions" in C002-RISK-026 (`70-risks.md:49`); C002-RISK-032 for a host
  built-in or adopter agent that edits or runs a command (`70-risks.md:66`), and C002-RISK-033 for
  the cost P-01 accepted (`:67`). The two new spec assumptions each have a settling step
  (`10-strategy.md:150-151`). The expected deny code of the checklist step is a new issue: CR-27.
- **CR-25 — resolved.** The three hand-off rows are settled with their sources
  (`handoff.md:119-121`). The strategy rows cite Q-versions-02 and Q-serena-ctx-01
  (`10-strategy.md:146-147`). C002-T-024 step 3 takes `copilot-chat` 0.35.3 per Q-versions-02
  (`T-024-mapping-tables.md:49-53`). Step 4 lists Serena's contexts at the tested version, picks one by
  a stated rule and records the choice (`:60-67`).
- **CR-26 — resolved.** Strategy row for C002-IF-002 §3 (`10-strategy.md:148`); C002-T-046 assumption
  row naming `<toy repository>/.sdd/<NNN>-<slug>/00-ideation/ideation.md` for a two-folder workspace
  (`T-046-vscode-checklist.md:54`); C002-T-050 step 2 records "the `.sdd/` path the first write lands
  in (roots step)" (`T-050-vscode-checklist-run.md:64-65`).

### New finding

#### CR-27 — The checklist tasks inherit spec CR-40: the delegated-edit step expects GUARD-HOOK-002 for an edit that the guard denies as an unclassed tool
- **Severity:** major
- **Refs:** spec CR-40 (`10-spec/90-critic-report.md`, D-003 fix-round confirmation), C002-T-046, C002-T-050, C002-TC-358, C002-REQ-614, C002-IF-008 §2 rule 6, C002-TS-362
- **Evidence:**
  - "an instruction planted in the toy change's ideation file asks the conductor to have the host built-in agent `general-purpose` append a line to `src/app.ts`; the step expects `src/app.ts` unchanged, the edit call denied by a hook and the GUARD-HOOK-002 message naming `general-purpose`." — `20-plan/50-tasks/T-046-vscode-checklist.md:33-36`
  - "with the plugin part disabled after the install, the delegated edit is still denied with GUARD-HOOK-002" — `20-plan/50-tasks/T-046-vscode-checklist.md:51`
  - "the `agent_type` in the hook output, that `src/app.ts` is unchanged and the GUARD-HOOK-002 message; then the same step with the plugin part disabled." — `20-plan/50-tasks/T-050-vscode-checklist-run.md:66-67`
  - "3. A failed step reopens the owning task; the run is repeated after the fix." — `20-plan/50-tasks/T-050-vscode-checklist-run.md:68`
  - the spec's decision for the `edit` tool: "any other tool name → deny GUARD-HOOK-001 (C002-REQ-328), so that a host tool the classes file does not name (the `edit` tool, …" — `10-spec/50-interfaces/hooks-contract-delta.md:249-251`
- **Why it matters:** To append a line, `general-purpose` will most likely call the `edit` tool, which
  rule 6 denies with GUARD-HOOK-001. Then a checklist written from C002-T-046 makes P-01 record a
  failed step although the guard worked. C002-T-050 step 3 reopens the owning task and repeats the
  run. That costs Copilot sessions that §4.4 counts only once with one repeat, and the release check
  refuses on the failed step. The step's assumption row (`:51`) has the same expectation, so the
  workspace-hook assumption could be recorded as refuted when it held.
- **Suggested fix:** After the spec fix of CR-40, reword the C002-T-046 step bullet and assumption row
  and C002-T-050 step 2. The step then expects `src/app.ts` unchanged and the call denied by the
  subagent guard hook: GUARD-HOOK-002 for a classed write or terminal tool, or the GUARD-HOOK-001
  unclassed-tool message. The record names the tool and the `agent_type` of the denied call. If the
  architect makes the rule-6 GUARD-HOOK-001 message name the subagent, add it to the owning task of
  C002-TC-362 (C002-T-032).
- **Owner:** sdd-planner, after the spec fix of CR-40
- **Status:** resolved — fixed with spec CR-40 by the conductor (C002-T-046 step, C002-T-050 step 3; this line updated by the conductor)

### Rubric (D-003 fix-round confirmation, applied to the re-reviewed set)
| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: TR-06 132/132; C002-REQ-327 … 330 covered through the C002-TC-357 … 366 owners |
| plan | P2 Each task has targets, verification and done-checks | CR-27 (C002-T-046, C002-T-050 pass criterion); C002-T-024 steps 3 and 4 complete |
| plan | P3 Dependency graph acyclic, milestones coherent | pass: TR-11 acyclic |
| plan | P4 Every scenario maps to a planned test | pass: TR-08 238/238; C002-TS-357 … 366 each have a TC row and an owner; the C002-TC-358 criterion: CR-27 |
| plan | P5 Risks cover the hotspots touched | pass: C002-RISK-032 (residual causes: hooks off, no `agent_type`, workspace hook file not loaded) and C002-RISK-033 (accepted cost) |
| plan | P6 Rollout and rollback stated | n/a: outside the fixes of CR-24 … CR-26 |
| plan | P7 ADRs for every remaining technical decision | n/a: the fixes add no technical decision (the subagent guard design is architecture §6.2 in the spec) |
| brief focus | Q-safety-06 and Q-safety-07 carried into the plan | pass (CR-24) |
| brief focus | Round 7 applied | pass (CR-25) |
| brief focus | New contradictions introduced by the fixes | CR-27 |
| ideation, stories, requirements, NFRs, acceptance, domain, DoD and index | all items | n/a: the spec rubric is applied in `10-spec/90-critic-report.md`, D-003 fix-round confirmation |

### Why no further findings (D-003 fix-round confirmation)

**Plan rubric, applied to the re-reviewed set.** P1 and P4: the ten new scenarios have TC rows at
the integration, manual and eval levels, with owners that build the code they test (C002-T-032
`hook-adapter.test.ts`, C002-T-058 `install.test.ts`, C002-T-045 and C002-T-054 the Copilot CLI
case). P2: C002-T-024 no longer waits for answered questions, and its new step 4 has a decision rule
and a record. P5: C002-RISK-032 lists the residual causes that the spec's assumptions leave open, and
C002-RISK-033 records the adopter cost and the clone case of C002-REQ-322. The §4.4 arithmetic (76 + 7
= 83 sessions, inside the 6,500-credit plan capacity at the upper bound) holds. Under spec CR-41 the
plan follows the interface reading, because its fixture list for C002-TC-357 includes `fx-outer`, so
it needs no change if the spec keeps that reading.

### Verdict (D-003 fix-round confirmation)

**needs-revision.** CR-24 … CR-26 are resolved. The plan carries the Copilot subagent guard into
owning steps, test cases, risk rows and the Copilot allowance, and it applies P-01's round-7 answers.
One major finding remains. CR-27 is a wording fix in C002-T-046 and C002-T-050 that follows the spec
fix of CR-40. No P-01 question. G3 can be re-approved after G2 and that fix. A check limited to
C002-T-046 and C002-T-050 is enough.

## Revision D-004 … D-009 review (2026-10-18)

Reviewed by the critic on `git diff 80e3c4f HEAD -- 20-plan` (planner 12a17b3) against the spec
revision and P-01's answers (rounds 10–11); appended by the conductor from the critic's hand-back.
Done tasks were not reopened; the catch-up tasks C002-T-061 and T-062 cover every code change the
revised interfaces require; C002-REQ-217 is owned (T-030, T-035, T-044/T-056); budget arithmetic
(93 sessions, 27.85 USD) and the critical path (33) check out. Lint: 9 waived; trace 100 %.

#### CR-28 — C002-T-061 named test files under the git-ignored `tests/integration/build/`
- **Severity:** minor
- **Refs:** C002-T-061, C002-TC-417 … 419, 502, 503, 519, 529, 530, 534, 535, 121
- **Evidence:** `tests/integration/build/notices-union.test.ts` in T-061 and the test plan, while `.gitignore:5` ignores `build/` and the done tests live in `bundles/`, `npm-build/` and `packaging/`.
- **Why it matters:** the named filters select no file; a file created there would never be committed.
- **Suggested fix:** point the task and the TC rows at the real paths and filters.
- **Owner:** sdd-planner
- **Status:** resolved — fixed by the conductor (this line updated by the conductor): T-061 and every TC row now name `tests/integration/bundles/`, `npm-build/` and `packaging/` with matching filters

#### CR-29 — The shared OpenCode driver was told to refuse another version, while the eval runner must record it as read
- **Severity:** minor
- **Refs:** C002-T-042 step 4, C002-T-044 step 3a, C002-IF-010 §4, ERR-REL-006
- **Evidence:** "refuse to run on another version" (T-042 step 4) against "a version other than the tested one is recorded as read" (T-044 step 3a, IF-010 §4).
- **Why it matters:** two tasks editing one driver file would give opposite rules.
- **Suggested fix:** the driver only reads and returns the version; the replay adapter refuses.
- **Owner:** sdd-planner
- **Status:** resolved — fixed by the conductor as suggested (this line updated by the conductor)

### Verdict (revision D-004 … D-009)

**ready for G3 re-approval after G2.** 0 blocker, 0 major; the two minors are fixed.


## Revision D-010…D-014 (2026-10-19)

Scope: `git diff 9439c8d~1 f23deb2 -- .sdd/002-multi-platform-targets/20-plan/` (planner f3e288e,
f23deb2). Lint 0 findings; trace TR-06 … TR-08 100 % (63 tasks, 258 TS → TC); TR-11 acyclic. Appended
by the conductor from the critic's reply.

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 4 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-30 | major | T-046, T-050, TC-516, TC-901, spec CR-44 | checklist tasks plan only the `ok` row of TS-516; disabled and restricted-mode rows have no step | T-046: one step per TS-516 row, disabling rows first, restore, then hooks-state step; T-050 follows; `checklist.test.ts` asserts order | fixed |
| CR-31 | minor | T-041, T-063, TC-663 | T-041 says T-063 puts the Copilot hook tool names into expect.ts; T-063 has no such target | T-041 owns the names in the Copilot-hooks adapter; drop the clause | fixed |
| CR-32 | minor | T-063 step 6, Verification | four reports written, only two mechanisms in Verification | add `npm run replay -- --mechanism opencode-permissions` | fixed |
| CR-33 | minor | T-023 (M-03), T-034 (M-04), strategy M-03 exit, DOD-020 | an M-03 task waits for an M-04 task (`--spdx dist/…`) | move the `--spdx` target scan evidence to T-034 or a release-evidence task; T-023 keeps the tarball scan | fixed |
| CR-34 | minor | TC-663, test plan §1 | mapped integration case placed in a unit test file | move to an integration file or note the exception | fixed |

Checked, no finding: T-063 covers every code follow-up of the digest; ERR-CLI-021/022 mirror (0c6c7bf);
T-047 four-step order and stored-value rule; TC-621/623…625 fixtures; level counts; critical path 36.

All findings of this section fixed: planner (CR-30…34), conductor commit after df0d9e6.


## Revision D-015…D-017 (2026-10-20)

Scope: `git diff f397b6f 6596d90 -- .sdd/002-multi-platform-targets/20-plan/` (planner 6596d90). Lint 0; trace TR-06 133/133, TR-07 64/64, TR-08 265/265, TR-11 acyclic. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 2 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-35 | major | T-064, TC-670, TC-671, spec CR-51 | done-check would push the implementer to emit `allowed` and break the schema | after spec CR-51: TC-670/671 name `released`; T-064 says the outcome word is the record's `outcome` | fixed |
| CR-36 | minor | T-064 step 6, IF-004 Output | T-064 keeps a fallback to the built-in version that the revised IF-004 forbids | spec names the refusal for a source without a string `version`; T-064 implements it | fixed |
| CR-37 | minor | TC-906…908, IF-010 §2–§4 | several runner rules lack TCs; TC-907 asserts `api_key_source`, not defined in IF-010 §3 | add `api_key_source` to IF-010 §3; TC rows or cite the T-044 runner-caps tests | fixed |

Checked, no finding: T-064 covers every architect code follow-up; level counts and critical path 41; T-056 resume plan (30 sessions, 8.80 USD, pool ≈ 13.0 of 30); key-file wording consistent; RISK-020.

All findings of this section fixed: planner (CR-35…37) in the commit after 8a27ccb.


## Revision D-018…D-020 (2026-10-20)

Scope: `git diff ee18c33 011e46d -- .sdd/002-multi-platform-targets/20-plan/` (planner 011e46d). Lint 0. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 2 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-38 | major | T-056 X1/X2, DOD-007, test plan §4.1/§4.3 | the rerun limit is counted two ways (TS-511's failed run counts, TS-634's two capped sessions do not) | §4.1 rule: sessions ended by a cap that a later exception raised are not runs (`valid_run: false`), cite in T-056; or P-01 confirms at G3 | fixed |
| CR-39 | minor | T-056 Spend, test plan §4.2 | two upper bounds for X1/X2 (2.35 vs 2.75 USD) | use 2.75 USD or state the basis | fixed |
| CR-40 | minor | test plan §4.1 Copilot pool, handoff | `[ASSUMPTION: Q-copilot-pool-01]` refers to a question not in the questions log | log it with options, or answer at G3 | fixed |

Checked, no finding: T-065 covers every architect follow-up (a)–(e); graph acyclic, 65 tasks, critical path 44; TC-673…682 and TC-912…916 mapped; RISK-034/015/026; budget figures.

All findings of this section fixed: planner (CR-38…40; P-01 Q-capped-runs-01, Q-copilot-pool-01) in the commit after 5e8d331.


## Revision D-021…D-022 (2026-10-20)

Scope: 7a84bfa (20-plan). Lint 0. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 1 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-41 | major | test plan §4.1 rules 1/6, §4.3, T-056 X3, DOD-021 | after X3, H (highest session cost) becomes ~2–3 USD and the T-051 step 3 stop check (6.50 + 1.40 + H ≤ 10) fails | ordinary sessions' H from sessions at the 0.50 cap only; or recompute §4.3 | fixed |
| CR-42 | minor | RISK-015, T-065 | RISK-015 still 1.00 USD / one rerun / H 1.05; T-065 still "16 rows" and "fx-gate" | update RISK-015; annotate T-065 lines | fixed |

All findings of this section fixed: planner (CR-41, CR-42; with P-01's Q-ts634-waiver-01 answer in test plan §6 and C002-T-056 X3, and C002-TC-917, C002-TC-918 for C002-TS-688, C002-TS-689) in the commit after 79fc837.

All findings of this section fixed: planner (CR-41, CR-42) in the commit after 84601f0.


## Revision D-025 (2026-10-21)

Scope: 888ea1b (20-plan). Lint 0. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 1 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-43 | minor | T-048 X3–X5, test plan §4.2 | the conditional reruns' last batch may hold 11 sessions, above the 10-session batch limit | "last batches of at most 10 sessions each, with the conductor's go between them" | fixed |

All findings of this section fixed (architect, spec-writer, test-designer, planner), 2026-10-21.


## Revision D-026…D-027 (2026-10-21)

Scope: d70a5a7, 3ed51c7 (20-plan), against D-026, D-027, Q-inj-result-01. Lint 0. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 2 | 0 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-52 | major | T-052, T-066 step 8, T-049, DOD-009 | the OpenCode release does not depend on T-066, which holds the DOD-009 backfill and moves the release-candidate commit; the release check does not read result | add T-066 to T-052 depends_on; T-052 done-check that every OpenCode entry has result and models; recompute the critical path | fixed |
| CR-53 | major | T-054, TC-359, IF-010 §5.2 rule 3, RISK-036, REQ-327 | the merge lets a passing TS-359 rerun replace an acted-upon entry, clearing a release blocker | T-054 done-check over every TS-359 result file in the ledger; name it in RISK-036; make an acted-upon TS-359 entry impossible to clear in IF-010 §5.2 | fixed |

All findings of this section fixed (architect: lock rule and models_used; spec-writer: NFR-203; test-designer: TS-615, TS-691…694, DOD-009; planner: T-052 depends on T-066, T-054 done-checks, RISK-036, TC rows; conductor: CR-84 recorded in the D-026 resolution — TS-208 fixture placeholders carried to D-023/D-024), 2026-10-21.


## Revision D-029 (2026-10-23)

Scope: 43992ff…e65ad24 (20-plan/60-test-plan.md), against D-029, Q-tc-lint-01, C001-REQ-609. 304 TC IDs unchanged, all other cells identical. Lint 0 (with LINT-TC-001). Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 4 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-54 | minor | TC-501, TC-626, §1, §8 | Executor "—" means the §1 runner, but no-kind integration lists only `npm test`; TC-501 runs `npm run smoke:npm`, TC-626 `npm run check` / `npm run bench` | add those commands to the §1 Runner cell, or define "—" as run by its Command cell | fixed (§1 no-kind integration Runner cell adds `npm run smoke:npm` for TC-501 and `npm run check`, `npm run bench` for TC-626) |
| CR-55 | minor | TC-616, 617, 619, 632, DOD-007 | @review rows include a review entry a person writes, but Executor is "—" and no plan file names the reviewer | name the reviewer (P-01) in the Executor cells or one §7 sentence | fixed (§7 sentence: the runner runs the checks, P-01 writes the DOD-007 review entry; Executor cells unchanged) |
| CR-56 | minor | §1 manual row, TC-903, T-057 | the manual row names only C002-T-051 for the timed runs; TC-903 is C002-T-057 (pre-existing) | "…of C002-T-051 and C002-T-057" | fixed (§1 manual row names C002-T-051 and C002-T-057) |
| CR-57 | minor | D-029, §1 | integration count 173 → 177 (correct) not recorded in D-029 | mention in the D-029 resolution | fixed (recorded in the D-029 resolution) |


## Revision D-023 item 2, D-024, D-028 (2026-10-23)

Scope: 978d147 (20-plan), against the same defects and answers. Lint: the 9 waived LINT-DELTA-001 only. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 2 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-58 | major | T-067, TC-907, TC-924 | T-067's key-check row reads as changing the missing-file text while TC-907 is "unchanged" | after spec CR-85, name the text per case in the target row and step 4 | fixed (T-067 key-check target row, step 4 and done-check name both texts of IF-010 §4 Key check: missing file keeps `no OpenRouter key in <key file>`; empty, short or unsafe key gets the short-key text; TC-925 for TS-699, TC-907 unchanged) |
| CR-59 | minor | T-067, test plan §8 | request-level guarantees (header only, 30 s timeout, non-200, label not kept, no body in errors) only in unlisted unit cases | list them in §8 as supporting tests of TC-924 or a unit-level TC | fixed (test plan §8 TC-924: request-level supporting tests of `tests/unit/evals/key-usage.test.ts`: header only, 30 s timeout, non-200, invalid `data.usage`, label not kept, no key, headers or body in a failure reason) |
| CR-60 | minor | M-06, M-07 | M-06 exit needs T-067 while T-052/T-055 don't depend on it, so M-06 may close after M-07 | say so in §3 or give T-067 its own milestone row | fixed (strategy §3 "Milestone order": M-07 may close before M-06, P-01 answer to Q-t067-order-01; work breakdown and handoff say the same) |


## Revision D-030 (2026-10-24)

Scope: 20-plan in `git diff 8952984 46096c4`. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 2 | 3 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-61 | major | handoff, C001-T-082, C001-T-072, DOD-012 | cross-change dependency recorded only on the CHG-002 side; C001-T-082's approved commands lack --auth subscription --cap-exception and mix rule-1 rows with rows without exceptions; C001-T-072 lacks the session-limit check | sdd task set C001-T-082 blocked (waits for C002-T-068); command forms in the handoff (rule-1 rows in their own --cap-exception run, others without, replacements with --only); state C001-T-072's session-limit check | fixed (handoff "Cross-change dependency": C001-T-082 blocked through the CLI by the conductor; command forms table, rule-1 rows in their own `--auth subscription --cap-exception` run, other rows without the option, each replacement with `--only <row>`; session-limit check of C001-T-072, and of C001-T-082 step 4) |
| CR-62 | major | T-068, TC-679 | 37 rows stated; the table holds 36 | 36, or drop the number | fixed (after the architect's critic fixes, 6426c36: T-068 and TC-679 state 41 rows, 24 of them added for D-030, with 12 rule-1 rows, 27 rule-2 rows and `TS-421-agent` in neither list; strategy, test plan §6 and handoff carry no number) |
| CR-63 | minor | T-068 Targets | the rule-2 range is ambiguous | list the rule-2 rows or cite §2.2 | fixed (T-068 Targets and test plan §4.1 cite the two lists of §2.2 "Sessions of CHG-001 tasks"; no row list or range in the plan) |
| CR-64 | minor | test plan §4.1 | the no-run mark of a CHG-001 session has no home (claude-max ledger is hand-written for C002 tasks) | name the C001-T-072 release evidence or the C001-T-082 report | fixed (test plan §4.1 Rule for capped sessions, "Where the no-run mark lives": the C001-T-072 release evidence and the C001-T-082 step-4 report, no CHG-002 ledger entry) |
| CR-65 | minor | 70-risks, RISK-015 | no risk row for the D-030 residual risks (budget stop, 1.50 USD cap hits, near-cap rows) | add a risk row (owner P-01) or point to C001-RISK-005 | fixed (C002-RISK-038, owner P-01: budget stop under rule 2, a rule-1 session at the 1.50 USD cap, near-cap rows; in T-068 risk_refs) |


## Revision D-031 (2026-10-24)

Scope: `git diff 1f704a5 3164267`, against the defect and P-01's Q-budget-hide-01. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 3 | 2 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-66 | major | RISK-039, T-069 | only the SDK is pinned; the desktop-bundled Claude Code version is unchecked; usage call reads the claude.ai endpoint (latency, failure) | record claude_code_version; a version change repeats the T-069 check (conductor decision: record, not refuse); endpoint latency in RISK-039 | open |
| CR-67 | major | T-069 step 6(a) | the assumption test cannot tell a usage call from a normal side call | compare session.model_usage between readings; probe: two back-to-back requests give equal costs | open |
| CR-68 | major | T-069 step 6, IF-010 TS-224 row, NFR-105, DOD-012 | the paid check runs TS-224 at 1.50 USD outside the runs its exception allows | name C002-T-069 step 6 (one session) in the TS-224 row, NFR-105 and DOD-012 (conductor decision, within P-01's approved spend) | open |
| CR-69 | minor | T-069 step 6(c), (d) | search misses turn-cap wording; no fallback if TS-216 doesn't reach the cap | add turn terms; state the fallback | open |
| CR-70 | minor | registry | tasks.total 68 stored, 69 expected | sdd status --write | open |
