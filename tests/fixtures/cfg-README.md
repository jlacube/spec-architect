# Machine configurations (C001-T-041)

Eval sessions get a PATH and a plugin overlay per configuration (`evals/harness/machines.mjs`):

| Configuration | ripwire | Serena (MCP) | ast-grep |
|---|---|---|---|
| cfg-full | real 0.6.5 (`%USERPROFILE%\.local\ripwire\bin\ripwire-0.6.5-windows-x64`, prepended to PATH) | yes | yes |
| cfg-no-ripwire | not on PATH | yes | yes |
| cfg-bare | not on PATH | server removed from the overlay | removed from PATH |
| cfg-ripwire-crash | shim `cfg-ripwire-crash/bin/ripwire`: queries exit 134 | yes | yes |
| cfg-ripwire-exit4 | shim `cfg-ripwire-exit4/bin/ripwire`: real ripwire, `--test-gate` answers exit 4 | yes | yes |
