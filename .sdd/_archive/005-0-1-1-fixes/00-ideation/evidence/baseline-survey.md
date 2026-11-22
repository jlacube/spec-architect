---
id: "C005-IDEA-BASELINE"
artifact: ideation/baseline-survey
change: "CHG-005"
phase: 00-ideation
status: draft
---
# CHG-005 — Baseline survey

Scope: the five 0.1.1 items of `questions-log.md` (rounds 1–2). Commit surveyed: `215e36d`. Layers:
ripwire absent (`ripwire --version` exit 127, command not found) so every entry carries
`ripwire failed: exit 127`; Serena answered for TypeScript symbols (definitions, referencing symbols);
grep/Read answered for Markdown, JSON and `.mjs` text, which carry the plugin behaviour (layer 4, read to
confirm). No fix is proposed; each section ends with feasibility facts only.

## Baseline

- **Languages and size** (tracked files, `git ls-files`): TypeScript CLI and MCP server in `src/` (126 files);
  tests in `tests/` (1,425 files, `*.test.ts`); evals in `evals/` (1,239 files, mostly stored transcripts);
  the plugin in `plugins/architect/` (279 files: Markdown agents, skills, commands, templates; JSON target
  mappings; the bundled CLI `scripts/sdd.mjs`); build and check scripts in `scripts/` (`.mjs`). E-1, E-2.
- **Build and check:** `npm run build` bundles `src/cli.ts` into the tracked `plugins/architect/scripts/sdd.mjs`
  (so every `src/` fix needs a rebuild and the rebuilt bundle committed); `npm test` = build + `node --test`
  over `tests/**/*.test.ts`; `npm run check` runs the steps typecheck, validate (`claude plugin validate`),
  build, tests, fixtures, encoding, structure, targets, tarball, coverage; `npm run generate` and
  `npm run package` write the OpenCode and Copilot packages and the `architect-sdd` tarball into `dist/`
  (not tracked). The version has one source, `plugins/architect/.claude-plugin/plugin.json` (0.1.0). E-3, E-4, E-5.
- **Test layout:** `tests/unit`, `tests/integration/cap01 … cap11` (one folder per capability, `TS-nnn.test.ts`
  per scenario), `tests/guards`, `tests/lint-fixtures`, `tests/manual` (checklists), `tests/replay` (only under
  `npm run replay`). Evals (paid, not run here): `evals/cap01`, `evals/cap02`, `evals/targets/question-tool`,
  `evals/toy`, and routing evals under `plugins/architect/evals/`. E-5, E-6.
- **Hotspots** (ripwire `--hotspots` unavailable; commits touching the file, `git log`): `src/cli/commands.ts` 25,
  `plugins/architect/agents/sdd-conductor.md` 5, `plugins/architect/skills/interview-protocol/SKILL.md` 5,
  `src/archive/plan.ts` 2. E-7.

## Cross-cutting blast radius (applies to items 1–3)

- Shared plugin text under `plugins/architect/` feeds three hosts: Claude Code reads it as is; the OpenCode and
  Copilot packages are generated from it by `npm run generate` (`plugins/architect/targets/{opencode,copilot}.json`
  plus per-host `wiring/*.md` that replace only anchored lines or the "Claude Code wiring" section). A text fix
  reaches the generated targets with no mapping change unless it adds a host-specific construct. E-8.
- Tests pin line numbers of the shared text, so an inserted line above an anchor breaks them (update the numbers):
  `agents/sdd-conductor.md` lines 19, 46, 61, 66 (and 60); `commands/new.md` line 8; interview-protocol
  SKILL section "Claude Code wiring" at line 126; gate-protocol SKILL section at line 99; the hand-off templates
  lines 20–23. E-9.
- A `src/` fix (items 4, 5) needs `npm run build`; the bundle `plugins/architect/scripts/sdd.mjs` is tracked and the
  Copilot and OpenCode packages copy it (`cli_copy` in `copilot.json`). E-4, E-8.
- Releasing 0.1.1 moves the version in `plugin.json` (single source) and regenerates both packages and the tarball.
  E-5.

## Item 1 — D-032 (C001-REQ-116): plain-words request skips the profile round

**Symptom: confirmed by static evidence, reproduction needs a paid session.** The only text that runs the
new-change procedure is the command `commands/new.md`; the conductor agent text and every skill have no
create-change step, so a plain request reaches `sdd change new` through the model's own choice, and the CLI then
applies `--profile full --kind greenfield` when no flag is given.

