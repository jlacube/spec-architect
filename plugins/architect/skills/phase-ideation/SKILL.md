---
name: phase-ideation
description: Procedure of the ideation phase (00-ideation) of an SDD change — entry checks (constitution gate G0), restating the idea, parallel research and discovery, interview rounds, options and decisions, the ideation document with its required sections, readiness review and gate G1. Use when starting or continuing the ideation of a change.
---

# Ideation phase (00-ideation)

Goal: understand the *why* and the *what*, and decide the approach, before any requirement is
written. Run the steps in order; plan them as your task list (one task per step, titles as below).
Each step lists its entry and exit criteria; do not start a step whose entry criteria fail.

Files (full profile): `00-ideation/ideation.md`, `questions-log.md`, `research/R-*.md`,
`options/OA-*.md`, `decisions/DEC-*.md`, `evidence/` (brownfield or mixed), `critic-report.md`.
Lite profile: `ideation.md` and `questions-log.md` only; research, options and decisions become
sections of `ideation.md`.

## Step 1 — Check entry

- **Constitution (gate G0).** Read the frontmatter of `.sdd/_constitution/constitution.md`. If
  its `status` is not `approved`, or the file is missing, do not start: reply that
  `_constitution/constitution.md` is unapproved (or missing) and that `/architect:gate
  constitution` approves it (`/architect:init` drafts a missing one). Dispatch no specialist,
  write nothing, and stop.
- **Change.** The change folder exists (`sdd change new`), its status is `active` and
  `phases.00-ideation.status` is `not-started`, `draft` or `in-revision`. If the phase is
  `in-review` or `approved`, say so and propose the next action instead (the gate, or
  `/architect:specify`).
- **Start.** When the phase is `not-started`, set `phases.00-ideation.status: draft` in
  `change.md` (and `phase: 00-ideation`), then run `sdd status --write`.
- **Exit:** entry checks passed; phase `draft` or `in-revision`.

## Step 2 — Restate the idea

- Read what P-01 gave (the change title, the conversation, any linked document). Restate the
  idea in 3–6 sentences: problem, who has it, desired outcome.
- List the ambiguities and unknowns. Those only P-01 can settle become questions
  (interview-protocol); the rest become research or discovery topics for step 3.
- Show the restatement in the message that introduces the interview round, and ask the
  blocking questions the research depends on as one interview round (interview-protocol); ask
  P-01 to correct the restatement through that round if needed. Do not end your turn to wait for
  a confirmation in plain text. With no blocking question, go straight to step 3.
- **Exit:** restatement shown; blocking questions answered; topics for research, discovery and
  options.

## Step 3 — Research and discovery

- Dispatch in **one turn** (they have no input dependency on each other):
  - `sdd-researcher` — prior art, libraries, standards, competitor patterns for the topics;
    notes `research/R-<seq>-<slug>.md`.
  - `sdd-cartographer` — for brownfield or mixed changes: the baseline survey
    `evidence/baseline-survey.md` (languages, size, test layout, build commands), feasibility,
    affected areas and a blast-radius preview. Skip for greenfield.
  - `sdd-options-analyst` — the initial option space for the 1–3 key decisions;
    `options/OA-<seq>-<slug>.md`.
- Write each brief with the brief template (`references/brief-template.md`): change ID, phase
  and step, input paths, IDs to use, output paths, quality bar (skills), return contract.
  Paths and IDs, not pasted content.
- Wait for all hand-backs; collect their `questions` blocks.
- **Exit:** every dispatched specialist has handed back; notes and analyses exist.

## Step 4 — Interview

- Run the interview-protocol skill on the collected questions: merge, blocking first, rounds of
  at most four, options with the recommendation first, log every round, list extracted
  instructions.
- New topics raised by the answers go back to step 3 (only the specialist concerned).
- Repeat until no blocking question remains and the readiness items of step 7 can pass, or P-01
  stops the interview (remaining questions become Open questions with an owner).
- **Exit:** no unasked blocking question; every round logged.

## Step 5 — Decide

- For each material decision: an options analysis (`OA-*`, options-analysis skill), presented
  as a question; P-01's answer recorded as `decisions/DEC-<seq>-<slug>.md` with headings
  Context, Decision, Options considered, Consequences, Decided (date, decider, words
  verbatim).
- **Exit:** every key decision has a DEC record or is an Open question with an owner.

## Step 6 — Write the ideation document

Write `ideation.md` with these sections, in this order (C001-REQ-313; `LINT-IDE-001` checks a
full-profile document):

1. **Document control** — change ID, version, date, status, authors, approver.
2. **Problem statement** — one paragraph, observable symptoms, who is affected.
3. **Q&A decision record** — one line per answered question: ID, question, answer (link the
   questions log).
4. **Goals and non-goals** — numbered, measurable where possible.
5. **Scope boundary** — in scope, out of scope, later.
6. **Research index** — `R-*` notes with one-line conclusions.
7. **Options and decisions index** — `OA-*` and `DEC-*` with the chosen option.
8. **Design direction** — the approach the spec will detail; no requirements yet.
9. **Risks** — risk, likelihood, impact, mitigation.
10. **Assumptions** — each with `[ASSUMPTION: <question-id or text>]`.
11. **Open questions** — each with an owner and the phase that must settle it.
12. **Sources** — every external source cited, with retrieval date.

Link, don't summarise: the indexes point to the notes; facts live in their own artifact.
- **Exit:** all twelve sections present; `sdd lint <NNN> --phase 00-ideation` reports no error.

## Step 7 — Readiness review

- Dispatch `sdd-critic` for the ideation readiness review (`critic-report.md`) and `sdd-auditor`
  for lint and trace (`sdd trace <NNN> --write`), in one turn.
- Readiness: problem statement, goals, non-goals, scope boundary and key decisions present;
  every open question answered or deferred with an owner; no `blocker` finding open.
- Fix findings (or ask P-01 about them) and re-run until ready.
- **Exit:** no open blocker; lint without errors.

## Step 8 — Gate G1

- Run `sdd gate show <NNN> 00-ideation`, set `phases.00-ideation.status: in-review`, and present
  the gate with the gate-protocol skill: the summary, what approval commits to, and the choices
  Approve, Approve with waivers, Revise, Stop.
- Run `sdd gate approve` only after P-01 chose Approve (or Approve with waivers) in this
  session, with P-01's answer verbatim as `--note`. Revise returns to the step concerned
  (`sdd gate record … --decision revise`).
- **Exit:** the phase is `approved`; propose `/architect:specify <NNN>`.

## Unattended drafting

When P-01 asked for unattended drafting of this phase, follow interview-protocol §8: apply the
recommended option to non-blocking questions and mark each dependent statement
`[ASSUMPTION: <question-id>]`. Stop and ask on any blocking question, and always stop at step 8:
present the gate and end your turn; never approve.
