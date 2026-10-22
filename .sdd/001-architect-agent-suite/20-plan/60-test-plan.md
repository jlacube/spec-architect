---
id: C001-PLAN-TEST
artifact: plan/test-plan
change: CHG-001
phase: 20-plan
status: approved
---

# CHG-001 — Test plan

## 1. Scope and levels

Every acceptance scenario (TS) of the approved spec maps to exactly one test case (TC) with
the same number (`C001-TS-n` → `C001-TC-n`), so coverage stays mechanically checkable (TR-08).

Five NFR cases, C001-TC-1126 … C001-TC-1130, were added by the revision for defect D-014
(C001-T-080). They verify C001-NFR-301, 401, 403, 404 and 502, which no scenario states. Each
row names its NFR first in the Location cell. A TC row is defined by the one scenario it
verifies, so the Verifies cell holds the scenario whose run the case measures. That is
C001-TS-132 (interrupted write) for C001-NFR-301, and C001-TS-1118 (`npm run check`) for the
other four. The numbers come from the ID ledger (`sdd id next TC`). Suppose CAP-11 later
allocates a scenario numbered 1126 … 1130. Its test case then takes the next free TC number, not
the scenario's own number.

| Level | Meaning | Count | Runner |
|---|---|---|---|
| integration | CLI, hooks, files and schemas, run against fixture repositories | 160 | `node --test` (C001-ADR-006) |
| eval | Agent behaviour in scripted Claude Code sessions with transcript assertions | 78 | eval harness (T-029), tiers of C001-ADR-003 |
| manual | Needs a human-controlled environment | 3 | checklists under `tests/manual/` |
| unit | Module-level tests supporting the above (not mapped to TS) | as needed | `node --test` |

## 2. Fixtures

| Fixture | Content | Built by |
|---|---|---|
| fx-empty | Empty git repository | T-027 |
| fx-bootstrap | Copy of this repository's `.sdd/` at G2 (hand-made bootstrap) | T-013, T-027 |
| fx-brownfield-ts | Small TypeScript service with `src/billing`, `src/auth`, `src/checkout/payments.ts`, tests, git history with churn | T-027 |
| fx-large | Generated: 20 changes, 500 artifact files, 2,000 IDs | T-027 (`tests/fixtures/gen-large.mjs`) |
| lint fixtures | One `bad/` and one `good/` per rule code | T-018 … T-022 |
| guard corpora | ≥ 200 path cases; bash allow/deny cases (ripwire forms of C001-IF-07 §3.1 added by T-079) | T-050, T-051, T-079 |
| secrets fixtures | ≥ 60 positives, ≥ 100 negatives | T-054 |
| injection evals | ≥ 20 cases | T-054 |
| cfg-full / cfg-no-ripwire / cfg-bare | PATH shims controlling which tools are visible | T-041 |

## 3. Environments

- **REF-WIN** (required): Windows 11 reference machine (C001-SPEC-NFR); PowerShell 7 and Git
  Bash; Node 20 and 22.
- **Claude Code**: current stable at execution time; models per C001-IF-09; the plugin
  installed from the local marketplace.
- **macOS/Linux**: prepared via dormant CI (T-064); not executed in this change (C001-NG-07).

## 4. Eval execution policy (C001-ADR-003)

| Tier | Trigger | Runs | Pass rule | Recorded in |
|---|---|---|---|---|
| dev | task done | 1 | pass | `evals/results/dev-*.json` |
| milestone | exit of M-3 … M-6 | 3 | 3/3 (2/3 triggers a 10-run check) | `evals/results/m<n>-*.json` |
| release | T-072 | 10 | ≥ 9/10 | `docs/release-0.1.0-evidence.md` |

Each run records model IDs, tokens, duration and transcript path. Eval assertions inspect
tool calls (AskUserQuestion, Agent, Write, Bash), file outputs and lint results, never free
text alone.

AskUserQuestion is unavailable in headless Claude Code (spike S-05, D-S05-2). C001-T-029 must
establish an interactive (pseudo-terminal) or Agent-SDK-based harness that answers it with scripted
choices before any M-3 eval is written; the mechanism is decided in C001-T-029.

## 5. Regression set

Greenfield change, so there is no pre-existing code to regress (no `30-impact/` folder). From
M-2 on, the regression set is the full `npm run check` (all integration TCs + lint fixtures),
run before every task commit.

## 6. Entry and exit criteria

- **Entry**: task dependencies done; fixtures for the task available.
- **Exit (task)**: all TCs in the task's `verified_by` pass at dev tier.
- **Exit (milestone)**: all TCs of the milestone's tasks pass; eval TCs at milestone tier.
- **Exit (release)**: every TC passes; eval TCs at release tier; NFR results recorded
  (T-065); DoD evidence complete (T-072).

