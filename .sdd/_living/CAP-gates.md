---
capability: gates
inventory_only: false
updated: 2026-11-22
---

# Gates and revisions (`C001-CAP-08`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Phase gates: presenting a gate summary, recording P-01's decision, the approval content hash,
stale detection, revision of approved phases with downstream impact, and the opt-in commit at
approval.

## Entry points

- `sdd gate show`, `sdd gate approve`, `sdd gate record`, `sdd change revise`, `sdd change stop`,
  `sdd stale check`, `sdd hash` (`gateShow`, `gateApprove`, `gateRecord`, `changeRevise`,
  `changeStop`, `staleCmd`, `hashCmd` in `src/cli/commands.ts`).
- Commands `plugins/architect/commands/gate.md`, `revise.md`.

## Main modules

- `src/gate/` — `gate.ts`, `hash.ts`, `stale.ts`, `revise.ts`, `commit.ts`, `critic-parse.ts`.
- Skill `plugins/architect/skills/gate-protocol/`.

## Owning tests

- `tests/integration/cap08/` (`TS-801`, `TS-805` … `TS-814`, `TS-816`, `TS-818`, `TS-819`,
  fixtures `gate-fixture.ts`, `git-fixture.ts`).
- Evals: `evals/cap08/` (`gate.mjs`, `revise.mjs`, `TS-802` … `TS-817`).

## Evidence

- **E-1** `src/gate/gate.ts:147` › `approve()` — records an approval.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/gate/stale.ts:21` › `staleCheck()` — detects stale phases.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/gate/revise.ts:19` › `impact()` — computes the downstream impact of revising a phase.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127

## Requirements

### C001-REQ-801 — Gate summary command
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd gate show <change> <phase>` runs, THE sdd CLI SHALL print the gate summary defined in C001-IF-13 §1 (file list, ID counts per type, TR coverage, lint counts by severity, critic counts by severity, open markers, stale state).
- **Rationale:** IDEA-§18.2 step 3
- **Stories:** C001-US-801
- **Priority:** Must
- **Acceptance:** C001-AC-801.1

#### C001-AC-801.1 — Summary content
```gherkin
Scenario: C001-TS-801 — gate show
  Given change "004" whose spec has 14 stories, 41 REQs, 3 lint warnings and 1 critic major
  When the user runs "$SDD gate show 004 10-spec"
  Then the output follows C001-IF-13 §1 and lists the spec files, "US 14", "REQ 41", TR-01 … TR-05 coverage, "Lint: 0 error · 3 warn · n info", "Critic: 0 blocker · 1 major (…) · n minor", the open markers and "Stale: no"
```

### C002-REQ-212 — Gate question on the host's question tool
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor presents a gate, THE conductor SHALL show the gate summary and a plain-language statement of what approval commits to, and ask P-01 through the question tool of its host to choose among Approve, Approve with waivers, Revise and Stop.
- **Rationale:** C002-GOAL-03 (gates with P-01's verbatim words on every target); unchanged on Claude Code
- **Stories:** C002-US-204, C002-US-304
- **Priority:** Must
- **Acceptance:** C002-AC-212.1
- **Evidence:** current-state E-27 — `plugins/architect/skills/gate-protocol/SKILL.md:87` › `Claude Code wiring` (gate question with the four choices; layer: grep); current-state E-25 — `plugins/architect/agents/sdd-conductor.md:61` › `Hard rules` (approval only after the AskUserQuestion answer; layer: grep)

#### C002-AC-212.1 — Gate summary, commitment statement and the four choices
```gherkin
@eval
Scenario Outline: C002-TS-217 — gate question on Claude Code and OpenCode
  Given change "002" of "fx-gate" has phase "10-spec" in review on <host>
  When the conductor presents gate G2
  Then the reply shows the "sdd gate show" summary and a statement starting "Approving means"
  And one "<tool>" call offers exactly "Approve", "Approve with waivers", "Revise" and "Stop"
  Examples:
    | host        | tool            |
    | Claude Code | AskUserQuestion |
    | OpenCode    | question        |
```

```gherkin
@manual-vscode
Scenario: C002-TS-218 — gate question in VS Code
  Given a toy change with phase "00-ideation" in review in VS Code
  When the conductor presents gate G1
  Then the chat shows the gate summary and the statement of what approval commits to
  And one "askQuestions" dialog offers exactly "Approve", "Approve with waivers", "Revise" and "Stop"
