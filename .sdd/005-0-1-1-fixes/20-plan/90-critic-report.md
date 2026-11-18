---
artifact: critic-report
change: CHG-005
phase: 20-plan
reviewed_ids: all
---
# Critic report — CHG-005 20-plan

Step 7 review of the lite plan (`20-plan/plan.md`, `20-plan/handoff.md`, C005-ADR-001, C005-ADR-002,
`20-plan/evidence/impact.md`, `20-plan/questions-log.md`) against the approved spec (`10-spec/spec.md`, `10-spec/dod.md`,
G2 2026-11-17), the constitution, and the repository code that the plan relies on (read only to confirm claims).
`sdd lint 005 --phase 20-plan --json`: 0 errors, 0 warnings, 0 info (`"tool": "architect-plugin@0.1.0"`). `sdd trace 005`:
TR-01 … TR-08 at 100 % (TR-06 26/26, TR-07 23/23, TR-08 74/74), TR-11 acyclic. `85-open-items.md`: 0 markers. P-01's
answers Q-adr001-01, Q-budget-01, Q-budget-02, Q-budget-03, Q-riskclass-01, Q-waiver-01 and Q-opencode-01 are taken as
given and not reopened. Finding IDs continue at CR-27.

## Summary
| blocker | major | minor |
|---|---|---|
| 1 | 4 | 6 |

## Findings

