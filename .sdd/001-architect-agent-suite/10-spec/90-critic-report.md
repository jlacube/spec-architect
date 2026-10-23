---
artifact: critic-report
change: CHG-001
phase: 10-spec
reviewed_ids: all
reviewer: "Claude (Opus 5.5), same session as the author — NOT independent (see Limitations)"
---

# Critic report — CHG-001 10-spec

## Limitations

The independent `sdd-critic` agent does not exist yet (it is part of what this spec
defines). This review was done by the authoring session using the rubric of C001-IF-11 and
the prototype checks (`speccheck.py`, `specgen.py`, kept in the session scratchpad). An
author reviewing their own work is exactly the lenience risk IDEA-RK-08 describes.
**Recommendation:** before G2, run one fresh-context reviewer (a subagent given only this
folder and the rubric) as a second opinion.

## Summary

| blocker | major | minor |
|---|---|---|
| 0 | 3 (2 resolved) | 9 (3 resolved) |

## Findings

### CR-1 — Agent-behaviour scenarios had no statistical pass rule
- **Severity:** major
- **Refs:** CAP-02, CAP-03, CAP-10 scenarios at level eval; DOD-G-01
- **Evidence:** scenarios such as C001-TS-206 … 222 assert LLM behaviour, which is non-deterministic; no pass threshold existed — `70-dod.md` DOD-G-01 (before fix)
- **Why it matters:** without a run count and pass rate, these scenarios are either flaky or unverifiable.
- **Suggested fix:** define eval pass rule.
- **Status:** resolved — DOD-G-01 now requires eval-level scenarios to pass in ≥ 9 of 10 runs. The plan's test plan must implement the harness.

### CR-2 — Platform behaviours assumed but unverified
- **Severity:** major
- **Refs:** C001-AS-09 … 12, C001-REQ-201, 1006, 1103, 1105, 1108; IF-07 §1, IF-08 §2, IF-09
- **Evidence:** "[VERIFY]" items in `85-open-items.md` (5) — hook agent identity, plugin manifest fields, Serena launch flags (`--context`, `--mode`), MCP tool names, AskUserQuestion availability for a plugin agent run with `--agent`
- **Why it matters:** if AskUserQuestion is unavailable to a plugin main-session agent (S-05), the conductor design (D-01) changes; if hook input lacks agent identity (S-04), the path guard falls back to a coarser rule.
- **Suggested fix:** schedule spikes S-01 … S-06 as the first plan milestone; fallbacks already specified (C001-REQ-1105, AS-11).
- **Status:** open — accepted as plan input (proposed waiver at G2: none needed; these are not markers).

### CR-3 — Several requirements bundle multiple actions under one SHALL
- **Severity:** major
- **Refs:** C001-REQ-202, 209, 504, 506, 805, 812, 901, 1103
- **Evidence:** e.g. C001-REQ-805 "SHALL set … `status` … `approved_hash` … and append a row … to the Gate log" — `CAP-08-gates/requirements.md`
- **Why it matters:** singular in letter (one SHALL, passes LINT-EARS-002) but not in spirit; a validator may find partial conformance hard to report.
- **Suggested fix:** either split each into atomic requirements, or accept "one observable outcome per requirement" as the singularity rule and document it in the `ears-requirements` skill.
- **Status:** resolved at G2 — P-01: "ok for one groupe of requirements, no need to split". Rule documented in C001-IF-04 §3.1 (one SHALL = one observable outcome, possibly grouping actions verified together).

### CR-4 — Token budget thresholds are estimates
- **Severity:** minor
- **Refs:** C001-NFR-106
- **Evidence:** "≤ 3,000,000 tokens per medium feature; target ≤ 2,000,000" — `30-nfr/nfr.md`
- **Why it matters:** no baseline exists; the threshold may be arbitrary.
- **Suggested fix:** keep as provisional; recalibrate after the first dogfood change (plan task).
- **Status:** open

### CR-5 — Marker rules would have blocked this spec's own gate
- **Severity:** minor
- **Refs:** C001-REQ-716, C001-REQ-720
- **Evidence:** the first open-items generation listed 16 markers that were examples inside code spans and quotes
- **Why it matters:** REQ-720 would have refused G2 for a spec that documents markers.
- **Status:** resolved — both requirements now count markers only outside code spans, quoted strings and fenced blocks; TS-716 extended.

