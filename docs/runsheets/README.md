# Run sheets for P-01 — CHG-002 milestone C002-M-07

These sheets are for the human runs of milestone C002-M-07 at version 0.1.0: the manual VS Code
checklist, the npm publication of `architect-sdd` and the
Copilot release. The OpenCode sheets (T-051, and part 2 of the T-052 sheet) are moved to CHG-003
(revision D-036): CHG-002 releases Copilot only. Each sheet is a short version of its task file under
`.sdd/002-multi-platform-targets/20-plan/50-tasks/`. If a sheet and its task file disagree, the task
file wins. Tell the conductor about the difference.

**Version 0.1.0** (revision D-041; P-01 answer to Q-copilot-010-01, "Ship 0.1.0 on both hosts
(Recommended)"). Copilot ships at 0.1.0, the version of the Claude Code release, not 0.0.3: the
0.0.3 candidate is refused after the CHG-001 release-gate fixes. Take every run on the 0.1.0 packages
in `dist/`, packed at the release-candidate commit of C002-T-076, which retakes the Copilot CLI
evidence first. The 0.0.3 packages still in `dist/` are not released; do not use them.

**CHG-001 release gate (C001-T-072, version 0.1.0).** One more sheet, outside C002-M-07 and independent of the
CHG-002 sheets below: [T-072-clean-profile-install.md](T-072-clean-profile-install.md), the timed Claude Code
install in an isolated Claude profile (C001-TC-1102, limit 15 minutes; D-030). **Not required at 0.1.0:** C001-NFR-602
is waived (defect D-031), so the sheet is optional and the conductor tags `v0.1.0` locally without it. The rules below about keys, failures and commits apply to it
too; it uses no CHG-002 package and no Copilot host.

## Recommended order

| # | Sheet | Task | What it gives | Needs first |
|---|---|---|---|---|
| 1 | [T-050-vscode-checklist.md](T-050-vscode-checklist.md) | C002-T-050 | Checklist record `docs/checklists/records/vscode-<date>-0.1.0.md` | T-046, T-054, **T-076** (the 0.1.0 release-candidate commit) |
| — | [T-057-copilot-clean-profile.md](T-057-copilot-clean-profile.md) | C002-T-057 | dropped (C002-NFR-601 waived, defect D-049); optional | — |
| 3 | [T-052-publish-and-opencode-release.md](T-052-publish-and-opencode-release.md), part 1 | C002-T-075 | `architect-sdd` 0.1.0 on npm, record `docs/releases/architect-sdd/0.1.0.md` | **T-050**, T-076 |
| 4 | [T-055-copilot-release.md](T-055-copilot-release.md) | C002-T-055 | Copilot release record and zip | **T-050**, **T-075** (before or together), T-054, T-047, T-048, T-076 |
| — | [T-051-opencode-clean-profile.md](T-051-opencode-clean-profile.md); part 2 of the T-052 sheet | C002-T-051, C002-T-052 | moved to CHG-003 | — |

How the tasks depend on each other:

- **OpenCode**: moved to CHG-003. No OpenCode sheet runs in CHG-002.
- **Copilot** (1 → 3 → 4): T-075 and T-055 need T-050. T-057 is dropped (defect D-049).
- **npm**: `architect-sdd` 0.1.0 goes on npm before or together with the Copilot release. T-075
  publishes it, only after a `released` Copilot dry run. If that dry run is not `released`, nobody
  publishes it.

## Rules that apply to every sheet

- **Versions.** The Copilot hosts are VS Code
  1.145.2 (stable) and GitHub Copilot Chat 0.73.0, built in, with auto-update off (CHG-002 revision
  D-047, P-01's report of 2026-11-10; S-08 ran on Insiders 1.142.0-insider with Copilot Chat 0.35.3). Node is 22.22.3,
  from `C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3`. Check each version just
  before each run and record it. If a host updates itself, its evidence is no longer valid.
- **Packages.** Use the files in `C:\Sandbox\ClaudeCode\Architect\dist\`: the zip
  `architect-copilot-0.1.0.zip` and the tarball
  `architect-sdd-0.1.0.tgz`. Until T-075 publishes it, install `architect-sdd` from the tarball, even
  though `INSTALL.md` says `npm install -g architect-sdd@0.1.0`.
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
  Without `--dry-run`, the check writes `docs/releases/<target>/0.1.0/release.json`, whether the
  outcome is `released` or `refused`.
- **Commits.** Leave your files uncommitted and send the conductor the "Tell the conductor" line.
  The conductor commits and runs `sdd task set … --status done`.
