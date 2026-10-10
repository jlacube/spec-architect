---
id: C001-CAP-01
artifact: spec/acceptance
capability: "Workspace, registry and identifiers"
change: CHG-001
phase: 10-spec
status: draft
---

# C001-CAP-01 — Acceptance criteria and scenarios

Conventions: each AC is a one-sentence condition; each scenario (`TS`) is a Given/When/Then
block. Fixture repositories referenced (`fx-empty`, `fx-bootstrap`, `fx-brownfield-ts`) are
defined in the test plan (20-plan). `$SDD` means `node <plugin>/scripts/sdd.mjs`.

## C001-REQ-101

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

## C001-REQ-102

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

## C001-REQ-103

#### C001-AC-103.1 — SDD.md has the mandated structure
```gherkin
Scenario: C001-TS-104 — SDD.md structure
  Given a workspace created by "$SDD init"
  When the file ".sdd/SDD.md" is parsed
  Then its frontmatter contains the keys "sdd_version", "workspace", "generator", "id_scheme"
  And it contains the headings "How to orient yourself (agents)", "If you are implementing a change", "Conventions"
  And it contains exactly one "<!-- sdd:status:begin -->" followed later by exactly one "<!-- sdd:status:end -->"
```

## C001-REQ-104

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

## C001-REQ-105

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

## C001-REQ-106

#### C001-AC-106.1 — Drift is reported precisely
```gherkin
Scenario: C001-TS-109 — lint detects registry drift
  Given "registry.json" stores "changes[0].phase" = "20-plan"
  And the frontmatter of change "001" says "phase: 10-spec"
  When the user runs "$SDD lint"
  Then the exit code is 1
  And the report contains error "LINT-REG-001" with path "changes[0].phase", stored "20-plan", expected "10-spec"
```

## C001-REQ-107

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

## C001-REQ-108

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

## C001-REQ-109

#### C001-AC-109.1 — Allocation persisted before output
```gherkin
Scenario: C001-TS-114 — id next persists first
  Given change "004" whose "ids.json" records REQ sequence up to 11
  When the user runs "$SDD id next REQ --change 004"
  Then standard output is "C004-REQ-012"
  And "ids.json" records "C004-REQ-012" as allocated
  And a second run prints "C004-REQ-013"
```

## C001-REQ-110

#### C001-AC-110.1 — Tombstoned IDs are skipped
```gherkin
Scenario: C001-TS-115 — no reuse after tombstone
  Given change "004" with REQ allocated up to 12 and "C004-REQ-012" tombstoned
  When the user runs "$SDD id next REQ --change 004"
  Then standard output is "C004-REQ-013"
```

## C001-REQ-111

#### C001-AC-111.1 — Tombstone record content
```gherkin
Scenario: C001-TS-116 — tombstone entry
  When the user runs "$SDD id tombstone C004-REQ-007 --reason \"merged into REQ-006\""
  Then "ids.json" of change "004" has a tombstone {"id":"C004-REQ-007","reason":"merged into REQ-006","date":"<today ISO-8601>"}
```

## C001-REQ-112

#### C001-AC-112.1 — Short form resolves to enclosing change
```gherkin
Scenario: C001-TS-117 — short-form resolution in trace
  Given "10-spec/20-capabilities/CAP-01-x/requirements.md" inside change "004" references "AC-012.1"
  When the user runs "$SDD trace 004"
  Then the trace graph contains an edge to "C004-AC-012.1"
```

## C001-REQ-113

#### C001-AC-113.1 — Unknown types rejected
```gherkin
Scenario: C001-TS-118 — unknown ID type
  When the user runs "$SDD id next FOO --change 004"
  Then the exit code is 2
  And standard error contains "ERR-CLI-004" and the list of valid types
```

## C001-REQ-114

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

## C001-REQ-115

#### C001-AC-115.1 — Toolchain record covers all tools
```gherkin
Scenario: C001-TS-121 — toolchain.md on a machine without ripwire
  Given ripwire is not on PATH and Serena is not installed
  When "/architect:doctor" completes
  Then "toolchain.md" has one row for each of node, git, ripwire, Serena, Archify, ast-grep, Context7, DeepWiki
  And the ripwire row says detected "no" and fallback "serena → lsp → grep" or the next available layer
```

## C001-REQ-116

#### C001-AC-116.1 — Profile is proposed and confirmed
```gherkin
Scenario: C001-TS-122 — lite suggestion for a small change
  Given the constitution profile thresholds say lite when stories ≤ 3 and requirements ≤ 10 and touched modules ≤ 2
  When P-01 runs "/architect:new \"Add --json flag to status\""
  Then the conductor presents an AskUserQuestion offering "lite" first with the size estimate shown
  And no change folder exists until P-01 answers
```

## C001-REQ-117

#### C001-AC-117.1 — Lite file set exact
```gherkin
Scenario: C001-TS-123 — lite scaffold
  When the user runs "$SDD change new \"Small fix\" --profile lite"
  Then the change folder contains exactly the files listed in C001-IF-06 §3 plus "change.md" and "ids.json"
```

## C001-REQ-118

#### C001-AC-118.1 — Lite changes are linted with the same rules
```gherkin
Scenario: C001-TS-124 — EARS violation in a lite spec
  Given a lite change whose "10-spec/spec.md" contains a requirement without an acceptance criterion
  When the user runs "$SDD lint"
  Then the report contains error "TR-02" for that requirement
  And the report contains no file-presence error for "10-spec/30-nfr/"
```

## C001-REQ-119

