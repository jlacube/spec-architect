---
capability: workspace
inventory_only: false
updated: 2026-11-16
---

# Workspace, registry, identifiers (`C001-CAP-01`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Creates and maintains the `.sdd/` workspace: layout, change folders, the ID ledger, the registry
and status block, workspace upgrade, and the shared model (markdown blocks, frontmatter, ID
parsing, artifact graph) and file-system helpers that every other capability uses.

## Entry points

- `sdd init`, `sdd change new`, `sdd change profile` (lite to full, via `upgradeToFull` in
  `src/workspace/upgrade.ts`), `sdd id next`, `sdd id tombstone`, `sdd status` in
  `src/cli/commands.ts` (command table `COMMANDS`, line 480).
- Plugin commands `plugins/architect/commands/init.md`, `new.md`, `status.md`.

## Main modules

- `src/workspace/` — `init.ts`, `change.ts`, `change-md.ts`, `ledger.ts`, `status.ts` (registry and
  status block), `sddmd.ts`, `templates.ts`, `layout.ts`, `find.ts`, `adopt.ts`, `upgrade.ts`.
- `src/model/` — `blocks.ts`, `frontmatter.ts`, `ids.ts`, `graph.ts`.
- `src/io/` — `atomic.ts`, `paths.ts`.

## Owning tests

- `tests/integration/cap01/` (`TS-101` … `TS-132`, shared `tests/integration/workspace-fixtures.ts`).
- `tests/unit/model/`, `tests/unit/io/`, `tests/unit/workspace/`.
- Evals: `evals/cap01/`.

## Evidence

- **E-1** `src/workspace/init.ts:35` › `initWorkspace()` — creates the workspace at init.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/workspace/change.ts:59` › `createChange()` — creates a change folder.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/workspace/ledger.ts:125` › `nextId()` — allocates the next ID from the ledger.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `src/workspace/status.ts:140` › `rebuildRegistry()` — rebuilds `registry.json` from frontmatter.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127

## Requirements

### C001-REQ-101 — Scaffold the workspace
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd init` is run in a directory that contains no `.sdd/` folder, THE sdd CLI SHALL create `.sdd/` containing `SDD.md`, `registry.json`, `_constitution/`, `_living/`, `_decisions/`, `_templates/` and `_archive/`.
- **Rationale:** Q19, IDEA-§11.1
- **Stories:** C001-US-101
- **Priority:** Must
- **Acceptance:** C001-AC-101.1, C001-AC-101.2

#### C001-AC-101.1 — All root entries exist after init
```gherkin
Scenario: C001-TS-101 — init on an empty repository
  Given the fixture repository "fx-empty" with no ".sdd" folder
  When the user runs "$SDD init"
  Then the exit code is 0
  And ".sdd/SDD.md" and ".sdd/registry.json" exist
  And the directories "_constitution", "_living", "_decisions", "_templates", "_archive" exist under ".sdd"
  And "registry.json" validates against C001-IF-02 with "sdd_version" = 1 and "changes" = []
```

#### C001-AC-101.2 — Init does not touch anything outside .sdd
```gherkin
Scenario: C001-TS-102 — init writes only inside .sdd
  Given the fixture repository "fx-brownfield-ts" with a clean git working tree
  When the user runs "$SDD init"
  Then "git status --porcelain" lists only paths starting with ".sdd/"
```

### C001-REQ-102 — Idempotent init
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd init` is run without `--force` in a directory whose `.sdd/` folder already exists, THEN THE sdd CLI SHALL create only the missing workspace entries and leave every existing file byte-identical.
- **Rationale:** users re-run init; protects hand-edited constitution and specs
- **Stories:** C001-US-101
- **Priority:** Must
- **Acceptance:** C001-AC-102.1

#### C001-AC-102.1 — Re-running init preserves existing files
```gherkin
Scenario: C001-TS-103 — second init is non-destructive
  Given a workspace created by "$SDD init"
  And "_constitution/constitution.md" was edited by the user
  And the folder "_decisions" was deleted
  When the user runs "$SDD init" again without "--force"
  Then the exit code is 0
  And "_constitution/constitution.md" is byte-identical to its content before the command
  And the folder "_decisions" exists again
  And the output contains "workspace exists" and lists "_decisions" as created
```

