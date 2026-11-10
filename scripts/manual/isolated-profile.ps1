# Isolated Claude profile for the clean-profile install C001-TC-1102 (C001-TS-1102, C001-NFR-602;
# defect D-030, P-01 Q-clean-profile-01 'Isolated Claude profile (Recommended)', 2026-11-10).
#
# Dot-source it in a NEW PowerShell 7 window (the manual form of the profile; the settings stay in that
# window only):
#
#   . C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-profile.ps1
#   . C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-profile.ps1 -Claude <path to claude.exe>
#   . C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-profile.ps1 -Root C:\iso\tc1102 -Check
#
# What it does (definition: C001-SPEC-NFR, "Isolated Claude profile"):
# - creates the profile folder, which must not exist yet or be empty (default
#   <your real home>\architect-iso-<time>);
# - removes every CLAUDE* and ANTHROPIC* variable from this window;
# - points CLAUDE_CONFIG_DIR at <root>\.claude, HOME and USERPROFILE at <root>, and APPDATA at
#   <root>\AppData\Roaming; for convenience it also points PowerShell's $HOME and `~` at <root>;
# - defines `claude` in this window as a Claude Code binary of version 2.1.295 or later, found BEFORE the
#   overrides: -Claude <path>, else $env:CLAUDE_CODE_EXECPATH, else the newest desktop-bundled
#   claude.exe under %APPDATA%\Claude\claude-code or the MSIX location
#   %LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude-code, else `claude` on PATH;
#   a binary below 2.1.295 is refused with an error (the PATH claude 2.0.76 on REF-WIN is broken);
# - prints the versions, `claude auth status` (signed out in a new profile) and the toy folder to use.
# With -Check (a throwaway profile only, never the one of the timed run: it installs the plugin) it also
# runs a QUICK check without a model turn (marketplace add, install, plugin list,
# plugin details, an unknown agent refused with architect:sdd-conductor listed) and prints
# "Quick check: PASS" or "Quick check: FAIL". It does not start the conductor; the functional check of
# record is scripts/manual/isolated-profile-check.mjs, which also checks the conductor's init event.
#
# Caveat (C001-SPEC-NFR): only the four variables change and CLAUDE*/ANTHROPIC* are removed. Everything
# else stays yours: PATH and every other inherited variable, your PowerShell profile, LOCALAPPDATA (nvm
# Node, the uv and Serena cache), HKCU, Windows Credential Manager, Known-Folder lookups, and the
# desktop-bundled Claude Code (its install is not exercised). So a missing prerequisite or optional tool
# (ripwire, Serena, ast-grep) does not show. The plugin commands write nothing outside <root>. Close the
# window to leave the profile; delete <root> when the conductor has the record.
[CmdletBinding()]
param(
  [string]$Root = (Join-Path $HOME ("architect-iso-" + (Get-Date -Format "yyyyMMdd-HHmmss"))),
  [string]$Claude,
  [string]$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [switch]$Check
)
$ErrorActionPreference = "Stop"
$MinClaude = [version]"2.1.295"

function Get-ClaudeVersion([string]$Path) {
  try { $out = (& $Path --version 2>$null) -join " " } catch { return $null }
  if ($out -match '(\d+\.\d+\.\d+)') { return [version]$Matches[1] }
  return $null
}

function Find-ClaudeBinary([string]$Explicit) {
  if ($Explicit) {
    if (-not (Test-Path $Explicit)) { throw "-Claude ${Explicit}: no such file." }
    return (Resolve-Path $Explicit).Path
  }
  if ($env:CLAUDE_CODE_EXECPATH -and (Test-Path $env:CLAUDE_CODE_EXECPATH)) { return $env:CLAUDE_CODE_EXECPATH }
  $roots = @(Join-Path $env:APPDATA "Claude\claude-code")
  $roots += @(Get-ChildItem (Join-Path $env:LOCALAPPDATA "Packages") -Directory -Filter "Claude_*" -ErrorAction SilentlyContinue |
    ForEach-Object { Join-Path $_.FullName "LocalCache\Roaming\Claude\claude-code" })
  $found = foreach ($r in $roots) {
    if (-not (Test-Path $r)) { continue }
    Get-ChildItem $r -Directory | ForEach-Object {
      $v = $null
      if ([version]::TryParse($_.Name, [ref]$v)) {
        Get-ChildItem $_.FullName -Recurse -Filter claude.exe -File | Select-Object -First 1 |
          ForEach-Object { [pscustomobject]@{ Version = $v; Path = $_.FullName } }
      }
    }
  }
  $best = $found | Sort-Object Version -Descending | Select-Object -First 1
  if ($best) { return $best.Path }
  $onPath = Get-Command claude -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($onPath) { return $onPath.Source }
  throw "No Claude Code binary found: pass -Claude <path to claude.exe> (2.1.295 or later)."
}

