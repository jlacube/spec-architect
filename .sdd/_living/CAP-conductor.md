---
capability: conductor
inventory_only: false
updated: 2026-11-16
---

# Conductor and interview (`C001-CAP-02`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The main-session agent that drives a change through ideation, specification and planning, runs the
batched option-based interview with P-01, and delegates to the specialist agents. The capability is
prompt content (Markdown), not TypeScript.

## Entry points

- Agent `plugins/architect/agents/sdd-conductor.md`, started as the main session
  (`claude --agent architect:sdd-conductor`).
- Commands `plugins/architect/commands/new.md`, `status.md`.

## Main modules

- `plugins/architect/agents/sdd-conductor.md`.
- Skills `plugins/architect/skills/interview-protocol/` (with
  `references/questions.schema.json`), `sdd-conventions/`, `gate-protocol/`.
- Questions schema contract `C001-IF-05`, mirrored in `tests/unit/evals/questions.test.ts`.

## Owning tests

- `tests/integration/cap02/` (`TS-204`, `TS-205`, `TS-219`, `TS-220`, `agents-if09.test.ts`,
  `skills-portability.test.ts`).
- Evals (model-in-the-loop): `evals/cap02/` (`TS-201` … `TS-222`, `interview.mjs`, `drafting.mjs`).

## Evidence

