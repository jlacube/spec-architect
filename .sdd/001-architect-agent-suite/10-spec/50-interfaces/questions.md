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
