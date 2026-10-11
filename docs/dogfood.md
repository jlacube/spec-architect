# Dogfood log

Runs of the Architect suite on its own repository and on real changes. Each entry names what was
run, the results and the decisions it led to.

## 2026-10-11 — CHG-001: the CLI core replaces the bootstrap (C001-T-028)

**What changed.** Until C001-T-017 the workspace of this repository was hand-made, with Python
prototypes in `tools/prototypes/` standing in for `sdd lint`, `sdd trace` and the approval hash.
With milestone M-2 the real CLI (`plugins/architect/scripts/sdd.mjs`) does all of it:

| Prototype | Replaced by | Check that it reproduces the prototype |
|---|---|---|
| `speccheck.py` | `sdd lint` (53 rules, C001-T-018 … T-022) | 0 findings for the ported rules on the approved spec |
| `specgen.py`, `planrender.py` (matrices) | `sdd trace --write` (C001-T-023) | identical coverage: TR-01 … TR-08 all 100% (80 / 210 / 232 / 27 / 210 / 27; 210 / 57 / 233) |
| `phasehash.py` | `sdd hash`, `sdd gate approve`, `sdd stale check` (C001-T-024, T-025) | G1, G2, G3 hashes and all 978 recorded per-ID hashes reproduced exactly |
| frontmatter edits for task reports | `sdd task set` (C001-T-026) | used for C001-T-026 onward |

The prototypes were deleted in this task.

**First full lint (before the revision).** 107 errors, all in approved artifacts:

| Finding | Count | Cause |
|---|---|---|
| LINT-TS-001 | 71 | 70 scenarios without a `Given`, C001-TS-205 without a `When` (REQ-413 required ≥ 1 Given) |
| TR-12 | 31 | ideation labels written as change IDs (NG-01 … 06, AS-01 … 08) and example IDs in prose |
| LINT-IDE-001 | 3 | the hand-made ideation lacked Research index, Options and decisions index, Design direction |
| LINT-TXT-001 | 2 | "no-TBD" and "etc." quoted as words in the ideation |

Also found while building the rules: 66 of 80 stories lacked the "Context & notes" field that
C001-REQ-402 requires; IF-04 §1 asked for three-digit COMP/IF short forms while the spec uses
two; C001-TS-801 quoted a gate-summary layout different from C001-IF-13 §1; the registry schema had
no place for a reopened defect's history.

**Decisions (P-01, 2026-10-11).** Ideation labels become `IDEA-NG-…` / `IDEA-AS-…` and example IDs
go in backticks; REQ-413 is relaxed (exactly one When and ≥ 1 Then, Given optional); the ideation
gets the three index sections (unnumbered, so the IDEA-§ numbers stay valid) and the 66 stories get
their Context & notes, with LINT-US-002 now checking that field; the three small inconsistencies
are fixed in the same revision.

**Revision and re-approval**, all through the CLI:

| Step | Command | Result |
|---|---|---|
| Open | `sdd gate record 001 00-ideation --decision revise` | 00-ideation in revision, 10-spec and 20-plan stale |
| Impact | per-ID hash diff against `approvals.json` | 10-spec: 73 IDs modified (66 stories, REQ-413, AC-413.1, TS-415, AC-204.2, TS-205, AC-801.1, TS-801), none added or removed; 20-plan: C001-T-010 |
| Check | `sdd lint` | 0 errors, 0 warnings, 1 info (`.sdd/metrics/` preserved, C001-REQ-124) |
| G1 | `sdd gate approve 001 00-ideation` | `sha256:8e706772…`; P-01: "Approve" |
| G2 | `sdd gate approve 001 10-spec` | `sha256:08557099…`; P-01: "Approve" |
| G3 | `sdd gate approve 001 20-plan` | `sha256:29812fa5…`; P-01: "Approve" |
| Verify | `sdd stale check` | all three phases approved, hashes match |

The G1 baseline as approved on 2026-10-10 (`sha256:c9c7849f…`) is kept as the fixture
`tests/fixtures/fx-bootstrap-g1/` for C001-TS-806.

**Benchmarks** (`npm run bench`, results in `bench/results/`; i7-10510U, Windows 11, Node 22, fx-large
with 20 changes, 500 files and 2,000 IDs):

| NFR | Measure | Result | Threshold |
|---|---|---|---|
| C001-NFR-101 | full lint, p95 of 10 | 1.9 s | ≤ 5 s |
| C001-NFR-102 | quick lint, p95 of 20 | 373 ms | ≤ 800 ms |
| C001-NFR-103 | guards | not yet measured (C001-T-050/051) | ≤ 300 ms |
| C001-NFR-104 | `status --brief`, p95 of 10 | 360 ms (was 1,018 ms before task states were read from task files only) | ≤ 1 s |
| C001-NFR-301 | 1,000 random kills of state-writing commands | 0 corrupted files (887 killed mid-run) | 0 |

**Observations.**

- Hard kills can leave orphan `*.tmp-<pid>-<hex>` files next to state files (16 in 1,000 runs).
  They never replace a state file; a cleanup on the next write is a candidate improvement.
- The spec and plan critic reports still list one open major finding each (spec CR-2, plan CR-1),
  as at the original approvals; they are advisory and did not block the gates.
- On this repository `sdd lint` takes about 0.8 s, quick lint about 0.6 s.

**M-2 exit criterion** — `sdd lint` exits 0 on this repository; G1/G2 hashes reproduce (golden
tests); prototypes retired; all M-2 test cases pass (`npm run check`: 368 tests).
