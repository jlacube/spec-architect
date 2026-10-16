---
id: C002-T-030
title: "OpenCode permission rules for both modes and the quick-lint plugin"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-009, C002-T-010, C002-T-029]
implements: [C002-REQ-206, C002-REQ-207, C002-REQ-208, C002-REQ-209, C002-REQ-210, C002-REQ-215]
satisfies_ac: [C002-AC-206.1, C002-AC-207.1, C002-AC-208.1, C002-AC-209.1, C002-AC-210.1, C002-AC-215.1]
verified_by: [C002-TS-207, C002-TS-208, C002-TS-209, C002-TS-210, C002-TS-211, C002-TS-212, C002-TS-213, C002-TS-214, C002-TS-222, C002-TS-223, C002-TS-224, C002-TC-207, C002-TC-208, C002-TC-209, C002-TC-210, C002-TC-211, C002-TC-212, C002-TC-213, C002-TC-214, C002-TC-222, C002-TC-223, C002-TC-224]
components: [C002-COMP-001, C002-COMP-003]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-030 — OpenCode permission rules for both modes and the quick-lint plugin

## Intent

Under native permission enforcement, give each Architect agent `edit` rules that allow only `.sdd/`
(C002-REQ-206) and `bash` rules generated from the one allowlist (C002-REQ-207). The bash rules are
no wider than the forms the generated agents send (C002-IF-001 §6.3). Under sdd MCP server
enforcement, deny `edit` and `bash` and declare `sdd-files` and `sdd-shell` (C002-REQ-209,
C002-REQ-210). Never set rules for other agents (C002-REQ-208). Emit the quick-lint plugin only when
S-07 found a feedback channel (C002-REQ-215).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/generate/emit/opencode-permissions.ts` | rule generation from the allowlist data of `guard-bash.ts` and C002-IF-001 §6.3; both modes |
| add | `scripts/generate/emit/opencode-quicklint.ts` | the optional plugin running `sdd lint --quick` on the written `.sdd/` file |
| add | `tests/integration/cap02/permissions.test.ts` | the listed `@mode-*` scenarios; generated rules for both modes from fixture tables |
| modify | `tests/replay/scenarios/opencode-host.test.ts` | adds the expectations of C002-TC-207, 209, 211, 213, 222 and 223 (file added by C002-T-026) |

## Preconditions

- C002-T-009 and C002-T-010 (allowlist final) and C002-T-029 done.

## Step outline (no production code)

1. Read the allowlist forms from the guard module's exported data; do not copy it (C002-CON-06).
2. Order the rules so that "last matching rule wins" gives the allowlist decision.
3. Record each guard rule that a glob cannot follow in a list. C002-T-043 uses it to select the mode.

## Verification

- `npm test -- cap02/permissions` (C002-TC-208, C002-TC-210, C002-TC-212, C002-TC-214, C002-TC-224)
- C002-TC-207, C002-TC-209, C002-TC-211, C002-TC-213, C002-TC-222 and C002-TC-223 need an OpenCode
  host: write their expectations in `tests/replay/scenarios/opencode-host.test.ts`; they run under
  `npm run replay -- opencode-host` once C002-T-042 exists, not under `npm test`. Until then, list them in
  the task report as carried to C002-T-042 (C002-TC-207 and C002-TC-209 also to C002-T-043). Under
  the infeasible-driver branch of `10-strategy.md` §4, C002-TC-211, 222 and 223 are carried to
  C002-T-056 instead.

## Done when

- [ ] Listed structure scenarios pass in both modes, and the replay scenarios are written and listed as carried; the list of glob gaps is written to the generator diagnostics
- [ ] Progress reported: `sdd task set C002-T-030 --status done --commit <sha>`
