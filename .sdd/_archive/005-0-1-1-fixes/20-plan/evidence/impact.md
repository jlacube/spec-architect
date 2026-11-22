---
id: "C005-PLAN-IMPACT"
artifact: plan/impact
change: "CHG-005"
phase: 20-plan
status: draft
---
# CHG-005 — Impact: blast radius, regression set, hotspots, sizing

Scope: the components C005-COMP-001 to C005-COMP-013 and the interfaces C005-IF-001 to C005-IF-005 of
`../../10-spec/spec.md` (Architecture notes, Interfaces). Commit surveyed: `b51cc34` (HEAD). Entries E-1 to E-103 are
reused by number (`../../00-ideation/evidence/baseline-survey.md`, `../../10-spec/evidence/spec-addendum.md`) and are
not repeated; new claims are E-104 onward (Evidence, below).

Layers: ripwire absent (`ripwire --version`: exit 127, command not found), so every entry carries `ripwire failed:
exit 127` and `--test-gate`, `--impact` and `--hotspots` were not available. Serena answered for the references of
TypeScript symbols (layer 2, confidence high; Serena lines are 0-based, 1 added). Tests, Markdown, JSON and `.mjs`
were read with grep and Read (layer 4, confidence medium: read to confirm). LSP not needed. No ast-grep question
(toolchain record not consulted; no syntactic-shape question arose). Churn: `git log` counts (layer 4).

Freshness: `git diff --stat fef82eb HEAD -- src plugins tests scripts` is empty (E-104), so the spec-phase evidence
E-54 to E-103 (taken at `fef82eb`) holds at `b51cc34`.

## Blast radius

### Callers and dependants of the targeted symbols

| Symbol | Direct callers (production) | Tests that reach it | Reach beyond the repository code | Evidence |
|---|---|---|---|---|
| `resolveChange()` (`src/cli/commands.ts:332`) | 12 functions, 12 sites: `gateContext`, `changeStop`, `taskSet` (short ID), `defectClose`, `defectReopen`, `hashCmd`, `staleCmd`, `traceCmd`, `changeProfile`, `idNext`, `idTombstone`, `archiveCmd` | no test names it; reached through the CLI: `tests/integration/cli/frontend.test.ts:113`, `tests/unit/workspace/ledger.test.ts:86,97`, cap08 gate tests, cap09 task and defect tests | bundle `plugins/architect/scripts/sdd.mjs`, copied into the Copilot package (`cli_copy`) and `architect-sdd` | E-51, E-105 |
| `changeOfId()` (`:204`) | `taskSet` (full ID), `defectAdd` | same CLI tests | same | E-48, E-106 |
| `gateContext()` (`:128`) | `gateShow`, `gateApprove`, `gateRecord`, `changeRevise`: one lookup serves read-only and writing gate commands, so the class must be known inside the lookup | cap08 `TS-801 … TS-819`, `tests/integration/gate/record.test.ts` | | E-56, E-117 |
| `phaseHash()` (`src/gate/hash.ts:38`) | `recordApproval` (`:68`), `gateSummary` (`gate.ts:88`), `staleCheck` (`stale.ts:33`), `hashCmd` (`commands.ts:262`) | `TS-805`, `TS-806`, `TS-807`, `TS-816`, `gate-fixture.ts` (cap08) | every approval hash stored in `change.md` and `approvals.json` of the active lite changes | E-95, E-98, E-103, E-107 |
| `normalizeForHash()` (`src/model/frontmatter.ts:48`) | `fileHash` only | `tests/unit/model/frontmatter.test.ts:33-37` | none | E-97, E-108 |
| `archiveBlockers()` (`src/archive/plan.ts:94`) | `planArchive` (`:203`); `planArchive` has one caller, `archiveCmd` | `TS-914`, `TS-915 … TS-922`, `TC-1131`, `faults.test.ts`, `archive-fixture.ts` | `/architect:archive` (`commands/archive.md`), the 0.1.1 hand-off of the archive task | E-37, E-38, E-110, E-111 |
| `lintWorkspace()` (`src/lint/engine.ts:106`) | `lint` (`commands.ts:116`), `lintPhase` (`gate.ts:46`), `postWriteFeedback` (`hooks/post-write.ts:27`), `quickLint` (`mcp/tools/files.ts:58`) | lint fixtures, cap04 to cap07 lint tests | the PostToolUse hook and the MCP server run the same engine, so a new rule fires there too | E-57, E-66, E-112, E-113 |
| `renderTemplate()` (`src/workspace/templates.ts:151`) | `createChange` (`change.ts:76`), `planUpgrade` (`upgrade.ts:114,120`; also used to render file names) | `tests/unit/workspace/templates.test.ts` | `sdd change new`, `sdd change profile <NNN> full` | E-67, E-114 |
| `renderSddMd()` (`src/workspace/sddmd.ts:12`) | `initWorkspace` (`init.ts:55,59`) | `TS-104` (headings only, E-85) | `sdd init`, `sdd init --force` | E-79, E-80, E-115 |
| `setTask()` (`src/tracking/task.ts:102`) | `taskSet` (`commands.ts:223`) | cap09 `TS-906` (lite status derivation) and the task tests | writes the report fields that the new hash step 2a removes | E-99, E-118 |
| `WRITING_COMMANDS` (`src/cli/writing-commands.ts:25`) | `COMMANDS` (`commands.ts:550`), `guard-bash.ts`, `scripts/generate/emit/opencode-permissions.ts:70` | `tests/guards/writing-commands.test.ts`, `tests/integration/cap02/permissions.test.ts:138` | the bash guard of both hosts and the generated OpenCode permissions. C005-CON-01 reads the list and does not change it, so none of these consumers changes | E-54, E-55, E-116 |

### Per component: files, dependants, hosts

