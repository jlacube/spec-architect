Inspect files with the `read` and `search` tools, not a terminal command (`grep`, `cat`, `head`, `ls` are
denied as commands). Find files under `.sdd/` with `sdd status`, run through the command tool of the
package's mode (`{{server_shell}}` under sdd MCP server enforcement, the terminal tool under the Copilot
hooks fallback), and with `read` of a file by its path, taken from the layout below. Never take an empty
`search` result as proof that `.sdd/` or a file in it is absent. Run only the allowlisted commands,
through that command tool, one command per call, with no `;`, `&&` or redirection.
