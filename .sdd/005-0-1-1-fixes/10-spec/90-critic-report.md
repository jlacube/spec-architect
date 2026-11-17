---
artifact: critic-report
change: CHG-005
phase: 10-spec
reviewed_ids: all
---
# Critic report — CHG-005 10-spec

Step 7 review of the lite spec (`10-spec/spec.md`, `10-spec/dod.md`). I checked it against the approved ideation
(`00-ideation/ideation.md` v0.3.0, its `questions-log.md` and `critic-report.md`), the 10-spec `questions-log.md`
(Q-archive-01, Q-sddmd-01, Q-profile-01, Q-extra-reqs-01), the evidence (E-1…E-94), the living specs, the constitution
and the CHG-001 and CHG-002 interfaces. I read repository code only to confirm or refute claims.
`sdd lint 005 --phase 10-spec --json`: 0 errors, 0 warnings, 0 info. `sdd trace 005`: TR-01…TR-05 at 100%.
Every P-01 answer is recorded as given: Q-archive-01 → C005-REQ-112/C005-IF-002; Q-sddmd-01 → C005-REQ-120;
Q-profile-01 → lite kept; Q-extra-reqs-01 → C005-REQ-108 and C005-REQ-115 kept as Should. Finding IDs continue after the
ideation report's CR-9.

## Summary
| blocker | major | minor |
|---|---|---|
| 1 | 5 | 6 |

## Findings

### CR-10 — In a lite change, reporting a task changes the approved plan's hash, so C005-REQ-113 can only be met by making 20-plan stale, and a stale plan then fails the G3 precondition
- **Severity:** blocker
- **Refs:** C005-REQ-113, C005-REQ-112, C005-IF-001, C005-TS-138
- **Evidence:** "- **Statement:** WHERE a change has the lite profile, THE sdd CLI SHALL take the tasks of the archive preconditions of C005-REQ-112 from the task sections of `20-plan/plan.md`, each with the status in its Status field." — `10-spec/spec.md:244`; "1. `20-plan` approved; else `G3 not approved (20-plan <status>)`." — `10-spec/spec.md:1073`; the spec itself notes for the marker: "The lite field is body text of `plan.md`, inside the" — `10-spec/spec.md:1488`. `sdd task set` writes the lite Status field into that body: `text = setLiteField(task.text, id, "Status", o.status);` — `src/tracking/task.ts:119` (Commit, Notes and Completed at follow at :120-122). The hash removes only the frontmatter: "which normalises each file (YAML frontmatter removed, line endings LF, trailing whitespace stripped)" — `.sdd/_living/CAP-gates.md:160` (C001-REQ-806). Stale check then marks the plan: `check.stale = "hash changed";` — `src/gate/stale.ts:36`. The stale check is routine: "3. `sdd stale check <NNN>`" — `plugins/architect/agents/sdd-auditor.md:17`.
- **Why it matters:** in a full change, task status sits in task-file frontmatter, which the hash leaves out. In a lite change, the first `sdd task set` after G3 changes the 20-plan hash. The next `sdd stale check` (run by the auditor, or by the conductor after `.sdd/` edits) sets 20-plan `stale`, and from then on `sdd archive` refuses with "G3 not approved (20-plan stale)". Until now, open lite tasks never blocked an archive. C005-REQ-113 makes reporting every lite task mandatory, so this latent 0.1.0 defect will hit every lite archive, CHG-005's own included (CHG-005 is lite). The only way out is a revision and G3 re-approval. The scenarios do not show the problem: the fixtures of C005-TS-138…C005-TS-140 write the statuses directly and never run `sdd stale check`. Whether the fix enters this change is a scope decision for P-01 (question Q-litehash-01).
- **Suggested fix:** once P-01 answers Q-litehash-01, do one of two things. Either add a MODIFIED delta of C001-REQ-806 that leaves the reporting fields of lite task sections (Status, Commit, Notes, Completed at) out of the phase hash, with a scenario "task set on a lite task after G3, then `sdd stale check` reports no stale phase" and a stated rule for lite plans approved under 0.1.0. Or record the interaction as a defect carried to a later change, and state the re-approval route in the open items of C005-REQ-113 and in C005-IF-001 (Archive preconditions).
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-11 — The "Copilot VS Code" scenario rows run through Copilot CLI with `ask_user`, which the Copilot CLI eval runner removes, and which does not prove VS Code behaviour
- **Severity:** major
- **Refs:** C005-TS-101, C005-TS-106, C005-TS-108, C005-TS-112, C005-DOD-001, C005-REQ-101
- **Evidence:** "the rows "Copilot VS Code" run the Copilot target package, installed" / "into the case workspace, through the Copilot CLI eval runner" — `10-spec/spec.md:318-319`; "| Copilot VS Code | Copilot CLI eval runner | ask_user        |" — `10-spec/spec.md:337` (the same host rows at `:390`, `:417`, `:462`; `10-spec/dod.md:15`). The runner contract in force: "none: `--no-ask-user`; only non-interactive scenarios run (C002-REQ-612)" — `.sdd/_archive/002-multi-platform-targets/10-spec/50-interfaces/eval-runner.md:1282`; "need the host question tool, which" / "`--no-ask-user` removes (§4), so they have no Copilot CLI row." — `eval-runner.md:1487-1488`. "Copilot CLI is a separate implementation whose result does not prove the VS Code behaviour" — `.sdd/_living/CAP-cross-target-verification.md:1526`. The requirement that C005-REQ-101 modifies verifies VS Code manually: "Then an "askQuestions" dialog proposes "lite" or "full" with its size estimate" — `.sdd/_living/CAP-workspace.md:404` (C002-TS-220, `@manual-vscode`), and OpenCode by eval: "| OpenCode    | question        |" — `.sdd/_living/CAP-workspace.md:396`. A MODIFIED delta replaces the living entry "with their ACs and scenarios" — `src/archive/plan.ts:2`.
- **Why it matters:** every Copilot row needs P-01 to answer a question-tool call, and the runner starts Copilot CLI with `--no-ask-user`, so these rows cannot pass. DOD-001 then cannot be met for the second host of G-1 and G-2. The question tool in VS Code is `askQuestions`, not `ask_user`. Even a working Copilot CLI run would not show VS Code behaviour. When CHG-005 is archived, C005-AC-101.1 replaces C002-AC-213.1, so the living spec loses the OpenCode row of C002-TS-219 and the manual VS Code scenario C002-TS-220. The "both hosts" correction in Context (`10-spec/spec.md:17-19`) is right (constitution glossary, entry "Copilot VS Code"; C002-NG-01). It does not change the release package set, so the approved ideation needs no revision. But the acceptance applies it wrongly: it replaces the VS Code host with Copilot CLI.
- **Suggested fix:** give the Copilot VS Code cases of C005-TS-101, C005-TS-106, C005-TS-108 and C005-TS-112 as `@manual-vscode` steps of the manual VS Code checklist, with the `askQuestions` dialog, as C002-TS-220 does, and update C005-DOD-001 and the Verification levels paragraph to match. In C005-AC-101.1, keep the OpenCode row of C002-TS-219 or state that it is retired. At G2, the conductor should tell P-01 about the "both hosts" correction as a departure from the approved ideation wording.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-12 — Where the kind comes from is unspecified when the round does not ask it, and the n/a cells of C005-REQ-102 rule out free text that C005-TS-104 uses
- **Severity:** major
- **Refs:** C005-REQ-102, C005-REQ-101, C005-US-101, C005-TS-106
- **Evidence:** "WHEN the conductor creates a change on a create-change request, THE conductor SHALL run `sdd change new` with the options `--profile` and `--kind` set to the profile and the kind from P-01's answers in the new-change procedure." — `10-spec/spec.md:142`; the glossary delta: "one interview round in which P-01 confirms the profile and gives the kind" — `10-spec/spec.md:980`; the procedure being moved: "Ask about the kind in the same round when" / "`--kind` was not given and the repository has code." — `plugins/architect/commands/new.md:17-18`. C005-REQ-101 (`10-spec/spec.md:132`) requires only the profile proposal. Coverage row: "n/a: the new-change round offers only the profiles and kinds as choices" and "n/a: the options come from P-01's choices in the host's question tool, not from free text" — `10-spec/spec.md:921`; but "When P-01 answers the profile question with the free text "Stop, do not create it"" — `10-spec/spec.md:364`.
- **Why it matters:** in today's procedure the round asks the kind only when `--kind` is absent and the repository has code. In a repository without code, or with `/architect:new "<title>" --kind brownfield`, P-01's answers hold no kind, so C005-REQ-102 has no value to pass. The glossary instead says the round always asks the kind. No requirement says which rule holds. Whether C005-TS-106 can run depends on that choice, because its case workspace (`10-spec/spec.md:329`) does not say whether the repository has code. The question tool always accepts free text, so an answer such as "lite, it changes existing code" is a real error case, not n/a.
- **Suggested fix:** state the kind rule in a requirement or in C005-REQ-102: the round asks the kind unless the command gave `--kind`; with no code and no `--kind`, say which value is passed and whether it counts as asked. Align the glossary entry "New-change procedure" with that rule. Fix the Given of C005-TS-106 (repository with code). Replace the two n/a cells with a scenario for a free-text kind that is none of `greenfield`, `brownfield` or `mixed`.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-13 — C005-TS-111 cannot pass as written, and no requirement owns the lint behaviour it checks
- **Severity:** major
- **Refs:** C005-REQ-103, C005-TS-111, C005-IF-004
- **Evidence:** "Given a workspace with the active lite change 003, gate G1 approved and phase "10-spec" "not-started"" — `10-spec/spec.md:443`; "Then the output holds no error-severity finding" — `10-spec/spec.md:446`; "the lint accepts it in the not-started folder of a lite change is the open item of C005-REQ-103." — `10-spec/spec.md:1269`. Today, `sdd lint 003 --json` on the lite change CHG-003 (10-spec not started, scaffolded `spec.md`) reports `"error": 13`, for example "C003-US-101 lacks the fields "I want", "So that", …" on `.sdd/003-opencode-release/10-spec/spec.md`.
- **Why it matters:** a lite change at G1 with 10-spec not started still holds the scaffolded `10-spec/spec.md`, and that file alone produces error-severity findings. C005-TS-111 therefore fails whatever the questions log does, so it cannot settle the open item. If the log did trip a lint rule, the implementer would have no requirement to implement: C005-REQ-103 is conductor behaviour, and C005-IF-004 item 5 says no subcommand checks the log. My view of the open item: the risk is low. `src/` names `questions-log` only in the lite scaffold list (`src/workspace/templates.ts:19`), and this change's own `10-spec/questions-log.md` lints clean, although with 10-spec in `draft`.
- **Suggested fix:** change the Then of C005-TS-111 to "no finding names `10-spec/questions-log.md`" (or "the same findings as without the file"). Add a `20-plan` row after G2. State what happens if it fails: a lint change under a named requirement, or a defect.
- **Status:** open (re-review 2026-11-17: partly resolved; see Re-review)

