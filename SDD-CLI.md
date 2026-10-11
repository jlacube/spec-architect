# The `sdd` command-line tool

`plugins/architect/scripts/sdd.mjs` is a single bundled Node.js file built from the TypeScript in
`src/`. It is the deterministic half of Architect: everything that must be exact and repeatable —
IDs, validation, traceability, hashes, gate records, status, archive, guards — is done here, never
by a model. Contract: `C001-IF-01` (`10-spec/50-interfaces/sdd-cli.md`).

Run it as `node plugins/architect/scripts/sdd.mjs <command>` (agents use
`node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"`). It finds the workspace by walking up from the
current directory to the first folder containing `.sdd/`.

## 1. Design principles

- **One process per call, no daemon** (CON-12); start-up is part of every performance budget.
- **No network, ever** (NFR-202) — enforced in tests by stubbing every network API.
- **Atomic writes**: every file is written to a temporary file, flushed and renamed; UTF-8 without
  BOM, LF line endings.
- **Plain Markdown in, plain Markdown out**: a small line-based parser (headings, fences, tables,
  `- **Field:** value` bullets, frontmatter) — fast enough for hooks (ADR-005).
- **Stable error codes**: `ERR-CLI-001 … 017` (exit 2), `WARN-CLI-*` (exit 0), lint codes,
  guard codes. Messages: `<CODE>: <message>. Fix: <action>`.
- **Portable**: all Windows path handling lives in one module (`src/io/paths.ts`).

## 2. Commands

| Command | Purpose |
|---|---|
| `init [--force]` | create or complete `.sdd/` from templates (never overwrites) |
| `change new "<title>" [--profile lite\|full] [--kind …]` | create change folder `NNN-slug` |
| `change profile <NNN> full` | upgrade lite → full |
| `change revise <NNN> <phase> --reason` | reopen a phase; later phases stale |
| `change stop <NNN> --reason` | stop a change |
| `id next <TYPE> [--change] [--block]` | allocate the next ID from the change's ledger (`ids.json`) |
| `id tombstone <ID> --reason` | retire an ID forever |
| `status [--write] [--brief] [--json]` | print status; `--write` rebuilds `registry.json` and the SDD.md status block |
| `lint [<NNN>] [--phase] [--json] [--quick --file <path>]` | run the lint rules (exit 1 on errors) |
| `trace <NNN> [--write] [--json]` / `trace --active [--write]` | build the trace graph, coverage, open items; `--active` for every active change, always exit 0 (SubagentStop hook) |
| `gate show <NNN> <phase>` | the gate summary (with the impact block during a revision) |
| `gate approve <NNN> <phase> --note … [--waive …] [--by] [--usage]` | approve: hashes, approvals.json, Gate log |
| `gate record <NNN> <phase> --decision revise\|stop --note` | log a non-approval decision |
| `stale check [<NNN>]` | recompute hashes, mark changed approved phases stale |
| `hash <NNN> <phase>` | print a phase hash |
| `task set <T-ID> --status … [--commit] [--note] [--reason]` | report implementation progress (allowed transitions only) |
| `defect add / close / reopen` | manage spec defects |
| `archive <NNN> [--dry-run]` | merge into `_living/`, move to `_archive/` |
| `guard-path`, `guard-bash` | PreToolUse hooks (hook JSON on stdin; exit 0 allow, 2 deny) |
| `hook session-start`, `hook post-write` | SessionStart and PostToolUse hooks |
| `serena-config <plugin-data-dir>` | create/update Serena's config in the plugin data folder |
| `extract-features <NNN>` | write `.feature` files (not implemented yet) |
| `version` | `architect-plugin@<semver>` |

## 3. Lint

53 rule modules in `src/lint/rules/` (some report several codes), grouped by family:

| Family | Examples |
|---|---|
| Workspace | `LINT-WS-*` layout, `LINT-REG-001` registry drift, `LINT-LIV-001` requirement in an inventory-only living file |
| Frontmatter and IDs | missing or wrong frontmatter, duplicate or unknown IDs, tombstoned IDs reused |
| Stories and EARS | `LINT-REQ-*` required fields, `LINT-EARS-*` one SHALL, known pattern, known system name |
| Acceptance and NFR | coverage table complete, Gherkin shape, NFR metric/threshold/method |
| Brownfield | `LINT-DELTA-001` Delta tag and cited living requirement, evidence fields |
| Plan | task file shape, test-case fields, risk fields, rollout, hand-off headings (some in T-076) |
| Text | `LINT-TXT-001` placeholder words (TBD, TODO), `LINT-SEC-001` secret-like strings |
| Trace | `TR-01 … TR-15` coverage and DAG rules |

`--quick --file` lints one file in milliseconds; the post-write hook uses it to feed findings back
to the agent that just wrote the file.

## 4. Trace

`sdd trace` parses every artifact of a change into **nodes** (ID definitions with their content
hash) and **edges** (references: `stories`, `implements`, `verified_by`, mentions…), checks the
coverage rules and the task dependency graph (acyclic, all dependencies resolve), and with `--write`
writes `trace.json`, `80-traceability.md` matrices and `85-open-items.md` (unresolved `[NEEDS
CLARIFICATION]` and `[ASSUMPTION]` markers).

## 5. Hashes and gates

A phase hash is a SHA-256 over the normalised content of the phase's files (IF-13); per-ID hashes
are stored too, so a revision can tell exactly which IDs were added, modified or removed since the
last approval and which other IDs reference them (the impact block of `gate show`). `gate approve`
refuses (and writes nothing) when the previous phase is not approved, lint has errors, `[NEEDS
CLARIFICATION]` markers are open, or the critic has open blocker findings — unless P-01 waives them
explicitly.

## 6. Archive

Planned entirely in memory first (`src/archive/plan.ts`), then applied (`src/archive/apply.ts`):
preconditions (ERR-CLI-009 lists every unmet one), living-spec merges with History rows, glossary
merge, status `archived`, folder move, registry and SDD.md regeneration. `--dry-run` prints
`<file>: <operation> <ID> — <detail>` lines and leaves the workspace byte-identical.

## 7. Building and checking

```bash
npm run build      # esbuild → plugins/architect/scripts/sdd.mjs
npm run check      # typecheck (tsc) + every test, with the no-network preload
npm run bench      # performance benchmarks → bench/results/
```

Source layout: `src/cli/` (front-end, commands, output, errors), `src/model/` (parser, IDs, graph),
`src/lint/`, `src/trace/`, `src/gate/`, `src/tracking/`, `src/workspace/`, `src/archive/`,
`src/hooks/`, `src/io/`.
