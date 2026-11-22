---
id: "C005-ADR-001"
artifact: plan/adr
change: "CHG-005"
phase: 20-plan
status: accepted
---
# C005-ADR-001 — Skill that holds the new-change procedure

## Context and problem

CHG-005 moves the new-change procedure (size estimate, new-change round, `sdd change new` with both options) out of
`plugins/architect/commands/new.md`, where only `/architect:new` reaches it (E-10, E-11), so that every create-change
request runs it (C005-REQ-101, C005-REQ-102, C005-REQ-123, C005-REQ-124). C005-CON-06, which applies C001-CON-15,
requires the procedure to exist once, in one skill that the conductor preloads, with `commands/new.md` and the
conductor's operating loop referring to it. It leaves the choice of skill to this ADR. Without a decision the
implementer picks the skill alone, and two plausible picks either change an interface outside the approved spec or put
a conductor-only procedure into every agent.

Forces:

1. **Preloaded skills are a contract.** C001-IF-09 A0 fixes the conductor's seven skills (sdd-conventions,
   interview-protocol, options-analysis, gate-protocol, phase-ideation, phase-spec, phase-plan).
   `tests/integration/cap02/TS-219.test.ts:27` and `tests/integration/cap02/agents-if09.test.ts:43` pin the list. The
   interface registry of the approved spec holds no delta to C001-IF-09, and DOD-G-04 requires agents to match their
   contracts.
2. **Reachability on both hosts.** Copilot maps the `Skill` tool to nothing (`plugins/architect/targets/copilot.json`,
   `tools.Skill: []`), and both target generators inline an agent's preloaded skills into its body (C002-DEC-002;
   `agent_fields.skills: "inline"` in `copilot.json` and `opencode.json`). On Copilot only a preloaded skill reaches the
   conductor, which is why C005-CON-06 asks for one.
3. **Size budgets.** Constitution, NFR defaults, Skill size: at most 24,000 characters per SKILL.md body and 64,000 per
   agent (C005-DOD-004; `tests/integration/cap02/skills-portability.test.ts:16`). On the targets, TGT-SIZE-001
   (C002-REQ-110, C002-NFR-104) caps the skills inlined into one agent at 64,000 characters. C002-DEC-002 estimated the
   conductor's inlined skills at 46,000–51,000 characters; at `b51cc34` the seven skills hold 804 lines. The procedure
   is about 1,500 characters today (`commands/new.md:10-21`), and an estimated 2,500–3,500 with the kind rule of
   C005-REQ-123 and C005-REQ-124 and the decline handling.
4. **Shared text without a mapping change** (C005-CON-07; E-8). A skill names a Claude Code tool only in its "Claude
   Code wiring" section (C001-REQ-1118, PLG-PORT-001, `skills-portability.test.ts:17-21`). The leak list of
   `tests/integration/cap01/constructs.test.ts:335-342` enumerates every body line that names `AskUserQuestion`.
5. **Line-pinned tests** (E-9). Pinned lines: `interview-protocol` 126 (`tests/integration/cap01/wiring.test.ts:159`),
   `gate-protocol` 99 (`wiring.test.ts:275`), `sdd-conventions` 13 (`wiring.test.ts:202`), conductor 19, 46, 60, 61 and
   66 (`wiring.test.ts:203`; `constructs.test.ts:163-164`, `:278-279`, `:336-337`, `:364`), `commands/new.md` 8
   (`constructs.test.ts:160-161`). `phase-ideation` has no pinned line. Its tests require exactly eight
   `## Step <n> — <title>` headings (`tests/integration/cap03/ideation-skill.test.ts:20-24`), from which the conductor
   builds its phase task list (C001-REQ-219).
6. **One procedure, two doors.** Phase commands load the phase skill that the conductor preloads (C001-REQ-204;
   `tests/integration/cap02/TS-205.test.ts:28-34`). `/architect:new` calls the same procedure as a request in plain
   words (ideation §8).

Placements that C005-CON-06 excludes are not candidates: the conductor's agent body, and the text left in
`commands/new.md` for the conductor to read.

## Considered options

Analysis: section "Options analysis" below, five candidates. In this lite change the analysis is a section of the ADR
file; its headings are those of the options-analysis skill.

1. **A — `phase-ideation`, section "New change" outside the step series** (recommended, 4.45): no contract change, no
   pinned line moved in the skill, at the entry of the first phase.
2. **B — `interview-protocol`, new section before its wiring section** (3.65): no contract change, but the skill says
   how to ask, not what to do on a create request, and the section moves the line-126 pin.

Rejected: C — `gate-protocol` (3.25); D — new skill `new-change` preloaded by the conductor (3.20); E —
`sdd-conventions` (2.65). Reasons: Options analysis, Rejected.

## Decision outcome

