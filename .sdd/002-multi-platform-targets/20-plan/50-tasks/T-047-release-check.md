---
id: C002-T-047
title: "Release check per target and release records"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: done
depends_on: [C002-T-034, C002-T-040, C002-T-046, C002-T-063]
implements: [C002-REQ-617, C002-REQ-618, C002-REQ-619, C002-REQ-620, C002-REQ-621, C002-REQ-622, C002-REQ-629, C002-REQ-634, C002-NFR-501]
satisfies_ac: [C002-AC-617.1, C002-AC-618.1, C002-AC-619.1, C002-AC-620.1, C002-AC-621.1, C002-AC-622.1, C002-AC-629.1, C002-AC-634.1]
verified_by: [C002-TS-620, C002-TS-621, C002-TS-622, C002-TS-623, C002-TS-624, C002-TS-625, C002-TS-633, C002-TS-637, C002-TS-648, C002-TS-651, C002-TC-620, C002-TC-621, C002-TC-622, C002-TC-623, C002-TC-624, C002-TC-625, C002-TC-633, C002-TC-637, C002-TC-648, C002-TC-651]
components: [C002-COMP-010]
risk_refs: [C002-RISK-031, C002-RISK-032]
estimate: L
report: { commit: a47257d, completed_at: 2026-10-19, notes: "cap06 178/178 (release-check 15). Real evidence dry run: opencode refused ERR-REL-009 (no injection.json); copilot ERR-REL-003 (no checklist record) + ERR-REL-009 — expected until T-049/T-050/T-054. Candidate defects (D-015 batch): --dry-run/--root not in IF-009 §5; <20 injection cases no code; corpus SHA mismatch text; missing/not-applicable checklist steps as ERR-REL-004; mechanisms per mode reading; generator stamps CLI version not source plugin.json version; platforms-limited cases text." }
---

# C002-T-047 — Release check per target and release records

## Intent

Implement C002-IF-009 §5. For one target at a time (C002-REQ-619), the check regenerates the package
at the release commit and compares it (C002-NFR-501). It recomputes every replay expectation, refuses a
report whose replay host lacks a capability that the cited corpora require (C002-REQ-634), and checks
injection, checklist and spike evidence at the tested versions (C002-REQ-617, C002-REQ-618,
C002-REQ-620, C002-REQ-621, C002-REQ-629). For the Copilot VS Code target it refuses, in both
Copilot modes, a checklist record that does not show hooks enabled during the run, because the
Copilot subagent guard hook needs them in both (C002-REQ-629, C002-REQ-327). The hooks-state check of
C002-IF-009 §5 names four problems, in this order: `hooks_state` not recorded; `hooks_sources` not
recorded in full; `hooks_state` contradicting the value derived from `hooks_sources`, in either
direction; `hooks_state` `disabled` (C002-TS-633). It then writes `release.json`, flagged under the
hooks fallback (C002-REQ-622), whose `evidence.checklist.hooks_state` holds the stored value.

