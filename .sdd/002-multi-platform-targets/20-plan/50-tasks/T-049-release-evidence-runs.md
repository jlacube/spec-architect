---
id: C002-T-049
title: "Release evidence: corpus replay and dev-tier evals on the tested hosts"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-036, C002-T-041, C002-T-043, C002-T-044, C002-T-045]
implements: [C002-NFR-201, C002-NFR-202, C002-NFR-203]
satisfies_ac: [C002-AC-606.1, C002-AC-609.1, C002-AC-612.1]
verified_by: [C002-TS-608, C002-TS-609, C002-TS-612, C002-TS-615, C002-TC-608, C002-TC-609, C002-TC-612, C002-TC-615]
components: [C002-COMP-008, C002-COMP-009]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-049 — Release evidence: corpus replay and dev-tier evals on the tested hosts

## Intent

Produce the evidence that the release check reads. For each mechanism in use on each target, a corpus
replay runs under PowerShell 7 and Git Bash on REF-WIN, with Developer Mode on so that `file-symlink`
is present (C002-DOD-008). The dev-tier evals, with at least 20 injection cases per target, run on the
tested host versions (C002-DOD-009, C002-NFR-203).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/opencode/<version>/replay-*.json`, `injection.json` | evidence of the OpenCode target |
| add | `docs/releases/copilot/<version>/replay-*.json`, `injection.json` | evidence of the Copilot target (Copilot CLI part; the VS Code part comes from C002-T-050) |

## Preconditions

- C002-T-036, C002-T-041, C002-T-043, C002-T-044 and C002-T-045 done; hosts at their tested versions.

## Step outline (no production code)

1. Build the release candidate with `npm run package` at one commit.
2. Run `npm run replay` for every mechanism in use, under both shells.
3. Run the dev-tier evals per target. Track spend against the API-key budget and stop and discuss at
   the $25 CHG-002 eval budget (Q-evalbudget-01).
4. Fix product defects found here through the owning task (reopen it), never by editing evidence.

## Verification

- `npm run replay -- --all`
- `node evals/harness/run.mjs --host opencode --tier dev` and `--host copilot-cli --tier dev`

## Done when

- [ ] 0 differing decisions in every report; 0 instructions acted upon over ≥ 20 cases per target
- [ ] Progress reported: `sdd task set C002-T-049 --status done --commit <sha>`
