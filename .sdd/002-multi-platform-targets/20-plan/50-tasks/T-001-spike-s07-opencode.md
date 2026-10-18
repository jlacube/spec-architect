---
id: C002-T-001
title: "Spike S-07: OpenCode at its tested version"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-01
status: done
depends_on: []
implements: []
satisfies_ac: [C002-AC-105.1, C002-AC-114.1, C002-AC-215.1, C002-AC-617.1]
verified_by: [C002-TS-620, C002-TS-648, C002-TC-620, C002-TC-648]
components: [C002-COMP-002, C002-COMP-003]
risk_refs: []
estimate: L
report: { commit: 96c6349, completed_at: 2026-10-18, notes: "S-07 signed off (P-01) and re-tested on OpenCode 1.18.31 (confirmed): enforcement_mode sdd-mcp-server provisional until T-043; agent_tools_closed true; stub-model driver feasible (Q-replay-01 fallback not needed); model ids openrouter/anthropic/claude-{opus,sonnet,haiku}-5.5; spend 0.0722 USD on OpenRouter (older key; P-01 to run opencode auth login with the new 50 USD key); facts in D-009 for one spec revision; TC-620/648 carried to T-047" }
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
| add | `evals/results/spend-chg002.json` | running CHG-002 eval spend ledger (test plan §4.1): every paid session adds its `provider`, `auth` and `cost_usd`; each OpenRouter entry names its pool, and every OpenRouter session is checked before it starts against its pool's limit, 30 USD general pool or 10 USD C002-M-07 reserve, of the 40 USD of OpenRouter spend for CHG-002 (Q-evalbudget-03, Q-opencode-01); the S-07 probes are general-pool sessions with `provider` `openrouter`; created by the first paid run of CHG-002 (this task or C002-T-010, whichever runs first) |

## Preconditions

- REF-WIN with a pinned OpenCode release installed; P-01 names the version to test.
- The Claude models of the C002-REQ-105 tiers available to OpenCode through OpenRouter (model ids
  `openrouter/anthropic/claude-…`), billed to P-01's OpenRouter account (Q-opencode-01,
  `questions-log.md` round 6).
- **P-01 precondition step (step 1) done before the first paid probe session.**

## Step outline (no production code)

1. **P-01 step — OpenRouter.** P-01 creates a dedicated OpenRouter key for CHG-002 with a 40 USD credit limit (Q-openrouter-01, hard backstop to the ledger's stop rule); P-01's OpenRouter account has credit, and OpenCode on REF-WIN is
   configured to use it: the OpenRouter provider with P-01's key in OpenCode's own credential store,
   outside the repository and the probe package, and the Claude models of the C002-REQ-105 tiers
   selectable. P-01 confirms both in the task report. No paid OpenCode session of CHG-002 starts
   before this step; the 40 USD stop of test plan §4.1 is checked from the ledger before every one.
2. Record `host_versions.opencode` and turn off auto-update and sharing in the probe configuration.
   **Probe spend limit:** the probe sessions run before the harness caps of C002-T-044 exist, so each
   one is started with the OpenCode turn limit set to 30 where the tested version offers one, is
   stopped by hand at 30 turns otherwise, and its spend is read from OpenRouter's usage view into
   the ledger right after it ends (`provider` `openrouter`, pool `general`); where OpenCode also
   reports a session cost, record both, so that C002-T-044 knows whether the host's figure matches
   OpenRouter's. At most about 10 probe sessions; before each one, apply the ledger check of test
   plan §4.1 and stop for P-01 when the next session could pass the C002-M-01 upper bound of test
   plan §4.2. Report the probes' mean session cost for the checkpoint of test plan §4.1.
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
   scripted tool call, and that this replay still needs no real provider: no OpenRouter provider entry,
   no OpenRouter key and no network beyond the loopback stub. Record the answers in the body. If any
   answer is no, record that the
   fallback of Q-replay-01 applies (OpenCode's permission module evaluated from its source at the
   tested tag) and the branch of `10-strategy.md` §4 for the session scenarios. Record separately
   whether the SDK can start, drive and end a session against the real provider, OpenRouter (the
   session driver that C002-T-044 needs in either branch).
6. **Question tool**: check that the `question` tool can be answered by a script through the SDK
   (`question_answerable_by_script`), and record the header length limit and the result shape for a
   dismissed call (C002-REQ-214, C002-REQ-311). If it cannot, raise a spec defect against
   C002-REQ-610 that lists the scripted-answer cases of `10-strategy.md` §4.
7. **Post-write feedback** (`post_write_feedback_channel`): check whether a plugin can return text to
   the agent after an `edit` (C002-REQ-215).
8. Record the model identifier of each tier (`opus`, `sonnet`, `haiku`) for C002-REQ-105: the exact
   OpenRouter id OpenCode accepts (`openrouter/anthropic/claude-…`) per tier, and Serena's
   context for OpenCode (C002-REQ-114 open item), and `cmd_shims` on REF-WIN.
9. Set `enforcement_mode` by the S-07 rule (provisional until C002-T-043). Raise a spec defect for
   any outcome that contradicts the spec (`10-strategy.md` §4). P-01 signs off the record.

## Verification

- The record's frontmatter has every S-07 key of C002-IF-009 §3, with `agent_tools_closed` present.
- The body answers the stub-model feasibility questions (loopback session, one scripted call, no real
  provider needed) and the OpenRouter session question, and names the OpenRouter model id per tier.
- The ledger holds the spend of every probe session with `provider` `openrouter`.
- Run `node plugins/architect/scripts/sdd.mjs lint 002` (no new findings).

## Done when

- [ ] P-01's OpenRouter confirmation (step 1) in the task report before the first probe session
- [ ] Record committed with P-01's sign-off line; provisional replay values marked as such
- [ ] Defects raised for contradicting outcomes, or "none" stated in the record
- [ ] C002-TC-620 and C002-TC-648 (release-check integration cases that read this record) listed in the task report as carried to C002-T-047
- [ ] Progress reported: `sdd task set C002-T-001 --status done --commit <sha>`
