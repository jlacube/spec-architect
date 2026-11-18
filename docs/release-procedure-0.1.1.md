# Release procedure — Architect 0.1.1

How the spec owner releases Architect 0.1.1: the `architect-sdd` CLI on npm, the Copilot package and the Claude
Code plugin. Adapted from `docs/release-procedure-0.1.0.md` for tasks C005-T-018 to C005-T-021 of
`.sdd/005-0-1-1-fixes/20-plan/plan.md` (Strategy rule 6; Rollout and rollback).

This sheet contains no account names, credentials or machine paths. Placeholders are written `<like-this>`.

## Who does what

| Step | Owner |
|---|---|
| Checks and dry runs (sections 1–2) | either |
| Manual VS Code runs and the Copilot checklist (section 2, C005-T-018) | **the spec owner**, with the conductor writing the records |
| `npm publish`, sharing the zips, the tag and the GitHub release (sections 3, 5, 6) | **the spec owner only**, from their own accounts |
| Release records, task statuses, commits (sections 4, 5, 7) | the conductor (agent), once the spec owner reports back |

No step of this sheet spends money or runs model sessions; the Copilot CLI injection suite (C005-T-024) and the
manual VS Code runs (C005-T-018) come before it. Every step can be retried, except one: **an npm version can be
published only once.**

## Order

The order matters. Each generated doctor checks the exact CLI version, so a host package that ships before
its CLI is on npm shows an error to every adopter.

1. The release commit (C005-T-016), the Copilot CLI injection suite on the 0.1.1 package (C005-T-024) and the
   release notes (C005-T-017).
2. The manual VS Code runs, the checklist record and a release-check dry run that prints `released` (C005-T-018).
3. `architect-sdd@0.1.1` on npm (C005-T-019), then the C005-NFR-001 check in three shells with the published
   package (C005-T-020).
4. The Copilot package `architect-copilot-0.1.1.zip`, the Claude Code plugin zips, the `v0.1.1` tag and the GitHub
   release (C005-T-021).

Keep VS Code, GitHub Copilot Chat and Copilot CLI at the tested versions, updates off, until C005-T-018 and
C005-T-024 are done: VS Code 1.145.2, Copilot Chat 0.73.0 (`plugins/architect/targets/copilot.json`), Copilot CLI
1.0.98 (`docs/spikes/S-08-copilot-vscode.md`). The release check refuses a drifted version (ERR-REL-006).

## The release commit

The release commit is the commit that completes C005-T-016: `2fec7a8`, where `npm run check` passed. It holds the version 0.1.1 and the rebuilt `sdd.mjs` of `1ea5f2a` and a test-only type fix. Later
release commits change only `docs/`, `evals/results/`, `CHANGELOG.md` and `.sdd/`, so `src/`, `scripts/` and
`plugins/` stay equal to the release commit. The `v0.1.1` tag goes on a commit for which this holds.

## 1. Prepare

Use PowerShell 7 or a POSIX shell, with Node 22 first on PATH, from the repository root `<repo-root>`.

```powershell
git switch main
git pull
git status --short
git log -1 --oneline
git diff --stat 2fec7a8 HEAD -- src scripts plugins
```

Expect:
- a clean working tree;
- an empty diff for `src`, `scripts` and `plugins`. If it is not empty, stop and tell the conductor.

If `dist/` doesn't hold the four 0.1.1 files, run `npm run package` first: `architect-sdd-0.1.1.tgz`,
`architect-copilot-0.1.1.zip`, `architect-0.1.1.zip` and `architect-0.1.1-plugin.zip`.

## 2. Checks (nothing is published)

```powershell
node scripts/release-check.mjs --target copilot --dry-run
npm run smoke:npm
node scripts/check/tarball.mjs dist/architect-sdd-0.1.1.tgz
node -e "console.log('sha512-'+require('crypto').createHash('sha512').update(require('fs').readFileSync('dist/architect-sdd-0.1.1.tgz')).digest('base64'))"
```

All four must exit 0. The dry run must print `released`; it needs the injection summary of C005-T-024
(`docs/releases/copilot/0.1.1/injection.json`) and the checklist record of C005-T-018. Note the integrity value
(`sha512-…`) that the last command prints and compare it with the value in section "Check" of
`docs/release-0.1.1-evidence.md`. A different value means the tarball changed, so stop.

**Any other result: stop, publish nothing and tell the conductor.**

## 3. Publish the CLI to npm (spec owner, C005-T-019)

```powershell
npm whoami
npm view architect-sdd@0.1.1
npm view architect-sdd dist-tags
```

Check:
- `npm whoami` prints `<your-npm-account>`.
- `npm view architect-sdd@0.1.1` gives **E404**, meaning the version is not on npm yet.
- `npm view architect-sdd dist-tags` shows `latest: 0.1.0`.

Your npm account needs two-factor authentication (check with `npm profile get`). If it is disabled, enable it on
npmjs.com, then run `npm logout` and `npm login`.

```powershell
npm publish ./dist/architect-sdd-0.1.1.tgz
```

- Write the leading `./`. Without it, npm reads `dist/…` as a GitHub repository and fails with
  `Permission denied (publickey)`.
- Give your two-factor code at npm's prompt, never as `--otp=…` on the command line.
- If the registry stages the version, approve it in the package's **Staged Packages** tab on npmjs.com.

Then check the result:

```powershell
npm view architect-sdd versions
npm view architect-sdd dist-tags
npm view architect-sdd@0.1.1 dist.integrity
```

Expect `0.1.1` in the versions, `latest: 0.1.1`, and the same `sha512-…` integrity you noted in section 2.

## 4. Record the CLI release and run the three-shell check (conductor)

