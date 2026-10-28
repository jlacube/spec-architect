---
id: C002-T-052
title: "P-01: release the OpenCode target (deferred to a later version; npm publication moved to C002-T-075)"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: dropped
depends_on: [C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-049, C002-T-051, C002-T-066, C002-T-071]
implements: []
satisfies_ac: [C002-AC-502.1, C002-AC-617.1, C002-AC-619.1]
verified_by: [C002-TS-503, C002-TS-620, C002-TS-622, C002-TC-503, C002-TC-620, C002-TC-622]
components: [C002-COMP-006, C002-COMP-010]
risk_refs: [C002-RISK-036]
estimate: S
report: { commit: null, completed_at: null, notes: "dropped from CHG-002 (P-01 answer to Q-opencode-scope-01, \"Move to a new change (Recommended)\"): the OpenCode release moves to the future CHG-003 \"OpenCode release\", which carries the INJ-21 fix (an OpenCode-capable early stop or a bounded INJ-21 case)" }
---

# C002-T-052 — P-01: release the OpenCode target (deferred to a later version; npm publication moved to C002-T-075)

## Dropped from CHG-002 (revision D-036, plan critic CR-85)

**Dropped.** P-01 answered Q-opencode-scope-01 with "Move to a new change (Recommended)". The OpenCode
release leaves CHG-002 for the future CHG-003 "OpenCode release", which carries the fix and its own
release task. This task does not run in CHG-002, and no CHG-002 task depends on it. The text below
stays as the record of what CHG-003 takes over.

**Before the drop: out of this release round.** P-01 answered Q-opencode-defer-01 with "Defer OpenCode
(Recommended)". OpenCode 0.0.1 and 0.0.2 are refused, because `INJ-21` runs open-ended to any cap
(defects D-035, D-036; C002-T-071, commits c63e702 and 560f8f7). The OpenCode release waits for a fix
of the OpenCode injection rows in a later version (`../10-strategy.md` §2, Deferred: OpenCode,
D-035 and D-036). The fix will be one of two directions: an early stop that works on OpenCode, or a
bounded `INJ-21` gate case. No step of this task runs, and CHG-002 spends no more OpenRouter credit,
until that fix is planned and P-01 gives the go.

**The npm publication is no longer part of this task.** C002-T-075 publishes `architect-sdd@0.0.3`
with the Copilot release. When OpenCode is released later, it is at its own version, and that version
of `architect-sdd` is published first by the steps of C002-T-075 (C002-REQ-509). Step 2 below then
only checks that it is on npm.

The text below is the plan for that later release, with `<version>` the OpenCode release version.

## Intent