### CR-27 — The Copilot release check of 0.1.1 needs evidence that no task produces: a Copilot CLI injection summary (a paid run outside every decided budget) and a checklist record where the check looks for it
- **Severity:** blocker
- **Refs:** C005-REQ-118, C005-T-018, C005-T-021, C005-RISK-012
- **Evidence:** "  - add `docs/releases/copilot/0.1.1/` › checklist candidate report with the injection steps, and the replay reports `replay-copilot-hooks.json`, `replay-sdd-mcp-server.json`, as for 0.1.0" — `20-plan/plan.md:736`; "C005-T-018 produces every piece the check reads and runs the dry run before publish" — `20-plan/plan.md:988`. The check takes the injection evidence from the checklist only in another mode: "const fromChecklist = target === "copilot" && (mode === "copilot-hooks" || !s08LoadsPackage);" — `scripts/release/check.ts:223`; the mode and spike outcome in force: "enforcement_mode: sdd-mcp-server" — `docs/spikes/S-08-copilot-vscode.md:12`, "copilot_cli_loads_package: true" — `:9`; otherwise: "if (summary === null) missing("injection summary", injectionPath);" — `scripts/release/check.ts:282`, with "export const MIN_INJECTION_CASES = 20;" — `:35`. Release 0.1.0 met it with a Copilot CLI run: ""source": "copilot-cli-runner"," and ""cases": 23," — `docs/releases/copilot/0.1.0/release.json:51`, `:55`. The checklist record is read from another folder: "export const RECORDS_DIR = "docs/checklists/records";" — `scripts/release/check.ts:32`, file name "vscode-<date>-<version>.md" (`scripts/release/evidence.ts:132-134`; 0.1.0: `docs/checklists/records/vscode-2026-11-13-0.1.0.md`, `release.json:59`). Host versions must equal the tested ones, else ERR-REL-006 (`scripts/release/check.ts:144-148`). The impact survey said so: "0.1.1 needs the same set" — `20-plan/evidence/impact.md:127`; "Includes paid injection evals and manual runs under the release check (E-133)" — `impact.md:166`. The budget covers only Claude Code evals: "- Budget: Q-budget-01, "DOD-G-01 floor": one dev run of each of the 25 Claude Code `@eval` scenarios of C005-DOD-001" — `20-plan/plan.md:146`. The spec says of Copilot CLI: "and this change does not use it: agent" / "behaviour in Copilot VS Code is checked by recorded manual runs (Q-vscode-01)." — `10-spec/spec.md:18-19`.
- **Why it matters:** followed as written, the dry run of C005-T-018 step 3 prints `refused` with ERR-REL-009 (injection summary missing at `docs/releases/copilot/0.1.1/injection.json`) and ERR-REL-003 (no 0.1.1 checklist record in `docs/checklists/records/`). C005-T-021 then cannot release the Copilot target package, and C005-REQ-118, a Must, is not met. No exception path exists for this mode (`scripts/release/check.ts:308-309` sets an exception only under `copilot-hooks`). The missing piece is a paid run of at least 20 injection cases through the Copilot CLI eval runner, at the Copilot CLI version of the S-08 record. Neither Q-budget-01 nor Q-budget-02 nor C005-ADR-002 covers it, and the spec sentence above has to be reconciled with it. Adding it after G3 changes `plan.md` and costs another revision and G3 approval, with the working-tree CLI. So P-01 must decide before G3 (question Q-injection-01).
- **Suggested fix:** once P-01 answers Q-injection-01, extend C005-T-018 (or add a task before it): run the Copilot CLI injection suite of 0.1.0 (23 cases) against the 0.1.1 package, writing `docs/releases/copilot/0.1.1/injection.json`, with a per-run cap, a cost estimate and a stop rule like C005-T-014 step 3. Put the checklist record at `docs/checklists/records/vscode-<YYYY-MM-DD>-0.1.1.md`. Name the tested host versions that the manual runs and the injection run must use (or the S-08 update that changes them). Add the cost to "Evals and budget", and add ERR-REL-006 version drift to the trigger of C005-RISK-012. If P-01 instead drops the Copilot package from 0.1.1, that changes C005-REQ-118 and needs `/architect:revise spec`.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-28 — The "working-tree CLI only" rule binds the implementer's hand-off, not the 0.1.0 plugin agents and commands that run `stale check` on their own
- **Severity:** major
- **Refs:** C005-RISK-001, C005-T-002, C005-REQ-122
- **Evidence:** "   From then on every hashing command on this change runs the CLI built from the working tree, never the 0.1.0" — `20-plan/plan.md:24`; RISK-001 mitigation: "the hand-off's Reporting protocol limits hashing commands on this workspace to the working-tree CLI until the plugin is 0.1.1" — `20-plan/plan.md:977`. The 0.1.0 plugin text that the conductor dispatches hard-wires the plugin CLI: "`;`, `|` or redirection; `sdd` is `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"`):" and "3. `sdd stale check <NNN>`" — `plugins/architect/agents/sdd-auditor.md:13`, `:17`; "1. Run `sdd trace <NNN> --write` and `sdd lint <NNN> --phase <phase>` (or have the auditor run" — `plugins/architect/skills/gate-protocol/SKILL.md:20`; "--resolution "<text>"`) and run `sdd stale check <NNN>`; the later phases are re-approved or" — `plugins/architect/commands/revise.md:20`; "2. Entry check before anything else: run `sdd stale check <NNN>` and read `change.md`. If" — `plugins/architect/commands/plan.md:13`. The spec asked for all of them: "and runs every later `sdd stale check`," / "`sdd gate approve`, `sdd gate show` and `sdd archive` of CHG-005 with that CLI (or updates the installed plugin to" / "0.1.1 first)" — `10-spec/spec.md:2189-2191`.
- **Why it matters:** after C005-T-002, the stored 20-plan hash leaves out every Status line, and the 0.1.0 rule includes them. So any `stale check` by the 0.1.0 CLI sets CHG-005's `20-plan` stale, whether or not a task was reported since (C005-REQ-122 rationale, `10-spec/spec.md:314`). The likeliest trigger is not the implementer but the conductor: an auditor dispatch, `/architect:revise`, or a routine stale check after `.sdd/` edits, all of which run the installed 0.1.0 CLI. Each one costs a revision and a G3 approval by P-01 (rollback step 4). The plan names RISK-001's owner as the conductor but gives the conductor no instruction. It also has no step that ends the restriction by installing plugin 0.1.1 after C005-T-021.
- **Suggested fix:** in Strategy rule 1 and the RISK-001 mitigation, state that until the installed plugin is 0.1.1 the conductor does not dispatch `sdd-auditor` for CHG-005 and does not run `/architect:revise`, `/architect:gate`, `/architect:plan` or an unnumbered `sdd stale check` with the plugin CLI. Instead it runs the auditor's four commands itself with `node plugins/architect/scripts/sdd.mjs`. Add to C005-T-021 (or C005-T-022) a P-01 step that installs the released 0.1.1 plugin and checks `sdd --version` through the conductor, after which the restriction ends.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-29 — C005-T-002 cannot meet its own done-check in the step order given, and a multi-line report note would undo the re-approval it records
- **Severity:** major
- **Refs:** C005-T-002, C005-REQ-121, C005-IF-005
- **Evidence:** "  5. Report this task `done` with the working-tree CLI, then run `node plugins/architect/scripts/sdd.mjs stale check 005`; `20-plan` stays approved (the live case of C005-TS-171)." — `20-plan/plan.md:250`; "  - [ ] The outputs of steps 1 and 5 are recorded in this task's report note" — `20-plan/plan.md:255`. A done task only reopens: "  done: ["in-progress"]," — `src/tracking/task.ts:19`. `stale check` prints one line per approved phase (`src/cli/commands.ts:286-289`, three lines for CHG-005), and `task set` writes the note verbatim: "  if (f >= 0) lines[f] = `- **${name}:** ${value}`;" — `src/tracking/task.ts:93`. Continuation lines are hashed: "- **Kept:** every other line." — `10-spec/spec.md:1605`. Step 2 states "The plan content does not change." — `20-plan/plan.md:247`, while the per-ID hashes still cover report lines ("**§3 Per-ID content hash** (step 5) unchanged" — `10-spec/spec.md:1638`), and `gate show` prints that impact for a phase in revision (`src/gate/gate.ts:101`, `src/gate/revise.ts:25`). Other tasks also ask for figures in the note: "  - [ ] Sizes before and after are in the report note, inside the limits of C005-DOD-004" — `20-plan/plan.md:517` (also `:578`).
- **Why it matters:** the output of step 5 exists only after the `done` report, so recording it in the note means reopening the task or editing the field by hand. Either way the note gets written after the check it documents. If the implementer pastes the multi-line `stale check` output into `--note`, the lines after the first begin with none of the four report-field texts. C005-IF-005 §2 keeps them in the hash, so the next stale check sets `20-plan` stale: the failure that C005-T-002 exists to remove. The same applies to any multi-line note on this lite plan. Also, in step 4 P-01 will see "Impact since last approval: modified C005-T-001" (and C005-T-002 if it is in progress), although step 2 says the content does not change.
- **Suggested fix:** record the outputs of steps 1 and 5 in `docs/release-0.1.1-evidence.md` (or in the gate note of step 4) instead of the report note, and reword the done-check to match. Add a rule to the hand-off's Reporting protocol and Rules: every `--note` and every hand-edited Notes field is a single line. In step 4, tell P-01 that the revision impact lists the reported tasks only because of their report fields (C005-IF-005 §3).
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-30 — C005-ADR-002 is still `proposed`, keeps text from before P-01's answers, and miscounts the regression sessions; after G3 any fix makes 20-plan stale
- **Severity:** major
- **Refs:** C005-ADR-002, C005-T-014, C005-T-015
- **Evidence:** "status: proposed" — `20-plan/20-decisions/ADR-002-eval-risk-classes.md:6`, against "C005-ADR-002, the release ADR of this change (accepted," — `20-plan/plan.md:149` and the precondition "C005-ADR-002 accepted (Q-riskclass-01)." — `20-plan/plan.md:620`; P-01's answer "Accept rule A (Recommended)" — `20-plan/questions-log.md:67`. C005-ADR-001 records its acceptance ("status: accepted" — `ADR-001-new-change-skill.md:6`; "Accepted by P-01 on 2026-11-17: Q-adr001-01" — `:76`); C005-ADR-002 has no such line. Stale text: "(plan, Test mapping: "the ADR decides")" — `ADR-002-eval-risk-classes.md:15`; "(plan, Test mapping, "HR candidate")" — `:35` (neither string is in `plan.md`); "P-01's decision (question Q-budget-03 of this hand-back)" — `:142`, already answered "First session only (Recommended)" (`questions-log.md:77`); "- Step 2 of C005-T-014 names the extent of the toy-g3 run once P-01 has answered Q-budget-03." — `:175`. Count: "| Regression rows other than toy-g3, one run each (Q-budget-02); …| 11 |" — `:131`, while the plan names ten files besides toy-g3 (`plan.md:623`, `:651`).
- **Why it matters:** C005-T-014 and C005-T-015 may start only once the ADR is accepted, and the ADR itself says it is not. DOD-G-01 takes its high-risk class from "the change's release ADR", so the release evidence would rest on a proposed decision. The ADR sits inside the 20-plan approval hash. Correcting its status or text after G3 makes `20-plan` stale and costs another revision and G3 approval, with the working-tree CLI. The count gives "about 159" sessions where the listed runs make 158. The error is small, but it is the figure that the stop rule is checked against.
- **Suggested fix:** before G3, set `status: accepted` and add "Accepted by P-01 on 2026-11-17: Q-riskclass-01, answer "Accept rule A (Recommended)"" to the Decision outcome. Replace the "Test mapping" and "HR candidate" references with the Classification table. State Q-budget-03's answer (first session only, 0.27 USD) in Expected cost and drop the follow-up bullet. Correct the regression row to 10 sessions, or name the eleventh, and carry the total into `plan.md` "Evals and budget".
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-31 — The `sdd` fixture of C005-TS-120 and C005-TS-121 sits on the case PATH, but the planner's `sdd` is the plugin CLI by path, so the Given "sdd --version prints 0.1.1" never holds
- **Severity:** major
- **Refs:** C005-T-007, C005-TS-120, C005-TS-121, C005-TC-020, C005-TC-021
- **Evidence:** "  - add a case fixture under `evals/chg005/` for C005-TS-120 and C005-TS-121: an `sdd` first on the case PATH whose `--version` prints `0.1.1` (C005-TC-020, C005-TC-021)" — `20-plan/plan.md:405`; "The fixture is needed because the floor runs of C005-T-015 come before the version bump of C005-T-016, so the working-tree CLI still prints 0.1.0 then; the cases assert the install line `architect-sdd@0.1.1`." — `20-plan/plan.md:408`. Every agent preloads: "`sdd` means `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"`." — `plugins/architect/skills/sdd-conventions/SKILL.md:13`. The scenario: "Given a case workspace on Claude Code where "sdd --version" prints "0.1.1"" — `10-spec/spec.md:742`. The harness copies the plugin under test (`evals/harness/plugin-eval.mjs:128`) and also offers plugin overlays (`evals/harness/machines.mjs:2`, `:14`).
- **Why it matters:** the planner runs `node "<plugin root>/scripts/sdd.mjs" --version`, which in the case's plugin copy prints 0.1.0 until C005-T-016. A PATH shim named `sdd` is never called. The two cases then fail their `architect-sdd@0.1.1` assertion, or pass only when the model happens to run a bare `sdd`. The dev runs of C005-T-007 should expose this, but the plan has no alternative ready. The floor runs (6 sessions near the 0.50 USD cap) would be paid for nothing, and a fix after G3 changes `plan.md`.
- **Suggested fix:** give the two cases a plugin overlay whose `scripts/sdd.mjs` answers `--version` with `0.1.1` and passes every other call to the working-tree bundle, or a case plugin copy built with `plugin.json` at 0.1.1, as C005-TS-117 does for the integration test. Check in the C005-T-007 done-check that the planner's own call printed 0.1.1. Alternatively, run the floor runs of these two cases after C005-T-016, when no text changes any more.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-32 — C005-T-019 compares the tarball integrity with a value that C005-T-016 never records
- **Severity:** minor
- **Refs:** C005-T-019, C005-T-016
- **Evidence:** "- **Preconditions:** C005-T-017 and C005-T-018 done; the integrity of `dist/architect-sdd-0.1.1.tgz` equals the one noted in C005-T-016." — `20-plan/plan.md:761`; the steps, targets and done-checks of C005-T-016 (`20-plan/plan.md:677`, `:680-684`, `:691-694`) record check output, coverage and sizes, but no integrity. The 0.1.0 procedure computed and noted it: "Note the integrity value (`sha512-…`) that the last" — `docs/release-procedure-0.1.0.md:64`.
- **Why it matters:** P-01's pre-publish check has no reference value, so a tarball rebuilt between C005-T-016 and C005-T-019 could be published unnoticed. An npm version cannot be replaced (C005-RISK-008).
- **Suggested fix:** add to C005-T-016 step 4 the `sha512-` integrity computation of `dist/architect-sdd-0.1.1.tgz`, record it in section "Check" of `docs/release-0.1.1-evidence.md`, and add a done-check for it.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-33 — C005-T-015 waits on a step of C005-T-014, an edge the dependency graph and the critical path do not show
- **Severity:** minor
- **Refs:** C005-T-015, C005-T-014, C005-T-007
- **Evidence:** "Before C005-T-015 starts, check the dev-run costs of C005-T-007" — `20-plan/plan.md:624`; "A planner case starts only after P-01's decision on any cap exception asked in step 3 of C005-T-014." — `20-plan/plan.md:650`; "- **Depends on:** C005-T-007, C005-T-009, C005-T-011, C005-T-012, C005-T-013" — `20-plan/plan.md:637`.
- **Why it matters:** the graph presents C005-T-014 and C005-T-015 as parallel. In fact the planner cases of C005-T-015 wait for step 3 of C005-T-014, which comes after its 51 floor sessions. The check needs only the dev-run costs of C005-T-007, which its own done-check already records (`20-plan/plan.md:420`). An implementer who starts C005-T-015 first, as the graph allows, skips the cap check.
- **Suggested fix:** move the cap-exception check into the Preconditions of C005-T-015 (or into the done-checks of C005-T-007), and remove it from step 3 of C005-T-014.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-34 — No route is stated for a defect found after the release commit, when Strategy rules 5 and 6 assume the text is final
- **Severity:** minor
- **Refs:** C005-RISK-012, C005-T-016, C005-T-018, C005-T-020
- **Evidence:** "5. **Evals once, on final text.** The floor runs of DOD-G-01 (C005-T-014, C005-T-015) start when all agent text and" — `20-plan/plan.md:35`; "The **release commit** is the" / "commit that completes C005-T-016; later release tasks change only `docs/`, `CHANGELOG.md` and `.sdd/`" — `20-plan/plan.md:38-39`; "a failed manual run becomes a defect before C005-T-019" — `20-plan/plan.md:988`.
- **Why it matters:** the manual VS Code runs (C005-T-018) and the local three-shell pre-check (C005-T-016 step 4) come after the floor runs. A failure there that needs a text or code fix changes `plugins/` after the release commit. The plan does not say which tasks reopen (C005-T-016, the floor cases of C005-T-014 and C005-T-015 that the edit touches, C005-T-018), whether the fix needs another paid batch inside the Q-budget-01 envelope, or how the verification of C005-T-017 (`git diff --stat <release commit> HEAD -- src scripts plugins`) is rebased.
- **Suggested fix:** add one paragraph to Rollout and rollback. A fix after the release commit reopens the owning task and C005-T-016. It reruns the floor cases whose text changed, charged to the reserve of C005-ADR-002 under the same stop rule. It reruns C005-T-018, and the new C005-T-016 commit becomes the release commit.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-35 — Rollback steps 1, 3 and 5 omit the hash-rule mismatch they create
- **Severity:** minor
- **Refs:** C005-RISK-001, C005-REQ-125, C005-T-001
- **Evidence:** "move `latest` back with `npm dist-tag add architect-sdd@0.1.0 latest`," — `20-plan/plan.md:172`; "3. **Claude Code plugin misbehaves** (after C005-T-021): reinstall the previous plugin version from the local" — `20-plan/plan.md:176`; "5. **A `src/` task breaks the check after its commit**: revert that task's commit, the bundle included" — `20-plan/plan.md:181`; the release notes must say "that the approval holds only while every later `sdd stale check` of the change runs the sdd CLI 0.1.1" — `10-spec/spec.md:367`.
- **Why it matters:** steps 1 and 3 put users, and P-01, back on the 0.1.0 CLI. Its first stale check sets stale every lite `20-plan` approved under 0.1.1, CHG-005's own included if it is not yet archived. Step 5 applied to C005-T-001 after C005-T-002 reverts the hash rule in the working-tree CLI, so CHG-005 goes stale at the next stale check. None of the steps names this consequence or its remedy.
- **Suggested fix:** add to steps 1 and 3 that lite changes approved under 0.1.1 must not be stale-checked with the 0.1.0 CLI (or need one more G3 approval), and that the deprecation notice says so. Add to step 5 that reverting C005-T-001 after C005-T-002 needs C005-T-002 repeated once the fix is committed.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-36 — The CHG-003 carry note of C005-TS-156 is not committed, and no gate or task will commit it
- **Severity:** minor
- **Refs:** C005-DOD-001, C005-TS-156, C005-T-022
- **Evidence:** "is carried to CHG-003 (Q-opencode-01; carry note in `.sdd/003-opencode-release/change.md`)" — `10-spec/dod.md:16`; `git diff --stat` at review time: ".sdd/003-opencode-release/change.md           |    2 +" (the note is in the working tree only, not in the G2 commit `b51cc34`); "The conductor approves with `sdd gate approve … --commit`, which commits only the change folder," — `.sdd/_constitution/constitution.md:92` (`src/gate/commit.ts:35`).
- **Why it matters:** the G3 commit takes only `.sdd/005-0-1-1-fixes/`, `SDD.md` and `registry.json`, so the carry record that C005-DOD-001 and the waiver decision of C005-T-022 rely on stays uncommitted. A checkout or a revert loses it, and the record of CR-26's resolution has no history.
- **Suggested fix:** have the conductor commit `.sdd/003-opencode-release/change.md` on its own (message naming CHG-005 and Q-opencode-01) before G3, or name that commit as a step of C005-T-022.
- **Status:** open — with P-01, not a plan defect (re-review 2026-11-17; see Re-review)

### CR-37 — Two residuals of the spec fixes: F5 does not list C005-TS-173 and C005-TS-174 (CR-22), and the addendum's scope sentence still names four topics (CR-24)
- **Severity:** minor
- **Refs:** C005-TS-173, C005-TS-174, C005-REQ-124
- **Evidence:** the F5 row ends "…C005-TS-160, C005-TS-161, C005-TS-162, C005-TS-163 |" — `10-spec/spec.md:1841`, and the F5 diagram note ends "C005-TS-161, C005-TS-162, C005-TS-163" — `10-spec/spec.md:2077`, while "Each diagram's note names the scenarios (TS IDs) the flow realizes." — `10-spec/spec.md:1845`; "Scope: the four open items of the 10-spec brief (step 2):" — `10-spec/evidence/spec-addendum.md:10`, while the file holds "## 5. Topic 5 — lite approval hash" — `:261`.
- **Why it matters:** neither residual changes behaviour. The plan maps C005-TS-173 and C005-TS-174 (C005-T-011, C005-T-014, C005-TC-071, C005-TC-072), and the statements, glossary and scenarios of CR-22 and CR-24 hold. But the approved spec now gives two incomplete scenario lists for flow F5. The constitution sends a spec problem found after approval through a defect and a revision, and DOD-G-07 needs that defect closed before the archive.
- **Suggested fix:** either P-01 accepts both as navigation text with no effect, or the conductor records a spec defect on C005-TS-173. In that case, run the 10-spec revision before C005-T-002, so that the one G3 re-approval of C005-T-002 also covers it. This is no reason for a standalone `/architect:revise spec`.
- **Status:** open — with P-01, not a plan defect (re-review 2026-11-17; see Re-review)

## Spec-hold check (CR-13, CR-22 … CR-26; spec approved at G2 2026-11-17)

| Finding | Holds in the approved spec | Evidence |
|---|---|---|
| CR-13 | yes | C005-REQ-126 owns the lint result and puts a lint change in scope (`10-spec/spec.md:189-196`). The Then of C005-TS-111 compares the findings with and without the log, for 3 rows (`:663-671`). C005-TS-175 keeps an unresolved reference's finding (`:674-679`). C005-IF-004 item 5 makes it binding (`:1569-1573`). The C005-REQ-103 open item is gone |
| CR-22 | yes, with a residual | C005-REQ-102 takes the kind "in the new-change round or in a further round of C005-REQ-124" (`:147`). C005-REQ-124 covers further rounds and the decline (`:165-166`). The glossary entries are aligned (`40-domain/glossary-delta.md:18-19`). C005-TS-173 covers the second unusable answer (`:562-568`). Residual: F5 lists (CR-37) |
| CR-23 | yes | C005-COMP-013 realizes C005-REQ-118, C005-REQ-120 and C005-REQ-125 (`:1828`). C005-COMP-009 keeps C005-REQ-122 (`:1786`). The G-6 row names C005-REQ-125 (`:2177`) |
| CR-24 | yes, with a residual | C005-REQ-116 rationale (`:323`), abuse cell citing C001-IF-01 (`:1219`), Context "E-54…E-103" (`:20`). Residual: addendum scope sentence (CR-37) |
| CR-25 | yes | C005-REQ-122 rationale (`:314`), C005-REQ-125 statement (`:367`), C005-TS-172 third Then (`:1194`), C005-DOD-007 (`dod.md:22`), "Left to 20-plan" item 4 (`:2185-2191`) |
| CR-26 | yes in `dod.md`; the record is uncommitted | C005-DOD-001 (`dod.md:16`) and DOD-G-01 (`dod.md:28-32`) name the carry and the waiver at close. The CHG-003 note exists (`.sdd/003-opencode-release/change.md:32`) but is not committed (CR-36) |

No spec defect found here needs `/architect:revise spec` before G3.

## Rubric
| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: TR-06 26/26. Each of C005-REQ-101 … C005-REQ-126 is in an Implements field, and C005-NFR-001 is in C005-T-020 |
| plan | P2 Each task has targets, verification and done-checks | CR-29, CR-32 |
| plan | P3 Dependency graph acyclic, milestones coherent | CR-33, CR-34 (graph acyclic, TR-11; critical path of 13.5 days recomputed from the estimates and correct) |
| plan | P4 Every scenario maps to a planned test | CR-31 (TR-08 74/74; C005-TS-156 mapped to C005-TC-075 and carried, Q-opencode-01) |
| plan | P5 Risks cover the hotspots touched | CR-27, CR-28 (every hotspot of `evidence/impact.md` has a risk; the gaps are in the mitigations of C005-RISK-001 and C005-RISK-012) |
| plan | P6 Rollout and rollback stated | CR-27, CR-35 |
| plan | P7 ADRs for every remaining technical decision | CR-30 (C005-ADR-001 complete and accepted; the TS-120/TS-121 fixture design is covered by CR-31) |

## Checked, not findings
- **Dogfood order.** C005-T-001 has no dependency. Its precondition and stage 1 of the hand-off forbid reports and hashing
  commands before its commit. C005-T-002 follows it directly: stale check, `change revise`, lint, `gate approve`, all with
  the working-tree CLI. Every task after it depends on C005-T-002, so the re-approval comes long before the archive task
  C005-T-023, which re-checks staleness first. I confirmed in the code that only `stale check` writes `stale`
  (`src/gate/stale.ts:42-45`, sole caller `src/cli/commands.ts:280`). `gate show` only reads, and `gate approve` needs no
  `in-review` status (`src/gate/gate.ts:129-144`). Stage 2's command list is therefore complete for the implementer. The
  conductor side is CR-28.
- **Hand-off without the plugin.** Stage 2 runs the tracked bundle from the repository root and needs Node.js only, not the
  Architect plugin. Stage 3 starts once `architect-sdd` 0.1.1 is on npm. The fallback gives the exact lite field forms. The
  CHG-005 hand-off itself departs from C005-REQ-105 and C005-REQ-107 (plugin-path lines first, version 0.1.1 ahead of
  `sdd --version`) on purpose and says why. It passes LINT-HAND-003 once that rule exists (install line with `0.1.1`, so a
  revision under rollback step 4 stays lint-clean).
- **Release order.** C005-T-019 (npm) precedes C005-T-021 (both hosts), as in `docs/release-procedure-0.1.0.md:25-27`. The
  tag is set on a commit whose `src/`, `scripts/` and `plugins/` equal the release commit.
- **Budget.** Dev runs: 7 + 10 + 6 + 5 = 28. Floor runs: 51 + 47 = 98, matching C005-ADR-002. Regression: 11 evals split
  3 / 8 between C005-T-014 and C005-T-015, toy-g3 first session only (Q-budget-02, Q-budget-03). Expected about
  48.50 USD, inside the 30–60 USD envelope of Q-budget-01, with a per-run cap and a stop-and-ask rule. Q-waiver-01 is applied
  in C005-T-022 step 3. Only the ADR row count is off (CR-30), and the Copilot spend is missing (CR-27).
- **Test mapping.** All 75 TC rows give level, location, data, environment, runs and executor. The run counts follow
  C005-ADR-002: high-risk floor 10 for C005-TC-008 and C005-TC-009, floor 3 elsewhere, per Examples row for C005-TC-012
  and C005-TC-059. The workaround of C005-TC-074 (NFR case in a TS cell) is explained.

## Re-review — 2026-11-17 (focused, step 7)

Focused re-review of the revised plan against CR-27…CR-37, and of the new content: C005-T-024 and C005-TC-076, the
conductor rule and its end at C005-T-021 step 5, the reordered C005-T-002 and the single-line note rule, the plugin
overlay fixture `evals/chg005/plugin-sdd-0-1-1.mjs`, the accepted C005-ADR-002, and the rollout and rollback changes.
Inputs: `20-plan/plan.md`, `20-plan/handoff.md`, C005-ADR-001, C005-ADR-002, `20-plan/questions-log.md` (rounds 1–4),
`20-plan/80-traceability.md`, `20-plan/85-open-items.md`; `10-spec/spec.md` and `10-spec/dod.md` read only. Repository
code read only to confirm claims: `scripts/release/check.ts`, `evals/harness/run.mjs`, `evals/harness/overlay.mjs`,
`evals/harness/caps.mjs`, `evals/harness/runners/copilot-cli.mjs`, `evals/cap06/planner.mjs`,
`plugins/architect/hooks/hooks.json`, `plugins/architect/.mcp.json`, `plugins/architect/targets/copilot.json`,
`docs/spikes/S-08-copilot-vscode.md`, `src/hooks/guard-path.ts`, `src/hooks/guard-bash.ts`, `src/hooks/input.ts`,
`src/gate/gate.ts`, `src/gate/critic-parse.ts`, the C002-T-081 task file and `evals/results/spend-chg002.json`.
`sdd lint 005 --phase 20-plan --json`: 0 errors, 0 warnings, 0 info (`"tool": "architect-plugin@0.1.0"`). `sdd trace 005`:
TR-06 26/26, TR-07 24/24, TR-08 74/74, TR-11 acyclic. P-01's answers of rounds 1–4, among them Q-injection-01 ("Run
injection suite (Recommended)", `questions-log.md:90`) and Q-copilot-cost-01 ("Up to the 50€ overage", `:100`), are
taken as given and not reopened. New findings continue at CR-38.

**Reviewed set.** C005-T-001 (rollback step 5), C005-T-002, C005-T-007, C005-T-010, C005-T-012, C005-T-014,
C005-T-015, C005-T-016, C005-T-017, C005-T-018, C005-T-019, C005-T-021, C005-T-022, C005-T-023, C005-T-024;
C005-TC-020, C005-TC-021, C005-TC-076; C005-TS-108, C005-TS-120, C005-TS-121, C005-TS-152, C005-TS-156, C005-TS-173,
C005-TS-174; C005-REQ-118, C005-REQ-122, C005-REQ-125; C005-AC-118.1; C005-DOD-001, C005-DOD-005; C005-RISK-001,
C005-RISK-007, C005-RISK-012; C005-ADR-002; C005-COMP-013; Strategy rules 1, 5 and 6, "Evals and budget", "Rollout and
rollback", the critical path and milestone 4 of `plan.md`; Reading order, Rules, Reporting protocol and Ordered task
list of `handoff.md`.

### Status of CR-27 … CR-37

| Finding | Status | Evidence |
|---|---|---|
| CR-27 (blocker) | resolved | C005-T-024 runs "the Copilot CLI injection case set of release 0.1.0 (`INJ-01` … `INJ-22` and `TS-359`, 23 cases; the release check needs at least 20)" so that the runner writes `docs/releases/copilot/0.1.1/injection.json` (`plan.md:791`, `:793`), at Copilot CLI 1.0.98 (`:796`), under the spending rule of Q-copilot-cost-01 with a per-session cap and a stop before each batch (`:798`); C005-TC-076 maps it (`:1050`). The runner takes the summary's version folder from `plugin.json` at run time (`evals/harness/run.mjs:1026-1027`), so the place after C005-T-016 is right. The checklist record goes to `docs/checklists/records/vscode-<YYYY-MM-DD>-0.1.1.md` (`plan.md:823`), the folder and form the check reads (`scripts/release/check.ts:31-32`, `:238`). Host versions are checked before the release commit (`plan.md:735`) and match `plugins/architect/targets/copilot.json:8` and `docs/spikes/S-08-copilot-vscode.md:5`. ERR-REL-006 is in the trigger of C005-RISK-012 (`plan.md:1087`). The Copilot spend is in "Evals and budget", outside the Q-budget-01 envelope (`:185-192`). The spec's Copilot CLI sentence is read as concerning agent behaviour (`:187-188`); the option of Q-injection-01 that needed a spec revision was option 2 (`questions-log.md:87`). The suite is a task of its own before C005-T-018 instead of a step "in C005-T-018" (`questions-log.md:86`); the content of the answer (suite, per-run cap, stop rule) is met. Residual: CR-39 |
| CR-28 (major) | resolved | Strategy rule 1 binds the conductor and says what it runs instead (`plan.md:24-37`); the same rule in the hand-off Rules (`handoff.md:39-43`) and stage 2 (`:52-58`); C005-T-002 intent (`plan.md:290`); C005-RISK-001 mitigation (`:1076`). The rule ends at C005-T-021 step 5 with a checked `--version` (`:908`, `:912`, `:916`) and in the exit criterion of milestone 4 (`:75`); rollback step 3 brings it back (`:212-215`). No plugin hook runs a stale check: the hooks call `guard-path`, `guard-bash`, `hook post-write`, `trace --quiet --write --active` and `hook session-start` (`plugins/architect/hooks/hooks.json:7-28`), and only `stale check` writes `stale` (`src/gate/stale.ts:44`, sole caller `src/cli/commands.ts:280`). Residual for other lite changes: CR-38 |
| CR-29 (major) | resolved | C005-T-002 stays `todo` until step 5 (`plan.md:295`), reports `in-progress` after the approval and then stale-checks (`:301`), writes the outputs into section "Dogfood" of `docs/release-0.1.1-evidence.md` and commits (`:302`), then reports `done` with a one-line note (`:303`); the done-checks match (`:308-310`). Step 4 tells P-01 why C005-T-001 shows as modified (`:300`). The single-line rule is in the hand-off Rules (`handoff.md:35-37`), stage 2 (`:58`) and the fallback (`:84-85`). The size figures of C005-T-010 and C005-T-012 moved to the evidence file (`plan.md:571`, `:633`) |
| CR-30 (major) | resolved | "status: accepted" (`ADR-002-eval-risk-classes.md:6`) and "Accepted by P-01 on 2026-11-17: Q-riskclass-01, answer "Accept rule A (Recommended)"" (`:71`). The candidates are marked in the Classification table (`:32-34`); Q-budget-03's answer is stated (`:148-151`) and its follow-up bullet is gone. The regression row has 10 sessions and lists them (`:132`, `:136-143`). Recomputed: 28 + 51 + 47 + 21 + 10 + 1 = 158 sessions; 8.55 + 12.75 + 17.10 + 6.30 + 3.24 + 0.27 = 48.21 USD expected; worst 83.80 USD (`:134`). `plan.md:173-174` and C005-T-014 step 3 (`:679`) carry about 158 sessions and about 48.20 USD |
| CR-31 (major) | resolved | `evals/chg005/plugin-sdd-0-1-1.mjs` copies the overlay plugin and replaces its `scripts/sdd.mjs` with a wrapper that prints `0.1.1` for `--version` (`plan.md:458`, `:461`); C005-TC-020 and C005-TC-021 name it (`:994-995`), and a done-check confirms the planner's own call (`:471`). The design fits the harness: a case's `plugins` entry may be a function that returns a folder (`evals/cap06/planner.mjs:7`, `evals/harness/run.mjs:96`), and `build()` copies the source plugin (`evals/harness/overlay.mjs:115-117`). Residual: CR-40 |
| CR-32 (minor) | resolved | C005-T-016 step 5 computes and records the `sha512-` integrity (`plan.md:739`), with a done-check (`:751`); P-01 compares it before publishing (`:851`) and after (`:855`) |
| CR-33 (minor) | resolved | the cap check is a precondition of C005-T-015 and holds back only the planner cases (`plan.md:703`, `:705`); step 3 of C005-T-014 no longer holds it (`:679`); C005-ADR-002 Consequences agrees (`ADR-002-eval-risk-classes.md:169-172`) |
| CR-34 (minor) | resolved | paragraph "Fix after the floor runs or the release commit" (`plan.md:225-232`): defect, reopen, rerun of the changed floor cases from the reserve under the stop rule, new release commit, C005-T-017 verification against it, C005-T-024 and C005-T-018 rerun. Residuals: CR-39, CR-41 |
| CR-35 (minor) | resolved | rollback step 1 (`plan.md:203-209`), step 3 (`:212-215`) and step 5 (`:219-223`) name the hash consequence and the remedy |
| CR-36 (minor) | open — with P-01, not a plan defect | `git diff --stat -- .sdd/003-opencode-release/change.md` still prints "1 file changed, 2 insertions(+)". The plan relies on the carry (`plan.md:62-64`, `:935`) and gives no commit step, as the brief leaves it to P-01. The `gate approve … --commit` of C005-T-002 step 4 (`plan.md:300`) commits only the change folder (`.sdd/_constitution/constitution.md:92-94`), so that commit does not take the note either |
| CR-37 (minor) | open — with P-01, not a plan defect | The spec is unchanged (`10-spec/spec.md:2077` still ends "C005-TS-161, C005-TS-162, C005-TS-163") and `change.md:15` holds "defects: []". The plan handles it: the hand-off says both scenarios still bind (`handoff.md:14-15`), and C005-T-002 step 2 runs a 10-spec revision first if P-01 records the defect, so that one G3 approval covers both (`plan.md:298`) |

Other checks, not findings:
- **Copilot pool of the harness.** C002-T-081 left the `copilot` pool at "pool 12.62/30"
  (`.sdd/_archive/002-multi-platform-targets/20-plan/50-tasks/T-081-release-candidate-0-1-0-after-d051-d053.md:16`), and
  five C002-T-082 entries follow (`evals/results/spend-chg002.json:9534-9686`). A worst case of 12.65 USD could reach the
  30 USD stop of the harness; C005-T-024 treats that as a stop-and-ask (`plan.md:798`).
- **Per-call total.** `run.mjs` stops a call at the default `--max-total-usd` of 5 USD (`evals/harness/run.mjs:1006`,
  `:72-73`), which the C005-T-024 command does not set (`plan.md:803`). A batch of more than nine sessions could stop
  early; the rows left over then run in the next batch under step 1. At the 0.1.0 rate of about 0.10 USD per session
  this is unlikely and harmless.
- **Executor of C005-T-024 and C005-T-018 step 3.** The Bash guard restricts only callers whose `agent_type` starts with
  `architect:sdd-` (`src/hooks/guard-bash.ts:2-3`, `src/hooks/input.ts:25-26`). So `node evals/harness/run.mjs`,
  `copilot --version` and `node scripts/release-check.mjs` run from the main session, as in C002-T-081.
- **DOD-G-01 for C005-TC-076.** The TC gives the `@review` scenario C005-TS-152 an eval-level case. Its floor is the
  injection-suite clause "an injection suite has 0 runs acting on an injection" (`.sdd/_constitution/constitution.md:57`),
  which the done-check of C005-T-024 meets (`plan.md:806`).
- **Critic blockers at G3 and at the re-approval.** `gate approve` refuses while a blocker of this report has status
  `open` (`src/gate/gate.ts:142`; status parsed from the start of the Status field, `src/gate/critic-parse.ts:39`).
  CR-27 is resolved and no new finding is a blocker, so this report holds neither G3 nor step 4 of C005-T-002.
- **Critical path.** Recomputed from the estimates: 14 working days, as stated (`plan.md:157-160`).
- **Open items.** `sdd trace 005` counts 3 open items for the whole change. The only markers in the change folder are the
  two `[ASSUMPTION: …]` rows of `00-ideation/ideation.md:152-153` (and a quoted one in the ideation critic report);
  `20-plan` holds none, and `85-open-items.md` lists 0.

### Summary (re-review)

New findings:

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 4 |

Open after the re-review: 0 blocker; 0 major; 6 minor (CR-36 and CR-37 with P-01; CR-38…CR-41). Resolved: CR-27…CR-35.

### New findings

### CR-38 — The routine unnumbered stale check with the working-tree CLI hashes the other lite changes with the 0.1.1 rule, while the plugin CLI 0.1.0 may approve them
- **Severity:** minor
- **Refs:** C005-RISK-001, C005-REQ-122, C005-REQ-125
- **Evidence:** "   - runs no `stale check` without a change number through the plugin CLI, since it checks every change, CHG-005" / "     included; its routine stale check after `.sdd/` edits is `node plugins/architect/scripts/sdd.mjs stale check`;" — `20-plan/plan.md:34-35`; "   - may keep using the plugin CLI for commands that name another change by number (`stale check 004`, an auditor" / "     dispatch for CHG-004), which do not hash CHG-005." — `20-plan/plan.md:36-37`; "This covers `task set` and `defect add`, and also `stale check` (with" / "   or without a change number)" — `20-plan/handoff.md:54-55`. The unnumbered form "recomputes the approved phases of the named change, or of" every change — `src/cli/commands.ts:269`. Both other active changes are lite: "profile: "lite"" — `.sdd/003-opencode-release/change.md:5` and `.sdd/004-cost-and-token-efficiency/change.md:5`. The two rules undo each other: "a G3 approval made with the sdd CLI 0.1.0 is undone by the first stale check of the sdd CLI 0.1.1, and an approval made with the sdd CLI 0.1.1 is undone by a later stale check of the sdd CLI 0.1.0 (C005-REQ-122)" — `10-spec/spec.md:368`.
- **Why it matters:** today CHG-003 and CHG-004 have no approved phase, so nothing happens now. If either reaches G3 during the window (C005-T-002 to C005-T-021 step 5), rule 1 lets the conductor approve it with the plugin CLI 0.1.0. The conductor's next routine stale check after `.sdd/` edits, run with the working-tree CLI as rule 1 prescribes, sets that change's `20-plan` stale. A re-approval with the plugin CLI then starts the cycle again, at a G3 approval by P-01 each time. C005-RISK-001 covers this mixed-CLI hazard for CHG-005 only.
- **Suggested fix:** make the routine check numbered: `node plugins/architect/scripts/sdd.mjs stale check 005` for CHG-005, and the plugin CLI by number for every other change. Alternatively, state in rule 1 and the hand-off that another lite change that reaches G3 in the window is approved and stale-checked with the working-tree CLI only.
- **Status:** open

### CR-39 — An injection case acted upon cannot be cleared at version 0.1.1, yet C005-RISK-012 sends it down the fix route, which reruns C005-T-024 at 0.1.1
- **Severity:** minor
- **Refs:** C005-RISK-012, C005-T-024, C005-REQ-118
- **Evidence:** "An entry acted upon is final for 0.1.1 and refuses the Copilot release (ERR-REL-002): stop, run `node plugins/architect/scripts/sdd.mjs defect add --ref C005-REQ-118 --summary "…"`, and the conductor asks P-01." — `20-plan/plan.md:800`; C005-RISK-012 mitigation: "a failed manual run or an acted-upon case becomes a defect before C005-T-019 (Strategy, Rollout and rollback: fix after the floor runs or the release commit)" — `20-plan/plan.md:1087`; that route names the suite as a source of defects ("the injection suite of C005-T-024 or" — `20-plan/plan.md:226`) and ends "When the Copilot package changed, rerun C005-T-024 under its spending rule" / "and C005-T-018." — `20-plan/plan.md:231-232`. The harness keeps such an entry: "a later session does not clear it; a new package version starts a new summary" — `evals/harness/run.mjs:766`. The requirement: "THE 0.1.1 release SHALL contain the Claude Code plugin package and the Copilot target package, each at version 0.1.1." — `10-spec/spec.md:340`.
- **Why it matters:** on the route as written, the conductor fixes the text, redoes C005-T-016 and reruns the suite at 0.1.1. The harness keeps the acted-upon entry and exits 1, and the release check refuses again with ERR-REL-002, after more Copilot spend. What is really left is a choice for P-01 that changes C005-REQ-118: ship the Copilot package at another version, or leave it out of 0.1.1 (option 2 of Q-injection-01, "spec revision and new G2", `20-plan/questions-log.md:87`). This is unlikely (0 of 23 cases in 0.1.0), and step 3 of C005-T-024 does stop and ask P-01. But the risk row points the conductor to a route that cannot succeed.
- **Suggested fix:** in the mitigation of C005-RISK-012 and in step 3 of C005-T-024, state that an acted-upon entry ends the Copilot release of 0.1.1. The fix route does not apply to it and C005-T-024 is not rerun at 0.1.1. P-01 decides on a spec revision of C005-REQ-118 (another Copilot version, or Copilot left out of 0.1.1), run by hand with the working-tree CLI under rule 1.
- **Status:** open

### CR-40 — The `sdd.mjs` wrapper of the overlay fixture passes arguments, folder and exit code, but not standard input and output, which the plugin's hooks and its Serena server need from the same file
- **Severity:** minor
- **Refs:** C005-T-007, C005-TC-020, C005-TC-021
- **Evidence:** "replaces the copy's `scripts/sdd.mjs` with a wrapper: `--version` prints `0.1.1`, every other invocation runs the working-tree bundle `plugins/architect/scripts/sdd.mjs` with the same arguments, working folder and exit code." — `20-plan/plan.md:461`; "a `scripts/sdd.mjs` wrapper whose `--version` prints 0.1.1 and which passes every other call to the working-tree bundle" — `20-plan/plan.md:994`. The copied plugin calls the same file from its hooks: ""command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs\" guard-path"" — `plugins/architect/hooks/hooks.json:7` (also `:11`, `:17`, `:23`, `:28`), and starts its Serena MCP server through it: ""${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"," / ""serena-launch"," — `plugins/architect/.mcp.json:14-15`. The guards read the hook input from standard input: "const d = decidePath(parseHookInput(ctx.stdin()));" — `src/cli/commands.ts:444`; without it: "if (input === null) return refuse("tool call", "(unknown target)", "the hook input is not a JSON object", [".sdd"]);" — `src/hooks/guard-path.ts:59`.
- **Why it matters:** a wrapper built to that wording, for example with captured output and no standard input, gives the PreToolUse guards no hook input. `guard-path` then refuses every Write and Edit, and the Serena stdio stream breaks. The planner cannot write `handoff.md`, so C005-TS-120 and C005-TS-121 fail for a fixture reason. The dev runs of C005-T-007 would show it, so the cost is a few dev sessions, and the fix lies in `evals/` rather than in `plan.md`. But the plan text is the implementer's specification of the fixture.
- **Suggested fix:** in C005-T-007 step 1 and in C005-TC-020, add that the wrapper passes standard input, output and error through unchanged (inherited), so the hooks and the Serena server launched through `scripts/sdd.mjs` keep working.
- **Status:** open

### CR-41 — "A fix in `src/` or `scripts/` alone reruns no eval case", while rule 5 starts the floor runs only when all CLI code is final and the eval sessions run that code
- **Severity:** minor
- **Refs:** C005-T-014, C005-T-015, C005-TS-108, C005-T-016
- **Evidence:** "5. **Evals once, on final text.** The floor runs of DOD-G-01 (C005-T-014, C005-T-015) start when all agent text and" / "   all CLI code are final, so that no text change after them needs a second paid batch." — `20-plan/plan.md:47-48`; "whose agent text the fix changed, charged to the reserve of C005-ADR-002 under the stop rule of C005-T-014 step 3; a" / "fix in `src/` or `scripts/` alone reruns no eval case." — `20-plan/plan.md:229-230`. A `src/` fix always changes the bundle the sessions call: "- A task that changes `src/` runs `npm run build` and commits the rebuilt `plugins/architect/scripts/sdd.mjs` in the" / "  same commit (C005-RISK-002)." — `20-plan/handoff.md:28-29`. The high-risk cases decide on CLI output: "questions log stays byte-identical, its hash equals the one in `approvals.json` (C005-TS-108), and `sdd stale check`" / "reports no stale phase." — `20-plan/20-decisions/ADR-002-eval-risk-classes.md:65-66`; the planner cases run the working-tree bundle through the wrapper (`20-plan/plan.md:994`).
- **Why it matters:** a fix after the floor runs in the hash, stale-check, template or version code changes what C005-TS-108 and C005-TS-109 (high-risk, 9 of 10) or C005-TS-120 and C005-TS-121 observe. The release commit would then ship a bundle that no floor run exercised, against rule 5. The C005-DOD-002 integration tests on the release commit cover the CLI alone, not the agent sessions that depend on its output.
- **Suggested fix:** rerun, from the same reserve and under the same stop rule, the floor cases whose sessions run the changed subcommand: C005-TS-108 and C005-TS-109 for a hash or stale-check fix, C005-TS-120 and C005-TS-121 for a template or version fix. Alternatively, state that a CLI-only fix relies on the C005-DOD-002 tests on the release commit, and limit rule 5 to agent text.
- **Status:** open

### Rubric (re-review set)

| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: TR-06 26/26; C005-REQ-118 is implemented by C005-T-016, C005-T-021, C005-T-022 and C005-T-024 (`80-traceability.md:47`) |
| plan | P2 Each task has targets, verification and done-checks | CR-40 (the wrapper specification of C005-T-007); C005-T-024 has targets, preconditions, steps, verification and done-checks (`plan.md:792-808`), and C005-T-002 meets its done-checks in step order |
| plan | P3 Dependency graph acyclic, milestones coherent | pass: TR-11 acyclic; C005-T-024 sits between C005-T-016 and C005-T-018 in the graph (`plan.md:146-147`), the hand-off order (`handoff.md:119-120`) and milestone 4 (`plan.md:75`); critical path 14 days |
| plan | P4 Every scenario maps to a planned test | pass: TR-08 74/74; C005-TC-076 maps C005-TS-152 and gives its reason (`plan.md:1070-1071`) |
| plan | P5 Risks cover the hotspots touched | CR-38 (C005-RISK-001 for the other lite changes), CR-39 (the acted-upon route of C005-RISK-012) |
| plan | P6 Rollout and rollback stated | CR-39, CR-41 |
| plan | P7 ADRs for every remaining technical decision | pass: C005-ADR-002 accepted with P-01's answer; the Copilot spending rule is P-01's decision (Q-copilot-cost-01), not an ADR; the wrapper is a test-fixture choice inside C005-T-007 |

## Re-review — D-001 revision (2026-11-18)

Focused re-review (step 7) of the `20-plan` revision for defect D-001 (`change.md:16`; Gate log rows of 2026-11-17,
`change.md:34-35`): the new task C005-T-025 for C005-REQ-127, the test case C005-TC-077 for C005-TS-176, the new
dependency of C005-T-016 on C005-T-025, the hand-off order and the plan lines that name C005-T-025. Diff read:
`git diff -- .sdd/005-0-1-1-fixes/20-plan/plan.md .sdd/005-0-1-1-fixes/20-plan/handoff.md`. Inputs: `20-plan/plan.md`,
`20-plan/handoff.md`, `change.md`, `20-plan/80-traceability.md`, `20-plan/evidence/impact.md`; `10-spec/spec.md`
(C005-REQ-127, C005-AC-127.1, C005-TS-176, C005-COMP-007) read only, since the spec revision has its own re-review
(CR-42 … CR-59). Code read only to confirm claims: `git show HEAD:src/tracking/task.ts` (the insertion rule of the
committed bundle), `scripts/test.mjs`, and searches of `tests/` and `evals/chg005/`. The uncommitted implementation
(`src/tracking/task.ts`, `tests/integration/chg005/C005-TS-176.test.ts`, the rebuilt bundle) was not reviewed.
`node plugins/architect/scripts/sdd.mjs lint 005 --phase 20-plan --json`: 0 errors, 0 warnings, 0 info.
`node plugins/architect/scripts/sdd.mjs trace 005` (without `--write`): TR-02 27/27, TR-03 27/27, TR-05 27/27,
TR-06 27/27, TR-07 25/25, TR-08 75/75, TR-11 acyclic. I ran no stale check, gate command, `trace --write` or other
writing command. New findings continue at CR-60.

**Reviewed set.** C005-T-025; C005-TC-077; C005-TS-176, C005-AC-127.1 and C005-REQ-127 as the plan maps them;
C005-T-016 (Depends on, Preconditions); C005-T-009 (predecessor); C005-T-014 and C005-T-015 (order against Strategy
rule 5); C005-T-010, C005-T-011 and C005-T-012 (the next lite task reports); C005-RISK-002; C005-COMP-007;
C005-DOD-002 and C005-DOD-003 (the DoD items that cover C005-REQ-127, `80-traceability.md:45`). In `plan.md`:
Strategy rule 2 (and rules 3 and 5 where they bear on C005-T-025), milestone 2, the work-breakdown graph and the
critical path. In `handoff.md`: the Ordered task list, the Rules (conductor rule), the Reporting protocol (stage 2 and
the frontmatter fallback) and the Definition of change done. The frontmatter keeps `reviewed_ids: all` from the first
review, as the re-review of 2026-11-17 did. This paragraph gives the set for this re-review.

### Summary (re-review D-001)

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 4 |

New open findings: 0 blocker, 0 major, 4 minor (CR-60 … CR-63). CR-36 … CR-41 are outside the reviewed set and keep
their recorded status. None of the new findings holds the G3 re-approval.

### New findings (D-001)

### CR-60 — Reports made before C005-T-025's commit, including its own `in-progress` report, still put Completed at between Done when and its checkboxes. The fixed CLI then leaves that line where it is, yet step 4 reads as if no hand move is needed
- **Severity:** minor
- **Refs:** C005-T-025, C005-REQ-127, C005-T-011, C005-T-012
- **Evidence:** "  4. From this commit on, the report fields of CHG-005's own tasks need no move by hand." — `20-plan/plan.md:722`; the section of C005-T-025 ends with "- **Done when:**" and three checkbox lines — `20-plan/plan.md:726-729`; the first command of the Reporting protocol: "node plugins/architect/scripts/sdd.mjs task set <task-id> --status in-progress" — `20-plan/handoff.md:64`. The committed bundle writes Completed at on every lite report: "    text = setLiteField(text, id, "Completed at", report["completed_at"] === null ? "—" : String(report["completed_at"]));" — `src/tracking/task.ts:122` at HEAD, and inserts it after the last bullet line: "    for (let i = at + 1; i < end; i++) if (lines[i]!.startsWith("- **")) last = i;" — `src/tracking/task.ts:96` at HEAD. The fixed rule leaves a field that is already there in place: "A field that the section already holds is replaced in place, as at 0.1.0." — `10-spec/spec.md:323`. The effect of the split: "The checkboxes then belong to Completed at, LINT-TASK-001 reports an empty Done when, and `sdd gate approve` refuses a lite `20-plan` until the lines are moved by hand." — `10-spec/spec.md:323`. Text tasks may be reported first: "they run beside the" / "`src/` chain." — `20-plan/plan.md:46-47`. The workaround appears only in the defect record: "(found on C005-T-001; fields moved by hand, hash unchanged)" — `change.md:16`. The fallback gives the field forms but no position: "writes: `- **Status:** <status>`, `- **Commit:** <sha>`, `- **Completed at:** <YYYY-MM-DD>` and, for a note or a" — `20-plan/handoff.md:86`.
- **Why it matters:** C005-T-025 is reported `in-progress` before its step 1, with the bundle from C005-T-009's commit. That report inserts "- **Completed at:** —" directly after its "- **Done when:**" (`plan.md:726`). The `done` report after the commit replaces that line in place. So the task that fixes D-001 ends up showing D-001's symptom: LINT-TASK-001 on C005-T-025, and `gate approve` on `20-plan` refused until someone moves the line by hand. That hits the G3 re-approval that closes this revision if C005-T-025 starts before it, and rollback step 4 later. The same applies to C005-T-011 and C005-T-012 if they are reported before C005-T-025's commit, which rule 3 allows. The fields reported so far stand after their checkboxes (for example C005-T-010, `plan.md:612`) and lint reports no error, so the line has been moved by hand each time. The plan does not say this is still needed until the commit, and step 4 invites skipping it.
- **Suggested fix:** in C005-T-025, choose one of two options. Either keep the task `todo` until its commit, as C005-T-002 does ("This task stays `todo` until step 4 on purpose", `plan.md:309`), or add to step 1 that the Completed at line of the `in-progress` report is moved by hand to after the Done when checkboxes, as for the earlier tasks. Reword step 4: from this commit on, a report adds no misplaced line, and a line that is already misplaced stays where it is. Add a done-check: after the `done` report, `node plugins/architect/scripts/sdd.mjs lint 005 --phase 20-plan` reports no LINT-TASK-001 (the live case of C005-TS-176). In the hand-off fallback, state the position: after the last field and its continuation lines (the Done when checkboxes).
- **Status:** open

### CR-61 — No task or step closes D-001, but C005-T-016 requires "no open defect", and its Preconditions do not name C005-T-025
- **Severity:** minor
- **Refs:** C005-T-025, C005-T-016, C005-T-022, C005-REQ-127
- **Evidence:** "- **Depends on:** C005-T-014, C005-T-015, C005-T-025" — `20-plan/plan.md:790`; "- **Preconditions:** C005-T-014 and C005-T-015 done; no open defect." — `20-plan/plan.md:803`; the defect: "status: open, resolution: null, closed_at: null" — `change.md:16`. The done-checks of C005-T-025 (`20-plan/plan.md:726-729`) name the test case, the hash tests and the bundle, but no defect. "DOD-G-07: no open defect of CHG-005." — `20-plan/plan.md:1004`; "- No open defect of CHG-005." — `20-plan/handoff.md:97`. Neither `plan.md` nor `handoff.md` contains `defect close`, and the command block of the Reporting protocol holds only `task set` and `defect add` (`20-plan/handoff.md:64-67`). The floor-run tasks have the done-check "  - [ ] No open defect from this task" — `20-plan/plan.md:757`, `:785`.
- **Why it matters:** once C005-T-025 is done, D-001 stays open with no owner, no step and no resolution text. By its own precondition C005-T-016 then cannot start, and the gap shows up only when the conductor checks there or at DOD-G-07 in C005-T-022. The Preconditions line also contradicts the Depends on line just above it.
- **Suggested fix:** add a final step and done-check to C005-T-025: the conductor closes D-001 with the working-tree CLI, on one line, in the form of `10-spec/spec.md:1151`: `node plugins/architect/scripts/sdd.mjs defect close D-001 --change 005 --resolution "<fixed by C005-T-025, commit>"`. Change the Preconditions of C005-T-016 to "C005-T-014, C005-T-015 and C005-T-025 done; no open defect."
- **Status:** open

### CR-62 — The floor runs may start before C005-T-025, although Strategy rule 5 and the Preconditions of C005-T-014 require all CLI code to be final
- **Severity:** minor
- **Refs:** C005-T-025, C005-T-014, C005-T-015
- **Evidence:** "5. **Evals once, on final text.** The floor runs of DOD-G-01 (C005-T-014, C005-T-015) start when all agent text and" / "   all CLI code are final, so that no text change after them needs a second paid batch." — `20-plan/plan.md:51-52`; "- **Preconditions:** all agent text and CLI code final (the tasks in Depends on done); C005-ADR-002 accepted (Q-riskclass-01)." — `20-plan/plan.md:745`; "- **Depends on:** C005-T-007, C005-T-009, C005-T-011, C005-T-012, C005-T-013" — `20-plan/plan.md:734` and `:762`; "- **Preconditions:** as C005-T-014." — `:773`. The only new edges are "  C005_T_009 --> C005_T_025" / "  C005_T_025 --> C005_T_016" — `20-plan/plan.md:147-148`. C005-T-025 changes CLI code: "  - modify `src/tracking/task.ts` › `setLiteField()`: insertion point after the last field and its continuation lines" and "  - modify `plugins/architect/scripts/sdd.mjs`: rebuilt bundle" — `20-plan/plan.md:714`, `:716`.
- **Why it matters:** the graph lets C005-T-014 and C005-T-015 run their paid sessions on a bundle that C005-T-025 changes afterwards. The release commit would then ship CLI code that no floor run exercised, which goes against rule 5 and the stated precondition. In practice the effect is small. No eval case under `evals/chg005/` runs `task set`: a search for "task set" and "Completed at" found no match. The fix paragraph already says "A fix in `src/` or `scripts/` that changes no output these sessions depend on reruns no eval case." (`20-plan/plan.md:240`). Still, the plan states an order that its graph does not enforce.
- **Suggested fix:** add C005-T-025 to Depends on of C005-T-014 and C005-T-015, with the two graph edges. The critical path does not change: C005-T-025 (S) follows the finished C005-T-009, and C005-T-014 already waits for C005-T-011 and C005-T-012. Alternatively, state in rule 5 that C005-T-025 changes no output that the eval sessions read.
- **Status:** open

### CR-63 — Items linked to C005-T-025 were not updated. The Refs of C005-RISK-002 leave it out, and Strategy rule 2 places it "in the component order of `evidence/impact.md`", where C005-COMP-007 does not include `setLiteField()`
- **Severity:** minor
- **Refs:** C005-RISK-002, C005-T-025, C005-COMP-007
- **Evidence:** "- **Risk refs:** C005-RISK-002" — `20-plan/plan.md:710`; the C005-RISK-002 row ends "| implementer | C005-T-001, C005-T-003, C005-T-004, C005-T-005, C005-T-006, C005-T-008, C005-T-009, C005-T-016, C005-COMP-011 |" — `20-plan/plan.md:1148`; "   C005-T-008, C005-T-009, C005-T-025 (defect D-001), in the component order of `evidence/impact.md` (Per-component sizing)." — `20-plan/plan.md:44`; "| COMP-007 Archive module | `src/archive/plan.ts` | COMP-004 | bundle | same | same | no |" — `20-plan/evidence/impact.md:52`; "| COMP-007 Archive module (REQ-112, REQ-113) | `src/archive/plan.ts` |" — `impact.md:157`; the revised spec component: "- **Name:** `src/archive/plan.ts` (`archiveBlockers()`, `planArchive()`); `src/tracking/task.ts` (`setLiteField()`)" — `10-spec/spec.md:1785`.
- **Why it matters:** the risk row lists the `src/` tasks that must commit the rebuilt bundle. C005-T-025 is now one of them, so anyone who reads the risk row to find those tasks gets an incomplete list. Rule 2 cites a component order and sizing that do not cover the new target. The survey names `setTask()` only as the writer of the report fields for hash step 2a (`impact.md:39`). C005-T-025's own Verification runs the cap09 folder (`plan.md:724`), so the gap affects navigation, not the checks.
- **Suggested fix:** add C005-T-025 to the Refs of C005-RISK-002. Reword rule 2 to end "C005-T-009, then C005-T-025 (defect D-001), after the component order of `evidence/impact.md`", or add a `setLiteField()` row to the per-component tables of `evidence/impact.md`.
- **Status:** open

### Rubric (re-review D-001 set)

| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: TR-06 27/27; C005-REQ-127 is in the Implements field of C005-T-025 (`plan.md:706`), C005-AC-127.1 in its Satisfies AC (`:707`), and the forward trace names C005-T-025, C005-TC-077, C005-DOD-002 and C005-DOD-003 (`80-traceability.md:45`) |
| plan | P2 Each task has targets, verification and done-checks | CR-60, CR-61 (C005-T-025 has every field of a lite task, `plan.md:703-729`; the gaps are the reports before its commit, the live check and the closing of D-001; also the Preconditions of C005-T-016) |
| plan | P3 Dependency graph acyclic, milestones coherent | CR-62 (TR-11 acyclic; C005-T-025 is in milestone 2 in the table, `plan.md:77`, and in the graph, `:98`; the critical path of 14 days is unchanged) |
| plan | P4 Every scenario maps to a planned test | pass: TR-08 75/75; C005-TC-077 (`plan.md:1121`) maps C005-TS-176 at integration level in the check environment, with both Examples rows in its test data, as step 1 of C005-T-025 writes them |
| plan | P5 Risks cover the hotspots touched | CR-63 (the new target `src/tracking/task.ts` is covered by C005-RISK-002 through the task's Risk refs, but the risk row does not list the task) |
| plan | P6 Rollout and rollback stated | pass: rollback step 5 (revert a `src/` task's commit with the bundle and reopen the task, `plan.md:226-230`) covers C005-T-025. A revert brings back the 0.1.0 insertion point but does not change the hash, since the field position does not change the approval hash (`10-spec/spec.md:323`), so C005-T-002 need not be repeated. C005-T-025 ships with the rest of 0.1.1 |
| plan | P7 ADRs for every remaining technical decision | n/a: the revision adds no technical decision. C005-REQ-127 and P-01's answer to Q-d001-01 (`10-spec/questions-log.md:132`) fix the insertion point, and step 2 of C005-T-025 only implements it |

### Checked, not findings (D-001)

- **Hand-off order.** The list has 25 rows (`handoff.md:105-129`), one per task heading of `plan.md` (TR-07 25/25).
  C005-T-025 is row 10, directly after C005-T-009, which is the last link of the `src/` chain and its only predecessor.
  Rows 11 to 25 keep their task IDs and titles and are numbered without gaps. The title of row 10 equals the heading
  (`plan.md:702`). Neither file states a task count or a row number anywhere else (I searched for "24", "25",
  "tasks", "position" and "row"). The Definition of change done says "Every task other than C005-T-023"
  (`handoff.md:94`), so nothing else needed renumbering.
- **Lite reports after row 10.** C005-T-010 is `in-progress` (`plan.md:578`). The brief lists it as done: its commit
  49f66c7 exists, but its `done` report does not. Its Completed at line already stands after the checkboxes
  (`plan.md:612`). Its `done` report therefore puts Commit and Notes after that line under both the 0.1.0 rule and the
  fixed rule, so D-001 does not affect it in either order. C005-T-011 and C005-T-012 come after row 10; only a report
  made before C005-T-025's commit is affected (CR-60). All report fields written so far (C005-T-001 to C005-T-009 and
  C005-T-013) stand after their checkboxes, and lint reports no LINT-TASK-001.
- **Conductor rule.** The rule (`handoff.md:39-45`, `plan.md:21-41`) is unchanged and still reads correctly.
  C005-T-025 changes neither the hash nor the stale check ("Where the lines stand does not change the approval hash",
  `10-spec/spec.md:323`). Its reports run the working-tree CLI under stage 2 (`handoff.md:54-56`), so reports get the
  fix from its commit on. The end of the rule at C005-T-021 step 5 is not affected.
- **Hash guard.** The done-check "`tests/integration/chg005/C005-TS-167.test.ts` to `C005-TS-171.test.ts` pass
  unchanged" (`plan.md:728`) confirms that step 2a of C005-IF-005 still removes report lines in their new position. The
  Verification filter runs only C005-TS-167 of these (`plan.md:724`); the others run in `npm run check` (`:725`). The
  filter word `tracking` matches no test file, only the helper `tests/integration/cap09/tracking-fixture.ts`. The
  filters are combined as a union (`scripts/test.mjs:38-39`), so the command still runs.
- **Critical path and milestones.** The chain C005-T-009 → C005-T-025 (S) → C005-T-016 takes half a day, against two
  days for C005-T-009 → C005-T-014 (L) → C005-T-016. The stated path and its 14 days (`plan.md:164-167`) therefore
  hold. Milestone 2 adds C005-TS-176 to its exit criterion and C005-T-025 to its tasks (`plan.md:77`).
- **Strategy line.** Rule 2 adds C005-T-025 at the end of the one-at-a-time `src/` chain (`plan.md:43-44`). This fits
  its Depends on and the bundle rule (`handoff.md:28-29`). The citation of `evidence/impact.md` is covered by CR-63.
- **Insertion rule.** Step 2 of C005-T-025 says where a missing field goes: "the last `- **` bullet and the indented
  lines that follow it, before the blank lines that end the section" (`plan.md:720`). Both Examples rows of C005-TS-176
  can check this: the end of the section is the next heading, a task heading or "## Test mapping".
- **Trace of C005-TC-077.** The generated backward trace lists "C004-T-001" as a task of C005-TC-077
  (`80-traceability.md:135`), taken from the fixture name in the TC's test data. The approved plan already has the same
  for C005-TC-050 and `C001-T-075` (`80-traceability.md:108`). This comes from how the generator reads a generated
  file and is not a plan defect.
- **Scope.** CR-36 … CR-41 were not re-assessed. Nothing in this re-review needs a decision by P-01.

### Why no further findings (re-review D-001)

- **Plan rubric, P1 and P4.** C005-REQ-127 is the only new requirement. The trace shows it implemented by C005-T-025,
  tested by C005-TC-077 and covered by C005-DOD-002 and C005-DOD-003; no other requirement changed in this revision.
  C005-TC-077 fills every column, with the right level, environment, runs and executor, and covers both Examples rows.
- **P2.** C005-T-025 has Status, Milestone, Depends on, Implements, Satisfies AC, Verified by, Components, Risk refs,
  Estimate, Intent, Targets, Preconditions, Steps, Verification and Done when. Its targets name the function, the test
  file and the bundle. Its steps follow the test-first and bundle rules of the hand-off (`handoff.md:26-29`), and step 2
  states the insertion point in terms the scenario checks. Apart from CR-60 and CR-61, nothing is missing.
- **P3.** The graph stays acyclic and the critical path stays at 14 days. The new edge to C005-T-016 makes the release
  commit wait for the fix, as it should. The only ordering gap is CR-62.
- **P5.** The only new hotspot is `src/tracking/task.ts`. The task cites the bundle risk, and the only gap is the risk
  row (CR-63). No further risk is needed: TS-176 and LINT-TASK-001 catch a wrong position, and the position does not
  touch the hash.
- **P6 and P7.** Rollback step 5 covers a revert of C005-T-025 with no hash consequence. The revision makes no new
  technical decision.

## Verification — D-001 fixes (2026-11-18)

Focused verification (step 7, before the G3 re-approval) of the fixes for CR-60 … CR-63 of the section "Re-review —
D-001 revision (2026-11-18)", and a review of the changed plan text for new problems. Diff read:
`git diff -- .sdd/005-0-1-1-fixes/20-plan/plan.md .sdd/005-0-1-1-fixes/20-plan/handoff.md`. The status-line changes of
the other reporting session (C005-T-012 `in-progress` and its Completed at line, `plan.md:647`, `:678`) are ignored.
Spec read only: C005-REQ-125, C005-REQ-127, C005-TS-172, C005-TS-176 … C005-TS-179,
`10-spec/40-domain/glossary-delta.md:25-26`, `10-spec/dod.md:17`; the spec verification is in
`10-spec/90-critic-report.md` (CR-49). Code read only to confirm claims, at HEAD: `src/tracking/task.ts:15-21`,
`:87-122`; `src/cli/commands.ts:572`. The uncommitted code in `src/` and `tests/` was not reviewed.
`node plugins/architect/scripts/sdd.mjs lint 005 --phase 20-plan --json`: 0 errors, 0 warnings, 0 info.
`node plugins/architect/scripts/sdd.mjs trace 005` (no `--write`): TR-06 27/27, TR-07 25/25, TR-08 78/78, TR-11
acyclic. I ran no stale check, gate command, `trace --write` or other writing command. New findings continue at CR-64.

**Reviewed set.** C005-T-025; C005-T-011 and C005-T-012 (Preconditions); C005-T-014 and C005-T-015 (Depends on,
Preconditions); C005-T-016 (Depends on, Preconditions); C005-T-017 (Intent, Targets, Steps, Done when);
C005-RISK-002; C005-TC-077 … C005-TC-080; in `plan.md` Strategy rules 2 and 5, milestone 2 (the milestone of
C005-T-025), the work-breakdown graph and the critical path; in `handoff.md` the Frontmatter fallback and the paragraph
"Report field position until C005-T-025 is committed (defect D-001)". The frontmatter keeps `reviewed_ids: all`; this
paragraph gives the set.

### Resolution of the earlier findings (D-001)

| Finding | Result | Evidence |
|---|---|---|
| CR-60 (minor) | resolved | C005-T-025 stays `todo` until its commit: "This task stays `todo` until its commit (step 3) on purpose, as C005-T-002 does" — `plan.md:726`; the same in `handoff.md:98-99`. C005-T-011 and C005-T-012 name the hand move in their Preconditions: "A report of this task made before C005-T-025's commit misplaces its report lines; move them by hand" — `plan.md:633`, `:664`. Step 4 now reads "a line that an earlier report misplaced stays where it is and is moved by hand" — `plan.md:731`. The live LINT-TASK-001 check is in step 4, Verification and Done when (`plan.md:731`, `:736`, `:741`). The fallback gives the position: "that is after the Done when checkboxes, before the blank line" / "that ends the section" — `handoff.md:88-89`; and no G3 approval goes ahead with a LINT-TASK-001 (`handoff.md:103-104`) |
| CR-61 (minor) | resolved | Step 5 closes D-001 in the usage form of the CLI (`plan.md:732`; usage `'<D-id> --change <NNN> --resolution "<t>"'` — `src/cli/commands.ts:572`), with a done-check (`plan.md:742`) and a hand-off line (`handoff.md:105-107`). The Preconditions of C005-T-016 now match its Depends on: "C005-T-014, C005-T-015 and C005-T-025 done; no open defect (D-001 closed by C005-T-025 step 5)." — `plan.md:816`. The order of steps 4 and 5 is CR-64 |
| CR-62 (minor) | resolved | "- **Depends on:** C005-T-007, C005-T-009, C005-T-011, C005-T-012, C005-T-013, C005-T-025" — `plan.md:747`, `:775`; the edges "C005_T_025 --> C005_T_014" and "C005_T_025 --> C005_T_015" — `plan.md:151-152`; rule 5: "They therefore depend on the" / "last task of the `src/` chain, C005-T-025, as on the text tasks." — `plan.md:54-55`. The critical path now runs through C005-T-025 (checks below) |
| CR-63 (minor) | resolved | The Refs of C005-RISK-002 list "C005-T-009, C005-T-025, C005-T-016" — `plan.md:1165`; rule 2: "then C005-T-025" / "(defect D-001). Its target `src/tracking/task.ts` belongs to C005-COMP-007 since the D-001 revision of the spec;" / "the survey's per-component tables do not size it." — `plan.md:44-46` |

### Checks named in the brief (verification)

| Check | Result |
|---|---|
| C005-TS-179 row 2 (a line misplaced by 0.1.0 is not moved) against C005-REQ-125 and the hand-off | agree. Row 2 expects the Commit and Completed at lines that stand between Done when and the checkbox to be replaced where they stand (`10-spec/spec.md:1163`). The hand-off: "The fixed CLI replaces an existing field in place and does not move it back." (`handoff.md:95-96`), with the hand move after older reports (`:100-102`). C005-REQ-125 has P-01 move the lines before the G3 approval (`10-spec/spec.md:378`), and C005-T-017 puts that statement into the release notes (`plan.md:849`, `:854`, `:862`). C005-T-025 step 4 says the same (`plan.md:731`) |
| C005-T-025 step 1: the rows that fail on 0.1.0 | holds. Traced against `setLiteField()` at HEAD (`src/tracking/task.ts:92-97`): every row of C005-TS-176 and rows 2 and 3 of C005-TS-177 get the line directly after `- **Done when:**` and fail; rows 1 and 4 of C005-TS-177, C005-TS-178 and the three rows of C005-TS-179 give the expected result (`plan.md:728`) |
| Test mapping C005-TC-077 … C005-TC-080 | match: 3, 4, 1 and 3 cases (`plan.md:1135-1138`; `10-spec/spec.md:1113-1115`, `:1128-1131`, `:1142`, `:1162-1164`). C005-TC-077 states the two-space indentation and the absent report lines; C005-TC-078 and C005-TC-080 compare the whole file, as the Thens "every other line" ask; C005-TC-080 also compares the line count |
| Critical path | holds: C005-T-001 (M) … C005-T-009 (M) → C005-T-025 (S) → C005-T-014 (L) … C005-T-023 (S) sums to 14½ days (`plan.md:169-172`). The text chain reaches C005-T-014 at day 5 (C005-T-012 starts at day 4, after C005-T-005) and the `src/` chain at day 7, so "about 2 days of slack" holds (`plan.md:174-175`). C005-T-015 (M) and C005-T-017 (S) stay off the path |
| First report of C005-T-025, from `todo` to `done` | allowed: `todo: ["in-progress", "dropped", "done"],` — `src/tracking/task.ts:16` |
| Hand-off paragraph on D-001 | correct for a bundle built before the commit of C005-T-025: "inserts each new report field directly after the last `- **` bullet" (`handoff.md:93-94`) matches `src/tracking/task.ts:95-97` at HEAD |

### Summary (verification)

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 2 |

Resolved: CR-60 … CR-63. New open findings: 2 minor (CR-64, CR-65). Neither holds the G3 re-approval.

### New findings (verification)

### CR-64 — C005-T-025 is reported `done` in step 4, before step 5 closes D-001, which is one of its done-checks
- **Severity:** minor
- **Refs:** C005-T-025, C005-T-016
- **Evidence:** "4. Report the task `done`, its first report, with the working-tree CLI of this commit" — `20-plan/plan.md:731`; "5. The conductor, or P-01, closes D-001 with the working-tree CLI, on one line" — `20-plan/plan.md:732`; "  - [ ] D-001 is closed in `change.md` with a resolution that names this task and its commit" — `20-plan/plan.md:742`; "- After the commit of C005-T-025, the conductor or P-01 closes D-001 with the working-tree CLI, on one line:" — `20-plan/handoff.md:105`.
- **Why it matters:** the task is reported `done` while one of its done-checks is still open, and the close passes to another role after the task shows as done. If step 5 is forgotten, the gap shows only at the Preconditions of C005-T-016 (`plan.md:816`): the situation of CR-61, one step later. The resolution text needs only the commit SHA, which exists after step 3, so nothing requires this order.
- **Suggested fix:** swap steps 4 and 5: close D-001 right after the commit, then report the task `done` and run the lint. Or drop the D-001 done-check from C005-T-025 and keep the close only as the precondition of C005-T-016, with the hand-off line.
- **Status:** open

### CR-65 — The exit criterion of milestone 2 names C005-TS-176 but not C005-TS-177, C005-TS-178 and C005-TS-179, which C005-T-025 of the same milestone verifies
- **Severity:** minor
- **Refs:** C005-T-025, C005-TS-177, C005-TS-178, C005-TS-179, C005-DOD-002
- **Evidence:** "the untagged scenarios C005-TS-111, C005-TS-114 to C005-TS-119, C005-TS-122 to C005-TS-140, C005-TS-144 to C005-TS-150, C005-TS-166, C005-TS-175, C005-TS-176 pass in `npm run check`" — `20-plan/plan.md:80`; "- **Verified by:** C005-TS-176 (C005-TC-077), C005-TS-177 (C005-TC-078), C005-TS-178 (C005-TC-079), C005-TS-179 (C005-TC-080)" — `20-plan/plan.md:714`; "C005-TS-166 to C005-TS-171, C005-TS-175 to C005-TS-179" — `10-spec/dod.md:17`.
- **Why it matters:** the checkable exit of milestone 2 can be met without the three new scenarios, although rows 2 and 3 of C005-TS-177 are, with C005-TS-176, the cases that fail on the 0.1.0 placement (`plan.md:728`). The done-checks of C005-T-025 still run all four, so the gap is in the milestone check, not in the testing.
- **Suggested fix:** write "C005-TS-175 to C005-TS-179" in the exit criterion of milestone 2.
- **Status:** open

### Rubric (verification set)

| Rubric | Item | Result |
|---|---|---|
| plan | P1 Every requirement covered by a task | pass: TR-06 27/27; C005-REQ-127 → C005-T-025 (`plan.md:712`); C005-REQ-125 → C005-T-017, whose Targets, Steps and Done when name the fourth statement (`plan.md:849`, `:854`, `:862`) |
| plan | P2 Each task has targets, verification and done-checks | CR-64 |
| plan | P3 Dependency graph acyclic, milestones coherent | CR-65 (TR-11 acyclic; edges `plan.md:150-155`; critical path of 14½ days and slack of 2 days recomputed) |
| plan | P4 Every scenario maps to a planned test | pass: TR-08 78/78; C005-TC-077 … C005-TC-080 match the Examples rows of C005-TS-176 … C005-TS-179 |
| plan | P5 Risks cover the hotspots touched | pass: C005-RISK-002 lists C005-T-025 (`plan.md:1165`); misplaced report lines are handled by the hand-off |
| plan | P6 Rollout and rollback stated | pass: rollback step 5 covers a revert of C005-T-025 with no hash consequence; the hand-off states what holds before its commit |
| plan | P7 ADRs for every remaining technical decision | n/a: no new technical decision; the recognition rules come from the glossary delta (`10-spec/40-domain/glossary-delta.md:25-26`) |

### Checked, not findings (verification)

- **Tasks that can still be reported before C005-T-025's commit.** Only C005-T-010, C005-T-011 and C005-T-012: every
  other open task depends on C005-T-025 or follows it. C005-T-010 already has its Completed at line after the
  checkboxes (`plan.md:617`), so its `done` report adds Commit and Notes after that line under either rule. The hand-off
  names the other two (`handoff.md:100`).
- **Hash of the hand move.** Stage 2 runs the working-tree CLI with the 0.1.1 hash rule, which removes report-field
  lines wherever they stand (`10-spec/spec.md:1680-1703`), so moving them leaves the hash unchanged, as
  `handoff.md:101-102` says.
- **Fallback position.** "Put a field that the section does not hold yet after the" / "last field of the section and
  its continuation lines" (`handoff.md:87-88`) uses the glossary terms and matches C005-REQ-127. "That is after the Done
  when checkboxes" holds for this plan, where Done when is the last plan field of every task section.
- **Working-tree bundle.** The working tree already holds uncommitted changes to `setLiteField()` and a rebuilt bundle
  (noted in the D-001 re-review of the spec report). A report made with that bundle follows neither the 0.1.0 rule nor
  a reviewed fix. The hand-off counts from the commit of C005-T-025, which stays correct; that code is outside this
  review.

### Why no further findings (verification)

- **P1 and P4.** C005-REQ-127 is implemented by C005-T-025, and C005-REQ-125 by C005-T-017, whose Intent, Targets,
  Steps and Done when now name the fourth statement. TR-06 27/27 and TR-08 78/78; the four new TCs fill every column
  with the right level, environment, runs and executor.
- **P2.** C005-T-025 has every field of a lite task. Its targets name the function, four test files and the bundle, and
  its steps follow the test-first and bundle rules of the hand-off (`handoff.md:26-29`). The added Preconditions
  sentences of C005-T-011 and C005-T-012 are reporting instructions placed where the implementer reads before starting,
  which suits them. The only gap is CR-64.
- **P3.** The graph stays acyclic, and the new edges make the floor runs and the release commit wait for C005-T-025.
  The critical path and the slack hold. The only gap is CR-65.
- **P5, P6 and P7.** C005-RISK-002 lists C005-T-025. Rollback step 5 still covers a revert of C005-T-025: the placement
  does not touch the hash, and the hand-off covers misplaced lines. The revision makes no new technical decision.
