---
artifact: plan/questions-log
change: CHG-001
phase: 20-plan
status: approved
---

# CHG-001 — Plan-phase questions log

## Round 1 — 2026-10-10

| ID | Question | Options (recommended first) | Answer (verbatim) | Decision record |
|---|---|---|---|---|
| Q-plan-01 | In what order should the suite be built? | Spikes → CLI core → agents → rest (Recommended) · Agent vertical slice first · Thin slice of everything, then deepen | "Spikes → CLI core → agents → rest (Recommended)" | C001-ADR-001 |
| Q-plan-02 | Source language for the sdd CLI? | TypeScript + esbuild (Recommended) · Plain JavaScript ESM + JSDoc types | "TypeScript + esbuild (Recommended)" | C001-ADR-002 |
| Q-plan-03 | How to run agent-behaviour evals given the 9/10 rule (DOD-G-01)? | Tiered: 1 run in dev, 10 at release (Recommended) · 10 runs at every milestone · Release-only evals | "Tiered: 1 run in dev, 10 at release (Recommended)" | C001-ADR-003 |
| Q-plan-04 | Who executes the plan after the hand-off? | Plain Claude Code sessions in this repo (Recommended) · Superpowers executing-plans · Me, continuing in this session | "Plain Claude Code sessions in this repo (Recommended)" | C001-ADR-004 |

Candidates considered but not presented (per the options-analysis method): for Q-plan-01, "CLI only, agents in a later change" (rejected: G-01/G-02 need agents in v1) and "hooks/guards first" (rejected: guards protect agents that do not exist yet); for Q-plan-02, "Python" (rejected: Q18 chose Node.js) and "Deno/Bun single binary" (rejected in OA-12); for Q-plan-03, "no automated agent evals, manual review only" (rejected: C001-SC-05 needs measurement); for Q-plan-04, "Codex CLI" (rejected: no install on the reference machine yet).

No embedded instructions were found in the free text of the answers.

## Round 2 — 2026-10-10 (during G3 review)

| ID | Question | Options (recommended first) | Answer (verbatim) | Decision record |
|---|---|---|---|---|
| Q-plan-05 | Is a Node.js script (requires Node ≥ 20) acceptable for the sdd CLI, or is a standalone binary wanted? | Keep Node script (Recommended) · Node script + optional single .exe (Node SEA or Bun compile) · Rewrite target: Go native binary | "Keep Node script (Recommended)" | Confirms C001-CON-02, C001-ADR-002; no change |

Candidates considered but not presented: Rust native binary (rejected: slowest to build, same trade-offs as Go); Deno compile (rejected in OA-12).

## Round 2026-10-20 — defect D-012 (found in C002-T-048)

### Q-ripwire-guard-01 — Bash guard rule for ripwire vs C001-IF-14
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 3
- **Options:** 1. Allow the IF-14 read-only forms: default map with `--max-tokens`, `--test-gate=<file>`, `--limit`; corpus updated, deny cases kept for anything else (Recommended) · 2. Keep the guard strict, rewrite the code-discovery skill and IF-14 (loses the ranked map) · 3. Defer (known failure for v0.1.0)
- **Answer:** P-01: "Allow read-only forms (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-22 — defect D-014 (found in C001-T-065)

### Q-coverage-01 — Line coverage 79.99% against C001-NFR-502's 85%
- **Options:** 1. Write tests to 85%, and fix the Node 20 packaging filter, the Node 20 test cleanup, the archive fault coverage and the npm run check steps in one catch-up task (Recommended) · 2. Lower NFR-502 to 80% lines · 3. Exclude src/mcp from the measure
- **Answer:** P-01: "Write tests to 85% (Recommended)"

## Round 2026-10-22 — C001-T-080 findings F-6 and F-7 (defects D-014, D-015)

### Q-cov-node20-01 — Node 20's test runner crashes while merging coverage (F-7)
- **Options:** 1. The coverage step measures on Node 22 only and reports skipped on Node 20 with the reason, so all four check runs exit 0 (Recommended) · 2. Keep the step on Node 20 and waive the "exit 0 in all four runs" criterion
- **Answer:** P-01: "Coverage on Node 22 only (Recommended)"
- **Extracted instructions:** none

### Q-archive-faults-01 — archive killed before its folder move (F-6)
- **Options:** 1. Align bench/faults.mjs with C001-NFR-301 (any complete version passes) and log a defect for an archive that resumes without duplicates (Recommended) · 2. Make archive recoverable inside C001-T-080 and keep the stricter bench rule
- **Answer:** P-01: "Align bench, log defect (Recommended)"
- **Extracted instructions:** none