Release OpenCode on its own evidence, independently of the Copilot target (C002-REQ-619; Copilot is
C002-T-055). The `architect-sdd` tarball of the same version is on npm **before or together with**
the release, because the generated doctor requires the exact version (C002-REQ-509, C002-ADR-004). The
release channel is the per-target zip in `dist/` (Q-release-01): P-01 shares
`dist/architect-opencode-<version>.zip` as the Claude Code zips are shared today. The rollback and
communication steps belong to `75-rollout.md`.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/opencode/<version>/release.json` | release record written by the release check |
| add | `docs/releases/opencode/<version>/zip.sha256` | one line: SHA-256 and file name of the released zip, for C002-RB-002 |

## Preconditions

- **Deferred** (Deferred, above): this task starts only after the OpenCode fix of a later version
  is planned and its evidence is taken at that version. The OpenCode 0.0.1 and 0.0.2 checks refuse,
  and that evidence stays as it is and is never released. `<version>` below is that later version.
- **C002-T-071 done** (P-01 answer to Q-release-base-01, "Retake after fixes (Recommended)"; plan
  critic CR-71). The release is made from the release-candidate commit that C002-T-071 records, which
  holds the CHG-001 fixes of C001-T-082 and C001-T-083. C002-T-071 re-ran the unpaid release steps
  and the paid OpenCode rows of C002-T-049 step 4 (about 31 sessions, general pool) at that commit.
  That commit and its evidence replace those named below. The unpaid re-runs below are the ones
  C002-T-071 made, unless a later commit moved the release candidate again.
- C002-T-003, C002-T-023, C002-T-047, C002-T-048, C002-T-049, C002-T-051 and C002-T-066 done.
- C002-T-066 step 8 backfilled `result` and `models` into the committed OpenCode injection summary
  (P-01 answer to Q-inj-result-01; C002-DOD-009), and its commits moved the release-candidate commit
  recorded by C002-T-048 (plan critic CR-52). So, before step 1, the unpaid re-runs of C002-T-049
  step 4 are done at the new release-candidate commit: C002-T-048 step 5 and C002-T-049 steps 1 and 2
  (package, tarball check, OpenCode replay). No paid OpenCode row reruns: C002-T-066 changes no file
  the OpenCode package is generated from and no OpenCode session (C002-T-049 step 3, revision
  note). When C002-T-054 has already re-run C002-T-048 step 5 at that commit, its record is used.
- Both generated targets share the one package version of `plugins/architect/.claude-plugin/plugin.json`
  (C002-IF-009 §5 `--version`). If a Copilot injection entry is locked acted upon (C002-IF-010 §5.2
  rule 3; C002-T-054 step 4) and P-01 moves to a new version before this task releases OpenCode,
  OpenCode is released at the new version only, with its evidence taken again at it (C002-T-049
  step 3, about 30 sessions, OpenRouter reserve; then this task); releasing OpenCode at the old
  version first keeps its present evidence.

## Step outline (no production code)

1. Run `node scripts/release-check.mjs --target opencode` at the release-candidate commit. It compares
   the regenerated package with `dist/opencode/` and with the zip (C002-T-047 step 4). The release
   check reads `acted_upon` and the entry count of the injection summary but not `result` or `models`
   (C002-IF-009 §5), so check `docs/releases/opencode/<version>/injection.json` before the release as
   well: every entry gives `result` and `models`, and each `result` names a file that exists under
   `evals/results/` (C002-DOD-009, C002-TS-691). An entry without them stops the release here; the
   backfill is redone through C002-T-066 (reopened), never by editing the summary by hand. Check
   also, from the ledger and the result files, that every OpenCode session of an `INJ-*` row at the
   package version, of any task, whose result document does not pass has an entry that reads acted
   upon (C002-IF-010 §5.2, the done-check of the owning task C002-T-049, done before that rule was
   revised for plan critic CR-53); such an entry is final for the version and the release check
   refuses it (ERR-REL-002).
2. **npm check** (revision D-036): `npm view architect-sdd@<version>` shows the version. If it does
   not, P-01 publishes it first by the steps of C002-T-075, at the same release-candidate commit. This
   task publishes nothing itself.
3. **P-01 step:** release `dist/architect-opencode-<version>.zip` through the channel of
   `75-rollout.md` §1: share the zip as the Claude Code zips are shared, and keep the released zip
   with its `zip.sha256` line (retention for C002-RB-002). The README section and install notes name
   the version.
4. Commit the release record and the `zip.sha256` line.

## Verification

- `npm view architect-sdd version` equals the `plugin.json` version
- The release record validates against `docs/releases/release-record.schema.json`
- The SHA-256 of the shared zip equals the `zip.sha256` line
- `docs/releases/opencode/<version>/injection.json`: every entry gives `result` and `models`, and
  each `result` path exists (read the file; the release check does not read these fields)

## Done when

- [ ] C002-T-048 step 5 and C002-T-049 steps 1 and 2 re-run at the release-candidate commit after C002-T-066, with that commit in the task report
- [ ] Every entry of `docs/releases/opencode/<version>/injection.json` gives `result` and `models`, and each `result` names an existing file under `evals/results/` (C002-DOD-009)
- [ ] Every OpenCode `INJ-*` session at the package version in the ledger whose result document does not pass, a no-run refusal excepted, has an entry that reads acted upon, and every row `INJ-01` … `INJ-22` has an entry (C002-IF-010 §5.2; plan critic CR-53, Q-acted-final-01); the task report lists the sessions checked
- [ ] `architect-sdd@<version>` is on npm (C002-T-075 or its steps) no later than the OpenCode release
- [ ] The near-cap list of C002-T-071's report for `opencode` is "none", or each listed injection row has P-01's cap-exception decision recorded (C002-IF-010 §2.2 Caps of injection rows; plan critic CR-80, spec CR-122)
- [ ] OpenCode release record and released zip recorded, or the refusal recorded
- [ ] Progress reported: `sdd task set C002-T-052 --status done --commit <sha>`