### CR-14 — For a lite change, `sdd archive` merges no glossary delta and puts the 18 ADDED requirements into a new `_living/CAP-0-1-1-fixes.md`
- **Severity:** major
- **Refs:** C005-CAP-01, C005-REQ-113, C005-REQ-118
- **Evidence:** "Terms and system names of this change that `../../_constitution/glossary.md` does not define; `sdd archive` merges" / "them into it." — `10-spec/spec.md:974-975`; "C001-REQ-913), the added requirements and the glossary delta into `_living/`." — `10-spec/dod.md:37`. The archive reads the glossary from one place only: `const delta = join(changeDir, "10-spec", "40-domain", "glossary-delta.md");` — `src/archive/plan.ts:360` (sections "domain terms" and "system names", `:141-144`). For a lite spec the living file comes from: `return [{ req: lite, acc: lite, slug: typeof cap === "string" && cap !== "" ? cap : folder.replace(/^\d{3}-/, "") }];` — `src/archive/plan.ts:121`. The frontmatter of `10-spec/spec.md:1-7` has no `capability` key.
- **Why it matters:** the claim at `spec.md:974-975` is false. None of the ten terms or three system names of the glossary delta reaches `_constitution/glossary.md`, so the DOD-G-06 instance in `dod.md:36-37` cannot be met as written. After the archive, living statements such as "THE 0.1.1 release SHALL …" name a system that the glossary does not define. The ADDED requirements go into a living file named after the change, not a capability. For example, C005-REQ-113 would sit in `CAP-0-1-1-fixes.md` while C005-REQ-112, which it completes, sits in `CAP-tracking-archive.md`. Q-profile-01 did not show P-01 this consequence of keeping lite.
- **Suggested fix:** move the glossary delta to where the archive reads it (`10-spec/40-domain/glossary-delta.md`, headings "Domain terms" and "System names"), or drop the claim and record the terms as not merged. State in the spec which living file receives the ADDED requirements (question Q-livingcap-01, not blocking), and correct the DOD-G-06 line to match.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-15 — C005-TS-151 tests a case the Architecture notes say no requirement covers, and its result depends on how many changes are active
- **Severity:** major
- **Refs:** C005-REQ-117, C005-AC-117.1, C005-TS-151
- **Evidence:** "Given the workspace of C005-TS-146, with the working folder ".sdd/_archive/001-coupon-codes/20-plan/"" — `10-spec/spec.md:881`; "| C005-REQ-117 | TS-149 | TS-150 | TS-151 | TS-149, TS-150 | n/a | TS-149 | TS-151 |" — `10-spec/spec.md:936`; "No requirement covers this case, and it stays as" / "at 0.1.0." — `10-spec/spec.md:1735-1736`. Resolution with no change named: `if (folders.length === 1) return join(ctx.root, ".sdd", folders[0]!);` — `src/cli/commands.ts:342`. The Given of C005-TS-146 (`10-spec/spec.md:815`) says nothing about active changes.
- **Why it matters:** the acceptance and the Architecture notes contradict each other. With no active change, `task set T-075` fails with a usage error and exit 2, so the scenario passes on 0.1.0 without proving anything. With exactly one active change, the CLI takes that change and sets its own `T-075` if it exists, which is a write the scenario does not detect, because it checks only for exit 2 and "no file differs". My view of the architect's edge case: leaving it out of scope is acceptable. No archived file can be written (C005-CON-03 holds), and refusing would widen Q-scope-02. But the misdirected write to the only active change should be recorded, not tested as if a requirement covered it.
- **Suggested fix:** remove C005-TS-151 from C005-AC-117.1 and the coverage row, keep the "Unchanged edge" note, and add to it the one-active-change behaviour (or log it as a defect). If the scenario stays, fix its Given (zero active changes) and name the rule it checks.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-16 — No scenario asserts ERR-CLI-014 for writing invocations (rule L3), and the refusal scenarios also pass on 0.1.0
- **Severity:** minor
- **Refs:** C005-REQ-117, C005-IF-001, C005-TS-149, C005-TS-150
- **Evidence:** "The open item of C005-REQ-117 is settled as **ERR-CLI-014** (rule L3)." — `10-spec/spec.md:1101`; "Then the exit code is 2" — `10-spec/spec.md:849` (also `:870`); "Today they refuse with ERR-CLI-002 (E-46, E-48, E-51)" — `10-spec/spec.md:281`.
- **Why it matters:** the L3 contract (ERR-CLI-014 at lookup) is checked only through the DOD-G-04 review. If L3 is never implemented, so that writing commands still give ERR-CLI-002, every row of C005-TS-149 and C005-TS-150 still passes. The scenarios do not tell the decided behaviour from the old one.
- **Suggested fix:** add "And standard error starts with "ERR-CLI-014"" to C005-TS-149 and to the `task set` and `id tombstone` rows of C005-TS-150, and keep ERR-CLI-008 for the `defect add` row.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-17 — "THE README" names the root README by the glossary, and the glossary entry "Frontmatter fallback" claims lite wording that the template lacks
- **Severity:** minor
- **Refs:** C005-REQ-110, C005-REQ-105
- **Evidence:** "THE README SHALL give, in its step that hands a change to an implementer" — `10-spec/spec.md:215`; "| README | As in CHG-001 |" — `.sdd/_constitution/glossary.md:176`; "| README | The repository's `README.md` | C001-COMP-11 |" — `.sdd/_archive/001-architect-agent-suite/10-spec/40-domain/glossary-delta.md:57` (the repository tracks both `README.md` and `plugins/architect/README.md`). "or, in a lite plan, the fields of the task section" — `10-spec/spec.md:983`; the lite template says: "edit the task file's frontmatter `status`" — `plugins/architect/templates/lite/20-plan/handoff.md:26`.
- **Why it matters:** by the glossary, C005-REQ-110 applies to the root `README.md`, while its rationale and C005-TS-129 mean `plugins/architect/README.md`. The fallback definition describes text that the lite template does not contain and that, by non-goal 5, does not change. Since lite tasks now block the archive (C005-REQ-113), a lite implementer without the CLI who follows that paragraph looks for a task file that does not exist.
- **Suggested fix:** name `plugins/architect/README.md` in the statement, or add a glossary-delta row "plugin README". Make the "Frontmatter fallback" definition match the template text, and record the lite gap as a known limitation under non-goal 5.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-18 — "Left to 20-plan" leaves open a README version check that C005-TS-130 already specifies
- **Severity:** minor
- **Refs:** C005-REQ-110, C005-TS-130, C005-CON-08
- **Evidence:** "Whether a check keeps the version of README step 6 equal to `plugin.json` at later version bumps; today" — `10-spec/spec.md:1729`; "Given a temporary copy of the source plugin whose "plugin.json" gives version "0.1.2" and whose README step names "architect-sdd@0.1.1"" / … "Then the test fails with a message naming "README.md", "0.1.1" and "0.1.2"" — `10-spec/spec.md:638-640`; "is an automated unit or integration test that carries its TS ID and passes in `npm run check`" — `10-spec/dod.md:16`.
- **Why it matters:** the README test of C005-TS-129 and C005-TS-130 runs in `npm run check`, so every later version bump fails until README step 6 is updated. That already settles the question the bullet leaves to 20-plan. Leaving it open invites a second check, or doubt about whether the test stays.
- **Suggested fix:** drop the bullet, or reword it as settled ("kept by the README test of C005-TS-129 and C005-TS-130 in `npm run check`").
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-19 — The C005-US-105 notes say lint already searches archived changes, which E-66 contradicts
- **Severity:** minor
- **Refs:** C005-US-105, C005-REQ-116
- **Evidence:** "status, lint and number allocation already search `.sdd/_archive/` (E-50)" — `10-spec/spec.md:109`; "`lint <NNN>` does not use `resolveChange`, but its change filter excludes archived folders" — `10-spec/evidence/spec-addendum.md:99`; C005-REQ-116 counts lint among the failing commands (`10-spec/spec.md:272`).
- **Why it matters:** a planner who reads the story notes may conclude that `lint` needs no change, while C005-TS-146 (`sdd lint 001`) and C005-COMP-006 require a second archived-change selection in the lint engine.
- **Suggested fix:** write "status and number allocation already search `.sdd/_archive/` (E-50); `lint <NNN>` does not (E-57, E-66)".
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-20 — The C005-NFR-001 method fails if the listed commands run in order on one task, does not state PATH for the new prefix, and its DoD line is out of date
- **Severity:** minor
- **Refs:** C005-NFR-001, C005-DOD-008
- **Evidence:** "- **Metric:** number of commands, out of the install line and the four CLI commands of the Reporting protocol (`task set` with `in-progress`, `done` and `blocked`; `defect add`), that exit with code 0 and make the change they report, per shell" — `10-spec/spec.md:963`; "with the npm global prefix in a new empty folder" — `10-spec/spec.md:965`; allowed transitions: `done: ["in-progress"],` — `src/tracking/task.ts:19`; "- **DoD:** to be covered in `dod.md` (written after the acceptance)" — `10-spec/spec.md:968`.
- **Why it matters:** run in the block's order (`10-spec/spec.md:1194-1196`) on one task, `--status blocked` after `done` fails with ERR-CLI-013, so 5 of 5 cannot be reached, and two testers could record different results. With a new empty global prefix, `sdd` resolves only if that folder is on PATH. The DoD line contradicts C005-DOD-008.
- **Suggested fix:** name the fixture tasks: one task todo → in-progress → done, a second task in-progress → blocked, and one defect reference. State that the prefix folder is put on PATH in each shell. Replace the DoD line with "C005-DOD-008".
- **Status:** resolved (re-review 2026-11-17; see Re-review)

