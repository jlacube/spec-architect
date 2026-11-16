---
capability: ideation
inventory_only: false
updated: 2026-11-16
---

# Ideation (`C001-CAP-03`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

The ideation phase: bootstrap ideation document, research notes, options analyses and decision
records, and the readiness checks that precede gate G1. The capability is mostly prompt content,
with its deterministic checks in lint rules.

## Entry points

- Commands `plugins/architect/commands/ideate.md`, `research.md`, `decide.md`.
- Agents `plugins/architect/agents/sdd-researcher.md`, `sdd-options-analyst.md`.

## Main modules

- Skills `plugins/architect/skills/phase-ideation/` (with `references/brief-template.md`),
  `research-protocol/`, `options-analysis/`.
- Lint rules `src/lint/rules/ide-001.ts`, `oa-001.ts`, `res-001.ts`, `res-002.ts`.

## Owning tests

- `tests/integration/cap03/` (`TS-302`, `TS-308`, `TS-310`, `TS-311`, `TS-314`, `research-fixture.ts`).
- Evals: `evals/cap03/` (`TS-301` … `TS-320`, `research.mjs`, `options.mjs`, `ideation-review.eval.mjs`).

## Evidence

- **E-1** `plugins/architect/agents/sdd-researcher.md:1` › - — research specialist (ideation and ad-hoc research).
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `plugins/architect/agents/sdd-options-analyst.md:1` › - — options and trade-off specialist.
  - layer: grep (description read) · confidence: medium
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `src/lint/rules/oa-001.ts:1` › - — lint rule for options-analysis files (purpose inferred from the file name).
  - layer: grep (git ls-files) · confidence: low
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127; purpose inferred from the file name

## Requirements

### C001-REQ-301 — Research note structure
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the researcher completes a research question, THE researcher SHALL write the note `00-ideation/research/R-<seq>-<slug>.md` with the sections Question, Method, Findings, Confidence, Implications, Conflicting evidence and Follow-up questions.
- **Rationale:** IDEA-§14.3 A1 output contract
- **Stories:** C001-US-301
- **Priority:** Must
- **Acceptance:** C001-AC-301.1

#### C001-AC-301.1 — Note has all sections
```gherkin
Scenario: C001-TS-301 — research note shape
  When the researcher completes "Which S3 SDK supports client-side encryption in Node 20?"
  Then a file matching "00-ideation/research/R-\d{3}-.+\.md" exists
  And it contains the headings Question, Method, Findings, Confidence, Implications, Conflicting evidence, Follow-up questions
```

### C001-REQ-302 — Sources on every finding
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE researcher SHALL attach to every finding at least one source URL together with the date it was accessed.
- **Rationale:** IDEA-P-03
- **Stories:** C001-US-301
- **Priority:** Must
- **Acceptance:** C001-AC-302.1, C001-AC-302.2

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

### C001-REQ-303 — Context7 first for library APIs
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN a research question concerns the API or configuration of a named library or framework, THE researcher SHALL query Context7 (`resolve-library-id` followed by the documentation query) before using general web search for that question.
- **Rationale:** Q11; version-accurate docs
- **Stories:** C001-US-302
- **Priority:** Must
- **Acceptance:** C001-AC-303.1

#### C001-AC-303.1 — Context7 called first for a library
```gherkin
Scenario: C001-TS-304 — library question routing
  Given the research question "How do I configure retries in the AWS SDK v3 S3 client?"
  When the researcher works on it
  Then the first research tool call is Context7 "resolve-library-id"
  And a Context7 documentation query precedes any WebSearch call for this question
```

### C001-REQ-304 — DeepWiki for public-repository internals
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN a research question concerns how a public GitHub repository implements a behaviour, THE researcher SHALL query DeepWiki `ask_wiki_question` for that repository before reading its source files through WebFetch.
- **Rationale:** OQ-04
- **Stories:** C001-US-302
- **Priority:** Must
- **Acceptance:** C001-AC-304.1

#### C001-AC-304.1 — DeepWiki for repository internals
```gherkin
Scenario: C001-TS-305 — repo internals routing
  Given the research question "How does oraios/serena decide which tools are excluded in planning mode?"
  When the researcher works on it
  Then the transcript contains a DeepWiki "ask_wiki_question" call with repository "oraios/serena"
  And it occurs before any WebFetch of a github.com source file of that repository
```

