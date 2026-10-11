---
description: Reopen an approved (or stale) phase of a change for revision; later phases become stale.
argument-hint: "<ideation|spec|plan> [<NNN>] --reason \"<text>\""
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS` — the phase (`ideation` → `00-ideation`, `spec` → `10-spec`, `plan` → `20-plan`), optional change number, and `--reason` (required: ask P-01 for it in one interview round when it is missing).

1. Change: the `<NNN>` given, or the single active change; otherwise ask which one.
2. Run `sdd change revise <NNN> <phase> --reason "<reason, verbatim>"`. The phase goes
   `in-revision`, every later approved phase `stale`, and the Gate log records the reason. Open
   defects that reference IDs of this phase are the usual reason: name them.
3. Load the gate-protocol skill and the phase skill of that phase (phase-ideation, phase-spec or
   phase-plan) and continue its procedure from the step that owns the IDs to change. Rework only
   the affected files; the critic re-reviews the changed IDs and the IDs linked to them.
4. When the revision is ready, present the gate: `sdd gate show` lists the impact (IDs added,
   modified, removed since the last approval, and the downstream IDs that reference them); show it.
   After approval, close the defects it resolves (`sdd defect close <D-id> --change <NNN>
   --resolution "<text>"`) and run `sdd stale check <NNN>`; the later phases are re-approved or
   revised in turn.
