# Release procedure — Architect 0.1.0

How the spec owner releases Architect 0.1.0: the `architect-sdd` CLI on npm, the Copilot package and the Claude
Code plugin. It brings together the steps of tasks C002-T-075 and C002-T-055 and the release rules in
`.sdd/002-multi-platform-targets/20-plan/75-rollout.md` §1.

This sheet contains no account names, credentials or machine paths. Placeholders are written `<like-this>`.

## Who does what

| Step | Owner |
|---|---|
| Checks and dry runs (sections 1–2) | either |
| `npm publish`, sharing the zips, pushing the tag (sections 3, 5, 6) | **the spec owner only**, from their own accounts |
| Release records, task statuses, commits, the CHG-001 archive (sections 4, 7) | the conductor (agent), once the spec owner reports back |

No step spends money or runs model sessions. Every step can be retried, except one: **an npm version can be
published only once.**

## Order

The order matters. Each generated doctor checks the exact CLI version, so a host package that ships before
its CLI is on npm shows an error to every adopter.

1. `architect-sdd@0.1.0` on npm (C002-T-075).
2. The Copilot package `architect-copilot-0.1.0.zip` (C002-T-055), at the same time as step 1 or after it.
3. The Claude Code plugin zips and the `v0.1.0` tag.

## State at preparation (2026-11-15)

- The local annotated tag `v0.1.0` points at the release candidate. Nothing in `plugins/architect/` has changed
  between the tag and `main`, and `main` contains the tagged commit. The tag is not on the remote yet.
- `node scripts/release-check.mjs --target copilot --dry-run` gives `copilot 0.1.0 (sdd-mcp-server): released`,
  exit 0.
- The release files are in `dist/`: `architect-sdd-0.1.0.tgz`, `architect-copilot-0.1.0.zip`, `architect-0.1.0.zip`
  and `architect-0.1.0-plugin.zip`.
- Known gaps shipped in 0.1.0: CHG-001 defects D-032, D-034 and D-035. CHG-005 "0.1.1 fixes" will fix them.

## 1. Prepare

Use PowerShell 7 or a POSIX shell, with Node 22 first on PATH, from the repository root `<repo-root>`.

```powershell
git switch main
git pull
git status --short
git describe --tags --exact-match HEAD 2>$null; git log -1 --oneline
git diff --stat v0.1.0 HEAD -- plugins/architect
```

Expect:
- a clean working tree;
- an empty diff for `plugins/architect`. If it is not empty, stop and tell the conductor.

## 2. Checks (nothing is published)

```powershell
node scripts/release-check.mjs --target copilot --dry-run
npm run smoke:npm
node scripts/check/tarball.mjs dist/architect-sdd-0.1.0.tgz
node -e "console.log('sha512-'+require('crypto').createHash('sha512').update(require('fs').readFileSync('dist/architect-sdd-0.1.0.tgz')).digest('base64'))"
```

All four must exit 0. The dry run must print `released`. Note the integrity value (`sha512-…`) that the last
command prints. At preparation it began with `sha512-4cAfCsuq…`; a different value means the tarball changed,
so stop.

**Any other result: stop, publish nothing and tell the conductor.**

## 3. Publish the CLI to npm (spec owner)

```powershell
npm whoami
npm view architect-sdd@0.1.0
npm view architect-sdd
```

Check:
- `npm whoami` prints `<your-npm-account>`.
- `npm view architect-sdd@0.1.0` gives **E404**, meaning the version is not on npm yet.
- `npm view architect-sdd` gives E404, or it lists `<your-npm-account>` among the maintainers. If someone else
  owns the name, stop.

Your npm account needs two-factor authentication. Since npm's 2026 publishing policy, the registry refuses
a publish without 2FA (E403, "Two-factor authentication … is required"). Check with `npm profile get`, which
shows the "two-factor auth" line. If 2FA is disabled, enable it on npmjs.com, then run `npm logout` and
`npm login`.

```powershell
npm publish ./dist/architect-sdd-0.1.0.tgz
```

- Write the leading `./`. Without it, npm reads `dist/…` as a GitHub repository and fails with
  `Permission denied (publickey)`.
- Give your two-factor code at npm's prompt, never as `--otp=…` on the command line.
- The registry may stage the publication. For a package's first version, it first publishes an empty
  placeholder `0.0.0-stage`, then makes the real version public once it is approved. If the version doesn't
  appear, approve it in the package's **Staged Packages** tab on npmjs.com. The `npm stage` commands need
  npm 11.15 or later; with an older npm, use `npx -y npm@11 stage list <package>`.

