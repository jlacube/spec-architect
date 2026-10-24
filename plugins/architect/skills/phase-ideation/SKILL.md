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
- Write each brief as the section "Specialist brief" below sets out: change ID, phase and step,
  input paths, IDs to use, output paths, quality bar (skills), return contract. Paths and IDs,
  not pasted content.
- Collect the `questions` blocks as the hand-backs arrive. When a hand-back holding a blocking
  question arrives (the blocking bullet of the sdd-conventions return contract), ask it at once,
  as interview-protocol §2 says: before you end your turn and before any other dispatch, without
  waiting for the other hand-backs.
- **Exit:** every dispatched specialist has handed back; notes and analyses exist.

## Step 4 — Interview

- Run the interview-protocol skill on the questions not yet asked: merge, blocking first, rounds of
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
`[ASSUMPTION: <question-id>]`. Ask a blocking question when its hand-back arrives (step 3), and
always stop at step 8: present the gate and end your turn; never approve.

## Specialist brief

Every dispatch to a specialist, in every phase, uses this brief (C001-REQ-214). Fill every field;
write `none` when a field does not apply. Refer to artifacts by path and ID; never paste their
content. Write every path relative to the repository root, starting with `.sdd/` (for example
`.sdd/004-coupons/10-spec/spec.md`); never an absolute path or a path relative to `.sdd/`. The
only exception is an excerpt of at most 40 lines that states a specific question (C001-REQ-215),
marked as an excerpt with its source path and line range.

```markdown
# Brief — <specialist role>: <one-line task>

- **Change:** CHG-<NNN> "<title>" · profile <full|lite> · kind <greenfield|brownfield|mixed>
- **Phase / step:** <00-ideation|10-spec|20-plan> · step <n> — <step title>
- **Task:** <what to produce and why, 2–6 sentences; the decision or question it serves>
- **Inputs (read these):**
  - `.sdd/<NNN>-<slug>/<path>` — <what to take from it>
  - …
- **IDs to use:** <ID types and blocks, e.g. "allocate REQ and NFR with
  `sdd id next REQ --change <NNN>`; CAP-03 requirements use the 3xx block"; IDs to reference>
- **Outputs (write only these):**
  - `.sdd/<NNN>-<slug>/<path>` — <content expected>
- **Quality bar:** <skills and sections that apply, e.g. "ears-requirements, sdd-conventions
  §Writing rules; C001-IF-03 §5 research-note headings">
- **Constraints:** <scope limits, decisions already taken (DEC/OA IDs), unattended mode if
  active, time or cost limits>
- **Return contract:** final message = Digest (≤ 15 lines, IDs and paths), Written (paths),
  and a `questions` block when P-01 must decide something, each question flagged as the
  blocking bullet of the sdd-conventions return contract says. Do not ask P-01 directly.
```

Checks before dispatching:

- The change ID, phase and at least one input path written as `.sdd/<NNN>-<slug>/…` are present.
- Every output path is inside `.sdd/<NNN>-<slug>/` and is owned by that specialist's role.
- No block of more than 40 consecutive lines copied from any `.sdd/` file.
- Independent briefs of the same step are dispatched together, in one turn.
