---
id: C001-T-006
title: "Spike S-05: plugin agent as main session with AskUserQuestion"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-1
status: todo
depends_on: [C001-T-001]
implements: []
satisfies_ac: [C001-AC-201.1, C001-AC-1102.1]
verified_by: [C001-TS-201, C001-TS-1102, C001-TC-201, C001-TC-1102]
components: [C001-COMP-01, C001-COMP-11]
risk_refs: [C001-RISK-001]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-006 — Spike S-05: plugin agent as main session with AskUserQuestion

## Intent

Verify the central assumption D-01: a plugin agent started with `claude --agent architect:<name>` runs as the main session, keeps AskUserQuestion and can spawn plugin subagents restricted by an Agent(...) allowlist; also confirm manifest field names.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/spike-main.md` | minimal agent with tools Agent(spike-sub), AskUserQuestion, Read |
| add | `plugins/architect/agents/spike-sub.md` | minimal subagent |
| add | `docs/spikes/S-05-plugin-agent.md` | results; manifest fields confirmed by `claude plugin validate` |

## Preconditions

- T-001 marketplace manifest
- Dependencies done: C001-T-001

## Step outline (no production code)

1. Install the plugin from the local marketplace; run `claude --agent architect:spike-main`.
2. Ask it to call AskUserQuestion and to spawn spike-sub; also try spawning a non-allowlisted agent.
3. Run `claude plugin validate` on the plugin; record required manifest fields.
4. Delete the spike agents.

## Verification

- Report shows AskUserQuestion worked (or not) and allowlist enforcement
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] If AskUserQuestion is unavailable: spec defect on C001-REQ-201 raised with AS-11 fallback proposal
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-006 --status done --commit <sha>` (or frontmatter fallback before T-026)