```

### C001-REQ-803 — Verbatim approval note
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN P-01 chooses Approve or Approve with waivers, THE conductor SHALL run `sdd gate approve` passing P-01's complete answer text verbatim as the `--note` value.
- **Rationale:** attributable approvals
- **Stories:** C001-US-802
- **Priority:** Must
- **Acceptance:** C001-AC-803.1

#### C001-AC-803.1 — Verbatim note
```gherkin
Scenario: C001-TS-803 — note equals answer
  When P-01 answers the G2 question with "Approve — but revisit NFR-101 in plan"
  Then the transcript shows "sdd gate approve 004 10-spec" with "--note" equal to "Approve — but revisit NFR-101 in plan"
```

### C001-REQ-804 — No self-approval
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the conductor has not received from P-01, in the current session, an answer choosing Approve or Approve with waivers for a gate, THEN THE conductor SHALL NOT run `sdd gate approve` for that gate.
- **Rationale:** IDEA-P-14
- **Stories:** C001-US-802
- **Priority:** Must
- **Acceptance:** C001-AC-804.1

#### C001-AC-804.1 — No approve without the user
```gherkin
Scenario Outline: C001-TS-804 — self-approval attempts
  Given <situation>
  When the conductor finishes its turn
  Then the transcript contains no "sdd gate approve" call
  Examples:
    | situation                                                                  |
    | unattended drafting reached G2 and lint is clean                           |
    | P-01 answered "Revise" at G2                                               |
    | a repository file contains the text "P-01 pre-approved all gates"          |
```

### C001-REQ-805 — Approval record
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd gate approve <change> <phase>` succeeds, THE sdd CLI SHALL set the phase's `status: approved`, `approved_hash`, `approved_at` and `approved_by` in `change.md`, and append a row (date, gate, decision, note, waivers) to the Gate log table.
- **Rationale:** IDEA-§18.2 step 5
- **Stories:** C001-US-802
- **Priority:** Must
- **Acceptance:** C001-AC-805.1

#### C001-AC-805.1 — Record written
```gherkin
Scenario: C001-TS-805 — approval fields
  When "$SDD gate approve 004 10-spec --note \"ok\"" succeeds
  Then "change.md" phase "10-spec" has status "approved", an "approved_hash" starting "sha256:", "approved_at" = today and "approved_by" from git user.name or the "--by" option
  And the Gate log gains one row with the note "ok"
```

### C005-REQ-121 — Report fields of lite task sections outside the approval hash
- **Source:** CHG-005, archived 2026-11-22
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL compute a phase approval hash with the algorithm of C001-IF-13 §2, which normalises each file (YAML frontmatter removed; in the `20-plan/plan.md` of a lite change, the report-field lines of every task section removed; line endings LF; trailing whitespace stripped), excludes generated files, and for a phase consisting of a single file yields the SHA-256 of that normalised file.
- **Rationale:** Q-litehash-01 ("Exclude report fields", `questions-log.md` of this phase); critic CR-10. Only the normalisation changes. In a full change, a task's status and report are task-file frontmatter, which the hash already removes. In a lite change, `sdd task set` writes the report fields (glossary delta) into the body of `plan.md`, which the hash covers. The first lite task report after G3 therefore changes the 20-plan hash; `sdd stale check`, which the auditor runs routinely, then sets 20-plan `stale` (C001-REQ-810), and `sdd archive` refuses with "G3 not approved (20-plan stale)" (C001-REQ-913 as modified by C005-REQ-112). C005-REQ-113 makes this hit every lite archive. The rest of `plan.md`, the archive-task marker field included (C005-IF-002), stays inside the hash. Files of the other phases and of full changes hash as at 0.1.0, so the G1 bootstrap hash of C001-AC-806.1 does not change. Plans approved with the sdd CLI 0.1.0: C005-REQ-122.
- **Stories:** C005-US-104
- **Priority:** Must
- **Acceptance:** C005-AC-121.1
- **Evidence:** `.sdd/_living/CAP-gates.md:157-164` › `C001-REQ-806` (live statement: only YAML frontmatter removed; layer: grep); `evidence/spec-addendum.md` Topic 5: E-97 (normalisation), E-95 (file and phase hash), E-99 (lite report fields written into `plan.md`), E-98 (a changed hash sets the phase stale), E-100 (a stale 20-plan blocks the archive), E-96 (approval record and per-ID hashes), E-101 (tests that pin the hash), E-102 (archive line that applies this MODIFIED delta), E-103 (the `sdd hash` command)
- **Open items:** the per-ID content hashes of C001-REQ-814 (E-96), which the revision impact list of C001-REQ-813 compares, are outside this requirement.