- **E-1** `plugins/architect/agents/sdd-conductor.md:1` › - — the conductor agent definition (main entry point).
  - layer: grep (git ls-files, description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `plugins/architect/skills/interview-protocol/SKILL.md:1` › - — interview protocol skill with the questions schema as a reference.
  - layer: grep (git ls-files) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `tests/integration/cap02/agents-if09.test.ts:1` › - — checks agent frontmatter against the `C001-IF-09` contract.
  - layer: grep (git ls-files) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name

## Requirements

### C001-REQ-201 — Conductor as main-session agent
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL provide the agent `sdd-conductor`, defined per C001-IF-09 §A0, that runs as the main session when started with `claude --agent architect:sdd-conductor`.
- **Rationale:** Q5, D-01
- **Stories:** C001-US-201
- **Priority:** Must
- **Acceptance:** C001-AC-201.1

#### C001-AC-201.1 — Conductor starts as main session
```gherkin
Scenario: C001-TS-201 — launch the conductor
  Given the plugin "architect" is installed from the local marketplace
  When P-01 runs "claude --agent architect:sdd-conductor" in "fx-bootstrap"
  Then the session's active agent is "architect:sdd-conductor"
  And the tool AskUserQuestion is available in that session
```

### C001-REQ-202 — Orientation before the first reply
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor starts in a repository that contains `.sdd/`, THE conductor SHALL read `SDD.md`, `registry.json` and the `change.md` of every non-archived change before its first reply, and state each such change's phase, phase status and proposed next action in that reply.
- **Rationale:** IDEA-§14.3 operating loop step 1
- **Stories:** C001-US-201
- **Priority:** Must
- **Acceptance:** C001-AC-202.1

#### C001-AC-202.1 — First reply is an orientation report
```gherkin
Scenario: C001-TS-202 — orientation on a workspace with two changes
  Given "fx-bootstrap" extended with change "002" in phase "00-ideation" status "draft"
  When the conductor session starts and P-01 says "hi"
  Then the transcript shows Read calls on ".sdd/SDD.md", ".sdd/registry.json", ".sdd/001-*/change.md", ".sdd/002-*/change.md" before the first reply
  And the first reply names "CHG-001" with phase "10-spec" and "CHG-002" with phase "00-ideation", each with a next action
```

### C001-REQ-203 — No workspace
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the conductor starts in a repository without `.sdd/`, THEN THE conductor SHALL propose `/architect:init` as its only next action.
- **Rationale:** G0 precedes all phases
- **Stories:** C001-US-201
- **Priority:** Must
- **Acceptance:** C001-AC-203.1

#### C001-AC-203.1 — Missing workspace leads to init proposal only
```gherkin
Scenario: C001-TS-203 — no .sdd present
  Given the fixture "fx-empty"
  When the conductor session starts and P-01 says "let's spec a feature"
  Then the reply proposes "/architect:init"
  And the transcript contains no Write call and no Agent call
```

### C001-REQ-204 — Phase commands share the phase skills
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL provide the commands `/architect:ideate`, `/architect:specify` and `/architect:plan`, each of which loads the same phase skill (`phase-ideation`, `phase-spec`, `phase-plan`) that the conductor preloads for that phase.
- **Rationale:** OA-01 option C (one procedure, two doors)
- **Stories:** C001-US-202
- **Priority:** Must
- **Acceptance:** C001-AC-204.1, C001-AC-204.2

#### C001-AC-204.1 — Commands exist
```gherkin
Scenario: C001-TS-204 — command inventory
  When the plugin's command list is inspected
  Then it contains "/architect:ideate", "/architect:specify" and "/architect:plan"
```

#### C001-AC-204.2 — Same phase skill behind both doors
```gherkin
Scenario: C001-TS-205 — phase skill identity
  Given the definitions of "sdd-conductor" and of the command "/architect:specify"
  When the plugin structure check reads both definitions
  Then the conductor's "skills" list contains "phase-spec"
  And the command body loads the skill "phase-spec"
  And no phase procedure text is duplicated between the command body and the conductor body (checked by the plugin lint rule "PLG-DUP-001")
```

### C002-REQ-211 — Round size on the host's question tool
- **Source:** CHG-002, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor asks P-01 for input, THE conductor SHALL use the question tool of its host (AskUserQuestion on Claude Code, `question` on OpenCode, `askQuestions` in the Local session type of VS Code and `ask_user` in Copilot CLI for the Copilot target package) with at most four questions per call.
- **Rationale:** C002-GOAL-03; ideation §8 (Interviews and gates); defect D-051: the T-050 findings pass of 2026-11-11 on VS Code 1.145.2 refuted fact F-5 of spike S-08 (`docs/spikes/S-08-copilot-vscode.md §3.2`, found on VS Code Insiders 1.142), which named `ask_user` as the question tool of the local agent host: VS Code's question tool is `vscode_askQuestions`, reference name `askQuestions`, legacy names `vscode_askQuestions` and `vscode/askQuestions` (VS Code's tool metadata as read in the T-050 findings pass; `vscode/askQuestions` is nevertheless the only tools entry that grants the tool on VS Code 1.145.2, rechecked by every checklist run, C002-TS-216), while `ask_user` is a Copilot CLI tool; with `ask_user` alone in the conductor's tools every round fell back to plain text (C002-REQ-312), and with `askQuestions` and `vscode/askQuestions` added to a scratch tools list the dialogs worked, a request of five questions included (calls of four and one); defect D-054 (C002-T-050 binding run of 2026-11-11, VSC-14: `askQuestions` alone did not grant the tool; `vscode/askQuestions` does; C002-REQ-312); the Copilot target package therefore lists `ask_user`, `askQuestions` and `vscode/askQuestions` in the tools lists of the conductor and of the prompt files (C002-IF-001 §6.1, C002-IF-005 §3; Copilot CLI's acceptance of `vscode/askQuestions`: C002-IF-001 §6.1); no host documents a limit, so the four-question round stays Architect's own rule (C002-R-001 C-05, A-06, Implications); every round counts, the archive confirmation of `commands/archive.md:15` included (current-state E-28; tool name in bodies: C002-REQ-118); unchanged on Claude Code
- **Stories:** C002-US-204, C002-US-304
- **Priority:** Must
- **Acceptance:** C002-AC-211.1
- **Evidence:** current-state E-26 — `plugins/architect/skills/interview-protocol/SKILL.md:119` › `Claude Code wiring` (one AskUserQuestion call, 1–4 questions; layer: grep); current-state E-24 — `plugins/architect/agents/sdd-conductor.md:7` › `tools` (AskUserQuestion granted to the conductor; layer: grep); baseline survey E-1 and E-6 (same files, counts)

