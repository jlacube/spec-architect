---
id: C002-T-043
title: "S-07 record: final replay outcomes and the OpenCode enforcement mode"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-042]
implements: []
satisfies_ac: [C002-AC-206.1, C002-AC-207.1, C002-AC-617.1]
verified_by: [C002-TS-207, C002-TS-209, C002-TS-620, C002-TC-207, C002-TC-209, C002-TC-620]
components: [C002-COMP-002, C002-COMP-008]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-043 — S-07 record: final replay outcomes and the OpenCode enforcement mode

## Intent

Replace the provisional `edit_rules_match_path_corpus` and `bash_rules_match_shell_corpus` values of
the S-07 record with the result of the full replay of the generated native rules (C002-IF-009 §3).
Then set the OpenCode mode. Any difference, or any glob gap listed by C002-T-030, selects
`sdd-mcp-server` (architecture §6.2).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `docs/spikes/S-07-opencode.md` | final outcomes, `enforcement_mode`, link to the replay reports |
| modify | `plugins/architect/targets/opencode.json` | mode copied from the record |

## Preconditions

- C002-T-042 done.

## Step outline (no production code)

1. Run the replay of the native rules under both shells.
2. Set the two outcomes and the mode. P-01 signs the update.
3. If `agent_tools_closed` is `false`, raise the defect and the spec revision (`10-strategy.md` §4).
4. Regenerate and re-run `npm run check`. The README mode test of C002-T-039 must follow.

## Verification

- `npm run replay -- --mechanism opencode-permissions`
- `npm run check`

## Done when

- [ ] Record final and signed; table and README agree with it
- [ ] Progress reported: `sdd task set C002-T-043 --status done --commit <sha>`
