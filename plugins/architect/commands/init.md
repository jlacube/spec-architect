---
description: Set up the .sdd/ workspace in this repository and draft the project constitution (gate G0).
argument-hint: ""
---

This command runs in the `architect:sdd-conductor` main session. If you are not that agent, reply that P-01 should start `claude --agent architect:sdd-conductor` and run the command there, and do nothing else.

1. Run `sdd init` (creates or completes `.sdd/`; it never overwrites existing files). Then run
   `sdd serena-config "${CLAUDE_PLUGIN_DATA}"` (Serena's data folder, as `/architect:doctor` does).
2. If `.sdd/_constitution/constitution.md` exists, report its status and stop: approve a draft
   with `/architect:gate constitution`.
3. Dispatch `sdd-cartographer` (code-discovery skill) for:
   - the toolchain record `.sdd/_constitution/toolchain.md` (always);
   - if the repository has code: the baseline survey `.sdd/_constitution/baseline-survey.md`
     (languages, size, test layout, build commands), and, when `.sdd/_living/` is empty, one
     inventory stub `.sdd/_living/CAP-<slug>.md` per detected capability (inventory only, no
     requirements).
   Use the survey to propose defaults.
4. **Constitution interview — at most two rounds** (interview-protocol skill), asking only what
   the sections below need: principles and quality bar; NFR defaults and forbidden technologies;
   global DoD items; profile thresholds; version control (commit `.sdd/` at each gate approval:
   recommend yes in a git repository); language and conventions. Recommend defaults P-01 can
   accept as they are. Log the rounds in `.sdd/_constitution/questions-log.md`.
5. Write `.sdd/_constitution/constitution.md` from the plugin template
   `${CLAUDE_PLUGIN_ROOT}/templates/constitution/constitution.md` with every section filled:
   Principles, Quality bar, NFR defaults, Global DoD (items `DOD-G-01`, `DOD-G-02`, …), Forbidden
   technologies, Profile thresholds, Version control, Language & conventions. Status `draft`.
6. Run `sdd status --write` and present gate G0: the constitution is approved through
   `/architect:gate constitution`; ideation cannot start before.