#### C002-AC-211.1 — Rounds of at most four questions on each host's tool
```gherkin
@eval
Scenario Outline: C002-TS-215 — round size on Claude Code and OpenCode
  Given the conductor on <host> needs answers to <n> questions of one interview topic in "fx-bootstrap"
  When the conductor asks P-01 for them
  Then the transcript shows <calls> call(s) of "<tool>"
  And no call carries more than 4 questions
  Examples:
    | host        | n | calls       | tool            |
    | Claude Code | 4 | 1           | AskUserQuestion |
    | OpenCode    | 4 | 1           | question        |
    | OpenCode    | 5 | at least 2  | question        |
```

```gherkin
@manual-vscode
Scenario: C002-TS-216 — round size in VS Code
  Given the "tools" list of ".github/agents/sdd-conductor.agent.md", and of the prompt file when the step runs one, names "ask_user", "askQuestions" and "vscode/askQuestions"
  And the conductor in VS Code needs answers to 5 questions of one interview topic
  When the conductor asks P-01 for them
  Then each question dialog comes from a "vscode_askQuestions" call of the conductor
  And no "vscode_askQuestions" call shows more than 4 questions
```

In the VS Code Local session type the question tool is `askQuestions` (`vscode_askQuestions`);
`ask_user` is the question tool of Copilot CLI (defect D-051; C002-IF-001 §6.1). Revised for defect
D-054: in the C002-T-050 binding run of 2026-11-11 (VS Code 1.145.2, GitHub Copilot Chat 0.73.0),
tools lists that named only `ask_user` and `askQuestions` offered no question tool and the rounds
fell back to plain text (`VSC-14`); with `vscode/askQuestions` in the list the dialog came from a
`vscode_askQuestions` call. The tools lists therefore name all three, and this scenario checks it
(checklist step `VSC-18`).

### C001-REQ-206 — Option presentation
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor asks a question with options other than the gate question of C001-REQ-802, THE conductor SHALL present two or three options, each with a one-sentence rationale, with the recommended option listed first and labelled "(Recommended)".
- **Rationale:** Q14, Q15; the gate question keeps its four fixed choices without a recommendation so that approval stays P-01's unprompted decision (defect D-002)
- **Stories:** C001-US-203
- **Priority:** Must
- **Acceptance:** C001-AC-206.1

#### C001-AC-206.1 — Options shape
```gherkin
Scenario: C001-TS-207 — option count and ordering
  When the conductor asks any optioned question other than a gate question
  Then each question has 2 or 3 options
  And exactly the first option's label ends with "(Recommended)"
  And every option has a non-empty description
```

### C001-REQ-207 — Options grounded in analysis
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN a question concerns a material decision (one that changes scope, architecture, an interface, an NFR threshold or a dependency), THE conductor SHALL derive the presented options from an options analysis of four or five candidates, recorded per C001-IF-05 with the rejected candidates and their reasons.
- **Rationale:** Q15; the user's stated decision method
- **Stories:** C001-US-203
- **Priority:** Must
- **Acceptance:** C001-AC-207.1

#### C001-AC-207.1 — Material decisions carry 4–5 candidates
```gherkin
Scenario: C001-TS-208 — options analysis behind a material question
  Given a question tagged material (e.g. choice of persistence technology)
  When the conductor presents it
  Then the questions-log entry for it records "candidates_considered" of 4 or 5
  And it lists every non-presented candidate under "rejected" with a reason
```

### C001-REQ-208 — Specialists return questions
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN a specialist agent needs information that only P-01 can provide, THE specialist SHALL return a `questions` block conforming to C001-IF-05 in its final message instead of assuming an answer.
- **Rationale:** OA-10, IDEA-P-06
- **Note:** `blocking` is set per C001-IF-05 `questions.md` §1 (D-017; Q-d017-01).
- **Stories:** C001-US-204
- **Priority:** Must
- **Acceptance:** C001-AC-208.1, C001-AC-208.2

#### C001-AC-208.1 — Researcher returns a questions block
```gherkin
Scenario: C001-TS-209 — specialist cannot decide licensing preference
  Given a research brief whose answer depends on P-01's budget for paid APIs
  When the researcher finishes
  Then its final message contains a JSON block valid against C001-IF-05
  And that block has a question with "blocking": true about the budget
  And the research note does not state a budget as fact
```