| Component | Files touched (source) | Dependants (per the component view) | Claude Code | Copilot VS Code package | npm `architect-sdd` | OpenCode (unreleased, still generated and checked) |
|---|---|---|---|---|---|---|
| COMP-001 Conductor | `plugins/architect/agents/sdd-conductor.md` (and `skills:` on line 8 if a new skill is preloaded) | COMP-003, COMP-004 use it | read as is | generated agent; preloaded skills are inlined (`"skills": "inline"`), so a new or longer skill grows the generated conductor | no | generated; same inlining |
| COMP-002 Skills library | new skill file (C005-CON-06, ADR in 20-plan); `skills/interview-protocol/SKILL.md` §5; `skills/planning/SKILL.md` | COMP-001, COMP-003 | read as is | copied or inlined by the generator; the "Claude Code wiring" section is replaced by the variant | no | same |
| COMP-003 Commands | `commands/new.md`, `commands/archive.md` | none | `/architect:new`, `/architect:archive` | `prompts/*.prompt.md` generated from the commands | no | `architect-new.md` generated |
| COMP-004 CLI front-end | `src/cli/commands.ts` (`resolveChange`, `changeOfId`, `gateContext`) | COMP-011 (tests, build) | rebuilt bundle | byte copy of the bundle (hooks, MCP) | same source, built into the tarball | no |
| COMP-005 Workspace module | `src/workspace/templates.ts`, `sddmd.ts`, `change.ts` (no change if the renderer supplies `VERSION` itself), `upgrade.ts` (same) | COMP-004, COMP-007, COMP-009 | rebuilt bundle | same | same | no |
| COMP-006 Lint engine | `src/lint/engine.ts`, new `src/lint/rules/hand-003.ts` and `task-005.ts`, `src/lint/rules/index.ts` | COMP-004, COMP-007, COMP-009 | bundle, hooks, MCP | same | same | no |
| COMP-007 Archive module | `src/archive/plan.ts` | COMP-004 | bundle | same | same | no |
| COMP-008 Templates | `templates/full/20-plan/handoff.md`, `templates/lite/20-plan/handoff.md`, `templates/README.md` | COMP-005, COMP-011, COMP-012 | read directly by the planner | read through `sdd template show` (E-78), so the npm-staged copy is what the generated agents see | copied; no longer translated (E-75) | read through `sdd template show` |
| COMP-009 Gate engine | `src/gate/hash.ts` (phase hash, one function for four commands); `gate.ts`, `stale.ts` unchanged | COMP-004 | bundle | same | same | no |
| COMP-010 Plugin package | `plugins/architect/README.md` step 6, `.claude-plugin/plugin.json` (version); with it root `package.json` and `package-lock.json` (two lines), which PLG-VER-001 holds equal to `plugin.json`; `CHANGELOG.md` | COMP-011 | the version users see | every package takes the version from `plugin.json` | tarball version | version |
| COMP-011 Build and check tooling | `tests/` (see Regression set); `scripts/template-cli-lines.mjs` stays (E-75); a new test for the plugin-path form and for README step 6 | COMP-012, COMP-013 | `npm run check` gate | `npm run generate` and the targets checks | `npm run package`, `npm run smoke:npm` | targets checks |
| COMP-012 npm package | no source change; tarball built at 0.1.1 and published by P-01 | COMP-013 | install line target | install line target (C002-REQ-509) | itself | no |
| COMP-013 Release notes and records | `docs/releases/github-release-notes-0.1.1.md`; `docs/releases/copilot/0.1.1/` (release record, replay reports, injection summary, checklist record, zip hash), `docs/releases/architect-sdd/0.1.1.md` if the 0.1.0 pattern is kept | none | notes | release check `scripts/release/check.ts` reads `docs/releases/copilot/<version>/` and refuses with ERR-REL-009 when a piece is missing | notes | no |

### Reach checks that affect the plan

- The two read-only lookups L2 (command resolver and lint engine) are separate code (E-57, E-66): `gate show` and `lint <NNN>` fail unless both change. The lint engine builds `folder` as `.sdd/${f.name}` (`engine.ts:134`); for an archived folder it must be `.sdd/_archive/<name>`, which the same function already computes for the workspace-wide definitions (`:145`), so the finding paths of an archived change are a small change, not a new mechanism (E-113).
- `activeDefinitions` is read by one rule only (`src/lint/rules/tr-13.ts:12`); an archived change selected by `lint <NNN>` resolves its references against `definitions`, which already include archived changes (E-113). Low risk of spurious findings; the first run on the archived CHG-001 and CHG-002 is the check.
- `phaseHash(changeDir, phase)` has no profile input (E-109). The lite rule needs the profile from `change.md` inside the hash path, and the first test of `TS-806` hashes `tests/fixtures/fx-bootstrap-g1`, a folder with no `change.md`. The profile read must tolerate a missing `change.md` (E-109).
- `renderTemplate()` replaces only the keys it is given (E-67). If it supplies `VERSION` itself (C005-IF-003 §2), the existing template render test passes unchanged (E-126); callers need no change.
- The tracked bundle is rebuilt by `npm run build`; no step of `scripts/check.mjs` and no workflow under `.github/workflows` compares it with `src/` (E-129). A `src/` task that does not commit the rebuilt bundle is not caught by `npm run check`; the C005-REQ-111 test on the bundle catches only the `SDD.md` sentence.
- Dogfood: CHG-005 is a lite change. Its own G3 approval is made with the sdd CLI 0.1.0, and a task report written with the 0.1.0 CLI changes the 20-plan hash (E-99, E-98). Until the 0.1.1 hash rule runs, the first `sdd stale check` after a `task set` on this change sets 20-plan `stale`, and `sdd archive` then refuses (E-100). It is the fault that this change fixes, so the plan must order and run the hash task (COMP-009) with that in view (C005-REQ-122; `spec.md` Current state, "Lite plan hash"). CHG-005 would also be the first lite change archived by this repository's CLI (E-43, E-102).

