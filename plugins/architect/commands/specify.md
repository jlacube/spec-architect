---
description: Run or resume the specification phase (10-spec) of a change.
argument-hint: "[<NNN>]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS`

1. Change: the `<NNN>` given; without one, the single active change whose ideation is approved
   and whose spec is not approved. If none or several qualify, ask P-01 which change (one
   interview round).
2. Load the `phase-spec` skill and follow it from its first step for that change. Its entry
   step refuses to start when `00-ideation` is not approved or is stale.
