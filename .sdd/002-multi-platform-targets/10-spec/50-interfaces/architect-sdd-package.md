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
│   templates/constitution/…              constitution template)
├── serena/architect-read-only.yml        copy of plugins/architect/serena/architect-read-only.yml
├── LICENSE                               MIT license of the repository (C002-REQ-414)
├── THIRD_PARTY_NOTICES.md                every package bundled into either entry, with version and license
└── README.md                             install, the two executables, link to the repository README
```

- The two entries are separate esbuild bundles of the same source tree and version as the plugin's
  `scripts/sdd.mjs` (C002-REQ-501, C002-REQ-412). The plugin keeps its one bundled file
  (C002-CON-12).
- `templates/` must sit next to `scripts/`: the CLI resolves templates from the folder above its
  bundle when `CLAUDE_PLUGIN_ROOT` is not set (`src/workspace/templates.ts:33`, current-state E-7).
  Without it `sdd change new` and `sdd template show` fail on the generated targets.
- `serena/architect-read-only.yml` is found the same way by `sdd serena-launch --read-only`
  (C002-IF-007).

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

npm adds `LICENSE`, `README.md` and `package.json` to the tarball without a `files` entry.

## §3 Installed commands

| Command | Behaviour |
|---|---|
| `sdd <command> …` | the sdd CLI of C001-IF-01 with the additions of C002-IF-007; same output and files as `node plugins/architect/scripts/sdd.mjs` of the same version (C002-TS-501, C002-TS-502) |
| `sdd-mcp --profile files\|shell [--root <dir>]` | the sdd MCP server of C002-IF-002 |

Install command written in the install notes and in the doctor's fix column:
`npm install -g architect-sdd@<version>` (C002-IF-006).

## §4 Smoke test (C002-NFR-401)

Install the packed tarball into a clean prefix outside the repository, then: `sdd --version` prints
the version; `sdd status` runs in a fixture workspace; one MCP `initialize` exchange with
`sdd-mcp --profile files` succeeds — under PowerShell 7 and Git Bash, with Node.js 20 and 22.