### C001-REQ-305 — Digest-only return
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the researcher returns to the conductor, THE researcher SHALL return only a digest of at most 15 lines, the path of each note written, and any `questions` block.
- **Rationale:** cost control (IDEA-§19)
- **Stories:** C001-US-301
- **Priority:** Should
- **Acceptance:** C001-AC-305.1

#### C001-AC-305.1 — Digest length
```gherkin
Scenario: C001-TS-306 — researcher return size
  When the researcher returns to the conductor
  Then the returned text, excluding the questions JSON block and file paths, is at most 15 lines
```

### C001-REQ-306 — Degrade without research MCPs
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF Context7 or DeepWiki is unavailable or returns an error, THEN THE researcher SHALL answer with WebSearch and WebFetch and state the unavailable tool and the substitute in the note's Method section.
- **Rationale:** IDEA-P-10; C001-AS-12
- **Stories:** C001-US-302
- **Priority:** Must
- **Acceptance:** C001-AC-306.1

#### C001-AC-306.1 — Degradation recorded
```gherkin
Scenario: C001-TS-307 — Context7 unreachable
  Given the Context7 MCP server is disabled for the session
  When the researcher answers a library question
  Then the note's Method section names "Context7 unavailable" and "WebSearch/WebFetch" as substitute
  And the note still contains sourced findings
```

### C001-REQ-307 — Confidence rating
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE researcher SHALL assign each finding a confidence of `high`, `medium` or `low` with a one-line reason.
- **Rationale:** IDEA-§14.3 A1
- **Stories:** C001-US-301
- **Priority:** Must
- **Acceptance:** C001-AC-307.1

#### C001-AC-307.1 — Confidence on each finding
```gherkin
Scenario: C001-TS-308 — confidence rating present
  When a research note is linted
  Then every finding carries one of "high", "medium", "low" followed by a reason
  And a finding without a rating raises "LINT-RES-002"
```

### C001-REQ-309 — Option analysis structure
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the options-analyst analyses a decision, THE options-analyst SHALL write `OA-<seq>-<slug>.md` containing the problem statement, criteria with weights summing to 100%, four or five candidates, a score table on a 1–5 scale, weighted totals, a sensitivity note, the two or three presented candidates, the recommendation, and every rejected candidate with its reason.
- **Rationale:** Q15; IDEA-§8 format
- **Stories:** C001-US-303
- **Priority:** Must
- **Acceptance:** C001-AC-309.1

#### C001-AC-309.1 — OA file structure
```gherkin
Scenario: C001-TS-309 — options analysis shape
  When the options-analyst writes an analysis
  Then the OA file has headings Problem, Criteria, Candidates, Scores, Sensitivity, Presented, Recommendation, Rejected
  And the criteria weights sum to 100%
  And the score table has 4 or 5 rows with integer scores between 1 and 5
```

### C001-REQ-310 — Weighted-total arithmetic check
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a weighted total in an option-analysis score table differs from the sum of score × weight for that row by more than 0.01, THEN THE lint SHALL report error `LINT-OA-001` naming the file, the candidate, the stated total and the computed total.
- **Rationale:** C001-US-303 context (errors observed in CHG-001 ideation)
- **Stories:** C001-US-303
- **Priority:** Must
- **Acceptance:** C001-AC-310.1, C001-AC-310.2

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

### C001-REQ-311 — Near-tie disclosure
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the recommended candidate's weighted total is lower than, or within 0.10 of, another presented candidate's total, THE options-analyst SHALL state the qualitative tie-breaker that justifies the recommendation.
- **Rationale:** OA-05 lesson (recommended option scored 0.05 below an alternative)
- **Stories:** C001-US-303
- **Priority:** Must
- **Acceptance:** C001-AC-311.1

#### C001-AC-311.1 — Tie-breaker stated
```gherkin
Scenario: C001-TS-312 — recommended option scores lower
  Given candidates A = 4.10 (recommended) and C = 4.15 (presented)
  When the options-analyst writes the Recommendation section
  Then it contains an explicit tie-breaker sentence naming the criterion or argument that favours A
```

