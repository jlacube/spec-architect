---
sdd_version: 1
workspace: .sdd
generator: architect-plugin@0.0.1
id_scheme: "C{NNN}-{TYPE}-{seq}"
---
# Spec-Driven Development workspace

This folder holds the specifications for this repository. **Agents: read this file first.**

## How to orient yourself (agents)
1. Read `registry.json` → find changes whose status is not `archived`.
2. For the change you work on, read `NNN-slug/change.md` (phase, gate state, open defects).
3. Respect phase order: `00-ideation` → `10-spec` → `20-plan`. Never consume an artifact whose
   `status` is not `approved` (or whose approval hash no longer matches its content).
4. Current system truth lives in `_living/` (empty until a change is archived); per-change deltas live in change folders.
5. Project rules: `_constitution/constitution.md` (not yet written — created by `/architect:init` once the suite exists).

## If you are implementing a change
Read `NNN-slug/20-plan/handoff.md` and report progress as described there.

## Conventions
- IDs: US, REQ, AC, TS, NFR, INV, IF, ERR, COMP, CON, DEC, ADR, T, TC, RISK, DOD, M (full form `C001-REQ-012`).
- Status: not-started → draft → in-review → approved → (stale | in-revision) → archived.
- Markers: `[NEEDS CLARIFICATION: …]`, `[ASSUMPTION: …]`, `[WAIVED: <gate> <reason>]`.
- Full conventions: `001-architect-agent-suite/00-ideation/ideation.md` §11–§13.

<!-- sdd:status:begin -->
| Change | Title | Phase | Status | Tasks done | Open defects | Updated |
|---|---|---|---|---|---|---|
| 001 | Architect agent suite | 20-plan | in-revision | 61/65 | 1 | 2026-10-28 |
| 002 | Multi-platform targets | 20-plan | in-revision | 66/73 | 4 | 2026-10-28 |
<!-- sdd:status:end -->
