---
id: C001-CAP-03
artifact: spec/stories
capability: "Ideation: research, options, decisions"
change: CHG-001
phase: 10-spec
status: approved
id_block: { US: 301-399, REQ: 301-399, TS: 301-399 }
---

# C001-CAP-03 — Ideation: user stories

### C001-US-301 — Cited, confidence-rated research notes
- **As a** P-01 spec owner
- **I want** research questions answered in separate notes where every finding has a source, a date and a confidence rating
- **So that** I can trust or challenge each claim, and later artifacts can cite the note instead of repeating it
- **Value / outcome:** grounded decisions (IDEA-P-03); C001-GOAL-01
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-03
- **Context & notes:** the researcher runs on Sonnet 5 (Q17) and returns only a digest, so the full note stays on disk (cost, IDEA-§19).
- **Requirements:** C001-REQ-301, C001-REQ-302, C001-REQ-305, C001-REQ-307
- **Traces to:** Q11, IDEA-§14.3 A1

### C001-US-302 — The right research tool for the question
- **As a** P-01 spec owner
- **I want** library questions answered from version-accurate docs (Context7) and questions about how a public repository works answered from DeepWiki, before falling back to general web search
- **So that** specs don't contain hallucinated APIs or outdated behaviour
- **Value / outcome:** fewer spec defects caused by wrong library assumptions
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-03
- **Context & notes:** Tool order: Context7 for library documentation, DeepWiki for public-repository questions, web search last; every finding keeps its source and access date (C001-REQ-302).
- **Requirements:** C001-REQ-303, C001-REQ-304, C001-REQ-306
- **Traces to:** Q11, OQ-04, OA-06

### C001-US-303 — Rigorous, reusable options analysis
- **As a** P-01 spec owner
- **I want** every material choice analysed as 4–5 candidates scored on weighted criteria, with the best 2–3 presented and one recommended, and the arithmetic checked
- **So that** decisions are explicit, comparable and auditable, and errors in the scoring are caught
- **Value / outcome:** C001-GOAL-05; Q15 implemented as a skill plus an agent
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-03
- **Context & notes:** in the ideation of CHG-001, several weighted totals were initially miscomputed and fixed manually. A deterministic check is warranted.
- **Requirements:** C001-REQ-309, C001-REQ-310, C001-REQ-311
- **Traces to:** Q15, IDEA-§8

### C001-US-304 — Decision records
- **As a** P-04 validator
- **I want** each decision recorded with its context, the options analysis it came from, its consequences and the decider's own words
- **So that** I know why the system is the way it is
- **Value / outcome:** auditability (C001-GOAL-05)
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-03
- **Context & notes:** Decision records (`DEC-<seq>`) link to the option analysis they close and quote the decider's words; they live in `00-ideation/decisions/` (C001-IF-06).
- **Requirements:** C001-REQ-312
- **Traces to:** Q15, IDEA-§11.2

### C001-US-305 — Complete ideation document
- **As a** P-01 spec owner
- **I want** the ideation document to always contain the same set of sections, indexing research, options and decisions instead of summarising them away
- **So that** the specification phase starts from a complete, approved basis
- **Value / outcome:** fewer spec gaps; Q16 detail expectation
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-03
- **Context & notes:** The section set is fixed so readers and the lint (LINT-IDE-001) can rely on it; index sections point to research notes, option analyses and decisions instead of repeating them.
- **Requirements:** C001-REQ-313
- **Traces to:** IDEA-§10.3, Q16, Q20

### C001-US-306 — Brownfield feasibility evidence during ideation
- **As a** P-01 spec owner working on an existing codebase
- **I want** ideation to include a survey of the affected code (areas, callers, hotspots)
- **So that** my questions and decisions consider what really exists
- **Value / outcome:** C001-GOAL-04
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-03
- **Context & notes:** Brownfield and mixed changes only; the survey is produced by the cartographer with evidence entries (C001-IF-03 §11) in `00-ideation/evidence/baseline-survey.md`.
- **Requirements:** C001-REQ-314
- **Traces to:** Q3, IDEA-§20.2

### C001-US-307 — Ad-hoc research and decisions
- **As a** P-01 spec owner
- **I want** to ask for a research note or a decision analysis at any time
- **So that** I can settle questions as they arise without starting a phase
- **Value / outcome:** low-friction rigor
- **Priority:** Should · **Size hint:** S · **Capability:** C001-CAP-03
- **Context & notes:** Ad-hoc research and analyses use the same formats as the ideation phase (research notes, option analyses), so they can be cited later by ID.
- **Requirements:** C001-REQ-315, C001-REQ-316
- **Traces to:** IDEA-§16, IDEA-§20.4

### C001-US-308 — Ideation readiness verdict
- **As a** P-01 spec owner
- **I want** an independent check before G1 that says go, needs clarification or stop, with reasons
- **So that** I don't approve an ideation with holes, and weak ideas can be killed early
- **Value / outcome:** borrowed from the Spec Kit assessment verdict (IDEA-§6.1.1)
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-03
- **Context & notes:** The verdict comes from the critic in a fresh context, not from the authoring session; its checklist is C001-IF-11 §3.
- **Requirements:** C001-REQ-317, C001-REQ-318
- **Traces to:** IDEA-§6.1.1, IDEA-§18.3
