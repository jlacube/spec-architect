---
id: C001-IF-04
artifact: spec/interface
kind: conventions
change: CHG-001
phase: 10-spec
status: approved
---

# C001-IF-04 — ID scheme, EARS shapes, weak words, traceability rules

## §1 ID forms

| Form | Pattern | Example |
|---|---|---|
| Full | `C<NNN>-<TYPE>-<seq>` | `C004-REQ-012` |
| Full AC | `C<NNN>-AC-<req-seq>.<n>` | `C004-AC-012.1` |
| Short (inside a change folder) | `<TYPE>-<seq>` / `AC-<req-seq>.<n>` | `REQ-012`, `AC-012.1` |
| Change | `CHG-<NNN>` | `CHG-004` |
| Persona | `P-<nn>` (spec-local, not workspace-unique) | `P-01` |
| Defect | `D-<nnn>` (change-local) | `D-001` |
| Question | `Q-<phase-word>-<nn>` | `Q-spec-03` |
| Critic finding | `CR-<n>` (report-local) | `CR-3` |

`<seq>` is a positive integer written with at least two digits (`01`) for GOAL, SC, NG, AS,
CON, CAP, INV and M, and at least three digits (`012`) for the other types. Sequence
**blocks** per capability are allowed (e.g. CAP-01 uses 101–199). The ideation-era
references `IDEA-§n`, `Q<n>`, `OQ-<n>`, `OA-<n>`, `D-<n>` (derived decisions) and `Spec-Q<n>`
are citation labels, not workspace IDs; the lint resolves them against the approved ideation
document of the change and does not apply TR-12 to them.

## §2 ID types

| Type | Meaning | Defined in |
|---|---|---|
| GOAL | Goal | `10-context/problem-and-goals.md` |
| SC | Success criterion | same |
| NG | Non-goal | same |
| AS | Assumption | `10-context/scope.md` |
| CON | Constraint (scope or architecture) | `10-context/scope.md`, `60-architecture/constraints.md` |
| CAP | Capability | capability folder `stories.md` frontmatter |
| US | User story | `stories.md` |
| REQ | Functional requirement | `requirements.md` |
| AC | Acceptance criterion | `acceptance.md` |
| TS | Test scenario | `acceptance.md` gherkin titles |
| NFR | Non-functional requirement | `30-nfr/` |
| INV | Domain invariant | `40-domain/domain-model.md` |
| IF | Interface | `50-interfaces/README.md` |
| ERR | Error code family (catalogue rows use codes such as `ERR-CLI-007`) | `50-interfaces/errors.md` |
| COMP | Component | `60-architecture/architecture.md` |
| DEC | Decision | `00-ideation/decisions/` |
| ADR | Architecture decision | `20-plan/20-decisions/` |
| OA | Option analysis | `00-ideation/options/`, `20-plan/20-decisions/` |
| R | Research note | `00-ideation/research/` |
| M | Milestone | `20-plan/10-strategy.md` |
| T | Task | `20-plan/50-tasks/` |
| TC | Test case | `20-plan/60-test-plan.md` |
| RISK | Risk | `20-plan/70-risks.md` |
| RB | Rollback step | `20-plan/75-rollout.md` |
| DOD | Definition-of-done item | `10-spec/70-dod.md`; global items `DOD-G-<nn>` in the constitution |

## §3 EARS shapes (keywords case-insensitive; `<sys>` = a system name)

| Pattern | Shape (regular expression over the normalised statement) |
|---|---|
| ubiquitous | `^THE <sys> SHALL( NOT)? .+` and none of WHEN/WHILE/IF/WHERE before `THE` |
| event-driven | `^WHEN .+, THE <sys> SHALL( NOT)? .+` |
| state-driven | `^WHILE .+, THE <sys> SHALL( NOT)? .+` |
| unwanted-behaviour | `^IF .+, THEN THE <sys> SHALL( NOT)? .+` |
| optional-feature | `^WHERE .+, THE <sys> SHALL( NOT)? .+` |
| complex | a sequence of two or more prefixes from {`WHILE .+,`, `WHEN .+,`, `WHERE .+,`} followed by `THE <sys> SHALL( NOT)? .+`; or `IF .+, THEN THE …` preceded by `WHILE .+,` |

`<sys>` is the longest glossary system name (C001 glossary-delta §2, project glossary or
COMP names) matching the text between `THE` and `SHALL`; if none matches, rule
`LINT-EARS-003` warns.

### §3.1 Singularity rule (decided at G2, 2026-10-10)

A requirement is singular when its Statement contains exactly one `SHALL` (checked by
`LINT-EARS-002`) and that `SHALL` describes **one observable outcome**. The outcome may be
made of several grouped actions that are verified together (for example C001-REQ-805:
setting the approval fields and appending the gate-log row is one "approval recorded"
outcome). Requirements whose actions can succeed or fail independently must be split. The
critic checks the outcome criterion; the lint checks only the keyword count.

## §4 Weak-word list (LINT-WORD-001)

Single words (whole-word, case-insensitive): `fast`, `quick`, `quickly`, `easy`, `easily`,
`simple`, `flexible`, `robust`, `user-friendly`, `intuitive`, `appropriate`, `adequate`,
`sufficient`, `efficient`, `seamless`, `optimal`, `minimal`, `maximal`, `several`, `various`,
`some`, `etc`, `and/or`, `normally`, `usually`, `typically`, `approximately`.
Phrases: `as needed`, `if possible`, `as appropriate`, `where possible`, `as soon as possible`,
`support for` (when not followed by a named interface or format), `state of the art`.

Exempt: text inside backticks, double quotes, fenced code blocks and gherkin `Examples`
tables.

## §5 Traceability rules

| Rule | Check | Severity | Phase |
|---|---|---|---|
| TR-01 | Every US lists ≥ 1 REQ, and each listed REQ lists the US back | error | spec |
| TR-02 | Every REQ lists ≥ 1 US and ≥ 1 AC | error | spec |
| TR-03 | Every AC has ≥ 1 TS | error | spec |
| TR-04 | Every NFR has Metric, Threshold and Method | error | spec |
| TR-05 | Every REQ and NFR is covered by ≥ 1 DOD item (directly, via capability, or via a global DoD rule) | error | spec |
| TR-06 | Every REQ is implemented by ≥ 1 T | error | plan |
| TR-07 | Every T links ≥ 1 REQ/AC and ≥ 1 TS/TC | error | plan |
| TR-08 | Every TS maps to ≥ 1 TC | error | plan |
| TR-09 | MODIFIED/REMOVED REQs carry evidence (path, symbol, layer) | error | spec (brownfield) |
| TR-10 | Every non-removed COMP realizes ≥ 1 REQ/NFR | warn | spec |
| TR-11 | Task DAG acyclic and all `depends_on` resolve | error | plan |
| TR-12 | No dangling references | error | all |
| TR-13 | No duplicate definitions; no resurrected tombstones | error | all |
| TR-14 | High-impact RISK has a mitigation task or explicit acceptance | warn | plan |
| TR-15 | Touched hotspots appear in RISK | warn | plan |
