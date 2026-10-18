@echo off
rem Host shim (C002-T-014): VS Code with GitHub Copilot Chat; output shaped like the real CLI.
if "%~1"=="--version" (
  echo 1.105.1
  echo 0123456789abcdef0123456789abcdef01234567
  echo x64
  exit /b 0
)
if "%~1"=="--list-extensions" (
  echo GitHub.copilot@1.388.0
  echo GitHub.copilot-chat@0.32.4
  echo ms-python.python@2025.1.0
  exit /b 0
)
echo code shim: unsupported arguments 1>&2
exit /b 1
