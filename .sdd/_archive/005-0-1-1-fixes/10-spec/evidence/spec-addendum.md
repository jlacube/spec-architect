---
id: "C005-SPEC-EVIDENCE"
artifact: spec/evidence-addendum
change: "CHG-005"
phase: 10-spec
status: draft
---
# CHG-005 — Spec-phase evidence addendum

Scope: the four open items of the 10-spec brief (step 2): read-only versus writing commands, the version fill
mechanics, the other implementer-facing CLI lines, and the archive-task identification candidates. Evidence entries
continue the baseline survey (`00-ideation/evidence/baseline-survey.md`, E-1…E-53); entries E-1…E-53 are referenced
by number and not repeated. Commit surveyed: `fef82eb`. No fix is proposed and nothing is decided here.

Layers: ripwire absent (`ripwire --version` exit 127, command not found), so every entry carries
`ripwire failed: exit 127`. Serena answered for `src/cli/commands.ts` (symbols overview and the bodies of
`gateContext`, `gateShow`, `gateApprove`, `gateRecord`, `changeStop`, `taskSet`). For the other functions of
`commands.ts` and for the files outside it, the file was read in full (layer 4, confidence medium) instead of being
re-asked through Serena. Markdown, JSON and `.mjs` text: grep and Read (layer 4). Four read-only CLI runs of the
bundled `plugins/architect/scripts/sdd.mjs` confirm behaviour (confidence high). Line numbers are 1-based.

## 1. Read-only versus writing commands

The CLI already carries one classification of writing commands: `WRITING_COMMANDS` (E-54), from which each row of
the command table takes its `writes` property (E-55). A command absent from that list is read-only. The table below
joins that classification with the code paths that call the change resolver (E-51) and the files each path writes.

| Command path | Resolver call | Class | Files written | Entries |
|---|---|---|---|---|
| `gate show <NNN> <phase>` | `gateContext` → `resolveChange` | read-only | none | E-56, E-57 |
| `hash <NNN> <phase>` | `resolveChange` | read-only | none | E-58 |
| `trace <NNN>` without `--write` | `resolveChange` | read-only | none | E-60 |
| `archive <NNN> --dry-run` | `resolveChange` | read-only | none | E-65 |
| `lint [<NNN>]` | none (own filter) | read-only | none | E-66 |
| `status` without `--write` | none | read-only | none | E-66 |
| `trace <NNN> --write` | `resolveChange` | writing | `10-spec/80-traceability.md`; `20-plan/80-traceability.md` when the plan has started; `<phase>/85-open-items.md` per started phase; `trace.json` | E-60 |
| `trace --active [--write]` | none (own enumeration) | writing with `--write` | the same files, for every active change | E-60 |
| `stale check [<NNN>]` | `resolveChange` (with `<NNN>`) | writing ("always" in the table) | `change.md` only when a phase is found stale; then `registry.json` and the `SDD.md` status block | E-59 |
| `gate approve` | `gateContext` | writing | `approvals.json`, `change.md`, `registry.json`, `SDD.md` status block; a git commit with `--commit` | E-61 |
| `gate record`, `change revise` | `gateContext` | writing | `change.md`; `registry.json` and `SDD.md` status block | E-61 |
| `change stop` | `resolveChange` | writing | `change.md`; `registry.json` and `SDD.md` status block | E-61 |
| `task set` | `resolveChange` or `changeOfId` | writing | the task file under `20-plan/50-tasks/` or the lite `20-plan/plan.md`; `registry.json` and `SDD.md` status block | E-62 |
| `defect close`, `defect reopen` | `resolveChange` | writing | `change.md`; `registry.json` and `SDD.md` status block | E-63 |
| `defect add` | `changeOfId` | writing | `change.md`; `registry.json` and `SDD.md` status block | E-63 |
| `id next`, `id tombstone` | `resolveChange` | writing | `ids.json` | E-64 |
| `change profile <NNN> full` | `resolveChange` | writing | new full-profile files, removed lite files, `change.md` | E-64 |
| `archive <NNN>` | `resolveChange` | writing | `_living/CAP-*.md`, `_constitution/glossary.md`, `change.md`, folder move, `registry.json`, `SDD.md` | E-65 |

### Evidence

