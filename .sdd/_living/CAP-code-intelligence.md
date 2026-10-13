---
capability: code-intelligence
inventory_only: true
updated: 2026-10-13
---

# Code intelligence (`C001-CAP-10`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Layered code discovery for brownfield work: the cartographer agent and `code-discovery` skill
(ripwire, then Serena, then LSP, then grep, with ast-grep for shapes), the Serena configuration and
launcher that the plugin ships, and the read-only Serena mode.

## Entry points

- Agent `plugins/architect/agents/sdd-cartographer.md`.
- Skill `plugins/architect/skills/code-discovery/SKILL.md`.
- `sdd serena-config`, `sdd serena-launch` (`serenaConfig`, `serenaLaunchCmd` in `src/cli/commands.ts`);
  MCP server `serena` in `plugins/architect/.mcp.json`.

## Main modules

- `src/workspace/serena-config.ts`, `src/workspace/serena-launch.ts`.
- `plugins/architect/serena/architect-read-only.yml`.
- Bash allowlist for ripwire and ast-grep verbs in `src/hooks/guard-bash.ts` (shared with `C001-CAP-11`).

## Owning tests

- `tests/integration/cap10/` (`TS-1003`, `TS-1006` … `TS-1009`, `serena-config.test.ts`, `serena-tools.ts`).
- Evals: `evals/cap10/` (`carto.mjs`, `callers-full.eval.mjs`, `TS-1001` … `TS-1015`).
- Fixture for discovery tests: `tests/fixtures/fx-brownfield-ts/`.

## Evidence

- **E-1** `src/workspace/serena-config.ts:33` › `writeSerenaConfig()` — writes the Serena configuration.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/workspace/serena-launch.ts:15` › `serenaLaunch()` — launcher invoked by the MCP server definition.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `plugins/architect/.mcp.json:11` › `serena` — server definition running `sdd.mjs serena-launch` with `architect-read-only.yml`.
  - layer: grep (file read) · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
