- **Toolchain record** (`_constitution/toolchain.md`, init and doctor): a table with one row per
  node, git, {{host_name}}, ripwire, Serena, ast-grep, Context7, DeepWiki and sdd CLI, in that
  order — detected (yes/no), version, path or endpoint, fallback in use (for ripwire absent:
  `serena → lsp → grep`, or the next layer that is available). Probe with `--version` (node:
  `node --version`); {{host_name}}: `sdd host-version {{host_version_arg}}` (version as it prints it, path `—`);
  sdd CLI: `sdd --version`. A tool found only as a `.cmd` or `.bat` shim that the command tool does
  not start (ERR-MCP-006) is detected `yes`, version `—`, its fallback in use. Make no Context7 or
  DeepWiki call: the brief holds the researcher's probe outcome line for each (`<server>: ok`,
  `failed: …`, `refused: …` or `not offered`); record the server detected `yes` for `ok` and `no`
  otherwise (also when the brief has no line for it), with its endpoint (Context7
  `https://mcp.context7.com/mcp`, DeepWiki `https://mcp.deepwiki.com/mcp`) and, for `no`, the
  fallback in use.