## 7. Manual test cases

| TC | Procedure owner | Notes |
|---|---|---|
| C001-TC-621 | P-01 supervises a Superpowers session (T-074) | Count implementer questions tagged missing-info (C001-SC-04) |
| C001-TC-1102 | P-01 on a fresh Windows user profile (T-072) | Timed for C001-NFR-602 |
| C001-TC-1127 | Implementer of C001-T-080 on REF-WIN; repeated by the implementer of C001-T-072 at the release commit | Four sequential `npm run check` runs (two shells × two Node versions) for C001-NFR-401 |

## 8. Test cases

| TC | Verifies | Level | Location | Test data | Environment | Task |
|---|---|---|---|---|---|---|
| C001-TC-101 | C001-TS-101 | integration | `tests/integration/cap01/TS-101.test.ts` | fx-empty | REF-WIN, Node 20 and 22 | C001-T-013 |
| C001-TC-102 | C001-TS-102 | integration | `tests/integration/cap01/TS-102.test.ts` | fx-brownfield-ts | REF-WIN, Node 20 and 22 | C001-T-013 |
| C001-TC-103 | C001-TS-103 | integration | `tests/integration/cap01/TS-103.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-013 |
| C001-TC-104 | C001-TS-104 | integration | `tests/integration/cap01/TS-104.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-013 |
| C001-TC-105 | C001-TS-105 | integration | `tests/integration/cap01/TS-105.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-017 |
| C001-TC-106 | C001-TS-106 | integration | `tests/integration/cap01/TS-106.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-017 |
| C001-TC-107 | C001-TS-107 | integration | `tests/integration/cap01/TS-107.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-017 |
| C001-TC-108 | C001-TS-108 | integration | `tests/integration/cap01/TS-108.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-017 |
| C001-TC-109 | C001-TS-109 | integration | `tests/integration/cap01/TS-109.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-017 |
| C001-TC-110 | C001-TS-110 | integration | `tests/integration/cap01/TS-110.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-014 |
| C001-TC-111 | C001-TS-111 | integration | `tests/integration/cap01/TS-111.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-014 |
| C001-TC-112 | C001-TS-112 | integration | `tests/integration/cap01/TS-112.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-014 |
| C001-TC-113 | C001-TS-113 | integration | `tests/integration/cap01/TS-113.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-014 |
| C001-TC-114 | C001-TS-114 | integration | `tests/integration/cap01/TS-114.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-016 |
| C001-TC-115 | C001-TS-115 | integration | `tests/integration/cap01/TS-115.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-016 |
| C001-TC-116 | C001-TS-116 | integration | `tests/integration/cap01/TS-116.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-016 |
| C001-TC-117 | C001-TS-117 | integration | `tests/integration/cap01/TS-117.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-010 |
| C001-TC-118 | C001-TS-118 | integration | `tests/integration/cap01/TS-118.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-016 |
| C001-TC-119 | C001-TS-119 | eval | `evals/cap01/TS-119.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-033 |
| C001-TC-120 | C001-TS-120 | eval | `evals/cap01/TS-120.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-033 |
| C001-TC-121 | C001-TS-121 | eval | `evals/cap01/TS-121.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-122 | C001-TS-122 | eval | `evals/cap01/TS-122.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-033 |
| C001-TC-123 | C001-TS-123 | integration | `tests/integration/cap01/TS-123.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-015 |
| C001-TC-124 | C001-TS-124 | integration | `tests/integration/cap01/TS-124.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-018 |
| C001-TC-125 | C001-TS-125 | integration | `tests/integration/cap01/TS-125.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-014 |
| C001-TC-126 | C001-TS-126 | integration | `tests/integration/cap01/TS-126.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-014 |
| C001-TC-127 | C001-TS-127 | eval | `evals/cap01/TS-127.eval.mjs` | fx-brownfield-ts | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-128 | C001-TS-128 | integration | `tests/integration/cap01/TS-128.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-018 |
| C001-TC-129 | C001-TS-129 | integration | `tests/integration/cap01/TS-129.test.ts` | fx-bootstrap (this repo at G2) | REF-WIN, Node 20 and 22 | C001-T-013 |
| C001-TC-130 | C001-TS-130 | integration | `tests/integration/cap01/TS-130.test.ts` | fx-bootstrap (this repo at G2) | REF-WIN, Node 20 and 22 | C001-T-013 |
| C001-TC-131 | C001-TS-131 | integration | `tests/integration/cap01/TS-131.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-014 |
| C001-TC-132 | C001-TS-132 | integration | `tests/integration/cap01/TS-132.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-011 |
| C001-TC-133 | C001-TS-133 | eval | `evals/cap01/TS-133.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-032 |
| C001-TC-201 | C001-TS-201 | eval | `evals/cap02/TS-201.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-030 |
| C001-TC-202 | C001-TS-202 | eval | `evals/cap02/TS-202.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-030 |
| C001-TC-203 | C001-TS-203 | eval | `evals/cap02/TS-203.eval.mjs` | fx-empty | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-030 |
| C001-TC-204 | C001-TS-204 | integration | `tests/integration/cap02/TS-204.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-033 |
| C001-TC-205 | C001-TS-205 | integration | `tests/integration/cap02/TS-205.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-033 |
| C001-TC-206 | C001-TS-206 | eval | `evals/cap02/TS-206.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-031 |
| C001-TC-207 | C001-TS-207 | eval | `evals/cap02/TS-207.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-031 |
| C001-TC-208 | C001-TS-208 | eval | `evals/cap02/TS-208.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-031 |
| C001-TC-209 | C001-TS-209 | eval | `evals/cap02/TS-209.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-031 |
| C001-TC-210 | C001-TS-210 | eval | `evals/cap02/TS-210.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-031 |
| C001-TC-211 | C001-TS-211 | eval | `evals/cap02/TS-211.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-031 |
| C001-TC-212 | C001-TS-212 | eval | `evals/cap02/TS-212.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-031 |
| C001-TC-213 | C001-TS-213 | eval | `evals/cap02/TS-213.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-032 |
| C001-TC-214 | C001-TS-214 | eval | `evals/cap02/TS-214.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-032 |
| C001-TC-215 | C001-TS-215 | eval | `evals/cap02/TS-215.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-032 |
| C001-TC-216 | C001-TS-216 | eval | `evals/cap02/TS-216.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-032 |
| C001-TC-217 | C001-TS-217 | eval | `evals/cap02/TS-217.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-032 |
| C001-TC-218 | C001-TS-218 | eval | `evals/cap02/TS-218.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-032 |
| C001-TC-219 | C001-TS-219 | integration | `tests/integration/cap02/TS-219.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-030 |
| C001-TC-220 | C001-TS-220 | integration | `tests/integration/cap02/TS-220.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-060 |
| C001-TC-221 | C001-TS-221 | eval | `evals/cap02/TS-221.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-030 |
| C001-TC-222 | C001-TS-222 | eval | `evals/cap02/TS-222.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-031 |
| C001-TC-301 | C001-TS-301 | eval | `evals/cap03/TS-301.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-035 |
| C001-TC-302 | C001-TS-302 | integration | `tests/integration/cap03/TS-302.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-035 |
| C001-TC-303 | C001-TS-303 | eval | `evals/cap03/TS-303.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-035 |
| C001-TC-304 | C001-TS-304 | eval | `evals/cap03/TS-304.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-035 |
| C001-TC-305 | C001-TS-305 | eval | `evals/cap03/TS-305.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-035 |
| C001-TC-306 | C001-TS-306 | eval | `evals/cap03/TS-306.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-035 |
| C001-TC-307 | C001-TS-307 | eval | `evals/cap03/TS-307.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-035 |
| C001-TC-308 | C001-TS-308 | integration | `tests/integration/cap03/TS-308.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-035 |
| C001-TC-309 | C001-TS-309 | eval | `evals/cap03/TS-309.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-036 |
| C001-TC-310 | C001-TS-310 | integration | `tests/integration/cap03/TS-310.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-021 |
| C001-TC-311 | C001-TS-311 | integration | `tests/integration/cap03/TS-311.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-021 |
| C001-TC-312 | C001-TS-312 | eval | `evals/cap03/TS-312.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-036 |
| C001-TC-313 | C001-TS-313 | eval | `evals/cap03/TS-313.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-036 |
| C001-TC-314 | C001-TS-314 | integration | `tests/integration/cap03/TS-314.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-032 |
| C001-TC-315 | C001-TS-315 | eval | `evals/cap03/TS-315.eval.mjs` | fx-brownfield-ts | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-316 | C001-TS-316 | eval | `evals/cap03/TS-316.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-033 |
| C001-TC-317 | C001-TS-317 | eval | `evals/cap03/TS-317.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-033 |
| C001-TC-318 | C001-TS-318 | eval | `evals/cap03/TS-318.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-033 |
| C001-TC-319 | C001-TS-319 | eval | `evals/cap03/TS-319.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-039 |
| C001-TC-320 | C001-TS-320 | eval | `evals/cap03/TS-320.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-039 |
| C001-TC-401 | C001-TS-401 | eval | `evals/cap04/TS-401.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-037 |
| C001-TC-402 | C001-TS-402 | integration | `tests/integration/cap04/TS-402.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-037 |
| C001-TC-403 | C001-TS-403 | integration | `tests/integration/cap04/TS-403.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-019 |
| C001-TC-404 | C001-TS-404 | integration | `tests/integration/cap04/TS-404.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-037 |
| C001-TC-405 | C001-TS-405 | integration | `tests/integration/cap04/TS-405.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-019 |
| C001-TC-406 | C001-TS-406 | integration | `tests/integration/cap04/TS-406.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-019 |
| C001-TC-407 | C001-TS-407 | integration | `tests/integration/cap04/TS-407.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-019 |
| C001-TC-408 | C001-TS-408 | integration | `tests/integration/cap04/TS-408.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-019 |
| C001-TC-409 | C001-TS-409 | integration | `tests/integration/cap04/TS-409.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-019 |
| C001-TC-410 | C001-TS-410 | integration | `tests/integration/cap04/TS-410.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-019 |
| C001-TC-411 | C001-TS-411 | integration | `tests/integration/cap04/TS-411.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-037 |
| C001-TC-412 | C001-TS-412 | integration | `tests/integration/cap04/TS-412.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-020 |
| C001-TC-413 | C001-TS-413 | integration | `tests/integration/cap04/TS-413.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-038 |
| C001-TC-414 | C001-TS-414 | integration | `tests/integration/cap04/TS-414.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-038 |
| C001-TC-415 | C001-TS-415 | integration | `tests/integration/cap04/TS-415.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-020 |
| C001-TC-416 | C001-TS-416 | integration | `tests/integration/cap04/TS-416.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-037 |
| C001-TC-417 | C001-TS-417 | integration | `tests/integration/cap04/TS-417.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-020 |
| C001-TC-418 | C001-TS-418 | eval | `evals/cap04/TS-418.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-037 |
| C001-TC-419 | C001-TS-419 | eval | `evals/cap04/TS-419.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-037 |
| C001-TC-420 | C001-TS-420 | eval | `evals/cap04/TS-420.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-037 |
| C001-TC-421 | C001-TS-421 | integration | `tests/integration/cap04/TS-421.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-038 |
| C001-TC-422 | C001-TS-422 | integration | `tests/integration/cap04/TS-422.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-020 |
| C001-TC-423 | C001-TS-423 | eval | `evals/cap04/TS-423.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-037 |
| C001-TC-424 | C001-TS-424 | eval | `evals/cap04/TS-424.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-037 |
| C001-TC-501 | C001-TS-501 | integration | `tests/integration/cap05/TS-501.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-042 |
| C001-TC-502 | C001-TS-502 | integration | `tests/integration/cap05/TS-502.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-042 |
| C001-TC-503 | C001-TS-503 | integration | `tests/integration/cap05/TS-503.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-021 |
| C001-TC-507 | C001-TS-507 | eval | `evals/cap05/TS-507.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-042 |
| C001-TC-508 | C001-TS-508 | eval | `evals/cap05/TS-508.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-042 |
| C001-TC-509 | C001-TS-509 | integration | `tests/integration/cap05/TS-509.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-021 |
| C001-TC-510 | C001-TS-510 | integration | `tests/integration/cap05/TS-510.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-042 |
| C001-TC-511 | C001-TS-511 | eval | `evals/cap05/TS-511.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-042 |
| C001-TC-512 | C001-TS-512 | integration | `tests/integration/cap05/TS-512.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-021 |
| C001-TC-513 | C001-TS-513 | integration | `tests/integration/cap05/TS-513.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-042 |
| C001-TC-514 | C001-TS-514 | integration | `tests/integration/cap05/TS-514.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-042 |
| C001-TC-515 | C001-TS-515 | eval | `evals/cap05/TS-515.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-042 |
| C001-TC-516 | C001-TS-516 | integration | `tests/integration/cap05/TS-516.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-042 |
| C001-TC-601 | C001-TS-601 | integration | `tests/integration/cap06/TS-601.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043 |
| C001-TC-602 | C001-TS-602 | integration | `tests/integration/cap06/TS-602.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043, C001-T-076 |
| C001-TC-603 | C001-TS-603 | integration | `tests/integration/cap06/TS-603.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-022 |
| C001-TC-604 | C001-TS-604 | integration | `tests/integration/cap06/TS-604.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-022 |
| C001-TC-605 | C001-TS-605 | integration | `tests/integration/cap06/TS-605.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-022 |
| C001-TC-606 | C001-TS-606 | integration | `tests/integration/cap06/TS-606.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-022 |
| C001-TC-607 | C001-TS-607 | integration | `tests/integration/cap06/TS-607.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-022 |
| C001-TC-608 | C001-TS-608 | integration | `tests/integration/cap06/TS-608.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-022 |
| C001-TC-609 | C001-TS-609 | eval | `evals/cap06/TS-609.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-043 |
| C001-TC-610 | C001-TS-610 | integration | `tests/integration/cap06/TS-610.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043 |
| C001-TC-611 | C001-TS-611 | integration | `tests/integration/cap06/TS-611.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043, C001-T-076 |
| C001-TC-612 | C001-TS-612 | eval | `evals/cap06/TS-612.eval.mjs` | fx-brownfield-ts | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-613 | C001-TS-613 | eval | `evals/cap06/TS-613.eval.mjs` | fx-brownfield-ts | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-614 | C001-TS-614 | integration | `tests/integration/cap06/TS-614.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-022 |
| C001-TC-615 | C001-TS-615 | integration | `tests/integration/cap06/TS-615.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043, C001-T-076 |
| C001-TC-616 | C001-TS-616 | integration | `tests/integration/cap06/TS-616.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043 |
| C001-TC-617 | C001-TS-617 | integration | `tests/integration/cap06/TS-617.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043, C001-T-076 |
| C001-TC-618 | C001-TS-618 | integration | `tests/integration/cap06/TS-618.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043 |
| C001-TC-619 | C001-TS-619 | integration | `tests/integration/cap06/TS-619.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043, C001-T-076 |
| C001-TC-620 | C001-TS-620 | integration | `tests/integration/cap06/TS-620.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-043, C001-T-076 |
| C001-TC-621 | C001-TS-621 | manual | `tests/manual/TS-621.md` | inline fixture from scenario Given/Examples | REF-WIN with Superpowers installed | C001-T-043 |
| C001-TC-622 | C001-TS-622 | eval | `evals/cap06/TS-622.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-043 |
| C001-TC-701 | C001-TS-701 | integration | `tests/integration/cap07/TS-701.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-018 |
| C001-TC-702 | C001-TS-702 | integration | `tests/integration/cap07/TS-702.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-012 |
| C001-TC-703 | C001-TS-703 | integration | `tests/integration/cap07/TS-703.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-012 |
| C001-TC-704 | C001-TS-704 | integration | `tests/integration/cap07/TS-704.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-012 |
| C001-TC-705 | C001-TS-705 | integration | `tests/integration/cap07/TS-705.test.ts` | fx-large (generated) | REF-WIN, Node 20 and 22 | C001-T-018 |
| C001-TC-706 | C001-TS-706 | integration | `tests/integration/cap07/TS-706.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-023 |
| C001-TC-707 | C001-TS-707 | integration | `tests/integration/cap07/TS-707.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-023 |
| C001-TC-708 | C001-TS-708 | integration | `tests/integration/cap07/TS-708.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-023 |
| C001-TC-709 | C001-TS-709 | integration | `tests/integration/cap07/TS-709.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-023 |
| C001-TC-710 | C001-TS-710 | eval | `evals/cap07/TS-710.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-039 |
| C001-TC-711 | C001-TS-711 | eval | `evals/cap07/TS-711.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-039 |
| C001-TC-712 | C001-TS-712 | eval | `evals/cap07/TS-712.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-039 |
| C001-TC-713 | C001-TS-713 | eval | `evals/cap07/TS-713.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-039 |
| C001-TC-714 | C001-TS-714 | eval | `evals/cap07/TS-714.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-039 |
| C001-TC-715 | C001-TS-715 | eval | `evals/cap07/TS-715.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-039 |
| C001-TC-716 | C001-TS-716 | integration | `tests/integration/cap07/TS-716.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-023 |
| C001-TC-717 | C001-TS-717 | integration | `tests/integration/cap07/TS-717.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-018 |
| C001-TC-718 | C001-TS-718 | integration | `tests/integration/cap07/TS-718.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-018 |
| C001-TC-719 | C001-TS-719 | integration | `tests/integration/cap07/TS-719.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-018 |
| C001-TC-720 | C001-TS-720 | integration | `tests/integration/cap07/TS-720.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-025 |
| C001-TC-801 | C001-TS-801 | integration | `tests/integration/cap08/TS-801.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-025 |
| C001-TC-802 | C001-TS-802 | eval | `evals/cap08/TS-802.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-034 |
| C001-TC-803 | C001-TS-803 | eval | `evals/cap08/TS-803.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-034 |
| C001-TC-804 | C001-TS-804 | eval | `evals/cap08/TS-804.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-034 |
| C001-TC-805 | C001-TS-805 | integration | `tests/integration/cap08/TS-805.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-025 |
| C001-TC-806 | C001-TS-806 | integration | `tests/integration/cap08/TS-806.test.ts` | fx-bootstrap (this repo at G2) | REF-WIN, Node 20 and 22 | C001-T-024 |
| C001-TC-807 | C001-TS-807 | integration | `tests/integration/cap08/TS-807.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-024 |
| C001-TC-808 | C001-TS-808 | integration | `tests/integration/cap08/TS-808.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-025 |
| C001-TC-809 | C001-TS-809 | integration | `tests/integration/cap08/TS-809.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-025 |
| C001-TC-810 | C001-TS-810 | integration | `tests/integration/cap08/TS-810.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-025 |
| C001-TC-811 | C001-TS-811 | integration | `tests/integration/cap08/TS-811.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-024 |
| C001-TC-812 | C001-TS-812 | integration | `tests/integration/cap08/TS-812.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-024 |
| C001-TC-813 | C001-TS-813 | integration | `tests/integration/cap08/TS-813.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-032 |
| C001-TC-814 | C001-TS-814 | integration | `tests/integration/cap08/TS-814.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-044 |
| C001-TC-815 | C001-TS-815 | eval | `evals/cap08/TS-815.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-044 |
| C001-TC-816 | C001-TS-816 | integration | `tests/integration/cap08/TS-816.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-024 |
| C001-TC-817 | C001-TS-817 | eval | `evals/cap08/TS-817.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-044 |
| C001-TC-818 | C001-TS-818 | integration | `tests/integration/cap08/TS-818.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-078 |
| C001-TC-819 | C001-TS-819 | integration | `tests/integration/cap08/TS-819.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-078 |
| C001-TC-901 | C001-TS-901 | integration | `tests/integration/cap09/TS-901.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-902 | C001-TS-902 | integration | `tests/integration/cap09/TS-902.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-903 | C001-TS-903 | integration | `tests/integration/cap09/TS-903.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-904 | C001-TS-904 | integration | `tests/integration/cap09/TS-904.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-905 | C001-TS-905 | integration | `tests/integration/cap09/TS-905.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-906 | C001-TS-906 | integration | `tests/integration/cap09/TS-906.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-017 |
| C001-TC-907 | C001-TS-907 | integration | `tests/integration/cap09/TS-907.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-022 |
| C001-TC-908 | C001-TS-908 | integration | `tests/integration/cap09/TS-908.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-909 | C001-TS-909 | integration | `tests/integration/cap09/TS-909.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-910 | C001-TS-910 | eval | `evals/cap09/TS-910.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-030 |
| C001-TC-911 | C001-TS-911 | integration | `tests/integration/cap09/TS-911.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-912 | C001-TS-912 | integration | `tests/integration/cap09/TS-912.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-052 |
| C001-TC-913 | C001-TS-913 | integration | `tests/integration/cap09/TS-913.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-052 |
| C001-TC-914 | C001-TS-914 | integration | `tests/integration/cap09/TS-914.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-053 |
| C001-TC-915 | C001-TS-915 | integration | `tests/integration/cap09/TS-915.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-053 |
| C001-TC-916 | C001-TS-916 | integration | `tests/integration/cap09/TS-916.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-053 |
| C001-TC-917 | C001-TS-917 | integration | `tests/integration/cap09/TS-917.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-053 |
| C001-TC-918 | C001-TS-918 | integration | `tests/integration/cap09/TS-918.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-053 |
| C001-TC-919 | C001-TS-919 | integration | `tests/integration/cap09/TS-919.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-053 |
| C001-TC-920 | C001-TS-920 | integration | `tests/integration/cap09/TS-920.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-053 |
| C001-TC-921 | C001-TS-921 | integration | `tests/integration/cap09/TS-921.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-053 |
| C001-TC-922 | C001-TS-922 | integration | `tests/integration/cap09/TS-922.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-053 |
| C001-TC-923 | C001-TS-923 | integration | `tests/integration/cap09/TS-923.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-924 | C001-TS-924 | integration | `tests/integration/cap09/TS-924.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-026 |
| C001-TC-1001 | C001-TS-1001 | eval | `evals/cap10/TS-1001.eval.mjs` | fx-brownfield-ts | REF-WIN, cfg-full | C001-T-041 |
| C001-TC-1002 | C001-TS-1002 | eval | `evals/cap10/TS-1002.eval.mjs` | fx-brownfield-ts | REF-WIN, cfg-full, cfg-no-ripwire, cfg-bare | C001-T-041 |
| C001-TC-1003 | C001-TS-1003 | integration | `tests/integration/cap10/TS-1003.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-041 |
| C001-TC-1004 | C001-TS-1004 | eval | `evals/cap10/TS-1004.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-1005 | C001-TS-1005 | eval | `evals/cap10/TS-1005.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-1006 | C001-TS-1006 | integration | `tests/integration/cap10/TS-1006.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-060 |
| C001-TC-1007 | C001-TS-1007 | integration | `tests/integration/cap10/TS-1007.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-060, C001-T-078 |
| C001-TC-1008 | C001-TS-1008 | integration | `tests/integration/cap10/TS-1008.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-060 |
| C001-TC-1009 | C001-TS-1009 | integration | `tests/integration/cap10/TS-1009.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-060 |
| C001-TC-1010 | C001-TS-1010 | eval | `evals/cap10/TS-1010.eval.mjs` | fx-brownfield-ts | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-1011 | C001-TS-1011 | eval | `evals/cap10/TS-1011.eval.mjs` | fx-brownfield-ts | REF-WIN, cfg-full (ripwire shim exits 134) | C001-T-041 |
| C001-TC-1012 | C001-TS-1012 | eval | `evals/cap10/TS-1012.eval.mjs` | fx-empty | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-1013 | C001-TS-1013 | eval | `evals/cap10/TS-1013.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-041 |
| C001-TC-1014 | C001-TS-1014 | eval | `evals/cap10/TS-1014.eval.mjs` | fx-brownfield-ts | REF-WIN, cfg-full (ripwire shim exits 4 on `--test-gate`) | C001-T-041 |
| C001-TC-1015 | C001-TS-1015 | eval | `evals/cap10/TS-1015.eval.mjs` | fx-brownfield-ts; empty plugin data folder | REF-WIN, cfg-full, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-044, C001-T-077, C001-T-078 |
| C001-TC-1101 | C001-TS-1101 | integration | `tests/integration/cap11/TS-1101.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-060 |
| C001-TC-1102 | C001-TS-1102 | manual | `tests/manual/TS-1102.md` | inline fixture from scenario Given/Examples | REF-WIN fresh user profile | C001-T-060 |
| C001-TC-1103 | C001-TS-1103 | integration | `tests/integration/cap11/TS-1103.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-050 |
| C001-TC-1104 | C001-TS-1104 | integration | `tests/integration/cap11/TS-1104.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-050 |
| C001-TC-1105 | C001-TS-1105 | integration | `tests/integration/cap11/TS-1105.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-050 |
| C001-TC-1107 | C001-TS-1107 | integration | `tests/integration/cap11/TS-1107.test.ts` | inline fixture from scenario Given/Examples (12 rows, incl. the three D-012 rows: `ripwire . --max-tokens=4000` and `ripwire . --test-gate=src/checkout/payments.ts --limit=50` allowed, `ripwire .` denied) | REF-WIN, Node 20 and 22 | C001-T-051, C001-T-079 |
| C001-TC-1108 | C001-TS-1108 | integration | `tests/integration/cap11/TS-1108.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-051 |
| C001-TC-1109 | C001-TS-1109 | integration | `tests/integration/cap11/TS-1109.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-060 |
| C001-TC-1110 | C001-TS-1110 | integration | `tests/integration/cap11/TS-1110.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-060 |
| C001-TC-1111 | C001-TS-1111 | eval | `evals/cap11/TS-1111.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, cfg-no-ripwire | C001-T-044 |
| C001-TC-1112 | C001-TS-1112 | eval | `evals/cap11/TS-1112.eval.mjs` | scenario Given data on fx-empty or fx-brownfield-ts copy | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-044 |
| C001-TC-1113 | C001-TS-1113 | integration | `tests/integration/cap11/TS-1113.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-001 |
| C001-TC-1114 | C001-TS-1114 | integration | `tests/integration/cap11/TS-1114.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-061 |
| C001-TC-1115 | C001-TS-1115 | integration | `tests/integration/cap11/TS-1115.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-061 |
| C001-TC-1116 | C001-TS-1116 | integration | `tests/integration/cap11/TS-1116.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-062 |
| C001-TC-1117 | C001-TS-1117 | integration | `tests/integration/cap11/TS-1117.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-063 |
| C001-TC-1118 | C001-TS-1118 | integration | `tests/integration/cap11/TS-1118.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-061 |
| C001-TC-1119 | C001-TS-1119 | integration | `tests/integration/cap11/TS-1119.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-061 |
| C001-TC-1120 | C001-TS-1120 | integration | `tests/integration/cap11/TS-1120.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-064 |
| C001-TC-1121 | C001-TS-1121 | integration | `tests/integration/cap11/TS-1121.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-061 |
| C001-TC-1122 | C001-TS-1122 | integration | `tests/integration/cap11/TS-1122.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-052 |
| C001-TC-1123 | C001-TS-1123 | integration | `tests/integration/cap11/TS-1123.test.ts` | inline fixture from scenario Given/Examples | REF-WIN, Node 20 and 22 | C001-T-061 |
| C001-TC-1124 | C001-TS-1124 | eval | `evals/cap11/TS-1124.eval.mjs` | scenario Given data on fx-empty (PATH shim reporting Claude Code 2.0.76) | REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003 | C001-T-044 |
| C001-TC-1125 | C001-TS-1125 | integration | `tests/integration/cap11/TS-1125.test.ts` | the 18 Examples rows of C001-TS-1125 (`--max-tokens=N` the only map bound: `ripwire . --token-budget=4000` denied, `ripwire --test-gate src/a.ts` allowed), also present as category `ripwire` cases of `tests/guards/bash-corpus.json` (checked by the test); bundled `sdd guard-bash` with hook input as in TS-1107.test.ts, the PowerShell row with `tool_name` PowerShell | REF-WIN, Node 20 and 22 | C001-T-079 |
| C001-TC-1126 | C001-TS-132 | integration | C001-NFR-301 (C001-DOD-015): `tests/integration/faults.test.ts` fails the write at every write point of `status --write`, `task set`, `gate approve`, `defect add` and `archive`. `bench/faults.mjs` runs 1,000 killed or completed runs, 250 per command (`status --write`, `task set`, `gate approve`, `archive`). Pass: 0 state files that are neither the previous nor the new complete version | the fault fixture of each file, with change 001 put into an archivable state (C001-REQ-913) for the `archive` runs; state files including `_living/` and `_archive/` | REF-WIN, Node 20 and 22 (the 1,000-run campaign on Node 20) | C001-T-080 |
| C001-TC-1127 | C001-TS-1118 | manual | C001-NFR-401 (C001-DOD-016): `tests/manual/TC-1127.md`. Run `npm run check` from the repository root four times, one after another: Git Bash and PowerShell 7, each with Node 20.20.2 and then 22.22.3 first in `PATH`. Record the step table, test counts, exit code and duration in `docs/nfr-results.md` §2. Pass: exit 0 in all four | this repository at the measured commit; working tree clean apart from untracked `bench/results/` | REF-WIN: PowerShell 7, Git Bash, Node 20.20.2 and 22.22.3 (nvm-windows) | C001-T-080 |
| C001-TC-1128 | C001-TS-1118 | integration | C001-NFR-403 (C001-DOD-016): the `tests` step of `npm run check` (every test file through `scripts/test.mjs`) on each Node version. It includes `tests/unit/packaging/plugin-filter.test.ts` (F-1), `tests/integration/packaging/package-staging.test.ts`, `tests/integration/cap01/package-flow.test.ts` and `tests/integration/mcp/shell.test.ts` (F-2). Pass: 100% of the run tests pass on each version; only POSIX-only tests are skipped | the repository test suite; plain and `\\?\`-prefixed source roots and paths for the filter test | REF-WIN, Node 20.20.2 and 22.22.3 | C001-T-080 |
| C001-TC-1129 | C001-TS-1118 | integration | C001-NFR-404 (C001-DOD-016): the `encoding` step of `npm run check` (`scripts/check/encoding.mjs`) and `tests/unit/check/encoding.test.ts`. Pass: 0 files with a BOM, a CR byte or invalid UTF-8 among the files the CLI wrote; a seeded violation makes the step and `npm run check` exit non-zero | fx-large after `status --write` and `trace --write`; fx-empty after `init` and `change new`; seeded BOM, CRLF and invalid-UTF-8 files for the unit test; this repository's `.sdd/` working tree reported only | REF-WIN (git `core.autocrlf=true`), Node 20 and 22 | C001-T-080 |
| C001-TC-1130 | C001-TS-1118 | integration | C001-NFR-502 (C001-DOD-017): the `coverage` step of `npm run check` (`scripts/test.mjs` coverage mode, then `scripts/check/coverage.mjs`), with the method of `docs/nfr-results.md` §4. Pass: ≥ 85% lines and ≥ 75% branches over every file under `src/`; a threshold above the measured value makes `npm run check` exit non-zero; tracked bundles unchanged after the step | every test file; both bundles rebuilt with inline source maps, so the CLI and MCP processes the tests spawn count | REF-WIN, Node 20 and 22 (the step passes on both; the Node 22 figure goes into `docs/nfr-results.md`) | C001-T-080 |
