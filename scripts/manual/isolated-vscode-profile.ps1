# Isolated VS Code profile for the timed Copilot clean-profile run C002-TC-903 (C002-T-057, C002-NFR-601;
# defect D-048, P-01's instruction of 2026-11-10 "go ahead with the T-057 revision"). The counterpart of
# scripts/manual/isolated-profile.ps1 (the isolated Claude profile of CHG-001, D-030).
#
# Dot-source it in a NEW PowerShell 7 window (the settings stay in that window only):
#
#   . C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-vscode-profile.ps1
#   . C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-vscode-profile.ps1 -Root C:\iso\t057
#   . C:\Sandbox\ClaudeCode\Architect\scripts\manual\isolated-vscode-profile.ps1 -Root C:\iso\check -Check
#
# What it does (definition: C002-SPEC-NFR, "Isolated VS Code profile"):
# - finds the VS Code CLI (code.cmd) and your git identity BEFORE the overrides (-Code <path to code.cmd>
#   to choose another VS Code);
# - creates the profile folder, which must not exist yet or be empty (default
#   <your real home>\architect-vsc-iso-<time>);
# - points HOME and USERPROFILE at <root>, APPDATA at <root>\AppData\Roaming, and the npm global prefix
#   (npm_config_prefix) at <root>\npm, which goes first on PATH, so `npm install -g` lands in the profile;
#   for convenience it also points PowerShell's $HOME and `~` at <root>;
# - writes your git user.name and user.email into <root>\.gitconfig (set-up, before the timer);
# - defines `code` in this window as VS Code with --user-data-dir <root>\vscode\data and
#   --extensions-dir <root>\vscode\extensions: a separate VS Code instance with no settings, no sign-in,
#   no Marketplace extension and no trusted folder; GitHub Copilot Chat is the one built into the build;
# - prints the versions (VS Code, built-in Copilot Chat, Node, npm prefix), the extensions of the isolated
#   instance (none expected) and whether an `sdd` is already reachable (the caveat below).
# With -Check (a throwaway profile only, never the one of the timed run) it also runs a quick check
# without starting a window: VS Code and Copilot Chat at the tested versions, no Marketplace extension in
# the isolated instance, npm's global prefix inside the profile, and empty user data; it prints
# "Quick check: PASS" or "Quick check: FAIL".
#
# Caveat (C002-SPEC-NFR): only those variables and the two VS Code folders change. Everything else stays
# yours: the installed VS Code build, PATH after the npm prefix (so an architect-sdd you installed globally
# before stays reachable until the new one is installed in the profile), LOCALAPPDATA (nvm Node, npm's
# cache), HKCU, Windows Credential Manager (git's credential helper) and Known-Folder lookups. So a missing
# Node or VS Code install, or a skipped CLI install step, does not show. Start VS Code with this window's
# `code`, not from the Start menu (that would open your own profile). Close the window and the isolated
# VS Code to leave the profile; delete <root> when the conductor has the record.
[CmdletBinding()]
param(
  [string]$Root = (Join-Path $HOME ("architect-vsc-iso-" + (Get-Date -Format "yyyyMMdd-HHmmss"))),
  [string]$Code,
  [switch]$Check
)
$ErrorActionPreference = "Stop"
$TestedVsCode = "1.145.2"
$TestedCopilotChat = "0.73.0"

function Find-CodeCli([string]$Explicit) {
  if ($Explicit) {
    if (-not (Test-Path $Explicit)) { throw "-Code ${Explicit}: no such file." }
    return (Resolve-Path $Explicit).Path
  }
  $cmd = Get-Command code.cmd -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $cmd) { $cmd = Get-Command code -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1 }
  if (-not $cmd) { throw "VS Code's CLI (code.cmd) is not on PATH: pass -Code <path to bin\code.cmd>." }
  return $cmd.Source
}

# The built-in GitHub Copilot Chat of the build: <install>\<commit prefix>\resources\app\extensions\copilot
# (Windows, VS Code 1.145) or <install>\resources\app\extensions\copilot (older layout).
function Get-BuiltInCopilotChat([string]$CodeCli) {
  $install = Split-Path (Split-Path $CodeCli -Parent) -Parent
  $candidates = @(Join-Path $install "resources\app\extensions\copilot\package.json")
  $candidates += @(Get-ChildItem $install -Directory -ErrorAction SilentlyContinue |
    ForEach-Object { Join-Path $_.FullName "resources\app\extensions\copilot\package.json" })
  foreach ($c in $candidates) {
    if (Test-Path $c) { return (Get-Content $c -Raw | ConvertFrom-Json).version }
  }
  return $null
}