- **Location of the procedure:** `plugins/architect/commands/new.md:6-21`: step 2 reads the constitution's profile
  thresholds, step 3 asks one interview round with the proposed profile first, step 4 runs
  `sdd change new "<title>" --profile … --kind …` only after the answer. It is a command file: it runs only when
  `/architect:new` (Copilot `prompts/new.prompt.md`, OpenCode `architect-new.md`) is invoked. E-10.
- **Absent in the conductor and skills:** `agents/sdd-conductor.md:21-42` (operating loop) and `58-76` (hard rules)
  contain no change-creation step; a grep of `plugins/architect` for `change new`, `new change` finds only
  `commands/new.md:19`, README text and `skills/phase-ideation/SKILL.md:24` (which assumes the folder exists).
  E-11, E-12.
- **CLI defaults:** `changeNew` sets `profile = "full"` and `kind = "greenfield"` when the options are absent
  (`src/cli/commands.ts:369-370`); `--profile` and `--kind` are optional in the command table (line 514). The only
  caller of `createChange` is `changeNew`. E-13, E-14.
- **Requirement identity:** the defect cites C001-REQ-116, but `_living/` marks it superseded by C002-REQ-213
  (history row `CAP-workspace.md:615`); C002-REQ-213 is now the live statement and binds "when the new-change
  command runs". The plain-words path is outside both statements. E-15.
- **Observed run:** C002-T-050 (VS Code 1.145.2, 2026-11-12) recorded in the defect text and in
  `CAP-copilot-target.md:513-516`. E-16, E-17.
- **Callers / reach:** `/architect:new` (all three hosts), the conductor's plain-words handling (none today).
- **Tests and evals reaching it:** eval `evals/cap01/TS-122.eval.mjs` (profile suggestion; checks no change folder
  before the answer); `evals/targets/question-tool/TS-219.eval.mjs:17-18` (Claude Code and OpenCode, via the
  command); `tests/integration/cap02/TS-219.test.ts:12,21` (conductor `tools` frontmatter);
  `tests/integration/cap01/constructs.test.ts:159-161` (new.md line 8) and `:277-279` (conductor lines 61, 66);
  `tests/integration/cap01/wiring.test.ts:203` (conductor line 19); routing eval
  `plugins/architect/evals/route-conductor-03/prompt.md:12` is a plain-words "drive a new change" prompt that only
  checks routing to the conductor. No test exercises a plain-words create-change request. E-18.
- **Feasibility:** text-only on the chosen option (Q-newchange-01: always run the new procedure); feasible without
  CLI change. Facts for the plan: the procedure text lives in a command file, which the conductor cannot load as a
  skill; moving or repeating it touches `new.md`, the conductor or a skill, and the generated prompt files; the
  pinned line numbers in E-9 move with it. Confidence that an evaluation can show the fix needs a paid eval (none
  run here).

## Item 2 — D-034 (C001-REQ-210): answer between a gate approval and the next phase start is logged nowhere

**Symptom: confirmed by the text and by the hash code.** Decision recorded: next phase's `questions-log.md`,
created on first use (Q-postgate-01).

- **Rule that picks the log:** `skills/interview-protocol/SKILL.md:69-72` (§5): "Append the round to the phase's
  `questions-log.md` (`00-ideation/`, `10-spec/` or `20-plan/`; create it on first use) immediately after P-01
  answers". "The phase" is undefined when no phase is open: no phase is `draft` between a G1/G2 approval and the
  next phase's start. E-19.
- **Nothing else decides it:** the gate-protocol skill (`SKILL.md:54-90`, §4 Record and §5) covers decisions and
  the gate `--note` but not interview answers after approval; conductor step 5 (`agents/sdd-conductor.md:38-40`)
  says only "log every round"; the phase skills do not mention logging. E-20, E-21.
- **Why the conductor will not log into the approved phase:** `phaseFiles` includes every file under the phase
  folder except two generated ones (`src/gate/hash.ts:19-31`), so appending to an approved phase's
  `questions-log.md` changes its hash and marks the phase stale (and the rule "never edit an approved phase").
  Writing to the next phase's folder before its start is outside the approved phase's hash. E-22.
- **Observed:** run 4 logged nothing, run 3 created `10-spec/questions-log.md` (defect text; `CAP-copilot-target.md:
  452-461`). E-23.
- **Requirement text:** C001-REQ-210, "append to the phase's `questions-log.md` … verbatim"
  (`CAP-conductor.md:274-281`). E-24.