## Regression set

Reach by `--test-gate` was not available (ripwire absent); the sets below come from Serena references and grep of the test and eval folders. `npm test` and `npm run check` run every file listed under "Stay green"; run the full suite once at the end, since grep cannot prove absence of a dependency.

### A. Tests that must change (pinned to the 0.1.0 text or behaviour)

| Test | Pin | Why it breaks | Component | Effort | Evidence |
|---|---|---|---|---|---|
| `tests/integration/npm-build/npm-staging.test.ts:119-141` (C002-TS-529, four rows: full 20 and 23, lite 21 and 22) | source line equals `node <plugin-root>/scripts/sdd.mjs …`, staged line `sdd …`, equal line counts | source lines become bare `sdd` and the block gains the install line, so the line numbers move and the staged line equals the source line | COMP-008, COMP-011 | M | E-76, E-123 |
| `npm-staging.test.ts:35,113` (`HANDOFFS`, `notEqual`) | the two hand-offs differ from their source in the staged tarball | the translation finds nothing to rewrite, so staged equals source | COMP-011 | S | E-76, E-123 |
| `npm-staging.test.ts:239-255` (scaffold in the plugin copy and in the npm copy) | the two workspaces differ in `20-plan/handoff.md`, line by line, by the plugin-path prefix | both copies render the same hand-off at the same version; `differing.includes("20-plan/handoff.md")` fails | COMP-011 | S | E-76, E-123 |
| `tests/integration/cap01/constructs.test.ts:162-164` (conductor line 46) and `:277-285` (C002-TC-131, conductor lines 61 and 66, `archive.md` line 15) | `sourceLine(file, n)` holds the construct | any line inserted above these lines in `agents/sdd-conductor.md` (Operating loop, lines 21-42) shifts all three; an edit above `commands/archive.md` line 15 shifts the fourth | COMP-001, COMP-003 | S | E-9, E-119 |
| `tests/integration/cap01/constructs.test.ts:159-161` (`commands/new.md` line 8, `$ARGUMENTS`) | line 8 of `new.md` | holds while the front matter and the first paragraph keep their lines; fails if `new.md` gains lines above line 8 | COMP-003 | S | E-9, E-119 |
| `tests/integration/cap01/wiring.test.ts:159,164` (C002-TC-117, `interview-protocol` line 126, the "Claude Code wiring" header) | header at line 126, the variant replaces lines from 126 | an edit that adds lines in §5 (lines 69-93) of the skill shifts the header | COMP-002 | S | E-9, E-119 |
| `tests/integration/cap02/TS-219.test.ts:27` | the exact `skills:` list of the conductor | changes if the new procedure lives in a new preloaded skill | COMP-001, COMP-002 | S | E-119 |
| `tests/integration/cap02/skills-portability.test.ts:10` (`SKILLS`) | the list of skills tested for size and tool names | add the new skill name (not required to stay green, required to be tested) | COMP-002 | S | E-122 |
| `tests/unit/workspace/templates.test.ts:45-60` (`VARS`, `placeholders(text) === []`) | renders every shipped template with no version key | stays green if the renderer supplies `VERSION`; changes if callers must pass it | COMP-005 | S | E-77, E-126 |
| `tests/integration/cap09/TS-914.test.ts:8-47` and `archive-fixture.ts:81-89` | task list `T-xxx status` in ERR-CLI-009, task files only | stay green for full changes; the fixture needs a marker option and a lite form for the new tests | COMP-007 | S | E-45, E-111 |

### B. Tests that must stay green (no edit expected; the change must not break them)

| Test or check | What it protects | Why it is exposed | Evidence |
|---|---|---|---|
| `tests/integration/cap08/TS-806.test.ts` (golden `sha256:c9c7849f…7401`, CHG-001 G1 to G3 hashes through `sdd hash`, per-ID hashes), `TS-807.test.ts`, `tests/unit/model/frontmatter.test.ts:33-37` | the hash of full-form changes and `normalizeForHash` | the lite step 2a must not touch other files or profiles (C005-IF-005 §1, §5); `fx-bootstrap-g1` has no `change.md` | E-101, E-108, E-109 |
| `TS-805`, `TS-816`, `TS-808 … TS-819`, `tests/integration/gate/record.test.ts` | `gate approve`, per-ID hashes, stale, record refusals (ERR-CLI-014 on a stopped change, `record.test.ts:32`) | one hash function and one lookup serve all of them | E-107, E-61 |
| `tests/integration/cli/frontend.test.ts:49-56,113`; `tests/unit/workspace/ledger.test.ts:86,97` | ERR-CLI-002 on a missing change (`lint 007`, `id next --change 009`, `id tombstone C009-…`); the catalogue texts of ERR-CLI-002 and ERR-CLI-014 | rule L4 keeps ERR-CLI-002; the catalogue is not edited (C005-CON-02) | E-53 |
| `tests/guards/writing-commands.test.ts`, `tests/integration/cap02/permissions.test.ts:138` | the single writing-command list against the C002-IF-008 §1.2 table and the generated OpenCode permissions | the new lookup reads the list and must not add a second list (C005-CON-01) | E-55, E-116 |
| `tests/integration/cap09/TS-914 … TS-922`, `TC-1131-archive-resume.test.ts` (lines 150, 203-211, 220), `tests/integration/faults.test.ts` | the archive preconditions, the final move, the resume, the stopped-change refusal | `archiveBlockers` is rewritten; every existing fixture has tasks `done` or `dropped` and no marker, so the result must stay identical | E-45, E-111 |
| `tests/integration/cap09/TS-906.test.ts:41-47` | lite task statuses read from `plan.md` | the new archive code reads the same sections | E-42 |
| `tests/integration/cap06/TS-619.test.ts`, `TS-620.test.ts`, lint fixtures `LINT-HAND-001`, `LINT-HAND-002` | hand-off structure rules | they filter by rule code (`withCode`, `some(f.code === rule.code)`), so an extra LINT-HAND-003 finding in their drafts does not fail them | E-128 |
| `tests/unit/lint/fixtures.test.ts` and every `tests/lint-fixtures/<code>/{bad,good}` | each registered rule has a bad and a good fixture; no other rule changes | two rules are added, so two fixture folders are required (below) | E-127 |
| `tests/integration/npm-build/tarball-check.test.ts:110-115`; `scripts/check/tarball.mjs:231` | a template changed beyond the translated CLI lines, or with a plugin path left, is a finding | independent of the source form: the test appends a `${CLAUDE_PLUGIN_ROOT}` line to the staged file | E-124, E-125 |
| `tests/integration/npm-build/npm-staging.test.ts:143-145,160-181,262-270` | the translation function and its error case; `template show` prints the tarball bytes | `translateCliLines` and `scanCliPaths` do not change (C005-IF-003 §2); the planted-template test (`:147-173`) keeps their coverage | E-75, E-123 |
| `tests/integration/cli/template.test.ts:152-159` | `template show` of the tarball against a plugin copy | reads bytes; unaffected by the text | E-86 |
| `tests/integration/cap02/TS-205.test.ts`, `question-variants.test.ts:283`, `tests/integration/cap11/TS-1123.test.ts`, `TS-1126.test.ts` | conductor skill preload, conductor generated front matter, leak scan | a new preload line or a new tool name outside the wiring section is a finding | E-121, E-122 |
| `npm run check` steps: PLG-SIZE-001 and TGT-SIZE-001 (24,000 per skill, 64,000 inlined per agent), PLG-PORT-001, PLG-DUP-001, PLG-VER-001, PLG-RULES-001, PLG-MSG-001, targets, tarball, coverage | structure and size budgets of shared text; version equality of `plugin.json` and `package.json`; fix text of every rule module | new skill and longer skills, the version bump, two new rule modules | E-120, E-121, E-127, E-130 |
| Coverage step of `npm run check` | coverage threshold of the whole `src/` | new branches in `hash.ts`, `plan.ts`, `commands.ts`, `engine.ts` and two rules need tests | E-3 |