- **E-54** `src/cli/writing-commands.ts:25-48` › `WRITING_COMMANDS` — the single list of 22 writing subcommands, each with `when` (`always`, `with-write`, `unless-dry-run`) and a guard. `status` and `trace` are `with-write`, `archive` is `unless-dry-run`, `stale check`, `task set`, `defect *`, `gate approve|record`, `change *`, `id *` are `always`. `gate show`, `hash`, `lint`, `version`, `template *` and `host-version` are absent, so read-only.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-55** `src/cli/commands.ts:549-550` › `COMMANDS` — each command row takes `writes` from `WRITING_COMMANDS`, "no second list"; `tests/guards/writing-commands.test.ts:52-70` ties the list to the C002-IF-008 §1.2 table in both directions (read through the spec-file locator) and to the `writes` property of every row, so a changed list needs a changed table row.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-56** `src/cli/commands.ts:128-137` › `gateContext()`, `gateShow()` — `gateContext` calls `resolveChange` (line 130); `gateShow` only prints `gateSummary(...)`. `gateApprove` (144), `gateRecord` (193) and `changeRevise` (174) call the same `gateContext`, so a resolver switch inside `gateContext` reaches read-only and writing gate commands alike.
  - layer: serena · confidence: high
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines are 0-based, 1 added
- **E-57** `src/gate/gate.ts:45-47`, `:62-103` › `lintPhase()`, `gateSummary()` — `gateSummary` writes nothing, but it calls `lintPhase`, which calls `lintWorkspace(root, { change: <NNN>, … })`; `src/lint/engine.ts:112,123-124` selects only non-archived folders for a named change and raises ERR-CLI-002 otherwise. So an archived change fails `gate show` in the lint step even when the command resolver finds it.
  - layer: grep (Read) · confidence: high (read; the same lint filter reproduced by `sdd lint 001`, E-66)
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-58** `src/cli/commands.ts:259-266` › `hashCmd()` — resolves the change, calls `phaseHash`, prints; no write (`phaseHash` itself: E-49).
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-59** `src/cli/commands.ts:273-291` › `staleCmd()`; `src/gate/stale.ts:21-48` › `staleCheck()` — the CLI always calls `staleCheck(dir, true)` (line 280), the only caller; `staleCheck` rewrites `change.md` only when a phase is stale (lines 42-46); `staleCmd` then rewrites `registry.json` and the `SDD.md` block (282-283). With `<NNN>` it calls `resolveChange` (275); without it, it walks the active folders only (275); it skips a change whose `change.md` says `archived` (279). There is no read-only form of `stale check`.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-60** `src/cli/commands.ts:298-326` › `traceCmd()`, `traceActive()`; `src/trace/write.ts:32-54` › `trace()` — with `write: false` it returns the result without a write (line 43); with `--write` it writes `10-spec/80-traceability.md` (49), `20-plan/80-traceability.md` when the plan has started (50), `<phase>/85-open-items.md` for each started phase (51) and `trace.json` (52). `--active` goes to `traceActive` and does not call `resolveChange` (300, 324); the SubagentStop hook runs it with `--write`.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-61** `src/gate/gate.ts:129-132`, `:154-177`, `:184-199`; `src/cli/commands.ts:144-166`, `:183-190`, `:193-200` › `approvalBlockers()`, `approve()`, `record()`, `gateApprove()`, `changeStop()`, `gateRecord()` — `approve` writes `approvals.json` (`recordApproval`, line 159) and `change.md` (175); `gateApprove` then runs `writeStatus` (158, `registry.json` and the `SDD.md` block) and, with `--commit`, a git commit (161-165). `record` writes `change.md` (198); `gateRecord` runs `writeStatus` (197-198); `changeRevise` and `changeStop` call `refreshRegistry`. `approvalBlockers` already refuses a `stopped` or `archived` change with ERR-CLI-014 (131-132), unreachable today because the resolver never returns an archived folder.
  - layer: serena (gateApprove, gateRecord, changeStop) + grep (Read) · confidence: high
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines are 0-based, 1 added
- **E-62** `src/cli/commands.ts:216-228` › `taskSet()`; `src/tracking/task.ts:102-132` › `setTask()` — resolves with `changeOfId` for a full ID (218) and `resolveChange(ctx, undefined)` for a short ID; `setTask` writes one file, the task file (frontmatter `status`, `report`) or `20-plan/plan.md` (lite fields, lines 118-126), at line 130; `taskSet` then runs `refreshRegistry` (224). The no-`<NNN>` form of `resolveChange` takes the change that contains the working folder, else the only change (E-48; `src/cli/commands.ts:340-342`).
  - layer: serena (taskSet) + grep (Read) · confidence: high
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines are 0-based, 1 added
- **E-63** `src/cli/commands.ts:231-256` › `defectAdd()`, `defectClose()`, `defectReopen()`; `src/tracking/defect.ts:20-57` — each rewrites the `defects` list of `change.md` only (line 21), then `refreshRegistry`. `defectAdd` finds the change with `changeOfId` and already throws ERR-CLI-008 for a change whose status is `archived` (lines 234-235), unreachable for a folder under `_archive/`.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-64** `src/cli/commands.ts:377-409` › `changeProfile()`, `idNext()`, `idTombstone()`; `src/workspace/ledger.ts:56,105-108,151,161`; `src/workspace/upgrade.ts:186-192` — `idNext` and `idTombstone` write `ids.json` (`save`); `changeProfile` writes the full-profile files from `planUpgrade`, removes lite files and rewrites `change.md` `profile`; it does not call `refreshRegistry`.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-65** `src/cli/commands.ts:462-473` › `archiveCmd()`; `src/archive/apply.ts:17-27`; `src/archive/plan.ts:376-385` — `--dry-run` returns before `applyArchive` (line 469), so nothing is written; the apply step writes the planned `_living/CAP-*.md` and `_constitution/glossary.md` files and `change.md` (`status: archived`), moves the folder and runs `writeStatus` (`registry.json`, `SDD.md`). `planArchive` already refuses `archived` in `_archive/` and `stopped` with ERR-CLI-014 (`src/archive/plan.ts:201-202`), a different code from the ERR-CLI-002 that the resolver gives today.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-66** `src/cli/commands.ts:111-126`, `:346-366`; `src/lint/engine.ts:112,122-126`; `plugins/architect/scripts/sdd.mjs:1` › `lint()`, `status()`, `lintWorkspace()` — `lint` and `status` without `--write` write nothing; `status --write` writes `registry.json` and the `SDD.md` block; `status` without `--write` reads archived changes (`listChanges`, E-50). `lint <NNN>` does not use `resolveChange`, but its change filter excludes archived folders: bundled-CLI runs on 2026-11-17: `sdd lint 001 --quiet` exit 2 and `sdd trace 001` exit 2, both "ERR-CLI-002: Change `001` not found. Fix: Check `sdd status`".
  - layer: grep (Read) + two CLI runs · confidence: high
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; runs use the bundled CLI of this repository, not an installed plugin