### C001-REQ-103 — Content of SDD.md
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the sdd CLI writes `SDD.md`, THE sdd CLI SHALL include YAML frontmatter (`sdd_version`, `workspace`, `generator`, `id_scheme`) and the sections "How to orient yourself (agents)", "If you are implementing a change", "Conventions" and a status block delimited by `<!-- sdd:status:begin -->` and `<!-- sdd:status:end -->`.
- **Rationale:** OA-03, IDEA-§11.5
- **Stories:** C001-US-101, C001-US-102
- **Priority:** Must
- **Acceptance:** C001-AC-103.1

#### C001-AC-103.1 — SDD.md has the mandated structure
```gherkin
Scenario: C001-TS-104 — SDD.md structure
  Given a workspace created by "$SDD init"
  When the file ".sdd/SDD.md" is parsed
  Then its frontmatter contains the keys "sdd_version", "workspace", "generator", "id_scheme"
  And it contains the headings "How to orient yourself (agents)", "If you are implementing a change", "Conventions"
  And it contains exactly one "<!-- sdd:status:begin -->" followed later by exactly one "<!-- sdd:status:end -->"
```

### C001-REQ-104 — Registry rebuilt from frontmatter
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd status --write` runs, THE sdd CLI SHALL rebuild `registry.json` exclusively from the frontmatter of each change's `change.md`, phase artifacts and task files, conforming to C001-IF-02.
- **Rationale:** OA-03 rule "frontmatter is source of truth"
- **Stories:** C001-US-102, C001-US-105
- **Priority:** Must
- **Acceptance:** C001-AC-104.1, C001-AC-104.2

#### C001-AC-104.1 — Registry reflects frontmatter
```gherkin
Scenario: C001-TS-105 — registry rebuilt from change manifests
  Given a workspace with changes "001" (phase "10-spec") and "002" (phase "00-ideation")
  And "registry.json" was deleted
  When the user runs "$SDD status --write"
  Then "registry.json" validates against C001-IF-02
  And it lists change "CHG-001" with "phase" = "10-spec" and change "CHG-002" with "phase" = "00-ideation"
```

#### C001-AC-104.2 — Frontmatter wins over a hand-edited registry
```gherkin
Scenario: C001-TS-106 — hand edits to the registry are overwritten
  Given change "001" whose "change.md" frontmatter says "phases.10-spec.status: draft"
  And "registry.json" was hand-edited to say "approved" for that phase
  When the user runs "$SDD status --write"
  Then "registry.json" says "draft" for "CHG-001" phase "10-spec"
```

### C001-REQ-105 — Regenerate the SDD.md status block
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd status --write` runs, THE sdd CLI SHALL replace the content between the status markers of `SDD.md` with one table row per non-archived change (change number, title, phase, phase status, tasks done/total, open defects, last update date) and leave all content outside the markers byte-identical.
- **Rationale:** OA-03
- **Stories:** C001-US-102, C001-US-105
- **Priority:** Must
- **Acceptance:** C001-AC-105.1, C001-AC-105.2

#### C001-AC-105.1 — One row per non-archived change
```gherkin
Scenario: C001-TS-107 — status block content
  Given changes "001" (archived), "002" (10-spec, draft, 0/0 tasks) and "003" (20-plan, approved, 4/12 tasks, 1 open defect)
  When the user runs "$SDD status --write"
  Then the status block in SDD.md contains exactly 2 data rows
  And the row for "003" shows phase "20-plan", status "approved", tasks "4/12" and open defects "1"
```

#### C001-AC-105.2 — Content outside markers is untouched
```gherkin
Scenario: C001-TS-108 — custom notes in SDD.md survive regeneration
  Given SDD.md contains a user paragraph "Team note: ping Ana before G2" above the status block
  When the user runs "$SDD status --write"
  Then every byte of SDD.md outside the status markers is unchanged
```

### C001-REQ-106 — Registry drift detection
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the content of `registry.json` differs from the registry that `sdd status` would rebuild from frontmatter, THEN THE lint SHALL report error `LINT-REG-001` listing each differing JSON path with its stored and expected values.
- **Rationale:** C001-SC-02; IDEA-G-06
- **Stories:** C001-US-102, C001-US-105
- **Priority:** Must
- **Acceptance:** C001-AC-106.1