- **Template gap:** only `templates/{full,lite}/00-ideation/questions-log.md` exist; the lite scaffold lists only
  the ideation log (`src/workspace/templates.ts:16-24`). A `10-spec/` or `20-plan/` log has no template and, for a
  lite change, is not in the scaffold file set. Whether lint and the trace accept such a file in a lite change was
  not run (writing is outside this role). E-25.
- **Callers / reach:** the conductor on all hosts. The Copilot and OpenCode variants replace only the "Claude Code
  wiring" section of the interview and gate skills (`copilot.json:230-243`), so a fix in §5 flows to both without
  mapping changes. E-8.
- **Tests and evals reaching it:** eval `evals/cap02/TS-211.eval.mjs:1-4` with helpers `evals/cap02/interview.mjs`
  (round logged verbatim; only inside an open phase); manual VS Code scenario C002-TS-317
  (`CAP-copilot-target.md:420-432`, explicitly excludes the post-approval window); `evals/targets/question-tool/
  TS-316.eval.mjs` (matches "questions log", not read in full). Pinned lines: interview-protocol line 126 and
  gate-protocol line 99 sit after §5, so an edit that adds lines in §5 shifts them (E-9). E-26.
- **Feasibility:** text-only; one paragraph in interview-protocol §5 (and possibly the conductor) reaches all hosts.
  Open facts for the plan: how a "given before the phase started" answer is marked in the log, and the frontmatter
  of a first-use log (no template). No CLI change is needed by this decision.

## Item 3 — D-035 (C001-REQ-617): hand-off defines `sdd` through the plugin root

**Symptom: confirmed.** The hand-off template tells the implementer to run `node <plugin-root>/scripts/sdd.mjs …`;
nothing in the plugin text tells the planner to replace `<plugin-root>`.

- **Templates:** `templates/full/20-plan/handoff.md:17-24` and `templates/lite/20-plan/handoff.md:20-23` (Reporting
  protocol, four commands: `task set` in-progress, done, blocked; `defect add`), then the frontmatter fallback
  (full template lines 26-27). E-27.
- **Planner text:** `skills/planning/SKILL.md:82-84` names the commands as bare `sdd …` and the fallback; no text
  resolves `<plugin-root>` (grep of agents, skills, commands: `<plugin-root>` appears only in `README.md:114`).
  The archived hand-offs of this repository carry a concrete `plugins/architect/scripts/sdd.mjs` path chosen by the
  planner (`.sdd/_archive/001-…/20-plan/handoff.md:53-55`). E-28, E-29.
- **Npm variant (C002-REQ-518):** at packaging, `scripts/template-cli-lines.mjs:12-17` rewrites each
  `node <plugin-root>/scripts/sdd.mjs` / `node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs` to bare `sdd` in the shipped
  templates; leftovers fail with ERR-BLD-002. The generated Copilot and OpenCode targets read templates through
  `sdd template show` (`copilot.json:90`), so they get the bare `sdd` lines and need `sdd` on PATH. The Claude Code
  plugin keeps the source template unchanged (C002-GOAL-05, C002-REQ-518 rationale). E-30, E-31.
- **The npm `sdd` package:** name `architect-sdd` (unscoped), version from `plugin.json` (0.1.0), `bin` =
  `{ sdd: "scripts/sdd.mjs", "sdd-mcp": "scripts/sdd-mcp.mjs" }`, `engines.node >=20`
  (`scripts/npm-manifest.mjs:6-19`). Its build exists in the repository as code (`scripts/build.mjs`,
  `scripts/package.mjs`, `npm run package`), not as a tracked artifact (`git ls-files dist` lists 0 files). The
  release evidence of 2026-11 records "Nothing was published" at candidate `b6f1509`
  (`docs/release-0.1.0-evidence.md:1401`); the 0.1.0 GitHub release notes already tell implementers to
  "install `architect-sdd` from npm and run `sdd task set` directly"
  (`docs/releases/github-release-notes-0.1.0.md:42`). Whether 0.1.0 is on the registry now was not checked (no
  network call made). E-32, E-33.
- **What an implementer could run instead today:** (a) install `architect-sdd` from npm and run bare `sdd task set`
  (the shipped workaround); (b) the frontmatter fallback in the template (edit `status` and `report` of the task file;
  lite plans edit the task section fields). The recorded dogfood case (Superpowers 7.0.2, plugin disabled) left three
  tasks `todo`. E-34.
