---
id: C002-T-008
title: "Bash guard: bare sdd and node --version (closes CHG-001 defect D-011)"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: [C002-T-007]
implements: [C002-REQ-503, C002-REQ-607]
satisfies_ac: [C002-AC-503.1, C002-AC-607.1]
verified_by: [C002-TS-504, C002-TS-505, C002-TS-610, C002-TC-504, C002-TC-505, C002-TC-610]
components: [C002-COMP-012]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-008 — Bash guard: bare sdd and node --version (closes CHG-001 defect D-011)

## Intent

Accept a bare `sdd …` command, with `sdd` as the whole first word, and the exact probe
`node --version` (C002-REQ-503, C002-IF-008 §1). This fixes defect D-011 of CHG-001
(C002-DOD-023). Every other decision of the bash guard stays as it is.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `tests/guards/bash-corpus.json` | new cases first: bare `sdd` allow; `npx sdd`, `sddx` deny; `node --version` allow; `node --version --eval=x` stays deny |
| modify | `src/hooks/guard-bash.ts` | bare-`sdd` branch beside `sddCli`; `["node", "--version"]` in `VERSION_PROBES`; `ALLOWED` text and deny summary as C002-IF-008 §1 words them |
| modify | `bench/guards.mjs` | one recorded input with a bare `sdd` command |

## Preconditions

- C002-T-007 done (corpus format).

## Step outline (no production code)

1. Add the corpus cases and see them fail.
2. Add the bare-`sdd` form. The word must be exactly `sdd`, so BG-044 stays deny.
3. Add the exact two-word probe. The word count keeps BG-166 deny.
4. Update the `Allowed:` summary. It must remain one line that ends with a period, so the
   `TS-1107:31` shape still matches.
5. After the commit, close D-011: `sdd defect close` with the CHG-001 defect ID and the commit.

## Verification

- `npm test -- tests/guards` and `npm test -- cap11`
- `npm run bench` (guard p95 ≤ 300 ms)

## Done when

- [ ] No existing corpus case changes its expectation
- [ ] D-011 closed in CHG-001 (`sdd defect` output shows it closed, C002-DOD-023)
- [ ] Progress reported: `sdd task set C002-T-008 --status done --commit <sha>`
