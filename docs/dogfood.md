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

## 2026-11-13 — CHG-002 token estimate, taken for C001-T-074 (brownfield half)

CHG-002 ("Multi-platform targets") is the brownfield dogfood of C001-SC-01 and C001-SC-07 (P-01,
2026-10-13; kept 2026-11-13, CHG-001 `20-plan/questions-log.md` Q-t074-brownfield-01). Its Gate log
Usage cells read "unavailable", so its tokens are estimated from the kept conductor session transcripts
(P-01, Q-t074-usage-01). The estimate is taken now, before Claude Code's 30-day transcript cleanup
removes the October subagent files; C001-T-074 cites it.

- **Method:** assistant-message usage (deduplicated by message ID) in the main conductor session
  transcript and its subagent transcripts, between CHG-002's creation (`9dde137`, 2026-10-13 23:29:56
  +02:00) and its first G1, G2 and G3 approvals (2026-10-14 05:26:18, 2026-10-15 22:48:20,
  2026-10-16 15:04:01, +02:00). The 40 subagent transcripts of that window (with their `.meta.json`)
  are copied, outside the repository, to `C:\Sandbox\runs\chg002-usage-transcripts` on P-01's machine;
  keep them until C001-T-075 is done.
- **Upper bound:** CHG-001 work ran in the same session during that window, so the figures are an
  upper bound for CHG-002.

| Phase | Input | Cache creation | Cache read | Output | Messages |
|---|---:|---:|---:|---:|---:|
| 00-ideation | 416 | 4,417,006 | 51,273,845 | 53,866 | 204 |
| 10-spec | 2,862 | 6,462,272 | 261,925,979 | 143,149 | 1,428 |
| 20-plan | 1,492 | 4,040,125 | 128,722,078 | 82,196 | 745 |
| **Total** | **4,770** | **14,919,403** | **441,921,902** | **279,211** | **2,377** |

- **Input + output** (input, cache creation and output; cache reads excluded): 15,203,384 tokens.
  With cache reads: 457,125,286.
- **C001-NFR-106 does not apply:** CHG-002 had 121 REQs at its first G3, above the medium-feature range
  (5–40 REQs) of C001-NFR-106 and C001-SC-08, so the figures serve cost visibility (C001-SC-06) only.

## 2026-11-15 — CHG-001 greenfield dogfood "Voice dictation to Markdown notes" (C001-T-073)

The released suite (0.1.0, installed from the local marketplace) took one greenfield change through
G0–G3 in its own repository, with P-01 as spec owner driving `claude --agent architect:sdd-conductor`.
No dogfood artifact is copied here; the figures come from the dogfood's Gate log, `approvals.json`,
critic reports and session transcripts.

- **Repository:** `C:\Sandbox\dogfood\voice-notes` on P-01's machine, change
  `001-voice-dictation-to-markdown-notes` (full profile, greenfield), commit `aa45a77` at G3. Keep it
  at that path until C001-T-075 is done; C001-T-074 runs a Superpowers milestone on its plan.
- **Input:** P-01's pre-ideation brief on a local speech stack (`docs/input/` of the dogfood repository).

| Gate | Date | Decision | Approved hash | Approver |
|---|---|---|---|---|
| G0 (constitution) | 2026-11-14 | Approved | — | Jerome LACUBE |
| G1 (ideation) | 2026-11-14 | Approved | `sha256:8f9a88f1…` (26 files) | Jerome LACUBE |
| G2 (spec) | 2026-11-14 | Approved, then Revise (focused revision of spec minors chosen during the plan), then Approved | `sha256:979668a2…` (55 files) | Jerome LACUBE |
| G3 (plan) | 2026-11-15 | Approved | `sha256:b5715d55…` (81 files) | Jerome LACUBE |

**Usage per phase.** Assistant-message usage, deduplicated by message ID, over the dogfood
repository's transcripts with subagents (`%USERPROFILE%\.claude\projects\C--Sandbox-dogfood-voice-notes`),
cut at the change's creation (2026-11-14 01:40:09 +01:00) and the gate commits. The Gate log Usage
cells hold the same figures taken a minute or so before each approval; the G2 re-approval cell reads
"unavailable" and its revision is inside the plan window.