### CR-6 — NFR-202 measurement method was not feasible
- **Severity:** minor
- **Refs:** C001-NFR-202
- **Evidence:** relied on Node's permission model, which does not cover network access in Node 20/22
- **Status:** resolved — method now uses preloaded network stubs.

### CR-7 — Lite profile "one capability" limit has no requirement or rule
- **Severity:** minor
- **Refs:** C001-IF-06 §3, C001-REQ-117
- **Evidence:** "A lite change is limited to one capability." — `50-interfaces/workspace-layout.md`
- **Suggested fix:** add a lint rule (or drop the limit) in a revision; low impact for v1.
- **Status:** open

### CR-8 — Mermaid diagrams are not render-validated
- **Severity:** minor
- **Refs:** `60-architecture/architecture.md` §8, `40-domain/*.md`
- **Why it matters:** syntax errors would only show when rendered.
- **Suggested fix:** render once on GitHub after commit; optional Mermaid CLI check in v1.x (IDEA-§7.7).
- **Status:** open

### CR-9 — No approved constitution for this repository (G0 bypassed in bootstrap)
- **Severity:** minor
- **Refs:** C001-REQ-127, `70-dod.md` §1
- **Evidence:** DOD-G items are defined inside the spec as a stand-in
- **Suggested fix:** plan task: run `/architect:init` on this repository once the suite exists, carrying DOD-G-01 … 07 into the constitution.
- **Status:** open

### CR-10 — Unknown third-party writer in `.sdd/metrics/`
- **Severity:** minor
- **Refs:** C001-REQ-124, `10-context/current-state.md`
- **Why it matters:** another tool writes into `.sdd/`; if it ever writes inside change folders, hashes would change.
- **Suggested fix:** identify the tool (P-01); REQ-124 only covers unknown root entries.
- **Status:** open

### CR-11 — Example IDs collided with this change's prefix
- **Severity:** minor
- **Refs:** C001-TS-411, 916 … 918
- **Evidence:** examples used change-1 requirement numbers 044, 050 and 060 (prefix C001), colliding with real CHG-001 IDs (dangling-reference findings)
- **Status:** resolved — examples now use `C002-…`.

### CR-12 — Prototype check scripts are not in the repository
- **Severity:** minor
- **Refs:** `80-traceability.md`, `85-open-items.md`
- **Why it matters:** the generated files cannot be regenerated by someone else until `sdd trace` exists.
- **Suggested fix:** acceptable for the bootstrap; or commit the prototypes under a non-plugin folder if P-01 wants reproducibility now.
- **Status:** open

## Rubric

| Rubric item | Result |
|---|---|
| Every story has persona, need, outcome, priority, links | pass (prototype check + review) |
| Every requirement EARS-shaped, one SHALL, known system, no weak words | pass (0 findings); see CR-3 on singularity in spirit |
| Every requirement has ACs and scenarios; coverage tables complete | pass (TR-01 … 03 100%) |
| NFRs measurable with method and environment | pass (TR-04 100%); CR-4, CR-6 |
| DoD items checkable with evidence types; all REQ/NFR covered | pass (TR-05 100%) |
| Interfaces registered, machine-readable where a standard exists, parseable | pass (all 4 JSON files parsed with Python `json`; no YAML contract files) |
| Architecture sections, catalogue fields, flows ↔ sequences, constraints | pass; CR-8 |
| Brownfield evidence | n/a: greenfield change |
| Consistency with approved ideation (decisions Q1–Q20, OQ answers, Spec-Q1–Q4) | pass by review: each decision appears in Traces to/Rationale fields |
| No summaries posing as detail; index navigation-only | pass |
| Testability of agent behaviour | CR-1 (resolved) |
| External claims sourced or marked | pass; CR-2 |


## Revision D-012 (2026-10-21)

Scope: `git diff 278ef7d~1 4945599 -- .sdd/001-architect-agent-suite/` (architect 278ef7d, test-designer 73130b7, planner 4945599), against D-012 and Q-ripwire-guard-01. Lint 0. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 2 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-13 | major | C001-IF-07 §3.1, IF-14 §2, TS-1125, REQ-1106 coverage | `--token-budget=N` accepted as a map bound goes beyond P-01's "default map with --max-tokens", IF-14 §2 and the skill ("Never put --token-budget on the ranked map") | `--max-tokens=N` the only map bound; TS-1125 `--token-budget` map row → deny | fixed |
| CR-14 | minor | IF-07 §3.1, TS-1125 | `ripwire --test-gate src/a.ts` (no directory word) is admitted with the file read as the path word; not stated, not pinned | state it in §3.1; TS-1125 row → 0; counts 17 → 18 | fixed |
| CR-15 | minor | IF-07 §3.1, REQ-1003 | the guard checks only presence and digits; the size limit (≤ 4000 tokens, ≤ 50 rows) belongs to REQ-1003 / TS-1004 — not stated for both forms | one sentence in §3.1 | fixed |

