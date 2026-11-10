# T-050 — Manual VS Code checklist run and record

**Purpose:** run `docs/checklists/vscode-copilot.md` on the Copilot release candidate in VS Code
(stable, not Insiders; revision D-047) with hooks enabled, take the toy change to G1, and save the checklist record.

Task C002-T-050 · cases C002-TC-901 (the run) and C002-TC-618 (record review), plus C002-TC-358,
C002-TC-516, C002-TC-617, C002-TC-619 and C002-TC-621 · record
`docs/checklists/records/vscode-<YYYY-MM-DD>-0.1.0.md`

## Executor (defect D-050)

The conductor runs this sheet for you (P-01's instruction of 2026-11-10, "do T-050 I will do mine afterwards"), driving VS Code with `code chat` and clicks, with `chat.defaultToCopilotHarness` and `chat.editor.preferCopilotHarness` set to `false` in the default profile's user settings so that its chats start on **Local**. It stops after its group-4 steps and hands you one batch, in this order: **VSC-30** (send `/gate <NNN>`, choose Revise, type a short reason, then Approve), **VSC-31**, **VSC-19** (the ideation is in revision again after VSC-31) and **VSC-12**. Then the conductor runs VSC-54, completes the record and runs the dry run. Where the steps below say "you", read "the executor".

## Prerequisites

- **Hosts:** VS Code **1.145.2** (stable, commit c4453f8ea4) and GitHub Copilot Chat **0.73.0**,
  which this build ships built in, with auto-update off (the built-in Copilot Chat updates only with
  VS Code), Local session type, signed in with your own **GitHub Copilot Pro** login. Copilot Pro has no Opus, so
  the conductor's file names `claude-opus-5.5` and VS Code runs it on Sonnet. That is expected:
  record what VS Code shows in `models_used`.
- **Local harness (conductor's pilot of 2026-11-10, `docs/test-responsibilities.md` §4):** VS Code 1.145.2
  calls the session type a *harness*, picked in the chat footer (Copilot, Local, Cloud, Claude, Codex). New chats
  start on **Copilot**: switch every chat of this run to **Local** before you send the first message. Check the
  model picker too (your window had a custom endpoint selected). VS Code may then show a survey "Why did you switch
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
- **Package with the D-047 fix:** by your decision 'Fold into 0.1.0 (Recommended)', the 0.1.0
  packages are packed at commit 9eb56c0, which carries the host-version fix and the tested versions
  above (check in step 2). Packages from b481e82 do not: their doctor probes `vscode-insiders` and
  their CLI prints `copilot-chat missing` on VS Code 1.145.2.
- Node 22.22.3 first on PATH:
  `$env:Path = "C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3;" + $env:Path`.
- **Package:** `dist\architect-copilot-0.1.0.zip` and `dist\architect-sdd-0.1.0.tgz`, packed at
  the release-candidate commit 9eb56c0 (moved from b481e82, the commit C002-T-076 records, by revision D-047). The enforcement mode is **`sdd-mcp-server`**.
- **Spend:** about 13 VS Code chat sessions, or about 26 if one repeat is needed. They are billed in
  AI Credits to your Copilot plan, not to the prepaid API key, with no ledger entry. The Copilot CLI
  pool (7.70 of 30 USD before T-076) is not touched.

## Steps

0. Close VS Code and back up its user settings.

```powershell
Copy-Item "$env:APPDATA\Code\User\settings.json" "$env:APPDATA\Code\User\settings.json.t050-backup"
```

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
Expand-Archive C:\Sandbox\ClaudeCode\Architect\dist\architect-copilot-0.1.0.zip -DestinationPath C:\Sandbox\runs\t050\architect-copilot-0.1.0
```

4. Build the toy repository and the two-folder workspace exactly as the checklist's "Scope of a run"
   and VSC-01 describe: `toy\src\app.ts` holding `export const app = "toy";` and committed, an empty
   `toy-other`, and `toy.code-workspace` listing `toy` first.

5. Run the steps **in this order**. For each step, follow that step's Do, Expect and Record in the
   checklist, and fill in its entry in the record before you move on:

   - **Group 1, install:** VSC-01, VSC-02. In VSC-02, run the install yourself in your own terminal,
     from the root of `toy`:

```powershell
sdd install copilot --package C:\Sandbox\runs\t050\architect-copilot-0.1.0
```

   - **Group 2, hooks off:** VSC-03 (`chat.useHooks` false), then VSC-04 (restricted mode), then
     VSC-07 (restore).
   - **Group 3:** VSC-08, then **directly** VSC-10 (the hooks state, from the three sources).
   - **Group 4:** VSC-11, VSC-13 to VSC-18, VSC-20 to VSC-24, VSC-27 to VSC-29 (conductor); then your batch VSC-30, VSC-31, VSC-19, VSC-12; then VSC-54 (conductor). Before D-050: VSC-11 to VSC-24, then VSC-27 to VSC-31, then VSC-54. VSC-27 and VSC-28 are the
     delegated edit with `fixtures/toy-planted-line.md`. VSC-30 is gate G1. VSC-54 checks that a
     specialist subagent cannot edit a file or run a command (your answer to Q-guard-proof-01); if it
     can, the step fails and the release is refused.

6. **`models_used`** (from VSC-02 onwards): for the turns of `sdd-conductor`, record the model ID
   that the chat's model picker shows, or `not shown`. Add a specialist where you read one. In the
   `note` of VSC-02, say whether VS Code showed the model where `INSTALL.md` says it does. If it
   showed it elsewhere or nowhere, this is not a failed step: tell the conductor, who logs a spec
   defect against C002-IF-005.

7. **Restricted-mode rule (VSC-04).** If VS Code itself refuses the chat or the `/doctor` prompt and
   no tool call of the package runs, record `passed` with
   `note: "VS Code refused: <VS Code's message, quoted exactly>"`. If VS Code runs the prompt, the
   step passes only with the row showing `ok`, the caveat Version text and an empty Fix. Otherwise it
   is `failed`.

8. **Other-mode steps:** record VSC-05, VSC-06, VSC-09, VSC-25, VSC-26 and VSC-32 to VSC-53 as
   `not-applicable`. The injection cases ran on Copilot CLI in T-054. Remove `observed` and `note`
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
    the whole checklist runs again under a later date. A refuted assumption (A-1 to A-8), a failed VSC-54 or a
    refuted S-08 fact (the table in the checklist's "Scope of a run" maps F-1 … F-7 to their steps)
    is recorded `failed` **and** becomes a spec defect.

11. Sign off at the bottom of the record (`Signed off: <name>, <date>`). Then run the dry run. Expect
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
- the assumption outcomes are in `observed`;
- your name is in `executed_by` and the sign-off;
- the dry run shows no checklist error.

**Fail:** any step is `failed`, or there is a binding earlier `failed` run.

**Time budget:** allow half a day (estimate: 27 steps and about 13 chat sessions).

## Tell the conductor

> T-050 done: record at docs/checklists/records/vscode-<YYYY-MM-DD>-0.1.0.md, all 27 sdd-mcp-server
> steps passed, hooks_state enabled, models_used sdd-conductor = <model ID | not shown> (<shown in
> the model picker | elsewhere: …>), VSC-04 <row ok | VS Code refused>, dry run: <outcome line>.

If it failed: "T-050 failed at VSC-<nn>: <what happened>, record kept at <path>".