| Window | Input | Cache creation | Cache read | Output | Total (input + cache creation + output) |
|---|---:|---:|---:|---:|---:|
| init + G0 | 69 | 126,391 | 1,221,129 | 18,119 | 144,579 |
| 00-ideation → G1 | 471 | 1,235,018 | 21,705,125 | 444,970 | 1,680,459 |
| 10-spec → first G2 | 1,492 | 4,590,402 | 110,019,789 | 1,327,136 | 5,919,030 |
| 20-plan → G3, with the G2 revision | 2,662 | 6,737,394 | 246,985,524 | 2,019,888 | 8,759,944 |
| **Change (G1–G3)** | **4,625** | **12,562,814** | **378,710,438** | **3,791,994** | **16,359,433** |

- **C001-NFR-106 not met:** 16,359,433 tokens for the change against ≤ 3,000,000 (target
  ≤ 2,000,000), about 5.5×. RISK-013's trigger is reached. The CHG-002 upper-bound estimate above
  (15,203,384) is of the same order, so the overrun is the process, not this change. Output and cache
  creation dominate, driven by critic reviews and re-reviews (ideation 15 findings, spec 26, plan 22).
  Input for CHG-004 ("Cost and token efficiency").
- **REQ count at G2:** 40 (NFR 10), inside 5–40, so the C001-SC-08 and C001-NFR-106 figures apply.
  The cap shaped the spec: the critic's singularity fixes would have exceeded it (spec CR-2) and P-01
  kept ≤ 40 with labelled sub-rules.
