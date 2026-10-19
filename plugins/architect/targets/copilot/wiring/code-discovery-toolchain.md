- **Toolchain record** (`_constitution/toolchain.md`, init and doctor): a table with one row per
  node, git, {{host_name}}, ripwire, Serena, ast-grep, Context7, DeepWiki, sdd CLI and Copilot
  hooks, in that order — detected (yes/no), version, path or endpoint, fallback in use (for ripwire
  absent: `serena → lsp → grep`, or the next layer that is available). Probe with `--version` (node:
  `node --version`); {{host_name}}: `sdd host-version {{host_version_arg}}` (version `VS Code <v>, GitHub
  Copilot Chat <c>`, path `—`); Copilot hooks: its `hooks` line as printed; sdd CLI:
  `sdd --version`. A tool found only as a `.cmd` or `.bat` shim that the command tool does not
  start (ERR-MCP-006) is detected `yes`, version `—`, its fallback in use. Context7 and DeepWiki are
  detected when their tools load.
