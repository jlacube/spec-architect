---
description: Ad-hoc decision — options analysis, one interview question, and a DEC record (ADR in the plan phase).
argument-hint: "\"<question>\" [--change <NNN>]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS` — the decision question in quotes, optional `--change <NNN>`.

1. Change: as for `/architect:research` (`--change`, else the single active change, else ask).
2. Dispatch `sdd-options-analyst` for an options analysis of the question (options-analysis
   skill; `OA-<seq>` from `sdd id next OA --change <NNN>`).
3. Present the result as **one** interview question (interview-protocol skill): the presented
   candidates, recommendation first.
4. Record P-01's answer: when the change's current phase is `20-plan`, as an ADR
   `20-plan/20-decisions/ADR-<seq>-<slug>.md` (`sdd id next ADR`); otherwise as a decision record
   `00-ideation/decisions/DEC-<seq>-<slug>.md` (`sdd id next DEC`), with P-01's words verbatim.
   If the record lands in an approved phase, the new file makes that phase `stale` (and later phases with it):
   say so and propose re-approval with `/architect:gate <NNN>` (content accepted as is).