### C001-REQ-312 — Decision record
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN P-01 selects an option for a decision, THE conductor SHALL write `DEC-<seq>-<slug>.md` with the sections Context, Decision, Options considered (linking the OA), Consequences, and Decided (date, decider, decider's words verbatim).
- **Rationale:** Q15, MADR-like records (IDEA-§7.7)
- **Stories:** C001-US-304
- **Priority:** Must
- **Acceptance:** C001-AC-312.1

#### C001-AC-312.1 — DEC record content
```gherkin
Scenario: C001-TS-313 — decision record written
  When P-01 chooses "Built-in web + Context7 (Recommended)" for the research-tooling question
  Then a "DEC-<seq>-research-tooling.md" exists with headings Context, Decision, Options considered, Consequences, Decided
  And Options considered links the OA file
  And Decided contains P-01's answer verbatim and the date
```

### C001-REQ-313 — Ideation document sections
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the conductor writes `ideation.md`, THE conductor SHALL include the sections Document control, Problem statement, Q&A decision record, Goals and non-goals, Scope boundary, Research index, Options and decisions index, Design direction, Risks, Assumptions, Open questions and Sources.
- **Rationale:** IDEA-§10.3; the approved ideation of CHG-001 is the reference example
- **Stories:** C001-US-305
- **Priority:** Must
- **Acceptance:** C001-AC-313.1

#### C001-AC-313.1 — Ideation sections
```gherkin
Scenario: C001-TS-314 — ideation document completeness
  When the lint checks an ideation.md of a full-profile change
  Then it reports "LINT-IDE-001" for each missing section among Document control, Problem statement, Q&A decision record, Goals and non-goals, Scope boundary, Research index, Options and decisions index, Design direction, Risks, Assumptions, Open questions, Sources
```

### C001-REQ-314 — Brownfield baseline survey in ideation
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** complex
- **Statement:** WHILE the change has `kind` `brownfield` or `mixed`, WHEN the ideation phase starts, THE cartographer SHALL write `00-ideation/evidence/baseline-survey.md` listing affected areas, a blast-radius preview of the main symbols, touched hotspots, and the evidence layer of each entry.
- **Rationale:** Q3; IDEA-§20.2
- **Stories:** C001-US-306
- **Priority:** Must
- **Acceptance:** C001-AC-314.1

#### C001-AC-314.1 — Baseline survey exists for brownfield
```gherkin
Scenario: C001-TS-315 — brownfield ideation start
  Given change "004" with kind "brownfield" on "fx-brownfield-ts"
  When the ideation phase starts
  Then "00-ideation/evidence/baseline-survey.md" exists
  And it lists at least one affected area with path, symbol and evidence layer
  And it includes a blast-radius entry for at least one symbol
```

### C001-REQ-315 — Ad-hoc research command
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN P-01 runs `/architect:research "<question>"`, THE conductor SHALL dispatch the researcher and store the resulting note in the research folder of the change named by `--change`, or of the single active change when exactly one exists.
- **Rationale:** IDEA-§16
- **Stories:** C001-US-307
- **Priority:** Should
- **Acceptance:** C001-AC-315.1, C001-AC-315.2

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

### C001-REQ-316 — Ad-hoc decision command
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN P-01 runs `/architect:decide "<question>"`, THE conductor SHALL obtain an option analysis from the options-analyst, present it as one interview question, and record the outcome as a DEC record, or as an ADR when the change is in phase `20-plan`.
- **Rationale:** IDEA-§20.4
- **Stories:** C001-US-307
- **Priority:** Should
- **Acceptance:** C001-AC-316.1

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

### C001-REQ-317 — Ideation readiness checklist
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the ideation draft is complete, THE critic SHALL evaluate the ideation readiness checklist of C001-IF-11 §3 and report each unmet item as a finding with severity.
- **Rationale:** IDEA-§18.3 G1 judgement criteria
- **Stories:** C001-US-308
- **Priority:** Must
- **Acceptance:** C001-AC-317.1

#### C001-AC-317.1 — Unmet checklist items reported
```gherkin
Scenario: C001-TS-319 — readiness gaps
  Given an ideation draft without measurable goals
  When the critic reviews it
  Then the critic report contains a finding referencing checklist item "goals measurable" with severity "blocker" or "major"
```

### C001-REQ-318 — Go / needs-clarification / stop verdict
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the critic finishes an ideation review, THE critic SHALL end its report with exactly one verdict among `go`, `needs-clarification` and `stop`, followed by its reasons.
- **Rationale:** Spec Kit assessment verdict (IDEA-§6.1.1)
- **Stories:** C001-US-308
- **Priority:** Must
- **Acceptance:** C001-AC-318.1

#### C001-AC-318.1 — Single verdict
```gherkin
Scenario: C001-TS-320 — verdict line
  When the critic finishes an ideation review
  Then the last section of the report is "Verdict" containing exactly one of "go", "needs-clarification", "stop" and at least one reason
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
