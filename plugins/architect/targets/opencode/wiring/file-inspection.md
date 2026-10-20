Inspect files with the `read`, `glob` and `grep` tools, not a shell command (`grep`, `cat`, `head`, `ls` are
denied as commands). Find files under `.sdd/` with `sdd status` (through the `bash` tool, or through
`{{server_shell}}` under sdd MCP server enforcement) and `read`: `read` of `.sdd/` or of a folder in it
lists its entries, dot folders included, and `read` of a path from the layout below opens one file. Search
text inside `.sdd/` with `grep` whose `path` names a folder or a file inside `.sdd/`. Never use `glob` to
find or to rule out a file under `.sdd/` (it lists no file inside a dot folder), and never take an empty
`glob` or `grep` result as proof that `.sdd/` or a file in it is absent. Run only the allowlisted commands,
through the `bash` tool (or `{{server_shell}}` under sdd MCP server enforcement), one command per call,
with no `;`, `&&` or redirection.