#### C001-AC-106.1 — Drift is reported precisely
```gherkin
Scenario: C001-TS-109 — lint detects registry drift
  Given "registry.json" stores "changes[0].phase" = "20-plan"
  And the frontmatter of change "001" says "phase: 10-spec"
  When the user runs "$SDD lint"
  Then the exit code is 1
  And the report contains error "LINT-REG-001" with path "changes[0].phase", stored "20-plan", expected "10-spec"
```

### C001-REQ-107 — Change number allocation
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd change new "<title>"` runs, THE sdd CLI SHALL assign the change number equal to one plus the highest three-digit number found among change folders in `.sdd/` and `.sdd/_archive/`, starting at 001.
- **Rationale:** numbers never reused (P-07)
- **Stories:** C001-US-103
- **Priority:** Must
- **Acceptance:** C001-AC-107.1, C001-AC-107.2

#### C001-AC-107.1 — Numbering starts at 001
```gherkin
Scenario: C001-TS-110 — first change number
  Given an initialised workspace with no change folders
  When the user runs "$SDD change new \"Add login\""
  Then the folder ".sdd/001-add-login" exists
```

#### C001-AC-107.2 — Archived numbers are never reused
```gherkin
Scenario: C001-TS-111 — numbering counts archived changes
  Given change folders ".sdd/002-foo" and ".sdd/_archive/005-bar"
  When the user runs "$SDD change new \"Baz\""
  Then the folder ".sdd/006-baz" exists
```

### C001-REQ-108 — Change folder structure
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd change new "<title>"` runs, THE sdd CLI SHALL create the folder `NNN-<slug>` containing `change.md`, `ids.json` and the phase folders required by the change's profile, where `<slug>` is the title converted to lowercase ASCII kebab-case truncated to 40 characters without a trailing hyphen.
- **Rationale:** IDEA-§11.1, §11.7
- **Stories:** C001-US-103
- **Priority:** Must
- **Acceptance:** C001-AC-108.1, C001-AC-108.2

#### C001-AC-108.1 — Full-profile change folder layout
```gherkin
Scenario: C001-TS-112 — change folder content (full profile)
  Given an initialised workspace
  When the user runs "$SDD change new \"Payment retries\" --profile full"
  Then ".sdd/001-payment-retries" contains "change.md", "ids.json", "00-ideation/", "10-spec/", "20-plan/"
```

#### C001-AC-108.2 — Slug normalisation
```gherkin
Scenario Outline: C001-TS-113 — slug rules
  When the user runs "$SDD change new \"<title>\""
  Then the created folder name ends with "<slug>"
  Examples:
    | title                                               | slug                                     |
    | Payment Retries!                                    | payment-retries                          |
    | Ünïcode & spaces   here                             | unicode-spaces-here                      |
    | A very long title that keeps going well beyond forty chars | a-very-long-title-that-keeps-going-well |
```

### C001-REQ-109 — ID allocation
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd id next <TYPE>` runs inside a change, THE sdd CLI SHALL persist the allocation in that change's `ids.json` before printing the allocated full-form ID on standard output.
- **Rationale:** crash-safe allocation; OA-08
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-109.1

#### C001-AC-109.1 — Allocation persisted before output
```gherkin
Scenario: C001-TS-114 — id next persists first
  Given change "004" whose "ids.json" records REQ sequence up to 11
  When the user runs "$SDD id next REQ --change 004"
  Then standard output is "C004-REQ-012"
  And "ids.json" records "C004-REQ-012" as allocated
  And a second run prints "C004-REQ-013"
```

### C001-REQ-110 — No ID reuse
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL NOT allocate an ID that `ids.json` records as allocated or tombstoned.
- **Rationale:** P-07; TR-13
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-110.1

#### C001-AC-110.1 — Tombstoned IDs are skipped
```gherkin
Scenario: C001-TS-115 — no reuse after tombstone
  Given change "004" with REQ allocated up to 12 and "C004-REQ-012" tombstoned
  When the user runs "$SDD id next REQ --change 004"
  Then standard output is "C004-REQ-013"
```

### C001-REQ-111 — Tombstoning
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd id tombstone <ID> --reason "<text>"` runs, THE sdd CLI SHALL record the ID, the reason and the ISO-8601 date in the `tombstones` array of the change's `ids.json`.
- **Rationale:** deleted IDs remain resolvable for P-04
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-111.1

