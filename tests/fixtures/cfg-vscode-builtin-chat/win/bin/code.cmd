@echo off
rem Host shim (D-047): VS Code with GitHub Copilot Chat built in (no entry in --list-extensions).
if "%~1"=="--version" (
  echo 1.145.2
  echo c4453f8ea430795f941c1b2ff6c9321135a74a02
  echo x64
  exit /b 0
)
if "%~1"=="--list-extensions" (
  echo ms-python.python@2025.1.0
  exit /b 0
)
echo code shim: unsupported arguments 1>&2
exit /b 1