Tell the conductor "npm published". The conductor then:
1. writes `docs/releases/architect-sdd/0.1.1.md` with the version, the integrity, the release commit, the output
   of `npm view` and the date; commits it and reports C005-T-019 done;
2. runs the C005-NFR-001 check with the published package in PowerShell 7, Command Prompt and Git Bash
   (C005-T-020) and records it in `docs/nfr-results.md`.

## 5. Release the Copilot package (spec owner, with the conductor, C005-T-021)

```powershell
node scripts/release-check.mjs --target copilot
```

- **Exit 0 (`released`):** it writes `docs/releases/copilot/0.1.1/release.json`.
- **Exit 1 (`refused`):** release nothing and tell the conductor.

Read the record:

```powershell
node -e "const r=require('./docs/releases/copilot/0.1.1/release.json');console.log(r.outcome,r.enforcement_mode,JSON.stringify(r.tested_versions),'exception:',JSON.stringify(r.exception),'refusals:',r.refusals.length)"
```

Expect `released sdd-mcp-server`, the tested versions `{"vscode":"1.145.2","copilot-chat":"0.73.0"}`,
`exception: null` and `refusals: 0`.

Write the zip's hash, with a Unix line ending so that `sha256sum -c` works on every system:

```powershell
[IO.File]::WriteAllText("docs\releases\copilot\0.1.1\zip.sha256", "$((Get-FileHash dist\architect-copilot-0.1.1.zip -Algorithm SHA256).Hash.ToLower())  architect-copilot-0.1.1.zip`n")
```

With a POSIX shell: `(cd dist && sha256sum -t architect-copilot-0.1.1.zip) > docs/releases/copilot/0.1.1/zip.sha256`.

Check it: `cd dist; sha256sum -c ../docs/releases/copilot/0.1.1/zip.sha256; cd ..` prints `OK`.

Then share `dist/architect-copilot-0.1.1.zip` through `<your-release-channel>` and keep the shared copy unchanged,
because a rollback needs it. Tell the conductor "Copilot released"; the conductor commits the record and the hash
line.

## 6. Release the Claude Code plugin, the tag and the GitHub release (spec owner, C005-T-021)

1. Share `dist/architect-0.1.1.zip` and `dist/architect-0.1.1-plugin.zip` through `<your-release-channel>`.
2. Create the annotated tag on a commit whose `src/`, `scripts/` and `plugins/` equal the release commit (section 1
   shows the check), and push only this tag, never `--tags` or `--mirror`:

```powershell
git tag -a v0.1.1 -m "Architect 0.1.1" <commit>
git push origin v0.1.1
git ls-remote --tags origin v0.1.1
```

3. Publish the GitHub release from the tag with the text of `docs/releases/github-release-notes-0.1.1.md`, attaching
   the three zips and the `zip.sha256` line.
4. Update your installed Architect plugin to 0.1.1 (`dist/architect-0.1.1-plugin.zip` through the local
   marketplace) and start a new conductor session.

## 7. After the release (conductor)

Once you say go, the conductor:
1. runs its plugin CLI with `--version`, which must print `0.1.1`, and records it in section "Dogfood" of
   `docs/release-0.1.1-evidence.md`; from then on the plugin CLI may run every command on CHG-005;
2. completes the DoD evidence with your review of the published notes and your decision on the DOD-G-01 waiver of
   C005-TS-156 (C005-T-022);
3. runs `sdd archive 005 --dry-run`, shows you the preview, and archives on your confirmation (C005-T-023).

## Rollback

| Problem | Action | Owner |
|---|---|---|
| The published CLI is defective (after section 3) | npm versions cannot be replaced. Run `npm deprecate architect-sdd@0.1.1 "<reason>"`, move `latest` back with `npm dist-tag add architect-sdd@0.1.0 latest`, and ship the fix as 0.1.2 in a new change. Users who go back to the 0.1.0 CLI go back to its hash rule: its first stale check sets stale every lite `20-plan` approved under 0.1.1. The deprecation message and the README note say so: a lite change approved under 0.1.1 is not stale-checked with the 0.1.0 CLI, or needs one more G3 approval with it. | spec owner |
| The Copilot package misbehaves (after section 5) | Stop sharing the 0.1.1 zip and name the version, the reason and its replacement in the README (as C002-RB-003). | spec owner |
| The Claude Code plugin misbehaves (after section 6) | Reinstall the previous plugin version from the local marketplace; the pushed tag stays and the fix ships as 0.1.2. The reinstalled plugin brings back the 0.1.0 CLI and its hash rule, with the consequence of the first row: the conductor runs the working-tree CLI on CHG-005 until it is archived. | spec owner |
| CHG-005's `20-plan` stale again (for example after a stale check of the 0.1.0 plugin CLI) | Revise the phase and approve G3 again with the working-tree CLI, as in C005-T-002. | conductor, approval by the spec owner |
| A defect found before section 3 whose fix changes `src/`, `scripts/` or `plugins/` | The route "Fix after the floor runs or the release commit" of the plan: record the defect, reopen the owning task and C005-T-016, fix and commit; rerun the floor cases whose agent text or CLI output the fix changed; redo C005-T-016, whose new commit becomes the release commit of section 1; when the Copilot package changed, rerun C005-T-024 and C005-T-018. An injection case acted upon in C005-T-024 cannot be cleared at 0.1.1 and goes to the spec owner. After section 3 a fix ships as 0.1.2. | conductor, decision by the spec owner |

## Never

- Publish an npm version twice, or publish before section 2 passes.
- Push all tags, a backup branch or anything other than `main` and `v0.1.1`.
- Put credentials, tokens or two-factor codes in a command line, a file or a chat message.
