---
id: C002-T-030
title: "OpenCode permission rules for both modes and the quick-lint plugin"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: todo
depends_on: [C002-T-009, C002-T-010, C002-T-029]
implements: [C002-REQ-206, C002-REQ-207, C002-REQ-208, C002-REQ-209, C002-REQ-210, C002-REQ-215, C002-REQ-217]
satisfies_ac: [C002-AC-206.1, C002-AC-207.1, C002-AC-208.1, C002-AC-209.1, C002-AC-210.1, C002-AC-215.1, C002-AC-217.1]
verified_by: [C002-TS-207, C002-TS-208, C002-TS-209, C002-TS-210, C002-TS-211, C002-TS-212, C002-TS-213, C002-TS-214, C002-TS-222, C002-TS-223, C002-TS-224, C002-TS-228, C002-TS-229, C002-TS-230, C002-TC-207, C002-TC-208, C002-TC-209, C002-TC-210, C002-TC-211, C002-TC-212, C002-TC-213, C002-TC-214, C002-TC-222, C002-TC-223, C002-TC-224, C002-TC-228, C002-TC-229, C002-TC-230]
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
C002-REQ-210). In both modes, give the conductor `question: allow` and each of the nine specialists
`question: deny` (C002-REQ-217; C002-IF-001 §6.3; mapping-tables §5 last rule). S-07 on OpenCode
1.18.31 found the `question` tool off by default in SDK and `opencode serve` sessions (fact F-6).
Never set rules for other agents (C002-REQ-208). Emit the quick-lint plugin only when S-07 found a
feedback channel (C002-REQ-215; the record gives `post_write_feedback_channel: true`).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/generate/emit/opencode-permissions.ts` | rule generation from the allowlist data of `guard-bash.ts` and C002-IF-001 §6.3; both modes; the per-agent `question` rule (`allow` for each agent whose source `tools` holds AskUserQuestion, `deny` for every other Architect agent) |
| add | `scripts/generate/emit/opencode-quicklint.ts` | the optional plugin running `sdd lint --quick` on the written `.sdd/` file |
| add | `tests/integration/cap02/permissions.test.ts` | the listed `@mode-*` scenarios; generated rules for both modes from fixture tables; C002-TC-228 in both modes and C002-TC-229 on fx-dist-bad (its TGT-PERM-001 finding comes from the check of C002-T-035) |
| modify | `tests/replay/scenarios/opencode-host.test.ts` | adds the expectations of C002-TC-207, 209, 211, 213, 222 and 223 (file added by C002-T-026) |

## Preconditions

- C002-T-009 and C002-T-010 (allowlist final) and C002-T-029 done.

## Step outline (no production code)

1. Read the allowlist forms from the guard module's exported data; do not copy it (C002-CON-06).
2. Order the rules so that "last matching rule wins" gives the allowlist decision.
3. Record each guard rule that a glob cannot follow in a list. C002-T-043 uses it to select the mode.
4. Write the `question` rule into the `permission` of each Architect agent entry, in both modes. Take
   the value from the source agent's `tools`, never from a list of agent names. Leave the table's
   `permissions.<mode>.question` at `deny` or absent (mapping-tables §5).

## Verification

- `npm test -- cap02/permissions` (C002-TC-208, C002-TC-210, C002-TC-212, C002-TC-214, C002-TC-224,
  C002-TC-228; C002-TC-229 once the TGT-PERM-001 check of C002-T-035 exists, carried to it until then)
- C002-TC-207, C002-TC-209, C002-TC-211, C002-TC-213, C002-TC-222 and C002-TC-223 need an OpenCode
  host: write their expectations in `tests/replay/scenarios/opencode-host.test.ts`; they run under
  `npm run replay -- opencode-host` once C002-T-042 exists, not under `npm test`. Until then, list them in
  the task report as carried to C002-T-042 (C002-TC-207 and C002-TC-209 also to C002-T-043). The
  infeasible-driver branch of `10-strategy.md` §4 is not taken: S-07 recorded the stub-model driver
  as feasible.
- C002-TC-230 (eval, the conductor's `question` call in an `opencode serve` session) is carried to
  C002-T-044, which writes its case file, and to C002-T-056, which runs it.

## Done when

- [ ] Listed structure scenarios pass in both modes, and the replay scenarios are written and listed as carried; the list of glob gaps is written to the generator diagnostics
- [ ] The conductor holds `question: allow` and each specialist `question: deny` in both modes (C002-TC-228); C002-TC-229 and C002-TC-230 listed as carried
- [ ] Progress reported: `sdd task set C002-T-030 --status done --commit <sha>`