### Q-archive-resume-01 — state the archive resume in the spec (planner, critic CR-17)
- **Options:** 1. Add a CAP-09 requirement with AC and scenario: an interrupted archive completes on re-run with the same result as one uninterrupted run (Recommended) · 2. No spec change; D-015, C001-T-081 and C001-TC-1131 are the record
- **Answer:** P-01: "Add a CAP-09 requirement (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-23 — defect D-016 (found in C001-T-063)

### Q-conductor-route-01 — what "must route" means for the conductor (C001-REQ-1116)
- **Options:** 1. Spec note: the conductor counts as routed when the reply hands the user over to `claude --agent architect:sdd-conductor` and no Architect subagent starts (Recommended) · 2. Exempt the conductor from the per-agent minimum · 3. No spec change
- **Answer:** P-01: "Spec note + accept (Recommended)"
- **Extracted instructions:** none

### Q-eval-delegation-01 — what the delegation evals measure (C001-T-063)
- **Context:** with an empty sandbox 32/36 runs routed; with the material inline the main session did the task itself (0/6). The suite measured willingness to delegate, not which agent the descriptions pick.
- **Options:** 1. Explicit + implicit: every prompt ends with a neutral "Give this to the matching Architect specialist agent" (no agent named), the ≥ 90% target is measured on these; a few implicit cases (no hint) run once and are reported separately (Recommended) · 2. Explicit only · 3. Tune the descriptions ("Use proactively for …") until implicit prompts reach 90%
- **Answer:** P-01: "Explicit + implicit (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-23 — release tier and D-017

### Q-release-tier-01 — release eval tier for C001-T-072 (C001-ADR-003)
- **Context:** 10 runs for every eval scenario (790 runs plus 420 routing runs) costs about 450–1,100 USD notional on the subscription, 9–21 five-hour windows.
- **Options:** 1. Reduced tier: 10 runs (≥ 9/10) for high-risk scenarios (gates, safety, injection, delegation), 3 runs for the rest; target 1 weekly reset, 2 at most (Recommended) · 2. Full tier, 10 runs for every scenario
- **Answer:** P-01: "reduced tier looks good" and "let's stick to reduced tier and target 1 reset maybe 2 maximum"
- **Extracted instructions:** pace by the 5-hour window (≤ 90%); tell P-01 when the weekly usage nears 90% so P-01 can apply a reset

### Q-d017-01 — cartographer blocking judgement (D-017)
- **Options:** 1. Fix now: a question that decides which code paths are in scope is blocking; TS-215 at release tier in C001-T-072 (Recommended) · 2. Defer to a later change, TS-215 waived for v0.1.0
- **Answer:** P-01: "Fix now (Recommended)"
- **Extracted instructions:** none

### Q-dodg01-amend-01 — G0 amendment for the reduced release tier (critic CR-24, CR-25)
- **Options:** 1. Constitution DOD-G-01 states the floor (high-risk ≥ 9/10 of 10; others 3/3, a 2/3 result triggers a 10-run check needing ≥ 9/10; routing ≥ 90% of runs; injection 0 acted upon); each change's ADR classifies high-risk; going below the floor needs a P-01 waiver at the gate; constitution v2 (Recommended) · 2. Keep 9/10 for all and a one-off CHG-001 waiver
- **Answer:** P-01: "Minimums in DOD-G-01 (Recommended)"
- **Extracted instructions:** none

### Q-blocking-scope-01 — which IF-05 §1 criteria to keep (critic CR-26, CR-27)
- **Options:** 1. Scope only (code paths, entry points or components in scope) plus a decidable general rule (blocking when the specialist would otherwise have to state the answer as a fact or an assumption); drop public interface and existing data; a scenario per kept criterion plus a negative scenario (Recommended) · 2. Keep all four criteria, each with a scenario
- **Answer:** P-01: "Scope only + decidable rule (Recommended)"
- **Extracted instructions:** none

## Round 2026-10-24 — defect D-019 (found in C001-T-082)

### Q-t082-bugs-01 — three product issues from the hidden-budget reruns
- **Options:** 1. Fix all three now: the conductor asks a blocking question as soon as its hand-back arrives; template access fixed (reads allowed or one `sdd template show`); "the number of candidates" wording (Recommended) · 2. Fix the conductor and the wording, defer the template loop · 3. Defer all
- **Answer:** P-01: "Fix all 3 now (Recommended)"
- **Extracted instructions:** none

