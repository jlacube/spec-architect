---
capability: packaging-safety
inventory_only: true
updated: 2026-10-13
---

# Packaging, safety, environment (`C001-CAP-11`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

How the plugin is built, validated and shipped (bundle, license allowlist, structure checks,
manifests), the hooks that guard Bash and file writes and give workspace feedback, the doctor
command, and the security and injection test corpora.

## Entry points

- Hooks declared in `plugins/architect/hooks/hooks.json`: `guard-path` and `guard-bash`
  (PreToolUse), `hook post-write` (PostToolUse), `hook session-start` (SessionStart).
- Command `plugins/architect/commands/doctor.md`.
- npm scripts `build`, `check`, `package` (`package.json`), implemented by `scripts/build.mjs`,
  `scripts/check.mjs`, `scripts/package.mjs`.

## Main modules

- `src/hooks/` — `guard-bash.ts`, `guard-path.ts`, `post-write.ts`, `session-start.ts`, `input.ts`.
- `scripts/` — `build.mjs` (bundles `plugins/architect/scripts/sdd.mjs`), `check/*.mjs` (structure
  checks: layout, hooks, mcp, readme, port, size, tools, ci, dup, path, rules, evals),
  `licenses.mjs`, `package.mjs`, `test.mjs`.
- Manifests `plugins/architect/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
  `plugins/architect/THIRD_PARTY_NOTICES.md`.
- `src/cli/errors.ts`, `src/cli/output.ts` (error codes and output).
- `bench/guards.mjs`, `bench/session-start.mjs`, `bench/faults.mjs`.

## Owning tests

- `tests/integration/cap11/` (`TS-1101` … `TS-1123`, `hooks-feedback.test.ts`, `structure.ts`).
- `tests/guards/` (`bash-corpus.test.ts`, `path-corpus.test.ts` and their JSON corpora),
  `tests/fixtures/secrets/corpus.json`.
- Evals: `evals/cap11/`, `evals/injection/`.

## Evidence

- **E-1** `src/hooks/guard-bash.ts:208` › `decideBash()` — decides allow or deny for a Bash command.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/hooks/guard-path.ts:45` › `decidePath()` — decides allow or deny for a file write.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/hooks/session-start.ts:20` › `sessionBrief()` — builds the session-start brief.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-4** `plugins/architect/hooks/hooks.json:3` › `hooks` — wires the guards and the feedback hooks.
  - layer: grep (file read) · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-5** `scripts/check.mjs:15` › `STEPS` — the `npm run check` pipeline (typecheck, validate, build, tests, fixtures, structure).
  - layer: grep (file read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
