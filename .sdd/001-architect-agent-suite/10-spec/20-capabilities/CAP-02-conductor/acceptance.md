---
id: C001-CAP-02
artifact: spec/acceptance
capability: "Conductor and interview"
change: CHG-001
phase: 10-spec
status: approved
---

# C001-CAP-02 — Acceptance criteria and scenarios

Agent-behaviour scenarios are verified with `claude plugin eval` cases or scripted
headless sessions (`claude -p --agent …`) whose transcripts are inspected; the test plan
(20-plan) defines the harness. "Transcript" below means the session's tool-call log.

## C001-REQ-201

#### C001-AC-201.1 — Conductor starts as main session
```gherkin
Scenario: C001-TS-201 — launch the conductor
  Given the plugin "architect" is installed from the local marketplace
  When P-01 runs "claude --agent architect:sdd-conductor" in "fx-bootstrap"
  Then the session's active agent is "architect:sdd-conductor"
  And the tool AskUserQuestion is available in that session
```

## C001-REQ-202

#### C001-AC-202.1 — First reply is an orientation report
```gherkin
Scenario: C001-TS-202 — orientation on a workspace with two changes
  Given "fx-bootstrap" extended with change "002" in phase "00-ideation" status "draft"
  When the conductor session starts and P-01 says "hi"
  Then the transcript shows Read calls on ".sdd/SDD.md", ".sdd/registry.json", ".sdd/001-*/change.md", ".sdd/002-*/change.md" before the first reply
  And the first reply names "CHG-001" with phase "10-spec" and "CHG-002" with phase "00-ideation", each with a next action
```

## C001-REQ-203

#### C001-AC-203.1 — Missing workspace leads to init proposal only
```gherkin
Scenario: C001-TS-203 — no .sdd present
  Given the fixture "fx-empty"
  When the conductor session starts and P-01 says "let's spec a feature"
  Then the reply proposes "/architect:init"
  And the transcript contains no Write call and no Agent call
```

## C001-REQ-204

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

## C001-REQ-205

#### C001-AC-205.1 — At most four questions per round
```gherkin
Scenario: C001-TS-206 — round size limit
  Given an ideation where specialists returned 9 questions
  When the conductor runs the interview
  Then every AskUserQuestion call in the transcript has between 1 and 4 questions
  And all 9 questions (after merging) appear across the calls
```

## C001-REQ-206

#### C001-AC-206.1 — Options shape
```gherkin
Scenario: C001-TS-207 — option count and ordering
  When the conductor asks any optioned question other than a gate question
  Then each question has 2 or 3 options
  And exactly the first option's label ends with "(Recommended)"
  And every option has a non-empty description
```

## C001-REQ-207

#### C001-AC-207.1 — Material decisions carry 4–5 candidates
```gherkin
Scenario: C001-TS-208 — options analysis behind a material question
  Given a question tagged material (e.g. choice of persistence technology)
  When the conductor presents it
  Then the questions-log entry for it records "candidates_considered" of 4 or 5
  And it lists every non-presented candidate under "rejected" with a reason
```

## C001-REQ-208

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

## C001-REQ-209

#### C001-AC-209.1 — Duplicates merged, blocking first
```gherkin
Scenario: C001-TS-210 — merging questions from two specialists
  Given the researcher returned {topic:"auth", blocking:false} and the cartographer returned {topic:"auth", blocking:true} with the same intent
  And the options-analyst returned {topic:"storage", blocking:false}
  When the conductor forms round 1
  Then round 1 contains one "auth" question marked blocking, ordered before the "storage" question
```

## C001-REQ-210

#### C001-AC-210.1 — Verbatim log
```gherkin
Scenario: C001-TS-211 — free text answer logged verbatim
  When P-01 answers round 2 question 3 with "1 + search for other tools we might have missed"
  Then "questions-log.md" contains a "Round 2" section with question 3, its options, its recommendation
  And the answer field contains exactly "1 + search for other tools we might have missed"
```

## C001-REQ-211

#### C001-AC-211.1 — Extracted instructions are confirmed
```gherkin
Scenario: C001-TS-212 — embedded instruction surfaced
  When P-01 answers "Mermaid now (Recommended) but also keep IR-ready IDs"
  Then the conductor's next message lists an item equivalent to "keep IR-ready component IDs" with how it will be applied
```

## C001-REQ-212

#### C001-AC-212.1 — Assumptions are marked
```gherkin
Scenario: C001-TS-213 — unattended drafting
  Given P-01 said "draft the spec unattended, I'll review at the gate"
  And 3 non-blocking questions were pending
  When the spec draft is produced
  Then each statement derived from those 3 questions carries "[ASSUMPTION: <question-id>]"
  And "85-open-items.md" lists the 3 assumptions
```

## C001-REQ-213

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

## C001-REQ-214

