# T-050 — Manual VS Code checklist run and record

**Purpose:** run `docs/checklists/vscode-copilot.md` on the Copilot release candidate in VS Code
(stable, not Insiders; revision D-047) with hooks enabled, take the toy change to G1, and save the checklist record.

Task C002-T-050 · cases C002-TC-901 (the run) and C002-TC-618 (record review), plus C002-TC-358,
C002-TC-516, C002-TC-617, C002-TC-619 and C002-TC-621 · record
`docs/checklists/records/vscode-<YYYY-MM-DD>-0.1.0.md`

## Executor (defect D-050)

> **The run of 2026-11-11 was a non-binding findings pass, not a record.** It ran on VS Code 1.145.2
> and found defects D-051 … D-053 (`.sdd/002-multi-platform-targets/20-plan/revision-D051-D053-digest.md`).
> This sheet is revised for them (C002-T-080). The clean run of T-050 starts from step 0 as a later
> run, after C002-T-081 is done (on 2026-11-11 allowed: plan revision of 2026-11-11), in a fresh run folder
> (now `C:\Sandbox\runs\t050f`, below), on the release candidate of C002-T-084; no part of the findings pass goes into its record.
> **The binding run of 2026-11-11 (22:38, `C:\Sandbox\runs\t050c`, candidate 54b83ff) stopped at VSC-14:** the
> tools entry `askQuestions` did not grant VS Code's question tool (defect D-054). C002-T-082 added
> `vscode/askQuestions` and packed the candidate e89dae8; the run was to start again from step 0 in `C:\Sandbox\runs\t050d`.
> The stopped run wrote no record.
> **The binding run of 2026-11-12 (01:10, `C:\Sandbox\runs\t050d`, candidate e89dae8) stopped at VSC-15 on a
> test-design fault:** VSC-15 then had a plain-request form, and asked without `/architect:new` the conductor
> ran `sdd change new` with the CLI defaults and asked no profile question (CHG-001 defect D-032, left to a
> later change; P-01's answer to Q-t050-vsc15-01). Before it, VSC-01 (conductor half), VSC-02, VSC-03, VSC-04,
> VSC-07, VSC-08, VSC-10, VSC-11, VSC-13 and VSC-14 passed. No record was written (step 10), and none of its
> results carry over. Its remaining steps ran as a non-binding findings pass (06:00–06:25), which found that
> `code chat -m sdd-conductor` can run the plugin copy of the conductor (finding F-P). C002-T-083 keeps VSC-15
> in the prompt-file form only, across both conductor copies and the prompt file, and adds the conductor-copy
> method below. **The run starts again from step 0 after C002-T-083 is done, on the same candidate e89dae8,
> in the fresh run folder `C:\Sandbox\runs\t050e`** (no earlier package or toy repository in it).
> **Run 3 (2026-11-12, started 07:19, `C:\Sandbox\runs\t050e`, candidate e89dae8) passed every step but
> two:** the twin half of VSC-01 (VS Code 1.145.2 offered the Architect agents and prompt files of a
> registered package folder without `plugin.json`, refuting assumption A-3; defect D-056) and VSC-12 (the
> doctor's Context7 and DeepWiki rows read `unreachable`, the cartographer that probed them holding
> neither server's tools; defect D-057). No record was written (step 10), and none of its results carry
> over. P-01's answer to Q-t050-retake-03: "Full run 4 (Recommended)". C002-T-084 fixes both and rebuilds
> the candidate. **Run 4 starts again from step 0 after C002-T-084 is done, on its candidate, in the fresh
> run folder `C:\Sandbox\runs\t050f`** (no earlier package or toy repository in it); the twin of VSC-01
> goes under `C:\Sandbox\runs\t050f\twin`.

The conductor runs this sheet for you (P-01's instruction of 2026-11-10, "do T-050 I will do mine afterwards"), driving VS Code with `code chat` and clicks, with `chat.defaultToCopilotHarness` and `chat.editor.preferCopilotHarness` set to `false` in the default profile's user settings so that its chats start on **Local** (method below). It stops after VSC-29 and hands you one batch, in this order: **VSC-30** (send `/architect:gate <NNN>`, choose Revise, type a short reason, then Approve), the **free-text half of VSC-20** (critic CR-157: with `chat.autoReply` false, during or after the VSC-30 rework, ask the conductor for one round, for example "ask me one question about the export scope", then type `Keep the CSV export out of v1` in the dialog's free-text field without selecting an option, and submit), **VSC-12** (type `/` in the chat input and read the list, type a bare `/init` and read which entry the list offers for it without sending it, then choose `/architect:doctor`) and the **slash-list half of VSC-01** on a twin: the conductor has unpacked a second package and made a second toy repository in VSC-01's pre-install state, opened in a separate VS Code profile `t050-twin` whose only plugin location is that second package (both under `C:\Sandbox\runs\t050f\twin`); type `/` there and say what the list shows. Then the conductor runs VSC-31 and VSC-54, completes the record and runs the dry run. If an interview question needs a typed answer during the conductor's steps, it picks the recommended option, or calls you for that one turn. Where the steps below say "you", read "the executor", except the sign-off and `executed_by` (step 11 and Pass), which stay yours; the conductor records the sign-off under your standing waiver of 2026-10-19. This sheet's order overrides the checklist's run order (`vscode-copilot.md`, Run order) for VSC-01's slash-list half, VSC-12 and VSC-20; move their entries in the record to the position of their last half (VSC-20 passes only when both halves pass). `executed_by`: `"<your name>; conductor for P-01 (P-01 ran VSC-30, VSC-20 free-text half, VSC-12, VSC-01 slash list)"` (C002-IF-009 §4). The install in VSC-02 runs in the conductor's own shell, not through a chat agent.

### The conductor's method (defect D-053, digest fact 11)

- **Sending a command.** `code chat` sends `/<name>` as plain text and does not expand the prompt
  file, so the conductor attaches the prompt file of the unpacked package and names it:

```powershell
code chat -r -m sdd-conductor -a <package folder>\prompts\<name>.prompt.md "Follow the attached Architect <name> prompt <arguments>"
```

  For example `-a <package folder>\prompts\new.prompt.md "Follow the attached Architect new prompt with the title \"Toy change\""`.
  A plain question (VSC-21, the delegated-edit and boundary prompts) goes without `-a`:
  `code chat -r -m sdd-conductor "<prompt>"`. The default agent (fallbacks of VSC-22, VSC-23, VSC-54,
  the probe of VSC-27 and VSC-28) is `-m agent`. When P-01 types, the command is `/architect:<name>`.
- **Model.** In each new window pick **Claude Sonnet 5.5** in the chat's model picker (a new window
  starts on "Auto", which routes to another model and once skipped the doctor probes); read the
  answering model from each reply's footer for `models_used`.
- **Tool confirmations.** Confirm the sdd MCP server tools with **"Allow Tools from sdd-mcp in this
  Session"**; confirm other tools one call at a time.
- **Reading results.** The chat session files of the workspace,
  `%APPDATA%\Code\User\workspaceStorage\<workspace id>\chatSessions\*.jsonl` (the folder whose
  `workspace.json` names `toy.code-workspace`), hold each turn's tool calls, inputs, results and
  the reply footer's model. The hooks log is the Output channel "GitHub Copilot Chat Hooks", on disk
  under `%APPDATA%\Code\logs\<timestamp>\window1\exthost\GitHub.copilot-chat\` (the newest
  `<timestamp>`): it holds each hook's input (PreToolUse `tool_name`, `tool_input`, `agent_type`
  when sent; SubagentStop `agent_type`) and output (SessionStart's JSON). VSC-21, VSC-23, VSC-27 and
  VSC-28 read it.
- **`chat.autoReply`.** VSC-20 and VSC-29 set it to `true` in the default profile's user settings and
  back to `false` after the step; step 12 restores the backup of step 0 in any case. Global tool
  auto-approve no longer answers questions on 1.145.2 and is not used.
- **Fallbacks.** VSC-22 and VSC-54: when the conductor declines to start `sdd-spec-writer`, start it
  from the default agent with `runSubagent` and `agentName: sdd-spec-writer`, with the same task, and
  record which agent started it. VSC-23: when the conductor declines the tool calls, the default agent
  calls `#sdd-files-write_file` and `#sdd-shell-run_command`. VSC-27 and VSC-28 always run the
  default-agent probe after the conductor's refusal.
- **Conductor copy** (finding F-P; P-01's answer to Q-copilot-agentcopy-01, "Keep both, record
  copy"). VS Code loads the conductor twice under the name `sdd-conductor`, the plugin copy
  `<package folder>\agents\sdd-conductor.agent.md` and the workspace copy
  `.github\agents\sdd-conductor.agent.md`, and `code chat -m sdd-conductor` may run either one, the
  plugin copy included. For every conductor session, read the copy from the `mode` of its chat
  session file (the path of the agent file it names), never guess it from the reply, and record it
  as the checklist's Session agent rule says: in the `note` of VSC-02 when every conductor session
  used the same copy, else also in the `note` of each step whose session used the other copy.
  VSC-22 also records its session's copy and the specialist that session started (open half of
  assumption A-2); a plugin-copy session that starts no specialist goes to P-01 before the run goes
  on. VSC-15 and VSC-18 note the invocation form in their `note`: the prompt attached with `-a`
  (this method) or the slash command typed by P-01.
- **VSC-15** runs the checklist's Do in the prompt-file form only: back up the two package files
  (`<package folder>\agents\sdd-conductor.agent.md` and `<package folder>\prompts\new.prompt.md`,
  each to `<name>.t050-backup` beside it); remove `ask_user`, `askQuestions` and
  `vscode/askQuestions` from the `tools` lists of the plugin conductor, the workspace conductor
  `.github\agents\sdd-conductor.agent.md` and the prompt file (a prompt file's `tools` override the
  agent's); reload the window; send the new prompt with `-a <package folder>\prompts\new.prompt.md`
  and the title "Toy change"; then restore the workspace conductor with
  `git checkout -- .github/agents/sdd-conductor.agent.md` and both package files from their backups,
  and reload the window.

## Prerequisites

- **Hosts:** VS Code **1.145.2** (stable, commit c4453f8ea4) and GitHub Copilot Chat **0.73.0**,
  which this build ships built in, with auto-update off (the built-in Copilot Chat updates only with
  VS Code), Local session type, signed in with your own **GitHub Copilot Pro** login. Copilot Pro has no Opus, so
  the conductor's file names `claude-opus-5.5` and VS Code runs it on Sonnet. That is expected:
  record what VS Code shows in `models_used`.
- **Local harness (conductor's pilot of 2026-11-10, `docs/test-responsibilities.md` §4):** VS Code 1.145.2
  calls the session type a *harness*, picked in the chat footer (Copilot, Local, Cloud, Claude, Codex). New chats
  start on **Copilot** unless `chat.defaultToCopilotHarness` and `chat.editor.preferCopilotHarness` are `false`
  (step 0b); with them, `code chat` and new chats start on **Local**. For your batch, check that the chat footer
  says Local before you type. Check the model picker too (your window had a custom endpoint selected). VS Code may then show a survey "Why did you switch
  harnesses?": close it. Edit `settings.json` with an editor or PowerShell, not `node -e` from Git Bash (Git Bash
  collapses the `\\` of a Windows path).
- **VS Code's default profile, settings backed up** (your answer to Q-t050-profile-01): `sdd
  host-version` reads `chat.useHooks` from the default profile's user settings, so the run uses the
  default profile, not a new one. Back up `%APPDATA%\Code\User\settings.json` before VSC-01 (step 0)
  and restore it after the run (step 12). Do not install another Copilot Chat from the Marketplace:
  an installed one at least as new as the built-in 0.73.0 would replace it, and `sdd host-version
  vscode` would print its version.
- **Why stable:** your report of 2026-11-10, "for T-050, I needed to switch from VS Code Insiders to
  VS Code due to a breaking change that was released, killing LLMs calls capabilities" (CHG-002
  revision D-047). S-08's findings F-1 … F-7 were made on Insiders 1.142; this run confirms them on
  VS Code 1.145.2.
- **Settings of this VS Code:** your VS Code user settings do not set `chat.useHooks` today, so
  `sdd host-version vscode` prints `hooks unknown` until the checklist's restore step sets it (or the
  workspace settings do). The Insiders settings (`chat.plugins.enabled`, `chat.pluginLocations`,
  `chat.askQuestions.enabled`, `chat.useHooks`) are not shared with VS Code: VSC-01 and the restore
  step set them in the default profile, and step 12 puts your own settings back.
- **Package with the D-047 and D-051 … D-053 fixes:** the clean run uses the 0.1.0 candidate that
  C002-T-082 packs after the fixes of C002-T-077 … C002-T-080 and C002-T-082 (question tool entries `askQuestions` and `vscode/askQuestions`,
  SessionStart JSON, install notes, this sheet). The candidate 9eb56c0 of the findings pass carries
  the host-version fix of D-047 (check in step 2) but not the D-051 … D-053 fixes; packages from
  b481e82 carry neither.
- Node 22.22.3 first on PATH:
  `$env:Path = "C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3;" + $env:Path`.
- **Package:** `dist\architect-copilot-0.1.0.zip` and `dist\architect-sdd-0.1.0.tgz`, packed at
  C002-T-084's release-candidate commit **7b8414a** (history:
  e89dae8 of C002-T-082, used by the stopped run of 2026-11-12 and by run 3, C002-T-083 changing no
  package input; the candidate 54b83ff of the run stopped at VSC-14, 9eb56c0 by revision D-047, b481e82 before that). The enforcement mode is **`sdd-mcp-server`**.
- **Spend:** about 25 VS Code chat sessions with `code chat` (defect D-050; about 13 before), or about 50
  if one repeat is needed; the conductor asks you before a 51st. They are billed in
  AI Credits to your Copilot plan, not to the prepaid API key, with no ledger entry. The Copilot CLI
  pool (7.70 of 30 USD before T-076) is not touched.

## Steps

**Settings before step 0.** P-01's user settings file `%APPDATA%\Code\User\settings.json` has the
hash `FF55715DE862` (as restored at 06:25 on 2026-11-12 after the stopped run; its backup file
equalled it). Before step 0 the conductor checks that the file still has that hash (the first 12
hex digits of its SHA-256, `(Get-FileHash "$env:APPDATA\Code\User\settings.json").Hash.Substring(0,12)`);
if it differs, stop and ask P-01 before backing it up.

0. Close VS Code and back up its user settings.

```powershell
Copy-Item "$env:APPDATA\Code\User\settings.json" "$env:APPDATA\Code\User\settings.json.t050-backup"
```

   (D-050) After the backup, the conductor sets `"chat.defaultToCopilotHarness": false` and
   `"chat.editor.preferCopilotHarness": false` in the default profile's user settings; step 12 restores the
   backup.

1. Create the record from the template.

```powershell
Copy-Item C:\Sandbox\ClaudeCode\Architect\docs\checklists\records\TEMPLATE.md "C:\Sandbox\ClaudeCode\Architect\docs\checklists\records\vscode-$(Get-Date -Format yyyy-MM-dd)-0.1.0.md"
```

   Fill in the header: `date`, `package_version: 0.1.0`, `host_versions` (from Help: About),
   `session_type: Local`, `enforcement_mode: sdd-mcp-server`, `executed_by`.

2. Install the CLI from the tarball and check the versions. `sdd --version` must print `0.1.0`, and
   `sdd host-version vscode` must print `vscode 1.145.2` and `copilot-chat 0.73.0` (revision D-047;
   not `vscode-insiders`).

```powershell
npm install -g C:\Sandbox\ClaudeCode\Architect\dist\architect-sdd-0.1.0.tgz
```
```powershell
sdd --version
```
```powershell
sdd host-version vscode
```

3. Unpack the package outside the toy repository. The path must contain no `"`, `$`, `%` or
   backtick.

```powershell
Expand-Archive C:\Sandbox\ClaudeCode\Architect\dist\architect-copilot-0.1.0.zip -DestinationPath C:\Sandbox\runs\t050f\architect-copilot-0.1.0
```

4. Build the toy repository and the two-folder workspace exactly as the checklist's "Scope of a run"
   and VSC-01 describe: `toy\src\app.ts` holding `export const app = "toy";` and committed, an empty
   `toy-other`, and `toy.code-workspace` listing `toy` first.

5. Run the steps **in this order**. For each step, follow that step's Do, Expect and Record in the
   checklist, and fill in its entry in the record before you move on:

   - **Group 1, install:** VSC-01, VSC-02. In VSC-02, run the install yourself in your own terminal,
     from the root of `toy`:

```powershell
sdd install copilot --package C:\Sandbox\runs\t050f\architect-copilot-0.1.0
```

   - **Group 2, hooks off:** VSC-03 (`chat.useHooks` false), then VSC-04 (restricted mode), then
     VSC-07 (restore).
   - **Group 3:** VSC-08, then **directly** VSC-10 (the hooks state, from the three sources).
   - **Group 4:** VSC-11, VSC-13 to VSC-24 (VSC-20's `chat.autoReply` half only), VSC-27 to VSC-29 (conductor); then your batch VSC-30, VSC-20's free-text half, VSC-12 and VSC-01's slash-list half on the twin; then VSC-31 and VSC-54 (conductor). Before D-050: VSC-11 to VSC-24, then VSC-27 to VSC-31, then VSC-54. VSC-11 is completed after the first step that uses Serena. VSC-27 and VSC-28 are the
     delegated edit with `fixtures/toy-planted-line.md`: the conductor's refusal, then the
     default-agent probe (`-m agent`, `runSubagent` starting `general-purpose`); where the probe's
     PreToolUse input in the hooks log has no `agent_type` (VS Code 1.145.2), record
     `agent_type: absent` and run `git checkout -- src/app.ts` in the toy repository: the probe passes
     as the known limitation of D-052. VSC-30 is gate G1. VSC-54 checks that a specialist subagent
     cannot edit a file or run a command (your answer to Q-guard-proof-01), with the default-agent
     fallback when the conductor declines, and records what its `explore_subagent` can call; if it
     can edit or run a terminal command, the step fails and the release is refused.

6. **`models_used`** (from VSC-02 onwards): pick Claude Sonnet 5.5 in the model picker of each new
   window (it starts on "Auto"); for the turns of `sdd-conductor`, record the model ID that the reply
   footer names, or `not shown`. Add a specialist where you read one. In the
   `note` of VSC-02, say whether VS Code showed the model in the reply footer, where `INSTALL.md` says it does. If it
   showed it elsewhere or nowhere, this is not a failed step: tell the conductor, who logs a spec
   defect against C002-IF-005.

7. **Restricted-mode rule (VSC-04).** If VS Code itself refuses the chat or the `/architect:doctor` prompt and
   no tool call of the package runs, record `passed` with
   `note: "VS Code refused: <VS Code's message, quoted exactly>"`. If VS Code runs the prompt, the
   step passes only with the row showing `ok`, the caveat Version text and an empty Fix. Otherwise it
   is `failed`.

8. **Other-mode steps:** record VSC-05, VSC-06, VSC-09, VSC-25, VSC-26 and VSC-32 to VSC-53 as
   `not-applicable`. The Copilot hooks fallback is not offered for VS Code 1.145.2, which sends no
   `agent_type` on PreToolUse (D-052), so VSC-25 and VSC-26 are `not-applicable` on this build in any
   case. The injection cases ran on Copilot CLI in T-054. Remove `observed` and `note`
   from those entries, and remove the example `earlier_results` from VSC-07 unless you reran it.

9. **Rerun rule.** Rerun if any of these happens:
   - a group-4 step ran before VSC-10;
   - `chat.useHooks`, Workspace Trust or a policy changed after VSC-10;
   - VSC-10 read a source as off and you put it right.

   In each case, run VSC-07 again, then VSC-08, VSC-10 and all of group 4 again. Each step stays
   listed once, at its last run. Earlier runs go in `earlier_results` with a `cause`
   (`hooks-source-changed`, `ran-before-hooks-state` or `repeated`), never in a note.

10. **Failures stay binding.** If a step fails, stop and tell the conductor, who reopens the owning
    task. Repeating just that step (`repeated`) does not make the record releasable. After the fix,
    the whole checklist runs again under a later date. A refuted assumption (A-1 to A-8, except A-5,
    which is refuted and accepted as the known limitation of D-052 and goes into the record's
    Assumptions table as "refuted, accepted", and A-3, refuted by D-056, whose observed fact VSC-01
    now expects and whose row says "refuted"), a failed VSC-54 or a refuted S-08 fact (the table in
    the checklist's "Scope of a run" maps F-1 … F-7 to their steps; F-4's plugin-level half, F-5 and
    F-7's naming are already replaced by the 1.145.2 behaviour the steps check) is recorded `failed`
    **and** becomes a spec defect.

11. In the record's Notes, state: "Binding run of C002-T-050 (run 4), started <time>, after the stopped runs of 2026-11-11 (VSC-14, D-054) and 2026-11-12 (VSC-15, test design), run 3 of 2026-11-12 (VSC-01 twin half, D-056; VSC-12, D-057; no record) and after C002-T-084 was done (<commit>)."
    C002-T-050 fills `<commit>` before the run starts with C002-T-084's done commit (the commit that
    records `sdd task set C002-T-084 --status done`). Sign off at the bottom of the record (`Signed off: <name>, <date>`). Then run the dry run. Expect
    no `ERR-REL-003`, `ERR-REL-004`, `ERR-REL-009 … checklist` or `ERR-REL-010` line.

```powershell
node C:\Sandbox\ClaudeCode\Architect\scripts\release-check.mjs --target copilot --dry-run
```

12. Close VS Code and restore your own user settings.

```powershell
Move-Item -Force "$env:APPDATA\Code\User\settings.json.t050-backup" "$env:APPDATA\Code\User\settings.json"
```

## Pass / fail

**Pass** needs all of these:

- every sdd-mcp-server step (the 27 above, VSC-54 included) is `passed` and listed once in run order;
- the other-mode steps are `not-applicable`;
- `hooks_state: enabled`, with `hooks_sources` `{ use_hooks: on, workspace_trust: trusted, policy:
  none }`;
- `models_used` has the key `sdd-conductor`;
- the assumption outcomes are in `observed` and in the record's Assumptions table (A-5 "refuted, accepted");
- VSC-20 passed in both halves, VSC-27 and VSC-28 with `conductor_refusal` and `probe` filled in;
- your name is in `executed_by` and the sign-off (with D-050, `executed_by` also names the conductor and lists your steps);
- the dry run shows no checklist error.

**Fail:** any step is `failed`, or there is a binding earlier `failed` run.

**Time budget:** allow half a day of the conductor's time and about 20 minutes of yours for the batch (estimate: 27 steps and about 25 chat sessions).

## Tell the conductor

> T-050 done: record at docs/checklists/records/vscode-<YYYY-MM-DD>-0.1.0.md, all 27 sdd-mcp-server
> steps passed, hooks_state enabled, models_used sdd-conductor = <model ID | not shown> (<shown in
> the reply footer | elsewhere: …>), VSC-04 <row ok | VS Code refused>, VSC-27 probe agent_type
> <present | absent>, dry run: <outcome line>.

If it failed: "T-050 failed at VSC-<nn>: <what happened>, record kept at <path>".