### C. New tests the spec requires (74 scenarios; 26 `@eval`, 4 `@manual-vscode` scenarios, the rest unit or integration)

| Area | Where it lands | Notes | Evidence |
|---|---|---|---|
| Read-only and refused lookups (C005-TS-146 to TS-150, TS-166) | `tests/integration/cli/` or cap08; fixture with an archived change under `.sdd/_archive/` | the archived CHG-001 can be the fixture only through a scratch copy (E-53, `TS-806.test.ts:25-28`); the workaround comment of `TS-806` may be simplified, not required | E-53, E-105 |
| Archive preconditions, marker, lite tasks (C005-TS-134 to TS-140, TS-141 to TS-143 are evals) | `tests/integration/cap09/` with a lite fixture; no lite archive test exists today | first test of `planArchive` on a lite change, including the lite branch of the spec source (`plan.ts:118-121`) | E-43, E-102, E-111 |
| Lite hash, stale after task set, 0.1.0 hash goes stale once (C005-TS-167 to TS-171) | `tests/integration/cap08/` | no test hashes a lite `plan.md` or runs `stale check` after `task set` on a lite task today (E-101) | E-101 |
| Version fill: lite scaffold, `change profile … full`, `SDD.md`, `template show` unchanged (C005-TS-114 to TS-119) | `tests/integration/cap01/`, `cli/template.test.ts` | one test per renderer caller (E-114) | E-114, E-115 |
| LINT-HAND-003, LINT-TASK-005 (C005-TS-122 to TS-125, TS-144, TS-145) | `tests/lint-fixtures/LINT-HAND-003/{bad,good}`, `tests/lint-fixtures/LINT-TASK-005/{bad,good}` (about 12 to 13 files each, as the existing HAND and TASK fixtures) plus rule tests | `fixtures.test.ts` fails without the four folders | E-127 |
| Pre-phase log lint (C005-REQ-126, C005-TS-111) | `tests/integration/cap0x/` lint test on a lite change and a full change | decides whether a lint change is in scope; reading found no rule that names the log (E-131) but no run was made | E-131 |
| Plugin-path form absent; README step 6 equals `plugin.json` (C005-TS-126 to TS-131) | `tests/integration/` (new) | scans every file under `plugins/architect/`, the bundle included | E-81, E-83 |

### D. Evals (paid, not run here; counts only)

- New: 26 `@eval` scenarios of the spec (create-change C005-TS-101 to TS-107 and TS-158 to TS-163, TS-173, TS-174; pre-phase C005-TS-108 to TS-113; planner C005-TS-120, TS-121; archive marker C005-TS-141 to TS-143; C005-TS-156 is the OpenCode row carried to CHG-003, DOD waiver C005-DOD-001). 25 run on Claude Code.
- Existing evals that exercise text this change edits, to run once or to compare with their last result: `evals/cap01/TS-122.eval.mjs` (profile round through `/architect:new`; its `answer` checks no change folder before the answer), `evals/targets/question-tool/TS-219.eval.mjs` (`/architect:new` on Claude Code and OpenCode), `evals/cap02/TS-211.eval.mjs` and `TS-206`, `TS-208`, `TS-212` (log written inside an open phase, interview-protocol §5), `evals/cap06/TS-622.eval.mjs` (planner writes a lite plan and a `handoff.md` with the five headings), `evals/toy/toy-g3.eval.mjs` (`/architect:new … --kind brownfield`, then G1 to G3 through the planner; the most exposed and the most expensive), `evals/targets/question-tool/TS-316.eval.mjs` (checks the questions logs of change 002 stay unchanged), the gate evals `evals/cap08/TS-815`, `TS-817`. The eval budget is the open item of ideation §11 and P-01's decision. Evidence: E-18, E-26, E-132.
- `@manual-vscode`: C005-TS-155, TS-157, TS-164, TS-165 (one recorded run each, four runs; TS-155 has two rows), plus the Copilot checklist of the release check (C005-REQ-118).