Facts the spec decision turns on (no choice made here): the read-only set derivable from E-54 is `gate show`, `hash`, `trace` without `--write`,
`archive --dry-run`, `lint`, `status` without `--write`; `stale check` is writing in the table although it writes
nothing when no phase is stale (E-59); three of the read-only commands depend on a flag (`trace`, `archive`) or on a
second archived-change filter (`gate show` and `lint`, E-57, E-66), so a resolver-only change does not make them
work on an archived change.

## 2. Version fill mechanics

### Evidence

- **E-67** `src/workspace/templates.ts:151-159` › `renderTemplate()`, `placeholders()` — the placeholder syntax is `{{KEY}}` with `KEY` in `[A-Z]+`; only keys passed in `vars` are replaced, all others are left in place; `placeholders()` lists what remains. `{{VERSION}}` matches the syntax. The angle-bracket forms (`<plugin-root>`, `<version>`) are not placeholders for this function and are never touched.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-68** `src/workspace/change.ts:59-84` › `createChange()` — substitution happens here at `sdd change new`: `vars` (lines 69-74) holds `CHANGE`, `P`, `NNN`, `TITLE`, `DATE`, `KIND`, `PROFILE`, `NAME`, `SEQ`, `NN`, `B`, `SLUG`, no version; `change.md` and `ids.json` are rendered for both profiles (80-81); the six `LITE_SCAFFOLD` files (`src/workspace/templates.ts:17-24`), `20-plan/handoff.md` among them, only for `--profile lite` (82). A full-profile change gets no `handoff.md` from the CLI.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-69** `src/workspace/upgrade.ts:108-122` › `planUpgrade()` — the second caller of `renderTemplate` has its own `vars` map (line 111, no version) and renders full-profile templates when a lite change is upgraded.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-70** `src/cli/template-cmd.ts:20-31` › `templateShow()` — `sdd template show <profile>/<path>` prints "the template bytes unchanged" (line 20, `ctx.out.raw(t.text)` line 29); no substitution of any placeholder. `tests/integration/npm-build/npm-staging.test.ts:262-273` (C002-TS-534) asserts that the installed `sdd` prints the tarball's template bytes exactly.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-71** `plugins/architect/templates/README.md:6-15` › `Placeholders` — the documented placeholder set: `CHANGE`, `P`, `NNN`, `TITLE`, `KIND`, `PROFILE`, `DATE`, `SEQ`, `SLUG`, `NAME`, `NN`, `B`. No `{{VERSION}}` or other version placeholder exists in the repository outside this change (grep of `{{VERSION}}` in `src/`, `scripts/`, `plugins/`, `tests/`, `docs/`: no match).
  - layer: grep · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim
- **E-72** `plugins/architect/templates/full/20-plan/handoff.md:19-27`; `plugins/architect/templates/lite/20-plan/handoff.md:19-27`; `.sdd/005-0-1-1-fixes/20-plan/handoff.md:20-23` › `Reporting protocol` — both templates carry the four `node <plugin-root>/scripts/sdd.mjs …` lines at lines 20-23 and the frontmatter fallback at 26-27; the lite hand-off that `sdd change new --profile lite` scaffolded for this change holds the same literal `<plugin-root>` at lines 20-23, so the CLI scaffold leaves the angle-bracket form as is.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-73** `plugins/architect/skills/planning/SKILL.md:73-85`; `plugins/architect/agents/sdd-planner.md:18` › `Hand-off (handoff.md)` — the planner text lists the Reporting protocol content as bare `sdd …` commands and the fallback; it names no template to copy, no placeholder to fill. Grep of `plugins/architect/agents` for `templates` finds nothing; `plugins/architect/skills` mentions templates only in `user-stories` and `diagramming`. So the full-profile `handoff.md` is written by the planner from the skill text, or from a copy of the template that no plugin text asks for.
  - layer: grep · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim from grep of `agents/` and `skills/`