# Resolve everything that reads the real profile before the overrides.
$claudeExe = Find-ClaudeBinary $Claude
$claudeVersion = Get-ClaudeVersion $claudeExe
if (-not $claudeVersion -or $claudeVersion -lt $MinClaude) {
  throw "Claude Code at $claudeExe reports version '$claudeVersion'; TC-1102 needs $MinClaude or later. Pass -Claude <path to the desktop-bundled claude.exe>."
}
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
# PowerShell's own $HOME and `~` do not follow USERPROFILE; point them at the profile too (convenience
# only; the run sheet uses $env:USERPROFILE).
try { Set-Variable -Name HOME -Value $Root -Scope Global -Force -ErrorAction Stop } catch { Write-Warning "PowerShell's `$HOME stays $HOME; use `$env:USERPROFILE." }
try { (Get-PSProvider FileSystem).Home = $Root } catch { Write-Warning "PowerShell's ~ stays the real home; use `$env:USERPROFILE." }
$global:ArchitectIsoClaude = $claudeExe
function global:claude { & $global:ArchitectIsoClaude @args }
$toy = Join-Path $Root "runs\tc1102\toy"

Write-Host "Isolated Claude profile: $Root"
Write-Host "  CLAUDE_CONFIG_DIR=$env:CLAUDE_CONFIG_DIR"
Write-Host "  HOME=USERPROFILE=$env:USERPROFILE  APPDATA=$env:APPDATA"
Write-Host "  claude -> $claudeExe"
Write-Host "  claude $claudeVersion (Claude Code; 2.1.295 or later required)"
foreach ($tool in "node", "git") {
  $cmd = Get-Command $tool -ErrorAction SilentlyContinue
  Write-Host ("  {0} {1}" -f $tool, $(if ($cmd) { (& $tool --version) } else { "NOT FOUND" }))
}
claude auth status
Write-Host "Toy folder for the conductor step: $toy"

if ($Check) {
  $quick = Join-Path $Root "quick-check"
  New-Item -ItemType Directory -Force $quick | Out-Null
  Push-Location $quick
  try {
    git init -q
    Write-Host "`n> claude plugin marketplace add $Repo"; claude plugin marketplace add $Repo
    Write-Host "`n> claude plugin install architect@architect-local"; claude plugin install architect@architect-local
    Write-Host "`n> claude plugin list"; $list = (claude plugin list) -join "`n"; $list
    Write-Host "`n> claude plugin details architect@architect-local"; $details = (claude plugin details architect@architect-local) -join "`n"; ($details -split "`n" | Select-Object -First 8) -join "`n"
    Write-Host "`n> claude -p --agent architect:no-such-agent hi   (refused before any model call)"
    $refusal = (claude -p --agent architect:no-such-agent hi 2>&1) -join "`n"; $refusal
    $ok = ($list -match 'architect@architect-local') -and ($list -match 'enabled') -and ($details -match 'sdd-conductor') -and ($refusal -match 'architect:sdd-conductor')
    Write-Host ("`nQuick check: " + $(if ($ok) { "PASS" } else { "FAIL" }))
    Write-Host "The quick check does not start the conductor. The functional check of record is scripts/manual/isolated-profile-check.mjs; an interactive conductor session needs a sign-in (P-01's timed run)."
  } finally { Pop-Location }
}