### E. Release evidence

`scripts/release/check.ts` reads `docs/releases/copilot/<version>/` at the version of `plugin.json` and refuses with ERR-REL-009 when a piece is missing (replay reports, injection summary, checklist record) (E-133). The 0.1.0 record holds `release.json`, `injection.json`, `replay-copilot-hooks.json`, `replay-sdd-mcp-server.json`, `zip.sha256` and the checklist reports; 0.1.1 needs the same set. `tests/unit/evals/injection-not-exposed.test.ts:17,116` names the `0.1.0` paths as test data and does not read the release folder of 0.1.1.

## Hotspots

Churn is `git log --oneline -- <file> | wc -l` at HEAD (layer 4; a churn proxy only, no complexity measure).

| Hotspot | Churn | Risk for this change | Components |
|---|---|---|---|
| `plugins/architect/scripts/sdd.mjs` (tracked bundle) | 61 commits | every `src/` task changes it; a stale bundle is not detected by the check (E-129); merges of a generated file | COMP-004 to COMP-009 |
| `src/cli/commands.ts` | 25 | the resolver, `changeOfId` and `gateContext` are the entry of 12 commands; the largest file of the change (580 lines); two components (COMP-004 for lookup, COMP-005/007 through it) touch it | COMP-004 |
| `agents/sdd-conductor.md` | 5 | three line-pinned tests (lines 46, 61, 66), the CLI anchor at line 19 (`wiring.test.ts:203`), and the Copilot inlining of its `skills:` list | COMP-001 |
| `skills/interview-protocol/SKILL.md` | 5 | the header at line 126 is pinned; §5 is the text to edit; part of the conductor's inlined budget | COMP-002 |
| `src/lint/engine.ts` | 4 | the selection logic exists in two places (E-57); one function serves lint, gate show, hook and MCP | COMP-006 |
| `tests/integration/npm-build/npm-staging.test.ts` | 4 | the tests tied to the plugin-path form; they are about to lose their premise (E-123) | COMP-011 |
| `src/gate/hash.ts` | 2 | few commits but the highest consequence: the golden hashes and every stored approval hash; one change moves four commands | COMP-009 |
| `src/workspace/templates.ts` | 2 | the renderer's contract (keys replaced only when given) changes; two callers | COMP-005 |
| `src/archive/plan.ts` | 2 | the first lite archive of this repository will run this file's lite branch (CHG-005 itself) | COMP-007 |
| `plugins/architect/skills/planning/SKILL.md` | 1 | prose behaviour of the planner (version, marker); checked only by evals and the lint | COMP-002 |

Risk entries for the plan (TR-15: every hotspot a task touches has a risk): the bundle drift, the line pins, the hash function, the lite archive path and the dogfood order of Blast radius. The conductor's preload budget: the seven preloaded skills hold 643 non-empty lines (E-120; roughly 48,000 characters if a line is about 75 characters, an estimate, not a measurement) against the 64,000 budget of TGT-SIZE-001; a measure with `npm run check` before and after the new skill is the first step of COMP-002.

## Per-component sizing

Effort hints follow the planning skill (S at most half a day, M at most one day, L at most two days) and count the test and bundle work with the source edit. "Pins" are the tests of the Regression set, section A. Order follows the Depends on edges of the component view.

