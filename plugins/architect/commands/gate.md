---
description: Present the gate of a change's current phase (or of the constitution, G0) and record P-01's decision.
argument-hint: "[<NNN> | constitution]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS`

1. `constitution`: gate G0 on `.sdd/_constitution/constitution.md`.
2. Otherwise the change: the `<NNN>` given, or the single active change whose current phase is
   not approved (or is stale); if several qualify, ask P-01 which one (one interview round). The
   gate is that of its current phase: G1 `00-ideation`, G2 `10-spec`, G3 `20-plan`.
3. Load the `gate-protocol` skill and follow it: prepare, present, ask, record. Approve only on
   P-01's answer in this session.