Then check the result:

```powershell
npm view architect-sdd versions
npm view architect-sdd dist-tags
npm view architect-sdd@0.1.0 dist.integrity
```

Expect `0.1.0` in the versions, `latest: 0.1.0`, and the same `sha512-…` integrity you noted in section 2.
If `latest` points to `0.0.0-stage`, run `npm dist-tag add architect-sdd@0.1.0 latest`.

## 4. Record the CLI release (conductor)

Tell the conductor "npm published". The conductor then:
1. writes `docs/releases/architect-sdd/0.1.0.md` with the version, the integrity, the release-candidate commit,
   the output of `npm view` and the date;
2. commits it and runs `sdd task set C002-T-075 --status done --commit <sha>`.

## 5. Release the Copilot package (spec owner, with the conductor)

```powershell
node scripts/release-check.mjs --target copilot
```

- **Exit 0 (`released`):** it writes `docs/releases/copilot/0.1.0/release.json`.
- **Exit 1 (`refused`):** release nothing and tell the conductor.

Read the record:

```powershell
node -e "const r=require('./docs/releases/copilot/0.1.0/release.json');console.log(r.outcome,r.enforcement_mode,JSON.stringify(r.tested_versions),'exception:',JSON.stringify(r.exception),'refusals:',r.refusals.length)"
```

Expect `released sdd-mcp-server`, the tested versions `{"vscode":"1.145.2","copilot-chat":"0.73.0"}`,
`exception: null` and `refusals: 0`. The Copilot CLI version (1.0.98) is in the record's injection evidence,
not in `tested_versions`.

Write the zip's hash, with a Unix line ending so that `sha256sum -c` works on every system:

```powershell
[IO.File]::WriteAllText("docs\releases\copilot\0.1.0\zip.sha256", "$((Get-FileHash dist\architect-copilot-0.1.0.zip -Algorithm SHA256).Hash.ToLower())  architect-copilot-0.1.0.zip`n")
```

With a POSIX shell: `(cd dist && sha256sum -t architect-copilot-0.1.0.zip) > docs/releases/copilot/0.1.0/zip.sha256`.

Check it: `cd dist; sha256sum -c ../docs/releases/copilot/0.1.0/zip.sha256; cd ..` prints `OK`.

Then:
1. Share `dist/architect-copilot-0.1.0.zip` through `<your-release-channel>`, the same way as the Claude Code zips.
2. Keep the shared copy unchanged, because a rollback needs it (C002-RB-003).
3. Tell the conductor "Copilot released". The conductor commits the record and the `zip.sha256` line, then runs
   `sdd task set C002-T-055 --status done --commit <sha>`.

## 6. Release the Claude Code plugin and push the tag (spec owner)

1. Share `dist/architect-0.1.0.zip` and `dist/architect-0.1.0-plugin.zip` through `<your-release-channel>`.
   Adopters install it with `/plugin marketplace add <extracted-folder>`, then
   `/plugin install architect@<marketplace-name>`, as described in the README.
2. Push the release tag. Push only this tag, never `--tags` or `--mirror`, because other local tags and branches
   stay private.

```powershell
git push origin v0.1.0
git ls-remote --tags origin v0.1.0
```

3. Optional: create a release on your Git host from the tag, attaching the three files and the
   `zip.sha256` line.

## 7. After the release (conductor)

Once you say go, the conductor:
1. closes CHG-001 defects D-032, D-034 and D-035 as "known gap of 0.1.0, carried to CHG-005";
2. runs `sdd archive 001 --dry-run`, shows you the preview, and archives on your confirmation (C001-T-075);
3. starts the CHG-005 ideation.

CHG-002 stays open until its last open defect (D-032 of CHG-002) is settled.

## Rollback

| Problem | Action |
|---|---|
| The published CLI is defective (C002-RB-001) | npm versions cannot be replaced. Run `npm deprecate architect-sdd@0.1.0 "<reason>"`, publish a fixed 0.1.1, and move the `latest` tag back with `npm dist-tag add` if needed. |
| The Copilot package misbehaves (C002-RB-003) | Stop sharing the zip, and name the version, the reason and its replacement in the README. Adopters remove it as in C002-RB-006. |
| The Claude Code plugin misbehaves (C001-RB-001) | Reinstall the previous plugin version from the local marketplace. The pushed tag stays; the fix ships as 0.1.1. |

## Never

- Publish an npm version twice, or publish before section 2 passes.
- Push all tags, a backup branch or anything other than `main` and `v0.1.0`.
- Put credentials, tokens or two-factor codes in a command line, a file or a chat message.
