---
id: C001-CAP-08
artifact: spec/stories
capability: "Gates, approvals and revisions"
change: CHG-001
phase: 10-spec
status: approved
id_block: { US: 801-899, REQ: 801-899, TS: 801-899 }
---

# C001-CAP-08 — Gates, approvals and revisions: user stories

### C001-US-801 — A gate summary I can decide on
- **As a** P-01 spec owner
- **I want** each gate presented as a summary of what was produced, the objective check results, the critic findings, the open items and what exactly I'm approving
- **So that** I can approve, waive, ask for revision or stop with full information and little reading
- **Value / outcome:** Q13; IDEA-§18.2
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-08
- **Context & notes:** The summary format is C001-IF-13 §1; the conductor adds in plain words what approval commits to and asks through AskUserQuestion.
- **Requirements:** C001-REQ-801, C001-REQ-802
- **Traces to:** Q13, IDEA-§18.2

### C001-US-802 — Only I can approve, and the approval is pinned
- **As a** P-01 spec owner
- **I want** approvals to happen only on my explicit answer, recorded with my words, the date and a content hash
- **So that** an approved artifact cannot change silently and the approval is attributable
- **Value / outcome:** IDEA-P-14; C001-GOAL-06
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-08
- **Context & notes:** for CHG-001's G1, the hash was computed over the ideation body without frontmatter, LF-normalised, trailing whitespace stripped. The CLI must adopt a compatible algorithm (C001-REQ-806, C001-REQ-123).
- **Requirements:** C001-REQ-803, C001-REQ-804, C001-REQ-805, C001-REQ-806, C001-REQ-814, C001-REQ-816, C001-REQ-817
- **Traces to:** Q13, IDEA-§18.2, change.md gate log

### C001-US-803 — Hard checks block approval unless explicitly waived
- **As a** P-01 spec owner
- **I want** lint errors, critic blockers and open clarification markers to block approval unless I waive them by name with a reason
- **So that** known gaps are conscious decisions, visible later
- **Value / outcome:** IDEA-§18.2 "approve with waivers"
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-08
- **Context & notes:** Waivers name the rule code, finding ID or question ID and carry the note; they are recorded in `change.md` and `registry.json` (C001-REQ-809).
- **Requirements:** C001-REQ-807, C001-REQ-808, C001-REQ-809
- **Traces to:** OA-07, IDEA-§18

### C001-US-804 — Detect artifacts changed after approval
- **As a** P-04 validator
- **I want** approved phases to become stale automatically when their content changes, and downstream phases with them
- **So that** nobody builds on an approval that no longer matches the text
- **Value / outcome:** IDEA-P-08
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-08
- **Context & notes:** Staleness is detected by recomputing the approval hash of C001-IF-13 §2 (frontmatter and whitespace excluded), so cosmetic edits do not stale a phase.
- **Requirements:** C001-REQ-810, C001-REQ-811
- **Traces to:** Q13, IDEA-§10.7

### C001-US-805 — Revise a phase with a focused impact list
- **As a** P-01 spec owner
- **I want** to reopen any phase with a reason and get the list of IDs that changed and everything downstream that depends on them
- **So that** I re-review only what's affected instead of everything
- **Value / outcome:** Q5 re-entry; IDEA-§10.7
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-08
- **Context & notes:** The impact list compares per-ID content hashes stored at approval (C001-REQ-814) with the current ones, so only changed IDs and their dependants are re-reviewed.
- **Requirements:** C001-REQ-812, C001-REQ-813
- **Traces to:** Q5, IDEA-§10.7, §20.3

### C001-US-806 — Stop a change cleanly
- **As a** P-01 spec owner
- **I want** to stop a change at any gate with a reason
- **So that** abandoned ideas are recorded as such and don't clutter the active list
- **Value / outcome:** the "stop" verdict (C001-REQ-318) has a consequence
- **Priority:** Should · **Size hint:** S · **Capability:** C001-CAP-08
- **Context & notes:** A stopped change stays in the workspace for reference; commands that would modify it are refused (ERR-CLI-014).
- **Requirements:** C001-REQ-815
- **Traces to:** IDEA-§18.2 option "Reject/stop"
