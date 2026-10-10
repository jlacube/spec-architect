---
id: C001-CAP-03
artifact: spec/requirements
capability: "Ideation: research, options, decisions"
change: CHG-001
phase: 10-spec
status: approved
delta_default: ADDED
---

# C001-CAP-03 — Requirements

All `Delta: ADDED`. Interfaces: artifact templates C001-IF-03 §5 (research note, OA, DEC),
questions contract C001-IF-05.

### C001-REQ-301 — Research note structure
- **Pattern:** event-driven
- **Statement:** WHEN the researcher completes a research question, THE researcher SHALL write the note `00-ideation/research/R-<seq>-<slug>.md` with the sections Question, Method, Findings, Confidence, Implications, Conflicting evidence and Follow-up questions.
- **Rationale:** IDEA-§14.3 A1 output contract
- **Stories:** C001-US-301
- **Priority:** Must
- **Acceptance:** C001-AC-301.1

### C001-REQ-302 — Sources on every finding
- **Pattern:** ubiquitous
- **Statement:** THE researcher SHALL attach to every finding at least one source URL together with the date it was accessed.
- **Rationale:** IDEA-P-03
- **Stories:** C001-US-301
- **Priority:** Must
- **Acceptance:** C001-AC-302.1, C001-AC-302.2

### C001-REQ-303 — Context7 first for library APIs
- **Pattern:** event-driven
- **Statement:** WHEN a research question concerns the API or configuration of a named library or framework, THE researcher SHALL query Context7 (`resolve-library-id` followed by the documentation query) before using general web search for that question.
- **Rationale:** Q11; version-accurate docs
- **Stories:** C001-US-302
- **Priority:** Must
- **Acceptance:** C001-AC-303.1

### C001-REQ-304 — DeepWiki for public-repository internals
- **Pattern:** event-driven
- **Statement:** WHEN a research question concerns how a public GitHub repository implements a behaviour, THE researcher SHALL query DeepWiki `ask_question` for that repository before reading its source files through WebFetch.
- **Rationale:** OQ-04
- **Stories:** C001-US-302
- **Priority:** Must
- **Acceptance:** C001-AC-304.1

### C001-REQ-305 — Digest-only return
- **Pattern:** event-driven
- **Statement:** WHEN the researcher returns to the conductor, THE researcher SHALL return only a digest of at most 15 lines, the path of each note written, and any `questions` block.
- **Rationale:** cost control (IDEA-§19)
- **Stories:** C001-US-301
- **Priority:** Should
- **Acceptance:** C001-AC-305.1

### C001-REQ-306 — Degrade without research MCPs
- **Pattern:** unwanted-behaviour
- **Statement:** IF Context7 or DeepWiki is unavailable or returns an error, THEN THE researcher SHALL answer with WebSearch and WebFetch and state the unavailable tool and the substitute in the note's Method section.
- **Rationale:** IDEA-P-10; C001-AS-12
- **Stories:** C001-US-302
- **Priority:** Must
- **Acceptance:** C001-AC-306.1

### C001-REQ-307 — Confidence rating
- **Pattern:** ubiquitous
- **Statement:** THE researcher SHALL assign each finding a confidence of `high`, `medium` or `low` with a one-line reason.
- **Rationale:** IDEA-§14.3 A1
- **Stories:** C001-US-301
- **Priority:** Must
- **Acceptance:** C001-AC-307.1

### C001-REQ-309 — Option analysis structure
- **Pattern:** event-driven
- **Statement:** WHEN the options-analyst analyses a decision, THE options-analyst SHALL write `OA-<seq>-<slug>.md` containing the problem statement, criteria with weights summing to 100%, four or five candidates, a score table on a 1–5 scale, weighted totals, a sensitivity note, the two or three presented candidates, the recommendation, and every rejected candidate with its reason.
- **Rationale:** Q15; IDEA-§8 format
- **Stories:** C001-US-303
- **Priority:** Must
- **Acceptance:** C001-AC-309.1

### C001-REQ-310 — Weighted-total arithmetic check
- **Pattern:** unwanted-behaviour
- **Statement:** IF a weighted total in an option-analysis score table differs from the sum of score × weight for that row by more than 0.01, THEN THE lint SHALL report error `LINT-OA-001` naming the file, the candidate, the stated total and the computed total.
- **Rationale:** C001-US-303 context (errors observed in CHG-001 ideation)
- **Stories:** C001-US-303
- **Priority:** Must
- **Acceptance:** C001-AC-310.1, C001-AC-310.2

