---
id: C001-IF-05
artifact: spec/interface
kind: conventions
change: CHG-001
phase: 10-spec
status: approved
---

# C001-IF-05 — Interview questions contract: field rules

`questions.schema.json` fixes the shape of a questions block. This file holds the field rules
that the schema cannot check.

## §1 When a question is blocking

A specialist sets `blocking: true` on a question when at least one of these holds, and
`blocking: false` otherwise:

1. **Scope.** The answer decides which code paths, entry points or components are in scope of
   the change.
2. **Stated answer.** Without the answer, the specialist would have to state the answer as a
   fact or as an assumption in its artifact.

For a criterion 1 question, covering every option in the artifact (for example, surveying both
entry points) counts as an assumption, so the question stays blocking. For any other question,
covering every option is not an assumption.

The conductor merges, orders and asks questions, and stops unattended drafting, on the flag as
returned (C001-REQ-209, C001-REQ-212, C001-REQ-213, C001-REQ-220); §2 fixes when it asks a
blocking question.

Origin: defect D-017, the C001-TS-215 eval trace (b4f18b7); P-01 Q-d017-01 "Fix now" and
Q-blocking-scope-01 "Scope only + decidable rule (Recommended)" (critic CR-26, CR-27).

## §2 When the conductor asks a blocking question

When a specialist's hand-back that holds a question with `blocking: true` arrives, the conductor
asks that question through AskUserQuestion before it ends its turn and before it dispatches
another specialist. It does not wait for specialists that are still running: they continue, and
the questions of their later hand-backs go to a later round. Merging and ordering
(C001-REQ-209) apply to the questions the conductor holds at that moment. The rule holds in
attended and in unattended drafting.

Origin: defect D-019 item 1, the C001-TS-215 trace of `t082-d018` (hand-back with a blocking
question at 235 s, turn ended at 238 s "waiting for the spec writer", session capped at 554 s
with the question unasked); P-01 Q-t082-bugs-01 "Fix all 3 now (Recommended)".

## §3 Without a question tool

The question tool is AskUserQuestion on Claude Code, and its counterpart on a generated target
(`question` on OpenCode, `ask_user` on Copilot; C002-IF-001). When the session offers no
question tool, because the tool is absent from the session's tools or a call to it is refused,
the conductor asks in plain text in its reply:

1. **Same content.** The reply carries what the tool call would carry. For a question round,
   that is each question with its options, the recommended option first and labelled
   "(Recommended)", and at most four questions (C001-REQ-205, C001-REQ-206). For a gate, it is
   the gate summary, the statement of what approval commits to, and the four choices numbered
   1 Approve, 2 Approve with waivers, 3 Revise and 4 Stop, without a recommendation
   (C001-REQ-802; C001-IF-13 §1).
2. **Answer.** The conductor then ends its turn and takes P-01's next message as the answer,
   logged verbatim (C001-REQ-210).
   - **At a gate:** the message records a decision (C001-REQ-803, C001-REQ-804) only when it picks
     exactly one of the four choices, by its label or its number. Text beyond that choice is
     handled per C001-REQ-211. The label "Approve" inside "Approve with waivers" picks Approve
     with waivers. A message that negates a choice, names two choices or names none records
     nothing, and the conductor presents the choices again.
   - **In a question round:** each question the message leaves unanswered stays open.

   These rules are verified by review; C001-TS-226 checks only the first reply.
3. **No detour.** The conductor never tells P-01 to enable a tool instead of asking.

The fallback applies to the asks of §2 (C001-REQ-221), to interview rounds and to gate
presentation.

Origin: defect D-020. In C002-T-071, Copilot CLI ran with `--no-ask-user`. At G2 of change 004
in INJ-19 and INJ-21 (`t071`, 2026-10-28), the conductor replied "I can't present the G2 gate …
The `ask_user` question tool isn't available in this session" and listed `INSTALL.md` steps to
enable it, instead of presenting the gate. P-01 answered Q-noask-01 with "Text fallback + 0.0.3
(Recommended)".
