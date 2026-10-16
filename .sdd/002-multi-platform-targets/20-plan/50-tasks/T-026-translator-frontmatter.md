---
id: C002-T-026
title: "Translator: agent frontmatter (models, memory, delegation, tool grants, server profiles)"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-025, C002-T-040]
implements: [C002-REQ-105, C002-REQ-106, C002-REQ-107, C002-REQ-108, C002-REQ-117]
satisfies_ac: [C002-AC-105.1, C002-AC-106.1, C002-AC-107.1, C002-AC-108.1, C002-AC-117.1]
verified_by: [C002-TS-109, C002-TS-110, C002-TS-111, C002-TS-112, C002-TS-113, C002-TS-114, C002-TS-129, C002-TS-130, C002-TS-133, C002-TC-109, C002-TC-110, C002-TC-111, C002-TC-112, C002-TC-113, C002-TC-114, C002-TC-129, C002-TC-130, C002-TC-133]
components: [C002-COMP-001]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-026 — Translator: agent frontmatter

## Intent

Translate each source agent's frontmatter through the target's mapping table. The model is the host
model of the same tier (C002-REQ-105), `memory` is dropped (C002-REQ-106), only the conductor may
start the nine specialists (C002-REQ-107), and tools are least-privilege (C002-REQ-108). Under sdd MCP
server enforcement each agent gets exactly the server profiles that replace its Write, Edit or Bash
(C002-REQ-117).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/generate/translate/frontmatter.ts` | tier → model id; memory omitted; delegation list; tool derivation per mode; `sdd-files` and `sdd-shell` grants; `effort` and `color` as the table says |
| add | `tests/integration/cap01/frontmatter.test.ts` | the listed integration scenarios on fixture plugins and on the real source plugin |
| add | `evals/targets/generator/TS-113.eval.mjs` | case file of C002-TC-113 (fx-oc with the planted `notes.md`) through the existing case API; run by C002-T-056 |
| add | `tests/replay/scenarios/opencode-host.test.ts` | the file of the OpenCode-host replay scenarios, with the expectation of C002-TC-133 (adopter MCP tool `fx-fs` not available to `sdd-spec-writer`); C002-T-029 and C002-T-030 add their scenarios to it; it runs under `npm run replay -- opencode-host` from C002-T-042 on |

## Preconditions

- C002-T-025 done.
- C002-T-040 done: `scripts/test.mjs` already leaves out `tests/replay/`, so the new
  `opencode-host.test.ts` is not bundled into `npm test` (and `npm run check` stays green), and the
  adapter interface `tests/replay/adapter.ts` exists (critic CR-17).

## Step outline (no production code)

1. Map each field by its table entry. A field without an entry is a diagnostic, not a silent drop.
2. Derive tools: no question tool for an agent without AskUserQuestion; no `sdd-shell` for an agent
   without Bash (researcher, options-analyst; C002-IF-005 §4).
3. Emit the host's form of the delegation right (OpenCode `permission.task`, Copilot `agents` list).
4. Write `opencode-host.test.ts` against the adapter interface of C002-T-040 only, selecting the
   OpenCode adapter by its mechanism name at run time; the adapter of C002-T-042 does not exist yet,
   so the file must not import it (`npm run typecheck` covers `tests/`). Check that `npm test` does
   not list the file.

## Verification

- `npm test -- cap01`
- `npm run check` (green: `tests/replay/` is outside `npm test`)

## Done when

- [ ] The listed integration scenarios pass for both targets
- [ ] Carried cases listed in the task report: C002-TC-113 (eval) to C002-T-056; C002-TC-133 (replay) to C002-T-042, or to C002-T-056 under the infeasible-driver branch of `10-strategy.md` §4; C002-TC-640 (target structure check TGT-TOOLS-001) to C002-T-035
- [ ] Progress reported: `sdd task set C002-T-026 --status done --commit <sha>`