# Resolve everything that reads the real profile before the overrides.
$codeCli = Find-CodeCli $Code
$gitName = (git config --global user.name 2>$null)
$gitEmail = (git config --global user.email 2>$null)
if ((Test-Path $Root) -and (Get-ChildItem -Force $Root | Select-Object -First 1)) {
  throw "The profile folder $Root is not empty: pass -Root with a new folder."
}
New-Item -ItemType Directory -Force $Root | Out-Null
$Root = (Resolve-Path $Root).Path
if ($Root -match '["$%`]') { throw "The profile folder $Root holds a character that the package path refuses (`"`, `$`, `%` or a backtick)." }

$env:HOME = $Root
$env:USERPROFILE = $Root
$env:APPDATA = Join-Path $Root "AppData\Roaming"
$npmPrefix = Join-Path $Root "npm"
$env:npm_config_prefix = $npmPrefix
$env:Path = "$npmPrefix;" + $env:Path
$userData = Join-Path $Root "vscode\data"
$extensions = Join-Path $Root "vscode\extensions"
foreach ($d in $env:APPDATA, $npmPrefix, $userData, $extensions) { New-Item -ItemType Directory -Force $d | Out-Null }
try { Set-Variable -Name HOME -Value $Root -Scope Global -Force -ErrorAction Stop } catch { Write-Warning "PowerShell's `$HOME stays $HOME; use `$env:USERPROFILE." }
try { (Get-PSProvider FileSystem).Home = $Root } catch { Write-Warning "PowerShell's ~ stays the real home; use `$env:USERPROFILE." }
if ($gitName) { git config --global user.name $gitName }
if ($gitEmail) { git config --global user.email $gitEmail }

$global:ArchitectIsoCode = $codeCli
$global:ArchitectIsoCodeArgs = @("--user-data-dir", $userData, "--extensions-dir", $extensions)
function global:code { & $global:ArchitectIsoCode @global:ArchitectIsoCodeArgs @args }
$toy = Join-Path $Root "runs\t057\toy"

$vsVersion = ((code --version) | Select-Object -First 1)
$copilot = Get-BuiltInCopilotChat $codeCli
$extList = @(code --list-extensions --show-versions | Where-Object { $_ -and $_.Trim() })
$sddBefore = Get-Command sdd -ErrorAction SilentlyContinue | Select-Object -First 1
$prefixSeen = (npm config get prefix 2>$null)

Write-Host "Isolated VS Code profile: $Root"
Write-Host "  HOME=USERPROFILE=$env:USERPROFILE  APPDATA=$env:APPDATA"
Write-Host "  npm global prefix: $prefixSeen (first on PATH)"
Write-Host "  code -> $codeCli --user-data-dir $userData --extensions-dir $extensions"
Write-Host ("  VS Code {0} (tested {1})" -f $vsVersion, $TestedVsCode)
Write-Host ("  GitHub Copilot Chat {0}, built in (tested {1})" -f $(if ($copilot) { $copilot } else { "NOT FOUND" }), $TestedCopilotChat)
Write-Host ("  Marketplace extensions in the isolated instance: {0}" -f $(if ($extList.Count) { $extList -join ", " } else { "none" }))
foreach ($tool in "node", "git") {
  $cmd = Get-Command $tool -ErrorAction SilentlyContinue
  Write-Host ("  {0} {1}" -f $tool, $(if ($cmd) { (& $tool --version) } else { "NOT FOUND" }))
}
Write-Host ("  git identity in the profile: {0} <{1}>" -f $(if ($gitName) { $gitName } else { "NOT SET" }), $(if ($gitEmail) { $gitEmail } else { "NOT SET" }))
if ($sddBefore) {
  Write-Host "  Caveat: an sdd is already reachable before the install step: $($sddBefore.Source)"
} else {
  Write-Host "  sdd: not reachable yet (the install notes' CLI step installs it into the profile)"
}
Write-Host "Toy folder for the run: $toy"
Write-Host "Next (set-up, before the timer): code   -> sign in to GitHub in that window; then follow the run sheet."

if ($Check) {
  $copilotOk = $copilot -eq $TestedCopilotChat
  $vsOk = $vsVersion -eq $TestedVsCode
  $extOk = $extList.Count -eq 0
  $prefixOk = ($prefixSeen -and ((Resolve-Path $prefixSeen -ErrorAction SilentlyContinue).Path -eq $npmPrefix))
  $userDataFiles = @(Get-ChildItem -Force -Recurse $userData -File -ErrorAction SilentlyContinue)
  $dataOk = -not ($userDataFiles | Where-Object { $_.FullName -match '\\User\\(settings\.json|globalStorage\\state\.vscdb)$' })
  Write-Host ""
  Write-Host ("  VS Code at the tested version:              {0}" -f $vsOk)
  Write-Host ("  Copilot Chat built in at the tested version: {0}" -f $copilotOk)
  Write-Host ("  no Marketplace extension:                    {0}" -f $extOk)
  Write-Host ("  npm global prefix inside the profile:        {0}" -f $prefixOk)
  Write-Host ("  no user settings or sign-in state yet:       {0}" -f $dataOk)
  Write-Host ("`nQuick check: " + $(if ($vsOk -and $copilotOk -and $extOk -and $prefixOk -and $dataOk) { "PASS" } else { "FAIL" }))
}
