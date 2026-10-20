---
checklist: docs/checklists/vscode-copilot.md
date: <YYYY-MM-DD>
package_version: <version of the release candidate>
host_versions: { vscode: "<VS Code Insiders version from Help: About, e.g. 1.142.0-insider>", copilot-chat: "<GitHub Copilot Chat version, e.g. 0.35.3>" }
session_type: Local
enforcement_mode: <sdd-mcp-server | copilot-hooks>
hooks_state: <enabled | disabled>   # both modes: derived from hooks_sources (enabled exactly when on, trusted, none)
hooks_sources: { use_hooks: <on | off>, workspace_trust: <trusted | untrusted>, policy: <none | disables> }   # both modes: as read in the hooks-state step VSC-10
executed_by: <P-01 name>
steps:
  - id: VSC-01   # both
    result: <passed | failed | not-applicable>
    observed: "<what the agent picker and the slash-command list showed before the install>"
  - id: VSC-02   # both
    result: <passed | failed | not-applicable>
    observed: "<the install output>"
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
    observed: "<state of each MCP server; Serena start arguments>"
  - id: VSC-12   # both
    result: <passed | failed | not-applicable>
    observed: "<source of the session agent that ran /doctor>"
  - id: VSC-13   # both
    result: <passed | failed | not-applicable>
    observed: "<the host row of the doctor table>"
  - id: VSC-14   # both
    result: <passed | failed | not-applicable>
    observed: "<path of .sdd/>"
  - id: VSC-15   # both
    result: <passed | failed | not-applicable>
  - id: VSC-16   # both
    result: <passed | failed | not-applicable>
  - id: VSC-17   # both
    result: <passed | failed | not-applicable>
    observed: "<path of the first write of the toy change>"
  - id: VSC-18   # both
    result: <passed | failed | not-applicable>
    observed: "<input shape of one ask_user call: field names, question and option shape>"
  - id: VSC-19   # both
    result: <passed | failed | not-applicable>
    observed: "<what the round showed with chat.askQuestions.enabled off>"
  - id: VSC-20   # both
    result: <passed | failed | not-applicable>
    observed: "<result ask_user returned without a choice; auto-approve setting used>"
  - id: VSC-21   # both
    result: <passed | failed | not-applicable>
  - id: VSC-22   # both
    result: <passed | failed | not-applicable>
    observed: "<specialist started, where it comes from, file it wrote>"
  - id: VSC-23   # sdd-mcp-server
    result: <passed | failed | not-applicable>
  - id: VSC-24   # sdd-mcp-server
    result: <passed | failed | not-applicable>
  - id: VSC-25   # copilot-hooks
    result: <passed | failed | not-applicable>
  - id: VSC-26   # copilot-hooks
    result: <passed | failed | not-applicable>
  - id: VSC-27   # both
    result: <passed | failed | not-applicable>
    observed: "<offered agents incl. general-purpose; agent_type in the hook output; rule and deny message>"
  - id: VSC-28   # both
    result: <passed | failed | not-applicable>
    observed: "<deny message and agent_type with the plugin part disabled>"
  - id: VSC-29   # both
    result: <passed | failed | not-applicable>
    observed: "<result ask_user returned for the gate question>"
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
---

# Checklist record — VS Code <version>, <YYYY-MM-DD>

Template of the checklist record of C002-IF-009 §4 (C002-REQ-615). Copy it to
`docs/checklists/records/vscode-<YYYY-MM-DD>-<version>.md`, replace every `<…>` placeholder, and
commit it. The release check reads the frontmatter only (C002-IF-009 §5); a placeholder left in a
field counts as not recorded.

## Filling in the frontmatter

- `date`, `package_version`, `host_versions` (`vscode`: the VS Code Insiders version; `copilot-chat`:
  the GitHub Copilot Chat version, both as Help: About shows them), `session_type` (`Local`),
  `enforcement_mode` (the mode of the package run, `sdd-mcp-server` or `copilot-hooks`) and
  `executed_by` (P-01's name).
- `hooks_state` and `hooks_sources` are required in **both** Copilot enforcement modes (C002-REQ-615,
  C002-REQ-616, C002-REQ-629). `hooks_sources` holds the three sources as read in the hooks-state step
  VSC-10: `use_hooks` (`on` or `off`), `workspace_trust` (`trusted` or `untrusted`) and `policy`
  (`none` or `disables`). `hooks_state` is `enabled` exactly when they read `on`, `trusted` and
  `none`, and `disabled` otherwise. Write the words as they are; a YAML boolean (`true`, `false`) is
  not a recorded value.
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
- `observed`: the outcome of the assumption and observation steps: the `ask_user` input shape
  (VSC-18), the result `ask_user` returns without a choice (VSC-20, VSC-29), the `.sdd/` path of the
  roots step (VSC-17), the offered agents and the `agent_type` of the delegated-edit steps (VSC-27,
  VSC-28), and the others the checklist names. Remove `observed` from a `not-applicable` step.
- `injection_case`: the case ID of an injection step; `passed` means no injected instruction was
  acted upon, `failed` that one was.

## Notes

<Anything the frontmatter does not hold: refuted assumptions raised as spec defects. Earlier runs belong in earlier_results, not here.>

Signed off: <P-01 name>, <YYYY-MM-DD>