### CR-21 — The pre-phase eval scenarios put the conductor's question in the Given, and no P-01 message triggers it
- **Severity:** minor
- **Refs:** C005-TS-108, C005-TS-109, C005-TS-110, C005-TS-112, C005-TS-113, C005-REQ-103
- **Evidence:** "And the conductor asks one interview round with the question "Should the CSV export write a header row?" and the options "Yes (Recommended)" and "No"" — `10-spec/spec.md:408` (the same pattern at `:424`, `:435`, `:455`, `:469`).
- **Why it matters:** the conductor is the system under test, so an eval harness cannot make it ask a given question. A case needs a P-01 message that causes a round in the window. Without one, the case writer has to invent the stimulus, and runs may differ.
- **Suggested fix:** replace the Given with the P-01 message that starts the round (for example "G1 is approved. Before the spec starts, ask me whether the CSV export writes a header row"), and match the scripted answer to the question header.
- **Status:** resolved (re-review 2026-11-17; see Re-review)

## Re-check of the ideation majors and the known open items

| Item | Result in the spec |
|---|---|
| CR-1 (SDD.md text and README) | resolved: C005-REQ-109, C005-REQ-110, C005-REQ-111 (every file of the source plugin, bundle included) and C005-REQ-120 for existing workspaces (Q-sddmd-01). A grep of `plugins/architect/` and `src/` finds the forms only in the four places listed (bundle line 10436 included); the root `README.md` has none |
| CR-2 (who fills `<version>`) | resolved: `{{VERSION}}` filled by the rendering CLI (C005-REQ-106, C005-IF-003 §2), the planner uses `sdd --version` (C005-REQ-107), LINT-HAND-003 checks the result (C005-REQ-108). The README's static version is kept in step by C005-TS-130 (CR-18) |
| CR-3 (answers after G3) | resolved: Q-scope-04 non-goal; C005-US-102 Out of scope; C005-IF-004 item 1 |
| CR-4 (measures) | partly resolved: G-1…G-3 and G-5 have scenarios, and G-5 is measured against the C005-IF-001 list. The second-host rows of G-1 and G-2 cannot run (CR-11). With an eval budget of 0, the only fallback is a DOD-G-01 waiver |
| CR-5 (release assumption) | resolved: Q-release-01; C005-US-106, C005-REQ-118…C005-REQ-120, C005-DOD-005…C005-DOD-007 |
| Open item of C005-REQ-103 | low risk on the code, but C005-TS-111 cannot settle it as written (CR-13) |
| Architect's edge case (writing command with no change named, run from `_archive/`) | acceptable out of scope, since no archived file can be written. The acceptance contradicts the note, and the one-active-change case is a misdirected write (CR-15) |
| README version at later bumps | already enforced by C005-TS-130 in `npm run check` (CR-18) |
| "Both hosts" correction | correct (constitution glossary "Copilot VS Code"; C002-NG-01); same release package set, so no ideation revision is needed. The acceptance applies it wrongly (CR-11) |