| Component | Files | Tests to update (A) and add (C) | Effort | Order and notes |
|---|---|---|---|---|
| COMP-009 Gate engine (REQ-121, REQ-122) | `src/gate/hash.ts` | add TS-167 to TS-171; stay green `TS-805`, `TS-806`, `TS-807`, `TS-816` of the cap08 folder | M | First: it removes the stale fault from this change's own task reports. Tolerate a missing `change.md` (E-109). Decide where step 2a sits (in `fileHash` with the file path, not in `normalizeForHash`, which keeps its test, E-108). Rebuild the bundle in the same task |
| COMP-006 Lint engine (REQ-108, REQ-115, REQ-116, REQ-126) | `src/lint/engine.ts`; new `hand-003.ts`, `task-005.ts`; `rules/index.ts`; fixtures `LINT-HAND-003`, `LINT-TASK-005` | add fixtures and rule tests; the selection test; REQ-126 lint test; stay green the HAND and TASK fixtures | M | No dependency; two rules are S each, the fixtures are mechanical (about 25 files), the engine edit is S, the REQ-126 run is the unknown (E-131). Gate the lint rules after the planner text exists, or the dogfood plan fails its own LINT-HAND-003 |
| COMP-005 Workspace module (REQ-106, REQ-109) | `src/workspace/templates.ts`, `sddmd.ts` | add TS-114 to TS-119; check `templates.test.ts` stays green (E-126); `TS-104` stays green | S | Depends on COMP-008 for the `{{VERSION}}` template text. The renderer supplies `VERSION` (one point); `change.ts` and `upgrade.ts` need no edit (E-114). Rebuild the bundle |
| COMP-007 Archive module (REQ-112, REQ-113) | `src/archive/plan.ts` | add TS-134 to TS-140 with a lite fixture; extend `archive-fixture.ts`; stay green `TS-914` to `TS-922` and `TC-1131` of the cap09 folder | M | Depends on COMP-005 and COMP-006 (graph for lite sections; marker field). First lite archive test of the repository (E-43) |
| COMP-004 CLI front-end (REQ-116, REQ-117) | `src/cli/commands.ts` | add TS-146 to TS-150, TS-166; stay green `frontend.test.ts`, `ledger.test.ts`, `TS-806` | M | After COMP-005, 006, 007, 009. Class from `COMMANDS[...].writes` plus `values["write"]` and `values["dry-run"]` (E-117); `defectAdd` keeps ERR-CLI-008 (spec L-rules); 12 call sites need no edit if the lookup is inside `resolveChange` and `changeOfId` |
| COMP-008 Templates (REQ-105) | two `handoff.md` templates, `templates/README.md` | rewrite `npm-staging.test.ts` rows (A); `templates.test.ts` | S | No dependency; the line numbers of the pinned rows move (five-line block plus the install sentence). Keep the line `sdd task set <task-id> --status in-progress` (`npm-staging.test.ts:268`) |
| COMP-002 Skills library (REQ-101, 103, 104, 107, 114, 123, 124) | new skill (ADR in 20-plan chooses it), `interview-protocol/SKILL.md` §5, `planning/SKILL.md` | A: `wiring.test.ts:159,164`, `TS-219.test.ts:27`, `skills-portability.test.ts:10`; evals C005-TS-120, TS-121, TS-141 to TS-143 | M | Depends on COMP-008. Keep tool names out of the new skill (PLG-PORT-001, `skills-portability`); measure the inlined total (TGT-SIZE-001). The placement ADR is the planner's decision; the evidence supports either a new preloaded skill or an existing one, with the pins of A in each case |
| COMP-001 Conductor (REQ-101 to 104, 123, 124) | `agents/sdd-conductor.md` | A: `constructs.test.ts:162-164,277-285`; evals C005-TS-101 to TS-113, TS-155, TS-157 to TS-165, TS-173, TS-174 | S for the text, L for the eval and manual runs | After COMP-002 and COMP-004. To avoid moving lines 46, 61 and 66, add the step inside an existing line or update the three pins in the same task |
| COMP-003 Commands (REQ-101, REQ-112) | `commands/new.md`, `commands/archive.md` | A: `constructs.test.ts:159-161` (line 8) and `:280-281` (archive line 15); structure-checks variant at `structure-checks.test.ts:214` | S | After COMP-001 and COMP-002. `new.md` becomes a reference (C005-CON-06) and PLG-DUP-001 limits copied lines to 10 |
| COMP-010 Plugin package (REQ-110, REQ-111, REQ-118) | `README.md` step 6, `plugin.json`, `package.json`, `package-lock.json`, `CHANGELOG.md` | add the README step 6 test (C005-TS-129, TS-130) | S | The version bump goes last before the release build, so tests that name `0.1.0` as data (`injection-not-exposed.test.ts`) are checked once |
| COMP-011 Build and check tooling (REQ-110, 111, 118) | `tests/` (A and C), `scripts/` unchanged | the whole of A, the plugin-path scan test, README test; `npm run check`, rebuilt bundle committed | M | Spread over the tasks above; one closing task runs `npm run check` and verifies the bundle holds no `<plugin-root>` and the new `SDD.md` sentence |
| COMP-012 npm package (REQ-119) | no source change | `npm run package`, `npm run smoke:npm` (three shells, C005-NFR-001) | S | P-01 publishes before or with the plugin release (ideation §9, C005-REQ-119); the install line names a version the registry serves only after that |
| COMP-013 Release notes and records (REQ-118, 120, 125) | `docs/releases/github-release-notes-0.1.1.md`; `docs/releases/copilot/0.1.1/*`; `CHANGELOG.md` | `@review` scenarios (C005-TS-172, release-notes review); release check; four manual VS Code runs plus the checklist | L | Last. Includes paid injection evals and manual runs under the release check (E-133); the quote of the 0.1.0 `SDD.md` sentence is E-79 |

Totals as a planning input: 13 components; by hint 1 L, 5 M plus 1 M (tooling, spread), 6 S. Critical path by dependency: COMP-009 and COMP-008 and COMP-006 (no dependency) → COMP-005, COMP-002 → COMP-007 → COMP-004 → COMP-001 → COMP-003 → COMP-011 → COMP-012 → COMP-013.

## Evidence

All entries: commit `b51cc34`, pattern none; disclosures start with `ripwire failed: exit 127` unless stated.

- **E-104** `src/cli/commands.ts:1` › - — (folders `src/`, `plugins/`, `tests/`, `scripts/`) no file of these folders differs between `fef82eb` (spec-phase evidence) and HEAD `b51cc34`; E-54 to E-103 hold.
  - layer: grep (`git diff --stat fef82eb HEAD`) · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-105** `src/cli/commands.ts:332` › `resolveChange()` — referencing symbols at HEAD: 12 sites in `gateContext` (130), `changeStop` (184), `taskSet` (218), `defectClose` (244), `defectReopen` (252), `hashCmd` (260), `staleCmd` (275), `traceCmd` (305), `changeProfile` (378), `idNext` (393), `idTombstone` (405), `archiveCmd` (463); no reference from `src/` outside `commands.ts` and none from `tests/` or `scripts/`.
  - layer: serena · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-106** `src/cli/commands.ts:204` › `changeOfId()` — referenced by `taskSet` (218) and `defectAdd` (233) only.
  - layer: serena · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-107** `src/gate/hash.ts:38` › `phaseHash()` — callers: `recordApproval` (`hash.ts:68`), `gateSummary` (`gate.ts:88`), `staleCheck` (`stale.ts:33`), `hashCmd` (`commands.ts:262`); tests: `TS-805.test.ts:23`, `TS-806.test.ts:18`, `TS-807.test.ts:26,28`, `TS-816.test.ts:17`, `gate-fixture.ts:27`.
  - layer: serena · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-108** `src/model/frontmatter.ts:48` › `normalizeForHash()` — one production caller, `fileHash` (`hash.ts:34`); one test file, `tests/unit/model/frontmatter.test.ts:34-36` (three assertions).
  - layer: serena · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-109** `src/gate/hash.ts:38-44`; `tests/integration/cap08/TS-806.test.ts:18`; `tests/fixtures/fx-bootstrap-g1` › `phaseHash()` — `phaseHash(changeDir, phase)` takes no profile and reads no `change.md`; `TS-806` hashes `tests/fixtures/fx-bootstrap-g1`, which holds one tracked file, `00-ideation/ideation.md`, and no `change.md` (`git ls-files`). A lite-only rule inside the hash path must read the profile defensively.
  - layer: grep (Read, `git ls-files`) · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-110** `src/archive/plan.ts:203` › `archiveBlockers()` — one caller, `planArchive`; `planArchive` has one caller, `archiveCmd` (E-38).
  - layer: serena · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-111** `tests/integration/cap09/TS-914.test.ts`, `TS-915 … TS-922.test.ts`, `TC-1131-archive-resume.test.ts`, `archive-fixture.ts:92`, `tests/integration/faults.test.ts:35`, `tests/integration/cap06/checklist.test.ts` › - — the tests that name `planArchive`, `archiveBlockers`, ERR-CLI-009 or the `archive` command; `archive-fixture.ts:92` builds only `20-plan/50-tasks/T-0nn-t.md` files (default statuses `done`, `dropped`); no `lite` and no marker in cap09 except `TS-906.test.ts:41-47` (task states).
  - layer: grep · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable, so reach is by grep of the test folders
