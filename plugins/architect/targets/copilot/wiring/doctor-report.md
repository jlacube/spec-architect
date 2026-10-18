3. **Report** a table with the columns Tool, Status, Version, Fallback, Fix — one row per tool in
   the order above. Status: `ok`, `missing`, `unreachable` (remote servers), `error` (present but
   unusable or too old) or `untested` (a host version other than the tested one). Fix: for every
   non-ok row, the command of the remedies table below.
   - node: `error` below version 20.
   - {{host_name}}: `untested` when `sdd host-version vscode` reports a VS Code version other than {{tested_version:vscode}} or a GitHub Copilot Chat version other than {{tested_version:copilot-chat}}; `missing` when VS Code is not found.
   - sdd CLI: `error` when `sdd --version` is not {{package_version}}, older or newer; `missing` when it does not run.
   - Copilot hooks: `error` when the `hooks` line of `sdd host-version vscode` says `disabled (<source>)` or `hooks unknown`.
   - Fallbacks: ripwire → `serena → lsp → grep` (or the next available layer); Serena → `lsp → grep`;
     ast-grep → `grep`; Context7 → the fetch tool (`web/fetch`); DeepWiki → the fetch tool (`web/fetch`) of the repository.
4. **Outcome** — the last line of your reply, exactly one of:
   - `Doctor: failed: node ≥ 20 required` — node missing or older than 20;
   - `Doctor: failed: sdd CLI not reachable` — the sdd CLI row is `missing`;
   - `Doctor: completed with warnings` — any other row not `ok`;
   - `Doctor: completed` — every row `ok`.
