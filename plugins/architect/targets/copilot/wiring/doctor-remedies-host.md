| {{host_name}} | `sdd host-version vscode`: VS Code {{tested_version:vscode}}, GitHub Copilot Chat {{tested_version:copilot-chat}} | tested versions: VS Code {{tested_version:vscode}}, GitHub Copilot Chat {{tested_version:copilot-chat}} |
| sdd CLI | `sdd --version` = {{package_version}} | `npm install -g architect-sdd@{{package_version}}` |
| Copilot hooks | the `hooks` line of `sdd host-version vscode` is `enabled` | `disabled`: enable chat.useHooks and trust the workspace; `unknown`: check chat.useHooks and Workspace Trust by hand |
