# T-055 — Release the Copilot target

**Purpose:** run the Copilot release check, check that `architect-sdd` 0.0.3 is on npm (T-075 publishes it), and
share the Copilot zip with its SHA-256.

Task C002-T-055 · cases C002-TC-503, C002-TC-620, C002-TC-622 · writes
`docs/releases/copilot/0.0.3/release.json` and `zip.sha256`

## Prerequisites

- **Done:** T-050 (the checklist record is in `docs/checklists/records/`), T-057 (the Copilot section
  of `clean-profile-runs.md`), and T-054, T-047 and T-048.
- The S-08 record is not `deferred`. It gives `sdd-mcp-server`, so no hooks-fallback exception is
  expected.
- Node 22.22.3, and the repository at the release-candidate commit (ask the conductor which commit).
- **T-075** publishes `architect-sdd` 0.0.3 before or together with this release. If npm does not
  have it yet when you reach step 5: your npm account `jlacube` with 2FA, and your
  authenticator to hand.
- **No model spend:** no agent sessions. `npm publish` is free.

## Steps

In PowerShell 7, with Node 22.22.3 first on PATH, go to the repository.

```powershell
Set-Location C:\Sandbox\ClaudeCode\Architect
```

1. Check that HEAD is the release-candidate commit.

```powershell
git log -1 --oneline
```

2. Dry run. This writes nothing. Expect `release-check: copilot 0.0.3 (sdd-mcp-server): released; …`
   and exit code 0. The `ERR-REL-003` line from T-054 should now be gone.

```powershell
node scripts/release-check.mjs --target copilot --dry-run
```

3. The real release check. It writes `docs/releases/copilot/0.0.3/release.json`. Exit code 0 means
   `released`. Exit code 1 means `refused`: if so, release nothing and go to "Tell the conductor".

```powershell
node scripts/release-check.mjs --target copilot
```

4. Read the record. Expect `released sdd-mcp-server`, the tested versions (VS Code Insiders
   `1.142.0-insider`, Copilot CLI `1.0.98`), `exception: null` and `refusals: 0`.

```powershell
node -e "const r=require('./docs/releases/copilot/0.0.3/release.json');console.log(r.outcome,r.enforcement_mode,JSON.stringify(r.tested_versions),'exception:',JSON.stringify(r.exception),'refusals:',r.refusals.length)"
```

5. Check npm. If the command prints `0.0.3`, T-075 already published it: skip step 6. If it gives
   **E404**, publish in step 6.

```powershell
npm view architect-sdd@0.0.3 version
```

6. **Only if step 5 gave E404: publish, together with T-075 (run part 1 of its sheet, `T-052-publish-and-opencode-release.md`, for its checks and record). You do this yourself.** First check that `npm whoami` prints
   `jlacube`. npm then asks for your 2FA code. The conductor never publishes.

```powershell
npm whoami
```
```powershell
npm publish dist/architect-sdd-0.0.3.tgz
```

7. Check that the published version is `0.0.3`.

```powershell
npm view architect-sdd version
```

8. Write the one-line `zip.sha256` file.

```powershell
"$((Get-FileHash dist\architect-copilot-0.0.3.zip -Algorithm SHA256).Hash.ToLower())  architect-copilot-0.0.3.zip" | Set-Content docs\releases\copilot\0.0.3\zip.sha256
```

9. Share `dist\architect-copilot-0.0.3.zip` the way the Claude Code zips are shared
   (`75-rollout.md` §1). Keep the shared copy unchanged, because it is retained for rollback
   C002-RB-003. Check that its hash equals the `zip.sha256` line.

```powershell
Get-FileHash <path of the shared copy> -Algorithm SHA256
```

## Record

- `docs/releases/copilot/0.0.3/release.json`, written by step 3. Do not edit it.
- `docs/releases/copilot/0.0.3/zip.sha256`, from step 8.
- For the task report: the outcome line of step 3, the output of step 4, and whether T-075 published
  `architect-sdd` before this sheet or with it.

## Pass / fail

- **Pass:** step 3 exits 0 with outcome `released`, `exception` is null, the tested versions are
  1.142.0-insider and 1.0.98, `npm view architect-sdd version` prints `0.0.3`, and the hash of the
  shared zip equals `zip.sha256`.
- **Refused:** step 3 exits 1. Nothing is published or shared, and the refusal stays in the release
  record. It is done as "refusal recorded". If T-075 has not published `architect-sdd` yet, it stays
  unpublished.

**Time budget:** about 20 minutes (estimate). **Spend:** none.

## Tell the conductor

> T-055 done: Copilot 0.0.3 released, record at docs/releases/copilot/0.0.3/release.json
> (sdd-mcp-server, exception null), zip.sha256 written, zip shared at <where>; architect-sdd 0.0.3
> on npm (published by T-075 <before | together with> T-055). RC commit <sha>.

If it was refused: "T-055: Copilot refused (<ERR-REL codes>), record at
docs/releases/copilot/0.0.3/release.json, nothing released".
