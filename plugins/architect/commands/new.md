---
description: Create a change — propose the lite or full profile from a size estimate, confirm it with P-01, then create the change folder.
argument-hint: "\"<title>\" [--kind greenfield|brownfield|mixed]"
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

Arguments: `$ARGUMENTS` — the change title in quotes, optional `--kind`.

1. Without a title, ask P-01 for one and stop. Without `.sdd/`, propose `/architect:init` and stop.
2. Read the **Profile thresholds** of `.sdd/_constitution/constitution.md` (defaults when
   absent: lite when expected user stories ≤ 3, requirements ≤ 10 and touched modules ≤ 2). For a
   brownfield or mixed change, look at the repository (read-only) to estimate the touched modules.
3. Estimate expected user stories, requirements and touched modules from the title and the
   conversation. Ask **one** interview round (interview-protocol skill) whose question offers the
   proposed profile first, labelled "(Recommended)", with the estimate and the thresholds in
   its description; the other profile second. Ask about the kind in the same round when
   `--kind` was not given and the repository has code.
4. Only after P-01 answers: `sdd change new "<title>" --profile <lite|full> --kind <kind>`, then
   `sdd status --write`. No change folder exists before the answer.
5. Reply with the change ID, folder, profile and the next action (`/architect:ideate <NNN>`).
