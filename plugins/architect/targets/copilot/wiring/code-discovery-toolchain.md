- **Toolchain record** (`_constitution/toolchain.md`, init and doctor): a table with one row per
  node, git, {{host_name}}, ripwire, Serena, ast-grep, Context7, DeepWiki, sdd CLI and Copilot hooks — detected (yes/no), version, path or endpoint, fallback in use (for ripwire
  absent: `serena → lsp → grep`, or the next layer that is available). Probe with `--version`
  ({{host_name}}: `sdd host-version vscode`; sdd CLI: `sdd --version`); Context7 and DeepWiki are detected when
  their tools load.
