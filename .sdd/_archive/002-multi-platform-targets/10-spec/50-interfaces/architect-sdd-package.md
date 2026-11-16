---
id: C002-IF-003
artifact: spec/interface
kind: npm package
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-003 — `architect-sdd` npm package

The npm package that carries the sdd CLI and the sdd MCP server to the generated targets
(C002-DEC-007, C002-COMP-006). `npm run package` writes it; P-01 publishes it by hand (C002-REQ-502).

## §1 Files

```text
dist/architect-sdd-<version>.tgz          written by npm run package (npm pack of the staging folder)
package/                                  tarball root
├── package.json                          manifest of §2
├── scripts/sdd.mjs                       bundled sdd CLI (entry src/cli.ts), shebang line first
├── scripts/sdd-mcp.mjs                   bundled sdd MCP server (entry src/mcp/server.ts), shebang line first
├── templates/full/…, templates/lite/…,   copy of plugins/architect/templates/ (all profiles and the
│   templates/constitution/…              constitution template), CLI lines translated (below)
├── serena/architect-read-only.yml        copy of plugins/architect/serena/architect-read-only.yml
├── LICENSE                               MIT license of the repository (C002-REQ-414)
├── THIRD_PARTY_NOTICES.md                every package bundled into either entry, with version and license
└── README.md                             install command, the two executables, the shipped files, and the
                                          repository URL https://github.com/jlacube/spec-architect, whose
                                          README is the full guide
```

- The two entries are separate esbuild bundles of the same source tree and version as the plugin's
  `scripts/sdd.mjs` (C002-REQ-501, C002-REQ-412). The plugin keeps its one bundled file
  (C002-CON-12).
- `templates/` must sit next to `scripts/`. **Template lookup order** of the CLI, the same program
  in the plugin's bundle and in this package (revised for defect D-004; `src/workspace/templates.ts`
  › `defaultPluginRoot()`):
  1. the repository's `.sdd/_templates/<profile>/<path>`, when the file exists (C002-REQ-513);
  2. the `templates/` folder above the running bundle (`<package>/templates/` for this package's
     `sdd`, `<plugin-root>/templates/` for the plugin's `scripts/sdd.mjs`), when that folder exists;
  3. only when it does not (an unbundled run, such as the tests running `src/cli.ts`), the
     `templates/` folder of the plugin root named by `CLAUDE_PLUGIN_ROOT`.

  On Claude Code steps 2 and 3 name the same folder. The npm `sdd` started inside a Claude Code
  session, which sets `CLAUDE_PLUGIN_ROOT`, therefore reads its own translated templates, never
  another package's. Before CHG-002 the CLI took the folder above its bundle only when
  `CLAUDE_PLUGIN_ROOT` was unset (`src/workspace/templates.ts:33`, current-state E-7). Without
  `templates/` beside `scripts/`, `sdd change new` and `sdd template show` fail on the generated
  targets.
- `serena/architect-read-only.yml` is taken from the folder above the running bundle by
  `sdd serena-launch --read-only`, with no fallback (`<cli folder>/../serena/`, C002-IF-007).
- **CLI lines in the templates** (C002-REQ-518, C002-REQ-519). While staging, the build copies each
  template and replaces, on every line, each invocation of the CLI through its plugin path — the
  word `node` followed by `<plugin-root>/scripts/sdd.mjs` or `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs`,
  quoted or not — by the bare word `sdd`; nothing else changes, so line numbers stay (for example
  `templates/full/20-plan/handoff.md:20-23`, C002-TS-529). Then it scans every staged template for a
  remaining plugin path of the CLI (any `<…>/scripts/sdd.mjs`, `scripts/sdd.mjs` after a variable, or
  `${CLAUDE_PLUGIN_ROOT}`) and fails with ERR-BLD-002 naming the template, the line and the construct
  (C002-TS-530), each finding printed as `ERR-BLD-002: <message>` (`errors.md` print form). The
  source plugin's templates stay unchanged for Claude Code (C002-GOAL-05); the plugin's bundle reads
  the plugin's own templates (lookup step 2).

## §2 Manifest

```json
{
  "name": "architect-sdd",
  "version": "<version of plugins/architect/.claude-plugin/plugin.json>",
  "description": "sdd CLI and sdd MCP server of the Architect spec-driven workflow",
  "license": "MIT",
  "type": "module",
  "bin": { "sdd": "scripts/sdd.mjs", "sdd-mcp": "scripts/sdd-mcp.mjs" },
  "files": ["scripts/sdd.mjs", "scripts/sdd-mcp.mjs", "templates/", "serena/", "THIRD_PARTY_NOTICES.md"],
  "engines": { "node": ">=20" }
}
```

Rules checked on the packed tarball (C002-COMP-007 runs them in `npm run check`):

| Rule | Requirement |
|---|---|
| `name` is `architect-sdd`, without a scope; `version` equals the source plugin version (C002-INV-11) | C002-REQ-502 |
| `bin` has the entry `sdd`; `bin.sdd-mcp` is the server entry | C002-REQ-501, C002-REQ-412 |
| No `dependencies`, `optionalDependencies` or `peerDependencies`; every runtime import is bundled or a Node.js built-in | C002-NFR-402, C002-CON-11 |
| No `scripts` field (no `preinstall`, `install`, `postinstall`) | C002-CON-11 |
| `LICENSE` holds the MIT license; `THIRD_PARTY_NOTICES.md` lists the union of the packages of both bundle metafiles | C002-REQ-414 |
| Every bundled package of either entry has a license of the allowlist of C001-REQ-1114, else the build fails with ERR-BLD-001 | C002-REQ-413 |
| `engines.node` is `>=20` | C002-NFR-401 |
| `templates/` holds every file of `plugins/architect/templates/` and `serena/architect-read-only.yml` the source mode file, each byte-identical except the CLI lines translated by §1 | C002-REQ-512, C002-REQ-518 |
| No shipped template names the CLI through a plugin path (the scan of §1; the build fails with ERR-BLD-002) | C002-REQ-519 |

npm adds `LICENSE`, `README.md` and `package.json` to the tarball without a `files` entry.

## §3 Installed commands

| Command | Behaviour |
|---|---|
| `sdd <command> …` | the sdd CLI of C001-IF-01 with the additions of C002-IF-007; same output and files as `node plugins/architect/scripts/sdd.mjs` of the same version (C002-TS-501, C002-TS-502), with one exception (defect D-008): text taken from a shipped template, in a file the CLI creates (for example `20-plan/handoff.md` of a lite change) or printed by `sdd template show`, carries the CLI lines that §1 translates (`sdd …` where the plugin's template has `node <plugin-root>/scripts/sdd.mjs …`, C002-REQ-518); every other line, and the list of files, are the same |
| `sdd-mcp --profile files\|shell [--root <dir>]` | the sdd MCP server of C002-IF-002 |

Install command written in the install notes and in the doctor's fix column:
`npm install -g architect-sdd@<version>` (C002-IF-006).

## §4 Smoke test (C002-NFR-401)

Install the packed tarball into a clean prefix outside the repository, then: `sdd --version` prints
the version; `sdd status` runs in a fixture workspace; one MCP `initialize` exchange with
`sdd-mcp --profile files` succeeds — under PowerShell 7 and Git Bash, with Node.js 20 and 22.
