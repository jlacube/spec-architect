@echo off
rem Host shim (C002-T-014): OpenCode at its tested version.
if "%~1"=="--version" (
  echo 1.4.2
  exit /b 0
)
echo opencode shim: only --version is supported 1>&2
exit /b 1
