# T-057 — Copilot clean-profile run, timed

**Purpose:** on a fresh Windows profile, time how long it takes to go from the first install command
to the first interview question of a new change in VS Code Insiders with Copilot, using only
`INSTALL.md` (limit 15 minutes). The `sdd install copilot` step is timed on its own.

Task C002-T-057 · cases C002-TC-903 (C002-TS-306) · record `docs/releases/clean-profile-runs.md`,
Copilot section (T-051 creates the file)

## Prerequisites

- **A fresh Windows user profile** with only Node, VS Code Insiders and GitHub Copilot Chat.
- **Hosts:** VS Code Insiders **1.142.0-insider** and Copilot Chat **0.35.3**, with auto-update off
  (`update.mode` none, extension auto-update off). Sign in with your own **GitHub Copilot Pro** login
  **before** the timer starts. Copilot Pro has no Opus, so the conductor runs on Sonnet.
- **Node 22.22.3** from `C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3`. If the
  fresh profile cannot read that folder, or VS Code Insiders is not installed for it, install them in
  the profile before the timer and write that down.
- **Package:** `C:\Sandbox\ClaudeCode\Architect\dist\architect-copilot-0.0.2.zip` and
  `dist\architect-sdd-0.0.2.tgz` (install the CLI from the tarball until T-052 publishes it).
- **Spend:** 1 VS Code session, billed in AI Credits to your Copilot plan, not to the prepaid key.
  There is no ledger entry.

## Steps

**Set-up (not timed).** Sign in to the fresh profile and open PowerShell 7.

1. Put Node first on PATH, then check that `node -v` prints `v22.22.3`.

```powershell
$env:Path = "C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3;" + $env:Path
```
```powershell
node -v
```

2. Make a fresh git repository.

```powershell
New-Item -ItemType Directory -Force C:\Sandbox\runs\t057\toy
```
```powershell
git -C C:\Sandbox\runs\t057\toy init
```

3. Unpack the package outside the repository, to the folder that `INSTALL.md` step 1 suggests. Then
   read `INSTALL.md`.

```powershell
Expand-Archive C:\Sandbox\ClaudeCode\Architect\dist\architect-copilot-0.0.2.zip -DestinationPath $HOME\architect\copilot-0.0.2
```

4. Optional: start a screen recording, for example with the Snipping Tool's record mode.

**Timed part.** Start the stopwatch at the first install command. Write down the time at the end of
each phase, and leave out any download time.

5. **Phase A, CLI.** Install the CLI, then check that `sdd --version` prints `0.0.2`.

```powershell
npm install -g C:\Sandbox\ClaudeCode\Architect\dist\architect-sdd-0.0.2.tgz
```
```powershell
sdd --version
```

6. **Phase B, `sdd install copilot`.** Time this phase on its own. Run it in your own terminal, in
   the repository root.

```powershell
Set-Location C:\Sandbox\runs\t057\toy
```
```powershell
sdd install copilot --package $HOME\architect\copilot-0.0.2
```

7. **Phase C, settings.** Open the folder in VS Code Insiders and trust it. Set
   `chat.plugins.enabled` to `true`, `chat.pluginLocations` to the package folder, and
   `chat.askQuestions.enabled` to `true`. Reload the window.

8. **Phase D, first question.** Open a **Local** chat and select `sdd-conductor`. Send `/status` as
   the first message. Then run `/doctor`, then `/init` (recommended options, approve G0), then
   `/new "Toy change"`. **Stop the stopwatch** when the conductor asks the first question of the new
   change.

## Record

In `docs/releases/clean-profile-runs.md`, add a section `## Copilot` with these fields:

- the date
- the versions: VS Code Insiders, Copilot Chat, Node, `architect-sdd`, the package
- how the hosts were provided
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

**Time budget:** 15 minutes is the binding limit. Allow about 45 minutes overall (estimate).

## Tell the conductor

> T-057 done: Copilot <mm:ss> to the first question (limit 15:00; A <…>, B sdd install <…>, C <…>,
> D <…>), record at docs/releases/clean-profile-runs.md (Copilot section), recording at <path>,
> conductor model shown: <id | not shown>.

If it failed: "T-057 failed: <reason>, <time>".
