---
id: C002-T-007
title: "Guard corpora format for per-case cwd, environment and replay fields"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-02
status: todo
depends_on: []
implements: []
satisfies_ac: [C002-AC-607.1, C002-AC-633.1]
verified_by: [C002-TS-610, C002-TS-649, C002-TC-610, C002-TC-649]
components: [C002-COMP-013]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-007 — Guard corpora format for per-case cwd, environment and replay fields

## Intent

The corpora get a second reader, the replay suite (C002-COMP-008). They also need cases whose `cwd`
is not the fixture root and cases that stub `CLAUDE_PLUGIN_DATA`. This task extends the case format
and both corpus tests before any new case is added. Every existing case keeps its expectation
(regression-set §4.1).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `tests/guards/bash-corpus.test.ts` | `BashCase` gains an optional case-level `cwd`, an `env` stub, `category`, `requires` (host capabilities) and `dialect`; a case with its own `cwd` gets its own branch in `bashHookInput` |
| modify | `tests/guards/path-corpus.test.ts`, `tests/guards/fixture.ts` | the same optional fields for path cases; the fixture repository gets a `.git` folder so the repository root is deterministic |
| add | `tests/guards/corpus-format.test.ts` | every case has a unique ID, a known category, and only known fields |

## Preconditions

- None.

## Step outline (no production code)

1. Add the optional fields. A case without them behaves exactly as today.
2. Create `.git` in the fixture repository, next to `.sdd`.
3. Run both corpora: 256 path cases and 277 shell cases, with no expectation changed. The new shell
   cases of C002-TS-610 (Serena, `--cwd` and `sdd install copilot` rows) are added by C002-T-008,
   C002-T-009, C002-T-010 and C002-T-059 in the format this task defines.
4. Describe the fields in a header comment of each corpus test. The replay suite (C002-T-040) reads
   the same fields.

## Verification

- `npm test -- tests/guards`
- `npm run bench`

## Done when

- [ ] All existing corpus cases pass unchanged
- [ ] The format test rejects an unknown field
- [ ] Progress reported: `sdd task set C002-T-007 --status done --commit <sha>`
