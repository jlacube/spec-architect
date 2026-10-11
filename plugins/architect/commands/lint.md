---
description: Run the deterministic checks (lint and traceability) of one change or of the whole workspace.
argument-hint: "[<NNN>]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS`

Run `sdd lint $ARGUMENTS`, then `sdd trace <NNN> --write` for the change given (or for each
active change). Show the counts and the findings grouped by file. No specialist work and no
edits besides the generated trace files.
