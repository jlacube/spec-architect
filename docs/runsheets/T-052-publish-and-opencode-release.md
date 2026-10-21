# T-052 — Publish `architect-sdd` and release the OpenCode target

**Purpose:** run the OpenCode release check, publish `architect-sdd` 0.0.1 to npm by hand with 2FA,
and share the OpenCode zip with its SHA-256.

Task C002-T-052 · cases C002-TC-503, C002-TC-620, C002-TC-622 · writes
`docs/releases/opencode/0.0.1/release.json` and `zip.sha256`

## Prerequisites

- **T-051 done** (OpenCode section of `docs/releases/clean-profile-runs.md`) and **T-066 done**.
- **The unpaid re-runs are done at the release-candidate commit.** These are T-048 step 5 (T-054's
  re-run at its commit counts) and T-049 steps 1 and 2 (`npm run package`, the tarball check, and
  `npm run replay` under PowerShell 7 and Git Bash). They are the conductor's job. **Ask the
  conductor to confirm them and to give you the release-candidate commit.** No paid OpenCode session
  is re-run.
- Node 22.22.3. The repository is at the release-candidate commit, and the zip and tarball in `dist/`
  were built there.
- Your npm account `jlacube` with 2FA for publish (`docs/releases/npm-prerequisites.md`), and your
  authenticator to hand.
- **No model spend:** no agent sessions and no OpenRouter key. `npm publish` is free.

## Steps

In PowerShell 7, put Node 22.22.3 first on PATH (as in T-051 step 1), then go to the repository.

```powershell
Set-Location C:\Sandbox\ClaudeCode\Architect
```

1. Check that HEAD is the release-candidate commit the conductor gave you.

```powershell
git log -1 --oneline
```

2. Dry run. This writes nothing. Expect `release-check: opencode 0.0.1 (sdd-mcp-server): released;
   release record not written (--dry-run; …)` and exit code 0.

```powershell
node scripts/release-check.mjs --target opencode --dry-run
```

3. Check that every entry of the injection summary has `result` and `models`, and that each `result`
   file exists. The release check does not read these fields. Expect `22 entries, 0 with a missing
   result or models`.

```powershell
node -e "const fs=require('fs');const s=JSON.parse(fs.readFileSync('docs/releases/opencode/0.0.1/injection.json','utf8'));let bad=0;for(const c of s.cases){if(!c.result||!Array.isArray(c.models)||!c.models.length||!fs.existsSync(c.result)){console.log('MISSING',c.id);bad++}}console.log(s.cases.length+' entries, '+bad+' with a missing result or models')"
```

4. Check the ledger. Every OpenCode `INJ-*` session whose result did not pass must have an entry
   marked acted upon, and every row from INJ-01 to INJ-22 must have an entry. Expect `0 problems;
   rows without an entry: none`.

```powershell
node -e "const fs=require('fs');const s=JSON.parse(fs.readFileSync('docs/releases/opencode/0.0.1/injection.json','utf8'));const L=JSON.parse(fs.readFileSync('evals/results/spend-chg002.json','utf8')).entries.filter(e=>e.host==='opencode'&&/^INJ-/.test(e.case||''));const by=Object.fromEntries(s.cases.map(c=>[c.id,c]));let n=0;for(const e of L){if(e.pass===false){const c=by[e.case];const ok=c&&c.acted_upon===true;console.log(e.case,e.result,ok?'acted upon: ok':'NOT marked acted upon');if(!ok)n++}}const miss=Array.from({length:22},(_,i)=>'INJ-'+String(i+1).padStart(2,'0')).filter(id=>!by[id]);console.log(L.length+' OpenCode INJ sessions checked; '+n+' problems; rows without an entry: '+(miss.join(' ')||'none'))"
```

   If step 3 or step 4 shows a problem, **stop** and tell the conductor. The fix goes through
   T-066, reopened. Never edit the summary by hand.

5. The real release check. It writes `docs/releases/opencode/0.0.1/release.json`. Exit code 0 means
   `released`. Exit code 1 means `refused`: the refusals are printed on stderr. If it is refused, do
   not publish. Go straight to "Tell the conductor". The refusal stays recorded, and T-055 publishes
   later if Copilot passes.

```powershell
node scripts/release-check.mjs --target opencode
```

6. Check npm. `npm whoami` must print `jlacube`. `npm view architect-sdd@0.0.1` must give **E404**
   (no such version). If 0.0.1 already exists, skip step 7. Also run `npm view architect-sdd`: if it
   lists a package, the maintainers must include `jlacube`. If someone else owns the name, stop.

```powershell
npm whoami
```
```powershell
npm view architect-sdd@0.0.1
```
```powershell
npm view architect-sdd
```

7. **Publish. You do this yourself.** npm asks for your 2FA code. The conductor never publishes.

```powershell
npm publish dist/architect-sdd-0.0.1.tgz
```

8. Check that the published version is `0.0.1`.

```powershell
npm view architect-sdd version
```

9. Write the one-line `zip.sha256` file (the hash, two spaces, the file name).

```powershell
"$((Get-FileHash dist\architect-opencode-0.0.1.zip -Algorithm SHA256).Hash.ToLower())  architect-opencode-0.0.1.zip" | Set-Content docs\releases\opencode\0.0.1\zip.sha256
```

10. Share `dist\architect-opencode-0.0.1.zip` the same way you share the Claude Code zips
    (`75-rollout.md` §1). Keep the shared copy unchanged, because it is retained for rollback
    C002-RB-002. Check that the hash of the shared copy matches the `zip.sha256` line.

```powershell
Get-FileHash <path of the shared copy> -Algorithm SHA256
```

## Record

- `docs/releases/opencode/0.0.1/release.json`, written by the check in step 5. Do not edit it.
- `docs/releases/opencode/0.0.1/zip.sha256`, from step 9.
- For the task report: the release-candidate commit, the output lines of steps 3 and 4 (the
  sessions checked), the outcome line of step 5, and the output of `npm view architect-sdd version`.

## Pass / fail

- **Pass:** steps 3 and 4 are clean, step 5 exits 0 with outcome `released`,
  `npm view architect-sdd version` prints `0.0.1`, and the hash of the shared zip equals
  `zip.sha256`.
- **Refused:** step 5 exits 1. Nothing is published or shared, and the release record keeps the
  refusals. That still counts as done for T-052, with the refusal recorded.

**Time budget:** about 30 minutes (estimate). **Spend:** none.

## Tell the conductor

> T-052 done: OpenCode 0.0.1 released, record at docs/releases/opencode/0.0.1/release.json,
> zip.sha256 written, architect-sdd 0.0.1 published (npm view: 0.0.1), zip shared at <where>. RC
> commit <sha>. Injection checks: 22 entries complete; <n> INJ sessions checked, 0 problems.

If it was refused: "T-052: OpenCode refused (<ERR-REL codes>), record at
docs/releases/opencode/0.0.1/release.json, nothing published".
