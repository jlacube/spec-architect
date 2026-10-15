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
verified_by: [C002-TS-620, C002-TS-648]
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

## Preconditions

- REF-WIN with a pinned OpenCode release installed; P-01 names the version to test.
- A Claude model available through OpenCode's provider configuration.

## Step outline (no production code)

1. Record `host_versions.opencode` and turn off auto-update and sharing in the probe configuration.
2. **Closed tool set** (`agent_tools_closed`): give one probe agent a catch-all entry that turns every
   tool off plus named entries that turn the derived tools back on. Check that an adopter MCP tool
   and a plugin tool stay unavailable to it, and that the named entries still work (C002-IF-001 §6.1).
3. **Permission rules**: hand-write `edit` and `bash` rules from the allowlist of C001-IF-07 §3 for
   one agent. Replay a sample of at least 30 path and 30 shell corpus cases by hand. Record provisional
   values for `edit_rules_match_path_corpus` and `bash_rules_match_shell_corpus`, and the glob
   semantics found ("last matching rule wins", splitting of compound commands, `..` and link handling).
   C002-T-043 records the final values from the full replay.
4. **Stub-model feasibility** (C002-ADR-005): check whether the tested OpenCode runs a session against a
   loopback model provider with no other network access, and whether it executes exactly one
   scripted tool call. Record both answers in the body. If either answer is no, record that the
   fallback of Q-replay-01 applies (OpenCode's permission module evaluated from its source at the
   tested tag).
5. **Question tool**: check that the `question` tool can be answered by a script through the SDK
   (`question_answerable_by_script`), and record the header length limit and the result shape for a
   dismissed call (C002-REQ-214, C002-REQ-311).
6. **Post-write feedback** (`post_write_feedback_channel`): check whether a plugin can return text to
   the agent after an `edit` (C002-REQ-215).
7. Record the model identifier of each tier (`opus`, `sonnet`, `haiku`) for C002-REQ-105, Serena's
   context for OpenCode (C002-REQ-114 open item), and `cmd_shims` on REF-WIN.
8. Set `enforcement_mode` by the S-07 rule (provisional until C002-T-043). Raise a spec defect for
   any outcome that contradicts the spec (`10-strategy.md` §4). P-01 signs off the record.

## Verification

- The record's frontmatter has every S-07 key of C002-IF-009 §3, with `agent_tools_closed` present.
- The body answers the two stub-model feasibility questions.
- Run `node plugins/architect/scripts/sdd.mjs lint 002` (no new findings).

## Done when

- [ ] Record committed with P-01's sign-off line; provisional replay values marked as such
- [ ] Defects raised for contradicting outcomes, or "none" stated in the record
- [ ] Progress reported: `sdd task set C002-T-001 --status done --commit <sha>`
