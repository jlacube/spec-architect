3. **Report** a table with the columns Tool, Status, Version, Fallback, Fix — one row per tool in
   the order above: node, git, {{host_name}}, ripwire, Serena, ast-grep, Context7, DeepWiki, sdd CLI,
   Copilot hooks. Status: `ok`, `missing`, `unreachable` (remote servers), `error` (present but
   unusable, too old, of another version, or a state that cannot be read) or `untested` (a host
   version other than the tested one) and, for Context7 and DeepWiki, `untested` when no probe call
   reached the server. Fix: for every non-ok row, the command of the remedies table
   below; empty for an `ok` row.
   - node: `error` below version 20.
   - {{host_name}}: Version shows both parts, `VS Code <vscode>, GitHub Copilot Chat <copilot-chat>`, as `sdd host-version {{host_version_arg}}` prints them. `ok` when VS Code is {{tested_version:vscode}} and GitHub Copilot Chat is {{tested_version:copilot-chat}}; `untested` when either differs (or `copilot-chat missing`), with the Fix `tested versions: VS Code {{tested_version:vscode}}, GitHub Copilot Chat {{tested_version:copilot-chat}}`; `missing` when it prints `vscode missing`.
   - sdd CLI: `ok` when the major, minor and patch numbers that `sdd --version` prints all equal those of {{package_version}}; `error` when any of the three differs, older or newer, with the Fix `npm install -g architect-sdd@{{package_version}}`; `missing` when `sdd --version` does not run or is not found, with the same Fix.
   - Copilot hooks, in both enforcement modes (the subagent guard hook is a PreToolUse hook in both): the `hooks` line of `sdd host-version {{host_version_arg}}` reads `chat.useHooks` only, from the workspace settings and then the user settings of the default profile; the settings of other profiles and of a `.code-workspace` file, Workspace Trust and organisation policy are not read, and the manual VS Code checklist confirms them. So:
     - `hooks enabled`: `ok`, Version `chat.useHooks on; profile and .code-workspace settings, Workspace Trust and organisation policy not read, confirmed by the manual VS Code checklist`, Fix empty;
     - `hooks disabled (chat.useHooks)`: `error`, Version `disabled (chat.useHooks)`, Fix `enable chat.useHooks and trust the workspace`;
     - `hooks unknown`, or no `hooks` line: `error`, Version `cannot be read`, Fix `check chat.useHooks and Workspace Trust by hand`.
     Never show this row as `ok` for a hooks state that was not read as enabled.
   - A command-line tool whose probe is refused with ERR-MCP-006 because only a `.cmd` or `.bat` shim was found (under sdd MCP server enforcement the `{{server_shell}}` command tool does not start a shim; this package uses {{enforcement_mode}}): status `error`, version `—`, its fallback, and the Fix `install a native executable of <tool>` followed by its native-install command from the remedies table (ast-grep: the "ast-grep (native executable)" row; the other tools: their own row). A probe refused because the executable is not found: `missing`.
   - Context7 and DeepWiki, from the researcher's line for the server (`<endpoint>` its endpoint in the remedies table): `ok` → `ok`, Fix empty; `failed: <text>` → `unreachable`, Fix `check network; endpoint <endpoint>`; `not offered` → `untested`, Fix `the researcher was offered no <server> tool: turn on or start the <server> MCP server for the researcher (it is in the package's MCP configuration); if it is on, check network; endpoint <endpoint>`; `refused: <text>` → `untested`, Fix `allow the <server> tools for the researcher`; no line for the server → `untested`, Fix `no probe outcome from the researcher; run the doctor again`.
   - Fallbacks: ripwire → `serena → lsp → grep` (or the next available layer); Serena → `lsp → grep`;
     ast-grep → `grep`; Context7 → the fetch tool (`web/fetch`); DeepWiki → the fetch tool (`web/fetch`) of the repository.
4. **Outcome** — the last line of your reply, exactly one of (when both failure conditions hold,
   the node line):
   - `Doctor: failed: node ≥ 20 required` — node missing or older than 20;
   - `Doctor: failed: sdd CLI not reachable` — the sdd CLI row is `missing`;
   - `Doctor: completed with warnings` — any other row not `ok` (`untested` and `error` included);
   - `Doctor: completed` — every row `ok`.