- **Time to G2 (wall clock, P-01's answering time included):** 15 h 01 min from the change's creation
  to the first G2 approval (2026-11-14 16:41:08 +01:00); 22 h 10 min to the G2 re-approval after the
  revision (23:49:56). G3 followed at 2026-11-15 01:12:12. The plan has 50 tasks.
- **Critic validity (C001-SC-03, blockers and majors, judged by P-01):** no blockers at any gate.
  G1: 9 majors, 9 valid. G2: 10 majors, 10 valid. G3: 7 majors, 7 valid. Minors open at the gate: G2
  nine (six of them fixed by the focused revision), G3 two.
- **Dogfood lint:** `node plugins/architect/scripts/sdd.mjs lint --cwd C:\Sandbox\dogfood\voice-notes`
  ends with exit 0, "0 errors, 0 warnings, 0 info" (LINT-GATE-001 included).

**Findings for the suite**

- The G0 approval committed nothing: the constitution stayed uncommitted until P-01 committed it by hand
  after G2 (`448741a`), and the G1–G3 gate commits do not stage `.sdd/_constitution/`.
- Typing "Approve" alone leaves the Usage cell "unavailable"; the gate dialog has no "Approve with a
  note" choice, so P-01 typed the usage through "Enter something", which the conductor recorded both as
  the words and as the usage.
- A spec revision chosen during the plan phase was recorded as a G2 Revise row followed by a second G2
  approval, as designed; its usage is not separable from the plan's.

## 2026-11-15 — CHG-002 brownfield dogfood figures (C001-T-074, step 1)

CHG-002 ("Multi-platform targets"), taken through G1–G3 in this repository, is the brownfield dogfood of
C001-SC-01 and C001-SC-07. Figures from its Gate log, `approvals.json`, `sdd trace 002` and
`node plugins/architect/scripts/sdd.mjs lint 002`, taken on 2026-11-15.

| Gate | First approval | Gate log rows to date | Current approved hash | Approver |
|---|---|---|---|---|
| G1 (ideation) | 2026-10-14 05:26:18 +02:00, "Approve" | 1 Approved | `sha256:9770ce05…` (16 files, 2026-10-14) | Jerome LACUBE (the registry holds an earlier git identity) |
| G2 (spec) | 2026-10-15 22:48:20 +02:00, "Approve with waivers" | 36 Approved with waivers, 35 Revise | `sha256:49ffb9e3…` (47 files, 2026-11-13) | Jerome LACUBE |
| G3 (plan) | 2026-10-16 15:04:01 +02:00, "Approve" | 39 Approved, 29 Revise | `sha256:0d7582c2…` (109 files, 2026-11-13) | Jerome LACUBE |

- **Revisions:** 140 Gate log rows. After the first G3, defects found while implementing and verifying
  (D-001 onwards) reopened the spec and plan 35 and 29 times; each revision ended in a re-approval.
  The G2 approvals carry the standing waivers (C002-REQ-211, 212, 213, 503 … 507, 601, then DOD-G-01).
- **Size:** 121 REQs at the first G3, 143 today (16 NFRs, 33 US, 82 tasks). Outside the 5–40 range, so
  C001-NFR-106 and C001-SC-08 do not apply and neither does RISK-013's trigger.
- **Tokens:** the Gate log Usage cells read "unavailable"; the upper-bound estimate for G1–G3 is in the
  2026-11-13 entry above (15,203,384 tokens, input + cache creation + output; 457,125,286 with cache
  reads), cited for C001-SC-06.
- **Delta (C001-SC-07):** the requirement Delta fields read 135 ADDED, 11 MODIFIED, 0 REMOVED.
  `sdd lint 002` reports no TR-09 finding: every MODIFIED requirement has its evidence. The lint exits
  1 on 9 LINT-DELTA-001 errors, all in CHG-002 capabilities covered by the standing G2 waivers.
- **Traceability:** `sdd trace 002` reports 100 % for TR-01 … TR-08 and an acyclic task graph (TR-11).
- **Machine configuration (C001-NFR-304):** the only toolchain record is the constitution's
  (`.sdd/_constitution/toolchain.md`, 2026-10-13, at `/architect:init`); it lists tool versions but no
  machine line, so the machine configuration of each CHG-002 phase is "not recorded".

## 2026-11-15 — Superpowers execution on the voice-notes plan (C001-T-074, steps 2–3; C001-TC-621)

- **Record (C001-TC-621):** 2026-11-15, Claude Code 2.1.325, Superpowers 7.0.2 (`superpowers@claude-plugins-official`),
  Architect plugin disabled for the session, model Sonnet 5.5, one session from 02:22:57 to 02:52:44 +01:00, no
  subagents. Repository `C:\Sandbox\dogfood\voice-notes`, branch `chg-001-impl` (created by Superpowers).
- **First task started:** C001-T-001, the first entry of the hand-off's Ordered task list. The session read
  `handoff.md`, then the T-001 … T-003 task files, then started T-001.
- **Questions asked:** none. Missing-info questions (C001-SC-04): **0**. **Result: pass**, with the deviation below.
- **Deviation (P-01, 2026-11-15):** TC-621 step 3 asks for the plain message
  `execute the plan in .sdd/<NNN>-<slug>/20-plan/handoff.md`; P-01 sent it as the argument of
  `/superpowers:executing-plans` with "do T-001 to T-003" appended. C001-T-074 asks for one milestone; P-01
  stopped after T-001 … T-003 of C001-M-01 "Foundations and spikes" (9 tasks), because T-004 … T-009 are GPU
  spikes with multi-GB model downloads, estimated at 1–2M more tokens and 4–8 hours. The C001-SC-04 data
  therefore covers three tasks (sizes M, S, S), not a whole milestone.
- **Outcome:** three commits, one per task (`a120d1f`, `ef5ebbb`, `3e47e2e`); 50 tests passed, 1 skipped (it
  needs the T-009 pin list); `ruff check` and `ruff format --check` clean. The task statuses were then set done
  with the Architect CLI (`0a2aa23`), and `sdd lint --cwd C:\Sandbox\dogfood\voice-notes` ends with 0 errors.
- **Usage:** 126,898 tokens (input 66, cache creation 96,475, output 30,357; cache read 3,448,484 not counted),
  33 assistant messages.
- **Findings:**
  - **D-035 (C001-REQ-617):** the hand-off defines `sdd` as `node <plugin-root>/scripts/sdd.mjs`. With the
    Architect plugin disabled there is no plugin root, so Superpowers could not run `sdd task set` and left the
    three tasks at `todo`. It said so in its final report rather than asking.
  - Superpowers' own task-start and task-done scripts expect "Task N" headings, so it skipped them and kept
    its ledger by hand in a git-ignored `.superpowers/` folder.
  - It listed its own rulings (where test logic lives, licence rows marked "to verify", `.gitignore` order) with
    their cost, which is the kind of decision the plan's task files left open.