#### C001-AC-214.1 — Brief completeness
```gherkin
Scenario: C001-TS-216 — dispatch brief fields
  When the conductor dispatches the spec-writer for CHG-004
  Then the Agent call prompt contains: "CHG-004", "10-spec", at least one input path under ".sdd/004-", the ID blocks, the output paths, the skill names to apply and the return contract
```

## C001-REQ-215

#### C001-AC-215.1 — No pasted artifacts
```gherkin
Scenario: C001-TS-217 — brief size discipline
  When the conductor dispatches any specialist
  Then no contiguous excerpt longer than 40 lines of any ".sdd/" file appears in the Agent call prompt
```

## C001-REQ-216

#### C001-AC-216.1 — Independent fan-out in one turn
```gherkin
Scenario: C001-TS-218 — ideation fan-out
  Given a brownfield ideation start
  When the conductor dispatches the researcher, cartographer and options-analyst
  Then the three Agent calls occur in the same assistant turn
```

## C001-REQ-217

#### C001-AC-217.1 — Allowlist in definition
```gherkin
Scenario: C001-TS-219 — conductor spawn allowlist
  When "agents/sdd-conductor.md" frontmatter is parsed
  Then "tools" contains "Agent(" listing exactly the nine sdd specialists
```

## C001-REQ-218

#### C001-AC-218.1 — Specialists cannot spawn
```gherkin
Scenario: C001-TS-220 — no Agent tool in specialists
  When the frontmatter of the nine specialist definitions is parsed
  Then none of their "tools" lists contains "Agent"
```

## C001-REQ-219

#### C001-AC-219.1 — Todo list maintained
```gherkin
Scenario: C001-TS-221 — visible phase plan
  Given a conductor session started with CLAUDE_CODE_ENABLE_TODO_TOOLS=1
  When the conductor starts the spec phase
  Then the transcript contains TaskCreate calls whose subjects include the phase-spec procedure steps
  And later TaskUpdate calls mark completed steps
```

## C001-REQ-220

#### C001-AC-220.1 — Shortcut offered at round six
```gherkin
Scenario: C001-TS-222 — fatigue guard
  Given five interview rounds have been completed in the ideation phase
  And non-blocking questions remain
  When the conductor prepares round six
  Then round six includes an option to resolve remaining non-blocking questions with recommendations
```

## C001-REQ-221

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

## C001-REQ-222

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

## C001-REQ-223

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

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-201 | TS-201 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-202 | TS-202 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-203 | TS-203 | n/a | n/a | TS-203 | n/a | n/a | n/a |
| C001-REQ-204 | TS-204 | TS-205 (shared skill) | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-205 | TS-206 | n/a | TS-206 (4 per round) | n/a | n/a | n/a | n/a |
| C001-REQ-206 | TS-207 | n/a | TS-207 (2–3 options) | n/a | n/a | n/a | n/a |
| C001-REQ-207 | TS-208 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-208 | TS-209 | TS-223 (scope question, blocking per IF-05 §1) | TS-224 (no §1 criterion met: no specialist hand-back flags it blocking) | n/a | n/a | n/a | n/a |
| C001-REQ-209 | TS-210 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-210 | TS-211 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-211 | TS-212 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-212 | TS-213 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-213 | TS-214 | TS-215 (blocking question) | n/a | n/a | TS-214 (never self-approves) | n/a | n/a |
| C001-REQ-214 | TS-216 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-215 | TS-217 | n/a | TS-217 (40-line excerpt) | n/a | n/a | n/a | n/a |
| C001-REQ-216 | TS-218 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-217 | TS-219 | n/a | n/a | n/a | TS-219 | n/a | n/a |
| C001-REQ-218 | TS-220 | n/a | n/a | n/a | TS-220 | n/a | n/a |
| C001-REQ-219 | TS-221 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-220 | TS-222 | n/a | TS-222 (sixth round) | n/a | n/a | n/a | n/a |
| C001-REQ-221 | TS-225 (attended) | TS-215 (unattended) | n/a | n/a | n/a | TS-215, TS-225 (spec-writer still running at the arrival) | n/a |
| C001-REQ-222 | TS-226 (gate as text) | TS-226 (interview round; blocking ask on arrival) | n/a | TS-226 (every AskUserQuestion call refused) | TS-226 (no "sdd gate approve" without an answer) | n/a: concurrent hand-backs are TS-215, TS-225 | n/a: the detour is C001-REQ-223 (TS-227) |
| C001-REQ-223 | TS-227 (gate) | TS-227 (interview round, blocking ask) | n/a | n/a | n/a | n/a | n/a |

Per-column n/a reasons: *alternate/boundary/error* where marked n/a: the requirement has a single path with no limits or error branch. *Authorization*: local single-user tool; approval authority is covered where marked. *Concurrency*: single writer per change (C001-CON-11). *Abuse*: inputs are the user's own repository; injected instructions in repository or web content are covered by C001-NFR-205.