#### C001-AC-208.2 — Blocking flag follows C001-IF-05 §1
```gherkin
Scenario: C001-TS-223 — cartographer flags an entry-point scope question as blocking
  Given the C001-TS-215 brownfield fixture with two checkout entry points, "src/checkout/totals.ts" (web) and "src/kiosk/totals.ts" (in-store kiosk)
  And its approved lite ideation, whose Design direction reads "A coupon service validates codes; checkout applies the discount before tax."
  When P-01 tells the conductor "Draft the spec of CHG-001 unattended, I'll review at the gate." and the conductor dispatches the cartographer
  Then the cartographer's final message contains a questions block valid against C001-IF-05
  And that block has a question with "blocking": true whose question text or option labels contain both "web" and "kiosk" (case-insensitive)
```
Note: eval-level scenario, run against the real cartographer like C001-TS-215; the expected flag follows the scope criterion of C001-IF-05 `questions.md` §1, which holds even when the cartographer surveys both entry points (D-017).

```gherkin
Scenario: C001-TS-224 — no specialist flags a naming preference as blocking
  Given the C001-TS-223 fixture, with the ideation's Design direction reading "A coupon service validates codes; the web checkout applies the discount before tax. The kiosk checkout is out of scope."
  And the ideation's Open questions section reading "Should the new module be named 'coupons' or 'promotions'? No file or interface depends on the name yet."
  When P-01 tells the conductor "Draft the spec of CHG-001 unattended, I'll review at the gate."
  Then the transcript up to the session's last result message holds at least one specialist hand-back
  And every fenced block in a specialist hand-back whose opening line is "```json questions" parses as JSON
  And no question in any specialist hand-back's questions block whose question text or option labels contain both "coupons" and "promotions" (case-insensitive) has "blocking": true
  And every such question has "blocking": false
```
Note: eval-level scenario, run against the real specialists like C001-TS-215. A specialist hand-back belongs to one Agent call from the conductor to one of the nine specialists of C001-REQ-217. It is the text of the last assistant message with non-empty text among the messages whose `parent_tool_use_id` is that Agent call. When none of those messages has text, it is the text of that Agent call's tool result, unless the tool result is a launch notice. A launch notice is a tool result whose text contains "Async agent launched"; it is never a hand-back. A questions block is a fenced JSON block holding a `questions` key: a fence whose opening line starts with "```json", with or without the name "questions", and whose content parses as a JSON object with a `questions` key. This is wider than the fence named "questions" in the description of `questions.schema.json` (C001-IF-05), so a block returned without the name is still checked. A fence named "questions" whose content does not parse fails the scenario; an unnamed "```json" fence that does not parse is not a questions block. A questions block that parses but is invalid against C001-IF-05, for example `{ "questions": [] }`, does not by itself fail this scenario; its naming questions, if any, are checked like any other. Validity against C001-IF-05 is checked by C001-TS-209 and C001-TS-223. The naming question meets no criterion of C001-IF-05 `questions.md` §1: it decides no code path, entry point or component in scope, and no specialist has to state the name as a fact or an assumption. Any specialist may raise it, or none; the scenario does not require the cartographer to be dispatched or to raise it (D-018).

### C001-REQ-209 — Merge and order questions
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor holds questions from more than one specialist, THE conductor SHALL merge questions with the same `topic` and intent into one, and order rounds so that every question with `blocking: true` is asked before any non-blocking question.
- **Rationale:** OA-10; IDEA-§15.4
- **Note:** Merging and ordering cover the questions the conductor holds when it forms a round; they are no reason to wait for specialists that are still running (C001-IF-05 `questions.md` §2; C001-REQ-221; D-019).
- **Stories:** C001-US-204
- **Priority:** Must
- **Acceptance:** C001-AC-209.1

#### C001-AC-209.1 — Duplicates merged, blocking first
```gherkin
Scenario: C001-TS-210 — merging questions from two specialists
  Given the researcher returned {topic:"auth", blocking:false} and the cartographer returned {topic:"auth", blocking:true} with the same intent
  And the options-analyst returned {topic:"storage", blocking:false}
  When the conductor forms round 1
  Then round 1 contains one "auth" question marked blocking, ordered before the "storage" question
