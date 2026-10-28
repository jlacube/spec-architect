---
id: C001-CAP-02
artifact: spec/stories
capability: "Conductor and interview"
change: CHG-001
phase: 10-spec
status: approved
id_block: { US: 201-299, REQ: 201-299, TS: 201-299 }
---

# C001-CAP-02 — Conductor and interview: user stories

### C001-US-201 — One entry point that drives the whole flow
- **As a** P-01 spec owner
- **I want** to start a single agent that knows where my change stands and takes me through ideation, spec and plan with gates
- **So that** I don't have to remember the procedure or which command comes next
- **Value / outcome:** a guided end-to-end flow (Q5 "main entry point"); C001-GOAL-01
- **Priority:** Must · **Size hint:** L · **Capability:** C001-CAP-02
- **Context & notes:** runs as the main session (`claude --agent architect:sdd-conductor`) because only the main session can use AskUserQuestion (D-01). `initialPrompt` is ignored for plugin agents, so orientation is part of the agent body (IDEA-§14.3).
- **Requirements:** C001-REQ-201, C001-REQ-202, C001-REQ-203, C001-REQ-219
- **Traces to:** Q5, OA-01, D-01

### C001-US-202 — Re-enter a specific phase directly
- **As a** P-01 spec owner
- **I want** commands to run or resume a single phase on a given change
- **So that** I can return to the spec or the plan later without replaying the whole flow
- **Value / outcome:** targeted re-entry (Q5 "can interact again with specific phases")
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-02
- **Context & notes:** the commands and the conductor share one procedure per phase through phase skills (OA-01 option C), so behaviour is identical whichever door is used. Revision semantics (stale propagation) are in C001-CAP-08.
- **Requirements:** C001-REQ-204
- **Traces to:** Q5, OA-01

### C001-US-203 — Batched, option-based questions with a recommendation
- **As a** P-01 spec owner
- **I want** questions in rounds of at most four, each with two or three researched options, the recommended one first and a short rationale for each
- **So that** I can decide quickly and well, and see why something is recommended
- **Value / outcome:** fast high-quality decisions (Q14); C001-GOAL-05
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-02
- **Context & notes:** The four-question limit comes from AskUserQuestion; options are pre-researched by the specialists, and the question contract is C001-IF-05.
- **Requirements:** C001-REQ-205, C001-REQ-206, C001-REQ-207, C001-REQ-222
- **Traces to:** Q14, Q15, IDEA-§15.4, D-020

### C001-US-204 — Specialists surface questions instead of assuming
- **As a** P-01 spec owner
- **I want** researchers, cartographers and authors to hand their open questions back to the conductor in a structured form
- **So that** nothing gets silently assumed by a subagent that cannot talk to me
- **Value / outcome:** no hidden assumptions (IDEA-P-06)
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-02
- **Context & notes:** OA-10 option A; JSON contract C001-IF-05.
- **Requirements:** C001-REQ-208, C001-REQ-209, C001-REQ-221
- **Traces to:** OA-10, D-01, D-019

### C001-US-205 — Free-text answers are read for embedded requests
- **As a** P-01 spec owner
- **I want** the conductor to notice when my answer adds instructions beyond the option I picked, and confirm how it understood them
- **So that** extensions such as "1 + also search for other tools" are acted on, not lost
- **Value / outcome:** fidelity to intent (this session: Q5, Q9, Q16, Q19, Spec-Q4 all carried extensions)
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-02
- **Context & notes:** Answers often carry extra instructions ("…and also rename X"); the conductor restates what it understood before acting, so nothing is silently dropped or invented.
- **Requirements:** C001-REQ-211
- **Traces to:** IDEA-§15.4 round rules

### C001-US-206 — Every question and answer is recorded
- **As a** P-04 validator
- **I want** a log of every interview round with the options offered and the answer given verbatim
- **So that** I can trace any requirement back to the decision that produced it
- **Value / outcome:** auditability (C001-GOAL-05)
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-02
- **Context & notes:** The questions log is the audit trail of every decision's origin (`questions-log.md`, one section per round); answers are copied verbatim, never paraphrased.
- **Requirements:** C001-REQ-210
- **Traces to:** Q15, P-03 (every claim has a source)

### C001-US-207 — Unattended drafting up to the next gate
- **As a** P-01 spec owner
- **I want** to tell the conductor "draft it with your recommendations, I'll review at the gate"
- **So that** I can let it work while I'm away, with every assumption flagged for review
- **Value / outcome:** throughput without losing control (OQ-16 default accepted)
- **Priority:** Should · **Size hint:** M · **Capability:** C001-CAP-02
- **Context & notes:** Unattended drafting still stops at the gate: recommendations are marked as such in the artifacts, and approval stays with P-01.
- **Out of scope:** passing gates unattended (never allowed, IDEA-P-14).
- **Requirements:** C001-REQ-212, C001-REQ-213, C001-REQ-221
- **Traces to:** OQ-16, D-019

### C001-US-208 — Efficient, well-briefed delegation
- **As a** P-01 spec owner
- **I want** the conductor to give specialists precise briefs, pass file paths instead of pasted content, run independent work in parallel and never let specialists spawn their own agents
- **So that** cost stays predictable and outputs land where they should
- **Value / outcome:** cost control (C001-SC-06); predictable behaviour
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-02
- **Context & notes:** Briefs pass file paths rather than content to keep the conductor's context small; only the conductor delegates (plugin agents get no agent-spawning tool, C001-IF-09).
- **Requirements:** C001-REQ-214, C001-REQ-215, C001-REQ-216, C001-REQ-217, C001-REQ-218
- **Traces to:** IDEA-§14.2, §19

### C001-US-209 — Interviews that end
- **As a** P-01 spec owner
- **I want** the interview to stop when the phase has what it needs, and to be offered a "use your recommendations" shortcut when rounds pile up
- **So that** I don't get interview fatigue
- **Value / outcome:** mitigates IDEA-RK-10
- **Priority:** Should · **Size hint:** S · **Capability:** C001-CAP-02
- **Context & notes:** Guards against interview fatigue (IDEA-RK-10): the conductor tracks what the phase still needs and offers the shortcut instead of asking further rounds.
- **Requirements:** C001-REQ-220
- **Traces to:** IDEA-RK-10