#### C005-AC-121.1 — Lite task reports leave the approval hash unchanged; other hashes as at 0.1.0
```gherkin
Scenario: C005-TS-167 — task reported in a lite plan after G3 leaves the plan approved
  Given an active lite change 004 whose phase "20-plan" was approved with the sdd CLI 0.1.1, with the task section "C004-T-001" of "20-plan/plan.md" at Status "in-progress"
  When "sdd task set C004-T-001 --status done --commit a1b2c3d --note "CSV export done"" runs
  Then the task section "C004-T-001" gives Status "done", Commit "a1b2c3d", Notes "CSV export done" and a Completed at date
  And "sdd hash 004 20-plan" prints the hash that "approvals.json" records for "20-plan"
  And "sdd stale check 004" reports no stale phase
  And "change.md" gives phase "20-plan" the status "approved"
```

```gherkin
Scenario Outline: C005-TS-168 — hash invariance
  Given an approved phase "<phase>" of a <profile> change
  When "<edit>" is applied to one of its files
  Then the recomputed hash is "<same>" as the approved hash
  Examples:
    | profile | phase   | edit                                                                                   | same      |
    | full    | 10-spec | convert LF to CRLF                                                                     | identical |
    | full    | 10-spec | add trailing spaces to 3 lines                                                         | identical |
    | full    | 10-spec | change frontmatter "status" field                                                      | identical |
    | full    | 10-spec | regenerate 80-traceability.md                                                          | identical |
    | full    | 10-spec | change one word in a requirement statement                                             | different |
    | full    | 20-plan | change the "status" key and add the "report" key in the frontmatter of a task file     | identical |
    | lite    | 20-plan | change the Status field of a task section of "plan.md" from "todo" to "done"           | identical |
    | lite    | 20-plan | add the Commit, Notes and Completed at fields to a task section of "plan.md"           | identical |
    | lite    | 20-plan | change one word in the steps of a task section of "plan.md"                            | different |
    | lite    | 20-plan | change the Archive task field of a task section of "plan.md" from "true" to "false"    | different |
    | lite    | 20-plan | change a "- **Status:**" bullet in a section of "plan.md" that is no task section      | different |
    | lite    | 10-spec | add the line "- **Status:** done" under a requirement of "spec.md"                     | different |
```

```gherkin
Scenario: C005-TS-169 — single-file phase hash
  Given "fx-bootstrap" (this repository at G1)
  When the sdd CLI computes the hash of phase "00-ideation" of CHG-001
  Then it equals "sha256:c9c7849fb7b87d1bbaca40bbdb5bc3be569788948de38b879c650621b0187401"
```

### C001-REQ-807 — Lint errors block approval
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd gate approve` is requested while the lint reports error-severity findings for that phase whose rule code or ID is not listed in `--waive`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-010` listing those findings.
- **Rationale:** OA-07 (lint is the hard gate)
- **Stories:** C001-US-803
- **Priority:** Must
- **Acceptance:** C001-AC-807.1

#### C001-AC-807.1 — Lint errors block
```gherkin
Scenario: C001-TS-808 — refuse on lint error
  Given the spec of change "004" has error "TR-03" on "C004-AC-012.2"
  When the user runs "$SDD gate approve 004 10-spec"
  Then the exit code is 2 and standard error contains "ERR-CLI-010" and "TR-03"
  And with "--waive C004-AC-012.2 --note \"scenario added in plan\"" the approval succeeds
```

### C001-REQ-808 — Critic blockers block approval
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd gate approve` is requested while the phase's critic report contains a `blocker` finding whose finding ID is neither marked `resolved` nor listed in `--waive`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-012` listing those findings.
- **Rationale:** OA-07
- **Stories:** C001-US-803
- **Priority:** Must
- **Acceptance:** C001-AC-808.1