```

### C001-REQ-210 — Questions log
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN P-01 answers an interview round, THE conductor SHALL append to the phase's `questions-log.md` the round number, date, each question with its options and recommendation, and P-01's answer verbatim, including free text.
- **Rationale:** auditability; IDEA-§11.2
- **Stories:** C001-US-206
- **Priority:** Must
- **Acceptance:** C001-AC-210.1

#### C001-AC-210.1 — Verbatim log
```gherkin
Scenario: C001-TS-211 — free text answer logged verbatim
  When P-01 answers round 2 question 3 with "1 + search for other tools we might have missed"
  Then "questions-log.md" contains a "Round 2" section with question 3, its options, its recommendation
  And the answer field contains exactly "1 + search for other tools we might have missed"
```

### C001-REQ-211 — Embedded instructions in answers
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF an answer contains text beyond the selected option label, THEN THE conductor SHALL list each additional instruction it extracted, with its interpretation, in its next message to P-01.
- **Rationale:** C001-US-205 evidence from this session
- **Stories:** C001-US-205
- **Priority:** Must
- **Acceptance:** C001-AC-211.1

#### C001-AC-211.1 — Extracted instructions are confirmed
```gherkin
Scenario: C001-TS-212 — embedded instruction surfaced
  When P-01 answers "Mermaid now (Recommended) but also keep IR-ready IDs"
  Then the conductor's next message lists an item equivalent to "keep IR-ready component IDs" with how it will be applied
```

### C001-REQ-212 — Unattended mode assumptions
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** optional-feature
- **Statement:** WHERE P-01 has requested unattended drafting for the current phase, THE conductor SHALL apply the recommended option to each non-blocking question and mark each resulting statement in the artifacts with `[ASSUMPTION: <question-id>]`.
- **Rationale:** OQ-16
- **Stories:** C001-US-207
- **Priority:** Should
- **Acceptance:** C001-AC-212.1

#### C001-AC-212.1 — Assumptions are marked
```gherkin
Scenario: C001-TS-213 — unattended drafting
  Given P-01 said "draft the spec unattended, I'll review at the gate"
  And 3 non-blocking questions were pending
  When the spec draft is produced
  Then each statement derived from those 3 questions carries "[ASSUMPTION: <question-id>]"
  And "85-open-items.md" lists the 3 assumptions
```

### C001-REQ-213 — Unattended mode stops at gates and blockers
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** state-driven
- **Statement:** WHILE unattended drafting is active, THE conductor SHALL stop and wait for P-01 when it reaches a gate or a question with `blocking: true`.
- **Rationale:** IDEA-P-14; gates are never automatic
- **Note:** The conductor reaches a question with `blocking: true` when the specialist hand-back that holds it arrives, and asks it then per C001-REQ-221 (C001-IF-05 `questions.md` §2; critic CR-34).
- **Stories:** C001-US-207
- **Priority:** Must
- **Acceptance:** C001-AC-213.1, C001-AC-213.2

#### C001-AC-213.1 — Stops at the gate
```gherkin
Scenario: C001-TS-214 — unattended mode never approves
  Given unattended drafting is active for the spec phase
  When the spec draft passes lint
  Then the conductor presents the G2 gate summary and ends its turn
  And "change.md" phase "10-spec" status is not "approved"
```

#### C001-AC-213.2 — Stops on a blocking question
```gherkin
Scenario: C001-TS-215 — blocking question interrupts unattended mode
  Given the C001-TS-223 fixture and its approved lite ideation
  And P-01 told the conductor "Draft the spec of CHG-001 unattended, I'll review at the gate."
  And the spec-writer is still running when the cartographer's hand-back, holding a question with "blocking": true, arrives
  When the conductor receives that hand-back
  Then an AskUserQuestion call that carries the blocking question occurs after the arrival and before the conductor's turn ends
  And no Agent call occurs between the arrival and that AskUserQuestion call
