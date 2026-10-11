---
description: Run or resume the ideation phase (00-ideation) of a change.
argument-hint: "[<NNN>]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS`

1. Change: the `<NNN>` given; without one, the single active change whose current phase is
   `00-ideation`. If none or several qualify, ask P-01 which change (one interview round) and stop
   if there is none.
2. Load the `phase-ideation` skill and follow it from its first step for that change. Its
   entry step checks gate G0 (approved constitution).
