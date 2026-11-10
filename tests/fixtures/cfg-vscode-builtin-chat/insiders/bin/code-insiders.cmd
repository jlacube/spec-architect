@echo off
rem Host shim (D-047): VS Code with GitHub Copilot Chat built in (no entry in --list-extensions).
if "%~1"=="--version" (
  echo 1.146.0-insider
  echo 29ce94ad8d36c62affc08484e262d5c4fbdd0b3d
  echo x64
  exit /b 0
)
if "%~1"=="--list-extensions" (
  echo ms-python.python@2025.1.0
  exit /b 0
)
echo code shim: unsupported arguments 1>&2
exit /b 1