Chosen: **A**. The skill `phase-ideation` holds the new-change procedure as one section headed `## New change`, which
is not a numbered step. `commands/new.md` keeps its lines 1–8 and replaces its steps 2–4 with an instruction to load the
`phase-ideation` skill and run that section with the title and, when given, `--kind`. The conductor's operating loop
gets one item that sends every create-change request to the same section. A is the only candidate that changes no
contract and moves no pinned line in its host skill; it reaches both hosts through the existing inlining, and it sits
where a change begins, since Step 1 of the skill already expects the folder that `sdd change new` creates (E-12). A
leads B by 0.80: no near tie.

Accepted by P-01 on 2026-11-17: Q-adr001-01, answer "Accept phase-ideation (Recommended)" (`../questions-log.md`,
Round 1).

## Consequences

Good:

- C005-CON-06 is met with no interface delta: C001-IF-09 A0 keeps its seven skills, and the tests of force 1 stay as
  they are.
- C005-CON-07 holds: the section uses only constructs that the mapping tables already translate, and it reaches the
  Copilot and OpenCode conductors through the inlining of C002-DEC-002. `$ARGUMENTS` stays on line 8 of
  `commands/new.md`.
- The section is the one text of C005-REQ-101, C005-REQ-102, C005-REQ-123 and C005-REQ-124 behind both doors, as
  C001-REQ-204 has it for the phase commands. The eval cases of flow F5 (C005-TS-101 to C005-TS-107, C005-TS-158 to
  C005-TS-163, C005-TS-173, C005-TS-174) test both doors against it.

Bad, and how the plan handles it:

- `phase-ideation` (167 lines; 9,296 characters at C001-T-083) and the conductor's inlined total grow by the procedure
  text, an estimated 2,500–3,500 characters, besides the D-034 text of interview-protocol §5. By these estimates both
  stay inside the budgets of force 3; C005-DOD-004 and TGT-SIZE-001 (`npm run check`) measure them on the release
  commit.
- The skill's scope widens from the ideation phase to creating a change and its ideation, so its `description` must
  name the section. Two misreadings are possible: running the section as an ideation step, or going on into Step 1
  without `/architect:ideate`. A heading outside the `## Step` series guards against the first. Against the second,
  the section ends as step 5 of `commands/new.md` ends today: reply with the change ID, folder and profile and propose
  `/architect:ideate <NNN>`. The F5 eval cases detect both.
- Wording rules for the section: it names no Claude Code tool (it refers to the interview-protocol skill and to the
  question tool of the host), so the tests of force 4 keep their expected lists; it uses no `$ARGUMENTS`.

Affected components: C005-COMP-002 (`phase-ideation`), C005-COMP-003 (`commands/new.md`), C005-COMP-001 (the
operating-loop item). Affected constraints: C005-CON-06 (this ADR names its skill), C005-CON-07; C001-CON-15. No new
constraint follows.

Follow-up for the plan:

- One task moves the text: the section and the `description` of `phase-ideation`, steps 2–4 of `commands/new.md`, and
  the operating-loop item of the conductor. The same task updates the conductor pins of force 5 that its added lines
  move (lines 46, 60, 61 and 66; line 19 lies above the loop), as ideation §9 sets for every text edit. The pins of
  `interview-protocol` line 126 (D-034) and of `commands/archive.md` line 15 (`constructs.test.ts:280-281`, `:340`;
  archive-task exemption of C005-COMP-003) move with those tasks, not with this decision.
- That task's checks: `skills-portability.test.ts`, `ideation-skill.test.ts`, `tests/integration/cap08/TS-813.test.ts`,
  `TS-205.test.ts` (PLG-DUP-001: no command shares more than 10 consecutive lines with an agent body) and the target
  structure check (TGT-SIZE-001) pass.

## Options analysis

### Problem

Which skill holds the new-change procedure that C005-REQ-101, C005-REQ-102, C005-REQ-123 and C005-REQ-124 make the
conductor run on every create-change request. It is decided now because the plan's text task edits that skill and its
tests. Binding: C005-CON-06 (one preloaded skill), C005-CON-07 (no mapping change), C001-CON-15, C001-IF-09 A0, the
constitution's skill size limits and C005-DOD-004. Out of scope: placements outside skills (excluded by C005-CON-06),
the procedure's wording (set by the spec) and the sdd CLI, which stays unchanged (Q-newchange-01). "Defer" is no
candidate: C005-REQ-101 is a Must of this change.

### Criteria

| Criterion | Weight (%) | Scores high when |
|---|---|---|
| Contract fit | 30 | no interface or approved artifact changes (C001-IF-09, the approved spec, DOD-G-04) |
| Cohesion | 25 | the host skill's stated purpose covers creating a change, so the procedure is where its description points (C001-CON-15) |
| Low misfire risk | 15 | only the conductor reads the text, and its trigger, a create-change request (C005-TS-103), is plain in its context |
| Low size impact | 15 | few characters added to the context of agents: the conductor's 64,000 budget and every other agent (force 3) |
| Low test churn | 15 | few pinned lines or content tests to update (force 5) |