### Q-cap-level-01 — rerun cap for full-flow cases now that the budget is hidden
- **Options:** 1. Raise the rule-1 cap to 3 USD notional (release estimate about 420 USD), measure after the fixes (Recommended) · 2. Keep 1.50 USD
- **Answer:** P-01: "Raise to $3 (Recommended)"
- **Extracted instructions:** none

### Q-noask-01 — conductor without a question tool (found in C002-T-071)
- **Options:** 1. Text fallback: the conductor asks its question or presents the gate as plain text in its reply and ends its turn; Copilot 0.0.3 with its 24 sessions retaken (Recommended) · 2. Harness change only (question tool on with scripted answers) · 3. Pause releases
- **Answer:** P-01: "Text fallback + 0.0.3 (Recommended)"
- **Extracted instructions:** none

## Round 2026-11-08 — defect D-028 (found in CHG-002 revision D-044, plan critic CR-110)

### Q-toy-g3-limit-01 — the resumed cfg-full toy chain stopped at its 30 USD limit before G2 (C001-M-4 item, C001-T-072 step 5)
- **Context:** `evals/results/toy-g3-cfg-full-chain-partial-2026-11-08.json` and commit 2563aa6: 8 sessions, 26.78 USD notional; G1 approved; the spec is drafted with 0 lint errors, and the critic review has 2 major findings open; every review found issues (8 at ideation, 6 at spec), and each fix round takes a full session. The question was asked once for both changes and is logged in CHG-002 too (`.sdd/002-multi-platform-targets/20-plan/questions-log.md`, round 2026-11-08, with a correction note in its strategy on the lint and ideation figures).
- **Options** (as presented by the conductor): 1. Finish cfg-full, defer cfg-bare: raise the cfg-full limit to about 55 USD and resume, about 20–28 USD more, ending near 400–405 USD of the 450 USD stop; this proves a change reaches G3 end to end; cfg-bare is deferred to a follow-up change, and the cost is logged as a major post-release issue (Recommended) · 2. Defer the whole item: stop now and record the partial result; 0.1.0 ships without end-to-end G3 evidence beyond the cfg-no-ripwire dogfood · 3. Finish both configs: raise the limits and the 450 USD stop to about 480 USD, and run both to G3, about 70–80 USD more
- **Answer:** P-01 (2026-11-08, relayed by the conductor): 'Finish cfg-full, defer cfg-bare (Recommended)', option 1
- **Extracted instructions:** the cfg-full limit of 55 USD is a total that includes the 26.78 USD already spent; cfg-bare is not run in CHG-001 or CHG-002; the cost of about 50 USD notional per small lite change to G3 is logged as a major post-release issue (P-01, 2026-11-08, relayed by the conductor)
- **Scope note** (critic CR-40): "cfg-bare is not run" means the toy chain to G3 on cfg-bare; the cfg-bare measurement of C001-NFR-304 is decided by Q-nfr304-bare-01 below.
- **Conductor's note** (CHG-002 plan critic CR-112, not P-01's words): the follow-up change is named "Cost and token efficiency"; the conductor creates it at C001-T-072's close, and its number is recorded once it exists.

### Q-nfr304-bare-01 — no planned run measures C001-NFR-304 on cfg-bare (CHG-001 plan critic CR-40)
- **Context:** C001-NFR-304 (graceful degradation, 100 % of phases on cfg-full, cfg-no-ripwire and cfg-bare; C001-DOD-015) is measured by the dogfood runs of C001-T-074, which do not run on cfg-bare. P-01's cfg-bare deferral of Q-toy-g3-limit-01 was about the toy chain. The conductor asked: "No planned run covers NFR-304's cfg-bare part. Your cfg-bare deferral was about the toy chain. Should this cfg-bare measurement be deferred too?"
- **Options** (as presented by the conductor): 1. Defer it to the follow-up: waive NFR-304's cfg-bare part for 0.1.0 at G2 as a recorded waiver, and move it to the follow-up "Cost and token efficiency" change with the cfg-bare toy chain; no cost now, and T-074 stays as it is (Recommended) · 2. Add cfg-bare to T-074: T-074's dogfood runs on cfg-bare too, adding a full dogfood run (~50 USD notional) and more P-01 time
- **Answer:** P-01 (2026-11-08, relayed by the conductor): 'Defer it to the follow-up (Recommended)', option 1
- **Extracted instructions:** none
- **Conductor's note:** the waiver is recorded at the G2 re-approval as `--waive C001-NFR-304 --waive C001-DOD-015`, only their cfg-bare part being waived; the NFR and DoD texts stay unchanged.

