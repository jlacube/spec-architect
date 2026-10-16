---
id: C002-T-001
title: "Spike S-07: OpenCode at its tested version"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-01
status: todo
depends_on: []
implements: []
satisfies_ac: [C002-AC-105.1, C002-AC-114.1, C002-AC-215.1, C002-AC-617.1]
verified_by: [C002-TS-620, C002-TS-648, C002-TC-620, C002-TC-648]
components: [C002-COMP-002, C002-COMP-003]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-001 — Spike S-07: OpenCode at its tested version

## Intent

Settle the OpenCode facts that the spec could only assume (C002-AS-01, C002-AS-02), so that the
OpenCode mapping table, the replay driver and the release check rest on recorded evidence. The
spike writes the spike record of C002-IF-009 §3, which decides the OpenCode enforcement mode.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/spikes/S-07-opencode.md` | spike record: frontmatter of C002-IF-009 §3 (S-07 keys); body with method, versions, one result row per item below, verdict |
| add | `docs/spikes/s07/` | throwaway probe package (hand-written agents, permission rules, a sample of corpus cases); never shipped |
| add | `evals/results/spend-chg002.json` | running CHG-002 eval spend ledger (test plan §4.1): every paid session on the prepaid key adds its `cost_usd`; each entry names its pool, and every paid session is checked before it starts against its pool's limit, 30 USD general pool or 10 USD C002-M-07 reserve, of the 40 USD CHG-002 eval budget (Q-evalbudget-03); the S-07 probes are general-pool sessions; created by the first paid run of CHG-002 (this task or C002-T-010, whichever runs first) |

## Preconditions

- REF-WIN with a pinned OpenCode release installed; P-01 names the version to test.
- A Claude model available through OpenCode's provider configuration, billed to the prepaid API key.
- **P-01 precondition step (step 1) done before the first paid probe session:** the prepaid key holds
  at least 40 USD minus the ledger total (Q-evalbudget-03).

## Step outline (no production code)

1. **P-01 step — top-up.** P-01 tops up the prepaid API key by at least about 35.23 USD (the 40 USD
   CHG-002 eval budget minus the about 4.77 USD the key held on 2026-10-16), so that the key holds at
   least 40 USD minus the ledger total, and records the top-up date and amount in the ledger. No paid
   session of CHG-002 starts before this step (C002-T-010 checks the same precondition).
2. Record `host_versions.opencode` and turn off auto-update and sharing in the probe configuration.
   **Probe spend limit:** the probe sessions run before the harness caps of C002-T-044 exist, so each
   one is started with the OpenCode turn limit set to 30 where the tested version offers one, is
   stopped by hand at 30 turns otherwise, and its spend is read from the provider's usage view into
   the ledger right after it ends. At most about 10 probe sessions; before each one, apply the ledger
   check of test plan §4.1 and stop for P-01 when the next session could pass the C002-M-01 upper
   bound of test plan §4.2.
3. **Closed tool set** (`agent_tools_closed`): give one probe agent a catch-all entry that turns every
   tool off plus named entries that turn the derived tools back on. Check that an adopter MCP tool
   and a plugin tool stay unavailable to it, and that the named entries still work (C002-IF-001 §6.1).
4. **Permission rules**: hand-write `edit` and `bash` rules from the allowlist of C001-IF-07 §3 for
   one agent. Replay a sample of at least 30 path and 30 shell corpus cases by hand. Record provisional
   values for `edit_rules_match_path_corpus` and `bash_rules_match_shell_corpus`, and the glob
   semantics found ("last matching rule wins", splitting of compound commands, `..` and link handling).
   C002-T-043 records the final values from the full replay.
5. **Stub-model feasibility** (C002-ADR-005): check whether the tested OpenCode runs a session against a
   loopback model provider with no other network access, and whether it executes exactly one
   scripted tool call. Record both answers in the body. If either answer is no, record that the
   fallback of Q-replay-01 applies (OpenCode's permission module evaluated from its source at the
   tested tag) and the branch of `10-strategy.md` §4 for the session scenarios. Record separately
   whether the SDK can start, drive and end a session against the real provider (the session driver
   that C002-T-044 needs in either branch).
6. **Question tool**: check that the `question` tool can be answered by a script through the SDK
   (`question_answerable_by_script`), and record the header length limit and the result shape for a
   dismissed call (C002-REQ-214, C002-REQ-311). If it cannot, raise a spec defect against
   C002-REQ-610 that lists the scripted-answer cases of `10-strategy.md` §4.
7. **Post-write feedback** (`post_write_feedback_channel`): check whether a plugin can return text to
   the agent after an `edit` (C002-REQ-215).
8. Record the model identifier of each tier (`opus`, `sonnet`, `haiku`) for C002-REQ-105, Serena's
   context for OpenCode (C002-REQ-114 open item), and `cmd_shims` on REF-WIN.
9. Set `enforcement_mode` by the S-07 rule (provisional until C002-T-043). Raise a spec defect for
   any outcome that contradicts the spec (`10-strategy.md` §4). P-01 signs off the record.

## Verification

- The record's frontmatter has every S-07 key of C002-IF-009 §3, with `agent_tools_closed` present.
- The body answers the two stub-model feasibility questions and the real-provider session question.
- The ledger holds the top-up of step 1 and the spend of every probe session.
- Run `node plugins/architect/scripts/sdd.mjs lint 002` (no new findings).

## Done when

- [ ] P-01's top-up (step 1) recorded in the ledger before the first probe session
- [ ] Record committed with P-01's sign-off line; provisional replay values marked as such
- [ ] Defects raised for contradicting outcomes, or "none" stated in the record
- [ ] C002-TC-620 and C002-TC-648 (release-check integration cases that read this record) listed in the task report as carried to C002-T-047
- [ ] Progress reported: `sdd task set C002-T-001 --status done --commit <sha>`