All findings of this section fixed (architect, test-designer, planner; T-079 wording aligned by the conductor), 2026-10-21.


## Revision D-014 F-7 and D-015 (2026-10-22)

Scope: `git diff c3895f8 c3e7287 -- .sdd/001-architect-agent-suite/` (spec-writer 7bb3fe6), against D-014 F-7, D-015, Q-cov-node20-01, Q-archive-faults-01. Lint 0. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 1 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-16 | minor | NFR-502, NFR-403, REF-WIN | REF-WIN is defined with Node 20 LTS only; NFR-502 now names Node 22.22.3, pinned to a patch | REF-WIN with "Node 20 LTS and 22 LTS (nvm-windows)"; NFR-502 "REF-WIN, Node 22 LTS (measured with 22.22.3)" | fixed (133ab4e: REF-WIN Node 20 and 22 LTS; NFR-502 Node 22 LTS) |
| CR-17 | major | D-015, REQ-914, REQ-920, T-081, TC-1131 | the archive resume changes user-visible behaviour (exit 0 instead of ERR-CLI-014) but no REQ/AC/TS states it; REQ-914 does not forbid duplicates; TC-1131 borrows TS-915 | one CAP-09 unwanted-behaviour REQ (interrupted archive completes on re-run, same result as one run) with AC and TS; TC-1131, T-081 and D-015 point to it | fixed (133ab4e, a660c2a: C001-REQ-924, AC-924.1, TS-925; TC-1131 and T-081 point to them) |


## Revision D-016 (2026-10-23)

Scope: `git diff 2fa33de 3a19cef -- .sdd/001-architect-agent-suite/10-spec/` (REQ-1116 note, SC-05 link, TS-1117 line), against D-016 and Q-conductor-route-01. Lint 0. Appended by the conductor from the critic's reply (compact form).

| blocker | major | minor |
|---|---|---|
| 0 | 2 | 4 |

| ID | Sev. | Refs | Finding | Suggested fix | Status |
|---|---|---|---|---|---|
| CR-18 | major | REQ-1116 note, TS-1117 | no grading rule for the conductor's must-not-route prompt; "not routed to the conductor" is always true, so it can never fail | rule for any prompt ("routed to the conductor when …"); a conductor must-not-route prompt fails when the reply hands over; matching Then line | REQ-1116 part fixed (note: rule for any prompt; a conductor must-not-route prompt fails when the last reply contains the hand-over literal); TS-1117 Then line: test-designer; TS-1117 line (test-designer) |
| CR-19 | major | TS-1117 | the new Then judges a run, but the When only parses the suite definition | restate as declared checks (last reply contains the literal command; 0 Architect subagent starts), or a new runtime scenario | fixed (TS-1117 restated as declared checks: last-reply literal, 0 Architect subagent starts) |
| CR-20 | minor | TS-1117, REQ-1116 note | "hands the user over" not mechanical; no "fails otherwise" for the no-hand-over, no-subagent case | "passes when the last reply contains the literal `claude --agent architect:sdd-conductor` and no Architect subagent starts; fails otherwise" | fixed in REQ-1116 note (last-reply literal; must-route fails otherwise); TS-1117: test-designer; TS-1117 line (test-designer) |
| CR-21 | minor | REQ-1116 note, REQ-201, IF-09 A0 | "cannot be invoked as a subagent" overstates IF-09 ("not meant to be spawned") | "is not meant to be spawned as a subagent (C001-IF-09 A0)" | fixed (REQ-1116 note uses the IF-09 A0 wording) |
| CR-22 | minor | CAP-11 coverage, REQ-1116 | alternate and error columns still n/a | TS-1117 (conductor hand-over) under alternate; TS-1117 (Architect subagent started) under error | fixed (CAP-11 coverage row: alternate and error cells filled) |
| CR-23 | minor | SC-05 | "≥ 90% correct agent" has no unit (prompts or runs) | "≥ 90% of runs pass all their checks" | fixed (SC-05 Target reworded as suggested) |
