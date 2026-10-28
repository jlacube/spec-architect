# T-050 — Manual VS Code checklist run and record

**Purpose:** run `docs/checklists/vscode-copilot.md` on the Copilot release candidate in VS Code
Insiders with hooks enabled, take the toy change to G1, and save the checklist record.

Task C002-T-050 · cases C002-TC-901 (the run) and C002-TC-618 (record review), plus C002-TC-358,
C002-TC-516, C002-TC-617, C002-TC-619 and C002-TC-621 · record
`docs/checklists/records/vscode-<YYYY-MM-DD>-0.0.2.md`

## Prerequisites

- **Hosts:** VS Code Insiders **1.142.0-insider** and GitHub Copilot Chat **0.35.3**, with
  auto-update off, signed in with your own **GitHub Copilot Pro** login. Copilot Pro has no Opus, so
  the conductor's file names `claude-opus-5.5` and VS Code runs it on Sonnet. That is expected:
  record what VS Code shows in `models_used`.
- **A new, empty VS Code profile** (Profiles: New Profile). A new profile starts without
  extensions, so make sure Copilot Chat 0.35.3 is installed in it.
- Node 22.22.3 first on PATH, as in T-051 step 1.
- **Package:** `dist\architect-copilot-0.0.2.zip` and `dist\architect-sdd-0.0.2.tgz`, packed at
  T-054's commit. The enforcement mode is **`sdd-mcp-server`**.
- **Spend:** about 13 VS Code chat sessions, or about 26 if one repeat is needed. They are billed in
  AI Credits to your Copilot plan, not to the prepaid API key, with no ledger entry. The Copilot CLI
  pool (3.29 of 30 USD) is not touched.

## Steps

1. Create the record from the template.

```powershell
Copy-Item C:\Sandbox\ClaudeCode\Architect\docs\checklists\records\TEMPLATE.md "C:\Sandbox\ClaudeCode\Architect\docs\checklists\records\vscode-$(Get-Date -Format yyyy-MM-dd)-0.0.2.md"
```

   Fill in the header: `date`, `package_version: 0.0.2`, `host_versions` (from Help: About),
   `session_type: Local`, `enforcement_mode: sdd-mcp-server`, `executed_by`.

2. Install the CLI from the tarball and check the versions. `sdd --version` must print `0.0.2`, and
   `sdd host-version vscode-insiders` must print both host versions.

```powershell
npm install -g C:\Sandbox\ClaudeCode\Architect\dist\architect-sdd-0.0.2.tgz
```
```powershell
sdd --version
```
```powershell
sdd host-version vscode-insiders
```

3. Unpack the package outside the toy repository. The path must contain no `"`, `$`, `%` or
   backtick.

```powershell
Expand-Archive C:\Sandbox\ClaudeCode\Architect\dist\architect-copilot-0.0.2.zip -DestinationPath C:\Sandbox\runs\t050\architect-copilot-0.0.2
```

4. Build the toy repository and the two-folder workspace exactly as the checklist's "Scope of a run"
   and VSC-01 describe: `toy\src\app.ts` holding `export const app = "toy";` and committed, an empty
   `toy-other`, and `toy.code-workspace` listing `toy` first.

5. Run the steps **in this order**. For each step, follow that step's Do, Expect and Record in the
   checklist, and fill in its entry in the record before you move on:

   - **Group 1, install:** VSC-01, VSC-02. In VSC-02, run the install yourself in your own terminal,
     from the root of `toy`:

```powershell
sdd install copilot --package C:\Sandbox\runs\t050\architect-copilot-0.0.2
```

   - **Group 2, hooks off:** VSC-03 (`chat.useHooks` false), then VSC-04 (restricted mode), then
     VSC-07 (restore).
   - **Group 3:** VSC-08, then **directly** VSC-10 (the hooks state, from the three sources).
   - **Group 4:** VSC-11 to VSC-24, then VSC-27 to VSC-31. VSC-27 and VSC-28 are the delegated edit
     with `fixtures/toy-planted-line.md`. VSC-30 is gate G1.

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
    the whole checklist runs again under a later date. A refuted assumption (A-1 to A-8) is
    recorded `failed` and becomes a spec defect.

11. Sign off at the bottom of the record (`Signed off: <name>, <date>`). Then run the dry run. Expect
    no `ERR-REL-003`, `ERR-REL-004`, `ERR-REL-009 … checklist` or `ERR-REL-010` line.

```powershell
node C:\Sandbox\ClaudeCode\Architect\scripts\release-check.mjs --target copilot --dry-run
```

## Pass / fail

**Pass** needs all of these:

- every sdd-mcp-server step (the 26 above) is `passed` and listed once in run order;
- the other-mode steps are `not-applicable`;
- `hooks_state: enabled`, with `hooks_sources` `{ use_hooks: on, workspace_trust: trusted, policy:
  none }`;
- `models_used` has the key `sdd-conductor`;
- the assumption outcomes are in `observed`;
- your name is in `executed_by` and the sign-off;
- the dry run shows no checklist error.

**Fail:** any step is `failed`, or there is a binding earlier `failed` run.

**Time budget:** allow half a day (estimate: 26 steps and about 13 chat sessions).

## Tell the conductor

> T-050 done: record at docs/checklists/records/vscode-<YYYY-MM-DD>-0.0.2.md, all 26 sdd-mcp-server
> steps passed, hooks_state enabled, models_used sdd-conductor = <model ID | not shown> (<shown in
> the model picker | elsewhere: …>), VSC-04 <row ok | VS Code refused>, dry run: <outcome line>.

If it failed: "T-050 failed at VSC-<nn>: <what happened>, record kept at <path>".
