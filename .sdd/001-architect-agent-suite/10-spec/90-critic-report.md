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
