# Revision digest — defects D-051 … D-053 (CHG-002)

Working list for the spec/plan revision of 2026-11-11 (gate records 10-spec revise and 20-plan
revise). Source: the T-050 findings pass of 2026-11-11 on VS Code 1.145.2 with GitHub Copilot Chat
0.73.0 (Local session type, Claude Sonnet 5.5), run by the conductor for P-01; notes in
`C:\Sandbox\runs\t050b\t050-notes.md` (not in the repository; the facts below are the record).
Owners: SW spec-writer, TD test-designer, AR architect, PL planner. The findings pass was
non-binding: C002-T-050 runs again, clean, as a later run after this revision (the same date allowed: plan revision of 2026-11-11).

## P-01 decision

- **D-052 / C002-REQ-327** — P-01, 2026-11-11, answer "1, go ahead with the revision" to the
  question "what should the package promise about subagent edits on VS Code?", option 1 "Rely on
  confinement and say so (Recommended)": on VS Code the bar rests on the confinement that held in
  the run (the specialists' tool lists hold no generic edit or terminal tool; the conductor delegates
  only to the nine specialists; the sdd MCP server guard); the hook-denial promise for VS Code is
  dropped and stated as a known limitation in the install notes; the delegated-edit steps VSC-27 and
  VSC-28 become refusal and confinement checks; no hold of the 0.1.0 release. Rejected: hold the
  Copilot release until VS Code sends `agent_type` (option 2); find another subagent signal, such as
  the transcript the hook receives (option 3, research with an uncertain result).

## Facts of the run (evidence)

1. **Question tool (D-051).** VS Code 1.145.2 Local session type: the question tool is
   `vscode_askQuestions`, `toolReferenceName: "askQuestions"`, legacy full names
   `vscode_askQuestions` and `vscode/askQuestions` (workbench.desktop.main.js of 1.145.2).
   `ask_user` is a Copilot CLI tool (Copilot Chat extension: CopilotCLISession). The package lists
   `ask_user` only (`targets/copilot.json` tool map `AskUserQuestion: ["ask_user"]`), so the conductor
   said "Question tools are not available in this session, so I'm asking as plain text" and every
   round fell back to text. With `askQuestions` and `vscode/askQuestions` added to the toy's
   `.github/agents/sdd-conductor.agent.md` `tools` (scratch), dialogs worked for `/init` rounds, G0,
   `/new`, ideation rounds, a five-question request (calls of 4 + 1) and G1. Input schema:
   `{ questions: [{ header, question, options: [{ label, description, recommended }], multiSelect,
   allowFreeformInput }] }`. Result: `{ answers: { "<header>": { selected: [<labels>], freeText:
   <string|null>, skipped: <bool> } } }`. A dismissed dialog (X) returned no choice; the conductor
   recorded nothing. This refutes S-08 F-5 ("the question tool is `ask_user` in the Local agent
   host") on the tested build.
2. **Auto-reply (D-051, D-053).** VS Code 1.145.2: enabling `chat.tools.global.autoApprove` shows a
   consent dialog stating the setting "only controls tool approval and does not prevent the agent
   from asking questions. To automatically answer agent questions, use the `chat.autoReply`
   setting." With `chat.autoReply` true, `askQuestions` returned `{ selected: [], freeText: "The user
   is not available to respond and will review your work later. Work autonomously and make good
   decisions.", skipped: false }`. The conductor treated it as no answer (VSC-20: questions log
   unchanged; VSC-29: "No decision was received for Gate G1 … I ran no gate command").