#### C001-AC-111.1 — Tombstone record content
```gherkin
Scenario: C001-TS-116 — tombstone entry
  When the user runs "$SDD id tombstone C004-REQ-007 --reason \"merged into REQ-006\""
  Then "ids.json" of change "004" has a tombstone {"id":"C004-REQ-007","reason":"merged into REQ-006","date":"<today ISO-8601>"}
```

### C001-REQ-112 — Short-form ID resolution
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL resolve a short-form ID (`<TYPE>-<seq>`) found in a file inside a change folder to the full form `C<NNN>-<TYPE>-<seq>` of the enclosing change.
- **Rationale:** OA-08 readability
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-112.1

#### C001-AC-112.1 — Short form resolves to enclosing change
```gherkin
Scenario: C001-TS-117 — short-form resolution in trace
  Given "10-spec/20-capabilities/CAP-01-x/requirements.md" inside change "004" references "AC-012.1"
  When the user runs "$SDD trace 004"
  Then the trace graph contains an edge to "C004-AC-012.1"
```

### C001-REQ-113 — Known ID types
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL reject with error `ERR-CLI-004` any `sdd id next` request whose type is not one of the ID types defined in C001-IF-04 (`GOAL, SC, NG, AS, CON, CAP, US, REQ, AC, TS, NFR, INV, IF, ERR, COMP, DEC, ADR, OA, R, M, T, TC, RISK, RB, DOD`).
- **Rationale:** IDEA-§12.1 (extended with GOAL, SC, NG, AS used by this spec)
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-113.1

#### C001-AC-113.1 — Unknown types rejected
```gherkin
Scenario: C001-TS-118 — unknown ID type
  When the user runs "$SDD id next FOO --change 004"
  Then the exit code is 2
  And standard error contains "ERR-CLI-004" and the list of valid types
```

### C001-REQ-114 — Constitution interview
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `/architect:init` runs and `_constitution/constitution.md` does not exist, THE conductor SHALL draft `constitution.md` with the sections Principles, Quality bar, NFR defaults, Global DoD (DOD-G items), Forbidden technologies, Profile thresholds, and Language & conventions, using at most two interview rounds.
- **Rationale:** IDEA-§10.2, Q7
- **Stories:** C001-US-106
- **Priority:** Must
- **Acceptance:** C001-AC-114.1, C001-AC-114.2

#### C001-AC-114.1 — Constitution sections present
```gherkin
Scenario: C001-TS-119 — constitution drafted by init interview
  Given a workspace without "_constitution/constitution.md"
  When P-01 completes "/architect:init" answering all interview rounds
  Then "constitution.md" contains the headings "Principles", "Quality bar", "NFR defaults", "Global DoD", "Forbidden technologies", "Profile thresholds", "Language & conventions"
  And "Global DoD" contains at least one item with an ID matching "DOD-G-\d{2}"
```

#### C001-AC-114.2 — At most two interview rounds
```gherkin
Scenario: C001-TS-120 — constitution interview length
  When P-01 runs "/architect:init" on a workspace without a constitution
  Then the conductor issues at most 2 AskUserQuestion calls before writing "constitution.md"
```

