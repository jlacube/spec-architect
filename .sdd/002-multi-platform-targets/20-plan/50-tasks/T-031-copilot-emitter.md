---
id: C002-T-031
title: "Copilot emitter: agents, prompt files, skills, MCP configuration and install notes"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-021, C002-T-026, C002-T-028]
implements: [C002-REQ-114, C002-REQ-301, C002-REQ-302, C002-REQ-303, C002-REQ-304, C002-REQ-306, C002-REQ-307, C002-REQ-317]
satisfies_ac: [C002-AC-114.1, C002-AC-301.1, C002-AC-302.1, C002-AC-303.1, C002-AC-304.1, C002-AC-306.1, C002-AC-307.1, C002-AC-317.1]
verified_by: [C002-TS-125, C002-TS-126, C002-TS-301, C002-TS-302, C002-TS-303, C002-TS-304, C002-TS-305, C002-TS-306, C002-TS-308, C002-TS-309, C002-TS-310, C002-TS-327, C002-TS-328, C002-TS-329, C002-TC-125, C002-TC-126, C002-TC-301, C002-TC-302, C002-TC-303, C002-TC-304, C002-TC-305, C002-TC-306, C002-TC-308, C002-TC-309, C002-TC-310, C002-TC-327, C002-TC-328, C002-TC-329]
components: [C002-COMP-001, C002-COMP-004]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-031 — Copilot emitter: agents, prompt files, skills, MCP configuration and install notes

## Intent

Write `dist/copilot/` as the contract of C002-IF-005 §3 defines it (C002-REQ-301). The package holds
`*.agent.md` agents, `<name>.prompt.md` prompt files that run in the conductor (C002-REQ-303,
C002-REQ-317), skills in the Agent Skills format, and `.mcp.json` with `sdd-files` and `sdd-shell`
(C002-REQ-307) and Serena read-only on per-user data (C002-REQ-114). It also holds a byte copy of the
CLI under `scripts/sdd.mjs` and `INSTALL.md` (C002-REQ-304). Under server mode no generic edit or
terminal tool is granted (C002-REQ-306), and no plugin-level PreToolUse hook exists (C002-REQ-302).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/generate/emit/copilot.ts` | layout, agent and prompt frontmatter, skills, `.mcp.json`, CLI copy, install notes from `targets/copilot/install.md` |
| add | `plugins/architect/targets/copilot/install.md` | install-notes source: Node.js 20+, VS Code and Copilot Chat tested versions, Claude models, `architect-sdd`, the three VS Code settings, conductor start |
| add | `tests/integration/cap03/package.test.ts` | the listed scenarios on the generated package |

## Preconditions

- C002-T-021 (plugin bundle), C002-T-026 and C002-T-028 done; S-08 not `deferred`.

## Step outline (no production code)

1. Emit from the translated model with the Copilot table.
2. Copy `plugins/architect/scripts/sdd.mjs` byte for byte (C002-ADR-004).
3. Hooks are C002-T-033; this task writes no `hooks/` folder content except an empty placeholder if the
   contract requires one.

## Verification

- `npm test -- cap03` and `npm run generate -- --target copilot --out <tmp>`

## Done when

- [ ] Listed scenarios pass; the package loads as a local plugin in VS Code at its tested version (manual smoke noted)
- [ ] Progress reported: `sdd task set C002-T-031 --status done --commit <sha>`
