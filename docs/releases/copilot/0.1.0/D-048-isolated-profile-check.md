# D-048 — isolated VS Code profile check (conductor, 2026-11-10)

Close check of CHG-002 defect D-048 (C002-T-057 precondition): the isolated VS Code profile of
C002-SPEC-NFR, set up by `scripts/manual/isolated-vscode-profile.ps1` on a throwaway folder, before P-01's
timed run C002-TC-903. Script at the D-048 fix commit (after critic CR-128 … CR-134). REF-WIN, PowerShell 7
started with `-NoProfile`, Node 22.22.3 first on PATH.

## 1. Quick check (`-Check`, no window started)

| Check | Result |
|---|---|
| VS Code at the tested version | 1.145.2, commit c4453f8ea430795f941c1b2ff6c9321135a74a02 |
| Copilot Chat built in at the tested version | 0.73.0 (`GitHub` / `copilot-chat`, commit-prefixed folder `c4453f8ea4`) |
| Marketplace extensions of the isolated instance (`<root>\.vscode\extensions`) | none |
| npm global prefix | `<root>\npm`, first on PATH |
| User settings (`<root>\AppData\Roaming\Code\User\settings.json`) | only `update.mode: none` and `extensions.autoUpdate: false` |
| Sign-in state | none (instance never started) |
| Variables removed | nothing (no `VSCODE_*`, `GH_TOKEN` or `GITHUB_TOKEN` set) |
| Caveat line | `an sdd is already reachable before the install step: …\nvm\installs\v22.22.3\sdd.ps1` (the global CLI of T-050 step 2) |
| Verdict | `Quick check: PASS` |

## 2. CLI in the profile

`npm install -g dist\architect-sdd-0.1.0.tgz` in the set-up window: "added 1 package". `(Get-Command sdd).Source`
= `<root>\npm\sdd.ps1` (the profile's copy wins over the earlier global one).

```
> sdd host-version vscode
vscode 1.145.2
copilot-chat 0.73.0
hooks unknown
```

`hooks unknown`: the instance's user settings (the ones host-version reads under the redirected `APPDATA`,
critic CR-129) do not set `chat.useHooks`, as on a fresh profile.

## 3. The instance, started once with the window's `code`

| Seen (screenshots by the conductor; nothing clicked) | Result |
|---|---|
| Accounts | not signed in: the title bar shows **Sign In**, and the dialog "Welcome to VS Code — Sign in to use GitHub Copilot" opens (Continue with GitHub / Google / Apple / GHE / Continue without Signing In) |
| Extensions | none installed (the `--list-extensions` of §1 on the same folder) |
| Session footer | Local, Default permissions |
| User settings after the start | VS Code rewrote `extensions.autoUpdate: false` as `"off"` (same meaning); `update.mode: none` kept |

The instance was closed (only its own processes, matched by the profile path) and the throwaway folder
deleted. P-01's default VS Code profile was not touched.

**Outcome:** the D-048 close check passes. The C002-NFR-601 timing comes from P-01's run (C002-T-057).
