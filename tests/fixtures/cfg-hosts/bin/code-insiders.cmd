@echo off
rem Host shim (C002-T-014): VS Code Insiders with GitHub Copilot Chat at the S-08 versions.
if "%~1"=="--version" (
  echo 1.142.0-insider
  echo fedcba9876543210fedcba9876543210fedcba98
  echo x64
  exit /b 0
)
if "%~1"=="--list-extensions" (
  echo github.copilot-chat@0.35.3
  exit /b 0
)
echo code-insiders shim: unsupported arguments 1>&2
exit /b 1
