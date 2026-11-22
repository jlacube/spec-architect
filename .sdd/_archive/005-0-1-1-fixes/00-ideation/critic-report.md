---
artifact: critic-report
change: CHG-005
phase: 00-ideation
reviewed_ids: all
---
# Critic report — CHG-005 00-ideation

Readiness review (step 7) of `ideation.md` v0.2.0, `questions-log.md` rounds 1–3,
`evidence/baseline-survey.md` (E-1…E-53) and `research/R-001-sdd-without-plugin.md`. I checked them against the
living requirements cited (C002-REQ-213, C001-REQ-210, C001-REQ-616, C001-REQ-913, C002-REQ-518, C002-REQ-519)
and read the repository at `215e36d` only to confirm or refute claims. `sdd lint 005 --phase 00-ideation --json`:
0 errors, 0 warnings, 0 info. The ideation uses goal labels G-1…G-6 that are outside the ID scheme, so the Refs
below cite the living requirements those goals change.

## Summary
| blocker | major | minor |
|---|---|---|
| 0 | 5 | 4 |

## Findings

### CR-1 — G-3 fixes only the hand-off templates; other places that tell implementers to run the plugin path stay unchanged
- **Severity:** major
- **Refs:** C001-REQ-103, C001-REQ-616
- **Evidence:** "G-3 (D-035): both hand-off templates name `sdd …` as the reporting command" — `00-ideation/ideation.md:55`;
  scope: "the shared plugin text (`plugins/architect/` agents, commands, skills, templates)" — `00-ideation/ideation.md:70`.
  The CLI writes this text into every new workspace's `SDD.md`: "Read \`NNN-slug/20-plan/handoff.md\` and report progress with" /
  "\`node <plugin-root>/scripts/sdd.mjs task set <task-id> --status <status>\` as described there." — `src/workspace/sddmd.ts:32-33`,
  in a file that says "**Agents: read this file first.**" — `src/workspace/sddmd.ts:21`, and "Only the status block is ever
  rewritten in place." — `src/workspace/sddmd.ts:2`. The plugin README says: "Progress is reported with" /
  "`node <plugin>/scripts/sdd.mjs task set <task-ID> --status done --commit <sha>`." — `plugins/architect/README.md:113-114`.
  The baseline searched only part of the repository: "resolves `<plugin-root>` (grep of agents, skills, commands: `<plugin-root>` appears only in
  `README.md:114`)." — `00-ideation/evidence/baseline-survey.md:133`. It did not search `src/`, and README line 114 actually
  says `<plugin>`. C001-REQ-103 requires the "If you are implementing a change" section of `SDD.md` —
  `.sdd/_living/CAP-workspace.md:111`.
- **Why it matters:** an implementer without the plugin who reads `SDD.md` first still gets a command it cannot run, and
  that command now contradicts the fixed hand-off. G-3's outcome ("an implementer without the plugin can run `sdd task set`")
  can therefore still fail. The npm rewrite (C002-REQ-518) changes templates only, so the generated targets' `sdd init` writes
  the same plugin-path line. Workspaces that already exist keep the old line, because the CLI rewrites only the status block of `SDD.md`.
- **Suggested fix:** widen G-3 and §5 to cover every instruction an implementer reads about reporting progress: the
  `SDD.md` text (C001-REQ-103, `src/workspace/sddmd.ts:32-33`) and `plugins/architect/README.md:114`. Add C001-REQ-103 to the
  touched requirements, and decide whether existing `SDD.md` files are migrated or left as they are. Ask the cartographer to
  search `src/`, `docs/` and the README files for `sdd.mjs task set` and add the hits to item 3 of the baseline.
- **Status:** open

