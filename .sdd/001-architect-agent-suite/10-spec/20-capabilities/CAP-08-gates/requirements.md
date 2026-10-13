---
id: C001-CAP-08
artifact: spec/requirements
capability: "Gates, approvals and revisions"
change: CHG-001
phase: 10-spec
status: approved
delta_default: ADDED
---

# C001-CAP-08 — Requirements

All `Delta: ADDED`. Interfaces: gate summary and hash algorithm C001-IF-13, CLI C001-IF-01,
`approvals.json` C001-IF-03 §4. Phase names used by gates: `constitution` (G0),
`00-ideation` (G1), `10-spec` (G2), `20-plan` (G3).

### C001-REQ-801 — Gate summary command
- **Pattern:** event-driven
- **Statement:** WHEN `sdd gate show <change> <phase>` runs, THE sdd CLI SHALL print the gate summary defined in C001-IF-13 §1 (file list, ID counts per type, TR coverage, lint counts by severity, critic counts by severity, open markers, stale state).
- **Rationale:** IDEA-§18.2 step 3
- **Stories:** C001-US-801
- **Priority:** Must
- **Acceptance:** C001-AC-801.1

### C001-REQ-802 — Gate presentation
- **Pattern:** event-driven
- **Statement:** WHEN the conductor presents a gate, THE conductor SHALL show the gate summary and a plain-language statement of what approval commits to, and ask P-01 through AskUserQuestion to choose among Approve, Approve with waivers, Revise and Stop.
- **Rationale:** IDEA-§18.2 step 4
- **Stories:** C001-US-801
- **Priority:** Must
- **Acceptance:** C001-AC-802.1

### C001-REQ-803 — Verbatim approval note
- **Pattern:** event-driven
- **Statement:** WHEN P-01 chooses Approve or Approve with waivers, THE conductor SHALL run `sdd gate approve` passing P-01's complete answer text verbatim as the `--note` value.
- **Rationale:** attributable approvals
- **Stories:** C001-US-802
- **Priority:** Must
- **Acceptance:** C001-AC-803.1

### C001-REQ-804 — No self-approval
- **Pattern:** unwanted-behaviour
- **Statement:** IF the conductor has not received from P-01, in the current session, an answer choosing Approve or Approve with waivers for a gate, THEN THE conductor SHALL NOT run `sdd gate approve` for that gate.
- **Rationale:** IDEA-P-14
- **Stories:** C001-US-802
- **Priority:** Must
- **Acceptance:** C001-AC-804.1

### C001-REQ-805 — Approval record
- **Pattern:** event-driven
- **Statement:** WHEN `sdd gate approve <change> <phase>` succeeds, THE sdd CLI SHALL set the phase's `status: approved`, `approved_hash`, `approved_at` and `approved_by` in `change.md`, and append a row (date, gate, decision, note, waivers) to the Gate log table.
- **Rationale:** IDEA-§18.2 step 5
- **Stories:** C001-US-802
- **Priority:** Must
- **Acceptance:** C001-AC-805.1

### C001-REQ-806 — Approval hash algorithm
- **Pattern:** ubiquitous
- **Statement:** THE sdd CLI SHALL compute a phase approval hash with the algorithm of C001-IF-13 §2, which normalises each file (YAML frontmatter removed, line endings LF, trailing whitespace stripped), excludes generated files, and for a phase consisting of a single file yields the SHA-256 of that normalised file.
- **Rationale:** stable hashes (IDEA-RK-11); compatibility with the G1 hash recorded for CHG-001
- **Stories:** C001-US-802
- **Priority:** Must
- **Acceptance:** C001-AC-806.1, C001-AC-806.2

### C001-REQ-807 — Lint errors block approval
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd gate approve` is requested while the lint reports error-severity findings for that phase whose rule code or ID is not listed in `--waive`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-010` listing those findings.
- **Rationale:** OA-07 (lint is the hard gate)
- **Stories:** C001-US-803
- **Priority:** Must
- **Acceptance:** C001-AC-807.1

### C001-REQ-808 — Critic blockers block approval
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd gate approve` is requested while the phase's critic report contains a `blocker` finding whose finding ID is neither marked `resolved` nor listed in `--waive`, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-012` listing those findings.
- **Rationale:** OA-07
- **Stories:** C001-US-803
- **Priority:** Must
- **Acceptance:** C001-AC-808.1