- **E-74** `src/version.ts:1-5`; `scripts/build.mjs:14-15,43`; `scripts/test.mjs:57`; `src/cli/run.ts:83-86`; `src/workspace/init.ts:55`; `src/workspace/sddmd.ts:12-16` › `VERSION`, `TOOL`, `renderSddMd()` — the CLI knows its version at run time: `VERSION` is injected at build time from `plugin.json` (single source, `scripts/build.mjs:14`) into the Claude Code bundle and, by the same define, into the npm bundle; `sdd --version` prints the bare version, `sdd version` prints `architect-plugin@0.1.0` (run on 2026-11-17). `renderSddMd(TOOL)` already writes `architect-plugin@<version>` into the `generator` field of `SDD.md`.
  - layer: grep (Read) + one CLI run · confidence: high
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; runs use the bundled CLI of this repository
- **E-75** `scripts/package.mjs:144-145`; `scripts/template-cli-lines.mjs:12-17`, `:20-24`; `scripts/check/tarball.mjs:231` › `translateAndScanTemplates()`, `INVOCATION`, `CONSTRUCTS` — at packaging the npm build rewrites each staged template: only the exact shapes `node <plugin-root>/scripts/sdd.mjs` and `node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs` become `sdd`; any other text, a `{{VERSION}}` placeholder or an `npm install -g architect-sdd@…` line included, is copied unchanged; `scanCliPaths` (`CONSTRUCTS`) flags leftover plugin paths of the CLI as ERR-BLD-002; the tarball check accepts a staged template that equals the source or `translateCliLines(source)` (line 231). If the source lines no longer hold the plugin-root form, the translation changes nothing for those lines.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-76** `tests/integration/npm-build/npm-staging.test.ts:35,113`, `:119-141`, `:239-255`; `tests/integration/npm-build/tarball-check.test.ts:110-115` › `HANDOFFS` — tests that depend on the translation of the hand-off lines: line 113 asserts the staged hand-offs differ from their source (`notEqual`); lines 119-141 (C002-TS-529) assert source lines 20-23 hold the plugin-root form and the staged lines the bare form; lines 239-255 assert the two scaffolded workspaces differ in `20-plan/handoff.md`; `tarball-check.test.ts:110-115` builds its ERR-BLD-002 case on the full hand-off. They fail once the source lines no longer hold the plugin-root form.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable
- **E-77** `tests/unit/workspace/templates.test.ts:45-60` › `VARS` — the test renders every shipped template with a fixed `VARS` (no version key) and asserts `placeholders(text)` is empty; a template holding `{{VERSION}}` fails this test until `VARS` gains the key. `src/lint/rules/hand-001.ts:26-27` requires only the words `task set`, `defect add` and `frontmatter` in the Reporting protocol; a grep of `src/lint` finds no rule that reports a leftover `{{…}}` or `<version>` (only `sec-001.ts:27` and `txt-001.ts` mention placeholders, for secrets and for `TBD`/`TODO`).
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim
- **E-78** `scripts/generate/reader.ts:15`; `plugins/architect/targets/copilot.json:90` › `generator input` — the generator reads agents, commands, skills and configuration as text; `templates/` is "not input"; generated agents read templates through `sdd template show` (copilot.json:90). On the generated targets the template text therefore comes from the `sdd` that runs `template show` (the npm package's translated templates, E-30), not from a copy in the package.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127

Facts the spec decision turns on (no choice made here): a CLI-side fill has one natural point for lite (`createChange`, E-68), none for full
(no CLI scaffold; `template show` prints bytes, E-70), and `VERSION` is already available in the process (E-74); a
planner-side fill needs a rule in the planning skill (E-73) and a check, since lint reports no leftover (E-77); both
routes change tests E-76 and E-77 and, if the source lines stop holding the plugin-root form, make the npm rewrite
a no-op (E-75).

## 3. Other implementer-facing CLI lines

An implementer-facing line is shipped text that tells a reader without necessarily having the plugin to run the CLI
through a plugin path. Confirmed: `src/workspace/sddmd.ts:33` and `plugins/architect/README.md:114`. Besides the
two hand-off templates (E-72), the searches below found no further one in `plugins/`, `src/`, `docs/` or the root
documents.

### Evidence

- **E-79** `src/workspace/sddmd.ts:31-33` › `renderSddMd()` — section "If you are implementing a change": "Read `NNN-slug/20-plan/handoff.md` and report progress with `node <plugin-root>/scripts/sdd.mjs task set <task-id> --status <status>` as described there." The text is in a template literal; the bundled copy is `plugins/architect/scripts/sdd.mjs:10436` and changes only on `npm run build`. C001-REQ-103 (`.sdd/_living/CAP-workspace.md:111`) fixes the section names, not this sentence.
  - layer: grep (Read) · confidence: high
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-80** `src/workspace/init.ts:53-61`; `src/workspace/status.ts:206-231`; `src/workspace/adopt.ts:12-25` › `initWorkspace()`, `writeStatus()`, `adoptBootstrap()` — `SDD.md` is written when absent; an existing one is re-rendered only by `sdd init --force` (status block kept); `status --write` rewrites only the block between the markers, and `adoptBootstrap` rewrites only the `generator` line of a `manual` workspace. An existing workspace keeps the old sentence unless `init --force` runs.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-81** `plugins/architect/README.md:113-114` › `step 6 of "In your repository"` — "Give `.sdd/001-coupon-codes/20-plan/handoff.md` to whoever implements it. Progress is reported with `node <plugin>/scripts/sdd.mjs task set <task-ID> --status done --commit <sha>`." This is the only occurrence of the `<plugin>/scripts` form in the repository's shipped text (the form differs from `<plugin-root>`, so `scripts/template-cli-lines.mjs:12` does not match it either).
  - layer: grep · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-82** `plugins/architect/agents/sdd-conductor.md:19`; `plugins/architect/agents/sdd-auditor.md:13`; `plugins/architect/skills/sdd-conventions/SKILL.md:13`; `plugins/architect/hooks/hooks.json:7,11,17,23,28`; `plugins/architect/.mcp.json:14` › - — the other `scripts/sdd.mjs` constructs in `plugins/` use `${CLAUDE_PLUGIN_ROOT}` and address agents and hooks that run inside the plugin (the generated targets rewrite the three Markdown lines through `copilot.json:111,121,257` and `opencode.json:111,121,257`); none tells an implementer to run it. A grep of `plugins/` (excluding the bundle) for `plugin-root`, `<plugin>/scripts` and `task set` finds only the templates (E-72), README line 114, `skills/planning/SKILL.md:82` and `skills/sdd-conventions/SKILL.md:76` (both bare `sdd`).
  - layer: grep · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim
- **E-83** `src/workspace/sddmd.ts:33` › - — a grep of `src/` for `plugin-root`, `<plugin>/scripts` and `node …scripts/sdd.mjs` finds this line and no other.
  - layer: grep · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim
- **E-84** `docs/releases/github-release-notes-0.1.0.md:42`; `docs/dogfood.md:215`; `PLUGIN.md:107`; `PORTING-STUDY.md:102`; `OVERVIEW.md:86`; `GLOSSARY.md:61`; `CHANGELOG.md:26` › - — release-facing and root documents: none holds `node <plugin-root>` or `node <plugin>/scripts`. The 0.1.0 release notes already tell implementers to "install `architect-sdd` from npm and run `sdd task set` directly" (line 42, D-035 described as a known gap); `docs/dogfood.md:215` records the defect; the root documents name the bundle path or the hook commands for plugin-hosted use. The 0.1.1 notes will replace line 42's workaround text; a grep of `docs/` for `plugin-root` and `<plugin>/scripts` finds only `docs/dogfood.md:215` among the Markdown files.
  - layer: grep · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim; replay JSON files under `docs/releases/` and `docs/spikes/` hold recorded transcripts and were not read
- **E-85** `tests/integration/cap01/TS-104.test.ts:19-36` › `C001-TS-104` — the only test on the `SDD.md` text: it asserts the frontmatter keys, a `generator` matching `architect-plugin@\d+\.\d+\.\d+`, the three section headings (including "If you are implementing a change") and one status block; no test pins the sentence of line 33. A grep of `tests/` for `plugin-root`, `<plugin>/scripts` and `task set <task-id>` finds, outside the hand-off tests (E-76, E-86), only the fixture `tests/fixtures/fx-bootstrap-g1/00-ideation/ideation.md:1047-1048` (a bootstrap ideation quoting `node <plugin>/scripts/sdd.mjs task set …`; test data, not shipped text).
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable
- **E-86** `tests/integration/cli/template.test.ts:152-159`; `tests/lint-fixtures/LINT-HAND-001`, `LINT-HAND-002`; `tests/manual/TS-621.md`; `tests/unit/workspace/templates.test.ts:50-60` › - — the remaining tests that read the hand-off templates, besides E-76: `template.test.ts:152-159` (a plugin-root copy against the tarball's `template show`), the two hand-off lint fixtures (structure), the manual Superpowers scenario `C001-TS-621`, and the template render test (E-77). No test pins `plugins/architect/README.md:114`: a grep of `tests/` for "Progress is reported" and for that README line finds nothing.
  - layer: grep · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable; absence claim for the README

Test map per line to change: `src/workspace/sddmd.ts:33` — `tests/integration/cap01/TS-104.test.ts` (headings, not the sentence; E-85);
`plugins/architect/README.md:114` — none (E-86); hand-off templates lines 20-23 — E-76, E-77, E-86.

## 4. Archive-task identification candidates

### Evidence

- **E-87** `plugins/architect/skills/planning/SKILL.md:20-31`; `src/lint/rules/task-004.ts:7` › `KEYS` — task file frontmatter: a task file carries `id`, `title`, `milestone`, `status`, `depends_on`, `implements`, `satisfies_ac`, `verified_by`, `components`, `risk_refs`, `estimate`, `report`; `LINT-TASK-004` requires exactly those 12 keys to be present and reports no extra key (it checks `KEYS` for presence only, lines 32-35). The CLI reads `id`, `status`, `report`, `depends_on` (`src/tracking/task.ts:48-72`) and `id`, `status`, `report.completed_at` (`src/workspace/status.ts:64-73`); other keys are ignored. The archived archive tasks also carry `change`, `phase`, `artifact` (`T-075-archive-chg001.md:4-6`). No `kind` or similar key exists.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-88** `plugins/architect/templates/lite/20-plan/plan.md:14-23`; `src/lint/rules/task-004.ts:10,49-61`; `src/lint/spec.ts:315-323` › `tasks()` — lite task section: a lite task is `### <T-ID> — <name>` followed by `- **Name:** value` bullets: Status, Depends on, Implements, Satisfies AC, Verified by, Estimate, Targets, Verification, Done when. `LITE_FIELDS` requires the first six; the field reader accepts any bullet name (`n.fields.find(...)`), and `src/tracking/task.ts:86-100` adds a missing field to a section. A lite task has no `title` field: its title is the heading text. The `handoff.md` ordered list of a lite change is checked by LINT-HAND-002 too (`hand-002.ts:24-28`, `tasks(c)` includes lite sections).
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-89** `.sdd/_archive/001-architect-agent-suite/20-plan/50-tasks/T-075-archive-chg001.md:1-17` › `C001-T-075` — frontmatter: `id: C001-T-075`, `title: "Archive CHG-001 into living specs"`, `milestone: C001-M-7`, `status: done`, `depends_on: [C001-T-073, C001-T-074, C001-T-053]` (not every other task), `implements: []`, `estimate: S`, `report.notes` "Set before sdd archive 001: … Self-blocking precondition recorded for CHG-005". The file name carries `archive`; the body says `sdd archive 001 --dry-run`, then `sdd archive 001` (lines 29, 38-39). Its status was set to `done` before the archive (commit `dfa2af9`, E-40); the archive commit `393bcd8` changed this file by 4 lines and `change.md` by 1.
  - layer: grep (Read) + `git show --stat` · confidence: high
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-90** `.sdd/_archive/001-architect-agent-suite/20-plan/handoff.md:150`; `.sdd/_archive/002-multi-platform-targets/20-plan/handoff.md:983-984` › `Ordered task list` — CHG-001: the last row (67) is `C001-T-075`, the archive task. CHG-002 had no archive task: no task title in `.sdd/_archive/002-multi-platform-targets/20-plan/50-tasks/` matches `archiv` (grep, case-insensitive, on `title:`); its last two rows are `C002-T-075` "P-01: publish architect-sdd …" and `C002-T-055` "P-01: release the Copilot target"; CHG-002 was archived by commit `215e36d` ("sdd archive 002") with every task file unchanged in that commit.
  - layer: grep (Read) + `git show --stat` · confidence: high
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-91** `.sdd/_archive/001-architect-agent-suite/20-plan/50-tasks/T-053-archive-engine.md:3`; `T-075-archive-chg001.md:3`; `T-080-nfr-catch-up.md:3`; `T-081-archive-resume.md:3` › `title:` — in CHG-001, four task titles match the case-insensitive word `archive` ("Archive engine and /architect:archive", "Archive CHG-001 into living specs", "NFR catch-up (D-014): … archive faults, …", "Archive resumes after an interrupted run without duplicates (D-015)"); only one of the four is the archive task. In CHG-002, none matches (E-90).
  - layer: grep · confidence: high
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; counts are for the tasks that carry the word in `title:` (not file names)
- **E-92** `src/cli/commands.ts:462-473`, `:532`; `src/archive/plan.ts:94`, `:193`, `:203` › `archiveCmd()`, `planArchive()`, `archiveBlockers()` — `sdd archive` takes `<NNN>` and `--dry-run` only (usage `<NNN> [--dry-run]`); `archiveCmd` reads one environment variable (`SDD_TEST_TODAY`, tests only); `planArchive(root, changeDir, today)` and `archiveBlockers(changeDir)` receive no task, no option and no session information, so the CLI cannot know which task is running unless the files, the command line or the environment say so. A new option would add to the command row (line 532), the usage text, `plugins/architect/commands/archive.md:10-17` and the CLI interface row of the archived `sdd-cli.md:46`.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-93** `src/archive/plan.ts:97-106`, `:376-381`; `src/archive/apply.ts:17-27`; `src/cli/commands.ts:218,244,260` › `archiveCmd()` — task state after the archive: `sdd archive` writes `status: archived` into `change.md` and leaves every task file as it was; afterwards the folder is under `_archive/`, where the resolver does not look (E-48), so `sdd task set` for a task of that change fails with ERR-CLI-002 (same cause as the E-46 runs of `sdd hash`). An archive task can therefore reach `done` only before the archive runs, or be left at its last status. With G-5 (writing commands keep refusing an archived change) this stays the case. `.sdd/registry.json:35-37` and `:476-478` show CHG-001 66/66 and CHG-002 82/82 tasks done.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-94** `src/archive/plan.ts:94-108`; `src/tracking/task.ts:59-69` › `archiveBlockers()` — lite tasks: `archiveBlockers` reads `20-plan/50-tasks/*.md` frontmatter only; a lite change's tasks come from `buildChangeGraph(...)` nodes of `20-plan/plan.md` with `form === "heading"` and their `Status` field, as `findTask` and `taskStates` do (E-42). A rule that identifies an archive task must therefore be expressible in both forms: a frontmatter key (full) and a bullet field or the heading text (lite).
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127

Candidate rules, with the evidence each one rests on (decision for P-01, see the `questions` block of the return message):

| Candidate | What identifies the archive task | Contract change | Evidence on misfire |
|---|---|---|---|
| A. marker in the task | frontmatter key (full) and bullet field (lite) naming it an archive task | task frontmatter and lite fields gain one optional key; template, planning skill | extra keys are tolerated today (E-87, E-88); a missing marker falls back to today's self-block |
| B. explicit option | `sdd archive <NNN> --task <T-ID>` names the running task | command row, usage, `archive.md`, interface row (E-92) | task files unchanged; a wrong or forgotten option falls back to today's self-block |
| C. title match | the word `archive` in the title | none | four CHG-001 titles match, one is the archive task; none matches in CHG-002 (E-91, E-90) |
| D. last in the hand-off list | last row of the ordered task list | none | CHG-001 correct; CHG-002 last row is a release task and there was no archive task (E-90) |
| E. the single task in progress | the one task whose status is `in-progress` when `sdd archive` runs | none | any implementer task in progress would pass; the rule says nothing about which task it is (E-93) |

## 5. Topic 5 — lite approval hash

Citations of C005-REQ-121 (MODIFIED C001-REQ-806), from `90-critic-report.md` CR-10 and the brief of this round. Each location was read at commit `fef82eb`. Result: the hash, normalisation, stale and task-report locations hold; the three `src/archive/plan.ts` lines and the `src/cli/commands.ts` range of the brief do not concern the hash (E-102, E-103) and are replaced by the entries below.

### Evidence

- **E-95** `src/gate/hash.ts:33-44` › `fileHash()`, `phaseHash()` — holds. `fileHash` is `sha256(normalizeForHash(readFileSync(abs, "utf8")))` (lines 33-35). `phaseHash` lists the phase files with `phaseFiles` (all files under the phase folder, minus `GENERATED` = `80-traceability.md`, `85-open-items.md` at the phase root, line 12), hashes each with `fileHash`, and returns the single file's hash as `sha256:<hex>` when the phase has one file (line 42), else the hash of `path\thash\n` lines (line 43). A lite phase folder `20-plan` holds `plan.md` and `handoff.md`, so its hash is the multi-file form. The only per-file transformation is `normalizeForHash`; there is no per-section or per-file-name rule, so a report-field exclusion for `20-plan/plan.md` needs a new step in `fileHash` or `normalizeForHash`.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; serena loaded but not asked (line checks need file text)
- **E-96** `src/gate/hash.ts:54-59` › `ApprovalRecord` — holds, with a different content than the brief implied: lines 54-59 are the interface `ApprovalRecord { hash, approved_at, files, ids }`. The per-ID hashes are in `idHashes()` at `:46-52` (first definition wins; `n.contentHash` from `buildChangeGraph`, `:50`) and `recordApproval()` at `:67-74` writes both the phase hash and `ids` to `approvals.json`. So a lite task ID's recorded content hash (C001-REQ-814) also covers its report-field lines; C005-REQ-121 leaves this outside (its Open items field).
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-97** `src/model/frontmatter.ts:48-53` › `normalizeForHash()` — holds. LF line endings via `toLines`, the frontmatter removed when the text starts with a `---` line and a closing one exists (`frontmatterEnd`, lines 50-51), trailing spaces and tabs stripped from every line (line 52). The doc comment at `:44-47` cites C001-IF-13 §2 step 2. No lite-plan branch exists. The function receives only the text, not the path, so a rule for `20-plan/plan.md` of a lite change must be added by the caller (`fileHash`, E-95) or by a new parameter.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-98** `src/gate/stale.ts:21-48`, `:35-36` › `staleCheck()` — holds. For each approved phase with an `approved_hash`, line 33 recomputes `phaseHash(changeDir, phase).hash`; line 35 compares it with the approved hash and line 36 sets `check.stale = "hash changed"`, then `staleFrom = true` makes every later approved phase `earlier phase stale` (line 34). With `write` the stale phases are set `stale` in `change.md` (lines 42-45). `gate.ts:88` applies the same comparison (`phaseHash(...).hash !== approvedHash`) when a gate is shown.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-99** `src/tracking/task.ts:117-122`, `:86-100` › `setTask()`, `setLiteField()` — holds. For a lite task (`task.lite`), `setTask` rewrites the section's `- **Status:**` (line 119), `- **Commit:**` when the commit is not null (120), `- **Notes:**` when the notes are not null (121) and `- **Completed at:**` (122, `—` when null) in `20-plan/plan.md`. `setLiteField` (87-100) replaces the first line starting `- **<name>:**` in the section, or inserts a new bullet after the last `- **` bullet of the section. A full-form task goes through `setTopLevel` on frontmatter (lines 124-125), which the hash removes. The report-field lines of a lite section are therefore exactly the four bullets `Status`, `Commit`, `Notes`, `Completed at`. `findTask` (`:59-69`) reads the same four fields from the graph node of `20-plan/plan.md`.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-100** `src/archive/plan.ts:94-98` › `archiveBlockers()` — the location that makes the stale plan matter (not in the brief's list): `plan` is read from `change.md` `phases.20-plan.status` (line 97) and any value other than `approved` pushes `G3 not approved (20-plan <status>)` (line 98). So a `stale` plan blocks `sdd archive` (C001-REQ-913), as CR-10 states.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-101** `tests/integration/cap08/TS-806.test.ts:1-45`; `tests/integration/cap08/TS-807.test.ts:15-21`; `tests/unit/model/frontmatter.test.ts:34-38`; `tests/integration/cap08/gate-fixture.ts:5,28` › `C001-TC-806`, `C001-TC-807` — the tests that pin the hash: C001-TS-806 (`TS-806.test.ts`) pins the single-file hash of `fx-bootstrap-g1` `00-ideation` to the golden value `sha256:c9c7849f…7401` (line 20), reproduces every `approved_hash` of CHG-001 G1, G2 and G3 through `sdd hash` (lines 23-37) and the per-ID hashes of `approvals.json` (39-45). C001-TS-807 (`TS-807.test.ts`) checks invariance of a 10-spec hash under CRLF, trailing spaces, a frontmatter `status` change and `80-traceability.md` regeneration, and a change under a requirement statement (rows 16-20). `frontmatter.test.ts:34-37` pins `normalizeForHash` output. Other cap08 tests use `phaseHash` only as the expected value (`TS-805.test.ts`, `TS-816.test.ts`, `gate-fixture.ts`). No test hashes a lite `plan.md` or runs `sdd stale check` after `sdd task set` on a lite task; the golden values cover full-form changes only, so a change that leaves frontmatter-and-body output of non-lite files unchanged keeps them valid. CHG-001 `20-plan` is full-form, so a rule limited to the `plan.md` of a lite change leaves C001-TS-806 and C001-TS-807 results unchanged.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127; test list from a grep of `src` and `tests` for `phaseHash|normalizeForHash|TS-80x` limited to 60 lines, no other hash test seen
- **E-102** `src/archive/plan.ts:121`, `:295`, `:360` › `planArchive()` — correction, the brief's three lines do not hold for the hash: `:121` is the lite branch of the requirement-and-acceptance source list (`{ req: lite, acc: lite, slug }`, `10-spec/spec.md`); `:295` is the MODIFIED replacement of a living entry (`replaceRange(t, e.start, e.end, r.entry)` with a History row `superseded by <ID>`), and `:360` is the path of `10-spec/40-domain/glossary-delta.md`. None computes or checks a hash. `:295` is still the line that will apply the MODIFIED delta of C005-REQ-121 to C001-REQ-806 at archive; the stale gate of the archive is E-100.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-103** `src/cli/commands.ts:340-343` › `resolveChange()` — correction, does not hold for the hash: lines 340-343 are the tail of `resolveChange` (the change folder containing the current directory, the only change of the workspace, else the usage error "several changes exist; pass --change <NNN>"). The command that prints a phase hash is `sdd hash` at `src/cli/commands.ts:262` (`const r = phaseHash(dir, phase);`), imported at line 36.
  - layer: grep (Read) · confidence: medium
  - commit: fef82eb · pattern: none
  - disclosures: ripwire failed: exit 127
