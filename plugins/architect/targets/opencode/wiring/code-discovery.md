## {{host_name}} wiring

- Serena tools: `mcp__plugin_architect_serena__find_symbol`, `mcp__plugin_architect_serena__get_symbols_overview`,
  `mcp__plugin_architect_serena__find_referencing_symbols`, `mcp__plugin_architect_serena__find_declaration`, `mcp__plugin_architect_serena__find_implementations`;
  they are available from the start of the session. LSP: the `lsp` tool when it is offered (otherwise Serena, then Grep).
- Bash is limited to the allowlist: `ripwire` read verbs, `ast-grep run --pattern` (no rewrite),
  read-only `git`, `sdd`, version probes; one command per call, no `&&`, `;` or redirection.
  Run `git` from the working folder with the read verb first (`git log …`): `git -C <dir>`,
  `--git-dir` and `--work-tree` are denied.
