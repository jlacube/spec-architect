---
id: C001-CAP-03
artifact: spec/acceptance
capability: "Ideation: research, options, decisions"
change: CHG-001
phase: 10-spec
status: approved
---

# C001-CAP-03 — Acceptance criteria and scenarios

(No C001-REQ-308 exists: the sequence number was skipped while drafting and is tombstoned in
`ids.json`.)

## C001-REQ-301

#### C001-AC-301.1 — Note has all sections
```gherkin
Scenario: C001-TS-301 — research note shape
  When the researcher completes "Which S3 SDK supports client-side encryption in Node 20?"
  Then a file matching "00-ideation/research/R-\d{3}-.+\.md" exists
  And it contains the headings Question, Method, Findings, Confidence, Implications, Conflicting evidence, Follow-up questions
```

## C001-REQ-302

#### C001-AC-302.1 — Every finding has a source and a date
```gherkin
Scenario: C001-TS-302 — lint checks sources in research notes
  Given a research note whose Findings list has 5 bullet findings
  When the user runs "$SDD lint"
  Then the lint reports error "LINT-RES-001" for each finding without a URL or without an access date in "YYYY-MM-DD" form
```

#### C001-AC-302.2 — No invented sources
```gherkin
Scenario: C001-TS-303 — sources were actually fetched
  When the researcher writes a note in a scripted session
  Then every URL cited in Findings appears in a WebFetch, WebSearch result, Context7 or DeepWiki call of that session's transcript
```

## C001-REQ-303

#### C001-AC-303.1 — Context7 called first for a library
```gherkin
Scenario: C001-TS-304 — library question routing
  Given the research question "How do I configure retries in the AWS SDK v3 S3 client?"
  When the researcher works on it
  Then the first research tool call is Context7 "resolve-library-id"
  And a Context7 documentation query precedes any WebSearch call for this question
```

## C001-REQ-304

#### C001-AC-304.1 — DeepWiki for repository internals
```gherkin
Scenario: C001-TS-305 — repo internals routing
  Given the research question "How does oraios/serena decide which tools are excluded in planning mode?"
  When the researcher works on it
  Then the transcript contains a DeepWiki "ask_wiki_question" call with repository "oraios/serena"
  And it occurs before any WebFetch of a github.com source file of that repository
```

## C001-REQ-305

#### C001-AC-305.1 — Digest length
```gherkin
Scenario: C001-TS-306 — researcher return size
  When the researcher returns to the conductor
  Then the returned text, excluding the questions JSON block and file paths, is at most 15 lines
```

## C001-REQ-306

#### C001-AC-306.1 — Degradation recorded
```gherkin
Scenario: C001-TS-307 — Context7 unreachable
  Given the Context7 MCP server is disabled for the session
  When the researcher answers a library question
  Then the note's Method section names "Context7 unavailable" and "WebSearch/WebFetch" as substitute
  And the note still contains sourced findings
```

## C001-REQ-307

#### C001-AC-307.1 — Confidence on each finding
```gherkin
Scenario: C001-TS-308 — confidence rating present
  When a research note is linted
  Then every finding carries one of "high", "medium", "low" followed by a reason
  And a finding without a rating raises "LINT-RES-002"
```

## C001-REQ-309

#### C001-AC-309.1 — OA file structure
```gherkin
Scenario: C001-TS-309 — options analysis shape
  When the options-analyst writes an analysis
  Then the OA file has headings Problem, Criteria, Candidates, Scores, Sensitivity, Presented, Recommendation, Rejected
  And the criteria weights sum to 100%
  And the score table has 4 or 5 rows with integer scores between 1 and 5
```

## C001-REQ-310

#### C001-AC-310.1 — Wrong total detected
```gherkin
Scenario: C001-TS-310 — arithmetic error
  Given an OA table with weights 30/20/20/15/15 and a row scored 3,3,3,2,3 with stated total 2.90
  When the user runs "$SDD lint"
  Then the report contains "LINT-OA-001" with stated 2.90 and computed 2.85
```

#### C001-AC-310.2 — Correct totals pass
```gherkin
Scenario: C001-TS-311 — arithmetic correct
  Given the OA tables of the approved CHG-001 ideation (after correction)
  When the user runs "$SDD lint"
  Then no "LINT-OA-001" is reported
```

## C001-REQ-311

#### C001-AC-311.1 — Tie-breaker stated
```gherkin
Scenario: C001-TS-312 — recommended option scores lower
  Given candidates A = 4.10 (recommended) and C = 4.15 (presented)
  When the options-analyst writes the Recommendation section
  Then it contains an explicit tie-breaker sentence naming the criterion or argument that favours A
```

## C001-REQ-312

