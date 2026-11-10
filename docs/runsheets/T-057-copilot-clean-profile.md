# T-057 — Copilot clean-profile run, timed

**Purpose:** in an isolated VS Code profile (CHG-002 revision D-048, in place of a fresh Windows profile), time how long it takes to go from the first install command
to the first interview question of a new change in VS Code with Copilot, using only
`INSTALL.md` (limit 15 minutes). The `sdd install copilot` step is timed on its own.

Task C002-T-057 · cases C002-TC-903 (C002-TS-306) · record `docs/releases/clean-profile-runs.md`,
Copilot section (create the file if it does not exist yet; the OpenCode run moved to CHG-003)

## Prerequisites

- **An isolated VS Code profile** (CHG-002 revision D-048; C002-SPEC-NFR), not a fresh Windows user
  profile: a new PowerShell 7 window set up by `scripts/manual/isolated-vscode-profile.ps1`, whose `code`
  starts a separate VS Code with its own empty user data and extensions folders, and whose home, roaming
  data and npm global prefix point into a new empty folder. Start VS Code **only** with that window's
  `code` (the Start menu opens your own profile). Caveat: Node, the VS Code build, Credential Manager
  and the `sdd` you installed globally before stay visible; the script prints them.
- **Hosts:** VS Code **1.145.2** (stable) and Copilot Chat **0.73.0**, built in, with auto-update off
  (`update.mode` none, extension auto-update off; CHG-002 revision D-047; the set-up script writes both
  into the isolated instance's settings). Sign in with your own **GitHub Copilot Pro** login
  **before** the timer starts. Copilot Pro has no Opus, so the conductor runs on Sonnet.
- **Node 22.22.3** from `C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3` (machine-wide,
  shared with the isolated profile).
- **Package:** `C:\Sandbox\ClaudeCode\Architect\dist\architect-copilot-0.1.0.zip` and
  `dist\architect-sdd-0.1.0.tgz`, packed at the release-candidate commit (9eb56c0 since revision D-047; T-076 recorded b481e82) (ask the
  conductor which commit; install the CLI from the tarball until T-075 publishes it).
- **Spend:** 1 VS Code session, billed in AI Credits to your Copilot plan, not to the prepaid key.
  There is no ledger entry.

## Steps

**Set-up (not timed).** Close every VS Code window first. Open a **new** PowerShell 7 window and use it
for the whole run.

1. Put Node first on PATH, then set up the isolated VS Code profile on a new folder. Check its output:
   VS Code 1.145.2, Copilot Chat 0.73.0 built in, Marketplace extensions "none", npm global prefix
   `C:\Sandbox\runs\t057\iso\npm`, user settings with only `update.mode` none and
   `extensions.autoUpdate` false, your git identity, and no warning about `code`. Write the "Caveat: an sdd is already
   reachable" line, if shown, into the record.

```powershell
$env:Path = "C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3;" + $env:Path
```
```powershell
. C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-vscode-profile.ps1 -Root C:\Sandbox\runs\t057\iso
```

2. Start the isolated VS Code with this window's `code`, and in its "Welcome to VS Code" dialog choose
   **Continue with GitHub** and sign in with your Copilot Pro login. Leave that VS Code open.

```powershell
code
```

   Then make a fresh git repository inside the profile.

```powershell
New-Item -ItemType Directory -Force $env:USERPROFILE\runs\t057\toy
```
```powershell
git -C $env:USERPROFILE\runs\t057\toy init
```

3. Unpack the package outside the repository, to the folder that `INSTALL.md` step 1 suggests. Then
   read `INSTALL.md`.

```powershell
Expand-Archive C:\Sandbox\ClaudeCode\Architect\dist\architect-copilot-0.1.0.zip -DestinationPath $env:USERPROFILE\architect\copilot-0.1.0
```

4. Optional: start a screen recording, for example with the Snipping Tool's record mode.

**Timed part.** Start the stopwatch at the first install command. Write down the time at the end of
each phase, and leave out any download time.

5. **Phase A, CLI.** Install the CLI (it lands in the profile's npm prefix), then check that `sdd --version`
   prints `0.1.0` and that `(Get-Command sdd).Source` is under `C:\Sandbox\runs\t057\iso\npm`.

```powershell
npm install -g C:\Sandbox\ClaudeCode\Architect\dist\architect-sdd-0.1.0.tgz
```
```powershell
sdd --version
```

6. **Phase B, `sdd install copilot`.** Time this phase on its own. Run it in the isolated PowerShell
   window (not VS Code's terminal, not another window), in the repository root.

```powershell
Set-Location $env:USERPROFILE\runs\t057\toy
```
```powershell
sdd install copilot --package $env:USERPROFILE\architect\copilot-0.1.0
```

7. **Phase C, settings.** Open the folder in the isolated VS Code (`code .` from this window) and trust it. Set
   `chat.plugins.enabled` to `true`, `chat.pluginLocations` to the package folder, and
   `chat.askQuestions.enabled` to `true`. Reload the window.

8. **Phase D, first question.** Open a chat, choose the **Local** session type in the chat footer (VS Code 1.145.2's picker; it calls it a harness), check
   the model picker, and select `sdd-conductor`. Send `/status` as
   the first message. Then run `/doctor`, then `/init` (recommended options, approve G0), then
   `/new "Toy change"`. **Stop the stopwatch** when the conductor asks the first question of the new
   change.

## Record

In `docs/releases/clean-profile-runs.md`, add a section `## Copilot` with these fields:

- the date
- the versions: VS Code, Copilot Chat, Node, `architect-sdd`, the package
- how the hosts were provided: "isolated VS Code profile (D-048)", with the script's caveat line if shown
- the time of each phase (A CLI, **B `sdd install copilot`**, C settings, D first question) and the
  total, with any download time left out
- a link to the transcript or screen recording, saved outside the repository unless the conductor
  says otherwise
- an extra note, not needed to pass: the model the chat's model picker showed for `sdd-conductor`

## Pass / fail

- **Pass:** the total from the first install command to the first question is **15:00 or less**,
  download time left out.
- **Fail:** the total is over 15:00, or the first question was never reached. The failure counts.
  Tell the conductor, and repeat the whole run only after the fix.

**Afterwards:** close the isolated VS Code and the window. Delete `C:\Sandbox\runs\t057\iso` when the
conductor has the record (your own VS Code profile is not touched).

**Time budget:** 15 minutes is the binding limit. Allow about 45 minutes overall (estimate).

## Tell the conductor

> T-057 done: Copilot <mm:ss> to the first question (limit 15:00; A <…>, B sdd install <…>, C <…>,
> D <…>), record at docs/releases/clean-profile-runs.md (Copilot section), recording at <path>,
> conductor model shown: <id | not shown>.

If it failed: "T-057 failed: <reason>, <time>".
