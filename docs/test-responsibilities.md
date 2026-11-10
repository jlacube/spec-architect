# Who runs which release test — conductor or P-01

Study of 2026-11-10: which of the remaining 0.1.0 release tests the conductor (Claude, in this
repository) can run itself, how far, and where P-01 has to act. It covers Claude Code (C001) and GitHub
Copilot (C002). OpenCode moved to CHG-003 and is out of scope.

## 1. What the conductor can and cannot do

| Capability | Available | Limit |
|---|---|---|
| Headless Claude Code sessions | yes: the eval harness, `--auth subscription` (Max plan, token file outside the repo, never printed) | none for scripted sessions; the transcript is the evidence |
| Isolated Claude Code profile | yes: `CLAUDE_CONFIG_DIR`, `HOME`, `USERPROFILE`, `APPDATA` pointed at an empty folder (D-030) | machine-wide state stays (PATH, registry, Credential Manager, `LOCALAPPDATA`) |
| Copilot CLI sessions | yes: Copilot CLI 1.0.98 with P-01's credential store (C002-T-045/T-076) | billed to P-01's Copilot plan (pool rule 30 USD) |
| Send a prompt to VS Code chat | yes: `code chat -m <mode> "<prompt>"` (VS Code 1.145.2), from the shell | the answer appears in the VS Code window only, not on the shell |
| See and click in VS Code | partly: computer use, VS Code is a *click-tier* app | screenshots and left clicks only; **no typing, no keyboard, no right-click**; P-01 approves access first |
| Edit VS Code settings | technically yes (the file) | persistent configuration: only with P-01's explicit go, with a backup |
| Sign in (Claude, GitHub, Copilot) | **no** | credentials are P-01's, always |
| Accept trust, consent or tool-approval dialogs | **no, not on its own** | each one needs P-01's explicit go |
| Sign a verification record as P-01 | **no** | the plan says "P-01 executes this task" for T-050 and T-057; the record template ends "Signed off: <P-01 name>" |

## 2. Test by test

### Claude Code — C001-TC-1102 / NFR-602 (clean-profile install, timed)

| Part | Who | Notes |
|---|---|---|
| Functional part of TS-1102 (marketplace add, install, conductor starts) | **conductor — done** | `scripts/manual/isolated-profile-check.mjs`, PASS at 4dae1db, 0 USD |
| End-to-end flow to the first interview question (init, G0, new change, ideate) | **conductor — possible** | a scripted session in the isolated profile with the eval token, answering the recommended options (the same driver as the toy chain). Gives the machine time and proves the flow, ~1–3 USD notional. Not run yet |
| Time for a human to read the README and follow it (NFR-602, ≤ 15 min) | **P-01** | a learnability measure of a person; a scripted run cannot stand in for it without changing NFR-602 |
| Sign-in in the isolated profile | **P-01** | not timed |

### Claude Code — all release evals

Done by the conductor (C001-T-072, 630 sessions). Nothing left for P-01 except TC-1102's timed part.

### Copilot — C002-T-076 (Copilot CLI evidence)

Done by the conductor (24/24, 0 acted upon). Only a retake at a new version would need it again.

### Copilot — C002-T-050 (VS Code checklist, 54 steps)

| Part | Who | Notes |
|---|---|---|
| Preparation: package install (`sdd install copilot`), `sdd host-version vscode`, settings backup, toy repository, replays, dry run | **conductor** | shell only; the settings backup and any settings edit need P-01's go |
| Steps whose evidence is a shell command or a file (host-version, doctor output files, `.sdd/` contents, git status after guard refusals) | **conductor** | about a quarter of the steps can be checked this way |
| Sending the step prompts to the conductor agent | **conductor — possible** | `code chat -m sdd-conductor "<prompt>"`; results read from screenshots |
| Answering `ask_user` questions with free text, typing in chat, keyboard shortcuts | **P-01** | typing is blocked for the conductor in VS Code |
| Clicking an option of an `ask_user` question or a chat button | conductor possible, fragile | screenshot coordinates; one wrong click can make a step fail, and a failed step stays binding (Q-checklist-rerun-01) |
| Workspace Trust, tool-approval and hook consent dialogs | **P-01** (or the conductor with P-01's go per dialog) | security consent |
| GitHub Copilot sign-in in VS Code | **P-01** | |
| Signing the checklist record | **P-01** | the plan names P-01 as executor; a conductor-run record would need a CHG-002 revision |

Verdict: the conductor can do the preparation and the shell-checkable steps, and could send prompts and
read results, but the chat interaction itself (typing, answering questions, consent dialogs) and the
sign-off stay P-01's. Driving the whole checklist by screenshots is possible in principle but slow and
fragile, and a failed step cannot be rerun.

### Copilot — C002-T-057 (timed clean-profile run in VS Code)

| Part | Who | Notes |
|---|---|---|
| A clean VS Code instance | **conductor** | `code --user-data-dir <empty> --extensions-dir <empty>` gives an isolated VS Code, the counterpart of D-030; the spec still says "fresh user profile", so this needs the same kind of revision as D-030 |
| GitHub sign-in in that instance | **P-01** | |
| The timed run following the install notes (NFR-601, ≤ 15 min) | **P-01** | human learnability, as for NFR-602 |

### Publication and release — C002-T-075, T-055

**P-01 only** (npm publish and releases are never the conductor's).

## 3. Proposed split

1. **Conductor, now:** the end-to-end scripted TC-1102 flow in the isolated profile (machine time and
   flow evidence), and the T-050 preparation (install, host-version, replays, dry run).
2. **P-01:** the two timed human runs (TC-1102, T-057), the T-050 chat steps and dialogs, every sign-in,
   the record sign-offs, then publish and release.
3. **Optional pilot:** with P-01's go, the conductor tries 2–3 T-050 steps through `code chat` and
   screenshots on a scratch run (not the binding record) to measure how much of the checklist it can
   carry. Only then decide whether to change the executor of T-050 (a CHG-002 revision).
4. **Needed either way:** a CHG-002 revision for T-057's "fresh user profile", like D-030 for TC-1102.
