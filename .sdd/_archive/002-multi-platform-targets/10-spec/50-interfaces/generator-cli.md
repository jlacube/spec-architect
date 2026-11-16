---
id: C002-IF-004
artifact: spec/interface
kind: CLI
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-004 — Generator CLI

The generator (C002-COMP-001) is a build script of the repository, not part of the shipped CLI. It
reads the source plugin and the mapping tables (C002-IF-001) and writes the target packages
(C002-IF-005).

## Synopsis

```text
node scripts/generate.mjs [--target opencode|copilot]… [--source <plugin-dir>] [--out <dir>]
                          [--mode <target>=<mode>]… [--json] [--quiet]
npm run generate          same as node scripts/generate.mjs (all targets, out dist/)
```

`npm run package` runs it with the defaults after `npm run build`; `npm run check` runs it with
`--out` set to a fresh folder under the system temporary folder, runs the target structure checks
on that folder and deletes it (C002-REQ-601, C002-TS-603).

## Commands

The script has one command; its options:

| Option | Default | Effect | Requirements |
|---|---|---|---|
| `--target <name>` | every table under `<source>/targets/` | Generate only the named targets; repeatable | C002-REQ-101 |
| `--source <plugin-dir>` | `plugins/architect` | Source plugin folder (fixtures `fx-plugin-*` in tests); its `targets/` folder holds the tables | C002-REQ-101, C002-TS-102 |
| `--out <dir>` | `dist` | Output root; each target is written to `<out>/<target>/`. A folder inside `<source>` is refused (ERR-GEN-008) | C002-REQ-102, C002-CON-02 |
| `--mode <target>=<mode>` | the table's mode | Generate a target for another enforcement mode, for spikes and mode-specific tests; the manifest records `mode_source: "override"` and the release check refuses such a package (ERR-REL-008) | C002-INV-04 |
| `--json` | off | Print one JSON document (§Output) instead of human lines | — |
| `--quiet` | off | Print errors only | — |

Run semantics:

1. Every selected target is generated in memory first; files are then written to
   `<out>/.staging-<target>/` and moved to `<out>/<target>/` after the old folder is removed.
2. If any error is found for any selected target, no `<out>/<target>/` of a selected target exists
   after the run (C002-INV-02, C002-TS-103), and the source plugin is unchanged (C002-INV-03,
   C002-TS-105).
3. The generator never writes under `<source>` (C002-REQ-102) and reads nothing under `.sdd/`
   (C002-REQ-605).
4. Two runs on the same source write byte-identical output (C002-NFR-301, C002-CON-09).

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Every selected target package written |
| 1 | At least one generation error (`ERR-GEN-001` … `ERR-GEN-009`); no target package of the run kept |
| 2 | Usage error (unknown option, unknown target name) |
| 3 | Internal error or failed write (`ERR-GEN-010`) |

## Output

- Human (default): one line per diagnostic, sorted by source file, line and target, in the print
  form of `errors.md` (`<code>: <message>. Fix: <fix>`, as the CLI's ERR-CLI lines; revised for
  defect D-008): `ERR-GEN-001: agents/sdd-critic.md:7: tool name "KillShell" has no entry in the
  copilot mapping table. Fix: …` (C002-TS-108). Then one summary line per
  selected target. A run without errors prints `<target>: written <out>/<target>/ (<n> files, mode
  <mode>)` for each target. A run with any error writes no target (run semantics, step 2), so every
  selected target prints `<target>: not written (<n> errors)`, where `<n>` counts that target's own
  errors and may be 0 (for example `opencode: not written (0 errors)` beside `copilot: not written (2
  errors)`).
- `--json`: `{ "targets": [ { "target", "mode", "mode_source", "written", "errors", "files", "out" } ],
  "diagnostics": [ { "severity", "code", "file", "line", "target", "construct", "message", "fix" } ] }`;
  `written` is `false` for every target of a run with an error.
- A target whose release the release check refuses is still generated; the release check alone
  decides publication (C002-REQ-101, C002-REQ-619; architecture §6.2). A `deferred` spike S-08 record
  does not stop generation; it leads to the spec revision of `../10-context/scope.md` §1.1
  (C002-IF-001 §1).
- Generation manifest written into each package as `architect-target.json`:

```json
{
  "target": "opencode",
  "package_version": "0.3.0",
  "enforcement_mode": "native-permissions",
  "mode_source": "table",
  "table_schema_version": 1,
  "tested_versions": { "opencode": "1.4.2" },
  "source_digest": "sha256:<hex of the sorted source file list and contents>",
  "files": [ { "path": ".opencode/agents/sdd-auditor.md", "sha256": "<hex>" } ]
}
```

The manifest holds no time stamp and no machine path (C002-NFR-301). `files` lists every other file
of the package; the release check compares it with a regeneration (C002-NFR-501).
`package_version` is the `version` of `<source>/.claude-plugin/plugin.json`, the source plugin the
run reads, and so the value of the wiring token `{{package_version}}` in the same package
(C002-IF-001 §4, C002-CON-16); it is never taken from the version built into the generator, which
can differ when `--source` names another plugin folder, such as a fixture of version 0.3.0 (revised
for defect D-016 item 6).

**Source without a version** (revised for critic CR-36). When `<source>/.claude-plugin/plugin.json`
is missing, or parses but gives no non-empty string `version`, the run has the generation error
ERR-GEN-007 `.claude-plugin/plugin.json: version missing or not a non-empty string`, one diagnostic
for the run (no `target` in `--json`); no target package is written and the exit code is 1 (run
semantics, step 2). A manifest that does not parse is the reader's ERR-GEN-007 with its parse
error, reported once. The built-in version never stands in, neither for the manifest's
`package_version` nor for the `{{package_version}}` token. PLG-VER-001 checks the same version on
the repository in `npm run check` (C002-IF-005 §6), but not on the folder that `--source` names, so
the generator refuses on its own.