### Candidates

- **A — `phase-ideation`**: a section `## New change` outside the step series of the first phase's skill; the obvious
  default and the smallest edit.
- **B — `interview-protocol`**: a new section before its "Claude Code wiring" section.
- **C — `gate-protocol`**: a new section beside "1. Entry conditions".
- **D — new skill `new-change`**: its own `SKILL.md`, added to the conductor's `skills` field.
- **E — `sdd-conventions`**: a new section of the skill that all ten agents preload.

Searched: the seven skills of C001-IF-09 A0 and a new skill. `phase-spec` and `phase-plan` start after G1 or G2, when
the change already exists, and `options-analysis` holds a method, not a procedure; each would be a weaker variant of C.

### Scores

| Candidate | Contract fit | Cohesion | Low misfire risk | Low size impact | Low test churn | Weighted |
|---|---|---|---|---|---|---|
| A — phase-ideation | 5 | 4 | 4 | 4 | 5 | 4.45 |
| B — interview-protocol | 5 | 2 | 4 | 4 | 3 | 3.65 |
| C — gate-protocol | 5 | 1 | 4 | 4 | 2 | 3.25 |
| D — new skill new-change | 1 | 5 | 5 | 4 | 2 | 3.20 |
| E — sdd-conventions | 5 | 1 | 1 | 1 | 4 | 2.65 |

- **Contract fit.** A, B, C and E are already preloaded by the conductor (C001-IF-09 A0): no interface changes. D
  changes the conductor's `skills` field, a delta to C001-IF-09 that the approved spec does not hold; it needs a
  10-spec revision and a new G2, or DOD-G-04 fails, and the tests of force 1 pin the seven skills.
- **Cohesion.** D 5: one skill, one purpose. A 4: Step 1 of `phase-ideation` already expects the change folder (E-12),
  and creating the change opens its phase, but the skill's description must widen. B 2: interview-protocol says how to
  ask (collect, merge, shape, log), while the procedure also estimates size and runs `sdd change new`. C 1: gates close
  phases. E 1: sdd-conventions holds rules for every agent, not a conductor procedure.
- **Low misfire risk.** D 5: a dedicated skill whose description is the trigger. A, B and C 4: only the conductor
  preloads each, and the operating-loop item names the trigger, but the text sits among other rules. E 1: all ten
  agents read it, and the specialists that hold Bash could run `sdd change new`, which the bash guard allows.
- **Low size impact.** A to D 4: the same text added once, to the conductor only (D adds one `## Skill:` heading in
  the generated agents). E 1: the text is inlined into all ten generated agents on both targets and preloaded by all
  ten on Claude Code, about ten times the characters.
- **Low test churn.** A 5: no pinned line in `phase-ideation`, and its content tests hold with a heading outside the
  step series. E 4: appended after line 13, the section moves no pin; the inlining tests check only variant text. B 3:
  the section must precede the wiring section, so it moves the line-126 pin, which the D-034 edit of §5 moves anyway.
  C 2: it moves the line-99 pin of a skill this change does not otherwise edit. D 2: `TS-219.test.ts`,
  `agents-if09.test.ts` and the skill list of `skills-portability.test.ts` change.

The conductor pins of force 5 move under every candidate, since C005-CON-06 asks for an operating-loop reference; they
do not separate the candidates.

### Sensitivity

A scores at least as high as B and C on every criterion, so no change of weights ranks either above A. The one
candidate a plausible reweighting lifts is D: it ranks first when contract fit falls to 10 % and test churn to 5 %, the
freed weight going to cohesion and misfire risk (weights 10/45/25/15/5: D 4.30, A 4.15). That weighting fits only if
CHG-005 reopened 10-spec for another reason, so that the C001-IF-09 delta could join a revision already under way. The
plan has no such revision.

### Presented

1. A — `phase-ideation` (Recommended), 4.45
2. B — `interview-protocol`, 3.65

### Recommendation

A, `phase-ideation`: the only candidate with no contract change and no pinned line moved in its host skill, placed at
the entry of the first phase. No near tie: A leads B by 0.80.

### Rejected

- C — `gate-protocol`: gates close phases, and the section would move the line-99 pin of a skill this change does not
  otherwise edit.
- D — new skill `new-change`: the cleanest scope, but it changes the conductor's preloaded skills (C001-IF-09 A0), an
  interface delta outside the approved spec that needs a 10-spec revision and a new G2.
- E — `sdd-conventions`: it puts a conductor-only procedure into all ten agents, multiplies its size on both targets,
  and shows the specialists that hold Bash an instruction to run `sdd change new`.
