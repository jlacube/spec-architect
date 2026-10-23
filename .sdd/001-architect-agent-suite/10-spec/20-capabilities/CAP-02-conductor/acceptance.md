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

#### C001-AC-208.2 — Scope questions are blocking
```gherkin
Scenario: C001-TS-223 — cartographer flags an entry-point scope question as blocking
  Given a brownfield repository with two checkout entry points, "web checkout" and "in-store kiosk checkout"
  And an ideation whose only reference to the affected flow is "the checkout"
  When the cartographer finishes its survey
  Then its final message contains a JSON block valid against C001-IF-05
  And that block has a question asking which checkout entry point is in scope, with "blocking": true
```
Note: eval-level scenario, run against the real cartographer like C001-TS-215; the expected flag follows C001-IF-05 `questions.md` §1 criterion 1 (scope), which holds even when the cartographer surveys both entry points (D-017).

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
  Given unattended drafting is active
  When the cartographer returns a question with "blocking": true
  Then the conductor asks it via AskUserQuestion before dispatching further authors
```
Note: the Given's blocking question comes from the real cartographer, which flags a scope question as blocking under C001-IF-05 `questions.md` §1 criterion 1 (see C001-TS-223); C001-TC-215 is retested at release tier in C001-T-072 (D-017; Q-d017-01).

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
| C001-REQ-208 | TS-209 | TS-223 (scope question, IF-05 §1) | n/a | n/a | n/a | n/a | n/a |
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

Per-column n/a reasons: *alternate/boundary/error* where marked n/a: the requirement has a single path with no limits or error branch. *Authorization*: local single-user tool; approval authority is covered where marked. *Concurrency*: single writer per change (C001-CON-11). *Abuse*: inputs are the user's own repository; injected instructions in repository or web content are covered by C001-NFR-205.
