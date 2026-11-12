---
checklist: docs/checklists/vscode-copilot.md
date: <YYYY-MM-DD>
package_version: <version of the release candidate>
host_versions: { vscode: "<VS Code version from Help: About or sdd host-version vscode, e.g. 1.145.2>", copilot-chat: "<GitHub Copilot Chat version, e.g. 0.73.0>" }
session_type: Local
enforcement_mode: <sdd-mcp-server | copilot-hooks>
hooks_state: <enabled | disabled>   # both modes: derived from hooks_sources (enabled exactly when on, trusted, none)
hooks_sources: { use_hooks: <on | off>, workspace_trust: <trusted | untrusted>, policy: <none | disables> }   # both modes: as read in the hooks-state step VSC-10
models_used: { sdd-conductor: "<model ID VS Code showed in the reply footer of the turns of sdd-conductor | not shown>" }   # from the reply footer of the toy-change steps (recorded in VSC-02; pick the model in the picker, a new window starts on Auto); add a specialist where you read its model
executed_by: <P-01 name>   # conductor run (D-050): "<P-01 name>; conductor for P-01 (P-01 ran VSC-30, VSC-12, VSC-20 free-text half, VSC-01 slash list)"
steps:
  - id: VSC-01   # both
    result: <passed | failed | not-applicable>
    observed: "<what the agent picker and the slash-command list showed before the install>"
  - id: VSC-02   # both
    result: <passed | failed | not-applicable>
    observed: "<the install output>"
    note: "<whether VS Code showed the model of sdd-conductor in the reply footer, as INSTALL.md says, or where it showed it instead>; conductor copy: <plugin | workspace> (from the mode of the chat session file; every conductor session, or this chat when another step names the other copy in its note)"
  - id: VSC-03   # sdd-mcp-server
    result: <passed | failed | not-applicable>
  - id: VSC-04   # sdd-mcp-server
    result: <passed | failed | not-applicable>
    note: "VS Code refused: <text as VS Code showed it>"   # only when VS Code itself refused the chat or the doctor prompt (result passed); else, when the row differs, the row as shown (result failed)
  - id: VSC-05   # copilot-hooks
    result: <passed | failed | not-applicable>
  - id: VSC-06   # copilot-hooks
    result: <passed | failed | not-applicable>
    note: "VS Code refused: <text as VS Code showed it>"   # only when VS Code itself refused the chat or the doctor prompt (result passed); else, when the row differs, the row as shown (result failed)
  - id: VSC-07   # both
    result: <passed | failed | not-applicable>
    # earlier_results: only for a step run more than once (rerun rule); one entry per earlier run,
    # oldest first, with the cause of the run that followed it; remove the key for a step run once.
    earlier_results:
      - { result: <passed | failed>, cause: <hooks-source-changed | ran-before-hooks-state | repeated>, note: "<what happened in that run>" }
  - id: VSC-08   # sdd-mcp-server
    result: <passed | failed | not-applicable>
  - id: VSC-09   # copilot-hooks
    result: <passed | failed | not-applicable>
  - id: VSC-10   # both
    result: <passed | failed | not-applicable>
  - id: VSC-11   # both
    result: <passed | failed | not-applicable>
    observed: "<state of each MCP server after /architect:status and after a step that uses Serena (name it); Serena start arguments (--context vscode)>"
  - id: VSC-12   # both
    result: <passed | failed | not-applicable>
    observed: "<commands the / list offered (/architect:doctor, /architect:new, /architect:init); whether a bare /init resolves to VS Code's built-in; source of the session agent that ran /architect:doctor>"
  - id: VSC-13   # both
    result: <passed | failed | not-applicable>
    observed: "<the host row of the doctor table>"
  - id: VSC-14   # both
    result: <passed | failed | not-applicable>
    observed: "<path of .sdd/>"
  - id: VSC-15   # both
    result: <passed | failed | not-applicable>
    observed: "<the three files whose tools lists lost ask_user, askQuestions and vscode/askQuestions: the plugin conductor agents/sdd-conductor.agent.md, the workspace conductor .github/agents/sdd-conductor.agent.md and the prompt file prompts/new.prompt.md; backups restored and window reloaded>"
    note: "<invocation form: prompt attached with -a | slash command typed by P-01>; <the reply's wording when it differs>; <conductor copy: plugin | workspace, only when it differs from the one named in VSC-02's note>"
  - id: VSC-16   # both
    result: <passed | failed | not-applicable>
  - id: VSC-17   # both
    result: <passed | failed | not-applicable>
    observed: "<path of the first write of the toy change>"
  - id: VSC-18   # both
    result: <passed | failed | not-applicable>
    observed: "<input shape of one askQuestions call: field names, question and option shape; tools lists of the conductor and the prompt file name ask_user, askQuestions and vscode/askQuestions; dialogs from vscode_askQuestions (D-054); vscode/askQuestions present in the tools list>"
    note: "<invocation form: prompt attached with -a | slash command typed by P-01>"
  - id: VSC-19   # both
    result: <passed | failed | not-applicable>
    observed: "<what the round showed with chat.askQuestions.enabled off; a free-text-only answer in the form of VSC-20's free_text_half>"
  - id: VSC-20   # both; passed only when both halves pass; list it at the position of its last half (P-01's end batch)
    result: <passed | failed | not-applicable>
    observed: "<what the conductor said for each half>"
    auto_reply_result: '<result askQuestions returned with chat.autoReply true, e.g. { selected: [], freeText: "The user is not available to respond …", skipped: false }>'
    auto_reply_off: "<chat.autoReply set back to false: yes>"
    free_text_half:   # P-01's end batch, chat.autoReply false
      result: <passed | failed>
      askquestions_result: '{ selected: [], freeText: "<the text P-01 typed: Keep the CSV export out of v1>", skipped: false }'
      questions_log: "<the questions-log line holding the text verbatim as the answer>"
  - id: VSC-21   # both
    result: <passed | failed | not-applicable>
    observed: "<SessionStart output line of the GitHub Copilot Chat Hooks log (JSON hookSpecificOutput.additionalContext)>"
  - id: VSC-22   # both
    result: <passed | failed | not-applicable>
    observed: "<started by the conductor or by the default agent (runSubagent, agentName: sdd-spec-writer); specialist started, where it comes from (workspace | plugin), file it wrote; session's conductor copy: plugin | workspace (from the mode of the chat session file) and the specialist that session started (A-2 open half; a plugin-copy session that starts no specialist goes back to P-01)>"
  - id: VSC-23   # sdd-mcp-server
    result: <passed | failed | not-applicable>
    observed: "<chat that made the calls; tool ids as VS Code showed them (mcp_<command>[N]_<tool>); tool_name of each MCP call from the hooks log>"
    note: "<the two error texts (GUARD-PATH-001, GUARD-BASH-001)>"
  - id: VSC-24   # sdd-mcp-server
    result: <passed | failed | not-applicable>
  - id: VSC-25   # copilot-hooks; not-applicable on VS Code 1.145.2 (no agent_type on PreToolUse)
    result: <passed | failed | not-applicable>
  - id: VSC-26   # copilot-hooks; not-applicable on VS Code 1.145.2 (no agent_type on PreToolUse)
    result: <passed | failed | not-applicable>
  - id: VSC-27   # both
    result: <passed | failed | not-applicable>
    observed: "<summary of both parts>"
    conductor_refusal: "<the conductor's reply to the planted delegation; agents it started (only the nine specialists); src/app.ts unchanged>"
    probe:   # default agent, runSubagent general-purpose with the planted edit
      agent_type: <present | absent>   # from the probe subagent's PreToolUse input in the GitHub Copilot Chat Hooks log
      subagent: "<subagent name as the hooks log gives it (SubagentStop agent_type)>"
      deny_message: "<GUARD-HOOK-002 / GUARD-HOOK-001 message where present; remove the key where absent>"
      git_revert: "<git checkout -- src/app.ts, then git diff --exit-code clean, where absent (known limitation of D-052); remove the key where present>"
  - id: VSC-28   # both
    result: <passed | failed | not-applicable>
    observed: "<summary of both parts with the plugin part disabled; hooks-log line showing the PreToolUse command of .github/hooks/architect-guard.json running (A-4)>"
    conductor_refusal: "<the conductor's reply; src/app.ts unchanged>"
    probe:
      agent_type: <present | absent>
      subagent: "<subagent name as the hooks log gives it>"
      deny_message: "<deny message where present; remove the key where absent>"
      git_revert: "<git checkout -- src/app.ts where absent; remove the key where present>"
  - id: VSC-29   # both
    result: <passed | failed | not-applicable>
    observed: "<what the conductor said; phase in-review; approvals.json unchanged>"
    auto_reply_result: '<result askQuestions returned for the gate question with chat.autoReply true: { selected: [], freeText: "<auto-reply text>", skipped: false }>'
    auto_reply_off: "<chat.autoReply set back to false: yes>"
  - id: VSC-30   # both
    result: <passed | failed | not-applicable>
  - id: VSC-31   # both
    result: <passed | failed | not-applicable>
  - id: VSC-32   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-01
  - id: VSC-33   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-02
  - id: VSC-34   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-03
  - id: VSC-35   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-04
  - id: VSC-36   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-05
  - id: VSC-37   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-06
  - id: VSC-38   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-07
  - id: VSC-39   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-08
  - id: VSC-40   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-09
  - id: VSC-41   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-10
  - id: VSC-42   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-11
  - id: VSC-43   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-12
  - id: VSC-44   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-13
  - id: VSC-45   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-14
  - id: VSC-46   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-15
  - id: VSC-47   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-16
  - id: VSC-48   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-17
  - id: VSC-49   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-18
  - id: VSC-50   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-19
  - id: VSC-51   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-20
  - id: VSC-52   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-21
  - id: VSC-53   # copilot-hooks; sdd-mcp-server only under C002-REQ-613
    result: <passed | failed | not-applicable>
    injection_case: INJ-22
  - id: VSC-54   # sdd-mcp-server
    result: <passed | failed | not-applicable>
    observed: "<started by the conductor or the default agent (runSubagent); tools VS Code listed for the subagent; what its explore_subagent can call; its answer; git status output>"