- **E-112** `src/lint/engine.ts:106` › `lintWorkspace()` — callers: `lint` (`commands.ts:116`), `lintPhase` (`gate.ts:46`), `postWriteFeedback` (`src/hooks/post-write.ts:27`, `phase: null`), `quickLint` (`src/mcp/tools/files.ts:58`).
  - layer: serena · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-113** `src/lint/engine.ts:112,120,123,134,145-148`; `src/lint/rules/tr-13.ts:12` › `lintWorkspace()` — the three selections (all active, `--file`, `--change`) each filter `!f.archived`; the change `folder` is `.sdd/${f.name}` (134) while the workspace-wide definitions already use `.sdd/_archive/${f.name}` for archived folders (145); `activeDefinitions` (148, 160) is read by one rule, `tr-13.ts`.
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; spurious findings on an archived change were not run
- **E-114** `src/workspace/templates.ts:151` › `renderTemplate()` — callers: `createChange` (`change.ts:76`, text), `planUpgrade` (`upgrade.ts:114` for a file name, `:120` for text); tests: `templates.test.ts:58,88,90,121`.
  - layer: serena · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-115** `src/workspace/sddmd.ts:12` › `renderSddMd()` — callers: `initWorkspace` (`init.ts:55` first write, `:59` `--force`); the only test on the text is `TS-104` (E-85); `readStatusBlock` has its own tests (`TS-107`, `TS-108`).
  - layer: serena · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-116** `src/cli/writing-commands.ts:25` › `WRITING_COMMANDS` — consumers: `COMMANDS` (`commands.ts:550`), `src/hooks/guard-bash.ts:175,186,187`, `scripts/generate/emit/opencode-permissions.ts:70`, `tests/guards/writing-commands.test.ts:55,68-69,84,91`, `tests/integration/cap02/permissions.test.ts:138`.
  - layer: serena · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-117** `src/cli/commands.ts:58-74` › `CommandContext` — carries `name`, the parsed `values` (so `--write` and `--dry-run`) and `rest`; the class of an invocation can be derived inside the lookup from `COMMANDS` (`writes`) without new parameters.
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; feasibility read, not run
- **E-118** `src/tracking/task.ts:87-100,117-122` › `setLiteField()`, `setTask()` — one production caller (`taskSet`, `commands.ts:223`); the section bounds are the heading `^#{2,4}\s+<id>` to the next `^#{1,4}\s` heading, the bounds that C005-IF-005 §2 states.
  - layer: grep (Read) + serena (callers) · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-119** `tests/integration/cap01/constructs.test.ts:159-164,277-285`; `tests/integration/cap01/wiring.test.ts:159,164,203`; `tests/integration/cap02/TS-219.test.ts:27`; `tests/integration/cap02/TS-205.test.ts:28-34` › - — what each test pins: `commands/new.md` line 8 holds `$ARGUMENTS`; `agents/sdd-conductor.md` line 46 holds `architect:sdd-researcher`, lines 61 and 66 hold `AskUserQuestion`, line 19 the CLI anchor; `commands/archive.md` line 15 holds `AskUserQuestion`; `skills/interview-protocol/SKILL.md` line 126 is `## Claude Code wiring`; the conductor `skills:` list equals seven names exactly; each phase skill is preloaded and each phase command says "Load the `<skill>` skill".
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-120** `plugins/architect/agents/sdd-conductor.md:8`; `plugins/architect/targets/copilot.json:33`; `scripts/check/targets/size.mjs:9-10` › - — the conductor preloads sdd-conventions, interview-protocol, options-analysis, gate-protocol, phase-ideation, phase-spec, phase-plan (643 non-empty lines in total, from a count of non-empty lines per `SKILL.md`); the Copilot target inlines preloaded skills (`"skills": "inline"`); TGT-SIZE-001 limits each inlined skill to 24,000 and an agent's inlined skills to 64,000 characters. The characters of the seven skills were not measured.
  - layer: grep · confidence: low
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; headroom is an estimate from line counts; `git ls-tree` and `wc` are outside the allowlist
- **E-121** `tests/integration/cap02/TS-205.test.ts:28-44`; `scripts/check/size.mjs:7` › - — PLG-DUP-001: a command shares at most 10 consecutive lines with an agent body and holds no "Step n" phase procedure; phase commands load the skill (the pattern for C005-CON-06); PLG-SIZE-001: 24,000 characters per skill.
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-122** `tests/integration/cap02/skills-portability.test.ts:10-22` › `SKILLS` — 18 skills tested; a tool name (`AskUserQuestion`, `Agent(`, `TodoWrite`, `mcp__`) is allowed only under `## Claude Code wiring`; the new skill is tested only if added to the list.
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-123** `tests/integration/npm-build/npm-staging.test.ts:119-141` › `HANDOFFS` — (also lines 35, 239-255 and 262-270) line 113 `notEqual(staged, source)` for the two hand-offs; lines 119-141 four rows with the source line `node <plugin-root>/scripts/sdd.mjs <args>` and the staged `sdd <args>` at the same line number; lines 239-255 two scaffolded workspaces (plugin copy and npm copy) must differ only by the plugin-path prefix and the final assertion requires that `20-plan/handoff.md` differs; lines 262-270 `template show full/20-plan/handoff.md` of the installed `sdd` prints a line `sdd task set <task-id> --status in-progress` and equals the tarball entry. The last test stays green if that line is kept (C005-IF-003 §3).
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-124** `tests/integration/npm-build/tarball-check.test.ts:109-116` › `TGT-NPM-001` test — appends a `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs` line to the staged full hand-off and expects "differs from the source template other than by the translated CLI lines" and a plugin-path finding at a line; it does not read the plugin-path form of the source lines.
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; behaviour inferred from reading, not run
- **E-125** `scripts/check/tarball.mjs:231-232`; `scripts/template-cli-lines.mjs:12-17` › - — a staged template is accepted when it equals the source or `translateCliLines(source)`; with bare-`sdd` source lines the two are equal; the scan for leftover plugin paths stays.
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-126** `tests/unit/workspace/templates.test.ts:45-60`; `src/workspace/templates.ts:151-159` › `VARS`, `renderTemplate()` — `VARS` has twelve keys and no `VERSION`; the test asserts no placeholder is left after rendering; with `VERSION` supplied by the renderer the assertion holds with no change to `VARS`. Inference from E-67 and E-77; not run.
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-127** `tests/unit/lint/fixtures.test.ts:31-51`; `scripts/check/rules.mjs:38-55`; `tests/lint-fixtures/LINT-HAND-001` › - — each registered rule needs `tests/lint-fixtures/<code>/{bad,good}/.sdd` and a `fix:` string literal in its module; the fixture folders hold 12 (LINT-TASK-004) or 13 (LINT-HAND-001, LINT-HAND-002) files per side; `PLG-RULES-001` reads the rule catalogue from the CHG-001 `errors.md` row list, so a rule absent from that file is not checked by it.
  - layer: grep (Read, `git ls-files`) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-128** `tests/integration/cap06/TS-619.test.ts:29`; `tests/integration/cap06/TS-620.test.ts:16`; `tests/unit/lint/fixtures.test.ts:48-49`; `tests/lint-fixtures/LINT-HAND-001`, `LINT-HAND-002` › - — the tests that lint a hand-off filter the findings by their own rule code, and the only hand-off fixtures in `tests/lint-fixtures` and `tests/fixtures` are those four and the quoted text of `fx-bootstrap-g1`; a grep of `tests/` and `evals/` for "Reporting protocol" finds no other file than `TS-619`, `TS-620` area and the eval `evals/cap06/TS-622.eval.mjs`.
  - layer: grep · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim limited to `tests/` and `evals/` (a first grep over the whole repository timed out)
