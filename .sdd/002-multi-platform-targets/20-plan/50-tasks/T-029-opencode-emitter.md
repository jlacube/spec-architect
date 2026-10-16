---
id: C002-T-029
title: "OpenCode emitter: layout, agents, commands, MCP servers and install notes"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-026, C002-T-028]
implements: [C002-REQ-114, C002-REQ-201, C002-REQ-202, C002-REQ-203, C002-REQ-204, C002-REQ-216]
satisfies_ac: [C002-AC-114.1, C002-AC-201.1, C002-AC-202.1, C002-AC-203.1, C002-AC-204.1, C002-AC-216.1]
verified_by: [C002-TS-124, C002-TS-201, C002-TS-202, C002-TS-203, C002-TS-204, C002-TS-205, C002-TS-225, C002-TS-226, C002-TS-227, C002-TC-124, C002-TC-201, C002-TC-202, C002-TC-203, C002-TC-204, C002-TC-205, C002-TC-225, C002-TC-226, C002-TC-227]
components: [C002-COMP-001, C002-COMP-003]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-029 — OpenCode emitter: layout, agents, commands, MCP servers and install notes

## Intent

Write `dist/opencode/` as the contract of C002-IF-005 §2 defines it. The ten agents go under
`.opencode/agents/`, the conductor as primary and nine subagents (C002-REQ-201, C002-REQ-202).
Commands are named `architect-<name>` and bound to the conductor (C002-REQ-203, C002-REQ-216). Skills
are written, and `opencode.json` declares the MCP servers, with Serena launched read-only on per-user
data (C002-REQ-114). Each agent's tool set is closed by the catch-all entry (C002-IF-001 §6.1).
`INSTALL.md` holds the install notes (C002-REQ-204). The permission rules are C002-T-030.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/generate/emit/opencode.ts` | layout, frontmatter shape, command naming, `opencode.json` servers, catch-all tool entry, install notes from `targets/opencode/install.md` |
| add | `plugins/architect/targets/opencode/install.md` | install-notes source: Node.js 20+, OpenCode tested version, Claude models, `architect-sdd` install, placement, conductor start |
| add | `tests/integration/cap02/package.test.ts` | the listed scenarios on the generated package |

## Preconditions

- C002-T-026 and C002-T-028 done.

## Step outline (no production code)

1. Emit each file from the translated model. Take every OpenCode field from the table.
2. Write the Serena server entry as `sdd serena-launch --user-data --read-only -- …`, with the context
   recorded by S-07.
3. Write the tested version into `INSTALL.md` from the table, not by hand.

## Verification

- `npm test -- cap02/package` (C002-TC-201 … C002-TC-205, C002-TC-225, C002-TC-227) and
  `npm run generate -- --target opencode --out <tmp>`
- C002-TC-226 needs an OpenCode host: write its expectation in
  `tests/replay/scenarios/opencode-host.test.ts`; it runs under `npm run replay -- opencode-host` once
  C002-T-042 exists, not under `npm test`. Until then, list it in the task report as carried to C002-T-042.

## Done when

- [ ] Listed structure scenarios pass, and C002-TC-226 is written and listed as carried to C002-T-042; the package loads in OpenCode at its tested version (manual smoke noted in the report)
- [ ] Progress reported: `sdd task set C002-T-029 --status done --commit <sha>`