```
Note: eval-level scenario, run against the real specialists. The terms "hand-back", "arrives", "still running", "carries" and "the conductor's turn ends", and the "Given not met" rule for runs where the Given does not hold, are those of the note under C001-AC-221.1. The blocking question comes from the real cartographer, which flags the web-or-kiosk scope question as blocking under the scope criterion of C001-IF-05 `questions.md` §1 (see C001-TS-223; D-017). The Then follows C001-IF-05 `questions.md` §2 (D-019).

### C001-REQ-214 — Specialist brief content
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor dispatches a specialist, THE conductor SHALL include in the brief the change ID, phase, input file paths, ID blocks to use, output file paths, the quality references (skills/sections) that apply and the expected return contract.
- **Rationale:** predictable outputs; IDEA-§14.3
- **Stories:** C001-US-208
- **Priority:** Must
- **Acceptance:** C001-AC-214.1

#### C001-AC-214.1 — Brief completeness
```gherkin
Scenario: C001-TS-216 — dispatch brief fields
  When the conductor dispatches the spec-writer for CHG-004
  Then the Agent call prompt contains: "CHG-004", "10-spec", at least one input path under ".sdd/004-", the ID blocks, the output paths, the skill names to apply and the return contract
```

### C001-REQ-215 — Paths, not contents
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE conductor SHALL reference workspace artifacts in specialist briefs by file path and ID rather than by pasting their content, except for excerpts of at most 40 lines needed to state a specific question.
- **Rationale:** cost control (IDEA-§19)
- **Stories:** C001-US-208
- **Priority:** Should
- **Acceptance:** C001-AC-215.1

#### C001-AC-215.1 — No pasted artifacts
```gherkin
Scenario: C001-TS-217 — brief size discipline
  When the conductor dispatches any specialist
  Then no contiguous excerpt longer than 40 lines of any ".sdd/" file appears in the Agent call prompt
```

### C001-REQ-216 — Parallel dispatch
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN two or more specialist tasks of a phase step have no input dependency on each other, THE conductor SHALL dispatch them in the same turn.
- **Rationale:** latency; IDEA-§10.3 fan-out
- **Stories:** C001-US-208
- **Priority:** Should
- **Acceptance:** C001-AC-216.1

#### C001-AC-216.1 — Independent fan-out in one turn
```gherkin
Scenario: C001-TS-218 — ideation fan-out
  Given a brownfield ideation start
  When the conductor dispatches the researcher, cartographer and options-analyst
  Then the three Agent calls occur in the same assistant turn
```

### C001-REQ-217 — Spawn allowlist
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE `sdd-conductor` definition SHALL restrict agent spawning to the nine `sdd-*` specialists through an `Agent(...)` allowlist in its `tools` field.
- **Rationale:** IDEA-§14.2
- **Stories:** C001-US-208
- **Priority:** Must
- **Acceptance:** C001-AC-217.1

#### C001-AC-217.1 — Allowlist in definition
```gherkin
Scenario: C001-TS-219 — conductor spawn allowlist
  When "agents/sdd-conductor.md" frontmatter is parsed
  Then "tools" contains "Agent(" listing exactly the nine sdd specialists
```

### C001-REQ-218 — No nesting below specialists
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE definitions of the nine specialist agents SHALL NOT grant the `Agent` tool.
- **Rationale:** predictable cost and question routing (IDEA-§14.2)
- **Stories:** C001-US-208
- **Priority:** Must
- **Acceptance:** C001-AC-218.1

#### C001-AC-218.1 — Specialists cannot spawn
```gherkin
Scenario: C001-TS-220 — no Agent tool in specialists
  When the frontmatter of the nine specialist definitions is parsed
  Then none of their "tools" lists contains "Agent"
```

### C001-REQ-219 — Visible phase plan
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** state-driven
- **Statement:** WHILE a phase is in progress in a conductor session, THE conductor SHALL keep the phase procedure steps with their status in the session task list (`TaskCreate`, `TaskUpdate`) when the session provides the task tools, and otherwise list the steps with their status in its message at each step change.
- **Rationale:** transparency for P-01
- **Stories:** C001-US-201
- **Priority:** Should
- **Acceptance:** C001-AC-219.1

#### C001-AC-219.1 — Todo list maintained
```gherkin
Scenario: C001-TS-221 — visible phase plan
  Given a conductor session started with CLAUDE_CODE_ENABLE_TODO_TOOLS=1
  When the conductor starts the spec phase
  Then the transcript contains TaskCreate calls whose subjects include the phase-spec procedure steps
  And later TaskUpdate calls mark completed steps
