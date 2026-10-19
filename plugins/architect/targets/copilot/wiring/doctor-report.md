3. **Report** a table with the columns Tool, Status, Version, Fallback, Fix — one row per tool in
   the order above: node, git, {{host_name}}, ripwire, Serena, ast-grep, Context7, DeepWiki, sdd CLI,
   Copilot hooks. Status: `ok`, `missing`, `unreachable` (remote servers), `error` (present but
   unusable, too old, of another version, or a state that cannot be read) or `untested` (a host
   version other than the tested one). Fix: for every non-ok row, the command of the remedies table
   below; empty for an `ok` row.
   - node: `error` below version 20.
   - {{host_name}}: Version shows both parts, `VS Code <vscode>, GitHub Copilot Chat <copilot-chat>`, as `sdd host-version {{host_version_arg}}` prints them. `ok` when VS Code is {{tested_version:vscode}} and GitHub Copilot Chat is {{tested_version:copilot-chat}}; `untested` when either differs (or `copilot-chat missing`), with the Fix `tested versions: VS Code {{tested_version:vscode}}, GitHub Copilot Chat {{tested_version:copilot-chat}}`; `missing` when it prints `vscode missing`.
   - sdd CLI: `ok` when the major, minor and patch numbers that `sdd --version` prints all equal those of {{package_version}}; `error` when any of the three differs, older or newer, with the Fix `npm install -g architect-sdd@{{package_version}}`; `missing` when `sdd --version` does not run or is not found, with the same Fix.
   - Copilot hooks, in both enforcement modes (the subagent guard hook is a PreToolUse hook in both): `ok` only when hooks are read as enabled for every source that can disable them — `chat.useHooks`, Workspace Trust and organisation policy. The `hooks` line of `sdd host-version {{host_version_arg}}` reads `chat.useHooks` only; Workspace Trust and organisation policy cannot be read by it. So:
     - `hooks enabled`: `error`, Version `chat.useHooks on; Workspace Trust and policy cannot be read`, Fix `check chat.useHooks and Workspace Trust by hand`;
     - `hooks disabled (<source>)`: `error`, Version `disabled (<source>)`, Fix `enable chat.useHooks and trust the workspace`;
     - `hooks unknown`, or no `hooks` line: `error`, Version `cannot be read`, Fix `check chat.useHooks and Workspace Trust by hand`.
     Never show this row as `ok` for a hooks state that was not read.
   - A command-line tool whose probe is refused with ERR-MCP-006 because only a `.cmd` or `.bat` shim was found (under sdd MCP server enforcement the `{{server_shell}}` command tool does not start a shim; this package uses {{enforcement_mode}}): status `error`, version `—`, its fallback, and the Fix `install a native executable of <tool>` followed by its native-install command from the remedies table (ast-grep: the "ast-grep (native executable)" row; the other tools: their own row). A probe refused because the executable is not found: `missing`.
   - Fallbacks: ripwire → `serena → lsp → grep` (or the next available layer); Serena → `lsp → grep`;
     ast-grep → `grep`; Context7 → the fetch tool (`web/fetch`); DeepWiki → the fetch tool (`web/fetch`) of the repository.
4. **Outcome** — the last line of your reply, exactly one of (when both failure conditions hold,
   the node line):
   - `Doctor: failed: node ≥ 20 required` — node missing or older than 20;
   - `Doctor: failed: sdd CLI not reachable` — the sdd CLI row is `missing`;
   - `Doctor: completed with warnings` — any other row not `ok` (`untested` and `error` included);
   - `Doctor: completed` — every row `ok`.