#### C001-AC-312.1 — DEC record content
```gherkin
Scenario: C001-TS-313 — decision record written
  When P-01 chooses "Built-in web + Context7 (Recommended)" for the research-tooling question
  Then a "DEC-<seq>-research-tooling.md" exists with headings Context, Decision, Options considered, Consequences, Decided
  And Options considered links the OA file
  And Decided contains P-01's answer verbatim and the date
```

## C001-REQ-313

#### C001-AC-313.1 — Ideation sections
```gherkin
Scenario: C001-TS-314 — ideation document completeness
  When the lint checks an ideation.md of a full-profile change
  Then it reports "LINT-IDE-001" for each missing section among Document control, Problem statement, Q&A decision record, Goals and non-goals, Scope boundary, Research index, Options and decisions index, Design direction, Risks, Assumptions, Open questions, Sources
```

## C001-REQ-314

#### C001-AC-314.1 — Baseline survey exists for brownfield
```gherkin
Scenario: C001-TS-315 — brownfield ideation start
  Given change "004" with kind "brownfield" on "fx-brownfield-ts"
  When the ideation phase starts
  Then "00-ideation/evidence/baseline-survey.md" exists
  And it lists at least one affected area with path, symbol and evidence layer
  And it includes a blast-radius entry for at least one symbol
```

## C001-REQ-315

#### C001-AC-315.1 — Stored in the named change
```gherkin
Scenario: C001-TS-316 — research with explicit change
  When P-01 runs "/architect:research \"Is libsodium available in Node 20?\" --change 003"
  Then a new note exists under ".sdd/003-*/00-ideation/research/"
```

#### C001-AC-315.2 — Ambiguous target asks
```gherkin
Scenario: C001-TS-317 — two active changes, no --change
  Given active changes "003" and "004"
  When P-01 runs "/architect:research \"…\"" without "--change"
  Then the conductor asks which change to use before dispatching the researcher
```

## C001-REQ-316

#### C001-AC-316.1 — DEC vs ADR by phase
```gherkin
Scenario Outline: C001-TS-318 — decision artifact type
  Given change "004" in phase "<phase>"
  When P-01 runs "/architect:decide \"Advisory locks or Redlock?\"" and selects an option
  Then a "<type>" record is written
  Examples:
    | phase       | type |
    | 00-ideation | DEC  |
    | 10-spec     | DEC  |
    | 20-plan     | ADR  |
```

## C001-REQ-317

#### C001-AC-317.1 — Unmet checklist items reported
```gherkin
Scenario: C001-TS-319 — readiness gaps
  Given an ideation draft without measurable goals
  When the critic reviews it
  Then the critic report contains a finding referencing checklist item "goals measurable" with severity "blocker" or "major"
```

## C001-REQ-318

#### C001-AC-318.1 — Single verdict
```gherkin
Scenario: C001-TS-320 — verdict line
  When the critic finishes an ideation review
  Then the last section of the report is "Verdict" containing exactly one of "go", "needs-clarification", "stop" and at least one reason
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-301 | TS-301 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-302 | TS-302 | n/a | n/a | TS-302 | n/a | n/a | TS-303 (invented sources) |
| C001-REQ-303 | TS-304 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-304 | TS-305 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-305 | TS-306 | n/a | TS-306 (15 lines) | n/a | n/a | n/a | n/a |
| C001-REQ-306 | TS-307 | TS-307 (degraded) | n/a | TS-307 | n/a | n/a | n/a |
| C001-REQ-307 | TS-308 | n/a | n/a | TS-308 | n/a | n/a | n/a |
| C001-REQ-309 | TS-309 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-310 | TS-310 | TS-311 (correct totals) | n/a | TS-310 | n/a | n/a | n/a |
| C001-REQ-311 | TS-312 | n/a | TS-312 (near tie) | n/a | n/a | n/a | n/a |
| C001-REQ-312 | TS-313 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-313 | TS-314 | n/a | n/a | TS-314 | n/a | n/a | n/a |
| C001-REQ-314 | TS-315 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-315 | TS-316 | TS-317 (ambiguous target) | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-316 | TS-318 | TS-318 (DEC vs ADR) | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-317 | TS-319 | n/a | n/a | TS-319 | n/a | n/a | n/a |
| C001-REQ-318 | TS-320 | n/a | n/a | n/a | n/a | n/a | n/a |

Per-column n/a reasons: *alternate/boundary/error* where marked n/a: the requirement has a single path with no limits or error branch. *Authorization*: local single-user tool; approval authority is covered where marked. *Concurrency*: single writer per change (C001-CON-11). *Abuse*: inputs are the user's own repository; injected instructions in repository or web content are covered by C001-NFR-205.
