Architect 0.1.1 fixes the known gaps of 0.1.0 and a few problems found while dogfooding it. It's a patch release: nothing is removed, and the commands and files work as in 0.1.0.

## What's in this release

| File | For |
|---|---|
| `architect-0.1.1-plugin.zip` | Claude Code (the plugin with its local marketplace) |
| `architect-0.1.1.zip` | Claude Code (the full release folder) |
| `architect-copilot-0.1.1.zip` | VS Code with GitHub Copilot Chat |
| `zip.sha256` | SHA-256 of the Copilot package |
| npm: [`architect-sdd@0.1.1`](https://www.npmjs.com/package/architect-sdd) | the `sdd` CLI and the `sdd-mcp` server, required by the Copilot package |

## Fixed

- **A change asked for in plain words (D-032).** The conductor now runs the new-change procedure on every create-change request, with or without `/architect:new`. It proposes the lite or full profile from a size estimate, asks for the kind (greenfield, brownfield or mixed) in the same round unless you gave `--kind`, and asks again when an answer names no kind. The change is created only after your answers.
- **An answer between a gate approval and the next phase (D-034).** The conductor logs it in the next phase's `questions-log.md` (`10-spec/` after G1, `20-plan/` after G2), with a line saying that the round was given before the phase started. The approved phase and its hash stay untouched, and the lint accepts the new log.
- **Progress reporting without the plugin (D-035).** The hand-off now gives an install line with the exact CLI version, `npm install -g architect-sdd@0.1.1`, followed by bare `sdd` commands, so an implementer without Architect can report task status. A hand-off without a versioned install line is a lint error (LINT-HAND-003) while the plan is open. The plugin README and the `SDD.md` written by `sdd init` give the same commands.
- **Archiving a change with its own archive task.** `sdd archive` no longer refuses because the task that runs the archive is still open. The planner marks that task (`archive_task: true` in a task file, `- **Archive task:** true` in a lite plan), and the archive preconditions skip it. More than one marked task is a lint error (LINT-TASK-005). The tasks of a lite plan now count in the preconditions.
- **Lite plans stale after the first task report.** The approval hash of a lite `20-plan/plan.md` now leaves out the report fields that `sdd task set` writes (Status, Commit, Notes, Completed at), so reporting a task no longer makes the approved plan stale. See "Lite plans approved with 0.1.0" below.
- **Where `sdd task set` writes a new report field in a lite plan.** It goes after the task's last field and that field's indented lines, such as the checkboxes of Done when, instead of between a field and its checkboxes.
- **Archived changes.** Read-only commands that take a change number, such as `lint`, `trace`, `hash` and `gate show`, now find a change under `.sdd/_archive/` by its number. Writing commands refuse an archived change with exit code 2 and write nothing.

## If you have a workspace from 0.1.0

### The sentence in `SDD.md`

`sdd init` 0.1.0 wrote this sentence in the section "If you are implementing a change" of `.sdd/SDD.md`:

> Read `NNN-slug/20-plan/handoff.md` and report progress with `node <plugin-root>/scripts/sdd.mjs task set <task-id> --status <status>` as described there.

`sdd init` 0.1.1 writes this text instead:

> Read `NNN-slug/20-plan/handoff.md`. Install the sdd CLI once with `npm install -g architect-sdd@0.1.1`, then report progress with `sdd task set <task-id> --status <status>` as described there.

0.1.1 doesn't change an existing `SDD.md`. Replace the sentence by hand, or run `sdd init --force`, which rewrites `SDD.md`.

### Lite plans approved with 0.1.0

This affects only a lite change whose `20-plan` phase (gate G3) was approved with the sdd CLI 0.1.0. Full changes and the other phases are not affected.

1. The first `sdd stale check` of the sdd CLI 0.1.1 reports that `20-plan` phase as `stale`, because 0.1.1 computes the plan's hash without the report fields.
2. One revision of the phase and one G3 approval with the sdd CLI 0.1.1 make it `approved` again: `sdd change revise <NNN> 20-plan --reason "<reason>"`, then the gate as usual. Nothing in the plan needs to change for this.
3. Before that G3 approval, move each report-field line that stands between a field line, such as `- **Done when:**`, and that field's indented lines, such as its checkbox lines, to directly after those indented lines. The sdd CLI 0.1.0 put such lines there when it reported a task. Left in place, they make the lint read Done when as empty, and the approval is refused until they're moved.
4. The approval holds only while every later `sdd stale check` of the change runs the sdd CLI 0.1.1. The sdd CLI 0.1.0 would report the phase `stale` again.

## Install

**Claude Code** (2.1.295 or later, Node.js 20 or later, Git): unpack `architect-0.1.1-plugin.zip`, then in Claude Code:

```text
/plugin marketplace add <unpacked folder>
/plugin install architect@architect-local
```

To update from 0.1.0, add the new folder as the marketplace and update the plugin. In the repository you want to specify, start `claude --agent architect:sdd-conductor` and run `/architect:doctor`.

**VS Code with GitHub Copilot Chat** (tested on VS Code 1.145.2 with Copilot Chat 0.73.0):

```sh
npm install -g architect-sdd@0.1.1
```

Unpack `architect-copilot-0.1.1.zip` into a folder outside your repository, check it with `sha256sum -c zip.sha256` from the folder that holds the zip, then follow `INSTALL.md` in the package (`sdd install copilot --package <folder>`).

## Verified

- Copilot release check: `released`, sdd MCP server enforcement, no exception, 0 refusals.
- npm integrity of `architect-sdd@0.1.1` equals the checked tarball.
- Tested on Windows 11 x64. macOS and Linux are prepared but untested.