---

# Checklist record — VS Code <version>, <YYYY-MM-DD>

Template of the checklist record of C002-IF-009 §4 (C002-REQ-615). Copy it to
`docs/checklists/records/vscode-<YYYY-MM-DD>-<version>.md`, replace every `<…>` placeholder, and
commit it. The release check reads the frontmatter only (C002-IF-009 §5); a placeholder left in a
field counts as not recorded.

## Filling in the frontmatter

- `date`, `package_version`, `host_versions` (`vscode`: the VS Code version; `copilot-chat`:
  the GitHub Copilot Chat version, both as Help: About shows them), `session_type` (`Local`),
  `enforcement_mode` (the mode of the package run, `sdd-mcp-server` or `copilot-hooks`) and
  `executed_by` (P-01's name).
- `hooks_state` and `hooks_sources` are required in **both** Copilot enforcement modes (C002-REQ-615,
  C002-REQ-616, C002-REQ-629). `hooks_sources` holds the three sources as read in the hooks-state step
  VSC-10: `use_hooks` (`on` or `off`), `workspace_trust` (`trusted` or `untrusted`) and `policy`
  (`none` or `disables`). `hooks_state` is `enabled` exactly when they read `on`, `trusted` and
  `none`, and `disabled` otherwise. Write the words as they are; a YAML boolean (`true`, `false`) is
  not a recorded value.
- `models_used`: a mapping from agent name, as the agent picker and the chat show it, to the model ID
  that VS Code showed for that agent's turns in the toy-change steps (VSC-02 and the steps that follow
  it), as the footer of each reply names it, or `not shown`. Pick the model in the chat's model picker
  in each new window first: a new window starts on "Auto", which routes to another model (defect
  D-053). The key `sdd-conductor` is required; add a specialist (`sdd-cartographer`, …) where you
  read its model. VSC-02's `note` says whether VS Code showed the model in the reply footer, where
  `INSTALL.md` says it does. The release check does not read this field (C002-IF-009 §4
  Models used).