## Round 2026-11-10 — defect D-030 (found by P-01 before the C001-TC-1102 run)

### Q-clean-profile-01 — C001-TS-1102 and C001-NFR-602 need a fresh Windows user profile that REF-WIN cannot provide
- **Context:** C001-TS-1102 (Given "a fresh Windows 11 user profile"), C001-NFR-602 (environment "REF-WIN, fresh user profile", method "clean-profile test (C001-SC-09), timed") and C001-SC-09 need a fresh Windows user profile. P-01 cannot create a new Windows account, and REF-WIN runs Windows 11 Home, so Windows Sandbox is not available.
- **Options** (as presented by the conductor): 1. Isolated Claude profile: in P-01's own account, a PowerShell window where CLAUDE_CONFIG_DIR, HOME, USERPROFILE and APPDATA point at a new empty folder; Claude Code starts clean (no settings, plugins or sign-in); P-01 signs in once, then follows the README timed; the conductor first runs the functional part (marketplace add, install, conductor starts) as an automated check; the caveat goes in the spec: machine-wide tools (Node, Git, ripwire, uv) stay visible, so a missing prerequisite would not show (Recommended) · 2. Isolated profile, minimal PATH: the same, with PATH cut down to Windows, Node, Git and Claude Code · 3. Waive TC-1102 for 0.1.0
- **Answer:** P-01 (2026-11-10, relayed by the conductor): 'Isolated Claude profile (Recommended)', option 1
- **Extracted instructions:** none
- **Conductor's note:** the definition of the isolated Claude profile and its caveat are in C001-SPEC-NFR (after REF-WIN): a process environment, whose manual form is the window `scripts/manual/isolated-profile.ps1` sets up and whose automated form is the child environment of `scripts/manual/isolated-profile-check.mjs` (the functional check of record). D-030 closes when the revision is approved at G2 and G3 and `isolated-profile-check.mjs` has ended with PASS at the commit that carries the approved revision; the C001-NFR-602 timing comes from P-01's timed run and does not hold D-030 open.
- **Correction note** (critic CR-50, 2026-11-10): the close rule in D-030's summary in `change.md` ("the TS-1102 functional check passed in an isolated Claude profile") is made precise by the note above: the PASS counts only at the commit that carries the approved revision; a PASS on an uncommitted tree (the first run, recorded in `docs/release-0.1.0-evidence.md` §3) does not close it.

## Round 2026-11-10 — defect D-031 (P-01's decision on the timed clean-profile runs)

### Instruction 2026-11-10 — waive the timed clean-profile run (C001-NFR-602, C001-TC-1102)
- **Context:** the conductor explained why the timed runs exist (C001-NFR-602, C001-DOD-018; CHG-002 C002-NFR-601) and proposed three options: keep both timed runs (recommended), keep them untimed (spec revision), or waive them for 0.1.0. P-01 argued for validating or waiving: the automated flow took less than 15 minutes, and the total time depends on inference (model, reasoning effort, local or cloud provider), so an absolute measure varies a lot. The conductor recommended a waiver (no P-01 timed record exists to validate against) with an untimed docs walkthrough in the follow-up change.
- **Answer:** P-01 (2026-11-10): "agreed on all points. waive and continue autonomously until you reach some significant that requires my inputs"
- **Extracted instructions:** C001-NFR-602 and the timed part of C001-DOD-018 are waived at the G2 re-approval (`--waive C001-NFR-602 --waive C001-DOD-018`, only the timed part of C001-DOD-018 being waived; its message-catalogue part stays evidence); the NFR and DoD texts stay unchanged, as for Q-nfr304-bare-01; P-01's timed run of C001-TC-1102 is not run; the untimed docs walkthrough moves to the follow-up change "Cost and token efficiency".
- **Conductor's note:** the scripted end-to-end flow (`scripts/manual/isolated-profile-e2e.mjs`, 04ad339) reached the first interview question in 180.6 s machine time, 1.00 USD notional; it is context for the waiver, not a C001-NFR-602 measurement.
- **Close rule** (critic CR-139): D-031 closes at the G2 and G3 approvals of this revision; the README part of C001-SC-09 is deferred with the untimed walkthrough (critic CR-141).

## Round 2026-11-13 — dogfoods kept apart from the Architect repository

