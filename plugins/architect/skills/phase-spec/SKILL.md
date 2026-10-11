---
name: phase-spec
description: Procedure of the specification phase (10-spec) of an SDD change — entry checks (G1 approved and not stale), author sequencing (spec-writer, test-designer, architect, cartographer), traceability, lint, critique, clarification rounds and gate G2. Use when starting or continuing the specification of a change.
---

# Specification phase (10-spec)

Goal: define **what** the system shall do, verifiably, without prescribing implementation
beyond architecture-level constraints. Run the steps in order; plan them as your task list (one
task per step, titles as below). Do not start a step whose entry criteria fail.

Files (full profile, C001-IF-06): `00-index.md`, `10-context/`, `20-capabilities/CAP-<nn>-<slug>/
{stories,requirements,acceptance}.md`, `30-nfr/`, `40-domain/`, `50-interfaces/`,
`60-architecture/`, `70-dod.md`, `90-critic-report.md`; generated `80-traceability.md` and
`85-open-items.md`. Lite profile: `spec.md` (sections Context, Stories, Requirements, Acceptance
with coverage table, NFRs, Domain notes, Interfaces, Architecture notes) and `dod.md`, one
capability only.

## Step 1 — Check entry

- Read `change.md`. The predecessor `00-ideation` must be `approved` and not `stale` (run
  `sdd stale check <NNN>` first). Otherwise do not start: reply naming `00-ideation` and its
  status, and propose `/architect:revise ideation <NNN>` (content must change) or re-approval
  through `/architect:gate ideation <NNN>` (content accepted as is). Dispatch no specialist,
  write nothing, and stop.
- `phases.10-spec.status` must be `not-started`, `draft` or `in-revision`; if `in-review` or
  `approved`, say so and propose the next action.
- **Start.** When `not-started`, set `phases.10-spec.status: draft` and `phase: 10-spec` in
  `change.md`, then run `sdd status --write`.
- **Exit:** predecessor approved and current; phase `draft` or `in-revision`.

## Step 2 — Capabilities and stories

- Dispatch `sdd-spec-writer`: from the approved ideation, write `10-context/` (problem and goals,
  stakeholders and personas, scope, current state), the capability list in `00-index.md`, and
  `stories.md` per capability. Brownfield or mixed: dispatch `sdd-cartographer` in the same turn
  for the current-state evidence the context needs.
- Briefs per the brief template (`phase-ideation/references/brief-template.md`): change ID,
  phase and step, input paths, ID blocks (CAP-nn → story and requirement numbers nn01…), output
  paths, quality bar (user-stories, sdd-conventions), return contract.
- Interview on the returned questions (interview-protocol) before step 3 when they are blocking.
- **Exit:** every capability has stories; no unasked blocking question.

## Step 3 — Requirements and NFRs

- Dispatch `sdd-spec-writer` per capability (independent capabilities in one turn):
  `requirements.md` in EARS form (ears-requirements), and `30-nfr/` with a metric, threshold
  and method per NFR (nfr-catalogue). Brownfield: every MODIFIED or REMOVED requirement cites
  cartographer evidence; dispatch `sdd-cartographer` in the same turn for it.
- **Exit:** every story has at least one requirement; every NFR has a metric and a method.

## Step 4 — Acceptance and DoD

- Dispatch `sdd-test-designer` for each capability whose requirements are written (in one
  turn for independent capabilities): `acceptance.md` with `AC-<req-seq>.<n>` and gherkin
  scenarios titled with TS IDs, the coverage table, and `70-dod.md` inheriting the constitution
  defaults (acceptance-scenarios, dod-catalogue).
- Independent of step 5: dispatch step 4 and step 5 work in the same turn.
- **Exit:** every requirement has at least one AC with at least one scenario; coverage table
  complete.

## Step 5 — Domain, interfaces and architecture

- Dispatch `sdd-architect`: `40-domain/` (domain model, state machines, glossary delta),
  `50-interfaces/` (contracts that parse: JSON Schema, OpenAPI, CLI, events) and
  `60-architecture/` (architecture narrative, constraints, Mermaid views; as-is and to-be for
  brownfield) — diagramming, architecture-decisions skills.
- **Exit:** every interface is parseable; components carry IDs referenced by requirements.

## Step 6 — Trace and lint

- Dispatch `sdd-auditor`: `sdd trace <NNN> --write` and `sdd lint <NNN> --phase 10-spec`;
  report counts and the findings per file.
- Route each finding to the author who owns the file; re-run until lint reports 0 errors.
- **Exit:** lint 0 errors; matrix and open items generated.

## Step 7 — Critique and clarify

- Dispatch `sdd-critic` (`90-critic-report.md`). Resolve `blocker` findings with the owning
  author; ask P-01 about each `[NEEDS CLARIFICATION: …]` marker (interview-protocol) and apply
  the answers. Re-run step 6 after changes.
- **Exit:** no open blocker; no unresolved clarification marker (or a waiver P-01 will decide
  at the gate).

## Step 8 — Gate G2

- Run `sdd gate show <NNN> 10-spec`, set `phases.10-spec.status: in-review`, and present the gate
  with the gate-protocol skill: the summary, what approval commits to, and the choices Approve,
  Approve with waivers, Revise, Stop.
- Run `sdd gate approve` only after P-01 chose Approve (or Approve with waivers) in this
  session, with P-01's answer verbatim as `--note`. Revise returns to the step concerned.
- **Exit:** the phase is `approved`; propose `/architect:plan <NNN>`.

## Unattended drafting

When P-01 asked to draft the spec unattended ("draft the spec unattended, I'll review at the
gate"), follow interview-protocol §8:

- Apply the recommended option to each non-blocking question, log it, and pass the question IDs
  to the authors with the instruction to mark every statement that depends on one with
  `[ASSUMPTION: <question-id>]`.
- Run `sdd trace <NNN> --write` before the gate so `85-open-items.md` lists every assumption.
- **Stop on a blocking question:** ask it (an interview round) before dispatching any further
  author.
- **Stop at the gate:** present G2 (step 8) and end your turn. Unattended mode never approves and
  never records a gate decision.
