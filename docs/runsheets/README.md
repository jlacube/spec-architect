# Run sheets for P-01 — CHG-002 milestone C002-M-07

These sheets are for the human runs of milestone C002-M-07 at version 0.0.3: the timed Copilot
clean-profile run, the manual VS Code checklist, the npm publication of `architect-sdd` and the
Copilot release. The OpenCode sheets (T-051, and part 2 of the T-052 sheet) are moved to CHG-003
(revision D-036): CHG-002 releases Copilot only. Each sheet is a short version of its task file under
`.sdd/002-multi-platform-targets/20-plan/50-tasks/`. If a sheet and its task file disagree, the task
file wins. Tell the conductor about the difference.

## Recommended order

| # | Sheet | Task | What it gives | Needs first |
|---|---|---|---|---|
| 1 | [T-050-vscode-checklist.md](T-050-vscode-checklist.md) | C002-T-050 | Checklist record `docs/checklists/records/vscode-<date>-0.0.3.md` | T-046, T-054, **T-071** (the 0.0.3 release-candidate commit) |
| 2 | [T-057-copilot-clean-profile.md](T-057-copilot-clean-profile.md) | C002-T-057 | Copilot timed run (15 min or less) | T-023, T-034, T-039, T-058, **T-071** |
| 3 | [T-052-publish-and-opencode-release.md](T-052-publish-and-opencode-release.md), part 1 | C002-T-075 | `architect-sdd` 0.0.3 on npm, record `docs/releases/architect-sdd/0.0.3.md` | **T-050**, **T-057**, T-071, T-074 |
| 4 | [T-055-copilot-release.md](T-055-copilot-release.md) | C002-T-055 | Copilot release record and zip | **T-050**, **T-057**, **T-075** (before or together), T-054, T-047, T-048 |
| — | [T-051-opencode-clean-profile.md](T-051-opencode-clean-profile.md); part 2 of the T-052 sheet | C002-T-051, C002-T-052 | moved to CHG-003 | — |

How the tasks depend on each other:

- **OpenCode**: moved to CHG-003. No OpenCode sheet runs in CHG-002.
- **Copilot** (1, 2 → 3 → 4): T-050 and T-057 do not depend on each other, so you can swap them.
  T-075 and T-055 need both.
- **npm**: `architect-sdd` 0.0.3 goes on npm before or together with the Copilot release. T-075
  publishes it, only after a `released` Copilot dry run. If that dry run is not `released`, nobody
  publishes it.

## Rules that apply to every sheet

- **Versions.** The Copilot hosts are VS Code
  Insiders 1.142.0-insider and GitHub Copilot Chat 0.35.3, with auto-update off. Node is 22.22.3,
  from `C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3`. Check each version just
  before each run and record it. If a host updates itself, its evidence is no longer valid.
- **Packages.** Use the files in `C:\Sandbox\ClaudeCode\Architect\dist\`: the zip
  `architect-copilot-0.0.3.zip` and the tarball
  `architect-sdd-0.0.3.tgz`. Until T-075 publishes it, install `architect-sdd` from the tarball, even
  though `INSTALL.md` says `npm install -g architect-sdd@0.0.3`.
- **Keys and logins.** No sheet of CHG-002 uses OpenRouter (T-051 moved to CHG-003). The Copilot sheets
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
  Without `--dry-run`, the check writes `docs/releases/<target>/0.0.3/release.json`, whether the
  outcome is `released` or `refused`.
- **Commits.** Leave your files uncommitted and send the conductor the "Tell the conductor" line.
  The conductor commits and runs `sdd task set … --status done`.