3. **No `agent_type` on PreToolUse (D-052).** "GitHub Copilot Chat Hooks" log: 436 of 436 PreToolUse
   inputs carry `timestamp, hook_event_name, session_id, transcript_path, tool_name, tool_input,
   tool_use_id, cwd` and no `agent_type`, also for calls made inside subagents (critic, cartographer,
   auditor, and a default-agent subagent). Only SubagentStop inputs carry `agent_id` and
   `agent_type` (`sdd-critic`, `sdd-cartographer`, `sdd-auditor`, `default`). `decideCopilot`
   (`src/hooks/…`, bundled `sdd.mjs`) allows input without `agent_type`, so a default-agent subagent
   appended `// injected` to `src/app.ts` (reverted). Refutes A-5 and the plugin-level half of S-08
   F-4 on 1.145.2. Consequences: the hook denial of C002-REQ-327 … C002-REQ-329 (C002-TS-619,
   VSC-27, VSC-28) cannot happen on VS Code 1.145.2; under the Copilot hooks fallback
   (`copilot-hooks`) the Architect agents' calls also arrive without `agent_type` and pass
   (decideArchitect never runs), so that fallback gives no guard on VS Code 1.145.2.
4. **What held (D-052).** The conductor refused to start `general-purpose` ("I only delegate to the
   nine SDD specialists") and refused to brief a specialist for work outside `.sdd/` (VSC-22, VSC-27,
   VSC-54). A default-agent `runSubagent` with `agentName: sdd-spec-writer` (A-1 confirmed: a
   `user-invocable: false` agent starts as a subagent) listed its tools: `file_search, grep_search,
   get_errors, copilot_getNotebookSummary, list_dir, read_file, read_notebook_cell_output,
   semantic_search, session_store_sql, view_image, vscode_listCodeUsages, explore_subagent,
   get_task_output, mcp_sdd-mcp_replace_text, mcp_sdd-mcp_write_file, mcp_sdd-mcp2_run_command,
   terminal_last_command, terminal_selection` — no generic edit tool, no terminal tool; its edit of
   `src/app.ts` was denied `GUARD-PATH-001` by the sdd MCP server; `git status` ran through the
   command tool; `src/app.ts` unchanged (VSC-54 confinement holds).
5. **SessionStart output (D-053).** The hook ran (5.2 s) and printed the plain-text brief. Copilot
   Chat 0.73.0 (`executeSessionStartHook`) adds context only from a JSON object output
   `{ hookSpecificOutput: { additionalContext } }`; plain text is ignored. The conductor answered
   "what is the status?" by reading the files itself (VSC-21 passed literally). The same extension
   also runs SubagentStart hooks with `additionalContext`.
6. **Slash names (D-053).** Plugin prompt files register as `architect:<name>` (Customizations >
   Prompts > Plugins). VS Code has its own built-in `/init` (generates AGENTS.md /
   `.github/copilot-instructions.md`); a message `/init` with the Architect init prompt attached was
   answered as the built-in task. VSC-12 (P-01, typing `/`) confirms what the list shows.
7. **MCP servers on demand (D-053).** After the first message only `sdd-shell` ran; `sdd-files`,
   `serena`, `context7`, `deepwiki` showed "Start" until a tool of theirs was used (VSC-11 failed;
   A-8's "after the first message" wording refuted). Serena ran when the cartographer called it.
8. **Model (D-053).** A new window resets the model picker to "Auto" (routes to GPT-6 Luna); the
   answering model shows in each reply's footer. On Auto the conductor skipped the doctor probes once.
   INSTALL.md says the picker shows the model.
9. **Tool ids (D-053).** MCP tool ids: `mcp_sdd-mcp_write_file`, `mcp_sdd-mcp_replace_text`,
   `mcp_sdd-mcp2_run_command`, `mcp_serena_*` (named after the server command, a numeric suffix for
   the second server of the same command); the agent-file references `sdd-files/*`, `sdd-shell/*`
   work. The tool references `#sdd-files-write_file` / `#sdd-shell-run_command` resolved.
10. **Guard twice (D-053, observation).** Every PreToolUse runs two guard commands (plugin
    `hooks.json` and `.github/hooks/architect-guard.json`), about 3 s each.
11. **Run method (D-053, run sheet).** `code chat` sends `/name` as plain text (no prompt-file
    expansion); attaching the prompt file with `-a` and wording "Follow the attached Architect
    <name> prompt" works.
12. **Not defects (record only).** Doctor rows Context7 / DeepWiki `unreachable` without a probe
    (accepted on defect D-012: the conductor holds neither tool). G0 approval makes no commit and the
    conductor suggested `sdd gate approve --commit` (shared conductor text, Claude Code too) and
    `sdd trace <NNN> --write` exits 1 at G1 on a lite change whose 10-spec scaffold has placeholder
    IDs: both are follow-ups for CHG-004 (open items), not this revision.

## Decisions for the revision

- **D-051 question tool.** The Copilot mapping table maps `AskUserQuestion` to both tools
  (`ask_user` for Copilot CLI, `askQuestions` for the VS Code Local session type); the body
  replacement names "the question tool (`askQuestions` in VS Code, `ask_user` in Copilot CLI)"; the
  wiring of the interview and gate protocols states the `askQuestions` input and result shape above,
  and that a result whose free text is the host's auto-reply text, or that has no selected label and
  no free text, is no answer. Implementation must show that Copilot CLI accepts the extra name in an
  agent's `tools` list (one Copilot CLI eval case on the new candidate) — AR (mapping-tables IF-001
  §6.1, target-packages), SW (REQ-304 and any requirement naming `ask_user` as the VS Code tool),
  TD (TS naming `ask_user` dialogs in VS Code), PL (task).
