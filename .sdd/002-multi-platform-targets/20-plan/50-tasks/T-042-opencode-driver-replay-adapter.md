---
id: C002-T-042
title: "OpenCode session driver and the opencode-permissions replay adapter"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-001, C002-T-030, C002-T-040]
implements: [C002-REQ-606, C002-REQ-626, C002-REQ-632, C002-NFR-201, C002-NFR-202]
satisfies_ac: [C002-AC-606.1, C002-AC-626.1, C002-AC-632.1]
verified_by: [C002-TS-630, C002-TS-646, C002-TS-647, C002-TS-652, C002-TC-630, C002-TC-646, C002-TC-647, C002-TC-652]
components: [C002-COMP-008, C002-COMP-009]
risk_refs: []
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-042 — OpenCode session driver and the opencode-permissions replay adapter

## Intent

Implement C002-ADR-005. The shared session driver starts the tested `opencode` binary through its
server and JS SDK on the replay fixture. A loopback stub model answers each case with exactly the tool
call of C002-IF-009 §2.2, and the adapter reads the decision from the tool part's final state (§2.3).
Identity cases run on OpenCode only, with the fixture's adopter agent (C002-REQ-626). Unknown
`architect:sdd-*` callers expect `allow` (C002-REQ-632). The eval runner of C002-T-044 reuses the
driver.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `package.json` | `@opencode-ai/sdk` as a devDependency pinned to the version that matches the tested OpenCode of the S-07 record; licence checked against the allowlist |
| add | `evals/harness/opencode/driver.mjs` | session start, event stream, permission replies, auto-update and sharing off |
| add | `tests/replay/adapters/opencode-permissions.ts`, `tests/replay/stub-model.mjs` | loopback provider; one scripted call per case |
| add | `tests/replay/fixtures/opencode/` | fixture with the generated package and the adopter agent |

## Preconditions

- C002-T-001 (feasibility recorded), C002-T-030 (generated rules) and C002-T-040 done.

## Step outline (no production code)

1. If S-07 recorded the stub-model driver as feasible, build it as above.
2. If S-07 recorded it as infeasible, stop. Raise the new ADR that supersedes C002-ADR-005 with P-01's
   answer to Q-replay-01, then build the fallback adapter: evaluate OpenCode's permission module from
   its source at the tested tag.
3. Record `host_versions.opencode` in every report; refuse to run on another version.

## Verification

- `npm run replay -- --mechanism opencode-permissions` (needs the tested `opencode` on PATH)
- `npm test -- unit/replay`

## Done when

- [ ] Reports written for both shells; identity and unknown-caller cases replayed as specified
- [ ] Progress reported: `sdd task set C002-T-042 --status done --commit <sha>`