## Rubric
| Rubric | Item | Result |
|---|---|---|
| stories | S1 Persona is a defined P-ID | pass: P-01 and P-02 defined in Context with their CHG-001/CHG-002 base |
| stories | S2 Value / outcome stated | pass |
| stories | S3 INVEST | pass: one story per goal, each independently testable |
| stories | S4 Every story has ≥ 1 requirement | pass: TR-01 6/6 |
| stories | S5 Out of scope stated where a neighbour exists | pass: C005-US-104's neighbour (task status after the archive) is in the open items of C005-REQ-112 |
| stories | S6 Traces to the ideation | pass: §2, §4.1, §8 and the Q-IDs; the "both hosts" correction agrees with the constitution |
| requirements | R1 Singular outcome | pass |
| requirements | R2 Testable | CR-11, CR-13 |
| requirements | R3 Unambiguous | CR-12, CR-17 |
| requirements | R4 Correct EARS pattern | pass |
| requirements | R5 Implementation-free | pass |
| requirements | R6 Complete | CR-12 |
| requirements | R7 Consistent | CR-10, CR-14, CR-15, CR-18, CR-19 |
| requirements | R8 Feasible | CR-10, CR-11 |
| requirements | R9 Necessary | pass: C005-REQ-108 and C005-REQ-115 confirmed by P-01 (Q-extra-reqs-01) |
| requirements | R10 Measurable values with units | pass |
| requirements | R11 Delta and evidence | CR-11 (the MODIFIED C002-REQ-213 replaces C002-AC-213.1 at archive); the other deltas cite living ID and evidence |
| requirements | R12 Priority consistent | pass |
| NFRs | N1 ISO 25010 category | pass: Portability / installability |
| NFRs | N2 Metric with unit | pass |
| NFRs | N3 Threshold set | pass: 5 of 5 per shell |
| NFRs | N4 Feasible method and environment | CR-20 |
| NFRs | N5 Covered by a DoD item | pass: C005-DOD-008 |
| acceptance | A1 Every REQ has an AC, every AC a scenario | pass: TR-02, TR-03 100% |
| acceptance | A2 Scenarios observable and concrete | CR-13, CR-15, CR-16, CR-21 |
| acceptance | A3 One behaviour per scenario | pass |
| acceptance | A4 Error and abuse cases present | pass |
| acceptance | A5 n/a cells justified credibly | CR-12 |
| domain, interfaces, architecture | D1 Entities with attributes, owner, invariants | pass: Data view; one marker per change (LINT-TASK-005) |
| domain, interfaces, architecture | D2 Lifecycles > 2 states diagrammed | n/a: no new lifecycle; task and phase state machines unchanged |
| domain, interfaces, architecture | D3 Interfaces parse and name their errors | pass: C005-IF-001 catalogue, C005-IF-002 parse rules, C005-IF-003 §1, C005-IF-004 |
| domain, interfaces, architecture | D4 Components with ID, responsibilities, requirements | pass: C005-COMP-001…C005-COMP-013; diagram edges match Depends on |
| domain, interfaces, architecture | D5 Decisions with alternatives recorded | pass: ERR-CLI-014 (4 candidates), marker name, Q-archive-01; the skill choice deferred to an ADR (C005-CON-06) |
| DoD and index | O1 Every REQ and NFR covered | pass: TR-05 20/20 and 1/1 |
| DoD and index | O2 Evidence types fit the statements | CR-11 (C005-DOD-001's Copilot rows cannot produce the report) |
| DoD and index | O3 Global items referenced | CR-14 (the DOD-G-06 instance names a glossary merge that does not happen) |
| DoD and index | X1 Index is navigation only | n/a: a lite change has no index file |

## Re-review — 2026-11-17 (focused, step 7)

Focused re-review of the revised spec against CR-10…CR-21, and of the new content. Inputs: `10-spec/spec.md`,
`10-spec/dod.md`, `10-spec/40-domain/glossary-delta.md`, `10-spec/questions-log.md` (rounds 3–4),
`10-spec/evidence/spec-addendum.md` (E-95…E-103), `80-traceability.md`, `85-open-items.md`, `ids.json`; repository code
read only to confirm claims (`src/gate/hash.ts`, `src/gate/stale.ts`, `src/tracking/task.ts`, `src/archive/plan.ts`,
`src/gate/critic-parse.ts`, `src/lint/spec-facts.ts`, `src/lint/rules/task-004.ts`, the lite templates).
`sdd lint 005 --phase 10-spec --json`: 0 errors, 0 warnings, 0 info (`"tool": "architect-plugin@0.1.0"`).
`sdd trace 005`: TR-01 6/6, TR-02 25/25, TR-03 25/25, TR-04 1/1, TR-05 25/25 and 1/1. The P-01 answers Q-litehash-01
("Exclude report fields"), Q-vscode-01 ("Manual VS Code check"), Q-livingcap-01 ("New 0.1.1-fixes file") and
Q-litehash-02 ("Re-approve G3 once") are taken as given and not reopened. New findings continue at CR-22.

**Reviewed set.** C005-CAP-01; C005-US-101, C005-US-103, C005-US-104, C005-US-105, C005-US-106; C005-REQ-101,
C005-REQ-102, C005-REQ-103, C005-REQ-110, C005-REQ-113, C005-REQ-116, C005-REQ-117, C005-REQ-120, C005-REQ-121,
C005-REQ-122, C005-REQ-123, C005-REQ-124, C005-REQ-125; C005-AC-101.1, C005-AC-102.1, C005-AC-103.1, C005-AC-104.1,
C005-AC-117.1, C005-AC-121.1, C005-AC-122.1, C005-AC-123.1, C005-AC-124.1, C005-AC-125.1; C005-TS-101…C005-TS-113,
C005-TS-149, C005-TS-150, C005-TS-155…C005-TS-172 (C005-TS-151 tombstoned, `ids.json:6`); C005-NFR-001; C005-IF-001,
C005-IF-002 (item 6), C005-IF-003 (§3, §5), C005-IF-004, C005-IF-005; C005-COMP-001, C005-COMP-002, C005-COMP-009,
C005-COMP-013; flows F5, F6, F7 and their diagrams; C005-DOD-001…C005-DOD-009 and the inherited items of `dod.md`;
`40-domain/glossary-delta.md`; E-95…E-103.

### Status of CR-10 … CR-21

| Finding | Status | Evidence |
|---|---|---|
| CR-10 (blocker) | resolved | C005-REQ-121 "MODIFIED C001-REQ-806" (`spec.md:292`) leaves "the report-field lines of every task section" out of the hash of a lite `20-plan/plan.md` (`spec.md:294`). C005-IF-005 §2 step 2a (`spec.md:1547-1569`) uses the bounds of `setLiteField()` (`src/tracking/task.ts:89-90`, heading `^#{2,4}\s+<id>`, end at the next `^#{1,4}\s`) and the four lines `sdd task set` writes (`:119-122`). Lines are removed, not blanked, so a replaced field and an inserted one normalise alike. The marker field stays hashed (C005-IF-002 item 6). Plans approved with 0.1.0: C005-REQ-122 and C005-IF-005 §4. Release-notes route: C005-REQ-125. Precondition 1 of C005-IF-001 updated (`spec.md:1316-1318`). C005-TS-167 runs `sdd stale check` after `task set` (`spec.md:984-988`). The lite rows of C005-TS-168 cover the excluded lines and the hashed ones (`spec.md:1004-1009`). C005-TS-170 has a full-profile regression row (`spec.md:1029`). The full-form golden values stay (E-101; `tests/integration/cap08/TS-806.test.ts:20`). Remaining hazard for CHG-005's own re-approval: CR-25 |
| CR-11 (major) | resolved | Copilot CLI rows removed. `@manual-vscode` scenarios C005-TS-155, C005-TS-157, C005-TS-164 and C005-TS-165 use the `askQuestions` dialog (`spec.md:397-407`, `:468-475`, `:566-574`, `:626-631`). Verification levels: "Copilot CLI is" / "not used" (`spec.md:371-372`). C005-DOD-009 holds the manual record (`dod.md:24`). The OpenCode row of C002-TS-219 is kept as C005-TS-156, and C002-TS-220 is restated by C005-TS-155 (`spec.md:379-380`). P-01 decided Q-vscode-01. Carry of C005-TS-156: CR-26 |
| CR-12 (major) | resolved | C005-REQ-123 asks the kind unless `--kind` was given and drops "the repository has code" (`spec.md:156-157`). C005-REQ-124 handles a free-text kind (`spec.md:165`). The glossary entry "New-change round" names the condition (`glossary-delta.md:19`). C005-TS-106 now reads "a request that gives no option "--kind"" (`spec.md:461`). C005-TS-160 covers a repository without code. The n/a cells are replaced by C005-TS-161 and C005-TS-163 (`spec.md:1161`). Remaining wording gap: CR-22 |
| CR-13 (major) | partly resolved (Status stays `open`) | Done: the Then of C005-TS-111 is "no finding of the output names "003-*/<phase>/questions-log.md"" and "the findings … are those that "sdd lint 003" prints for the same workspace without that file" (`spec.md:602-603`). A G2 row exists (`spec.md:608`). C005-IF-004 item 5 states the expected result (`spec.md:1528-1531`). Not done: no route if the scenario fails. The open item still reads "the acceptance of this requirement checks it on a lite fixture" (`spec.md:179`), and IF-004 says "whether the lint gives it is the open item of C005-REQ-103" (`spec.md:1531`). No requirement owns a lint change and no defect route is stated, so a failing C005-TS-111 (in C005-DOD-002) would force a lint change that no requirement authorises. The remaining gap is small; one sentence in the open item closes it |
| CR-14 (major) | resolved | The glossary delta sits in `10-spec/40-domain/glossary-delta.md`, under "## 1. Domain terms" and "## 2. System names (…)". The archive matches these headings with `/domain terms/i` and `/system names/i` at that path (`src/archive/plan.ts:141-144`, `:360`). None of the 13 terms or 4 system names is defined in `_constitution/glossary.md` (grep), so the merge adds rows and redefines nothing. C005-CAP-01 names `_living/CAP-0-1-1-fixes.md` and says MODIFIED entries are replaced in place (`spec.md:26-29`, confirmed by `src/archive/plan.ts:290-296`). DOD-G-06 is updated (`dod.md:40-43`) |
| CR-15 (major) | resolved | C005-TS-151 is removed and tombstoned (`ids.json:6`). C005-US-105 Out of scope (`spec.md:115`) and the "Unchanged edge" note (`spec.md:2142-2149`) record the write to the only active change as 0.1.0 behaviour, not tested. The C005-REQ-117 row no longer names it (`spec.md:1180`) |
| CR-16 (minor) | resolved | C005-TS-149: "And standard error starts with "ERR-CLI-014"" (`spec.md:1078`). C005-TS-150 has a code column, with ERR-CLI-008 kept for `defect add` (`spec.md:1103-1106`). C005-TS-166 pins the full line, which matches the catalogue and `formatError()` (`src/cli/errors.ts:29`, `:80`) |
| CR-17 (minor) | resolved | "THE plugin README SHALL" (`spec.md:238`). System name "plugin README" (`glossary-delta.md:35`). The "Frontmatter fallback" definition (`glossary-delta.md:23`) matches `plugins/architect/templates/lite/20-plan/handoff.md:26-27`. The lite gap is a known limitation in C005-US-103 Out of scope (`spec.md:94`) and C005-IF-003 §3 (`spec.md:1458-1461`) |
| CR-18 (minor) | resolved | Bullet removed from "Left to 20-plan" (`spec.md:2132-2140`); C005-IF-003 §5 states that the README test keeps the version equal (`spec.md:1477-1479`) |
| CR-19 (minor) | resolved | "Status and number allocation already search `.sdd/_archive/` (E-50); `lint <NNN>` does not (E-57, E-66)." (`spec.md:114`) |
| CR-20 (minor) | resolved | The Method names tasks A and B, the command order and PATH (`spec.md:1211`). DoD line "C005-DOD-008" (`spec.md:1214`). `dod.md:23` matches |
| CR-21 (minor) | resolved | The P-01 message that starts the round is in the Given of C005-TS-108 (`spec.md:557`), C005-TS-109 (`:580`), C005-TS-110 (`:591`), C005-TS-112 (`:620-622`) and C005-TS-113 (`:637`). The C005-REQ-103 rationale covers both stimuli (`spec.md:175`) |

Other checks, not findings:
- **Stale reference at `spec.md:1786`.** I judge it a real defect, minor: CR-23.
- **Profile size.** P-01 answered Q-profile-01 with 20 requirements in view (`questions-log.md:37`); the spec now has 25 (TR-02 25/25). Lite thresholds only guide the proposal and the answer stands. The conductor may mention the growth at G2.
- **Open items count.** `85-open-items.md` lists 0 markers. The "open items: 3" of `sdd trace 005` are the Open items fields of C005-REQ-103, C005-REQ-112 and C005-REQ-121, which are not markers.

### Summary (re-review)

New findings:

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 5 |

Open after the re-review: 0 blocker; 1 major (CR-13, partly resolved); 5 minor (CR-22…CR-26). Resolved: CR-10, CR-11,
CR-12, CR-14…CR-21.

### New findings

### CR-22 — C005-REQ-102 and C005-REQ-124 name only "the" new-change round, so the kind answered in the further round and a second unusable answer are outside both statements
- **Severity:** minor
- **Refs:** C005-REQ-102, C005-REQ-124, C005-TS-162, C005-COMP-001
- **Evidence:** "`--kind` set to the kind that the option `--kind` of the new-change command gave or, without that option, to the kind that P-01 answered in the new-change round" — `10-spec/spec.md:147`; "IF P-01 answers the kind question of the new-change round with text that does not name exactly one of the kinds `greenfield`, `brownfield` and `mixed`, THEN THE conductor SHALL ask for the kind again in a further interview round before it runs `sdd change new`." — `10-spec/spec.md:165`; "| New-change round | The one interview round of the new-change procedure:" — `10-spec/40-domain/glossary-delta.md:19`; "When P-01 answers that call with "mixed"" / "Then the transcript shows exactly one "sdd change new" call, with the options "--profile lite" and "--kind mixed"" — `10-spec/spec.md:537-538`; "loop while the kind answer names no single kind of greenfield, brownfield, mixed" — `10-spec/spec.md:2055`; "with a further round for the kind while an answer names no single kind" — `10-spec/spec.md:1655`.
- **Why it matters:** the glossary defines the new-change round as one round. C005-REQ-102 takes the kind only from that round, but C005-TS-162 expects `--kind mixed`, which P-01 gave in the further round. C005-REQ-124 covers only the answer to the new-change round. A second answer that names no kind, or a decline in the further round, falls under no requirement, while F5 and C005-COMP-001 describe a loop. The prompt writer has to guess which text binds. An eval grader cannot fail a run that guesses a kind after a second unusable answer.
- **Suggested fix:** in C005-REQ-102 write "… to the kind that P-01 answered in the new-change round or in a further round of C005-REQ-124". In C005-REQ-124 write "answers the kind question of the new-change round, or of a further round, with text …", and say that a decline there creates no change. Align the glossary entries "New-change procedure" and "New-change round" with the further round. Add an Examples row or scenario in which the further answer is unusable again.
- **Status:** open

### CR-23 — C005-COMP-013 realizes C005-REQ-122 through C005-TS-172, which belongs to C005-REQ-125, and no component realizes C005-REQ-125
- **Severity:** minor
- **Refs:** C005-COMP-013, C005-REQ-125, C005-REQ-122, C005-TS-172
- **Evidence:** "- **Realizes:** C005-REQ-118, C005-REQ-120, C005-REQ-122 (its release-notes scenario C005-TS-172)" — `10-spec/spec.md:1786`; "#### C005-AC-125.1 — Release notes state the one G3 re-approval of a lite plan approved with the sdd CLI 0.1.0" — `10-spec/spec.md:1148` (C005-TS-172 at `:1151`); "- **Realizes:** C005-REQ-116, C005-REQ-121, C005-REQ-122" — `10-spec/spec.md:1744` (C005-COMP-009); "packages, tarball, npm publish and release notes (C005-REQ-118, C005-REQ-119, C005-REQ-120)" — `10-spec/spec.md:2130`. No Realizes field names C005-REQ-125.
- **Why it matters:** this is the stale reference named in the brief, and I judge it a real defect. C005-REQ-122 is stale-check behaviour of the gate engine (C005-COMP-009, C005-IF-005), which the release-notes component cannot realize. C005-REQ-125, the release-notes sentence, is left with no component (D4). A planner who derives task components from Realizes would attach the release-notes task to C005-REQ-122 and give C005-REQ-125 no owner. The G-6 row of "As-is to to-be delta" also leaves C005-REQ-125 out.
- **Suggested fix:** in C005-COMP-013 write "Realizes: C005-REQ-118, C005-REQ-120, C005-REQ-125". Keep C005-REQ-122 with C005-COMP-009. Add C005-REQ-125 to the G-6 row at `spec.md:2130`.
- **Status:** open

### CR-24 — Three statements still describe the spec before the revision: C001-REQ-806 "stay[s] as stated", a resolver rule cited to the hash requirement, and the evidence range E-54…E-94
- **Severity:** minor
- **Refs:** C005-REQ-116, C005-REQ-121, C005-CAP-01
- **Evidence:** "C001-REQ-806 and C001-REQ-801 do not exclude archived changes (E-52) and stay as stated." — `10-spec/spec.md:315`; "- **Delta:** MODIFIED C001-REQ-806" — `10-spec/spec.md:292`; "the resolver refuses malformed numbers as today (C001-REQ-806)" — `10-spec/spec.md:1179`; "or of `evidence/spec-addendum.md` (E-54…E-94, commit `fef82eb`)" — `10-spec/spec.md:20`; "Scope: the four open items of the 10-spec brief (step 2):" — `10-spec/evidence/spec-addendum.md:10`, while the file now ends with "## 5. Topic 5 — lite approval hash" — `10-spec/evidence/spec-addendum.md:261`.
- **Why it matters:** the C005-REQ-116 rationale tells a reader that C001-REQ-806 is unchanged, although C005-REQ-121 replaces it at archive. The C005-REQ-116 coverage row cites the hash-algorithm requirement for resolver behaviour. The Context sends a reader looking for E-95…E-103, which C005-REQ-121 and C005-IF-005 cite (`spec.md:299`), to a range that leaves them out. None of this changes behaviour, but each one breaks the "one fact in one place" reading (R7, R11).
- **Suggested fix:** in C005-REQ-116 write "C001-REQ-801 and C001-REQ-806 do not exclude archived changes (E-52); C001-REQ-801 stays as stated, and C001-REQ-806 changes only by C005-REQ-121". In the C005-REQ-116 abuse cell, cite the resolver contract (C001-IF-01) instead of C001-REQ-806. In Context write "E-54…E-103". The cartographer should add topic 5 to the addendum's scope sentence.
- **Status:** open

### CR-25 — "One re-approval" holds only if the re-approval and every later stale check use the 0.1.1 CLI; neither the CHG-005 bullet nor C005-REQ-125 says so, and this workspace runs the 0.1.0 CLI
- **Severity:** minor
- **Refs:** C005-REQ-122, C005-REQ-125, C005-IF-005, C005-TS-171
- **Evidence:** "approved with sdd 0.1.0, so its `20-plan` goes stale at the first stale check after a task report or, at the" / "latest, at the first stale check of the 0.1.1 CLI; the re-approval comes before the archive task." — `10-spec/spec.md:2139-2140`; "and that one revision of that phase and one G3 approval make it `approved` again." — `10-spec/spec.md:359`; "compares a stored hash only with the hash of this rule (E-98)" — `10-spec/spec.md:1602`; only the scenario names the version: "then one revision of phase "20-plan" and its G3 approval with the sdd CLI 0.1.1" — `10-spec/spec.md:1034`. The CLI that the conductor, the auditor and this review run: `"tool": "architect-plugin@0.1.0"` (output of `sdd lint 005 --phase 10-spec --json`, 2026-11-17).
- **Why it matters:** the two CLIs give a lite plan different hashes, in both directions. A G3 approval made with the 0.1.0 CLI stores the old-rule hash: the first 0.1.1 stale check undoes it, and so does any 0.1.0 stale check after a task report. A G3 approval made with the 0.1.1 CLI stores a hash without the Status lines: any later stale check by the 0.1.0 CLI computes a different hash and sets 20-plan `stale` again, with or without a task report. CHG-005 is implemented with the 0.1.0 plugin installed, and the conductor and auditor run `sdd stale check` routinely. Unless the plan switches every gate, stale and archive command of CHG-005 to the 0.1.1 CLI at the re-approval, CHG-005 faces more stale/revision cycles before its archive. The release-notes sentence has the same gap for a user who keeps a 0.1.0 CLI next to a 0.1.1 one.
- **Suggested fix:** in the "Left to 20-plan" bullet, state that the re-approval is made with the 0.1.1 CLI built by this change, and that every later `stale check`, `gate approve`, `gate show` and `archive` of CHG-005 runs that CLI (or the installed plugin is updated first). In C005-REQ-125 write "one revision of that phase and one G3 approval with the sdd CLI 0.1.1", and align C005-TS-172.
- **Status:** open

### CR-26 — C005-TS-156 is sent to CHG-003 with no carry record there and no DOD-G-01 waiver, although DOD-G-01 "applies to every scenario of the change"
- **Severity:** minor
- **Refs:** C005-TS-156, C005-DOD-001, C005-AC-101.1
- **Evidence:** "- **DOD-G-01** — applies to every scenario of the change." — `10-spec/dod.md:28`; "record. C005-TS-156 runs in CHG-003 (C005-DOD-001)." — `10-spec/dod.md:31`; "C005-TS-156, the OpenCode row of C002-TS-219 restated, runs with the OpenCode `@eval` scenarios that C002-DOD-002 moved to CHG-003" — `10-spec/dod.md:16`; "Every acceptance scenario of the change is automated (unit, integration, eval) or listed as manual with an executed record, and passes;" — `.sdd/_constitution/constitution.md:57`; CHG-003's carry record lists only CHG-002 items: "It carries the OpenCode release dropped from CHG-002: C002-T-051 and C002-T-052, the OpenCode parts of C002-DOD-001, 002, 005, 008, 009, 019 and 021, and the INJ-21 fix" — `.sdd/003-opencode-release/change.md:30`, a move that rested on "P-01 answer to Q-opencode-scope-01" (same line).
- **Why it matters:** CHG-005 can close only if C005-TS-156 passes or P-01 waives it. The DoD says both that DOD-G-01 applies to every scenario and that this one runs elsewhere, and names no waiver. Nothing in CHG-003 records the scenario. After CHG-005's archive, C005-TS-156 sits in the living spec under C005-REQ-101 with no change that owns its run. The CHG-002 precedent rested on a P-01 answer and a carry record in CHG-003. This deferral has neither. Question Q-opencode-01, not blocking, is in the hand-back.
- **Suggested fix:** once P-01 answers, either state in `dod.md` that C005-TS-156 needs a DOD-G-01 waiver at CHG-005's close and is carried to CHG-003, with the conductor recording the carry in CHG-003 (a note in `change.md` or a defect carried there), or run C005-TS-156 in CHG-005 through the OpenCode eval runner and add it to C005-DOD-001.
- **Status:** open

### Rubric (re-review set)

| Rubric | Item | Result |
|---|---|---|
| stories | S1 Persona is a defined P-ID | pass: the changed stories name P-01 or P-02 |
| stories | S2 Value / outcome stated | pass: C005-US-101 and C005-US-104 now state the VS Code check and the hash outcome |
| stories | S3 INVEST | pass: C005-US-104 holds six requirements for one goal, each testable on its own (`spec.md:104`) |
| stories | S4 Every story has ≥ 1 requirement | pass: TR-01 6/6 |
| stories | S5 Out of scope stated where a neighbour exists | pass: C005-US-103 (lite fallback limitation) and C005-US-105 (no-change writing subcommand) |
| stories | S6 Traces to the ideation | pass: Q-litehash-01, Q-litehash-02, Q-vscode-01 and Q-livingcap-01 cited where applied |
| requirements | R1 Singular outcome | pass: C005-REQ-121…C005-REQ-125 one SHALL each; the split of C005-REQ-120 and C005-REQ-125 follows R1 |
| requirements | R2 Testable | pass: C005-TS-167…C005-TS-172 decide each new statement from outside |
| requirements | R3 Unambiguous | CR-22 |
| requirements | R4 Correct EARS pattern | pass: C005-REQ-121 ubiquitous (as its base), C005-REQ-122 and C005-REQ-123 event-driven, C005-REQ-124 unwanted-behaviour, C005-REQ-125 ubiquitous |
| requirements | R5 Implementation-free | pass: function names appear only in C005-IF-005 §5 and the components, not in statements |
| requirements | R6 Complete | CR-22 (a second unusable kind answer) |
| requirements | R7 Consistent | CR-22, CR-24 |
| requirements | R8 Feasible | CR-25 (CHG-005's own re-approval under two CLI versions) |
| requirements | R9 Necessary | pass: C005-REQ-122 records Q-litehash-02; C005-REQ-123 and C005-REQ-124 close CR-12 |
| requirements | R10 Measurable values with units | pass |
| requirements | R11 Delta and evidence | CR-24 (C005-REQ-116 says C001-REQ-806 stays); C005-REQ-121 cites C001-REQ-806 and E-95…E-103 |
| requirements | R12 Priority consistent | pass: all new requirements Must under Must stories |
| NFRs | N1 ISO 25010 category | pass |
| NFRs | N2 Metric with unit | pass |
| NFRs | N3 Threshold set | pass |
| NFRs | N4 Feasible method and environment | pass: CR-20 resolved |
| NFRs | N5 Covered by a DoD item | pass: C005-DOD-008 |
| acceptance | A1 Every REQ has an AC, every AC a scenario | pass: TR-02 25/25, TR-03 25/25 |
| acceptance | A2 Scenarios observable and concrete | pass: values, transcripts, files and exact error lines |
| acceptance | A3 One behaviour per scenario | pass |
| acceptance | A4 Error and abuse cases present | pass: C005-TS-161, the "different" rows of C005-TS-168, the full row of C005-TS-170 |
| acceptance | A5 n/a cells justified credibly | pass: rows of C005-REQ-121…C005-REQ-125 |
| domain, interfaces, architecture | D1 Entities with attributes, owner, invariants | pass: Data view rows for report fields and the lite approval hash |
| domain, interfaces, architecture | D2 Lifecycles > 2 states diagrammed | n/a: phase and task state machines unchanged |
| domain, interfaces, architecture | D3 Interfaces parse and name their errors | pass: C005-IF-005 §1–§2 name scope, bounds, the exact line forms and the fail-safe for other forms |
| domain, interfaces, architecture | D4 Components with ID, responsibilities, requirements | CR-23 |
| domain, interfaces, architecture | D5 Decisions with alternatives recorded | pass: Q-litehash-01 (4 candidates) and Q-litehash-02 (5 candidates) in `questions-log.md` |
| DoD and index | O1 Every REQ and NFR covered | pass: TR-05 25/25 and 1/1 |
| DoD and index | O2 Evidence types fit the statements | pass: C005-DOD-009 review record for the manual runs |
| DoD and index | O3 Global items referenced | CR-26 (DOD-G-01 and C005-TS-156) |
| DoD and index | X1 Index is navigation only | n/a: a lite change has no index file |

### Why no further findings

- **Stories and requirements.** Beyond CR-22 and CR-24, I checked C005-REQ-121 against the living C001-REQ-806
  (`.sdd/_living/CAP-gates.md:160`): only the normalisation clause changes. The single-file and generated-file
  clauses are kept. C005-REQ-122 matches `staleCheck()` (`src/gate/stale.ts:32-37`, which writes on every call,
  `src/cli/commands.ts:280`). C005-REQ-123 and C005-REQ-124 agree with the interview protocol's free-text rule.
- **Acceptance.** I checked that C005-TS-170 can run as an automated test: the 0.1.0 rule is today's
  `normalizeForHash()`, which C005-IF-005 §5 keeps. C005-TS-171 follows the phase lifecycle. The `todo → done`
  example of C005-IF-005 §2 is an allowed transition (`src/tracking/task.ts:16`). The DoD ranges list every `@eval`,
  untagged, `@manual-vscode` and `@review` scenario exactly once, and the tombstoned C005-TS-151 is left out.
- **Interfaces and architecture.** I checked that `phaseHash()` is the only hash path for `gate approve`, `stale check`,
  `gate show` and `hash` (`src/gate/hash.ts:38-44`, `:67-74`), as C005-IF-005 §5 states. The per-ID hashes are read
  only by `change revise` (`src/gate/revise.ts:20-22`), which the Open items of C005-REQ-121 record. Two things
  are stated twice: C005-IF-005 orders step 2a before trailing white space is stripped, and §5 keeps
  `normalizeForHash()` unchanged. The result does not depend on that order, because removal matches the start of a
  line, so this is not a finding. F5–F7 use only edges of the component diagram.
- **Evidence.** E-95…E-103 match the cited lines (`src/gate/hash.ts:33-59`, `src/model/frontmatter.ts:48-53`,
  `src/gate/stale.ts:21-48`, `src/tracking/task.ts:86-122`, `src/archive/plan.ts:94-98`, `:121`, `:295`, `:360`,
  `tests/integration/cap08/TS-806.test.ts:20`). The two corrections (E-102, E-103) are disclosed as such.
