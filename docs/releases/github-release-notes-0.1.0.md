Architect 0.1.0 is the first release of the spec-driven-development suite. Architect takes an idea through ideation, specification and planning, with a human approval gate at the end of each phase. It writes specs and plans, never production code.

## What's in this release

| File | For |
|---|---|
| `architect-0.1.0-plugin.zip` | Claude Code (the plugin with its local marketplace) |
| `architect-0.1.0.zip` | Claude Code (the full release folder) |
| `architect-copilot-0.1.0.zip` | VS Code with GitHub Copilot Chat |
| `zip.sha256` | SHA-256 of the Copilot package |
| npm: [`architect-sdd@0.1.0`](https://www.npmjs.com/package/architect-sdd) | the `sdd` CLI and the `sdd-mcp` server, required by the Copilot package |

## Install

**Claude Code** (2.1.295 or later, Node.js 20 or later, Git): unpack `architect-0.1.0-plugin.zip`, then in Claude Code:

```text
/plugin marketplace add <unpacked folder>
/plugin install architect@architect-local
```

In the repository you want to specify, start `claude --agent architect:sdd-conductor` and run `/architect:doctor`.

**VS Code with GitHub Copilot Chat** (tested on VS Code 1.145.2 with Copilot Chat 0.73.0):

```sh
npm install -g architect-sdd@0.1.0
```

Unpack `architect-copilot-0.1.0.zip` into a folder outside your repository, check it with `sha256sum -c zip.sha256` from the folder that holds the zip, then follow `INSTALL.md` in the package (`sdd install copilot --package <folder>`).

## Verified

- Copilot release check: `released`, sdd MCP server enforcement, no exception, 0 refusals.
- npm integrity of `architect-sdd@0.1.0` equals the checked tarball.
- Tested on Windows 11 x64. macOS and Linux are prepared but untested.

## Known gaps (fixed in 0.1.1)

- **D-032:** a change requested in plain words, without `/architect:new`, is created with the default profile, and the profile question is skipped. Use `/architect:new "<title>"`.
- **D-034:** an interview answer given between a gate approval and the start of the next phase isn't recorded in any questions log.
- **D-035:** the hand-off's progress commands (`sdd task set`) need the Architect plugin folder, so an implementer without Architect can't report task status. Set the status by hand in the task file's frontmatter, or install `architect-sdd` from npm and run `sdd task set` directly.