### Instruction 2026-11-13 — each dogfood runs in its own repository (C001-T-073, C001-T-074)
- **Context:** a first C001-T-073 attempt created the dogfood change in the Architect repository's own `.sdd/`, as the task text then said ("in this repository", target `.sdd/002-*/**`). The proposed idea, "lint auto-fix suggestions", extends the suite's own lint engine, so it was not greenfield. P-01 had it rolled back to `ff671e5` (no commit had been made). The conductor proposed: Architect's code, tests, fixtures and own SDD changes stay in the Architect repository; each dogfood runs in its own git repository with its own `.sdd/`; Architect's `docs/dogfood.md` holds only a summary entry per run; manual test runs stay under `C:\Sandbox\runs\`; `bench/results/` is ignored; committed `evals/results/` stays where it is because the release evidence cites it.
- **Answer:** P-01 (2026-11-13): "1. Yes" (a separate empty repository for the greenfield dogfood); "1. Yes 2. Yes" (dogfood summaries stay in `docs/dogfood.md`; `evals/results/` stays committed in place); "You gave my go for actions".
- **Extracted instructions:** C001-T-073 and C001-T-074 name their own repository as the target and `docs/dogfood.md` as a summary only; the stale change numbers in their titles (CHG-003, CHG-002) are dropped; `bench/results/` is added to `.gitignore` (`0ee7308`). P-01 still chooses the greenfield idea (T-073) and the target repository (T-074).
- **Correction note** (critic CR-224, 2026-11-13): the extracted instructions above call both dogfood titles stale. Only CHG-003 (T-073) was stale; CHG-002 in T-074's title recorded P-01's decision of 2026-10-13, "CHG-002 = T-074 dogfood (Recommended)", which the conductor's first rewrite reversed without P-01's word. P-01 kept that decision (Q-t074-brownfield-01 below).

### Q-t074-brownfield-01 — CHG-002 stays the brownfield dogfood of C001-T-074? (critic CR-224, blocking)
- **Context:** the first rewrite of C001-T-074 excluded the Architect repository, reversing P-01's decision of 2026-10-13. CHG-002 has 80 of 82 tasks done, so none of its milestones is left for the Superpowers execution of C001-SC-04. The conductor asked: "On 2026-10-13 you decided CHG-002 (multi-platform targets, Architect's own change) is the brownfield dogfood for C001-T-074. My revision excluded the Architect repo from T-074, which reverses that. Which do you want?"
- **Options** (as presented by the conductor): 1. Keep CHG-002: CHG-002 stays the brownfield dogfood; its G1–G3 are already done here. Only T-074's Superpowers milestone run happens outside Architect, in a separate repository. No extra cost. (Recommended) · 2. New brownfield dogfood: replace CHG-002 with a new brownfield change in another existing repository P-01 picks; large task (about 50 USD notional plus P-01's time), superseding the 2026-10-13 decision
- **Answer:** P-01 (2026-11-13): 'Keep CHG-002 (Recommended)', option 1
- **Extracted instructions:** C001-T-074 takes its brownfield figures (C001-SC-01 brownfield half, C001-SC-07 TR-09, C001-NFR-106 usage, C001-NFR-304 configurations) from CHG-002 in the Architect repository, and runs the Superpowers milestone (C001-SC-04, C001-TC-621) on the C001-T-073 dogfood plan in that dogfood's repository; T-074 now depends on T-073.

### Q-t074-usage-01 — how is CHG-002's token usage recorded for the brownfield half? (critic CR-226, reopened)
- **Context:** all of CHG-002's Gate log Usage cells read "unavailable", so C001-DOD-013, C001-NFR-106 and RISK-013's trigger had no brownfield figure. The conductor asked: "The critic re-opened one finding: CHG-002 (the brownfield dogfood you kept) has no recorded token usage. All its Gate log Usage cells say "unavailable", so DOD-013 / NFR-106 (tokens per dogfood change ≤ 3M) can't be checked for the brownfield half. My earlier "No extra cost" didn't mention this. How do we close it?"
- **Options** (as presented by the conductor): 1. Estimate from transcript: sum the tokens in the kept session transcript (since 2026-10-10, subagents included) between CHG-002's ideation start and its first G3 approval, labelled as an upper-bound estimate, CHG-001 work having run in the same session; free, no waiver (Recommended) · 2. Waive the brownfield part: waive the brownfield token part of C001-DOD-013 and C001-NFR-106 for 0.1.0, tokens measured on the greenfield dogfood (T-073) only; needs a G2 re-approval with the waiver, then G3
- **Answer:** P-01 (2026-11-13): 'Estimate from transcript (Recommended)', option 1
- **Extracted instructions:** C001-T-074 step 1 records CHG-002's tokens as an upper-bound estimate from the kept transcripts; C001-T-073 records measured usage per gate with `--usage` from the dogfood repository's own transcripts.
