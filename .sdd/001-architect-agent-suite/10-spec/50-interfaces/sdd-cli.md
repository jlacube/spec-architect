---
id: C001-IF-01
artifact: spec/interface
kind: CLI
change: CHG-001
phase: 10-spec
status: approved
---

# C001-IF-01 — sdd CLI contract

## Synopsis

```text
node <plugin-root>/scripts/sdd.mjs <command> [<subcommand>] [arguments] [options]
```

In this document `sdd` stands for `node <plugin-root>/scripts/sdd.mjs`. The workspace is found
by walking up from the current directory to the first folder containing `.sdd/` (or `.git/`
for `init`). Global options: `--cwd <path>`, `--json` (where supported), `--quiet`,
`SDD_DEBUG=1` environment variable (C001-NFR-702).

## Commands

| Command | Arguments / options | Effect | Requirements |
|---|---|---|---|
| `init` | `[--force]` | Create or complete `.sdd/` | C001-REQ-101, 102, 103 |
| `change new` | `"<title>" [--profile lite\|full] [--kind greenfield\|brownfield\|mixed]` | Create change folder, manifest, ids.json; prints `CHG-NNN` and path | C001-REQ-107, 108, 117, 125 |
| `change profile` | `<NNN> full` | Upgrade lite → full | C001-REQ-119, 120 |
| `change revise` | `<NNN> <phase> --reason "<text>"` | Phase → in-revision; downstream → stale | C001-REQ-812 |
| `change stop` | `<NNN> --reason "<text>"` | Change → stopped | C001-REQ-815 |
| `id next` | `<TYPE> [--change NNN] [--block <capability>]` | Allocate and print next ID | C001-REQ-109, 110, 113 |
| `id tombstone` | `<ID> --reason "<text>"` | Retire an ID | C001-REQ-111 |
| `status` | `[--write] [--brief] [--json]` | Print status; with `--write` rebuild registry and SDD.md block | C001-REQ-104, 105, 123, 905 |
| `lint` | `[<NNN>] [--phase <phase>] [--json] [--quick --file <path>]` | Run lint rules | CAP-07 and rule REQs |
| `trace` | `<NNN> [--write] [--json]` | Build trace graph; write matrix, open items, trace.json | C001-REQ-706 … 709, 716 |
| `gate show` | `<NNN> <phase>` | Print gate summary | C001-REQ-801 |
| `gate approve` | `<NNN> <phase> --note "<text>" [--waive <item>]… [--by <name>] [--usage "<text>"]` | Approve phase | C001-REQ-805 … 809, 814, 720 |
| `gate record` | `<NNN> <phase> --decision revise\|stop --note "<text>"` | Log a non-approval decision | C001-REQ-812, 815 |
| `stale check` | `[<NNN>]` | Recompute hashes; mark stale | C001-REQ-810 |
| `hash` | `<NNN> <phase>` | Print the phase hash | C001-REQ-806 |
| `task set` | `<T-ID> --status <s> [--commit <sha>] [--note "<t>"] [--reason "<t>"]` | Update task | C001-REQ-901 … 904, 922 |
| `defect add` | `--ref <ID> --summary "<t>" [--by <name>]` | Open spec defect | C001-REQ-907, 908 |
| `defect close` | `<D-id> --change <NNN> --resolution "<t>"` | Close defect | C001-REQ-910 |
| `defect reopen` | `<D-id> --change <NNN>` | Reopen defect | C001-REQ-923 |
| `archive` | `<NNN> [--dry-run]` | Merge into `_living/`, move to `_archive/` | C001-REQ-913 … 921 |
| `guard-path` | hook JSON on stdin | Allow/deny write (hook) | C001-REQ-1103 … 1105 |
| `guard-bash` | hook JSON on stdin | Allow/deny shell command (hook) | C001-REQ-1106, 1107 |
| `hook session-start` | hook JSON on stdin | Print brief | C001-REQ-911, 912 |
| `hook post-write` | hook JSON on stdin | Quick lint of the written `.sdd/` file; findings returned as hook feedback | C001-REQ-705 |
| `extract-features` | `<NNN>` | Write `.feature` files from gherkin blocks (optional, OQ-09) | — (Could, v1.x) |
| `version` | — | Print `architect-plugin@<semver>` | C001-REQ-123 |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success (lint: no error-severity finding; guards: allow) |
| 1 | `lint` and `trace` only: at least one error-severity finding |
| 2 | Usage error, refused operation (`ERR-CLI-*`), or guard deny |
| 3 | Internal error (`ERR-CLI-016`), including failed atomic write (`ERR-CLI-017`) |

## Output

- Human output: one finding or message per line: `<severity> <code> <path>[:<line>] [<ids>] — <message>` (C001-REQ-702).
- `--json`: a single JSON document on standard output and nothing else (C001-REQ-703).
  Lint output schema: `lint-report.schema.json`.
- Errors: `ERR-CLI-<nnn>: <message>. Fix: <corrective action>` on standard error (C001-NFR-601).
- Warnings during successful commands: `WARN-CLI-<nnn>: …` on standard output; exit code 0.

## Write discipline

- All writes are atomic (temporary file + rename, C001-REQ-126).
- No command writes outside `.sdd/` (the CLI is itself bound by C001-CON-01), except `init`,
  which creates `.sdd/` itself.
- No network access (C001-NFR-202).