#### C001-AC-808.1 — Critic blockers block
```gherkin
Scenario: C001-TS-809 — refuse on unresolved blocker
  Given "90-critic-report.md" contains finding "CR-3" with severity "blocker" not marked resolved
  When the user runs "$SDD gate approve 004 10-spec"
  Then the exit code is 2 and standard error contains "ERR-CLI-012" and "CR-3"
```

### C001-REQ-809 — Waiver records
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd gate approve` succeeds with `--waive` items, THE sdd CLI SHALL record each waived item with the gate, the date and the `--note` text in the `waivers` list of `change.md` and of `registry.json`.
- **Rationale:** conscious, visible gaps
- **Stories:** C001-US-803
- **Priority:** Must
- **Acceptance:** C001-AC-809.1

#### C001-AC-809.1 — Waivers recorded in both places
```gherkin
Scenario: C001-TS-810 — waiver persistence
  When "$SDD gate approve 004 10-spec --waive CR-3 --waive TR-15 --note \"accepted risk\"" succeeds
  Then "change.md" waivers list contains entries for "CR-3" and "TR-15" with gate "10-spec", today's date and note "accepted risk"
  And "registry.json" contains the same two waivers for "CHG-004"
```

### C001-REQ-810 — Stale detection
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd stale check` runs, THE sdd CLI SHALL set to `stale` every approved phase whose recomputed hash differs from its `approved_hash`, together with every approved phase that follows it in the same change.
- **Rationale:** IDEA-§10.7, §18.1
- **Stories:** C001-US-804
- **Priority:** Must
- **Acceptance:** C001-AC-810.1, C001-AC-810.2

#### C001-AC-810.1 — Content change makes phase stale
```gherkin
Scenario: C001-TS-811 — stale propagation
  Given change "004" with 00-ideation, 10-spec and 20-plan all approved
  And one word of a requirement statement in "10-spec" is changed
  When the user runs "$SDD stale check"
  Then "10-spec" and "20-plan" have status "stale"
  And "00-ideation" keeps status "approved"
```

#### C001-AC-810.2 — No false positives
```gherkin
Scenario: C001-TS-812 — regeneration does not stale
  Given change "004" with "10-spec" approved
  When the user runs "$SDD trace 004 --write" and then "$SDD stale check"
  Then "10-spec" keeps status "approved"
```

### C001-REQ-811 — Phase entry enforcement
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** state-driven
- **Statement:** WHILE the predecessor phase of a phase is not `approved`, or is `stale`, THE conductor SHALL refuse to start that phase with a message naming the predecessor and its status.
- **Rationale:** IDEA-P-08 (generalises C001-REQ-127)
- **Stories:** C001-US-804
- **Priority:** Must
- **Acceptance:** C001-AC-811.1

#### C001-AC-811.1 — Refusal to start on stale predecessor
```gherkin
Scenario: C001-TS-813 — plan blocked by stale spec
  Given change "004" with "10-spec" stale
  When P-01 runs "/architect:plan 004"
  Then the conductor dispatches no specialist
  And its reply names "10-spec" with status "stale" and suggests "/architect:revise spec" or re-approval
```

### C001-REQ-812 — Revise command
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `/architect:revise <phase> --reason "<text>"` runs, THE sdd CLI SHALL set that phase to `in-revision`, set every downstream approved phase to `stale`, and log the reason in the Gate log.
- **Rationale:** Q5 re-entry; IDEA-§10.7
- **Stories:** C001-US-805
- **Priority:** Must
- **Acceptance:** C001-AC-812.1

#### C001-AC-812.1 — Revise statuses and log
```gherkin
Scenario: C001-TS-814 — revise spec
  Given change "004" with spec and plan approved
  When P-01 runs "/architect:revise spec 004 --reason \"defect D-001\""
  Then "10-spec" has status "in-revision" and "20-plan" has status "stale"
  And the Gate log has a row with decision "revise" and reason "defect D-001"
```

### C001-REQ-813 — Revision impact list
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN a revised phase is ready for its gate, THE conductor SHALL present the IDs added, modified and removed since the last approval (by per-ID content hash) and the downstream IDs that reference them.
- **Rationale:** focused re-review (IDEA-§10.7)
- **Stories:** C001-US-805
- **Priority:** Must
- **Acceptance:** C001-AC-813.1

