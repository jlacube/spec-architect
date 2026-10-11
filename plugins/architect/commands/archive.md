---
description: Merge an implemented change into the living specs (_living/) and move it to _archive/ — preview first, then apply on P-01's confirmation.
argument-hint: "<NNN> [--dry-run]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS` — the change number and an optional `--dry-run`. Load the sdd-conventions skill.

1. **Preview.** Run `sdd archive <NNN> --dry-run`. On `ERR-CLI-009` (G3 not approved, tasks not
   done or dropped, open defects, a cited requirement missing from `_living/`), show the list and
   stop: archiving needs every item resolved first.
2. Show P-01 the planned operations as returned (living file, operation, ID). With `--dry-run`,
   stop here.
3. **Confirm** in one AskUserQuestion round: "Apply the archive of CHG-<NNN>?" with the options
   Apply (Recommended) and Cancel. Anything other than Apply ends the command without changes.
4. **Apply.** Run `sdd archive <NNN>` and report its last line (`archived: …`) and the living
   files written.
