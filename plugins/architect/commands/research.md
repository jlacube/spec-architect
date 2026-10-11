---
description: Ad-hoc research question answered by the researcher, stored as a research note of a change.
argument-hint: "\"<question>\" [--change <NNN>]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS` — the question in quotes, optional `--change <NNN>`.

1. Change: the one named by `--change`; without it, the single active change. When several
   changes are active, ask P-01 which one (one interview round) **before** dispatching anything.
2. Allocate the note number with `sdd id next R --change <NNN>` and dispatch `sdd-researcher`
   with a brief (brief template of the phase-ideation skill): the question, the output path
   `.sdd/<NNN>-<slug>/00-ideation/research/R-<seq>-<slug>.md`, the research-protocol skill as quality
   bar and the return contract.
3. Wait for the hand-back; interview on its questions block if any. Reply with the note path
   and its conclusion in two lines.
   If `00-ideation` is already approved, the new file makes it `stale` (and later phases with it):
   say so and propose re-approval with `/architect:gate <NNN>` (content accepted as is).