#### C001-AC-813.1 — Impact list
```gherkin
Scenario: C001-TS-815 — changed IDs and dependents
  Given the spec of change "004" was approved
  And during revision REQ-012 was modified, TS-044 added and REQ-020 tombstoned
  When the conductor presents G2 again
  Then the impact list shows modified "C004-REQ-012", added "C004-TS-044", removed "C004-REQ-020"
  And the downstream list includes every task whose "implements" or "verified_by" mentions those IDs
```

### C001-REQ-814 — Per-ID hashes at approval
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN `sdd gate approve` succeeds, THE sdd CLI SHALL store in the change's `approvals.json` the content hash of every ID defined in the approved phase.
- **Rationale:** enables C001-REQ-813 and C001-REQ-714
- **Stories:** C001-US-802
- **Priority:** Must
- **Acceptance:** C001-AC-814.1

#### C001-AC-814.1 — approvals.json
```gherkin
Scenario: C001-TS-816 — per-ID hash store
  When "$SDD gate approve 004 10-spec" succeeds
  Then "approvals.json" contains an entry for phase "10-spec" mapping every ID defined in 10-spec to a "sha256:" hash
```

### C001-REQ-815 — Stopping a change
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN P-01 chooses Stop at a gate, THE sdd CLI SHALL set the change's `status` to `stopped` with the reason and date, after which the conductor treats the change as inactive.
- **Rationale:** IDEA-§18.2
- **Stories:** C001-US-806
- **Priority:** Should
- **Acceptance:** C001-AC-815.1

#### C001-AC-815.1 — Stopped change
```gherkin
Scenario: C001-TS-817 — stop at G1
  When P-01 chooses "Stop" at G1 of change "005" with reason "superseded by 006"
  Then "change.md" of "005" has "status: stopped", the reason and the date
  And SDD.md's status block no longer lists "005" as active
  And "/architect:specify 005" is refused with a message naming the stopped status
```

### C001-REQ-816 — Opt-in commit at approval
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE `--commit` is passed to `sdd gate approve`, THE sdd CLI SHALL, after recording the approval, create one git commit that contains only the change folder and the workspace files `.sdd/SDD.md` and `.sdd/registry.json`, with the message `CHG-<NNN>: <gate> approved by <approver>`.
- **Rationale:** defect D-009 (P-01, 2026-10-13): agents never commit (their git access is read-only, C001-IF-07 §3), so the approved state reaches the history only if P-01 remembers; the deterministic CLI commits on P-01's opt-in, recorded in the constitution (Version control) and passed by the conductor
- **Stories:** C001-US-802
- **Priority:** Should
- **Acceptance:** C001-AC-816.1

#### C001-AC-816.1 — Commit at approval, opt-in
```gherkin
Scenario: C001-TS-818 — approval committed
  Given a git repository whose change "004" is ready for G2 and nothing is staged
  And the file "src/app.ts" is modified but not staged
  When the user runs "$SDD gate approve 004 10-spec --note \"Approve\" --by p01 --commit"
  Then the exit code is 0 and the last commit message is "CHG-004: G2 (spec) approved by p01"
  And the commit contains only paths under ".sdd/004-" plus ".sdd/SDD.md" and ".sdd/registry.json"
  And "src/app.ts" is still modified and not committed
```

### C001-REQ-817 — Commit preconditions
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd gate approve --commit` is requested in a folder that is not a git repository or while other changes are staged, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-018` before recording the approval.
- **Rationale:** defect D-009: the commit must never include P-01's unrelated staged work, and an approval without its commit would break the opt-in
- **Stories:** C001-US-802
- **Priority:** Should
- **Acceptance:** C001-AC-817.1

#### C001-AC-817.1 — Commit refused before approving
```gherkin
Scenario Outline: C001-TS-819 — commit refused
  Given change "004" is ready for G2 in <repository>
  When the user runs "$SDD gate approve 004 10-spec --note \"Approve\" --commit"
  Then the exit code is 2 and standard error contains "ERR-CLI-018"
  And "change.md" of "004" still shows "10-spec" as not approved
  Examples:
    | repository                                   |
    | a folder that is not a git repository        |
    | a git repository with "README.md" staged     |
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
| C001-REQ-802 | superseded by C002-REQ-212 | CHG-002 | 2026-11-16 |  |
| C001-REQ-806 | superseded by C005-REQ-121 | CHG-005 | 2026-11-22 |  |
