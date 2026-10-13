---
id: TOOLCHAIN
artifact: constitution/toolchain
change: none
phase: constitution
status: draft
---

# Toolchain record

Recorded 2026-10-13 by the cartographer during `/architect:init` (step 3), at commit
`b3892d4ca5e93ec80cb2231595adac2c45e37671` (working tree has uncommitted changes under `.sdd/`).

| Node | Detected | Version | Path or endpoint | Fallback in use |
|---|---|---|---|---|
| node | yes (indirect) | not probed: the Bash guard denies `node --version`; `package.json` requires `>=20`; `sdd.mjs` runs | on PATH | none needed |
| git | yes | 2.45.1.windows.1 | on PATH | none needed |
| Claude Code | yes | 2.1.296 | on PATH (`claude`) | none needed |
| ripwire | **no** | `ripwire --version` exit 127 (command not found) | none on PATH | `serena → lsp → grep` (layers 2 to 4); this survey used Serena |
| Serena | yes | tools loaded and answered (`get_symbols_overview`, `find_symbol`); version not exposed | MCP server `serena`, launched by `plugins/architect/.mcp.json` through `sdd serena-launch` | none needed |
| ast-grep | yes | 0.42.3 | on PATH (`ast-grep`) | none needed; syntactic-shape queries may use `ast-grep run --pattern` |
| Context7 | no (this session) | - | HTTP endpoint `https://mcp.context7.com/mcp`, declared in `plugins/architect/.mcp.json` | library docs from the repository and the web only |
| DeepWiki | no (this session) | - | HTTP endpoint `https://mcp.deepwiki.com/mcp`, declared in `plugins/architect/.mcp.json` | not used by this survey |

## Notes

- Context7 and DeepWiki are "detected" when their tools load. They did not load in the cartographer's
  tool set for this run, although the plugin declares both servers; run `/architect:doctor` to
  confirm whether they connect in the conductor session.
- ripwire is absent, so no ripwire header disclosures apply to any evidence in
  `baseline-survey.md` or `_living/`. Every evidence entry there carries `ripwire absent
  (exit 127)` as its fallback disclosure.
- Project build tools (from `package.json`): TypeScript `^7.0.2`, esbuild `^0.28.2`, `ajv`, `yaml`,
  `@types/node`. They are repository dependencies, not workspace tools, and were not probed.
- LSP: not used (Serena answered every question).
