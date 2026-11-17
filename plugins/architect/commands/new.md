---
description: Create a change — propose the lite or full profile from a size estimate, confirm it with P-01, then create the change folder.
argument-hint: "\"<title>\" [--kind greenfield|brownfield|mixed]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS` — the change title in quotes, optional `--kind`.

1. Load the phase-ideation skill and run its section **New change** with the title above and, when
   given, the `--kind` of this command (P-01's own answer: the kind is then not asked again).
2. End as that section ends: the change ID, folder and profile, and the next action
   (`/architect:ideate <NNN>`).
