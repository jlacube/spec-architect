# T-072 — Claude Code clean-profile install, timed (TC-1102)

**Purpose:** in an isolated Claude profile on Windows 11, time how long it takes to go from opening the
README to the first interview question of a new change, installing the Architect plugin 0.1.0 from the
local marketplace (limit 15 minutes, C001-NFR-602). This is the last open test case of the release gate.

Task C001-T-072 · case C001-TC-1102 (C001-TS-1102, C001-AC-1102.1, C001-REQ-1102) · procedure
`tests/manual/TS-1102.md` · record `docs/dogfood.md` (new entry) · evidence
`docs/release-0.1.0-evidence.md` §3. If this sheet and the procedure disagree, the procedure wins. Tell
the conductor about the difference.

**Why an isolated Claude profile** (defect D-030, your answer to Q-clean-profile-01 of 2026-11-10,
'Isolated Claude profile (Recommended)'): a new Windows account is not possible here and Windows 11 Home
has no Windows Sandbox. You stay in your own account; one PowerShell window gets its own empty Claude
Code configuration, home and roaming folders (definition in C001-SPEC-NFR). **Caveat:** Node, Git,
ripwire, uv and Serena stay those of your account, so a prerequisite missing from the README would not
show. The functional part (marketplace add, install, plugin listed, conductor resolves) has already
passed as an automated check (evidence §3); your run gives the timing.

## Prerequisites

- **Nothing to create.** The script below makes a new empty profile folder (by default
  `$HOME\architect-iso-<date-time>` of your real profile) and points the window at it.
- **Claude Code 2.1.295 or later:** the script uses the desktop-bundled Claude Code
  (`%APPDATA%\Claude\claude-code\<version>\…\claude.exe`, newest version), not the old `claude` on your
  PATH (2.0.76, broken). Sign in once in the isolated window **before** the timer starts. A sign-in is
  yours to do; never write a password, key or token in a file, record or transcript.
- **Node 20 or later and Git** on your PATH (machine-wide; the script prints both versions).
- **The repository** at `C:\Sandbox\ClaudeCode\Architect`, at the release-candidate commit `b6f1509` or a
  later documentation-only commit (`plugins/architect/.claude-plugin/plugin.json` must give `0.1.0`).
- **Spend:** one interactive Claude Code session on your Claude plan (the conductor, the cartographer
  survey and the constitution interview). It is not billed to the prepaid API key, and there is no
  ledger entry.

## Steps

**Set-up (not timed).** Open a **new** PowerShell 7 window (the settings stay in that window only).

1. Put Node first for this window, then set up the isolated profile:

```powershell
$env:Path = "C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3;" + $env:Path
```
```powershell
. C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-profile.ps1
```

   Expected: `Isolated Claude profile: <folder>`, `claude -> …\claude-code\<version>\…\claude.exe`,
   `claude 2.1.3xx (Claude Code)` (2.1.295 or later), `node v22.22.3`, a git version, and
   `"loggedIn": false`. Write down the folder. Keep using this window for every step below.

2. Sign in: run `claude`, type `/login`, finish the sign-in in the browser, then `/exit`.
   `claude auth status` should now show `"loggedIn": true`. Check that the profile has no plugin yet:
   `claude plugin list` prints "No plugins installed".

3. Optional: start a screen recording, for example with the Snipping Tool's record mode.

**Timed part.** Start the stopwatch when you open the README
(`C:\Sandbox\ClaudeCode\Architect\README.md`, section "Install (Windows 11)"). Leave out any download
time. Write down the time at the end of each phase.

4. **Phase A, marketplace.** In the isolated window, start `claude`, then add the repository as a
   marketplace:

```text
/plugin marketplace add C:\Sandbox\ClaudeCode\Architect
```

   Expected: the marketplace `architect-local` is added.

5. **Phase B, install.** Install the plugin; restart Claude Code if it asks.

```text
/plugin install architect@architect-local
```

   Then open `/plugin`. Expected: **architect** is listed as installed, from `architect-local`, version
   **0.1.0**, enabled. (Pass criterion 1.)

6. **Phase C, conductor.** Quit Claude Code (stay in the isolated window; `$HOME` is now the profile folder). Make a new empty git repository and start the conductor in
   it:

```powershell
New-Item -ItemType Directory -Force $HOME\runs\tc1102\toy
```
```powershell
Set-Location $HOME\runs\tc1102\toy
```
```powershell
git init
```
```powershell
claude --agent architect:sdd-conductor
```

   Send `hi` as the first message. Expected: the conductor answers as the Architect conductor; with no
   `.sdd/` it proposes `/architect:init`. (Pass criterion 2.)

7. **Phase D, init and G0.** Run `/architect:init`. Answer every constitution round with the option
   marked **(Recommended)**. When the conductor presents gate G0, run `/architect:gate constitution` if
   it asks you to, and choose **Approve**.

   Expected: `.sdd/` exists in the toy folder, and the constitution gate is recorded as approved.

8. **Phase E, first question.** Run:

```text
/architect:new "Coupon codes"
```

   Confirm the profile the conductor proposes (the recommended one). Then run `/architect:ideate`.
   **Stop the stopwatch** when the conductor asks the first interview question of the change.

9. Write down the total from opening the README to that first question, and the time of each phase.

## Record

Add an entry to `docs/dogfood.md`, headed `## <date> — CHG-001: clean-profile install (C001-TC-1102)`,
with:

- the date, the Windows build (`winver`), the Claude Code version (`claude --version`), the Node
  version, and how Node and Claude Code were provided (desktop-bundled Claude Code, machine-wide Node), the isolated profile folder, and the caveat that machine-wide tools stayed visible (isolated Claude profile, D-030);
- the plugin version that `/plugin` showed (expected 0.1.0) and the repository commit
  (`git -C C:\Sandbox\ClaudeCode\Architect rev-parse --short HEAD`);
- the time of each phase (A marketplace, B install, C conductor, D init and G0, E first question) and
  the total, download time left out;
- every README step that was unclear, as a verbatim note;
- pass or fail;
- a link to the recording, saved outside the repository unless the conductor says otherwise.

## Pass / fail

- **Pass:** step 5 shows `architect` installed from `architect-local`; step 6 starts the conductor
  (it orients on the workspace or proposes `/architect:init`); and the total from opening the README
  to the first interview question is **15:00 or less**, download time left out.
- **Fail:** any of the three does not hold. The failure counts. Tell the conductor, who opens a defect
  and repeats the whole run only after the fix. Never edit the record to make it pass.

**Time budget:** 15 minutes is the binding limit. Allow about 30 minutes overall, set-up and sign-in
included (estimate).

## Afterwards

Close the isolated window. The profile folder (with the toy folder `runs\tc1102\toy` in it) can be
deleted when the conductor has the record; your own Claude Code settings were never touched. Leave your record uncommitted; the conductor commits it, updates the evidence file and creates
the local tag `v0.1.0` (no push).

## Tell the conductor

> TC-1102 done: <mm:ss> to the first question (limit 15:00; A <…>, B <…>, C <…>, D <…>, E <…>),
> plugin 0.1.0 at <commit>, Claude Code <version>, Windows <build>, record in docs/dogfood.md,
> recording at <path>, unclear README steps: <none | notes>.

If it failed: "TC-1102 failed: <reason>, <time>".