### C002-REQ-507 — Toolchain record per host
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the baseline survey of the init command or of the doctor command completes, THE cartographer SHALL write `_constitution/toolchain.md` listing for each of node, git, the host it runs on, ripwire, Serena, ast-grep, Context7, DeepWiki and, on a generated target, the sdd CLI: detected (yes/no), version, path or endpoint, and the fallback in use, with Context7 and DeepWiki detected only when the one probe call that the researcher makes with that server's tools during the same command succeeds.
- **Rationale:** same rows as the doctor table (C002-REQ-504); unchanged on Claude Code except the detection of Context7 and DeepWiki. Revised for defect D-057 (P-01, 2026-11-12: "Fix shared source (Recommended)"): the cartographer keeps writing the record, but it holds no tool of either remote server on any target, so it recorded both as not detected while both servers ran (`.sdd/_constitution/toolchain.md:22-23`: "no (this session)"); the two rows now take the result of the researcher's probe call, the call of C002-REQ-522 in the doctor command. The init command writes the same record through the same toolchain survey (current-state E-20, E-21) and uses the same researcher probe (conductor's decision within P-01's "Fix shared source (Recommended)"); otherwise its two rows would read "no" while both servers run
- **Stories:** C002-US-503
- **Priority:** Must
- **Acceptance:** C002-AC-507.1
- **Evidence:** current-state E-19 — `plugins/architect/commands/doctor.md:11` › `Probe` (cartographer writes `toolchain.md`, eight rows; layer: grep); current-state E-20 — `plugins/architect/commands/init.md:13` › `step 3` (toolchain record always written; layer: grep); current-state E-21 — `plugins/architect/skills/code-discovery/SKILL.md:94` › `Toolchain record` (row set and columns; Context7 and DeepWiki "detected when their tools load"; layer: grep); `plugins/architect/agents/sdd-cartographer.md:8` › `tools` (no Context7 or DeepWiki tool; layer: grep); `.sdd/_constitution/toolchain.md:22-23` › `Context7`, `DeepWiki` (detected "no (this session)"; layer: read)