### CR-2 — Nothing says who fills in the new `<version>` placeholder, which repeats D-035's root cause
- **Severity:** major
- **Refs:** C001-REQ-616, C002-REQ-502
- **Evidence:** "`npm install -g architect-sdd@<version>` line; an implementer without the plugin can run `sdd task set`." —
  `00-ideation/ideation.md:56`; "- **D-035:** both hand-off templates use bare `sdd` with an install line; the npm rewrite of
  those lines becomes a no-op" — `00-ideation/ideation.md:101`. The defect's cause: "nothing in the plugin text tells the planner
  to replace `<plugin-root>`." — `00-ideation/evidence/baseline-survey.md:127`. The template placeholders contain no version:
  "| `{{TITLE}}`, `{{KIND}}`, `{{PROFILE}}`, `{{DATE}}` | change title, kind, profile, ISO date |" —
  `plugins/architect/templates/README.md:13`. "The version has one source, `plugins/architect/.claude-plugin/plugin.json`
  (0.1.0)." — `00-ideation/evidence/baseline-survey.md:27`. The research makes the same point: "so the hand-off wording needs the
  version of the plugin that generated it" — `00-ideation/research/R-001-sdd-without-plugin.md:184-185`.
- **Why it matters:** if no rule fills `<version>`, the planner must replace a placeholder that no text tells it to
  replace, which is exactly how D-035 happened. A version typed into the templates would add a second version
  source next to `plugin.json`, and every release would have to edit it and its pinned tests (E-36). The spec writer
  cannot write a testable reporting requirement until someone decides who writes the version, from which source, and when
  (at `sdd change new`, at `sdd template show`, or by the planner).
- **Suggested fix:** in §8 (D-035), state how `<version>` gets its value. One way is a template placeholder that the CLI fills from
  `plugin.json` when it writes the file. Another is a planner rule plus a lint check that rejects a leftover literal `<version>`.
  Also state which version is meant: the CLI that created the change or the one used at plan time. If the choice changes the
  template contract, record it as a deferred open question for P-01 with an owner (§11).
- **Status:** open

### CR-3 — G-2 does not say where an answer goes after G3, when there is no next phase
- **Severity:** major
- **Refs:** C001-REQ-210
- **Evidence:** "2. G-2 (D-034): every answer P-01 gives between a gate approval and the next phase's start is logged verbatim in
  the next" — `00-ideation/ideation.md:53`; chosen option: "next phase's questions-log.md, created on first use, marked as given
  before the phase started." — `00-ideation/questions-log.md:61`. After 20-plan the change has no other phase:
  "implementation: { status: not-started }" — `change.md:12`.
- **Why it matters:** after the G3 approval, during implementation and up to `sdd archive`, the conductor still interviews
  P-01 (for example the CHG-001 decision to close defects as known gaps, `questions-log.md:26-28`). G-2 names no log for
  that window, and the 20-plan log is approved. The conductor then faces D-034 again: either it logs the answer nowhere, or it edits an approved phase.
- **Suggested fix:** either name the target log for answers after G3 (and after a Stop), or record that window as a non-goal in §4.2.
  Confirm the choice with P-01, because it changes scope (question Q-scope-04).
- **Status:** open

### CR-4 — G-1 depends on eval cases that are neither defined nor funded; G-2 and G-3 state no way to verify them
- **Severity:** major
- **Refs:** C002-REQ-213, C001-REQ-210, C001-REQ-616
- **Evidence:** "(size estimate, profile and kind round) before `sdd change new`; 0 creations with unasked defaults in the eval
  cases." — `00-ideation/ideation.md:52`; "| Eval budget for the D-032 and D-034 cases | P-01 | 20-plan |" —
  `00-ideation/ideation.md:128`; "No test exercises a plain-words create-change request." —
  `00-ideation/evidence/baseline-survey.md:81`; "Confidence that an evaluation can show the fix needs a paid eval (none" —
  `00-ideation/evidence/baseline-survey.md:85`. G-2 (`ideation.md:53-54`) and G-3 (`ideation.md:55-56`) name no case, check or
  scenario. G-5 says "and the other read-only lookups" (`ideation.md:59`), which depends on the open list at `ideation.md:127`.
