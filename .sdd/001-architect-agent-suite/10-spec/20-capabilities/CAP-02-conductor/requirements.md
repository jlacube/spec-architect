---
id: C001-CAP-02
artifact: spec/requirements
capability: "Conductor and interview"
change: CHG-001
phase: 10-spec
status: approved
delta_default: ADDED
---

# C001-CAP-02 — Requirements

All `Delta: ADDED`. Interfaces: agent contract C001-IF-09, commands C001-IF-10, questions
contract C001-IF-05.

### C001-REQ-201 — Conductor as main-session agent
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL provide the agent `sdd-conductor`, defined per C001-IF-09 §A0, that runs as the main session when started with `claude --agent architect:sdd-conductor`.
- **Rationale:** Q5, D-01
- **Stories:** C001-US-201
- **Priority:** Must
- **Acceptance:** C001-AC-201.1

### C001-REQ-202 — Orientation before the first reply
- **Pattern:** event-driven
- **Statement:** WHEN the conductor starts in a repository that contains `.sdd/`, THE conductor SHALL read `SDD.md`, `registry.json` and the `change.md` of every non-archived change before its first reply, and state each such change's phase, phase status and proposed next action in that reply.
- **Rationale:** IDEA-§14.3 operating loop step 1
- **Stories:** C001-US-201
- **Priority:** Must
- **Acceptance:** C001-AC-202.1

### C001-REQ-203 — No workspace
- **Pattern:** unwanted-behaviour
- **Statement:** IF the conductor starts in a repository without `.sdd/`, THEN THE conductor SHALL propose `/architect:init` as its only next action.
- **Rationale:** G0 precedes all phases
- **Stories:** C001-US-201
- **Priority:** Must
- **Acceptance:** C001-AC-203.1

### C001-REQ-204 — Phase commands share the phase skills
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL provide the commands `/architect:ideate`, `/architect:specify` and `/architect:plan`, each of which loads the same phase skill (`phase-ideation`, `phase-spec`, `phase-plan`) that the conductor preloads for that phase.
- **Rationale:** OA-01 option C (one procedure, two doors)
- **Stories:** C001-US-202
- **Priority:** Must
- **Acceptance:** C001-AC-204.1, C001-AC-204.2

### C001-REQ-205 — Round size
- **Pattern:** event-driven
- **Statement:** WHEN the conductor asks P-01 for input, THE conductor SHALL use AskUserQuestion with at most four questions per call.
- **Rationale:** Q14
- **Note:** When the session offers no question tool, the round is asked as plain text per C001-REQ-222 (D-020).
- **Stories:** C001-US-203
- **Priority:** Must
- **Acceptance:** C001-AC-205.1

### C001-REQ-206 — Option presentation
- **Pattern:** event-driven
- **Statement:** WHEN the conductor asks a question with options other than the gate question of C001-REQ-802, THE conductor SHALL present two or three options, each with a one-sentence rationale, with the recommended option listed first and labelled "(Recommended)".
- **Rationale:** Q14, Q15; the gate question keeps its four fixed choices without a recommendation so that approval stays P-01's unprompted decision (defect D-002)
- **Stories:** C001-US-203
- **Priority:** Must
- **Acceptance:** C001-AC-206.1

### C001-REQ-207 — Options grounded in analysis
- **Pattern:** event-driven
- **Statement:** WHEN a question concerns a material decision (one that changes scope, architecture, an interface, an NFR threshold or a dependency), THE conductor SHALL derive the presented options from an options analysis of four or five candidates, recorded per C001-IF-05 with the rejected candidates and their reasons.
- **Rationale:** Q15; the user's stated decision method
- **Stories:** C001-US-203
- **Priority:** Must
- **Acceptance:** C001-AC-207.1

### C001-REQ-208 — Specialists return questions
- **Pattern:** event-driven
- **Statement:** WHEN a specialist agent needs information that only P-01 can provide, THE specialist SHALL return a `questions` block conforming to C001-IF-05 in its final message instead of assuming an answer.
- **Rationale:** OA-10, IDEA-P-06
- **Note:** `blocking` is set per C001-IF-05 `questions.md` §1 (D-017; Q-d017-01).
- **Stories:** C001-US-204
- **Priority:** Must
- **Acceptance:** C001-AC-208.1, C001-AC-208.2

### C001-REQ-209 — Merge and order questions
- **Pattern:** event-driven
- **Statement:** WHEN the conductor holds questions from more than one specialist, THE conductor SHALL merge questions with the same `topic` and intent into one, and order rounds so that every question with `blocking: true` is asked before any non-blocking question.
- **Rationale:** OA-10; IDEA-§15.4
- **Note:** Merging and ordering cover the questions the conductor holds when it forms a round; they are no reason to wait for specialists that are still running (C001-IF-05 `questions.md` §2; C001-REQ-221; D-019).
- **Stories:** C001-US-204
- **Priority:** Must
- **Acceptance:** C001-AC-209.1

### C001-REQ-210 — Questions log
- **Pattern:** event-driven
- **Statement:** WHEN P-01 answers an interview round, THE conductor SHALL append to the phase's `questions-log.md` the round number, date, each question with its options and recommendation, and P-01's answer verbatim, including free text.
- **Rationale:** auditability; IDEA-§11.2
- **Stories:** C001-US-206
- **Priority:** Must
- **Acceptance:** C001-AC-210.1

### C001-REQ-211 — Embedded instructions in answers
- **Pattern:** unwanted-behaviour
- **Statement:** IF an answer contains text beyond the selected option label, THEN THE conductor SHALL list each additional instruction it extracted, with its interpretation, in its next message to P-01.
- **Rationale:** C001-US-205 evidence from this session
- **Stories:** C001-US-205
- **Priority:** Must
- **Acceptance:** C001-AC-211.1

