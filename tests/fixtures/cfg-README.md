# Machine configurations (C001-T-041)

Eval sessions get a PATH and a plugin overlay per configuration (`evals/harness/machines.mjs`):

| Configuration | ripwire | Serena (MCP) | ast-grep |
|---|---|---|---|
| cfg-full | real 0.6.5 (`%USERPROFILE%\.local\ripwire\bin\ripwire-0.6.5-windows-x64`, prepended to PATH) | yes | yes |
| cfg-no-ripwire | not on PATH | yes | yes |
| cfg-bare | not on PATH | server removed from the overlay | removed from PATH |
| cfg-ripwire-crash | shim `cfg-ripwire-crash/bin/ripwire`: queries exit 134 | yes | yes |
| cfg-ripwire-exit4 | shim `cfg-ripwire-exit4/bin/ripwire`: real ripwire, `--test-gate` answers exit 4 | yes | yes |
| cfg-old-claude | as cfg-no-ripwire, plus shim `cfg-old-claude/bin/claude` reporting `2.0.76 (Claude Code)` | yes | yes |
| cfg-claude-min | as cfg-full, plus shim `cfg-claude-min/bin/claude` reporting `2.1.295 (Claude Code)`, the minimum version (C002-TC-510) | yes | yes |
| cfg-no-sdd | as cfg-full, with every PATH entry that holds an `sdd` executable dropped (C002-TC-509) | yes | yes |
| cfg-node18 | as cfg-no-ripwire, plus shim `cfg-node18/bin/node` reporting `v18.20.4` for `-v` (other calls run the real node); on Windows also a native `node.exe` built from `cfg-node18/node-shim.cs` into the temporary folder (the sdd MCP server's command tool runs native executables only, C002-TC-509 row node18 on OpenCode) | yes | yes |
| cfg-hosts | host shims for `sdd host-version` (C002-T-014): `opencode` 1.4.2, `code` 1.105.1 with GitHub Copilot Chat 0.32.4, `code-insiders` 1.142.0-insider with GitHub Copilot Chat 0.35.3; each as a `.cmd` (Windows) and a `sh` script | — | — |
| cfg-vscode-no-chat | shim `code` 1.105.1 without the GitHub Copilot Chat extension (C002-T-014) | — | — |
| cfg-deepwiki-down | as cfg-no-ripwire, with the DeepWiki server URL pointing to an unreachable host | yes | yes |