- **Why it matters:** G-1's measure is "0 in the eval cases", but there are no eval cases yet and their budget is decided only at
  20-plan. If P-01 grants no budget, G-1 cannot be measured. The only existing scenario near G-2, C002-TS-317, explicitly leaves out
  the window after approval (E-26). Without a named check, the spec writer has nothing to turn into acceptance criteria for G-2 and G-3.
- **Suggested fix:** give each goal a measure. For G-1, name the eval cases (count, hosts, prompt) and a fallback if the
  budget is 0, for example a recorded manual run. For G-2, name an eval or manual scenario that covers the window after approval. For G-3, name a re-run of the
  "Superpowers without the plugin" scenario (C001-TS-621, `tests/manual/TS-621.md`, E-36) in which task status reaches `done`.
  For G-5, say it is measured against the command list that the spec fixes.
- **Status:** open

### CR-5 — G-6 rests on an unconfirmed assumption; G-3 depends on it, the "If wrong" column leaves that out, and the scope lists no release work
- **Severity:** major
- **Refs:** C002-REQ-502, C001-REQ-616
- **Evidence:** "6. G-6: 0.1.1 released on both hosts with `npm run check` green [ASSUMPTION: release of 0.1.1 is the outcome of
  this change]." — `00-ideation/ideation.md:61`; "| [ASSUMPTION: release of 0.1.1 is the outcome of this change] — release on both
  hosts, npm package included | Spec drops G-6 and the release tasks |" — `00-ideation/ideation.md:120`; "| A 0.1.1 hand-off names a
  version not yet on npm | medium | medium | Publish `architect-sdd` before or with the plugin release; plan orders it |" —
  `00-ideation/ideation.md:112`; "each release of Architect needs a publish to the registry before its" / "hand-offs are usable
  (P-01 publishes, C002-REQ-502). 0.1.0 is published; 0.1.1 is not yet." — `00-ideation/research/R-001-sdd-without-plugin.md:185-186`.
  The in-scope list (`ideation.md:70-72`) names no release work: no npm publish, no release notes or evidence under `docs/`.
- **Why it matters:** if the assumption is wrong, the install line of every 0.1.1 hand-off names a version that is not on
  npm, so G-3 fails as well. "Spec drops G-6" alone is therefore not a consistent fallback. Publishing is P-01's manual
  step (C002-REQ-502 open item), so the release scope needs P-01's word, not an assumption.
- **Suggested fix:** ask P-01 to confirm the release at G1 (question Q-release-01). In the "If wrong" column, add the effect
  on G-3 and the version rule of CR-2. List the release work in §5: the version in `plugin.json`, the regenerated packages,
  P-01's npm publish of `architect-sdd`, and the release notes and evidence under `docs/`.
- **Status:** open

### CR-6 — The risks leave out cases flagged by the research and the baseline
- **Severity:** minor
- **Refs:** C001-REQ-616, C001-REQ-210
- **Evidence:** "So a first run needs registry access, and a" / "sandboxed or offline agent environment cannot use this route." —
  `00-ideation/research/R-001-sdd-without-plugin.md:97-98`; "report that in PowerShell the `npx.ps1`/`npm.ps1` launchers can be
  blocked by the execution" — `00-ideation/research/R-001-sdd-without-plugin.md:108`; "Whether lint and the trace accept such a
  file in a lite change was" / "not run (writing is outside this role)." — `00-ideation/evidence/baseline-survey.md:110-111`. The
  risk table (`ideation.md:109-115`) has no row for any of these.
- **Why it matters:** the chosen G-3 route needs registry access and the right to install globally on the implementer's
  machine. The chosen G-2 route writes a `10-spec/` or `20-plan/` log into a lite change, a file that has no template and is not
  in `LITE_SCAFFOLD` (E-25), and lint has not been run on such a file. If either fails, a fix that looks done still fails.
