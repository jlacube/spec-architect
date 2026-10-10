---
id: C001-SPEC-CTX-01
artifact: spec/context/problem-and-goals
change: CHG-001
phase: 10-spec
status: draft
traces_to: [IDEA-§3, IDEA-§5.1, IDEA-§25]
---

# Problem and goals

## 1. Problem statement

Source: IDEA-§3.3 (approved at G1). Restated here as the normative problem statement of the spec:

> Developers using AI coding agents lack a disciplined, tool-assisted way to turn an idea into a
> specification and plan that is (a) grounded in research and in the real codebase, (b) explicit
> about decisions and their alternatives, (c) detailed and identified enough to be verified
> against the eventual code, and (d) tracked in a workspace any agent can read to know the
> current state. The Architect suite provides that front end as a Claude Code agent suite
> (plugin) that stops at a tool-neutral, traceable hand-off.

## 2. Goals

Each goal is referenced by user stories (`Goals:` field) and measured by a success criterion.

| ID | Goal | Measured by | Ideation trace |
|---|---|---|---|
| C001-GOAL-01 | Turn a raw idea into an approved ideation document through batched, researched, option-based Q&A | C001-SC-03, C001-SC-08 | IDEA-§5.1 G-01 |
| C001-GOAL-02 | Produce a multi-file specification precise enough to verify code against | C001-SC-02 | G-02, Q16 |
| C001-GOAL-03 | Produce a plan precise enough to execute without re-interpreting the spec | C001-SC-04 | G-03 |
| C001-GOAL-04 | Ground brownfield specs in the actual code | C001-SC-07 | G-04, Q3, Q9 |
| C001-GOAL-05 | Make every material decision auditable (alternatives, scores, rationale) | C001-SC-03 | G-05, Q15 |
| C001-GOAL-06 | Keep a machine-readable, always-consistent view of where each change stands, including implementation progress | C001-SC-02, C001-SC-10 | G-06, Q19 |
| C001-GOAL-07 | Hand-off consumable by any implementer (tool-neutral) | C001-SC-04 | G-07, Q6 |
| C001-GOAL-08 | Shareable later: clean plugin packaging, permissive licensing, portable core | C001-SC-09 | G-08, Q4, Q1, Spec-Q2 |

## 3. Success criteria

| ID | Criterion | Method | Target |
|---|---|---|---|
| C001-SC-01 | Real changes driven through G1–G3 with the suite | Dogfood log in this repo | ≥ 2 changes (1 greenfield, 1 brownfield) before v1.0 |
| C001-SC-02 | No lint-passing workspace contains a dangling ID, an orphan requirement or a registry inconsistency | Lint fixture suite (≥ 1 negative fixture per lint rule) | 100% of fixtures detected |
| C001-SC-03 | Critic usefulness | P-01 tallies critic blockers/majors as valid/invalid at each gate | ≥ 70% valid |
| C001-SC-04 | Hand-off portability | Same plan executed by 2 different implementers; count implementer questions/defects tagged `missing-info` against Must requirements | 0 |
| C001-SC-05 | Delegation reliability | `claude plugin eval` suite of ≥ 40 prompts | ≥ 90% correct agent |
| C001-SC-06 | Cost visibility | Per-phase usage recorded in change.md | 100% of phases of dogfood changes |
| C001-SC-07 | Brownfield grounding | Lint rule TR-09 on brownfield dogfood change | 100% MODIFIED/REMOVED REQs with evidence |
| C001-SC-08 | Time to G2 for a medium feature | Dogfood log (wall time excluding P-01 think time) | ≤ 1 working session |
| C001-SC-09 | Clean install | README procedure on a fresh Windows 11 user profile | Succeeds without undocumented steps |
| C001-SC-10 | Registry freshness during implementation | Compare git history vs registry task status at archive time on dogfood changes | 0 tasks `done` in git but not in registry at archive |

## 4. Non-goals

Carried from IDEA-§5.2 (normative for this spec): NG-01 writing production code; NG-02 running
tests/CI on behalf of the implementer; NG-03 reviewing implementation diffs; NG-04 replacing issue
trackers; NG-05 non-Claude-Code runtimes at v1 (portability is designed, not delivered); NG-06 GUI.

Additional non-goals decided during the spec interview:

- C001-NG-07: running CI on remote servers at v1. Workflows for macOS/Linux are authored and
  kept dormant (Spec-Q4).
- C001-NG-08: installing Archify during CHG-001's specification. Architecture is written with
  Mermaid and IR-ready component IDs; Archify outputs are a plan task (Spec-Q3).
