# Isolated Claude profile for the clean-profile install C001-TC-1102 (C001-TS-1102, C001-NFR-602;
# defect D-030, P-01 Q-clean-profile-01 'Isolated Claude profile (Recommended)', 2026-11-10).
#
# Dot-source it in a NEW PowerShell 7 window, so the settings stay in that window only:
#
#   . C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-profile.ps1
#   . C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-profile.ps1 -Root C:\iso\tc1102 -Check
#
# What it does (definition: C001-SPEC-NFR, "Isolated Claude profile"):
# - creates the profile folder, which must not exist yet or be empty (default $HOME\architect-iso-<time>);
# - removes every CLAUDE* and ANTHROPIC* variable from this window;
# - points CLAUDE_CONFIG_DIR at <root>\.claude, and HOME and USERPROFILE at <root>, and APPDATA at
#   <root>\AppData\Roaming;
# - defines `claude` in this window as the Claude Code binary found BEFORE the overrides: -Claude, else
#   $env:CLAUDE_CODE_EXECPATH, else the newest desktop-bundled
#   %APPDATA%\Claude\claude-code\<version>\<id>\claude.exe, else `claude` on PATH (needs 2.1.295 or later);
# - prints the versions and `claude auth status` (signed out in a new profile).
# With -Check it also runs the functional part of TC-1102 without a model turn (marketplace add,
# install, plugin list, plugin details, agent resolution); see scripts/manual/isolated-profile-check.mjs
# for the same check from Node.
#
# Caveat (stated in the spec): machine-wide tools (Node, Git, ripwire, uv, Serena) and LOCALAPPDATA stay
# those of your account, so a missing prerequisite would not show. Nothing outside <root> is written by
# the plugin commands. Close the window to leave the profile; delete <root> when the conductor has the
# record.
[CmdletBinding()]
param(
  [string]$Root = (Join-Path $HOME ("architect-iso-" + (Get-Date -Format "yyyyMMdd-HHmmss"))),
  [string]$Claude,
  [string]$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch]$Check
)
$ErrorActionPreference = "Stop"

function Find-ClaudeBinary([string]$Explicit) {
  if ($Explicit) { return (Resolve-Path $Explicit).Path }
  if ($env:CLAUDE_CODE_EXECPATH -and (Test-Path $env:CLAUDE_CODE_EXECPATH)) { return $env:CLAUDE_CODE_EXECPATH }
  $bundled = Join-Path $env:APPDATA "Claude\claude-code"
  if (Test-Path $bundled) {
    $found = Get-ChildItem $bundled -Directory | ForEach-Object {
      $v = $null
      if ([version]::TryParse($_.Name, [ref]$v)) {
        Get-ChildItem $_.FullName -Recurse -Filter claude.exe -File | Select-Object -First 1 |
          ForEach-Object { [pscustomobject]@{ Version = $v; Path = $_.FullName } }
      }
    } | Sort-Object Version -Descending | Select-Object -First 1
    if ($found) { return $found.Path }
  }
  $onPath = Get-Command claude -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($onPath) { return $onPath.Source }
  throw "No Claude Code binary found: pass -Claude <path to claude.exe> (2.1.295 or later)."
}

# Resolve everything that reads the real profile before the overrides.
$claudeExe = Find-ClaudeBinary $Claude
if ((Test-Path $Root) -and (Get-ChildItem -Force $Root | Select-Object -First 1)) {
  throw "The profile folder $Root is not empty: pass -Root with a new folder."
}
New-Item -ItemType Directory -Force $Root | Out-Null
$Root = (Resolve-Path $Root).Path

Get-ChildItem Env: | Where-Object { $_.Name -match '^(CLAUDE|ANTHROPIC)' } |
  ForEach-Object { Remove-Item "Env:$($_.Name)" }
$env:CLAUDE_CONFIG_DIR = Join-Path $Root ".claude"
$env:HOME = $Root
$env:USERPROFILE = $Root
$env:APPDATA = Join-Path $Root "AppData\Roaming"
New-Item -ItemType Directory -Force $env:APPDATA | Out-Null
$global:ArchitectIsoClaude = $claudeExe
function global:claude { & $global:ArchitectIsoClaude @args }

Write-Host "Isolated Claude profile: $Root"
Write-Host "  CLAUDE_CONFIG_DIR=$env:CLAUDE_CONFIG_DIR"
Write-Host "  HOME=USERPROFILE=$env:USERPROFILE  APPDATA=$env:APPDATA"
Write-Host "  claude -> $claudeExe"
Write-Host ("  claude " + (claude --version))
foreach ($tool in "node", "git") {
  $cmd = Get-Command $tool -ErrorAction SilentlyContinue
  Write-Host ("  {0} {1}" -f $tool, $(if ($cmd) { (& $tool --version) } else { "NOT FOUND" }))
}
claude auth status

if ($Check) {
  $toy = Join-Path $Root "toy"
  New-Item -ItemType Directory -Force $toy | Out-Null
  Push-Location $toy
  try {
    git init -q
    Write-Host "`n> claude plugin marketplace add $Repo"; claude plugin marketplace add $Repo
    Write-Host "`n> claude plugin install architect@architect-local"; claude plugin install architect@architect-local
    Write-Host "`n> claude plugin list"; $list = (claude plugin list) -join "`n"; $list
    Write-Host "`n> claude plugin details architect@architect-local"; claude plugin details architect@architect-local | Select-Object -First 8
    Write-Host "`n> claude -p --agent architect:no-such-agent hi   (refused before any model call)"
    $refusal = (claude -p --agent architect:no-such-agent hi 2>&1) -join "`n"; $refusal
    $ok = ($list -match 'architect@architect-local') -and ($list -match 'enabled') -and ($refusal -match 'architect:sdd-conductor')
    Write-Host ("`nFunctional check: " + $(if ($ok) { "PASS" } else { "FAIL" }))
    Write-Host "Starting the conductor in a session (claude --agent architect:sdd-conductor) needs a sign-in: that is P-01's timed step."
  } finally { Pop-Location }
}