### C001-REQ-212 — Unattended mode assumptions
- **Pattern:** optional-feature
- **Statement:** WHERE P-01 has requested unattended drafting for the current phase, THE conductor SHALL apply the recommended option to each non-blocking question and mark each resulting statement in the artifacts with `[ASSUMPTION: <question-id>]`.
- **Rationale:** OQ-16
- **Stories:** C001-US-207
- **Priority:** Should
- **Acceptance:** C001-AC-212.1

### C001-REQ-213 — Unattended mode stops at gates and blockers
- **Pattern:** state-driven
- **Statement:** WHILE unattended drafting is active, THE conductor SHALL stop and wait for P-01 when it reaches a gate or a question with `blocking: true`.
- **Rationale:** IDEA-P-14; gates are never automatic
- **Note:** The conductor reaches a question with `blocking: true` when the specialist hand-back that holds it arrives, and asks it then per C001-REQ-221 (C001-IF-05 `questions.md` §2; critic CR-34).
- **Stories:** C001-US-207
- **Priority:** Must
- **Acceptance:** C001-AC-213.1, C001-AC-213.2

### C001-REQ-214 — Specialist brief content
- **Pattern:** event-driven
- **Statement:** WHEN the conductor dispatches a specialist, THE conductor SHALL include in the brief the change ID, phase, input file paths, ID blocks to use, output file paths, the quality references (skills/sections) that apply and the expected return contract.
- **Rationale:** predictable outputs; IDEA-§14.3
- **Stories:** C001-US-208
- **Priority:** Must
- **Acceptance:** C001-AC-214.1

### C001-REQ-215 — Paths, not contents
- **Pattern:** ubiquitous
- **Statement:** THE conductor SHALL reference workspace artifacts in specialist briefs by file path and ID rather than by pasting their content, except for excerpts of at most 40 lines needed to state a specific question.
- **Rationale:** cost control (IDEA-§19)
- **Stories:** C001-US-208
- **Priority:** Should
- **Acceptance:** C001-AC-215.1

### C001-REQ-216 — Parallel dispatch
- **Pattern:** event-driven
- **Statement:** WHEN two or more specialist tasks of a phase step have no input dependency on each other, THE conductor SHALL dispatch them in the same turn.
- **Rationale:** latency; IDEA-§10.3 fan-out
- **Stories:** C001-US-208
- **Priority:** Should
- **Acceptance:** C001-AC-216.1

### C001-REQ-217 — Spawn allowlist
- **Pattern:** ubiquitous
- **Statement:** THE `sdd-conductor` definition SHALL restrict agent spawning to the nine `sdd-*` specialists through an `Agent(...)` allowlist in its `tools` field.
- **Rationale:** IDEA-§14.2
- **Stories:** C001-US-208
- **Priority:** Must
- **Acceptance:** C001-AC-217.1

### C001-REQ-218 — No nesting below specialists
- **Pattern:** ubiquitous
- **Statement:** THE definitions of the nine specialist agents SHALL NOT grant the `Agent` tool.
- **Rationale:** predictable cost and question routing (IDEA-§14.2)
- **Stories:** C001-US-208
- **Priority:** Must
- **Acceptance:** C001-AC-218.1

### C001-REQ-219 — Visible phase plan
- **Pattern:** state-driven
- **Statement:** WHILE a phase is in progress in a conductor session, THE conductor SHALL keep the phase procedure steps with their status in the session task list (`TaskCreate`, `TaskUpdate`) when the session provides the task tools, and otherwise list the steps with their status in its message at each step change.
- **Rationale:** transparency for P-01
- **Stories:** C001-US-201
- **Priority:** Should
- **Acceptance:** C001-AC-219.1

### C001-REQ-220 — Interview fatigue guard
- **Pattern:** event-driven
- **Statement:** WHEN the conductor is about to start a sixth interview round within one phase, THE conductor SHALL include an option to resolve all remaining non-blocking questions with their recommended options.
- **Rationale:** IDEA-RK-10
- **Stories:** C001-US-209
- **Priority:** Should
- **Acceptance:** C001-AC-220.1

### C001-REQ-221 — Ask a blocking question when its hand-back arrives
- **Pattern:** event-driven
- **Statement:** WHEN a specialist hand-back that holds a question with `blocking: true` arrives, THE conductor SHALL ask that question through AskUserQuestion before it ends its turn and before it dispatches another specialist.
- **Rationale:** D-019 item 1; Q-t082-bugs-01; C001-IF-05 `questions.md` §2
- **Note:** Applies with and without unattended drafting (C001-REQ-213); specialists that are still running continue, and their later questions go to a later round (C001-IF-05 `questions.md` §2). When the session offers no question tool, the question is asked as plain text per C001-REQ-222 (D-020).
- **Stories:** C001-US-204, C001-US-207
- **Priority:** Must
- **Acceptance:** C001-AC-221.1

### C001-REQ-222 — Plain-text fallback without a question tool
- **Pattern:** unwanted-behaviour
- **Statement:** IF the session offers no question tool, THEN THE conductor SHALL ask its interview round or present its gate as plain text in its reply, with the content of C001-IF-05 `questions.md` §3, and end its turn instead of asking P-01 to enable a tool.
- **Rationale:** D-020; Q-noask-01; C001-IF-05 `questions.md` §3
- **Note:** Covers the rounds of C001-REQ-205, the asks of C001-REQ-221 and the gate of C001-REQ-802.
- **Stories:** C001-US-203
- **Priority:** Must
- **Acceptance:** C001-AC-222.1
