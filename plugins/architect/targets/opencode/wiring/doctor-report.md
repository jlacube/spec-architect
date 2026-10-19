3. **Report** a table with the columns Tool, Status, Version, Fallback, Fix — one row per tool in
   the order above: node, git, {{host_name}}, ripwire, Serena, ast-grep, Context7, DeepWiki, sdd CLI.
   Status: `ok`, `missing`, `unreachable` (remote servers), `error` (present but unusable, too old
   or of another version) or `untested` (a host version other than the tested one). Fix: for every
   non-ok row, the command of the remedies table below; empty for an `ok` row.
   - node: `error` below version 20.
   - {{host_name}}: `ok` when `sdd host-version {{host_version_arg}}` prints `opencode {{tested_version:opencode}}`; `untested` when it prints another version, with the Fix `tested version: {{tested_version:opencode}}`; `missing` when it prints `opencode missing`.
   - sdd CLI: `ok` when the major, minor and patch numbers that `sdd --version` prints all equal those of {{package_version}}; `error` when any of the three differs, older or newer, with the Fix `npm install -g architect-sdd@{{package_version}}`; `missing` when `sdd --version` does not run or is not found, with the same Fix.
   - A command-line tool whose probe is refused with ERR-MCP-006 because only a `.cmd` or `.bat` shim was found (under sdd MCP server enforcement the `{{server_shell}}` command tool does not start a shim; this package uses {{enforcement_mode}}): status `error`, version `—`, its fallback, and the Fix `install a native executable of <tool>` followed by its native-install command from the remedies table (ast-grep: the "ast-grep (native executable)" row; the other tools: their own row). A probe refused because the executable is not found: `missing`.
   - Fallbacks: ripwire → `serena → lsp → grep` (or the next available layer); Serena → `lsp → grep`;
     ast-grep → `grep`; Context7 → `webfetch`; DeepWiki → `webfetch` of the repository.
4. **Outcome** — the last line of your reply, exactly one of (when both failure conditions hold,
   the node line):
   - `Doctor: failed: node ≥ 20 required` — node missing or older than 20;
   - `Doctor: failed: sdd CLI not reachable` — the sdd CLI row is `missing`;
   - `Doctor: completed with warnings` — any other row not `ok` (`untested` and `error` included);
   - `Doctor: completed` — every row `ok`.
