---
id: C001-CAP-01
artifact: spec/requirements
capability: "Workspace, registry and identifiers"
change: CHG-001
phase: 10-spec
status: draft
delta_default: ADDED
---

# C001-CAP-01 — Requirements

All requirements in this file are `Delta: ADDED` (greenfield). Interfaces referenced:
`../../50-interfaces/sdd-cli.md` (C001-IF-01), `registry.schema.json` (C001-IF-02),
`artifact-frontmatter.md` (C001-IF-03), `errors.md`.

### C001-REQ-101 — Scaffold the workspace
- **Pattern:** event-driven
- **Statement:** WHEN `sdd init` is run in a directory that contains no `.sdd/` folder, THE sdd CLI SHALL create `.sdd/` containing `SDD.md`, `registry.json`, `_constitution/`, `_living/`, `_decisions/`, `_templates/` and `_archive/`.
- **Rationale:** Q19, IDEA-§11.1
- **Stories:** C001-US-101
- **Priority:** Must
- **Acceptance:** C001-AC-101.1, C001-AC-101.2

### C001-REQ-102 — Idempotent init
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd init` is run without `--force` in a directory whose `.sdd/` folder already exists, THEN THE sdd CLI SHALL create only the missing workspace entries and leave every existing file byte-identical.
- **Rationale:** users re-run init; protects hand-edited constitution and specs
- **Stories:** C001-US-101
- **Priority:** Must
- **Acceptance:** C001-AC-102.1

### C001-REQ-103 — Content of SDD.md
- **Pattern:** event-driven
- **Statement:** WHEN the sdd CLI writes `SDD.md`, THE sdd CLI SHALL include YAML frontmatter (`sdd_version`, `workspace`, `generator`, `id_scheme`) and the sections "How to orient yourself (agents)", "If you are implementing a change", "Conventions" and a status block delimited by `<!-- sdd:status:begin -->` and `<!-- sdd:status:end -->`.
- **Rationale:** OA-03, IDEA-§11.5
- **Stories:** C001-US-101, C001-US-102
- **Priority:** Must
- **Acceptance:** C001-AC-103.1

### C001-REQ-104 — Registry rebuilt from frontmatter
- **Pattern:** event-driven
- **Statement:** WHEN `sdd status --write` runs, THE sdd CLI SHALL rebuild `registry.json` exclusively from the frontmatter of each change's `change.md`, phase artifacts and task files, conforming to C001-IF-02.
- **Rationale:** OA-03 rule "frontmatter is source of truth"
- **Stories:** C001-US-102, C001-US-105
- **Priority:** Must
- **Acceptance:** C001-AC-104.1, C001-AC-104.2

### C001-REQ-105 — Regenerate the SDD.md status block
- **Pattern:** event-driven
- **Statement:** WHEN `sdd status --write` runs, THE sdd CLI SHALL replace the content between the status markers of `SDD.md` with one table row per non-archived change (change number, title, phase, phase status, tasks done/total, open defects, last update date) and leave all content outside the markers byte-identical.
- **Rationale:** OA-03
- **Stories:** C001-US-102, C001-US-105
- **Priority:** Must
- **Acceptance:** C001-AC-105.1, C001-AC-105.2

### C001-REQ-106 — Registry drift detection
- **Pattern:** unwanted-behaviour
- **Statement:** IF the content of `registry.json` differs from the registry that `sdd status` would rebuild from frontmatter, THEN THE lint SHALL report error `LINT-REG-001` listing each differing JSON path with its stored and expected values.
- **Rationale:** C001-SC-02; IDEA-G-06
- **Stories:** C001-US-102, C001-US-105
- **Priority:** Must
- **Acceptance:** C001-AC-106.1

### C001-REQ-107 — Change number allocation
- **Pattern:** event-driven
- **Statement:** WHEN `sdd change new "<title>"` runs, THE sdd CLI SHALL assign the change number equal to one plus the highest three-digit number found among change folders in `.sdd/` and `.sdd/_archive/`, starting at 001.
- **Rationale:** numbers never reused (P-07)
- **Stories:** C001-US-103
- **Priority:** Must
- **Acceptance:** C001-AC-107.1, C001-AC-107.2

### C001-REQ-108 — Change folder structure
- **Pattern:** event-driven
- **Statement:** WHEN `sdd change new "<title>"` runs, THE sdd CLI SHALL create the folder `NNN-<slug>` containing `change.md`, `ids.json` and the phase folders required by the change's profile, where `<slug>` is the title converted to lowercase ASCII kebab-case truncated to 40 characters without a trailing hyphen.
- **Rationale:** IDEA-§11.1, §11.7
- **Stories:** C001-US-103
- **Priority:** Must
- **Acceptance:** C001-AC-108.1, C001-AC-108.2

### C001-REQ-109 — ID allocation
- **Pattern:** event-driven
- **Statement:** WHEN `sdd id next <TYPE>` runs inside a change, THE sdd CLI SHALL persist the allocation in that change's `ids.json` before printing the allocated full-form ID on standard output.
- **Rationale:** crash-safe allocation; OA-08
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-109.1

### C001-REQ-110 — No ID reuse
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL NOT allocate an ID that `ids.json` records as allocated or tombstoned.
- **Rationale:** P-07; TR-13
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-110.1

### C001-REQ-111 — Tombstoning
- **Pattern:** event-driven
- **Statement:** WHEN `sdd id tombstone <ID> --reason "<text>"` runs, THE sdd CLI SHALL record the ID, the reason and the ISO-8601 date in the `tombstones` array of the change's `ids.json`.
- **Rationale:** deleted IDs remain resolvable for P-04
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-111.1

### C001-REQ-112 — Short-form ID resolution
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL resolve a short-form ID (`<TYPE>-<seq>`) found in a file inside a change folder to the full form `C<NNN>-<TYPE>-<seq>` of the enclosing change.
- **Rationale:** OA-08 readability
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-112.1

### C001-REQ-113 — Known ID types
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL reject with error `ERR-CLI-004` any `sdd id next` request whose type is not one of the ID types defined in C001-IF-04 (`GOAL, SC, NG, AS, CON, CAP, US, REQ, AC, TS, NFR, INV, IF, ERR, COMP, DEC, ADR, OA, R, M, T, TC, RISK, RB, DOD`).
- **Rationale:** IDEA-§12.1 (extended with GOAL, SC, NG, AS used by this spec)
- **Stories:** C001-US-104
- **Priority:** Must
- **Acceptance:** C001-AC-113.1

### C001-REQ-114 — Constitution interview
- **Pattern:** event-driven
- **Statement:** WHEN `/architect:init` runs and `_constitution/constitution.md` does not exist, THE conductor SHALL draft `constitution.md` with the sections Principles, Quality bar, NFR defaults, Global DoD (DOD-G items), Forbidden technologies, Profile thresholds, and Language & conventions, using at most two interview rounds.
- **Rationale:** IDEA-§10.2, Q7
- **Stories:** C001-US-106
- **Priority:** Must
- **Acceptance:** C001-AC-114.1, C001-AC-114.2

### C001-REQ-115 — Toolchain record
- **Pattern:** event-driven
- **Statement:** WHEN the baseline survey of `/architect:init` or `/architect:doctor` completes, THE cartographer SHALL write `_constitution/toolchain.md` listing for each of node, git, ripwire, Serena, Archify, ast-grep, Context7 and DeepWiki: detected (yes/no), version, path or endpoint, and the fallback in use.
- **Rationale:** IDEA-P-10; C001-CAP-10
- **Stories:** C001-US-106
- **Priority:** Must
- **Acceptance:** C001-AC-115.1

### C001-REQ-116 — Profile suggestion
- **Pattern:** event-driven
- **Statement:** WHEN `/architect:new` runs, THE conductor SHALL propose a profile (`lite` or `full`) with its size estimate (expected user stories, requirements and touched modules, compared with the constitution's profile thresholds) and obtain P-01's confirmation through AskUserQuestion before creating the change.
- **Rationale:** Spec-Q1
- **Stories:** C001-US-107
- **Priority:** Must
- **Acceptance:** C001-AC-116.1

### C001-REQ-117 — Lite file set
- **Pattern:** optional-feature
- **Statement:** WHERE a change has profile `lite`, THE sdd CLI SHALL scaffold exactly the lite file set defined in C001-IF-06 §3 (`00-ideation/ideation.md`, `00-ideation/questions-log.md`, `10-spec/spec.md`, `10-spec/dod.md`, `20-plan/plan.md`, `20-plan/handoff.md`).
- **Rationale:** OQ-05
- **Stories:** C001-US-107
- **Priority:** Must
- **Acceptance:** C001-AC-117.1

### C001-REQ-118 — Same rules for lite
- **Pattern:** optional-feature
- **Statement:** WHERE a change has profile `lite`, THE lint SHALL apply the same ID, EARS, traceability and marker rules as for profile `full`, excluding only file-presence rules for files absent from the lite file set.
- **Rationale:** OQ-05 "same IDs/gates"
- **Stories:** C001-US-107
- **Priority:** Must
- **Acceptance:** C001-AC-118.1

### C001-REQ-119 — Upgrade lite to full
- **Pattern:** event-driven
- **Statement:** WHEN `sdd change profile <NNN> full` runs on a lite change, THE sdd CLI SHALL split the lite files into the full layout of C001-IF-06 §2 such that every ID and every requirement, criterion, scenario and task text is preserved.
- **Rationale:** Spec-Q1 (upgrade allowed)
- **Stories:** C001-US-107
- **Priority:** Should
- **Acceptance:** C001-AC-119.1

### C001-REQ-120 — No downgrade to lite
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd change profile <NNN> lite` is requested for a change whose profile is `full`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-007` and exit code 2.
- **Rationale:** Spec-Q1 (never silently downgraded); downgrading would lose structure
- **Stories:** C001-US-107
- **Priority:** Must
- **Acceptance:** C001-AC-120.1

### C001-REQ-121 — Brownfield capability inventory
- **Pattern:** complex
- **Statement:** WHILE the target repository contains source files, WHEN `/architect:init` runs with an empty `_living/`, THE cartographer SHALL write one `_living/CAP-<slug>.md` stub per detected capability with frontmatter `inventory_only: true` and the sections Purpose, Entry points, Main modules, Owning tests and Evidence (each entry with path, symbol where applicable, and evidence layer).
- **Rationale:** OQ-07b
- **Stories:** C001-US-108
- **Priority:** Should
- **Acceptance:** C001-AC-121.1

### C001-REQ-122 — Inventory stubs contain no requirements
- **Pattern:** unwanted-behaviour
- **Statement:** IF a `_living/` file whose frontmatter has `inventory_only: true` contains a requirement entry (a heading with a REQ ID), THEN THE lint SHALL report error `LINT-LIV-001`.
- **Rationale:** OQ-07b "no requirements"
- **Stories:** C001-US-108
- **Priority:** Should
- **Acceptance:** C001-AC-122.1

### C001-REQ-123 — Accept the bootstrap workspace
- **Pattern:** event-driven
- **Statement:** WHEN `sdd status --write` first runs on a workspace whose `SDD.md` frontmatter has `generator` starting with `manual`, THE sdd CLI SHALL preserve every existing change, phase status, approval hash and gate-log entry and set `generator` to the CLI's own identifier.
- **Rationale:** current-state.md (this repo was bootstrapped by hand)
- **Stories:** C001-US-101
- **Priority:** Must
- **Acceptance:** C001-AC-123.1

### C001-REQ-124 — Tolerate unknown entries
- **Pattern:** unwanted-behaviour
- **Statement:** IF `.sdd/` contains files or folders not defined by the workspace layout, THEN THE sdd CLI SHALL leave them untouched and report them as `info` (`LINT-WS-002`) without failing any command.
- **Rationale:** a third-party `metrics/` folder exists in this repo (current-state.md)
- **Stories:** C001-US-101
- **Priority:** Must
- **Acceptance:** C001-AC-124.1

### C001-REQ-125 — Change manifest content
- **Pattern:** event-driven
- **Statement:** WHEN the sdd CLI creates `change.md`, THE sdd CLI SHALL write the frontmatter fields defined in C001-IF-03 §2 (`id`, `title`, `kind`, `profile`, `phase`, `phases.*.status`, `phases.*.approved_hash`, `phases.*.approved_at`, `phases.*.approved_by`, `implementation.status`, `owners`) and a body with the sections Index and Gate log.
- **Rationale:** IDEA-§11.7
- **Stories:** C001-US-103
- **Priority:** Must
- **Acceptance:** C001-AC-125.1

### C001-REQ-126 — Atomic registry write
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL write `registry.json`, `ids.json` and `SDD.md` by writing a temporary file in the same directory and renaming it over the target.
- **Rationale:** no corrupted state on interruption (C001-NFR-301)
- **Stories:** C001-US-105
- **Priority:** Must
- **Acceptance:** C001-AC-126.1

### C001-REQ-127 — Gate G0 for the constitution
- **Pattern:** state-driven
- **Statement:** WHILE `_constitution/constitution.md` has status other than `approved`, THE conductor SHALL refuse to start the ideation phase of any change with a message that names the unapproved constitution and the command to approve it.
- **Rationale:** IDEA-§18.2 G0
- **Stories:** C001-US-106
- **Priority:** Must
- **Acceptance:** C001-AC-127.1
