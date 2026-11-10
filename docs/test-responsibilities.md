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
| End-to-end flow to the first interview question (init, G0, new change, ideate) | **conductor — done** | `scripts/manual/isolated-profile-e2e.mjs`, PASS on 2026-11-10 at 32f180a (plugin tree = 9eb56c0): 180.6 s machine time, 1.00 USD notional (`docs/release-0.1.0-evidence.md` §3) |
| Time for a human to read the README and follow it (NFR-602, ≤ 15 min) | **waived** | CHG-001 defect D-031 (2026-11-10): the time depends on inference (model, effort, provider); an untimed docs walkthrough moves to the follow-up change |
| Sign-in in the isolated profile | **P-01** | not timed |

### Claude Code — all release evals

Done by the conductor (C001-T-072, 630 sessions). Nothing left for P-01 (TC-1102's timed part is waived, D-031).

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
| The timed run following the install notes (NFR-601, ≤ 15 min) | **waived** | CHG-002 defect D-049 (2026-11-10): C002-T-057 dropped |

### Publication and release — C002-T-075, T-055

**P-01 only** (npm publish and releases are never the conductor's).

## 3. Proposed split

1. **Conductor, now:** the end-to-end scripted TC-1102 flow in the isolated profile (machine time and
   flow evidence), and the T-050 preparation (install, host-version, replays, dry run).
2. **P-01:** the T-050 chat steps and dialogs, every sign-in,
   the record sign-offs, then publish and release.
3. **Optional pilot:** with P-01's go, the conductor tries 2–3 T-050 steps through `code chat` and
   screenshots on a scratch run (not the binding record) to measure how much of the checklist it can
   carry. Only then decide whether to change the executor of T-050 (a CHG-002 revision).
4. **Needed either way:** a CHG-002 revision for T-057's "fresh user profile", like D-030 for TC-1102.

## 4. T-050 pilot (2026-11-10, P-01's go "ok for … T-050")

A scratch run, not the checklist record: `C:\Sandbox\runs\t050-pilot` (toy, toy-other, toy.code-workspace), the
0.1.0 package of 9eb56c0 unpacked there, `sdd install copilot` from the toy root (exit 0, the 15 files of VSC-02).
VS Code 1.145.2, Copilot Chat 0.73.0. The global CLI was reinstalled from `dist\architect-sdd-0.1.0.tgz` (run-sheet
step 2): the global `sdd` was an older 0.1.0 build that printed `copilot-chat missing`; it now prints
`copilot-chat 0.73.0`. The default profile's `settings.json` was backed up, the four settings of VSC-01/02/07 set,
and restored at the end (backup removed).

**Correction.** A first attempt reported two blockers ("the package does not load", "no Local session type"); both
were the conductor's errors, withdrawn the same day: (1) the settings were written with `node -e` from Git Bash,
whose argument conversion collapsed the `\` of the package path, so `chat.pluginLocations` named a path that does
not exist (the trace log of an isolated VS Code instance showed
`Could not resolve plugin path: …C%3ASandbox%0Duns%09050-pilot…`); (2) VS Code 1.145.2 calls the session type a
**harness** (footer picker: Copilot, Local, Cloud, Claude, Codex), and the window's chats were on the Copilot harness.

| What | Outcome |
|---|---|
| Plugin discovery with a correct path | the package loads: trace log of an isolated instance (`--user-data-dir`, `--log trace`) shows VS Code watching the package's `prompts`, `skills`, `commands` and `.mcp.json`; in P-01's profile `/doctor` ran "the doctor skill" after reading `doctor.prompt.md` |
| Harness picker | Copilot (the default of new chats here), Local, Cloud, Claude, Codex; Local is selectable |
| `code chat -m sdd-conductor "/doctor"` | **Git Bash mangles it** (`C:/Program Files/Git/doctor`, MSYS path conversion): send from PowerShell; from PowerShell the prompt reaches `sdd-conductor`, but always in a **new session on the default harness (Copilot)**, even right after Local was selected, so the conductor cannot run a Local-harness step through `code chat` |
| `/doctor` on the Copilot harness | the skill ran and delegated to `sdd-cartographer`, which ended "Doctor: failed: sdd CLI not reachable": on that harness the `sdd-shell` tools were not available to it (not the checklist's harness; recorded as a caveat) |
| Model | the window's model was a custom endpoint ("Reflection AI / Beam1", connection refused); switched by clicks to Claude Sonnet 5.5; a later session picked "Copilot Fusion" (Auto) |
| Workspace MCP servers | `sdd-files`, `sdd-shell`, `serena`, `context7`, `deepwiki` started |
| Dialogs met | Workspace Trust (conductor trusted its own scratch folder), a VS Code survey "Why did you switch harnesses?" (closed unanswered), a "13 user customizations need an update" migration notice for P-01's own items (not touched) |
| Copilot credits | 4 short sessions (about 50 AI credits shown), billed to P-01's Copilot plan |

**Outcome for T-050:** no blocker found. The run sheet gains a note: select the **Local harness** (footer picker) for
every chat, set the model in the chat's model picker, and expect the harness survey. **What the pilot shows about the
split:** the conductor can do the setup by shell, switch harness and model and read results by clicks and
screenshots, and read VS Code's own logs; it cannot type (slash list, free-text answers) and `code chat` cannot target
the Local harness, so the checklist's chat steps stay P-01's, as §2 says.