- **E-129** `scripts/check.mjs:25-51` › `STEPS` — (and the folder `.github/workflows/`) a grep of `scripts/check.mjs` for bundle-drift wording finds nothing, and a grep of `.github/workflows` for `diff`, `sdd.mjs` or `build` finds nothing; no automatic comparison of the tracked bundle with `src/`.
  - layer: grep · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim
- **E-130** `scripts/check/rules.mjs:57-93`; `package.json:3`; `plugins/architect/.claude-plugin/plugin.json:3`; `package-lock.json:3,9` › `ver001`, `msg001` — PLG-VER-001 requires root `package.json` and `plugin.json` to carry the same version; `package-lock.json` holds the version twice; `.claude-plugin/marketplace.json` holds no version.
  - layer: grep · confidence: high
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-131** `src/lint/spec-facts.ts:76`; `src/trace/write.ts:27-28`; `src/workspace/templates.ts:19` › - — plan rules run only when `phases.20-plan.status` is not `not-started`; the trace writes `20-plan` files only when the plan has started; the only `src/` mention of `questions-log` is the lite scaffold list. No rule names a pre-phase `questions-log.md`, which suggests no finding; the lint was not run on such a file.
  - layer: grep (Read) · confidence: low
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; no run (writing a file is outside this role)
- **E-132** `evals/cap01/TS-122.eval.mjs:15-43`; `evals/cap02/TS-211.eval.mjs:24-47`; `evals/cap09/TS-910.eval.mjs`; `evals/toy/toy-g3.eval.mjs:114`; `evals/cap06/TS-622.eval.mjs:27-38` › - — existing evals near the edited text: `TS-122` sends `/architect:new "Add --json flag to status"` and checks the first profile option and no folder before the answer; `TS-211` checks a free-text answer logged in `00-ideation/questions-log.md`; toy-g3 runs `/architect:new … --kind brownfield` to G3; `TS-622` has the planner write a lite plan and its `handoff.md` and checks the five headings.
  - layer: grep (Read) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable; evals not run (paid)
- **E-133** `scripts/release/check.ts:117-290` › `releaseCheck()` — (also the folder `docs/releases/copilot/0.1.0`) the check builds `releaseDir = docs/releases/<target>/<version>` from `plugin.json` and refuses with ERR-REL-009 for a missing replay report, ERR-REL-003 for a missing checklist record and ERR-REL-009 or ERR-REL-002 for the injection summary; the 0.1.0 folder holds `release.json`, `injection.json`, two replay reports, `zip.sha256` and candidate reports.
  - layer: grep (Read, `git ls-files`) · confidence: medium
  - commit: b51cc34 · pattern: none
  - disclosures: ripwire failed: exit 127; the exact pieces for the Copilot target at 0.1.1 follow the record schema, not read here