**Revised for D-012, D-014 and Q-release-hooks-01.** ERR-REL-010 applies in both Copilot modes, with
the message `copilot: checklist record <path> <problem>; the Copilot release needs evidence taken
with hooks enabled` and the `<problem>` texts of `../../10-spec/50-interfaces/errors.md` §3; under
sdd MCP server enforcement a record without a hooks state is refused (`shows hooks not recorded`), and
one with hooks `enabled`, sources that give `enabled` and no Copilot injection step is allowed, the
injection evidence coming from the Copilot CLI runner (C002-TS-633).
The replay recomputation accepts the `expected_source` values `C001-REQ-1103`, `C002-REQ-401` and
`C002-REQ-517` of the revised C002-IF-009 §2.1, the last two on `sdd-mcp-server` only, and reads
ERR-MCP-003 as `allow` (§2.3); both come from `tests/replay/expect.ts` as C002-T-063 leaves it, and
the record schema is the copy C002-T-063 puts in `docs/releases/`.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/release-check.mjs` | thin entry bundling `scripts/release/main.ts` (C002-ADR-003) |
| add | `scripts/release/*.ts` | regeneration diff, replay recomputation, evidence readers, ERR-REL-001 … ERR-REL-013, record writer validated by `docs/releases/release-record.schema.json` |
| add | `tests/integration/cap06/release-check.test.ts` | the listed scenarios on fixture evidence folders; plus a test that a target zip whose content differs from the regenerated package is refused |

## Preconditions

- C002-T-034 (generation), C002-T-040 (report format) and C002-T-046 (record template) done.
- C002-T-063 done (revised expectation rules in `tests/replay/expect.ts`, schema copy in
  `docs/releases/release-record.schema.json`).

## Step outline (no production code)

1. Import the generator modules and the replay expectation rules; never copy them.
2. Read spike records by their frontmatter only (C002-IF-009 §3, revised for defect D-003). S-08
   mode rule: `sdd-mcp-server` when `subagent_tool_list_confined` is `true`; else `copilot-hooks`
   when `guard_hooks_block_subagent_calls` is `true`; else `deferred` and ERR-REL-005 (an absent
   `guard_hooks_block_subagent_calls` counts as not blocking, C002-TS-623).
   `agent_hooks_block_subagent_calls` decides nothing. The tested VS Code version is the record's
   `vscode-insiders` value when present; the Copilot CLI runner's evidence is compared with the
   record's `copilot-cli` value (ERR-REL-006). The signed-off record (`docs/spikes/S-08-copilot-vscode.md`)
   is one of the fixture rows of C002-TC-623 and gives "allowed".
3. Read `hooks_state` and `hooks_sources` of the checklist record whatever the mode
   (`sdd-mcp-server` or `copilot-hooks`), as the frontmatter parser returns them (C002-IF-009 §4).
   Apply the hooks-state check of C002-IF-009 §5 and print one ERR-REL-010 line for the first
   problem that applies, in this order: (1) `hooks_state` not recorded; (2) `hooks_sources` not
   recorded in full, naming the missing keys; (3) `hooks_state` contradicting the value derived from
   `hooks_sources`, either way; (4) `hooks_state` `disabled`. The `<problem>` texts are those of
   `errors.md` §3; C002-TS-633 gives one row per case, both modes. Write the stored `hooks_state`
   (`enabled` or `disabled`, else `null`, never the derived value) to the release record's
   `evidence.checklist.hooks_state`. Read the result of the delegated-edit step (C002-TC-358) like
   any other checklist step (C002-REQ-618).
4. Recompute each replayed case's expected decision and `expected_source` with the rules imported
   from `tests/replay/expect.ts`; a report whose case records another value, or `C002-REQ-401` or
   `C002-REQ-517` on a mechanism other than `sdd-mcp-server`, is refused with ERR-REL-012
   `records expectations other than C002-IF-009 §2.1`. Validate the written `release.json` with the
   schema copy, which requires `hooks_state: enabled` in a released Copilot record.
5. Refuse with every applicable ERR-REL code listed, not only the first.
6. Compare the regenerated package with the target zip that P-01 will release
   (`dist/architect-<target>-<version>.zip`, C002-T-034; Q-release-01), not only with the
   `dist/<target>/` folder: a missing, extra or different file in the zip is a regeneration
   difference under the existing ERR-REL code for it (C002-NFR-501).

## Verification

- `npm test -- cap06`
- `node scripts/release-check.mjs --target opencode --dry-run` on the fixture evidence

## Done when

- [ ] Listed scenarios pass for both targets, independently; C002-TC-633 passes every row of both Copilot modes with the revised ERR-REL-010 text
- [ ] The regenerated reports under `docs/releases/*/0.0.1/` (C002-T-063) pass the replay recomputation with their `expected_source` values
- [ ] Progress reported: `sdd task set C002-T-047 --status done --commit <sha>`