```

### C001-REQ-220 — Interview fatigue guard
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor is about to start a sixth interview round within one phase, THE conductor SHALL include an option to resolve all remaining non-blocking questions with their recommended options.
- **Rationale:** IDEA-RK-10
- **Stories:** C001-US-209
- **Priority:** Should
- **Acceptance:** C001-AC-220.1

#### C001-AC-220.1 — Shortcut offered at round six
```gherkin
Scenario: C001-TS-222 — fatigue guard
  Given five interview rounds have been completed in the ideation phase
  And non-blocking questions remain
  When the conductor prepares round six
  Then round six includes an option to resolve remaining non-blocking questions with recommendations
```

### C001-REQ-221 — Ask a blocking question when its hand-back arrives
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN a specialist hand-back that holds a question with `blocking: true` arrives, THE conductor SHALL ask that question through AskUserQuestion before it ends its turn and before it dispatches another specialist.
- **Rationale:** D-019 item 1; Q-t082-bugs-01; C001-IF-05 `questions.md` §2
- **Note:** Applies with and without unattended drafting (C001-REQ-213); specialists that are still running continue, and their later questions go to a later round (C001-IF-05 `questions.md` §2). When the session offers no question tool, the question is asked as plain text per C001-REQ-222 (D-020).
- **Stories:** C001-US-204, C001-US-207
- **Priority:** Must
- **Acceptance:** C001-AC-221.1

#### C001-AC-221.1 — Blocking question asked when its hand-back arrives
```gherkin
Scenario: C001-TS-225 — blocking question asked while another specialist runs, attended drafting
  Given the C001-TS-223 fixture and its approved lite ideation
  And P-01 told the conductor "Draft the spec of CHG-001."
  And the spec-writer is still running when the cartographer's hand-back, holding a question with "blocking": true, arrives
  When the conductor receives that hand-back
  Then an AskUserQuestion call that carries the blocking question occurs after the arrival and before the conductor's turn ends
  And no Agent call occurs between the arrival and that AskUserQuestion call
```
Note: eval-level scenario, run against the real specialists; C001-TS-215 is the same rule in unattended drafting. Terms, read from the session transcript:
- *Hand-back* and *questions block*: as defined in the note under C001-TS-224. The blocking question is a question with `"blocking": true` in a questions block of the cartographer's hand-back.
- *Arrives*: the moment the conductor receives the hand-back. For an asynchronous Agent call this is the `task_notification` system message whose `tool_use_id` is that call; for a synchronous call it is the call's tool result that is not a launch notice.
- *Still running*: at least one Agent call from the conductor to the spec-writer occurs before the arrival, and for every Agent call to the spec-writer made before the arrival, the call's own arrival does not occur before it.
- *Carries*: the question text of one AskUserQuestion question contains at least half of the distinct words of five or more letters in the blocking question's text (case-insensitive).
- *The conductor's turn ends*: the first `result` message after the arrival.

When the Given does not hold (the cartographer is not dispatched, its hand-back holds no blocking question, or the spec-writer is not still running at the arrival), the run is recorded as "Given not met" with `valid_run` false, distinct from a conductor failure. Such a run is replaced once by a new session; a second "Given not met" run in its place counts as a failure (conductor decision on critic finding CR-35).

### C001-REQ-222 — Plain-text fallback without a question tool
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the session offers no question tool, THEN THE conductor SHALL ask its interview round or present its gate as plain text in its reply, with the content of C001-IF-05 `questions.md` §3, and end its turn.
- **Rationale:** D-020; Q-noask-01; C001-IF-05 `questions.md` §3
- **Note:** Covers the rounds of C001-REQ-205, the asks of C001-REQ-221 and the gate of C001-REQ-802. The detour is excluded by C001-REQ-223 (critic CR-39).
- **Stories:** C001-US-203
- **Priority:** Must
- **Acceptance:** C001-AC-222.1

#### C001-AC-222.1 — Gate, round and blocking ask as plain text without a question tool
```gherkin
Scenario Outline: C001-TS-226 — <prompt> as plain text, question tool refused
  Given a Claude Code session in which every AskUserQuestion call is refused
  And <state>
  When P-01 tells the conductor "<request>"
  Then the reply that ends the conductor's <turn> contains, as text, <content>
  And the transcript contains no "sdd gate approve" call

  Examples:
    | prompt | state | request | turn | content |
    | gate | change "004" in phase "10-spec" with status "in-review", lint clean | Present the G2 gate of CHG-004. | first turn | the gate summary of "sdd gate show 004 10-spec", a sentence beginning "Approving means" and the four choices "Approve", "Approve with waivers", "Revise" and "Stop", none labelled "(Recommended)" |
    | interview round | change "005" in phase "00-ideation" whose specialists returned the non-blocking questions "Q-auth-01" and "Q-storage-01", each with two options | Run the next interview round for CHG-005. | first turn | both questions, each with its two options, the first option of each labelled "(Recommended)" |
    | blocking ask | the C001-TS-223 fixture and its approved lite ideation | Draft the spec of CHG-001. | first turn that ends after the cartographer's hand-back with a "blocking": true question arrives, with no Agent call between the arrival and that reply, | a question that carries the blocking question, with its options, the first labelled "(Recommended)" |
