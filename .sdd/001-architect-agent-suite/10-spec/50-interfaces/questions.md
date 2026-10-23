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

1. **Scope.** The answer decides which code paths, components or capabilities are in scope of
   the change (for example, whether a requirement applies to one entry point or to two).
2. **Public interface.** The answer decides the shape of an interface that the change exposes
   to consumers outside it: an API, a CLI, a file or message format, or a schema.
3. **Existing data.** The answer decides whether data that exists before the change is
   migrated, rewritten or deleted.
4. **General rule.** The specialist's work cannot be completed correctly without the answer.

Criteria 1 to 3 hold even when the specialist can complete its own artifact by covering every
option (for example, by surveying both entry points): the answer still decides what the later
authors write.

The conductor's handling is unchanged: it merges, orders and asks questions, and stops
unattended drafting, on the flag as returned (C001-REQ-209, C001-REQ-212, C001-REQ-213,
C001-REQ-220).

Origin: defect D-017, the C001-TS-215 eval trace (b4f18b7); P-01 Q-d017-01 "Fix now".