#### C001-AC-119.1 — Upgrade preserves IDs and text
```gherkin
Scenario: C001-TS-125 — lite to full upgrade
  Given a lite change with 3 stories, 8 requirements, 11 acceptance criteria, 14 scenarios and 6 tasks
  When the user runs "$SDD change profile 007 full"
  Then the full layout exists
  And the set of IDs found by "$SDD trace 007" is identical before and after
  And each requirement statement is textually identical before and after
```

## C001-REQ-120

#### C001-AC-120.1 — Downgrade refused
```gherkin
Scenario: C001-TS-126 — full to lite is refused
  Given change "003" with profile "full"
  When the user runs "$SDD change profile 003 lite"
  Then the exit code is 2
  And standard error contains "ERR-CLI-007"
  And no file of change "003" is modified
```

## C001-REQ-121

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

## C001-REQ-122

#### C001-AC-122.1 — Requirements in an inventory stub are rejected
```gherkin
Scenario: C001-TS-128 — lint rejects REQ in inventory stub
  Given "_living/CAP-auth.md" with "inventory_only: true" containing the heading "### C003-REQ-004 — Lockout"
  When the user runs "$SDD lint"
  Then the report contains error "LINT-LIV-001" for "_living/CAP-auth.md"
```

## C001-REQ-123

#### C001-AC-123.1 — Bootstrap workspace upgraded losslessly
```gherkin
Scenario: C001-TS-129 — adopt the hand-written bootstrap
  Given the fixture "fx-bootstrap" = a copy of this repository's ".sdd/" at G1 approval
  When the user runs "$SDD status --write"
  Then "CHG-001" phase "00-ideation" keeps status "approved" and approved_hash "sha256:c9c7849f…"
  And the gate-log table in "change.md" is unchanged
  And SDD.md frontmatter "generator" starts with "architect-plugin@"
```

## C001-REQ-124

#### C001-AC-124.1 — Foreign folders tolerated
```gherkin
Scenario: C001-TS-130 — unknown metrics folder
  Given ".sdd/metrics/snapshots.jsonl" written by another tool
  When the user runs "$SDD lint" and "$SDD status --write"
  Then both commands exit with code 0 (assuming no other findings)
  And the lint report contains info "LINT-WS-002" naming "metrics/"
  And "snapshots.jsonl" is byte-identical afterwards
```

## C001-REQ-125

#### C001-AC-125.1 — change.md fields
```gherkin
Scenario: C001-TS-131 — manifest fields
  When the user runs "$SDD change new \"X\" --profile full --kind brownfield"
  Then "change.md" frontmatter validates against C001-IF-03 §2
  And "profile" = "full", "kind" = "brownfield", "phase" = "00-ideation"
  And the body contains the headings "Index" and "Gate log"
```

## C001-REQ-126

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

## C001-REQ-127

#### C001-AC-127.1 — Ideation blocked without approved constitution
```gherkin
Scenario: C001-TS-133 — G0 enforcement
  Given "constitution.md" with frontmatter "status: draft"
  When P-01 runs "/architect:ideate 001"
  Then the conductor does not dispatch any specialist
  And its reply names "_constitution/constitution.md" as unapproved and suggests "/architect:gate constitution"
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-101 | TS-101 | TS-102 (existing repo) | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-102 | TS-103 | n/a | n/a | n/a | n/a | TS-103 (re-run) | n/a |
| C001-REQ-103 | TS-104 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-104 | TS-105 | TS-106 (hand-edited registry) | n/a | TS-106 | n/a | n/a | n/a |
| C001-REQ-105 | TS-107 | TS-108 (user notes preserved) | TS-107 (archived excluded) | n/a | n/a | n/a | n/a |
| C001-REQ-106 | TS-109 | n/a | n/a | TS-109 | n/a | n/a | n/a |
| C001-REQ-107 | TS-110 | TS-111 (archived numbers) | TS-110 (first number) | n/a | n/a | n/a | n/a |
| C001-REQ-108 | TS-112 | n/a | TS-113 (slug limits, Unicode) | n/a | n/a | n/a | n/a |
| C001-REQ-109 | TS-114 | n/a | n/a | n/a | n/a | TS-114 (sequential calls) | n/a |
| C001-REQ-110 | TS-115 | n/a | n/a | TS-115 | n/a | n/a | n/a |
| C001-REQ-111 | TS-116 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-112 | TS-117 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-113 | TS-118 | n/a | n/a | TS-118 | n/a | n/a | n/a |
| C001-REQ-114 | TS-119 | n/a | TS-120 (≤ 2 rounds) | n/a | n/a | n/a | n/a |
| C001-REQ-115 | TS-121 | TS-121 (tools missing) | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-116 | TS-122 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-117 | TS-123 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-118 | TS-124 | n/a | n/a | TS-124 | n/a | n/a | n/a |
| C001-REQ-119 | TS-125 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-120 | TS-126 | n/a | n/a | TS-126 | n/a | n/a | n/a |
| C001-REQ-121 | TS-127 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-122 | TS-128 | n/a | n/a | TS-128 | n/a | n/a | n/a |
| C001-REQ-123 | TS-129 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-124 | TS-130 | n/a | n/a | n/a | n/a | n/a | TS-130 (foreign files untouched) |
| C001-REQ-125 | TS-131 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-126 | TS-132 | n/a | n/a | TS-132 | n/a | TS-132 (interrupted write) | n/a |
| C001-REQ-127 | TS-133 | n/a | n/a | TS-133 | TS-133 (G0 enforced) | n/a | n/a |

Per-column n/a reasons: *alternate/boundary/error* where marked n/a: the requirement has a single path with no limits or error branch. *Authorization*: local single-user tool; approval authority is covered where marked. *Concurrency*: single writer per change (C001-CON-11). *Abuse*: inputs are the user's own repository; injected instructions in repository or web content are covered by C001-NFR-205.
