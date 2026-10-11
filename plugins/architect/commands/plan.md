---
description: Run or resume the planning phase (20-plan) of a change.
argument-hint: "[<NNN>]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS`

1. Change: the `<NNN>` given; without one, the single active change whose spec is approved and
   whose plan is not approved. If none or several qualify, ask P-01 which change (one interview
   round).
2. Entry check before anything else: run `sdd stale check <NNN>` and read `change.md`. If
   `10-spec` is not `approved` (or is `stale`), dispatch no specialist and write nothing; reply
   naming `10-spec` and its status, and propose `/architect:revise spec <NNN>` (content must
   change) or re-approval with `/architect:gate <NNN>` (content accepted as is).
3. Load the `phase-plan` skill and follow it from its first step for that change.