- **Requirement identity:** the defect cites C001-REQ-617 (ordered task list); the reporting protocol is C001-REQ-616
  ("Reporting protocol (CLI commands and the frontmatter fallback)"). The fix text belongs under C001-REQ-616. E-35.
- **Callers / reach:** `handoff.md` of every change (full and lite) on Claude Code; implementers on any host.
- **Tests reaching it:** `tests/integration/npm-build/npm-staging.test.ts:119-141` pins source lines 20, 21, 22, 23
  of both templates to the exact `node <plugin-root>/scripts/sdd.mjs …` text and the staged lines to `sdd …`
  (C002-TS-529); `tarball-check.test.ts:110`, `npm-staging.test.ts:270`, `tests/integration/cli/template.test.ts:156`;
  lint fixtures `tests/lint-fixtures/LINT-HAND-001|002` (hand-off structure); manual `tests/manual/TS-621.md`
  (Superpowers portability). E-36.
- **Feasibility:** change is small in text but not mechanical. The Claude Code template needs a form an implementer
  without the plugin can run; the npm rewrite (`INVOCATION` regex) and the pinned test lines depend on the exact
  `node <plugin-root>/scripts/sdd.mjs` shape, so any change to that shape touches the rewrite, E-36 tests and
  C002-REQ-518/519 wording. The decision about what the Claude Code line should say (npm install, bare `sdd`, both)
  is P-01's or the spec's, not recorded in the questions log (see question Q-handoff-01).

## Item 4 — Archive precondition is self-blocking

**Symptom: confirmed.** `sdd archive <NNN>` refuses unless every task file is `done` or `dropped`, including the
archive task itself; the task can be marked done only before the archive that it performs.

- **Code:** `archiveBlockers(changeDir)` in `src/archive/plan.ts:94-108`: G3 approved (97-98), every
  `20-plan/50-tasks/*.md` has status done or dropped (99-105), no open defect (106). Called by `planArchive` at line
  203; `planArchive` throws ERR-CLI-009 listing the blockers at line 344 (after the requirement checks add theirs).
  `archiveCmd` (`src/cli/commands.ts:462-473`) is the only caller of `planArchive`; `archiveBlockers` has one caller.
  E-37, E-38.
- **No marker for the archive task:** the task frontmatter holds `id`, `title`, `milestone`, `status`, `depends_on`,
  `implements`, `satisfies_ac`, `verified_by`, `components`, `risk_refs`, `estimate`, `report` (sdd-conventions);
  nothing in `archiveBlockers`, `src/tracking/task.ts` or the lint task rules identifies an archive task. E-39.
- **Recorded case:** C001-T-075 `report.notes` (frontmatter line 16): "Set before sdd archive 001: the archive
  precondition (C001-REQ-913) requires every task done, the archive task included … Self-blocking precondition
  recorded for CHG-005." Its report commit `dfa2af9` therefore predates the archive commit. E-40.
- **Requirement:** C001-REQ-913 (`CAP-tracking-archive.md:274-281`): refuse when G3 not approved, a task is not
  done or dropped, or a defect is open; scenario C001-TS-914. E-41.
- **Adjacent finding (scope question Q-scope-03):** `archiveBlockers` reads only `50-tasks/`. A lite change keeps its
  tasks as sections of `20-plan/plan.md` (`skills/planning/SKILL.md:87-92`), which `task set` (`src/tracking/task.ts:
  48-72`) and the status block (`src/workspace/status.ts:61-76`) do read. For a lite change such as CHG-005 the task
  precondition therefore never blocks and the self-blocking symptom cannot occur; it also means open lite tasks do
  not block an archive. No test archives a lite change (cap09 mentions `lite` only in `TS-906.test.ts`, a task-set test).
  E-42, E-43.