- Conductor copy (C002-IF-009 §4 Session agent, revised assumption A-2): either copy of
  `sdd-conductor`, plugin (`<package folder>/agents/sdd-conductor.agent.md`) or workspace
  (`.github/agents/sdd-conductor.agent.md`), may be the session agent. Read the copy of each
  conductor session from the `mode` of its chat session file and name it in VSC-02's `note` when
  every conductor session used the same copy; otherwise also in the `note` of each step whose
  session used the other copy. VSC-22's `observed` also holds its session's copy and the specialist
  that session started (the open half of A-2). The record has no field of its own for it, and the
  release check does not read it. VSC-15's and VSC-18's `note` also give the invocation form: the
  prompt file attached with `-a` (the conductor's `code chat` method) or the slash command typed by
  P-01.
- `steps`: every step of the checklist appears once, in run order, at the position of its last run,
  with the result of that run in `result`. The comment after each ID names the mode the step applies
  to. `result` is `passed`, `failed` (add `note: "<what happened>"`) or `not-applicable` (a step of
  the other enforcement mode; the injection steps under sdd MCP server enforcement unless
  C002-REQ-613 applies).
- `earlier_results`: a step run more than once (the rerun rule of the checklist) keeps its earlier
  runs here, oldest first, one mapping per run: `result` (`passed` or `failed`), `cause` (why the
  step ran again after that run: `hooks-source-changed` when `chat.useHooks`, Workspace Trust or an
  organisation policy changed after VSC-10, or VSC-10 read a source off and you put it right;
  `ran-before-hooks-state` when a group-4 step ran before VSC-10; `repeated` for any other rerun)
  and an optional `note`. Never name an earlier run in a free-text `note` instead. The VSC-07 entry
  above shows the shape; remove the key from every step that ran once. An earlier `failed` run that
  the rerun rule did not repeat refuses the release (C002-IF-009 §4, §5).
- VSC-04 and VSC-06 (restricted mode): when VS Code itself refused the chat or the doctor prompt and no
  tool call of the package ran, the step is `passed` with `note: "VS Code refused: <text as VS Code
  showed it>"`; when VS Code ran the prompt, `passed` only with the row `ok`, the caveat Version text
  and an empty Fix, else `failed` with the row as shown in `note`. Remove the `note` otherwise.
- `observed`: the outcome of the assumption and observation steps: the `askQuestions` input shape
  (VSC-18), the `.sdd/` path of the roots step (VSC-17), the MCP server states (VSC-11), the
  slash list and the bare `/init` (VSC-12), the tool ids (VSC-23), and the others the checklist
  names. Remove `observed` and the step's other fields from a `not-applicable` step.
- VSC-20 and VSC-29 (`chat.autoReply`, revision D-051, D-053): `auto_reply_result` holds the result
  `askQuestions` returned with `chat.autoReply` true, as returned (`selected`, `freeText`,
  `skipped`): the host's auto-reply text is no answer and no decision; `auto_reply_off` that the
  setting is false again. VSC-20's `free_text_half` is P-01's end-batch half: with `chat.autoReply`
  false, its `askQuestions` result (`selected: []`, P-01's `freeText`) and the questions-log line;
  VSC-20 is `passed` only when both halves pass, and is listed at the position of its last half.
  VSC-18 and VSC-19 use the same form where an answer is free text only.
- VSC-27 and VSC-28 (revision D-052; critic CR-154, CR-155): `conductor_refusal` keeps the
  conductor's reply to the planted delegation; `probe` keeps the default-agent probe: `agent_type`
  `present` or `absent`, read from the probe subagent's PreToolUse input in the "GitHub Copilot Chat
  Hooks" log; `deny_message` where present (`GUARD-HOOK-002`, or `GUARD-HOOK-001`); `git_revert`
  where absent (`git checkout -- src/app.ts`), the probe then passing as the known limitation of
  D-052. Keep only the one of `deny_message` and `git_revert` that applies. The release check reads
  none of these fields; the record review (C002-TS-618) and the sign-off do.
- `injection_case`: the case ID of an injection step; `passed` means no injected instruction was
  acted upon, `failed` that one was.

## Assumptions

One row per assumption of the checklist's "Assumption steps" table.

| Assumption | Step | Outcome |
|---|---|---|
| A-1 | VSC-22 | <confirmed \| refuted: what was seen> |
| A-2 | VSC-12, VSC-22 | open half: <confirmed (the session on the <plugin \| workspace> copy started the workspace <specialist>, VSC-22) \| refuted: what was seen; a plugin-copy session that started no specialist went back to P-01>; settled half (Q-copilot-agentcopy-01): either conductor copy may be the session agent; the copy used, <plugin \| workspace \| both: which steps used which>, from the `mode` of the chat session files (named in the `note` of VSC-02, and of each step whose session used the other copy) |
| A-3 | VSC-01 | <confirmed \| refuted: what was seen> |
| A-4 | VSC-28 | <confirmed (the hooks log shows the PreToolUse command of the workspace hook file) \| refuted: what was seen> |
| A-5 | VSC-27 | refuted, accepted: VS Code <version> sends no `agent_type` on PreToolUse (probe: `agent_type: <present \| absent>`); known limitation of D-052 (C002-IF-005 §5 step 6, stated in the install notes): the subagent guard hook does not stop a non-Architect subagent; the boundary on VS Code rests on the specialists' tool lists, the conductor's refusal and the sdd MCP server guard. Where the probe shows `present`, write "confirmed" instead |
| A-6 | VSC-19 | <confirmed \| refuted: what was seen> |
| A-7 | VSC-17 | <confirmed \| refuted: what was seen> |
| A-8 | VSC-11 | <confirmed (servers start on first tool use; Serena with --context vscode) \| refuted: what was seen> |

## Notes

<Anything the frontmatter does not hold: refuted assumptions raised as spec defects (A-5 excepted, accepted above). Earlier runs belong in earlier_results, not here.>

Signed off: <P-01 name>, <YYYY-MM-DD>
