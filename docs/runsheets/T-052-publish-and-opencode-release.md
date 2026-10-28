# T-052 — Publish `architect-sdd` (now C002-T-075) and release the OpenCode target (moved to CHG-003)

Since revision D-036 this sheet has two parts. Part 1 is the npm publication of `architect-sdd`
0.0.3, which became task C002-T-075, apart from any target release. Part 2, the OpenCode release of
C002-T-052, is dropped from CHG-002.

## Part 1 — Publish `architect-sdd` 0.0.3 (C002-T-075)

**Purpose:** after the Copilot checks pass, publish `architect-sdd` 0.0.3 to npm by hand with 2FA,
before or together with the Copilot release (T-055).

Task C002-T-075 · writes `docs/releases/architect-sdd/0.0.3.md`

### Prerequisites

- **T-050 and T-057 done** at 0.0.3 (the checklist record and the Copilot section of
  `docs/releases/clean-profile-runs.md`). npm versions are immutable, so the CLI is published only
  after every Copilot check can pass.
- **T-071 done.** Ask the conductor for the release-candidate commit; the tarball
  `dist\architect-sdd-0.0.3.tgz` must be packed there.
- Node 22.22.3. The repository is at the release-candidate commit.
- Your npm account `jlacube` with 2FA for publish (`docs/releases/npm-prerequisites.md`), and your
  authenticator to hand.
- **No model spend:** no agent sessions. `npm publish` is free.

### Steps

In PowerShell 7, put Node 22.22.3 first on PATH, then go to the repository.

```powershell
$env:Path = "C:\Users\jerom\AppData\Local\Author Software\nvm\installs\v22.22.3;" + $env:Path
Set-Location C:\Sandbox\ClaudeCode\Architect
```

1. Check that HEAD is the release-candidate commit the conductor gave you.

```powershell
git log -1 --oneline
```

2. Copilot dry run. This writes nothing. Expect `release-check: copilot 0.0.3 (sdd-mcp-server):
   released; release record not written (--dry-run; …)` and exit code 0. **Any other outcome: stop.
   Nothing is published.** Go to "Tell the conductor".

```powershell
node scripts/release-check.mjs --target copilot --dry-run
```

3. The npm smoke and the tarball check. Both must exit 0. Note the tarball's `sha512` integrity.

```powershell
npm run smoke:npm
```
```powershell
node scripts/check/tarball.mjs dist/architect-sdd-0.0.3.tgz
```
```powershell
npm pack --dry-run --json
```

4. Check npm. `npm whoami` must print `jlacube`. `npm view architect-sdd@0.0.3` must give **E404**
   (no such version); a version already on npm is never published again. Also run
   `npm view architect-sdd`: if it lists a package, the maintainers must include `jlacube`. If
   someone else owns the name, stop.

```powershell
npm whoami
```
```powershell
npm view architect-sdd@0.0.3
```
```powershell
npm view architect-sdd
```

5. **Publish. You do this yourself.** npm asks for your 2FA code. The conductor never publishes.

```powershell
npm publish dist/architect-sdd-0.0.3.tgz
```

6. Check that the published version is `0.0.3` and that its integrity equals the local tarball's.

```powershell
npm view architect-sdd version
```
```powershell
npm view architect-sdd@0.0.3 dist.integrity
```

### Record

- `docs/releases/architect-sdd/0.0.3.md`: the version, the tarball's `sha512` integrity, the
  release-candidate commit, the dry-run outcome of step 2, the output of `npm view architect-sdd
  version`, and the date. The conductor can write it from your "Tell the conductor" line.

### Pass / fail

- **Pass:** step 2 gives `released`, step 3 exits 0, `npm view architect-sdd version` prints
  `0.0.3`, and `dist.integrity` equals the local integrity.
- **Stopped:** step 2 gives another outcome, or a check of steps 3 or 4 fails. Nothing is published.

**Time budget:** about 20 minutes (estimate). **Spend:** none.

### Tell the conductor

> T-075 done: architect-sdd 0.0.3 published (npm view: 0.0.3), integrity <sha512-…> equal to the
> local tarball. Copilot dry run: released. RC commit <sha>.

If it stopped: "T-075 stopped at step <n> (<outcome or error>), nothing published".

## Part 2 — OpenCode release (C002-T-052): moved to CHG-003

> **Moved to CHG-003.** C002-T-052 is dropped from CHG-002 (revision D-036; P-01 answers to
> Q-opencode-defer-01 and Q-opencode-scope-01). The OpenCode release check, the OpenCode
> `zip.sha256` and the sharing of the OpenCode zip belong to the future CHG-003 "OpenCode release",
> at the version that change sets. Do not run them in CHG-002. The OpenCode release folders already
> recorded (`docs/releases/opencode/`) stay as they are.
