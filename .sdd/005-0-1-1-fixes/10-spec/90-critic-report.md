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

## Re-review — D-001 revision (2026-11-18)

Focused re-review of the 10-spec revision for defect D-001 (`change.md:16`: "sdd task set on a lite task inserts Commit,
Notes and Completed at between the Done when field and its checkboxes"). P-01's answer to Q-d001-01 ("Fix in CHG-005
(Recommended)", `questions-log.md:132-140`, round 6) is taken as given and not reopened. Inputs: the working-tree diff of
`10-spec/spec.md`, `10-spec/dod.md` and `10-spec/questions-log.md` against HEAD (`9eae3b2`); E-99
(`evidence/spec-addendum.md:283`); repository code read only to confirm claims: `src/tracking/task.ts` at HEAD (last
changed in `ffe41ae`, C001-T-026), `src/gate/hash.ts`, `src/gate/gate.ts`, `src/lint/spec.ts`,
`src/lint/rules/task-001.ts`, `plugins/architect/templates/lite/20-plan/plan.md`, `.sdd/_living/CAP-tracking-archive.md`.
`node plugins/architect/scripts/sdd.mjs lint 005 --phase 10-spec --json`: 0 errors, 0 warnings, 0 info.
`node plugins/architect/scripts/sdd.mjs trace 005` (no `--write`): TR-01 6/6, TR-02 27/27, TR-03 27/27, TR-05 27/27 and
1/1. New findings start at CR-42 (the plan report holds CR-27…CR-41).

**Reviewed set.** C005-REQ-127; C005-AC-127.1; C005-TS-176 and its row in the coverage table; C005-US-104 (requirement
list, notes, Traces to); C005-DOD-002, C005-DOD-003; C005-COMP-007. Linked by the revised text: C005-IF-005 §2 (cited by
the C005-REQ-127 rationale), C005-REQ-121 (the hash rule the rationale relies on), C005-REQ-122, C005-REQ-125 and
C005-TS-172 (the G3 re-approval of lite plans reported with 0.1.0, CR-46), the Data view row "Report fields of a lite
task section" and the G-4 rows of the As-is to to-be delta. C005-T-025 belongs to the plan review. CR-10…CR-26 are
outside this review and keep their recorded status.

### Checks named in the brief

| Check | Result |
|---|---|
| EARS form and singularity of C005-REQ-127 | pass: event-driven, one SHALL, one observable outcome (where the new line stands). The replace-in-place case stays in the rationale, outside the statement |
| 0.1.0 behaviour claimed in the rationale | holds. `for (let i = at + 1; i < end; i++) if (lines[i]!.startsWith("- **")) last = i;` and `lines.splice(last + 1, 0, …)` — `src/tracking/task.ts:96-97` at HEAD, as E-99 states. `setTask` writes Status, Commit, Notes and Completed at in that order (`:119-122`), so each inserted line becomes the last `- **` line and the next one follows it: the three lines land between `- **Done when:**` and its checkboxes. The indented checkboxes then read as the value of Completed at (`src/lint/spec.ts:180`), LINT-TASK-001 reports an empty Done when (`src/lint/rules/task-001.ts:12`), and `gate approve` refuses unwaived lint errors with ERR-CLI-010 (`src/gate/gate.ts:138-139`). One case the claim leaves out: with no `- **` line in the section, 0.1.0 inserts after the heading (`let last = at;`, `:95`); see CR-42 |
| Step 2a of C005-IF-005 removes the lines wherever they are in the section | holds. Step 2a removes every line of a task section that begins with one of the four texts (`spec.md:1614-1628`), and its section bounds are those within which `sdd task set` writes (`spec.md:1617-1619`; `src/tracking/task.ts:89-91`). The new insertion point lies inside the same bounds, and the inserted line begins at its first character. Stale sentence in §2: CR-45. End-of-file case: Other checks |
| Scenario testability, both Examples rows | CR-42 (the form of the checkbox lines is not given), CR-43 (Targets and Verification; "follow") |
| "Continuation lines" defined precisely enough | no: CR-42 |
| Coverage-table n/a reasons | CR-44 (boundary and idempotency cells); the error, authorization and abuse cells are credible |

### Summary (re-review D-001)

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 4 |

Open in the D-001 set after this re-review: 0 blocker; 1 major (CR-42); 4 minor (CR-43…CR-46).

### New findings (D-001)

### CR-42 — "Continuation lines" is defined nowhere, so the insertion point of C005-REQ-127 has several readings, and C005-TS-176 does not tell them apart
- **Severity:** major
- **Refs:** C005-REQ-127, C005-AC-127.1, C005-TS-176, C005-COMP-007
- **Evidence:** "THE sdd CLI SHALL insert the field's line after the last line of the section's last field, that field's continuation lines included." — `10-spec/spec.md:322`; "ends with the field "- **Done when:**" and its two checkbox lines, <next>" — `10-spec/spec.md:1090`; "write a missing report field of a lite task section after the section's last field and its continuation lines (C005-REQ-127)" — `10-spec/spec.md:1788`. The term occurs only at `spec.md:322`, `:1087` and `:1788`; neither `40-domain/glossary-delta.md` nor C005-IF-005 defines it. The lint reads a field value up to the first blank or unindented line: `if (l.trim() === "" || !/^\s+/.test(l)) break;` — `src/lint/spec.ts:180`. With no `- **` line in the section, 0.1.0 inserts after the heading: `let last = at;` — `src/tracking/task.ts:95` (HEAD). The untracked test for this scenario encodes its own rule: `while (/^\s+\S/.test(lines[last + 1] ?? "")) last++;` — `tests/integration/chg005/C005-TS-176.test.ts:37`.
- **Why it matters:** the only operative term of the statement has at least three readings that write different files. (a) The non-blank indented lines directly after the field, as LINT-TASK-001 reads a field value. (b) A Markdown list item, which also takes an indented line after a blank line, so a Done when list with a blank line between two checkboxes counts whole; under reading (a) the fields split that list and the second checkbox ends up under Completed at, the D-001 damage again. (c) Every line up to the next field or the end of the section, which also takes trailing blank lines and an unindented `- [ ]` list. The Given gives neither the indentation of the checkbox lines nor what directly follows them, so a fixture of two-space checkboxes passes under every reading: the scenario cannot fail an implementation that picked another rule. The implementer and the test writer have each picked reading (a) on their own. The statement also has no insertion point for a task section with no field line, since "the section's last field" does not exist there.
- **Suggested fix:** define the term in C005-REQ-127 or in a paragraph of C005-IF-005 §2: "field line: a line of the task section that begins with `- **<name>:**`; continuation line: a non-blank line that begins with a space or tab and directly follows the field line or another continuation line; a blank line or a line that begins at its first character ends the field (the lines that LINT-TASK-001 reads as the field's value)". State the no-field case (the line follows the heading, as at 0.1.0). In C005-TS-176, give the checkbox lines exactly (for example `  - [ ] CSV header written`) and add an Examples row in which a blank line and an indented line follow the checkboxes, with the expected placement. An alternative that needs no continuation rule: insert a missing report field directly after the section's Status field, or after the last report field already present; this keeps the four report fields together and does not depend on the form of Done when.
- **Status:** open

### CR-43 — The last Then of C005-TS-176 depends on Targets and Verification, which the Given does not fill, and "follow" does not say "directly"
- **Severity:** minor
- **Refs:** C005-TS-176, C005-AC-127.1
- **Evidence:** "holds the field "- **Status:** in-progress" and ends with the field "- **Done when:**" and its two checkbox lines" — `10-spec/spec.md:1090`; "And "sdd lint 004" reports no LINT-TASK-001 finding for "C004-T-001"" — `10-spec/spec.md:1095`; a lite task also needs non-empty Targets and Verification: `return ["Targets", "Verification", "Done when"].filter((name) => (fieldText(lines, name) ?? "") === "");` — `src/lint/rules/task-001.ts:12`; the lite template leaves both empty: "- **Targets:**" / "- **Verification:**" — `plugins/architect/templates/lite/20-plan/plan.md:21-22`; "with today's date follow the last checkbox line, in this order" — `10-spec/spec.md:1093`.
- **Why it matters:** a fixture that follows the Given and copies the lite template gets "C004-T-001 has an empty Targets, Verification section" from LINT-TASK-001, so the last Then fails whatever the fix does. "Follow the last checkbox line" also holds when the lines stand after a blank line or at the end of the section, so the Then accepts placements that C005-REQ-127 does not describe.
- **Suggested fix:** add to the Given "and non-empty Targets and Verification fields", or narrow the Then to "no LINT-TASK-001 finding that names Done when". Write "directly follow the last checkbox line".
- **Status:** open

### CR-44 — The C005-REQ-127 coverage row gives as boundary a case outside the statement, cites a frontmatter-only requirement for it, and leaves the real boundaries without a scenario
- **Severity:** minor
- **Refs:** C005-REQ-127, C005-TS-176
- **Evidence:** "| TS-176 (a field that the section holds is replaced in place: Status) |" and "n/a: a repeated "sdd task set" finds the fields and replaces them in place (C001-REQ-901)" — `10-spec/spec.md:1243`; the trigger of the statement: "writes a report field that a lite task section of `20-plan/plan.md` does not hold yet" — `10-spec/spec.md:322`; the replacement is stated only in the rationale: "A field that the section already holds is replaced in place, as at 0.1.0." — `10-spec/spec.md:323`; the living C001-REQ-901 writes "into the task's frontmatter (`status`, `report.commit`, `report.notes`, and `report.completed_at` when the status is `done`)" — `.sdd/_living/CAP-tracking-archive.md:58`; the marker may stand last: "bullet field `- **Archive task:** true` among the task's fields, in any position" — `10-spec/spec.md:1445`.
- **Why it matters:** the boundary cell and the idempotency n/a rest on the in-place replacement of a lite field, which no statement requires: C005-REQ-127 covers only a missing field, and C001-REQ-901 covers task-file frontmatter only. C005-TS-176 asserts the replacement (`spec.md:1094`) with no owning requirement. The boundaries of the insertion rule have no scenario: a last field with no continuation line, where the new line must go directly after the field as at 0.1.0 (for example an archive-task marker after the checkboxes), and a task section that ends the file. These are the cases where the new rule must keep the 0.1.0 result, and nothing checks them.
- **Suggested fix:** in the boundary cell, name an Examples row of C005-TS-176 whose last field has no continuation line (for example `- **Archive task:** true` after the checkboxes) and one whose task section ends the file. In the boundary and idempotency cells, cite the replacement as kept 0.1.0 behaviour (E-99; `src/tracking/task.ts:92-93`) instead of C001-REQ-901, or state it in Open items of C005-REQ-127 as unchanged behaviour that C005-TS-176 checks.
- **Status:** open

### CR-45 — Text around the revision still describes the spec before D-001
- **Severity:** minor
- **Refs:** C005-US-104, C005-COMP-007, C005-IF-005, C005-REQ-127
- **Evidence:** "Six requirements, all for goal G-4, each testable on its own." — `10-spec/spec.md:104`, while `:105` lists seven, C005-REQ-127 included; "- **Traces to:** ideation §2, §4.1 G-4, §8; Q-scope-01, Q-scope-03, Q-archive-01, Q-litehash-01" — `10-spec/spec.md:106` (no D-001, no Q-d001-01); "`sdd task set` (C005-COMP-007, tracking part, code unchanged)" — `10-spec/spec.md:1878`, while C005-COMP-007 now names `src/tracking/task.ts` (`setLiteField()`) and realizes C005-REQ-127 (`spec.md:1785-1789`), and its Evidence field cites E-37, E-94, E-42 and E-65 but not E-99 (`spec.md:1793`); "so the result does not depend on whether `sdd task set` replaced a field or inserted" / "it after the last bullet of the section (E-99)." — `10-spec/spec.md:1635-1636`; the As-is to to-be delta has G-4 rows for the archive and the lite plan hash only (`spec.md:2199-2200`).
- **Why it matters:** each place contradicts C005-REQ-127 or leaves it out. A planner who reads the Data view takes the tracking code as unchanged. C005-IF-005 §2 gives the 0.1.0 insertion point as the current one. The delta table, which lists the to-be behaviour per goal, has no row for the new placement. None of this changes behaviour, but each breaks the "one fact in one place" reading (R7, S6).
- **Suggested fix:** in C005-US-104 write "Seven requirements" and add D-001 and Q-d001-01 to Traces to. In the Data view write "`sdd task set` (C005-COMP-007, tracking part; placement of a missing field changed by C005-REQ-127)", and add E-99 to the Evidence of C005-COMP-007. In C005-IF-005 §2 write "… replaced a field or inserted it (C005-REQ-127; at 0.1.0, after the last bullet of the section, E-99)". Add a delta row "G-4, D-001 | a missing report field goes after the last `- **` line of the section, between Done when and its checkboxes (E-99) | after the last field and its continuation lines (C005-REQ-127) | C005-COMP-007".
- **Status:** open

### CR-46 — Task sections already written by the 0.1.0 CLI stay broken, and nothing tells P-01 to repair them before the G3 re-approval that C005-REQ-122 requires
- **Severity:** minor
- **Refs:** C005-REQ-127, C005-REQ-122, C005-REQ-125, C005-TS-172, C005-US-104
- **Evidence:** "WHEN `sdd task set` writes a report field that a lite task section of `20-plan/plan.md` does not hold yet" — `10-spec/spec.md:322`; "LINT-TASK-001 reports an empty Done when, and `sdd gate approve` refuses a lite `20-plan` until the lines are moved by hand." — `10-spec/spec.md:323`; "THE sdd CLI SHALL set that `20-plan` phase `stale`, with no rule that accepts the hash of the 0.1.0 normalisation." — `10-spec/spec.md:313`; "And they state that one revision of that phase and one G3 approval with the sdd CLI 0.1.1 make it approved again" — `10-spec/spec.md:1217`; `if (lint.length > 0) throw new CliError("ERR-CLI-010", …` — `src/gate/gate.ts:139`; "2. Carry to a later change — 0.1.1 ships with the bug; the release notes name the hand workaround." — `10-spec/questions-log.md:137`.
- **Why it matters:** C005-REQ-127 changes only where a missing field goes. A section in which 0.1.0 already put Commit, Notes or Completed at between Done when and its checkboxes keeps them there: a later `task set` replaces those lines in place and inserts any missing one after the checkboxes, so Done when stays empty for the lint. Such a plan is a lite plan approved and reported with the 0.1.0 CLI, which C005-REQ-122 sends to one revision and G3 approval. That approval then fails with ERR-CLI-010 (LINT-TASK-001) until P-01 moves the lines by hand. The release notes of C005-TS-172 name the re-approval but not this step, and C005-US-104 states no out-of-scope for repairing existing sections. The hand workaround in the release notes was part of option 2 only, which P-01 did not choose.
- **Suggested fix:** add to C005-REQ-125 and C005-TS-172 a statement that a lite plan reported with the sdd CLI 0.1.0 may hold report-field lines between Done when and its checkboxes, and that P-01 moves them after the checkboxes before the G3 approval. Record "repair of task sections written by the 0.1.0 CLI" as out of scope in C005-US-104. A repair by the CLI would go beyond "one requirement and one task" of Q-d001-01 and is not suggested.
- **Status:** open

### Rubric (D-001 set)

| Rubric | Item | Result |
|---|---|---|
| stories | S1 Persona is a defined P-ID | pass: C005-US-104 names P-01 |
| stories | S2 Value / outcome stated | pass: goal G-4; C005-REQ-127 keeps a reported lite plan free of the LINT-TASK-001 error that blocks a G3 approval |
| stories | S3 INVEST | pass: C005-REQ-127 is testable on its own (C005-TS-176); size hint M still fits |
| stories | S4 Every story has ≥ 1 requirement | pass: TR-01 6/6 |
| stories | S5 Out of scope stated where a neighbour exists | CR-46 (repair of sections written by the 0.1.0 CLI) |
| stories | S6 Traces to the ideation | CR-45 (Traces to omits D-001 and Q-d001-01) |
| requirements | R1 Singular outcome | pass: one SHALL, one placement outcome |
| requirements | R2 Testable | pass: the line order of `plan.md` is observable from outside; the gaps of the scenario are under A2 |
| requirements | R3 Unambiguous | CR-42 |
| requirements | R4 Correct EARS pattern | pass: event-driven; the trigger is the write of a missing field |
| requirements | R5 Implementation-free | pass: the statement names lines of `plan.md`; `setLiteField()` appears only in C005-COMP-007 |
| requirements | R6 Complete | CR-42 (section without a field line), CR-46 (sections written by 0.1.0) |
| requirements | R7 Consistent | CR-45 |
| requirements | R8 Feasible | pass: the insertion stays inside the section bounds that `setLiteField()` already computes (`src/tracking/task.ts:89-91`) |
| requirements | R9 Necessary | pass: D-001 and Q-d001-01 |
| requirements | R10 Measurable values with units | n/a: the statement holds no quantity |
| requirements | R11 Delta and evidence | pass: ADDED is right; no living requirement places lite fields (C001-REQ-901 writes frontmatter, `.sdd/_living/CAP-tracking-archive.md:58`); the 0.1.0 claim cites E-99, which holds at HEAD |
| requirements | R12 Priority consistent | pass: Must under the Must story C005-US-104 |
| NFRs | N1 ISO 25010 category | n/a: no NFR references C005-REQ-127 |
| NFRs | N2 Metric with unit | n/a: as N1; the method of C005-NFR-001 counts exit codes and reported changes, not line positions |
| NFRs | N3 Threshold set | n/a: as N1 |
| NFRs | N4 Feasible method and environment | n/a: as N1 |
| NFRs | N5 Covered by a DoD item | n/a: as N1 |
| acceptance | A1 Every REQ has an AC, every AC a scenario | pass: C005-AC-127.1 → C005-TS-176; TR-02 27/27, TR-03 27/27 |
| acceptance | A2 Scenarios observable and concrete | CR-42, CR-43 |
| acceptance | A3 One behaviour per scenario | pass: the Thens describe the result of one `task set` call |
| acceptance | A4 Error and abuse cases present | pass: the rule refuses nothing; the refusals of `task set` stay with C001-REQ-902 and C001-REQ-922 |
| acceptance | A5 n/a cells justified credibly | CR-44 |
| domain, interfaces, architecture | D1 Entities with attributes, owner, invariants | CR-45 (Data view "code unchanged") |
| domain, interfaces, architecture | D2 Lifecycles > 2 states diagrammed | n/a: no lifecycle changes |
| domain, interfaces, architecture | D3 Interfaces parse and name their errors | pass: the bounds and line forms of C005-IF-005 §2 cover the new position; its stale sentence is in CR-45 |
| domain, interfaces, architecture | D4 Components with ID, responsibilities, requirements | pass: C005-COMP-007 names `setLiteField()`, the new responsibility and C005-REQ-127; C001-COMP-06 already owns `src/tracking/` (`.sdd/_archive/001-architect-agent-suite/10-spec/60-architecture/architecture.md:86`) |
| domain, interfaces, architecture | D5 Decisions with alternatives recorded | pass: Q-d001-01 records two candidates although marked material; for a fix-now-or-later question these are the real alternatives. The placement rule has an alternative in CR-42 |
| DoD and index | O1 Every REQ and NFR covered | pass: C005-REQ-127 in C005-DOD-002 and C005-DOD-003; TR-05 27/27 |
| DoD and index | O2 Evidence types fit the statements | pass: a test report for an untagged scenario, a coverage report for CLI code |
| DoD and index | O3 Global items referenced | pass: C005-DOD-002 is the DOD-G-01 instance for untagged scenarios (`dod.md:28`), and C005-TS-176 is untagged (`spec.md:1088-1089`) |
| DoD and index | X1 Index is navigation only | n/a: a lite change has no index file |

### Other checks, not findings (D-001)

- **End of file.** Step 2a removes "each line with its line terminator" (`spec.md:1615`). When a task section ends the
  file with no final line break, the report-field line inserted last has no terminator, and a literal reading leaves the
  line break that the insertion added to the line before it. The implemented step drops the lines from the line list
  and joins the rest (`src/gate/hash.ts:45`, `:57-61` at HEAD), which gives back the approved text. The case predates
  the revision (0.1.0 also inserts at the end of the file when the last `- **` line is the last line), and the lite
  template closes the task list with `## Test mapping` (`plugins/architect/templates/lite/20-plan/plan.md:25`). The
  end-of-file Examples row of CR-44 would cover it.
- **Defect reference.** D-001 gives `ref: C005-REQ-121` (`change.md:16`); the fix is C005-REQ-127. The manifest is
  written by the CLI; the resolution of `sdd defect close` can name C005-REQ-127 and C005-T-025.
- **Work ahead of the gates.** The working tree already holds a change to `setLiteField()` (`src/tracking/task.ts`, and
  the rebuilt `plugins/architect/scripts/sdd.mjs`) and an untracked `tests/integration/chg005/C005-TS-176.test.ts`,
  while 10-spec and 20-plan are `in-revision` (`change.md:10-11`). Their rule is reading (a) of CR-42. I did not review
  that code.

### Why no further findings (D-001)

- **Stories and requirements.** I checked the EARS shape and singularity of C005-REQ-127, its system name (sdd CLI, a
  constitution system name), and each step of the rationale against HEAD: the insertion after the last `- **` line
  (`src/tracking/task.ts:96-97`), the write order (`:119-122`), the lint's reading of the checkboxes as the value of
  Completed at (`src/lint/spec.ts:180`), the empty Done when (`src/lint/rules/task-001.ts:12`) and the gate refusal
  (`src/gate/gate.ts:138-139`). ADDED is the right delta: the living `CAP-tracking-archive.md` has no requirement on
  lite fields. The remaining gaps are CR-42, CR-45 and CR-46.
- **Acceptance.** The transition `in-progress → done` of C005-TS-176 is allowed (`src/tracking/task.ts:17`). The order
  Commit, Notes, Completed at follows from the write order and the statement. Row 2 matches the lite template (Done
  when last, then a blank line and `## Test mapping`, template lines 23-25). The error, authorization and abuse cells
  are credible: the rule refuses nothing, there are no roles, and the values are P-01's own options. The gaps are
  CR-42, CR-43 and CR-44.
- **Interfaces and architecture.** The bounds of step 2a (`src/gate/hash.ts:38`, `:40`) and of `setLiteField()`
  (`src/tracking/task.ts:89-90`) end a section at the same heading levels, so no inserted line can leave the part that
  step 2a scans. F7 (`spec.md:1868`) names no position and stays correct. C005-COMP-007 needs no new interface: the rule
  changes only the line order of a file whose format C005-IF-005 already describes. The stale text is CR-45.
- **DoD.** C005-DOD-002 adds C005-TS-176 and C005-REQ-127, and C005-DOD-003 adds C005-REQ-127 (`dod.md:17-18`). Both
  evidence types fit a CLI behaviour checked by an automated test.

## Re-review — D-001 revision, second reviewer (2026-11-18)

A second, independent focused review of the same revision ran while the section above was being written. It used the
same reviewed set and inputs, plus `plugins/architect/skills/interview-protocol/references/questions.schema.json` and
`.sdd/_constitution/constitution.md`. `node plugins/architect/scripts/sdd.mjs lint 005 --json`: 0 findings;
`node plugins/architect/scripts/sdd.mjs trace 005`: TR-01…TR-08 at 100%, TR-11 acyclic. It reached the substance of
CR-42, CR-43, CR-45 and CR-46 on its own and confirms CR-44; this addendum adds only what the section above lacks. New
IDs continue this report at CR-47: the plan report's D-001 section reserves "(CR-42 … CR-59)" for this report
(`20-plan/90-critic-report.md:287`) and starts its own at CR-60, and CR-47…CR-59 were unused.

### Summary (second review)

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 2 |

Open from this addendum: 2 minor (CR-47, CR-48). A severity note on CR-46 follows the findings; question Q-placement-01
for P-01 is in the critic's hand-back.

### New findings (second review)

### CR-47 — C005-TS-176 does not say that the section holds no Commit, Notes or Completed at line, while a section brought to `in-progress` by `sdd task set` holds one, which changes the expected order
- **Severity:** minor
- **Refs:** C005-TS-176, C005-AC-127.1, C005-REQ-127
- **Evidence:** "holds the field "- **Status:** in-progress" and ends with the field "- **Done when:**" and its two checkbox lines, <next>" — `10-spec/spec.md:1090`; "And the lines "- **Commit:** a1b2c3d", "- **Notes:** CSV export done" and "- **Completed at:**" with today's date follow the last checkbox line, in this order" — `10-spec/spec.md:1093`; Completed at is written "on every call, `—` while the task is not done" — `10-spec/spec.md:1628`; the in-progress task C005-T-010 holds "- **Completed at:** —" — `20-plan/plan.md:612` (its Status at `:578`).
- **Why it matters:** the natural way to reach the Given, `sdd task set C004-T-001 --status in-progress`, also writes "- **Completed at:** —". Under C005-REQ-127 that line already stands after the checkboxes, so the `done` call replaces it in place and inserts Commit and Notes after it. The order becomes Completed at, Commit, Notes, and the "in this order" Then fails although the placement is right. The scenario holds only for a hand-written fixture that the Given does not describe. CR-43 covers the other gaps of this Given (Targets, Verification) and of the Then ("directly").
- **Suggested fix:** add "and holds no Commit, Notes or Completed at line" to the Given, or add an Examples row that starts from a section reported `in-progress` through `sdd task set`, with the expected order "Completed at, Commit, Notes".
- **Status:** open

### CR-48 — The round-6 entry departs from C001-IF-05: the ID holds digits in its topic, and a question marked material shows two candidates
- **Severity:** minor
- **Refs:** C005-REQ-127
- **Evidence:** "### Q-d001-01 — How should defect D-001 (lite report fields inserted between Done when and its checkboxes) be fixed?" — `10-spec/questions-log.md:132`; `"id": { "type": "string", "pattern": "^Q-[a-z]+-[0-9]{2,3}$" },` — `plugins/architect/skills/interview-protocol/references/questions.schema.json:18`; "- **Blocking:** yes · **Material:** yes · **Candidates considered:** 2 (conductor: fix in this change; carry to a later change)" — `10-spec/questions-log.md:133`; for a material question: `"then": { "required": ["candidates_considered", "options", "rejected"], "properties": { "candidates_considered": { "minimum": 4 } } }` — `questions.schema.json:60`; C005-REQ-127 cites the ID: "P-01's answer to Q-d001-01" — `10-spec/spec.md:323`.
- **Why it matters:** the questions contract allows lowercase letters only in the topic, so a check of logged IDs against C001-IF-05 rejects Q-d001-01, which C005-REQ-127 cites. A material question needs four or five candidates with the rejected ones named. With two, P-01 was shown only when to fix D-001, never how; the repair of sections already written by the 0.1.0 CLI (CR-46) was not among the options. The D5 row of the section above passes the two candidates as the real alternatives of a timing question; I read the schema rule as binding whenever a question is marked material.
- **Suggested fix:** while 10-spec is in revision, rename the question to a letters-only ID (for example Q-defectfix-01) in the log and in the rationale of C005-REQ-127, or keep the ID and note the departure in the log entry. For the material marker, record the candidates considered with the rejected ones, or put the placement choice to P-01 now (Q-placement-01, below).
- **Status:** open

### Notes on findings of the section above (second review)

- **CR-46, severity and route.** I would grade CR-46 major: it is the common upgrade case, since the lite template ends
  every task with `- **Done when:**` (`plugins/architect/templates/lite/20-plan/plan.md:23`) and `task set` writes
  Completed at on every call (`10-spec/spec.md:1628`), so every 0.1.0 lite plan with a reported task fails the one G3
  re-approval that C005-REQ-125 promises. I also read a repair as inside "one requirement and one task" of Q-d001-01:
  it changes the same statement of C005-REQ-127 and the same function. Re-placing Commit, Notes and Completed at on
  every `task set` is hash-neutral (step 2a of C005-IF-005) and repairs a section on its next report, C005-T-025's own
  included. The choice between that repair and the documented hand move of CR-46's suggested fix belongs to P-01:
  question Q-placement-01 in the hand-back.
- **CR-60 of the plan report** has the same root cause. A LINT-TASK-001 error left in a task section also fails
  DOD-G-03 at the close: "| DOD-G-03 | No new error-severity finding from `sdd lint` on this repository's `.sdd/` |
  command-output |" — `.sdd/_constitution/constitution.md:59`. With the repair option of Q-placement-01, the `done`
  report of C005-T-025 repairs its own section; with the hand-move option, the step that CR-60 asks for stays needed.
- **ID range.** `20-plan/90-critic-report.md:287` names "(CR-42 … CR-59)" for this report; it holds CR-42…CR-48.

### Rubric (second review)

| Rubric | Item | Result |
|---|---|---|
| stories | S1 Persona is a defined P-ID | pass: C005-US-104 names P-01 |
| stories | S2 Value / outcome stated | pass: as in the D-001 rubric above |
| stories | S3 INVEST | pass: one goal, each requirement testable on its own; the stale count is CR-45 |
| stories | S4 Every story has ≥ 1 requirement | pass: TR-01 6/6 |
| stories | S5 Out of scope stated where a neighbour exists | CR-46 |
| stories | S6 Traces to the ideation | CR-45 |
| requirements | R1 Singular outcome | pass |
| requirements | R2 Testable | pass |
| requirements | R3 Unambiguous | CR-42 |
| requirements | R4 Correct EARS pattern | pass: event-driven |
| requirements | R5 Implementation-free | pass |
| requirements | R6 Complete | CR-42, CR-46 |
| requirements | R7 Consistent | CR-45 |
| requirements | R8 Feasible | pass: one function with one production caller (E-118) |
| requirements | R9 Necessary | pass: D-001 and Q-d001-01 |
| requirements | R10 Measurable values with units | n/a: the statement holds no quantity |
| requirements | R11 Delta and evidence | pass: ADDED; E-99 holds at HEAD (`src/tracking/task.ts:87-100`, `:119-122`) |
| requirements | R12 Priority consistent | pass: Must under a Must story |
| NFRs | N1 ISO 25010 category | n/a: no NFR in the reviewed set |
| NFRs | N2 Metric with unit | n/a: no NFR in the reviewed set |
| NFRs | N3 Threshold set | n/a: no NFR in the reviewed set |
| NFRs | N4 Feasible method and environment | n/a: no NFR in the reviewed set |
| NFRs | N5 Covered by a DoD item | n/a: no NFR in the reviewed set |
| acceptance | A1 Every REQ has an AC, every AC a scenario | pass: TR-02 27/27, TR-03 27/27 |
| acceptance | A2 Scenarios observable and concrete | CR-42, CR-43, CR-47 |
| acceptance | A3 One behaviour per scenario | pass |
| acceptance | A4 Error and abuse cases present | CR-46 (no case for a section that already holds a misplaced report field) |
| acceptance | A5 n/a cells justified credibly | CR-44 |
| domain, interfaces, architecture | D1 Entities with attributes, owner, invariants | CR-45 |
| domain, interfaces, architecture | D2 Lifecycles > 2 states diagrammed | n/a: no lifecycle changes |
| domain, interfaces, architecture | D3 Interfaces parse and name their errors | pass: step 2a of C005-IF-005 removes report-field lines wherever they stand |
| domain, interfaces, architecture | D4 Components with ID, responsibilities, requirements | pass: C005-COMP-007 names `setLiteField()` and C005-REQ-127; its Evidence gap is in CR-45 |
| domain, interfaces, architecture | D5 Decisions with alternatives recorded | CR-48 |
| DoD and index | O1 Every REQ and NFR covered | pass: TR-05 27/27 |
| DoD and index | O2 Evidence types fit the statements | pass |
| DoD and index | O3 Global items referenced | pass: DOD-G-01 reaches C005-TS-176 through C005-DOD-002 |
| DoD and index | X1 Index is navigation only | n/a: a lite change has no index file |

### Why no further findings (second review)

- **Stories and requirements.** Beyond the findings above, I checked that the C005-US-104 story still holds C005-REQ-127
  (its "I want" names the lite task reports, `10-spec/spec.md:100`), that no living requirement states where lite
  fields go (C001-REQ-901 states the frontmatter form, `.sdd/_living/CAP-tracking-archive.md:58`), and that the
  rationale's hash claim holds (step 2a matches report-field lines by their first characters, `spec.md:1620-1621`).
- **Acceptance.** The When of C005-TS-176 uses the real option names (`--commit`, `--note`; `src/cli/commands.ts:259`)
  and an allowed transition (`src/tracking/task.ts:17`). The error, authorization and abuse cells of the C005-REQ-127
  row are credible. What remains is in CR-42, CR-43, CR-44 and CR-47.
- **Domain, interfaces, architecture.** C005-COMP-007 names the function, the responsibility and C005-REQ-127, and no
  interface changes: C005-IF-005 §2 already removes the lines wherever they stand. The outdated texts are CR-45; the
  decision record is CR-48.
- **DoD.** C005-DOD-002 and C005-DOD-003 name C005-TS-176 and C005-REQ-127 once each (`10-spec/dod.md:17-18`), with
  evidence types that fit an automated test of CLI code.

## Verification — D-001 fixes (2026-11-18)

Focused verification (step 7, before the G2 re-approval) of the fixes for CR-42 … CR-46 of the section "Re-review —
D-001 revision (2026-11-18)" and for CR-47 and CR-48 of the second review, and a review of the changed text for new
problems. Diff read: `git diff -- .sdd/005-0-1-1-fixes/` (working tree against HEAD `9eae3b2`). Code read only to
confirm claims, at HEAD: `src/tracking/task.ts` (transitions `:15-21`, `findTask()` `:48-72`, `setLiteField()`
`:87-100`, `setTask()` `:102-122`), `src/lint/spec.ts:173-184` (`fieldText()`), `src/model/graph.ts:172-180`,
`src/gate/gate.ts:139`; `.sdd/_living/CAP-planning.md:405`. The uncommitted code in `src/` and `tests/` was not
reviewed. `node plugins/architect/scripts/sdd.mjs lint 005 --phase 10-spec --json`: 0 errors, 0 warnings, 0 info.
`node plugins/architect/scripts/sdd.mjs trace 005` (no `--write`): TR-01 6/6, TR-02 27/27, TR-03 27/27, TR-04 1/1,
TR-05 27/27 and 1/1, TR-08 78/78, TR-11 acyclic; of its "open items: 3", none is a marker in `10-spec/`
(`85-open-items.md:12`: "Total: 0 (none)"). I ran no stale check, gate command, `trace --write` or other writing
command. New findings continue at CR-49: CR-47 and CR-48 are taken by the second review, and the plan report starts
its D-001 findings at CR-60.

**Reviewed set.** C005-REQ-127 (statement, rationale, open items); C005-AC-127.1 with C005-TS-176, C005-TS-177,
C005-TS-178, C005-TS-179 and the paragraph on the CR-42 readings (`spec.md:1134-1139`); the C005-REQ-127 row of the
coverage table; C005-REQ-125 and C005-AC-125.1 with C005-TS-172; the rationale of C005-REQ-122; C005-US-104; the
glossary-delta §1 rows Report fields, Field line and Continuation line; C005-DOD-002, C005-DOD-003, C005-DOD-007;
C005-IF-005 §2; C005-COMP-007; the Data view row "Report fields of a lite task section"; the As-is to to-be row
"G-4, D-001". Read for consistency only: C005-US-106 (the story of C005-REQ-125), round 6 of `questions-log.md`, and on
the plan side C005-T-017, C005-T-025 and `20-plan/handoff.md:84-107` (the hand move). The frontmatter keeps
`reviewed_ids: all`; this paragraph gives the set.

### Resolution of the earlier findings (D-001)

| Finding | Result | Evidence |
|---|---|---|
| CR-42 (major) | resolved | Both terms are defined: "| Field line | A line of a task section (bounds: C005-IF-005 §2) that begins, at its first character, with `- **`, a field name and `:**`" — `40-domain/glossary-delta.md:25`. The Continuation line row ends the lines at a blank line, at a line that begins with a character other than a space or a tab, and at the end of the section, and adds "an indented line after a blank line is no continuation line" — `:26`; this is what `fieldText()` reads (`src/lint/spec.ts:180`). The statement now has the no-field case: "or, when the section holds no field line, directly after the section's heading line." — `spec.md:323`. C005-TS-176 gives the checkbox lines exactly, indented by two spaces (`spec.md:1101-1102`, `:1106`), and C005-TS-177 adds the marker, blank-line and unindented cases (`spec.md:1128-1131`). Every reading of CR-42 is ruled out by at least one row (row check below) |
| CR-43 (minor) | resolved | The Given fills both fields: "- **Targets:**", "  - add src/export/csv.ts", "- **Verification:**", "  - npm test" (`spec.md:1096-1099`, inside the docstring); the Thens read "directly follow" (`spec.md:1106-1107`) |
| CR-44 (minor) | resolved | The replacement is now part of the statement: "write the field's line in place of the section's first field line of that field" — `spec.md:323`. The idempotency cell cites C005-REQ-127 instead of C001-REQ-901, and the boundary cell names "TS-177 (row 1: last field with no continuation line; …)" and "TS-176 (row 3: the section ends the file)" — `spec.md:1309`. The rationale says why the kept 0.1.0 behaviour is stated here: C001-REQ-618 "names the fields of a lite task section, not where `sdd task set` writes them" — `spec.md:324` (confirmed by `.sdd/_living/CAP-planning.md:405`) |
| CR-45 (minor) | resolved | "Seven requirements, all for goal G-4" — `spec.md:104`; "Q-d001-01; D-001" in Traces to — `:107`; "placement of a missing field changed by C005-REQ-127" — `:1945`; E-99 in the Evidence of C005-COMP-007 — `:1860`; "at the place C005-REQ-127 gives, or, with the sdd CLI 0.1.0, after" / "the last bullet of the section (E-99)" — `:1702-1703`; the delta row "| G-4, D-001 |" — `:2268` |
| CR-46 (minor) | resolved | C005-US-104 Out of scope: "repair by the sdd CLI of task sections in which the sdd CLI 0.1.0 already wrote report-field lines" — `spec.md:105`. The fourth part of C005-REQ-125: "that before that G3 approval P-01 moves each report-field line that stands between a field line" — `spec.md:378`; the same in C005-TS-172 (`:1283`) and C005-DOD-007 (`dod.md:22`). The G3 refusal until the move is in the rationale of C005-REQ-122 (`spec.md:315`). The plan carries the statement into C005-T-017 (`20-plan/plan.md:849`, `:862`) |
| CR-47 (minor, second review) | resolved | "with exactly these lines, in this order, and no other line" — `spec.md:1092`. The lines hold no Commit, Notes or Completed at line, so the order Commit, Notes, Completed at follows from the write order of `setTask()` (`src/tracking/task.ts:119-122`) |
| CR-48 (minor, second review) | not resolved; not in the fix list of this round | The round-6 entry is unchanged: "### Q-d001-01 — How should defect D-001 …" and "**Candidates considered:** 2" — `questions-log.md:132-133`. No answer to Q-placement-01 (repair by the CLI, or hand move) is logged. The revised text states the hand move as decided and grounds it on the option text of Q-d001-01: "Q-d001-01 chose one requirement and one task; critic CR-46" — `spec.md:105`; "P-01 decided one requirement and one task for D-001 (Q-d001-01)" — `spec.md:379`. The conductor decides whether P-01 confirms the route before G2; an answer already given belongs in the log |

### Row check of C005-TS-176 … C005-TS-179

Readings named in CR-42: (a) the lines that LINT-TASK-001 reads, now the glossary definition; (b) the Markdown list
item, which spans a blank line; (c) every line up to the next field or the end of the section; and the 0.1.0 place,
after the last line that begins with `- **` (`src/tracking/task.ts:95-97`). I traced each row through the statement,
the two glossary rows and `setTask()`, which writes Status, then Commit and Notes only when a value is known, then
Completed at on every call (`:109-122`; `findTask()` reads the known values from the section, `:66`). So
`--status in-progress` with no other option writes only Status and Completed at (C005-TS-177, C005-TS-178), and
`--status done --commit a1b2c3d` writes no Notes line when the section holds none (C005-TS-179).

| Row | One expected outcome | Readings it tells apart | Agrees with the glossary |
|---|---|---|---|
| TS-176 row 1: heading `### C004-T-002` next | yes: Commit, Notes, Completed at directly after "  - [ ] CSV rows written", then the heading | the 0.1.0 place (Commit directly after Done when) from (a), (b) and (c), which agree here | yes: the heading line begins with `#` and ends the continuation lines of Done when |
| TS-176 row 2: blank line, then `## Test mapping` | yes: the line after Completed at is the blank line | the 0.1.0 place; (c) only under the bounds of C005-IF-005 §2, not under the scenario's own wording (CR-49) | yes: a blank line ends the continuation lines |
| TS-176 row 3: end of the file, final line break | yes: Completed at ends the file, with a line break | the 0.1.0 place | yes: the end of the section ends the continuation lines |
| TS-177 row 1: checkbox, marker, blank | yes: directly after the marker, before the blank line | (c); keeps the 0.1.0 result | yes: `- **Archive task:** true` is a field line with no continuation line |
| TS-177 row 2: checkbox, blank, indented checkbox | yes: directly after the first checkbox, before the blank line | (b), (c) and the 0.1.0 place | yes: "an indented line after a blank line is no continuation line" |
| TS-177 row 3: indented, then unindented `- [ ]` | yes: between the two checkbox lines | (c) and the 0.1.0 place | yes: the unindented line ends the continuation lines and is no field line |
| TS-177 row 4: unindented `- [ ]` directly after Done when | yes: directly after Done when | (c); keeps the 0.1.0 result | yes: Done when has no continuation line |
| TS-178: no field line | yes: Status after the heading, Completed at after Status, then the text line | the third case of the statement, which CR-42 found missing; (a), (b) and (c) agree; keeps the 0.1.0 result | yes: "Write the CSV export." begins with a letter, so it is no continuation line of the inserted Status line. `task set` finds a section with no field line (`src/model/graph.ts:172-180`) and reads its status as `todo` (`src/tracking/task.ts:65`) |
| TS-179 row 1: Commit and Completed at after the checkbox | yes: both replaced where they stand; same line count | none of (a), (b), (c): nothing is inserted | yes |
| TS-179 row 2: Commit and Completed at between Done when and the checkbox | yes: both replaced where they stand, not moved | replacement in place against a CLI repair that re-places the lines (the alternative of the second review) | yes. It agrees with C005-REQ-125 ("before that G3 approval P-01 moves each report-field line that stands between a field line, such as `- **Done when:**`, and that field's indented lines", `spec.md:378`), with the rationale of C005-REQ-127 ("Lines that the sdd CLI 0.1.0 already wrote keep their place", `spec.md:324`), with C005-US-104 Out of scope (`spec.md:105`), with the hand-off ("The fixed CLI replaces an existing field in place and does not move it back.", `20-plan/handoff.md:95-96`) and with C005-T-025 step 4 ("a line that an earlier report misplaced stays where it is and is moved by hand", `20-plan/plan.md:731`) |
| TS-179 row 3: two Commit lines | yes: the first replaced, the second unchanged | first against last field line of a field | yes: "the section's first field line of that field" (`spec.md:323`) |

Taken together: (b) is ruled out by C005-TS-177 row 2, (c) by C005-TS-177 rows 1 to 4, and the 0.1.0 place by
C005-TS-176 rows 1 to 3 and C005-TS-177 rows 2 and 3. The rows that tell none of (a), (b), (c) apart (C005-TS-176
rows 1 and 3, C005-TS-178, C005-TS-179) check the D-001 fix itself or the two kept cases of the statement. The
paragraph at `spec.md:1134-1139` says which readings each row of C005-TS-177 rules out; each claim holds.

### Summary (verification)

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 1 |

Resolved: CR-42 … CR-47. Open in the D-001 set: CR-48 (minor, second review, not in this round's fix list) and CR-49
(minor, new). Neither holds the G2 approval.

### New findings (verification)

### CR-49 — Row 2 of C005-TS-176 puts the blank line after the section, while C005-IF-005 §2 puts it inside; under the scenario's own wording the row no longer rules out reading (c)
- **Severity:** minor
- **Refs:** C005-TS-176, C005-AC-127.1, C005-REQ-127, C005-IF-005
- **Evidence:** "Given an active lite change 004 whose "20-plan/plan.md" holds the task section "C004-T-001" with exactly these lines, in this order, and no other line:" — `10-spec/spec.md:1092`; "| the lines directly after the section are a blank line and the heading line "## Test mapping"" — `10-spec/spec.md:1114`; "TS-176 (row 2: the last task section, followed by a blank line and another section)" — `10-spec/spec.md:1309`; the bounds: "- **Task section:** from a heading line of level 2, 3 or 4 whose text starts with a task ID (`C<NNN>-T-<seq>` or" / "`T-<seq>`) to the line before the next heading line of level 1 to 4, or to the end of the file." — `10-spec/spec.md:1683-1684`; the glossary uses those bounds: "A line of a task section (bounds: C005-IF-005 §2)" — `40-domain/glossary-delta.md:25`; C005-TS-177 writes the blank line into the section: "then <tail>, where "" stands for a blank line" and "And the line directly after the section is the heading line "## Test mapping"" — `10-spec/spec.md:1120-1121`.
- **Why it matters:** under the bounds that the glossary cites, the blank line before `## Test mapping` belongs to the task section, so the Given contradicts itself ("no other line"). The fixture is still clear, and the expected outcome holds under either reading, so no test changes. But C005-TS-176 and C005-TS-177 now describe the same file shape in two incompatible ways. Under the scenario's own wording, reading (c) ("every line up to … the end of the section") also puts Completed at before the blank line, so row 2 does not rule (c) out. C005-TS-177 rows 1 to 4 do, so no reading stays untested.
- **Suggested fix:** use the convention of C005-TS-177. Write the Given as "holds the task section "C004-T-001" that begins with exactly these lines, in this order:", and row 2 as "the section ends with a blank line after "  - [ ] CSV rows written", and the line directly after the section is the heading line "## Test mapping"". Reword the coverage cell to "row 2: a blank line ends the section, before another section".
- **Status:** open

### Rubric (verification set)

| Rubric | Item | Result |
|---|---|---|
| stories | S1 Persona is a defined P-ID | pass: C005-US-104 and C005-US-106 name P-01 |
| stories | S2 Value / outcome stated | pass: C005-REQ-127 keeps a reported lite plan free of the LINT-TASK-001 error that blocks a G3 approval; the fourth part of C005-REQ-125 tells an upgrading user what the release of C005-US-106 requires |
| stories | S3 INVEST | pass: each requirement of C005-US-104 testable on its own; C005-REQ-127 has four scenarios of one AC |
| stories | S4 Every story has ≥ 1 requirement | pass: TR-01 6/6 |
| stories | S5 Out of scope stated where a neighbour exists | pass: C005-US-104 Out of scope (`spec.md:105`) |
| stories | S6 Traces to the ideation | pass: Q-d001-01 and D-001 in Traces to (`spec.md:107`) |
| requirements | R1 Singular outcome | pass: C005-REQ-127 has one SHALL and one outcome, the place of the written line; C005-REQ-125 keeps one procedure, now in four parts, by the reasoning accepted for three |
| requirements | R2 Testable | pass: line order of `plan.md` (C005-REQ-127); P-01's review of the notes (C005-REQ-125) |
| requirements | R3 Unambiguous | pass: field line and continuation line are defined (`40-domain/glossary-delta.md:25-26`); overlapping conditions: Other checks |
| requirements | R4 Correct EARS pattern | pass: C005-REQ-127 event-driven, C005-REQ-125 ubiquitous |
| requirements | R5 Implementation-free | pass: the statements name lines of `plan.md` and the release notes; `setLiteField()` appears only in C005-COMP-007 |
| requirements | R6 Complete | pass: the existing-field and no-field cases are in the statement; sections written by 0.1.0 are handled by C005-REQ-125 and the Out of scope of C005-US-104 |
| requirements | R7 Consistent | pass: the rationales of C005-REQ-122 and C005-REQ-127, C005-REQ-125, C005-US-104 and the hand-off give the same route; the scenario wording is CR-49 |
| requirements | R8 Feasible | pass: the bounds of `setLiteField()` are kept; `task set` finds a section with no field line (`src/model/graph.ts:172-180`) |
| requirements | R9 Necessary | pass: D-001, Q-d001-01, CR-46 |
| requirements | R10 Measurable values with units | n/a: neither statement holds a quantity |
| requirements | R11 Delta and evidence | pass: ADDED; the kept 0.1.0 behaviour is stated with E-99 and `src/tracking/task.ts:95` at `9eae3b2`, because no living requirement places a lite field (C001-REQ-901, C001-REQ-618) |
| requirements | R12 Priority consistent | pass: Must under Must stories |
| NFRs | N1 ISO 25010 category | n/a: no NFR in the verification set |
| NFRs | N2 Metric with unit | n/a: no NFR in the verification set |
| NFRs | N3 Threshold set | n/a: no NFR in the verification set |
| NFRs | N4 Feasible method and environment | n/a: no NFR in the verification set |
| NFRs | N5 Covered by a DoD item | n/a: no NFR in the verification set |
| acceptance | A1 Every REQ has an AC, every AC a scenario | pass: C005-AC-127.1 → C005-TS-176 … C005-TS-179; C005-AC-125.1 → C005-TS-172; TR-02 27/27, TR-03 27/27 |
| acceptance | A2 Scenarios observable and concrete | CR-49 |
| acceptance | A3 One behaviour per scenario | pass: each scenario checks one case of the statement |
| acceptance | A4 Error and abuse cases present | pass: the rule refuses nothing; a section already damaged by 0.1.0 is now a case (C005-TS-179 row 2) |
| acceptance | A5 n/a cells justified credibly | pass: the boundary and idempotency cells name scenarios; the error, authorization and abuse cells are credible |
| domain, interfaces, architecture | D1 Entities with attributes, owner, invariants | pass: Data view row updated (`spec.md:1945`) |
| domain, interfaces, architecture | D2 Lifecycles > 2 states diagrammed | n/a: no lifecycle changes |
| domain, interfaces, architecture | D3 Interfaces parse and name their errors | pass: C005-IF-005 §2 removes report-field lines wherever they stand and names both places (`spec.md:1701-1703`) |
| domain, interfaces, architecture | D4 Components with ID, responsibilities, requirements | pass: C005-COMP-007 names `setLiteField()`, the responsibility, C005-REQ-127 and E-99 (`spec.md:1852-1860`) |
| domain, interfaces, architecture | D5 Decisions with alternatives recorded | CR-48 (open, unchanged) |
| DoD and index | O1 Every REQ and NFR covered | pass: C005-REQ-127 in C005-DOD-002 and C005-DOD-003, C005-REQ-125 in C005-DOD-007; TR-05 27/27 |
| DoD and index | O2 Evidence types fit the statements | pass: test report for the untagged scenarios, review record for C005-TS-172 |
| DoD and index | O3 Global items referenced | pass: C005-DOD-002, the DOD-G-01 instance for untagged scenarios, lists "C005-TS-175 to C005-TS-179" (`dod.md:17`); all four new scenarios are untagged |
| DoD and index | X1 Index is navigation only | n/a: a lite change has no index file |

### Other checks, not findings (verification)

- **Overlapping conditions.** The rationale says "its three cases exclude each other" (`spec.md:324`). Strictly, "when
  the section holds no field line of that field" also holds for a section with no field line, but the second case
  names "the section's last field line", which such a section lacks, so only the third case applies. One reading
  only; not a finding.
- **`* **` fields.** `fieldText()` also accepts a field written `* **Name:**` (`src/lint/spec.ts:174`), which the
  glossary does not count as a field line. A report line is still never inserted inside such a field: the `* **`
  line begins with a character other than a space or a tab, so it ends the continuation lines of the field line
  before it. The lite template and `sdd task set` use the `- **` form only.
- **Release-notes wording.** C005-REQ-125, C005-TS-172 and C005-DOD-007 say "that field's indented lines", not
  "continuation lines". That is right: in a section damaged by 0.1.0 the checkboxes are, by the glossary, continuation
  lines of the misplaced report-field line. The three texts use the same words.
- **Hash.** Step 2a removes report-field lines wherever they stand (`spec.md:1680-1703`), so the heading-line place of
  C005-TS-178 and the hand move leave the approval hash unchanged, as the rationale of C005-REQ-127 says.

### Why no further findings (verification)

- **Stories.** C005-US-104 lists seven requirements, names D-001 and Q-d001-01, and puts the repair of sections written
  by 0.1.0 out of scope (`spec.md:104-107`). C005-US-106 still lists C005-REQ-125, whose fourth part serves the same
  upgrade path. Nothing else in either story changed.
- **Requirements.** I checked C005-REQ-127 for EARS shape and singularity, and each case against `setLiteField()` at
  HEAD: the replacement of the first `- **<name>:**` line (`src/tracking/task.ts:92-93`), the insertion after the last
  `- **` line and the heading place (`:95-97`). I also checked the claim that `fieldText()` stops at a blank or
  unindented line (`src/lint/spec.ts:180`) and the reason for stating kept behaviour (`.sdd/_living/CAP-planning.md:405`).
  C005-REQ-125, the rationale of C005-REQ-122 and the rationale of C005-REQ-127 give the same route: the hand move
  before the G3 approval, ERR-CLI-010 otherwise (`src/gate/gate.ts:139`).
- **Acceptance.** I traced every row by hand (row check above). The transitions used are allowed (`todo → in-progress`,
  `in-progress → done`, `src/tracking/task.ts:16-17`). `task set` without `--commit` or `--note` writes no Commit or
  Notes line when the section holds none (`:109`, `:120-121`), as C005-TS-177, C005-TS-178 and C005-TS-179 assume.
  The only gap is CR-49.
- **Domain, interfaces, architecture.** C005-IF-005 §2, C005-COMP-007, the Data view and the delta row agree with
  C005-REQ-127 and with each other. D5 stays with CR-48.
- **DoD.** C005-DOD-002 covers C005-TS-175 to C005-TS-179 and C005-REQ-127 (`dod.md:17`), C005-DOD-003 covers
  C005-REQ-127 (`dod.md:18`), and C005-DOD-007 holds the hand move in the words of C005-REQ-125 and C005-TS-172
  (`dod.md:22`).
