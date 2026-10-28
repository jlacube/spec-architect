# T-051 — OpenCode clean-profile run, timed, and toy change to G1

> **Moved to CHG-003.** C002-T-051 is dropped from CHG-002 (revision D-036; P-01 answer to
> Q-opencode-scope-01). The OpenCode clean-profile run belongs to the future CHG-003 "OpenCode
> release", at the version that change sets. Do not run this sheet in CHG-002; it is kept for CHG-003.

**Purpose:** on a fresh Windows profile, time how long it takes to go from the first install command
to the first interview question of a new change in OpenCode, using only `INSTALL.md` (limit 15
minutes). Then take that toy change to gate G1.

Task C002-T-051 · cases C002-TC-902 (C002-TS-205) · record `docs/releases/clean-profile-runs.md`,
OpenCode section · ledger entry in `evals/results/spend-chg002.json`

## Prerequisites

- **A fresh Windows user profile**, for example a new local account (Settings › Accounts › Other
  users). It must have only Node and OpenCode, with no OpenCode config, data or credentials of its
  own.
- **Node 22.22.3** from `C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3`.
- **OpenCode 1.18.31**, the pinned binary
  `C:\Users\jerom\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe`.
- **Package files:** `C:\Sandbox\ClaudeCode\Architect\dist\architect-opencode-<version>.zip` and
  `dist\architect-sdd-<version>.tgz`. The CLI is not on npm yet, so you install it from the tarball.
- **Model access, which applies to this task:** OpenCode's OpenRouter provider, using **your
  OpenRouter key file** `C:\Users\jerom\.architect-evals\openrouter-key.txt`. You pass the key as
  `OPENROUTER_API_KEY` to this profile's OpenCode process only. This is what the task asks for, not
  your usual OpenCode login, because the fresh profile has no stored credential. Never write the key
  to the repository, to the record or to the transcript.
- **Access caveat:** a new standard account may be refused access to `C:\Users\jerom\…`. If Node,
  OpenCode or the key file give "access denied", install Node 22.22.3 and
  `npm install -g opencode-ai@1.18.31` inside the fresh profile **before** the timer starts. Type the
  key at the masked prompt of step 5b. Write down in the record which way you used.

## Steps

**Set-up (not timed).** Sign in to the fresh profile and open PowerShell 7.

1. Put Node 22.22.3 first on PATH for this shell, then check that `node -v` prints `v22.22.3`.

```powershell
$env:Path = "C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3;" + $env:Path
```
```powershell
node -v
```

2. Point `opencode` at the pinned binary, then check that it prints `1.18.31`.

```powershell
Set-Alias opencode "C:\Users\jerom\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe"
```
```powershell
opencode --version
```

3. Turn off auto-update for this shell.

```powershell
$env:OPENCODE_DISABLE_AUTOUPDATE = "1"
```

4. Make the toy repository and unpack the package outside it. Then read the unpacked `INSTALL.md`.

```powershell
New-Item -ItemType Directory -Force C:\Sandbox\runs\t051\toy
```
```powershell
git -C C:\Sandbox\runs\t051\toy init
```
```powershell
Expand-Archive C:\Sandbox\ClaudeCode\Architect\dist\architect-opencode-<version>.zip -DestinationPath C:\Sandbox\runs\t051\pkg
```

5. Give the key to this shell only. Use 5a, or use 5b if the file cannot be read.

   5a. Read the key from the file:

```powershell
$env:OPENROUTER_API_KEY = (Get-Content -Raw "C:\Users\jerom\.architect-evals\openrouter-key.txt").Trim()
```

   5b. Type the key at a masked prompt:

```powershell
$env:OPENROUTER_API_KEY = Read-Host -MaskInput "OpenRouter key"
```

6. **Spend check.** Read the key's usage in OpenRouter's usage view and write it down as the
   *start reading*. The reserve ledger holds 5.36 USD. H is 0.65 USD. The check before the run is
   5.36 + 1.40 (estimate) + 0.65 = 7.41 USD, which is 10 USD or less, so the run may start.

