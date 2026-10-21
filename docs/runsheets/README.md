# Run sheets for P-01 — CHG-002 milestone C002-M-07

These sheets are for the human runs of milestone C002-M-07: two timed clean-profile runs, the manual
VS Code checklist, and the two releases. Each sheet is a short version of its task file under
`.sdd/002-multi-platform-targets/20-plan/50-tasks/`. If a sheet and its task file disagree, the task
file wins. Tell the conductor about the difference.

## Recommended order

| # | Sheet | Task | What it gives | Needs first |
|---|---|---|---|---|
| 1 | [T-051-opencode-clean-profile.md](T-051-opencode-clean-profile.md) | C002-T-051 | OpenCode timed run (15 min or less) and a toy change to G1 | T-023, T-034, T-039, T-043 (all done) |
| 2 | [T-052-publish-and-opencode-release.md](T-052-publish-and-opencode-release.md) | C002-T-052 | `architect-sdd` 0.0.1 on npm, OpenCode release record and zip | **T-051**, T-066, the unpaid re-runs at the release-candidate commit (T-048 step 5, T-049 steps 1 and 2) |
| 3 | [T-050-vscode-checklist.md](T-050-vscode-checklist.md) | C002-T-050 | Checklist record `docs/checklists/records/vscode-<date>-0.0.1.md` | T-046, T-054 (both done) |
| 4 | [T-057-copilot-clean-profile.md](T-057-copilot-clean-profile.md) | C002-T-057 | Copilot timed run (15 min or less) | T-023, T-034, T-039, T-058 (all done) |
| 5 | [T-055-copilot-release.md](T-055-copilot-release.md) | C002-T-055 | Copilot release record and zip, plus the npm publish if T-052 did not do it | **T-050**, **T-057**, T-054, T-047, T-048 |

How the tasks depend on each other:

- **OpenCode** (1 → 2) does not wait for any Copilot task. Release it as soon as T-051 passes.
- **Copilot** (3, 4 → 5): T-050 and T-057 do not depend on each other, so you can swap them. T-055
  needs both.
- **npm**: `architect-sdd` 0.0.1 goes on npm no later than the first target release. T-052 publishes
  it. If the release check refuses OpenCode, T-055 publishes it instead, but only if Copilot passes.
  If both targets are refused, nobody publishes it.

## Rules that apply to every sheet

- **Versions.** OpenCode 1.18.31 is the pinned binary
  `C:\Users\jerom\AppData\Roaming\npm\node_modules\opencode-ai\bin\opencode.exe`. Never use the
  `opencode` found on PATH, because Git Bash finds 1.15.10 first. The Copilot hosts are VS Code
  Insiders 1.142.0-insider and GitHub Copilot Chat 0.35.3, with auto-update off. Node is 22.22.3,
  from `C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3`. Check each version just
  before each run and record it. If a host updates itself, its evidence is no longer valid.
- **Packages.** Use the files in `C:\Sandbox\ClaudeCode\Architect\dist\`: the zips
  `architect-opencode-0.0.1.zip` and `architect-copilot-0.0.1.zip`, and the tarball
  `architect-sdd-0.0.1.tgz`. Until T-052 publishes it, install `architect-sdd` from the tarball, even
  though `INSTALL.md` says `npm install -g architect-sdd@0.0.1`.
- **Keys and logins.** OpenRouter spend applies only in T-051, which uses your key file
  `%USERPROFILE%\.architect-evals\openrouter-key.txt` as described in that sheet. The Copilot sheets
  use your own GitHub Copilot Pro login in VS Code. Never put a key or token in any file in the
  repository, in a record or in a transcript.
- **Copilot Pro has no Opus.** The opus-tier agents (the conductor, `sdd-critic` and
  `sdd-spec-writer`) run on Sonnet. Record what VS Code shows in `models_used`. A different model is
  not a failure.
- **Failures stay binding.** A failed step or run counts unless the rerun rule of the checklist
  repeated it (T-050), or until the run is repeated in full as the sheet says. Never edit evidence to
  make it pass. Tell the conductor, who reopens the owning task.
- **Publishing is yours.** Only you run `npm publish`, with 2FA, and only you share the zips. The
  conductor never publishes.
- **Release check.** `node scripts/release-check.mjs --target <target> --dry-run` writes nothing.
  Without `--dry-run`, the check writes `docs/releases/<target>/0.0.1/release.json`, whether the
  outcome is `released` or `refused`.
- **Commits.** Leave your files uncommitted and send the conductor the "Tell the conductor" line.
  The conductor commits and runs `sdd task set … --status done`.