### C001-REQ-311 — Near-tie disclosure
- **Pattern:** event-driven
- **Statement:** WHEN the recommended candidate's weighted total is lower than, or within 0.10 of, another presented candidate's total, THE options-analyst SHALL state the qualitative tie-breaker that justifies the recommendation.
- **Rationale:** OA-05 lesson (recommended option scored 0.05 below an alternative)
- **Stories:** C001-US-303
- **Priority:** Must
- **Acceptance:** C001-AC-311.1

### C001-REQ-312 — Decision record
- **Pattern:** event-driven
- **Statement:** WHEN P-01 selects an option for a decision, THE conductor SHALL write `DEC-<seq>-<slug>.md` with the sections Context, Decision, Options considered (linking the OA), Consequences, and Decided (date, decider, decider's words verbatim).
- **Rationale:** Q15, MADR-like records (IDEA-§7.7)
- **Stories:** C001-US-304
- **Priority:** Must
- **Acceptance:** C001-AC-312.1

### C001-REQ-313 — Ideation document sections
- **Pattern:** event-driven
- **Statement:** WHEN the conductor writes `ideation.md`, THE conductor SHALL include the sections Document control, Problem statement, Q&A decision record, Goals and non-goals, Scope boundary, Research index, Options and decisions index, Design direction, Risks, Assumptions, Open questions and Sources.
- **Rationale:** IDEA-§10.3; the approved ideation of CHG-001 is the reference example
- **Stories:** C001-US-305
- **Priority:** Must
- **Acceptance:** C001-AC-313.1

### C001-REQ-314 — Brownfield baseline survey in ideation
- **Pattern:** complex
- **Statement:** WHILE the change has `kind` `brownfield` or `mixed`, WHEN the ideation phase starts, THE cartographer SHALL write `00-ideation/evidence/baseline-survey.md` listing affected areas, a blast-radius preview of the main symbols, touched hotspots, and the evidence layer of each entry.
- **Rationale:** Q3; IDEA-§20.2
- **Stories:** C001-US-306
- **Priority:** Must
- **Acceptance:** C001-AC-314.1

### C001-REQ-315 — Ad-hoc research command
- **Pattern:** event-driven
- **Statement:** WHEN P-01 runs `/architect:research "<question>"`, THE conductor SHALL dispatch the researcher and store the resulting note in the research folder of the change named by `--change`, or of the single active change when exactly one exists.
- **Rationale:** IDEA-§16
- **Stories:** C001-US-307
- **Priority:** Should
- **Acceptance:** C001-AC-315.1, C001-AC-315.2

### C001-REQ-316 — Ad-hoc decision command
- **Pattern:** event-driven
- **Statement:** WHEN P-01 runs `/architect:decide "<question>"`, THE conductor SHALL obtain an option analysis from the options-analyst, present it as one interview question, and record the outcome as a DEC record, or as an ADR when the change is in phase `20-plan`.
- **Rationale:** IDEA-§20.4
- **Stories:** C001-US-307
- **Priority:** Should
- **Acceptance:** C001-AC-316.1

### C001-REQ-317 — Ideation readiness checklist
- **Pattern:** event-driven
- **Statement:** WHEN the ideation draft is complete, THE critic SHALL evaluate the ideation readiness checklist of C001-IF-11 §3 and report each unmet item as a finding with severity.
- **Rationale:** IDEA-§18.3 G1 judgement criteria
- **Stories:** C001-US-308
- **Priority:** Must
- **Acceptance:** C001-AC-317.1

### C001-REQ-318 — Go / needs-clarification / stop verdict
- **Pattern:** event-driven
- **Statement:** WHEN the critic finishes an ideation review, THE critic SHALL end its report with exactly one verdict among `go`, `needs-clarification` and `stop`, followed by its reasons.
- **Rationale:** Spec Kit assessment verdict (IDEA-§6.1.1)
- **Stories:** C001-US-308
- **Priority:** Must
- **Acceptance:** C001-AC-318.1