### C001-REQ-809 — Waiver records
- **Pattern:** event-driven
- **Statement:** WHEN `sdd gate approve` succeeds with `--waive` items, THE sdd CLI SHALL record each waived item with the gate, the date and the `--note` text in the `waivers` list of `change.md` and of `registry.json`.
- **Rationale:** conscious, visible gaps
- **Stories:** C001-US-803
- **Priority:** Must
- **Acceptance:** C001-AC-809.1

### C001-REQ-810 — Stale detection
- **Pattern:** event-driven
- **Statement:** WHEN `sdd stale check` runs, THE sdd CLI SHALL set to `stale` every approved phase whose recomputed hash differs from its `approved_hash`, together with every approved phase that follows it in the same change.
- **Rationale:** IDEA-§10.7, §18.1
- **Stories:** C001-US-804
- **Priority:** Must
- **Acceptance:** C001-AC-810.1, C001-AC-810.2

### C001-REQ-811 — Phase entry enforcement
- **Pattern:** state-driven
- **Statement:** WHILE the predecessor phase of a phase is not `approved`, or is `stale`, THE conductor SHALL refuse to start that phase with a message naming the predecessor and its status.
- **Rationale:** IDEA-P-08 (generalises C001-REQ-127)
- **Stories:** C001-US-804
- **Priority:** Must
- **Acceptance:** C001-AC-811.1

### C001-REQ-812 — Revise command
- **Pattern:** event-driven
- **Statement:** WHEN `/architect:revise <phase> --reason "<text>"` runs, THE sdd CLI SHALL set that phase to `in-revision`, set every downstream approved phase to `stale`, and log the reason in the Gate log.
- **Rationale:** Q5 re-entry; IDEA-§10.7
- **Stories:** C001-US-805
- **Priority:** Must
- **Acceptance:** C001-AC-812.1

### C001-REQ-813 — Revision impact list
- **Pattern:** event-driven
- **Statement:** WHEN a revised phase is ready for its gate, THE conductor SHALL present the IDs added, modified and removed since the last approval (by per-ID content hash) and the downstream IDs that reference them.
- **Rationale:** focused re-review (IDEA-§10.7)
- **Stories:** C001-US-805
- **Priority:** Must
- **Acceptance:** C001-AC-813.1

### C001-REQ-814 — Per-ID hashes at approval
- **Pattern:** event-driven
- **Statement:** WHEN `sdd gate approve` succeeds, THE sdd CLI SHALL store in the change's `approvals.json` the content hash of every ID defined in the approved phase.
- **Rationale:** enables C001-REQ-813 and C001-REQ-714
- **Stories:** C001-US-802
- **Priority:** Must
- **Acceptance:** C001-AC-814.1

### C001-REQ-815 — Stopping a change
- **Pattern:** event-driven
- **Statement:** WHEN P-01 chooses Stop at a gate, THE sdd CLI SHALL set the change's `status` to `stopped` with the reason and date, after which the conductor treats the change as inactive.
- **Rationale:** IDEA-§18.2
- **Stories:** C001-US-806
- **Priority:** Should
- **Acceptance:** C001-AC-815.1

### C001-REQ-816 — Opt-in commit at approval
- **Pattern:** optional-feature
- **Statement:** WHERE `--commit` is passed to `sdd gate approve`, THE sdd CLI SHALL, after recording the approval, create one git commit that contains only the change folder and the workspace files `.sdd/SDD.md` and `.sdd/registry.json`, with the message `CHG-<NNN>: <gate> approved by <approver>`.
- **Rationale:** defect D-009 (P-01, 2026-10-13): agents never commit (their git access is read-only, C001-IF-07 §3), so the approved state reaches the history only if P-01 remembers; the deterministic CLI commits on P-01's opt-in, recorded in the constitution (Version control) and passed by the conductor
- **Stories:** C001-US-802
- **Priority:** Should
- **Acceptance:** C001-AC-816.1

### C001-REQ-817 — Commit preconditions
- **Pattern:** unwanted-behaviour
- **Statement:** IF `sdd gate approve --commit` is requested in a folder that is not a git repository or while other changes are staged, THEN THE sdd CLI SHALL refuse with error `ERR-CLI-018` before recording the approval.
- **Rationale:** defect D-009: the commit must never include P-01's unrelated staged work, and an approval without its commit would break the opt-in
- **Stories:** C001-US-802
- **Priority:** Should
- **Acceptance:** C001-AC-817.1