```
Note: eval-level scenario, read from the session transcript. The harness refuses every AskUserQuestion call, so the session offers no question tool in the sense of C001-IF-05 `questions.md` §3 (a call to it is refused). A turn ends at a `result` message; the reply that ends it is the conductor's last assistant text message before that `result` message. For the blocking-ask row, "hand-back", "arrives", "carries" and the "Given not met" rule are those of the note under C001-AC-221.1; that row's Given does not hold when the cartographer is not dispatched or its hand-back holds no blocking question. Only the first reply is checked, since no eval runner sends a second message: the answer rules of C001-IF-05 `questions.md` §3 item 2 (a gate decision only for exactly one named choice, the choices presented again otherwise, unanswered round questions left open) are verified by review, not by this scenario. The Copilot CLI behaviour (`--no-ask-user`) is evidenced by the CHG-002 injection cases INJ-19 and INJ-21 at Copilot CLI 0.0.3, not here (conductor decision on critic findings CR-35 of the plan and CR-38).

### C001-REQ-223 — No tool-enabling detour
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the session offers no question tool, THEN THE conductor SHALL NOT tell P-01 to enable, install or switch on a question tool instead of asking.
- **Rationale:** D-020; Q-noask-01; C001-IF-05 `questions.md` §3 item 3; critic CR-39
- **Stories:** C001-US-203
- **Priority:** Must
- **Acceptance:** C001-AC-223.1

#### C001-AC-223.1 — No instruction to enable a question tool
```gherkin
Scenario Outline: C001-TS-227 — no tool-enabling detour: <prompt>
  Given the session and state of the C001-TS-226 row "<prompt>"
  When P-01 tells the conductor the request of that row
  Then no conductor message up to the end of the turn that row checks contains a detour

  Examples:
    | prompt |
    | gate |
    | interview round |
    | blocking ask |
```
Note: eval-level scenario; a session run for a C001-TS-226 row can be checked against the same row here. A detour is any of these, case-insensitive: the text "INSTALL.md"; a sentence that contains "restart" or "relaunch" together with "session", "claude", "copilot" or "CLI"; one of the flags "--no-ask-user", "--allowedTools", "--allowed-tools", "--disallowedTools" and "--permission-mode"; a sentence in which "enable", "install" or "switch on" is followed by "tool", "AskUserQuestion", "ask_user" or "question". A message that only says the question tool is unavailable, or uses "enable" in another sense, is not a detour (critic CR-37; D-020).

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
| C001-REQ-205 | superseded by C002-REQ-211 | CHG-002 | 2026-11-16 |  |