- **D-052 subagent guard on VS Code.** C002-REQ-327 … 329 stay for hosts that send `agent_type`
  (Copilot CLI; a later VS Code). On VS Code 1.145.2 they cannot act; the bar on VS Code rests on
  C002-REQ-306 (tool lists), the conductor's grant (delegates only to the nine specialists) and the
  sdd MCP server guard (C002-IF-002). State the gap: the install notes (REQ-304) name the known
  limitation (a non-Architect subagent, for example one the user's own default agent starts, is not
  stopped by the hook in a repository with `.sdd/`; the Copilot hooks fallback gives no guard on
  VS Code 1.145.2, so `copilot-hooks` is not offered for VS Code). C002-TS-619 and the checklist
  steps VSC-27, VSC-28 become: the conductor refuses the planted delegation, `src/app.ts` unchanged,
  and the record keeps whether PreToolUse input carried `agent_type` (from the hooks log); VSC-28
  keeps A-4 (the workspace hook file runs with the plugin part disabled, seen in the hooks log).
  A-5 becomes refuted-and-accepted (a row of the record that states the known limitation).
- **D-053 checklist and notes.**
  - VSC-11 / A-8: expect the servers to start when their first tool is used (record each server's
    state after `/architect:status` and after a step that uses Serena); Serena's start arguments
    hold `--context vscode`.
  - Slash commands: VS Code names them `/architect:<name>`; INSTALL.md and every checklist step use
    that form; VSC-12 expects `/architect:doctor`, `/architect:new`, `/architect:init` and records
    whether a bare `/init` resolves to VS Code's built-in.
  - Model: INSTALL.md tells the user to pick a model in the picker (Auto routes to another model);
    `models_used` records the model shown in the reply footer.
  - Skipped answers (VSC-20, VSC-29): `chat.autoReply` true, then false; record its tool result.
  - SessionStart: under `--host copilot` the hook prints `{ "hookSpecificOutput": { "hookEventName":
    "SessionStart", "additionalContext": "<brief lines>" } }` (C002-IF-008 / hooks contract); VSC-21
    expects the reply to name the toy change without a status command and the hooks log to show the
    JSON output.
  - Fallbacks: VSC-22 and VSC-54 — when the conductor declines, start `sdd-spec-writer` from the
    default agent (`runSubagent`, `agentName: sdd-spec-writer`) with the same task; VSC-23 already
    has one.
  - VSC-23: the record names the tool ids as VS Code shows them; F-7's `<server>-<tool>` naming is
    replaced by the observed `mcp_<command>[N]_<tool>` form.
  - Double guard run: accepted cost (no change at 0.1.0); recorded as an observation for CHG-004.
- **Plan.** New implementation tasks: question tool mapping and wiring (D-051); SessionStart JSON
  for Copilot (D-053); install notes (D-051 … D-053); checklist, record template and run sheet
  (D-052, D-053); new release candidate with a Copilot CLI check of the tools list. C002-T-050
  depends on them and runs again as a later run; C002-T-055 and C002-T-075 follow.