### C002-REQ-213 — Profile confirmation on the host's question tool
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the new-change command runs (`/architect:new` on Claude Code), THE conductor SHALL propose a profile (`lite` or `full`) with its size estimate (expected user stories, requirements and touched modules, compared with the constitution's profile thresholds) and obtain P-01's confirmation through the question tool of its host before creating the change.
- **Rationale:** C002-GOAL-03; unchanged on Claude Code
- **Stories:** C002-US-204, C002-US-304
- **Priority:** Must
- **Acceptance:** C002-AC-213.1
- **Evidence:** current-state E-28 — `plugins/architect/commands/new.md:14` › `step 3` (one profile round, recommended profile first, no change folder before the answer; layer: grep); current-state E-24 — `plugins/architect/agents/sdd-conductor.md:7` › `tools` (AskUserQuestion; layer: grep)

#### C002-AC-213.1 — Profile confirmed through the host's tool before the change exists
```gherkin
@eval
Scenario Outline: C002-TS-219 — profile round on Claude Code and OpenCode
  Given "fx-bootstrap" with 1 change on <host>
  When P-01 runs the new-change command with the title "Export to CSV"
  Then one "<tool>" call offers a profile first, labelled "(Recommended)", with the expected user stories, requirements and touched modules compared with the constitution's thresholds
  And no folder ".sdd/002-*" exists before the answer
  Examples:
    | host        | tool            |
    | Claude Code | AskUserQuestion |
    | OpenCode    | question        |
```

```gherkin
@manual-vscode
Scenario: C002-TS-220 — profile round in VS Code
  Given a fresh repository with an initialised ".sdd/" in VS Code
  When P-01 runs the new-change prompt with the title "Toy change"
  Then an "askQuestions" dialog proposes "lite" or "full" with its size estimate
  And no change folder exists until P-01 answers
```

### C001-REQ-117 — Lite file set
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE a change has profile `lite`, THE sdd CLI SHALL scaffold exactly the lite file set defined in C001-IF-06 §3 (`00-ideation/ideation.md`, `00-ideation/questions-log.md`, `10-spec/spec.md`, `10-spec/dod.md`, `20-plan/plan.md`, `20-plan/handoff.md`).
- **Rationale:** OQ-05
- **Stories:** C001-US-107
- **Priority:** Must
- **Acceptance:** C001-AC-117.1

#### C001-AC-117.1 — Lite file set exact
```gherkin
Scenario: C001-TS-123 — lite scaffold
  When the user runs "$SDD change new \"Small fix\" --profile lite"
  Then the change folder contains exactly the files listed in C001-IF-06 §3 plus "change.md" and "ids.json"
```

### C001-REQ-118 — Same rules for lite
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE a change has profile `lite`, THE lint SHALL apply the same ID, EARS, traceability and marker rules as for profile `full`, excluding only file-presence rules for files absent from the lite file set.
- **Rationale:** OQ-05 "same IDs/gates"
- **Stories:** C001-US-107
- **Priority:** Must
- **Acceptance:** C001-AC-118.1

#### C001-AC-118.1 — Lite changes are linted with the same rules
```gherkin
Scenario: C001-TS-124 — EARS violation in a lite spec
  Given a lite change whose "10-spec/spec.md" contains a requirement without an acceptance criterion
  When the user runs "$SDD lint"
  Then the report contains error "TR-02" for that requirement
  And the report contains no file-presence error for "10-spec/30-nfr/"
```

### C001-REQ-119 — Upgrade lite to full
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd change profile <NNN> full` runs on a lite change, THE sdd CLI SHALL split the lite files into the full layout of C001-IF-06 §2 such that every ID and every requirement, criterion, scenario and task text is preserved.
- **Rationale:** Spec-Q1 (upgrade allowed)
- **Stories:** C001-US-107
- **Priority:** Should
- **Acceptance:** C001-AC-119.1

#### C001-AC-119.1 — Upgrade preserves IDs and text
```gherkin
Scenario: C001-TS-125 — lite to full upgrade
  Given a lite change with 3 stories, 8 requirements, 11 acceptance criteria, 14 scenarios and 6 tasks
  When the user runs "$SDD change profile 007 full"
  Then the full layout exists
  And the set of IDs found by "$SDD trace 007" is identical before and after
  And each requirement statement is textually identical before and after
```

### C001-REQ-120 — No downgrade to lite
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd change profile <NNN> lite` is requested for a change whose profile is `full`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-007` and exit code 2.
- **Rationale:** Spec-Q1 (never silently downgraded); downgrading would lose structure
- **Stories:** C001-US-107
- **Priority:** Must
- **Acceptance:** C001-AC-120.1

#### C001-AC-120.1 — Downgrade refused
```gherkin
Scenario: C001-TS-126 — full to lite is refused
  Given change "003" with profile "full"
  When the user runs "$SDD change profile 003 lite"
  Then the exit code is 2
  And standard error contains "ERR-CLI-007"
  And no file of change "003" is modified
```

### C001-REQ-121 — Brownfield capability inventory
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** complex
- **Statement:** WHILE the target repository contains source files, WHEN `/architect:init` runs with an empty `_living/`, THE cartographer SHALL write one `_living/CAP-<slug>.md` stub per detected capability with frontmatter `inventory_only: true` and the sections Purpose, Entry points, Main modules, Owning tests and Evidence (each entry with path, symbol where applicable, and evidence layer).
- **Rationale:** OQ-07b
- **Stories:** C001-US-108
- **Priority:** Should
- **Acceptance:** C001-AC-121.1

#### C001-AC-121.1 — Inventory stubs written for detected capabilities
```gherkin
Scenario: C001-TS-127 — brownfield init writes inventory stubs
  Given the fixture repository "fx-brownfield-ts" with modules "src/billing", "src/auth" and tests under "tests/"
  When P-01 runs "/architect:init"
  Then "_living/" contains at least the files "CAP-billing.md" and "CAP-auth.md"
  And each has frontmatter "inventory_only: true"
  And each has the sections Purpose, Entry points, Main modules, Owning tests, Evidence
  And every Evidence entry names a path and an evidence layer
```

### C001-REQ-122 — Inventory stubs contain no requirements
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a `_living/` file whose frontmatter has `inventory_only: true` contains a requirement entry (a heading with a REQ ID), THEN THE lint SHALL report error `LINT-LIV-001`.
- **Rationale:** OQ-07b "no requirements"
- **Stories:** C001-US-108
- **Priority:** Should
- **Acceptance:** C001-AC-122.1

#### C001-AC-122.1 — Requirements in an inventory stub are rejected
```gherkin
Scenario: C001-TS-128 — lint rejects REQ in inventory stub
  Given "_living/CAP-auth.md" with "inventory_only: true" containing the heading "### C003-REQ-004 — Lockout"
  When the user runs "$SDD lint"
  Then the report contains error "LINT-LIV-001" for "_living/CAP-auth.md"
```

### C001-REQ-123 — Accept the bootstrap workspace
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd status --write` first runs on a workspace whose `SDD.md` frontmatter has `generator` starting with `manual`, THE sdd CLI SHALL preserve every existing change, phase status, approval hash and gate-log entry and set `generator` to the CLI's own identifier.
- **Rationale:** current-state.md (this repo was bootstrapped by hand)
- **Stories:** C001-US-101
- **Priority:** Must
- **Acceptance:** C001-AC-123.1

#### C001-AC-123.1 — Bootstrap workspace upgraded losslessly
```gherkin
Scenario: C001-TS-129 — adopt the hand-written bootstrap
  Given the fixture "fx-bootstrap" = a copy of this repository's ".sdd/" at G1 approval
  When the user runs "$SDD status --write"
  Then "CHG-001" phase "00-ideation" keeps status "approved" and approved_hash "sha256:c9c7849f…"
  And the gate-log table in "change.md" is unchanged
  And SDD.md frontmatter "generator" starts with "architect-plugin@"
```

### C001-REQ-124 — Tolerate unknown entries
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `.sdd/` contains files or folders not defined by the workspace layout, THEN THE sdd CLI SHALL leave them untouched and report them as `info` (`LINT-WS-002`) without failing any command.
- **Rationale:** a third-party `metrics/` folder exists in this repo (current-state.md)
- **Stories:** C001-US-101
- **Priority:** Must
- **Acceptance:** C001-AC-124.1

#### C001-AC-124.1 — Foreign folders tolerated
```gherkin
Scenario: C001-TS-130 — unknown metrics folder
  Given ".sdd/metrics/snapshots.jsonl" written by another tool
  When the user runs "$SDD lint" and "$SDD status --write"
  Then both commands exit with code 0 (assuming no other findings)
  And the lint report contains info "LINT-WS-002" naming "metrics/"
  And "snapshots.jsonl" is byte-identical afterwards
```

### C001-REQ-125 — Change manifest content
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the sdd CLI creates `change.md`, THE sdd CLI SHALL write the frontmatter fields defined in C001-IF-03 §2 (`id`, `title`, `kind`, `profile`, `phase`, `phases.*.status`, `phases.*.approved_hash`, `phases.*.approved_at`, `phases.*.approved_by`, `implementation.status`, `owners`) and a body with the sections Index and Gate log.
- **Rationale:** IDEA-§11.7
- **Stories:** C001-US-103
- **Priority:** Must
- **Acceptance:** C001-AC-125.1

#### C001-AC-125.1 — change.md fields
```gherkin
Scenario: C001-TS-131 — manifest fields
  When the user runs "$SDD change new \"X\" --profile full --kind brownfield"
  Then "change.md" frontmatter validates against C001-IF-03 §2
  And "profile" = "full", "kind" = "brownfield", "phase" = "00-ideation"
  And the body contains the headings "Index" and "Gate log"
```

### C001-REQ-126 — Atomic registry write
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL write `registry.json`, `ids.json` and `SDD.md` by writing a temporary file in the same directory and renaming it over the target.
- **Rationale:** no corrupted state on interruption (C001-NFR-301)
- **Stories:** C001-US-105
- **Priority:** Must
- **Acceptance:** C001-AC-126.1

#### C001-AC-126.1 — Interrupted write leaves the previous file intact
```gherkin
Scenario: C001-TS-132 — atomic registry write
  Given a valid "registry.json"
  And the test harness makes the temporary-file write fail after 10 bytes
  When "$SDD status --write" runs
  Then the command exits non-zero
  And "registry.json" is byte-identical to its previous content
  And no file matching "registry.json.tmp*" remains
```

### C001-REQ-127 — Gate G0 for the constitution
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** state-driven
- **Statement:** WHILE `_constitution/constitution.md` has status other than `approved`, THE conductor SHALL refuse to start the ideation phase of any change with a message that names the unapproved constitution and the command to approve it.
- **Rationale:** IDEA-§18.2 G0
- **Stories:** C001-US-106
- **Priority:** Must
- **Acceptance:** C001-AC-127.1

#### C001-AC-127.1 — Ideation blocked without approved constitution
```gherkin
Scenario: C001-TS-133 — G0 enforcement
  Given "constitution.md" with frontmatter "status: draft"
  When P-01 runs "/architect:ideate 001"
  Then the conductor does not dispatch any specialist
  And its reply names "_constitution/constitution.md" as unapproved and suggests "/architect:gate constitution"
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
| C001-REQ-116 | superseded by C002-REQ-213 | CHG-002 | 2026-11-16 |  |
| C001-REQ-115 | superseded by C002-REQ-507 | CHG-002 | 2026-11-16 |  |