- **Command text:** `commands/archive.md:10-12` tells the conductor to stop on ERR-CLI-009 ("tasks not done or
  dropped"). E-44.
- **Tests reaching it:** `tests/integration/cap09/TS-914.test.ts:8-47` (three tests: task + defect open lists both;
  G3 not approved; cited requirement missing), fixture `tests/integration/cap09/archive-fixture.ts:81-89` (builds the
  task statuses and defects), `TS-921.test.ts` (final move), `TC-1131-archive-resume.test.ts` (interrupted archive,
  resume re-checks the preconditions, line 220 ERR-CLI-009 on duplicates). All run in `npm test` and `npm run check`.
  E-45.
- **Feasibility:** CLI-only, small, localised in one function with tests in one folder. Design facts for the plan,
  not a proposal: any exemption needs a way to tell the archive task from the others (none exists, E-39), and the
  C001-REQ-913 statement and its scenario change with it; `commands/archive.md` and the `sdd archive` row of the
  CLI interface (archived `sdd-cli.md:46`) name the preconditions. Requires `npm run build` (E-4).

## Item 5 — `sdd hash` fails on an archived change

**Symptom: reproduced read-only, confirmed.** Bundled CLI of this repository (`plugins/architect/scripts/sdd.mjs`
at `215e36d`):

| Command | Exit | Output (stderr) |
|---|---|---|
| `sdd hash 001 10-spec` (CHG-001, in `.sdd/_archive/`) | 2 | `ERR-CLI-002: Change `001` not found. Fix: Check `sdd status`` |
| `sdd hash 002 10-spec` (CHG-002, archived) | 2 | `ERR-CLI-002: Change `002` not found. Fix: Check `sdd status`` |
| `sdd gate show 001 10-spec` | 2 | same message |
| `sdd hash 005 00-ideation` (active control) | 0 | `sha256:3aba29964828558b1af82c600d0c7ae8fa5bc50700f7454cc8c0ec889b2e3740` |

E-46.

- **Lookup code:** `hashCmd` (`src/cli/commands.ts:259-266`) calls `resolveChange` (`332-344`), which matches
  `changeFolders(ctx.root)` (`104-109`): only `.sdd/NNN-*` directories, never `.sdd/_archive/`. No match gives
  ERR-CLI-002 (`src/cli/errors.ts:17`). The hash itself works on an archived folder: `phaseHash`
  (`src/gate/hash.ts:38-44`) takes any change directory, and the archived folders keep their phase files and
  `approvals.json` (`.sdd/_archive/001-…/10-spec/` exists). E-47, E-48, E-49.
- **Contrast:** `listChanges` (`src/workspace/status.ts:128-`) and the lint engine's `changeFolders`
  (`src/lint/engine.ts:46-56`) do search `_archive/`; so does number allocation (`src/workspace/change.ts:25-30`).
  Only the command resolver does not. E-50.
- **Reach, same cause:** callers of `resolveChange` (Serena): `gateContext` (gate show, approve, record),
  `changeStop`, `taskSet` (no-ID form), `defectClose`, `defectReopen`, `hashCmd`, `staleCmd`, `traceCmd`,
  `changeProfile`, `idNext`, `idTombstone`, `archiveCmd`; `changeOfId` (`204-208`, used by `taskSet` with a full ID and
  `defectAdd`) has its own copy of the lookup. All fail on an archived change with ERR-CLI-002. Consequently the
  ERR-CLI-014 branch for `archived` in `planArchive` (`src/archive/plan.ts:197-201`) is reachable only for the
  interrupted-archive case (folder not yet moved). E-51.
- **Specification:** C001-REQ-806 and the archived interface row `sdd-cli.md:41` (`hash <NNN> <phase>`: "Print the
  phase hash") do not exclude archived changes. E-52.
- **Tests reaching it:** `tests/integration/cap08/TS-806.test.ts:23-37` hashes CHG-001 and carries the workaround
  ("`sdd hash` reads active changes only; after `sdd archive 001` the change is copied into a scratch workspace",
  lines 25-28); ERR-CLI-002 is asserted at `tests/integration/cli/frontend.test.ts:113` and
  `tests/unit/workspace/ledger.test.ts:86,97` (`id next` and `id tombstone` on a missing change). A resolver change
  must keep those three tests green. E-53.
- **Feasibility:** CLI-only, small (resolver or a read-only variant), `npm run build` needed. Which of the commands
  above should accept an archived change is a scope decision (question Q-scope-02): the writing ones (`task set`,
  `defect close`, `stale`, `trace --write`, `gate approve`) would modify a closed change.

## Evidence

- **E-1** `package.json:11-23` › `scripts` — npm scripts: build, typecheck, test, check, replay, bench, eval, package, smoke:npm, generate.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-2** `tsconfig.json:20` › - — TypeScript sources (include list `src/**`, `tests/**`, `scripts/generate/**`): 126 tracked files in `src/`, 1,425 in `tests/`, 279 in `plugins/`, 1,239 in `evals/`.
  - layer: grep (`git ls-files | wc -l`) · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; counts are tracked files, not lines
- **E-3** `scripts/check.mjs:25-51` › `STEPS` — `npm run check` steps: typecheck, validate, build, tests, fixtures, encoding, structure, targets, tarball, coverage (coverage at line 49).
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-4** `scripts/build.mjs:20-24` › `ENTRIES` — (header lines 1-2) bundles `src/cli.ts` into the tracked `plugins/architect/scripts/sdd.mjs` and `src/mcp/server.ts` into `build/npm/sdd-mcp.mjs`.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-5** `scripts/build.mjs:14-15` › - — `plugin.json` is the single version source; `plugins/architect/.claude-plugin/plugin.json` holds `"version": "0.1.0"`.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-6** `scripts/test.mjs:22-30` › `findTests` — (header lines 1-2) tests are `tests/**/*.test.ts` transpiled with esbuild and run by `node --test`; `fixtures` folders and `tests/replay` are excluded.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-7** `src/cli/commands.ts:1` › - — commit counts per file (`git log --oneline -- <file> | wc -l`): commands.ts 25, sdd-conductor.md 5, interview-protocol SKILL 5, src/archive/plan.ts 2.
  - layer: grep (`git log`) · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; churn proxy only, no complexity
- **E-8** `plugins/architect/targets/copilot.json:107-115` › `variants` — (also lines 87, 230-243) host variants replace the anchored CLI line of the conductor and only the "Claude Code wiring" section of interview and gate skills; `cli_copy` ships `scripts/sdd.mjs` (line 20); template reads become `sdd template show` (line 90); `opencode.json` mirrors these.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-9** `tests/integration/cap01/constructs.test.ts:159-164`; `tests/integration/cap01/constructs.test.ts:277-279`; `tests/integration/cap01/wiring.test.ts:159`; `tests/integration/cap01/wiring.test.ts:203`; `tests/integration/cap01/wiring.test.ts:275` › - — tests pin line numbers: new.md line 8; conductor lines 46, 60, 61, 66, 19; interview-protocol section at line 126; gate-protocol section at line 99.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-10** `plugins/architect/commands/new.md:6-21` › - — new-change procedure: profile thresholds, one profile round, `sdd change new` only after the answer; runs only via the command.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-11** `plugins/architect/agents/sdd-conductor.md:21-42` › `Operating loop` — no create-change step; hard rules 58-76 have none either.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim from a grep of `plugins/architect` for `change new|new change|/architect:new`
- **E-12** `plugins/architect/skills/phase-ideation/SKILL.md:24` › `Step 1 — Check entry` — "The change folder exists (`sdd change new`)": assumes creation happened elsewhere.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-13** `src/cli/commands.ts:368` › `changeNew()` — defaults `profile = "full"` (line 369), `kind = "greenfield"` (line 370); calls `createChange` (line 371).
  - layer: serena · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines are 0-based, 1 added
- **E-14** `src/cli/commands.ts:514` › `ROWS` — `change new` usage `"<title>" [--profile lite|full] [--kind …]`: both options optional; `changeNew` is referenced only here, and `createChange` only from `changeNew`.
  - layer: serena · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-15** `.sdd/_living/CAP-workspace.md:375-383` › `C002-REQ-213` (history row at line 615) — live statement "WHEN the new-change command runs (`/architect:new` on Claude Code)"; history row marks C001-REQ-116 superseded by C002-REQ-213.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-16** `.sdd/registry.json:355-363` › `D-032` — defect text: plain request "Start a new change titled Toy change" ran `sdd change new` with defaults (full, greenfield), no profile question; closed as known gap of 0.1.0, carried to CHG-005.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-17** `.sdd/_living/CAP-copilot-target.md:513-516` › `C002-REQ-311` note — a plain request that runs `sdd change new` with CLI defaults breaks no requirement of CHG-002; CHG-001 defect D-032.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-18** `evals/cap01/TS-122.eval.mjs:1-4`; `evals/targets/question-tool/TS-219.eval.mjs:17-18`; `tests/integration/cap02/TS-219.test.ts:12,21`; `plugins/architect/evals/route-conductor-03/prompt.md:12` › - — tests and evals near the profile round; none sends a plain-words create-change request.
  - layer: grep · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable, so reach is by grep of test folders
- **E-19** `plugins/architect/skills/interview-protocol/SKILL.md:69-72` › `5. Log every round` — "Append the round to the phase's `questions-log.md` (`00-ideation/`, `10-spec/` or `20-plan/`; create it on first use) immediately after P-01 answers".
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-20** `plugins/architect/skills/gate-protocol/SKILL.md:54-90` › `4. Record`, `5. Never approve on your own` — decisions and `--note` only; no rule for interview answers after approval.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-21** `plugins/architect/agents/sdd-conductor.md:38-40` › `Operating loop` step 5 — "log every round"; no rule for the window between phases.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-22** `src/gate/hash.ts:19-31` › `phaseFiles()` — hash inputs are every file under the phase folder except `80-traceability.md` and `85-open-items.md`, so `questions-log.md` of an approved phase is hashed.
  - layer: serena · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-23** `.sdd/registry.json:375-383` › `D-034`; `.sdd/_living/CAP-copilot-target.md:452-461` › - — run 4 logged the answer nowhere; run 3 created `10-spec/questions-log.md`.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-24** `.sdd/_living/CAP-conductor.md:274-281` › `C001-REQ-210` — "append to the phase's `questions-log.md` … P-01's answer verbatim".
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-25** `src/workspace/templates.ts:16-24` › `LITE_SCAFFOLD` — lite scaffold holds only `00-ideation/questions-log.md`; `plugins/architect/templates/{full,lite}/00-ideation/questions-log.md` are the only log templates.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-26** `evals/cap02/TS-211.eval.mjs:1-4`; `.sdd/_living/CAP-copilot-target.md:420-432` › `C002-TS-317` — eval and manual scenario that exercise the log inside an open phase; `evals/targets/question-tool/TS-316.eval.mjs` matches "questions log" and was not read in full.
  - layer: grep · confidence: low
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable
- **E-27** `plugins/architect/templates/full/20-plan/handoff.md:17-27`; `templates/lite/20-plan/handoff.md:20-23` › `Reporting protocol` — four `node <plugin-root>/scripts/sdd.mjs …` lines; frontmatter fallback.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-28** `plugins/architect/skills/planning/SKILL.md:82-84` › `Hand-off (handoff.md)` — Reporting protocol written as bare `sdd …` commands plus fallback; nothing resolves `<plugin-root>`.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim from a grep of agents, skills, commands for `plugin-root`
- **E-29** `.sdd/_archive/001-architect-agent-suite/20-plan/handoff.md:53-55` › - — the planner wrote a concrete `plugins/architect/scripts/sdd.mjs` path in this repository's own hand-off.
  - layer: grep · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-30** `scripts/template-cli-lines.mjs:12-17` › `translateCliLines` — rewrites `node <plugin-root>/scripts/sdd.mjs` and the `${CLAUDE_PLUGIN_ROOT}` form to `sdd` in shipped templates; `scanCliPaths` reports leftovers as ERR-BLD-002.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-31** `.sdd/_living/CAP-cli-distribution.md:123-139` › `C002-REQ-518`, `C002-REQ-519` (and C002-REQ-501 at lines 10-14) — npm `sdd` executable; rewrite of CLI lines in shipped templates; plugin keeps the source templates unchanged.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-32** `scripts/npm-manifest.mjs:6-19` › `npmManifest` — name `architect-sdd`, version from plugin.json, `bin` sdd and sdd-mcp, `files` list, node >=20; `git ls-files dist` lists 0 files (tarball is built, not tracked).
  - layer: grep (Read, `git ls-files`) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-33** `docs/release-0.1.0-evidence.md:1401`; `docs/releases/github-release-notes-0.1.0.md:42` › - — "Nothing was published" at candidate `b6f1509`; release notes give the workaround "install `architect-sdd` from npm and run `sdd task set` directly". Registry state not checked (no network call).
  - layer: grep (Read) · confidence: low
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; publication status unverified
- **E-34** `docs/dogfood.md:215-217` › `C001-T-074` finding — with the Architect plugin disabled, Superpowers could not run `sdd task set` and left three tasks `todo`.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-35** `.sdd/_living/CAP-planning.md:357-372` › `C001-REQ-616` — C001-REQ-616 defines the Reporting protocol section; C001-REQ-617 (same file, lines 375-382) defines only the Ordered task list.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-36** `tests/integration/npm-build/npm-staging.test.ts:119-141`; `tarball-check.test.ts:110`; `tests/integration/cli/template.test.ts:156`; `tests/lint-fixtures/LINT-HAND-001`, `LINT-HAND-002`; `tests/manual/TS-621.md` › - — tests that read the hand-off templates; the C002-TS-529 test pins source lines 20-23 to the plugin-root form.
  - layer: grep · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable
- **E-37** `src/archive/plan.ts:94` › `archiveBlockers()` — preconditions: G3 approved (97-98), every file of `20-plan/50-tasks/` done or dropped (99-105), no open defect (106); one caller (`planArchive`, line 203).
  - layer: serena · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-38** `src/archive/plan.ts:193` › `planArchive()` — throws ERR-CLI-009 with the blocker list at line 344; `src/cli/commands.ts:462` › `archiveCmd()` is its only caller; `src/cli/errors.ts:24` defines ERR-CLI-009.
  - layer: serena · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-39** `src/archive/plan.ts:94-108` › `archiveBlockers()` — no field or rule identifies an archive task; a grep of `src/` for archive-task markers finds none.
  - layer: grep · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; absence claim
- **E-40** `.sdd/_archive/001-architect-agent-suite/20-plan/50-tasks/T-075-archive-chg001.md:16` › `report` — notes: "Set before sdd archive 001: the archive precondition (C001-REQ-913) requires every task done, the archive task included … Self-blocking precondition recorded for CHG-005"; commit `dfa2af9`.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-41** `.sdd/_living/CAP-tracking-archive.md:274-281` › `C001-REQ-913` — preconditions listed with ERR-CLI-009; scenario C001-TS-914.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-42** `src/tracking/task.ts:48-72` › `findTask()`; `src/workspace/status.ts:61-76` — both read lite task sections of `20-plan/plan.md`; `archiveBlockers` does not.
  - layer: serena (find_symbol) + grep · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added for symbols
- **E-43** `plugins/architect/skills/planning/SKILL.md:87-92` › `Lite plan` — lite tasks are sections of `plan.md`, "No `50-tasks/` folder"; `tests/integration/cap09` has no lite archive test (grep: `lite` only in `TS-906.test.ts`).
  - layer: grep · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-44** `plugins/architect/commands/archive.md:10-12` › - — step 1 stops on ERR-CLI-009 ("tasks not done or dropped").
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-45** `tests/integration/cap09/TS-914.test.ts:8-47`; `archive-fixture.ts:81-89`; `TS-921.test.ts`; `TC-1131-archive-resume.test.ts:220` › - — tests of the preconditions and the archive flow.
  - layer: grep · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable
- **E-46** `plugins/architect/scripts/sdd.mjs:1` › - — (bundled CLI, `sdd version` answers `architect-plugin@0.1.0`) read-only runs on 2026-11-17: `sdd hash 001 10-spec` exit 2, `sdd hash 002 10-spec` exit 2, `sdd gate show 001 10-spec` exit 2, all "ERR-CLI-002: Change `NNN` not found. Fix: Check `sdd status`"; control `sdd hash 005 00-ideation` exit 0, `sha256:3aba2996…e3740`.
  - layer: grep · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; a CLI run has no ripwire or Serena verb; bundled CLI run from the repository, not an installed plugin
- **E-47** `src/cli/commands.ts:259` › `hashCmd()` — calls `resolveChange` (line 260), then `phaseHash`.
  - layer: serena · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-48** `src/cli/commands.ts:332` › `resolveChange()` — matches `changeFolders(ctx.root)`; no match raises ERR-CLI-002; `changeFolders` (lines 104-109) lists `.sdd/NNN-*` directories only; `changeOfId` (204-208) repeats the lookup.
  - layer: serena · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-49** `src/gate/hash.ts:38` › `phaseHash()` — takes a change directory; works on any folder that holds the phase files.
  - layer: serena · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-50** `src/workspace/status.ts:128` › `listChanges()`; `src/lint/engine.ts:46-56` › `changeFolders()`; `src/workspace/change.ts:25-30` — search `_archive/`.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-51** `src/cli/commands.ts:332` › `resolveChange()` — referencing symbols: gateContext, changeStop, taskSet, defectClose, defectReopen, hashCmd, staleCmd, traceCmd, changeProfile, idNext, idTombstone, archiveCmd.
  - layer: serena · confidence: high
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; Serena lines 0-based, 1 added
- **E-52** `.sdd/_living/CAP-gates.md:157-164` › `C001-REQ-806`; `.sdd/_archive/001-architect-agent-suite/10-spec/50-interfaces/sdd-cli.md:41` — hash statement and CLI row; neither mentions archived changes.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127
- **E-53** `tests/integration/cap08/TS-806.test.ts:23-37`; `tests/integration/cli/frontend.test.ts:113`; `tests/unit/workspace/ledger.test.ts:86,97` › - — workaround copy of CHG-001 into a scratch workspace; ERR-CLI-002 assertions.
  - layer: grep (Read) · confidence: medium
  - commit: 215e36d · pattern: none
  - disclosures: ripwire failed: exit 127; `--test-gate` unavailable