- **Suggested fix:** add rows for: (a) an implementer without registry access or the right to run a global install (mitigation: the frontmatter
  fallback stays, §10 second assumption, and the hand-off says when to use it); (b) the Windows execution policy blocking the npm
  launchers (low); (c) lint or the trace rejecting a lite next-phase `questions-log.md` (mitigation: the spec checks lint on a
  lite fixture).
- **Status:** open

### CR-7 — Decision records disagree: candidate counts, Q-route-01 missing from §7, and instructions recorded that P-01 did not give
- **Severity:** minor
- **Refs:** C001-REQ-210, C001-REQ-616
- **Evidence:** Q-scope-02: "**Candidates considered:** 4 (cartographer)" — `00-ideation/questions-log.md:72`, yet the entry lists three options
  (`questions-log.md:75-77`) and two rejected candidates (`questions-log.md:78`), five in all. Q-handoff-01: "**Candidates considered:** 4
  (cartographer; merged with research R-001)" — `00-ideation/questions-log.md:95`, also with three options plus two rejected
  (`questions-log.md:98-101`). Ideation §7 repeats the 4: "| Q-scope-02 | 4 |" and "| Q-handoff-01 | 4 |" —
  `00-ideation/ideation.md:92`, `:94`. §7 (`ideation.md:87-94`) leaves out Q-route-01, which §3 lists (`ideation.md:41`).
  For Q-route-01 the answer is "- **Answer (verbatim):** "go with B"" — `00-ideation/questions-log.md:25` — while the extracted
  instructions record a sequence of tasks that is not in that answer: "order is C002-T-075 and C002-T-055 (P-01 publishes 0.1.0), then
  C001-T-075 (archive," — `00-ideation/questions-log.md:26`. The pointers go in a circle: "(conductor analysis; lite profile, recorded
  in ideation.md §7)" — `00-ideation/questions-log.md:33` — and "candidates and rejected options are in" / "`questions-log.md`." —
  `00-ideation/ideation.md:84-85`.
- **Why it matters:** the decision record must reproduce what P-01 was shown and what P-01 said. Wrong counts and
  instructions P-01 did not give weaken that audit trail (C001-REQ-210). The Q-route-01 entry also lacks the Blocking, Rejected and Sources
  fields that the log's own guidance requires (`questions-log.md:11`).
- **Suggested fix:** correct the two counts to 5 in the log and in §7. Add a Q-route-01 row to §7 (two options, asked in the CHG-001
  session). Move the task sequence out of "Extracted instructions" into a note attributed to the conductor. Fill in or mark n/a the
  missing Q-route-01 fields. Drop the pointer to "ideation.md §7".
- **Status:** open

### CR-8 — Open questions: the owner of a material rule is conditional, and open facts from the baseline are not carried over
- **Severity:** minor
- **Refs:** C001-REQ-913, C001-REQ-210
- **Evidence:** "| Rule that identifies the archive task (task title, a frontmatter flag, or the last task) | spec-writer, P-01 if
  material | 10-spec |" — `00-ideation/ideation.md:126`; "- **Archive:** `archiveBlockers` identifies the archive task (or the
  running archive) and reads lite `plan.md` tasks the" — `00-ideation/ideation.md:103`; "Open facts for the plan: how a "given
  before the phase started" answer is marked in the log, and the frontmatter" — `00-ideation/evidence/baseline-survey.md:121`.
- **Why it matters:** one listed candidate, a frontmatter flag, changes the task file's frontmatter contract, and every candidate
  changes C001-REQ-913. Under sdd-conventions that makes the rule material, so P-01 owns it, not the spec writer. "If material"
  leaves the judgement to the spec writer. "(or the running archive)" is not defined anywhere. The two open facts for G-2 (how an answer is marked as given before the phase, and the frontmatter of a first-use log) are absent
  from §11, so nobody owns them.
- **Suggested fix:** name P-01 as owner of the archive-task rule, to be decided with options in the 10-spec interview, and mark it
  deferred (it does not block G1). Define or drop "(or the running archive)". Add the two G-2 open facts to §11 with the spec writer as owner.
- **Status:** open

### CR-9 — Defect IDs and "both hosts" are ambiguous
- **Severity:** minor
- **Refs:** C002-REQ-213, C001-REQ-210, C001-REQ-616
- **Evidence:** "1. G-1 (D-032): every request to create a change" — `00-ideation/ideation.md:51`; "2. G-2 (D-034)" —
  `ideation.md:53`; "3. G-3 (D-035)" — `ideation.md:55`; the registry also holds CHG-002 defects with the same numbers:
  `"id": "D-032",` / `"ref": "C002-IF-010",` — `.sdd/registry.json:796-797` (carried to CHG-003, line 802), and D-034, D-035 at
  `.sdd/registry.json:816`, `:826`. "the conductor on both hosts" — `ideation.md:34`; "0.1.1 released on both hosts" —
  `ideation.md:61`; whereas "Shared plugin text under `plugins/architect/` feeds three hosts" — `00-ideation/evidence/baseline-survey.md:38`.
- **Why it matters:** only §2 writes "CHG-001 D-032" in full (`ideation.md:29`). A spec writer or planner who looks up D-034 or D-035 in the
  registry can land on CHG-002's eval defects. Because "both hosts" is never defined, the release scope and the eval hosts of
  the risk at `ideation.md:115` are unclear (Claude Code with Copilot VS Code, Copilot CLI, or both?).
- **Suggested fix:** write "CHG-001 D-0xx" at every mention. Define "both hosts" once (which Copilot variant), and state that the
  OpenCode package receives the shared text but is not released (non-goal 3).
- **Status:** open

## Rubric
| Rubric | Item | Result |
|---|---|---|
| ideation | I1 Problem stated and evidenced | pass: §2 cites the CHG-001 defects, the C001-T-075 note and E-37…E-51; E-46 reproduces the archived-lookup failure |
| ideation | I2 Goals measurable | CR-4 |
| ideation | I3 Non-goals and scope boundary explicit | CR-3, CR-5 |
| ideation | I4 Every material decision has a DEC with ≥ 2 options | CR-2, CR-7 |
| ideation | I5 Open questions classified with an owner | CR-8 (no question blocks G1: all are needed by 10-spec or 20-plan) |
| ideation | I6 Key risks and assumptions listed | CR-6 |
| ideation | I7 Brownfield: baseline survey exists and is cited | CR-1 (survey exists and is cited throughout; item 3 missed `src/workspace/sddmd.ts`) |
| ideation | I8 Sources cited for external claims | pass: §12 gives the npm registry and npm docs with retrieval dates; R-001 §Sources rates each claim |
| ideation | I9 Q&A answers logged verbatim, including embedded instructions | CR-7 (Q-scope-01's embedded instruction is captured, `questions-log.md:43`; Q-route-01 records instructions that are not in the answer) |
| ideation | I10 Profile confirmed by P-01 | pass: Q-route-01 option B "fix in a lite change" answered "go with B" (`questions-log.md:15`, `:25`); the kind `brownfield` was not asked, but every item changes existing code (baseline) |

## Verdict
**go**

- No blocker. The problem is stated and backed by evidence, and the brownfield baseline and research exist and are cited. Every
  material decision taken so far has a logged P-01 answer chosen from at least two presented options (`questions-log.md` rounds 1–3).
  The three open questions are needed only by 10-spec or 20-plan.
- Fix the five majors before approval, or record at G1 that they are carried to 10-spec. CR-1 and CR-2 decide whether G-3
  actually fixes D-035. CR-5 needs P-01 to confirm that the 0.1.1 release, including the npm publish, is part of this change.
  CR-3 needs P-01 to choose the scope for the window after G3. CR-4 gives the spec writer measures to turn into acceptance criteria.
- The four minors are about clarity and keeping the records consistent. The conductor can fix them without asking P-01.