**Timed part.** Start the stopwatch at the first install command. Write down the time at the end of
each phase. Subtract any download time, such as OpenCode fetching its plugin package on first start,
and note it.

7. **Phase A, CLI.** Install the CLI, then check that `sdd --version` prints `<version>`.

```powershell
npm install -g C:\Sandbox\ClaudeCode\Architect\dist\architect-sdd-<version>.tgz
```
```powershell
sdd --version
```

8. **Phase B, files.** Do `INSTALL.md` "Place the package files" (the toy repository has no
   `opencode.json` yet, so you copy it as it is).

```powershell
Copy-Item -Recurse C:\Sandbox\runs\t051\pkg\.opencode C:\Sandbox\runs\t051\toy\
```
```powershell
Copy-Item C:\Sandbox\runs\t051\pkg\opencode.json, C:\Sandbox\runs\t051\pkg\architect-target.json C:\Sandbox\runs\t051\toy\
```

9. **Phase C, first question.** Start the conductor in the toy repository.

```powershell
Set-Location C:\Sandbox\runs\t051\toy
```
```powershell
opencode --agent sdd-conductor
```

   Run `/architect-doctor`. Then run `/architect-init`, answer with the recommended options and
   approve G0. Then run `/architect-new "Toy change"`. **Stop the stopwatch** when the conductor asks
   the first question of the new change.

**After the timer (paid, OpenRouter reserve, about 4 agent sessions).**

10. Continue with `/architect-ideate` until gate G1. Approve it with `/architect-gate`. **Before each
    interview round and before the gate**, read OpenRouter's usage view. Continue only if this run's
    spend so far is **3.98 USD or less** (5.36 + spend + 0.65 ≤ 10). If it is more, pause and decide.
11. Copy the G1 row of the Gate log in `.sdd/<NNN>-toy-change/change.md`. Save the session
    transcript outside the repository, for example with OpenCode's export, to
    `C:\Sandbox\runs\t051\transcript.*`. Write down the *end reading* and the number of agent
    sessions (the conductor plus the specialists it started).
12. Remove the key from the shell and close the shell.

```powershell
Remove-Item Env:OPENROUTER_API_KEY
```

## Record

In `docs/releases/clean-profile-runs.md` (a new file), add a section `## OpenCode` with these
fields:

- the date
- the versions: OpenCode, Node, `architect-sdd`, the package
- how Node, OpenCode and the key were provided (pinned path or fresh-profile install)
- the time of each phase (A CLI, B files, C first question) and the total, with any download time
  left out
- the transcript link
- the toy change's G1 Gate log row

The spend goes in the ledger: you give the readings to the conductor, who writes one entry with
`provider openrouter`, `pool reserve`, the usage reading and the session count.

## Pass / fail

- **Pass:** the total from the first install command to the first question is **15:00 or less**,
  download time left out. The G1 row shows Approve. The run's spend stayed within the reserve.
- **Fail:** the total is over 15:00, G1 was not reached, or the run paused on the spend check. A
  failed run is repeated only after the reserve check allows it again (the reserve's room is
  10 − 5.36 − this run's spend − 0.65 USD).

**Time budget:** 15 minutes is the binding limit. Allow about 1 to 1.5 hours overall (estimate).
**Spend:** OpenRouter reserve, estimate 1.40 USD, upper bound 2.60 USD.

## Tell the conductor

> T-051 done: OpenCode <mm:ss> to the first question (limit 15:00; A <…>, B <…>, C <…>), toy change
> <NNN> G1 approved, record at docs/releases/clean-profile-runs.md (OpenCode section), transcript at
> <path>. OpenRouter reserve spend <x.xx> USD over <n> sessions (reading <start> → <end>). Node,
> OpenCode and key provided via <pinned path | fresh-profile install>.

If it failed: "T-051 failed: <reason>, <time>, spend <x.xx> USD over <n> sessions".
