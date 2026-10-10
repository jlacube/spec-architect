---
id: CHG-001
artifact: ideation
title: "Architect — a Spec-Driven Development agent suite for Claude Code (ideation)"
phase: 00-ideation
status: draft            # draft → in-review → approved (gate G1)
version: 0.1.2
created: 2026-10-10
updated: 2026-10-10
authors:
  - jerome.lacube (product owner, decision maker)
  - Claude Opus 5.5 (facilitator, researcher, author)
inputs:
  - "Q&A session 2026-10-10 (20 questions, 5 rounds) — see §4"
  - "Web research 2026-10-10 — see §27 Sources"
consumers:
  - "10-spec phase (next): the specification of the agent suite itself"
supersedes: null
---

# Architect — Spec-Driven Development Agent Suite

## Ideation Document (CHG-001 / phase 00-ideation)

> **Reading guide.** This is a working ideation document, not a brief. It records the problem,
> the research, every decision taken in the Q&A, the option analyses behind the
> recommendations, a first-cut design of the agent suite, and the open questions that the
> specification phase must close. Sections are numbered so later artifacts (spec, plan) can
> trace back to them (`IDEA-§n.m`). Everything marked **[DECIDED]** came from you in the Q&A;
> everything marked **[PROPOSED]** is my recommendation and still needs your approval at gate G1;
> everything marked **[OPEN]** is an unresolved question; **[VERIFY]** marks a factual claim
> from research that must be confirmed hands-on before it is relied upon.

---

## Table of Contents

1. Document control
2. Orientation (what this is and why it exists)
3. Problem statement
4. Q&A decision record (Q1–Q20)
5. Goals, non-goals, scope boundary
6. Landscape research: SDD frameworks in 2026
7. Landscape research: tools, MCP servers and skills
8. Option analyses (OA-01 … OA-14)
9. Design principles
10. Phase model (ideation → specification → planning → hand-off)
11. The `.sdd/` workspace: layout and description file
12. Artifact model, identifiers and traceability
13. Quality standards: user stories, EARS, acceptance scenarios, NFRs, DoD
14. Agent roster (first cut, with draft frontmatter)
15. Skills (shared knowledge modules)
16. Commands / entry points
17. Helper scripts (Node.js) and hooks
18. Gates and status lifecycle
19. Model, effort and cost routing
20. End-to-end scenarios (walk-throughs)
21. Environment & platform considerations (Windows)
22. Risks and mitigations
23. Assumptions
24. Open questions for gate G1
25. Success criteria for the suite itself
26. Roadmap and next steps
27. Glossary
28. Sources

---

## 1. Document control

| Field | Value |
|---|---|
| Change ID | CHG-001 |
| Working title | **Architect** (repo name; plugin name to confirm — see OQ-01) |
| Phase | 00-ideation |
| Status | draft — awaiting gate **G1** (ideation exit) |
| Next phase | 10-spec — the specification of the agent suite |
| Decision owner | Jerome |
| Facilitator | Claude (Opus 5.5) |
| Location | `.sdd/001-architect-agent-suite/00-ideation/ideation.md` |
| Line target | ≥ 1000 lines (requested); this document intentionally exceeds it |

### 1.1 Change history

| Version | Date | Change |
|---|---|---|
| 0.1.0 | 2026-10-10 | First full draft after 20-question Q&A and web research |
| 0.1.1 | 2026-10-10 | G1 pre-review: OQ-02 decided (keep 10 agents), OQ-05 decided (lite profile); OQ-07 under discussion; repo initialised with git (OQ-14 closed) |
| 0.1.2 | 2026-10-10 | OQ-07 decided: archive in v1; brownfield `_living/` seeded with a capability inventory (no requirements) at init. All G1-blocking questions closed |

### 1.2 Conventions used in this document

- **[DECIDED]** — a choice you made in the Q&A; not to be relitigated without cause.
- **[PROPOSED]** — my recommendation; becomes decided when you pass gate G1.
- **[OPEN]** — needs your input; all are collected in §24.
- **[VERIFY]** — a claim from research (vendor README, blog, benchmark) that the build
  must confirm empirically, ideally on your Windows 11 machine.
- Option analyses follow one format: 4–5 candidates generated, scored on weighted criteria
  (1 = poor … 5 = excellent), the best 2–3 presented, one recommended. Rejected options are
  kept with a one-line reason so the reasoning is auditable later.

---

## 2. Orientation

### 2.1 What we are building

A set of **Claude Code agents** (markdown definitions with YAML frontmatter), supported by
**skills**, **commands**, **Node.js helper scripts** and **hooks**, that take a software change
from a raw idea to an **implementation-ready, verifiable specification and plan**:

```
 idea ──► 00-ideation ──G1──► 10-spec ──G2──► 20-plan ──G3──► HAND-OFF ──► (any implementer)
          Q&A + research      stories,        architecture,     tasks + acceptance
          + options           EARS reqs,      ADRs, tasks,      tests + DoD +
                              acceptance      test plan,        traceability
                              scenarios, DoD  traceability
```

The suite **stops at the hand-off** [DECIDED, Q2]. Implementation, test execution and code
review are done by whatever you already use (Superpowers, Spec Kit `/implement`, Codex, a human,
another agent). But the hand-off is designed so that **someone can later check the code against
the spec** [DECIDED, Q16]: every requirement, acceptance criterion and task carries a stable
identifier, and the `.sdd/` workspace records where each change stands, implementation included
[DECIDED, Q19].

### 2.2 Why "spec phases only" still needs to think about code

Two reasons the spec agents must understand code even though they never write it:

1. **Brownfield-awareness** [DECIDED, Q3]. A spec for a change to an existing system is a
   *delta* against what exists. Without reading the current code (ripwire, Serena), the spec
   describes an imagined system and the plan points at files that do not exist.
2. **Later validation** [DECIDED, Q16]. To check code against the spec later, the plan must
   name concrete targets: modules, interfaces, files, test locations. Vague plans cannot be
   validated against anything.

### 2.3 What makes this different from installing Spec Kit or BMAD

| Concern | Typical framework | Architect (this suite) |
|---|---|---|
| Ideation | Thin, or a separate add-on (Spec Kit "assess" extension, OpenSpec `explore`) | First-class phase with batched option-based Q&A, web + docs research, options analyses |
| Decision rigor | Implicit | Explicit: 4–5 options → scored → 2–3 presented → recommendation → decision record |
| Brownfield discovery | Agent greps around | Dedicated cartographer agent: ripwire (map, blast radius, tests-to-run) + Serena (symbols, references) |
| Spec detail | Often one `spec.md` | Multi-file spec: user stories, EARS requirements, Given/When/Then scenarios, NFRs, domain model, interfaces, architecture, DoD |
| Verification of the spec | Checklists | Deterministic Node lint (traceability, ID integrity, EARS conformance, no-TBD) + adversarial critic agent |
| Progress tracking | Per-tool | `.sdd/SDD.md` + `registry.json` that any agent (or implementer) reads to know where it is |
| Diagrams | Mermaid or none | Archify (typed, validated, code-evidenced) + Mermaid fallback |

---

## 3. Problem statement

### 3.1 The observed problem

AI coding agents are fast at writing code and weak at knowing *what* to write. The 2026
evidence:

- A spec reduces defects but does not guarantee conformance. The Uvik SDD benchmark reports
  blind reviewers found **0.46 defects per merged ticket with a spec vs 0.86 without**, yet
  **7.9% of merged spec-arm tickets did not match their own spec** [VERIFY: single benchmark,
  Python-only tickets]. The authors' diagnosis: *nothing enforces the spec as a gate, and nothing
  verifies the running code against it*.
- Frameworks validate the *shape* of a spec (sections present), not its *substance* (each
  requirement testable, each criterion traced to work and to a test).
- Ideation is the weakest step everywhere. Most tools jump from a one-paragraph prompt to a
  spec, so the agent's assumptions become requirements without anyone noticing.
- Brownfield specs drift from reality because the specifying agent never read the code
  properly; it guessed.

### 3.2 The problem for you specifically

- You want a reusable, opinionated, high-rigor front end to software work, in Claude Code,
  on Windows, that you can later share.
- You want the outputs to be **detailed artifacts, not summaries** [DECIDED, Q16]: multiple
  files per phase, rich enough to check code against later.
- You want the agents to use the state-of-the-art tools (Archify, ripwire, Serena, …)
  without paying their context cost when they aren't needed.

### 3.3 Problem statement (one paragraph, for the spec)

> Developers using AI coding agents lack a disciplined, tool-assisted way to turn an idea into
> a specification and plan that is (a) grounded in research and in the real codebase,
> (b) explicit about decisions and their alternatives, (c) detailed and identified enough to be
> verified against the eventual code, and (d) tracked in a workspace any agent can read to know
> the current state. Architect provides that front end as a Claude Code agent suite that stops
> at a tool-neutral, traceable hand-off.

---

## 4. Q&A decision record (Q1–Q20)

All twenty questions were asked in five rounds of four on 2026-10-10. For each question I
generated 4–5 options internally, scored them, and presented the best 2–3 with a
recommendation. The table records what was offered, what you chose, and how it changes the design.

### 4.1 Round 1 — Scope and target

| # | Question | Options presented (rec. first) | Your answer | Design consequence |
|---|---|---|---|---|
| Q1 | Runtime(s) | Claude Code first + portable core · Claude Code only · tool-agnostic | **Claude Code first, portable core** | Use full Claude Code frontmatter (model, effort, tools, hooks); keep templates, standards and methodology in plain markdown so Codex/Cursor can reuse them via `AGENTS.md` later. |
| Q2 | Phase focus | Front-heavy full chain · **spec phases only** · equal depth | **Spec phases only** | Scope = ideation, specification, planning, hand-off. No implement/test/review agents. Hand-off must be strong (Q6, Q16). |
| Q3 | Project type | Both, brownfield-aware · greenfield · brownfield | **Both, brownfield-aware** | Delta-spec concept (from OpenSpec) + code cartography (ripwire/Serena) are core, but must degrade cleanly on an empty repo. |
| Q4 | Audience | You first, shareable later · team · public | **You first, shareable later** | Optimize for your setup (Windows 11, Claude Code desktop) but package as a plugin from day one; no hard-coded paths. |

### 4.2 Round 2 — Architecture

| # | Question | Options presented | Your answer | Design consequence |
|---|---|---|---|---|
| Q5 | Orchestration | Commands + specialist agents · single orchestrator · agent team | **"1 + 2": a main entry point, plus the ability to re-enter a specific phase** | Hybrid: `sdd-conductor` as main-session agent (run via `claude --agent`) that drives the full flow, **and** phase commands (`/architect:ideate`, `:specify`, `:plan`, `:revise`) for targeted re-entry. Both share the same specialist subagents and skills. See OA-01. |
| Q6 | Hand-off | Tool-neutral tasks + acceptance tests · Spec Kit layout · Superpowers plan | **Tool-neutral task plan + acceptance tests** | `20-plan/` emits ordered tasks with file targets, EARS-linked acceptance criteria, Given/When/Then test scenarios, DoD and traceability IDs; plus `handoff.md` explaining how any implementer consumes and reports progress. |
| Q7 | Relation to frameworks | Own agents, borrow ideas · on top of Spec Kit · on top of OpenSpec | **Own agents, borrow best ideas** | No runtime dependency. Borrowed: constitution (Spec Kit), `[NEEDS CLARIFICATION]` markers (Spec Kit), delta specs + living specs (OpenSpec), batched interview (adapted from Superpowers brainstorming), EARS (Kiro). |
| Q8 | Requirements notation | EARS + Given/When/Then · user stories · free-form | **EARS + Given/When/Then** (and, per Q16, **user stories too**) | Three linked layers: user story (why/who) → EARS requirement (what, testable) → Given/When/Then scenario (how verified). |

### 4.3 Round 3 — Tooling

| # | Question | Options presented | Your answer | Design consequence |
|---|---|---|---|---|
| Q9 | Code intelligence | ripwire CLI + Serena MCP role split · ripwire only · Serena only | **Role split, plus "search for other authoritative tools on the same scope and other tools we might have missed"** | §7 surveys code-intelligence alternatives and gap tools; OA-05 re-scores with the wider field. Result: ripwire CLI + Serena (read-only) stay core; ast-grep optional; native LSP as fallback; GitNexus rejected (license). |
| Q10 | ripwire fork | redhat-et upstream · specific fork · evaluate | **redhat-et/ripwire** | Pin to upstream; current release 0.6.5 (2026-09-14), Windows x64 binary is **preview** [VERIFY]. |
| Q11 | Research tooling | built-in web + Context7 · Exa/Tavily + Context7 · built-in only | **Built-in web + Context7** | Researcher uses WebSearch/WebFetch + Context7. **New candidate surfaced: DeepWiki MCP** (free, no auth, public repos) — see OA-06 / OQ-04. |
| Q12 | Diagrams | Archify + Mermaid fallback · Archify only · Mermaid only | **Archify + Mermaid fallback** | Architecture, sequence, data-flow, workflow and lifecycle views as Archify JSON IR → validated HTML in `10-spec/60-architecture/`; Mermaid inline for small diagrams that must render on GitHub. |

### 4.4 Round 4 — Process and gates

| # | Question | Options presented | Your answer | Design consequence |
|---|---|---|---|---|
| Q13 | Human gates | each phase exit · spec+plan only · configurable | **Gate at each phase exit** | G1 (ideation), G2 (spec), G3 (plan). Status in frontmatter + registry; next phase refuses to start on a non-approved predecessor; approval pins a content hash (§18). |
| Q14 | Interview style | batched option-based rounds · one-at-a-time · adaptive | **Batched, option-based rounds** | `interview-protocol` skill: ≤4 questions per round via AskUserQuestion, 2–3 researched options each, recommendation first, adaptive follow-up rounds, question log persisted. |
| Q15 | Options discipline | shared skill + agent · ideation/planning only · on request | **Shared skill + agent** | `options-analysis` skill preloaded into conductor, spec-writer, architect, planner; `sdd-options-analyst` subagent for heavy decisions; outputs decision records (DEC-xxx). |
| Q16 | Validation strictness | scripted lint + critic · critic only · checklist | **Scripted lint + critic, plus strong DoD and very detailed ACs and user stories; "we need later to be able to validate alignment between specs and code"; architecture-level outputs very detailed, no brief, no summary, multiple files at spec and plan levels** | Raises the bar on every artifact. Drives: multi-file spec/plan (OA-04), stable IDs (OA-08), traceability matrix (OA-07), strong DoD catalog (§13.6), "no summary" rule enforced by the critic and by minimum-content lint rules. |

### 4.5 Round 5 — Constraints

| # | Question | Options presented | Your answer | Design consequence |
|---|---|---|---|---|
| Q17 | Model routing | tiered by role · Opus everywhere · inherit | **Tiered by role** | Opus 5.5 (high/xhigh) for conductor, spec-writer, architect, planner, critic; Sonnet 5 for researcher, cartographer, test-designer drafting; Haiku 4.5 for lint/bookkeeping (§19). |
| Q18 | Script runtime | Node.js · Python (uv) · PowerShell+bash | **Node.js** | A single `sdd.mjs` CLI (zero npm dependencies if feasible; see OA-12) for init, IDs, lint, trace, gate, status. |
| Q19 | Artifact location | `specs/NNN-feature/` · `docs/specs` · configurable | **Per-change folders, all inside a `.sdd/` root, which includes a description file so agents know what to consume and where they are (including in terms of implementation)** | `.sdd/SDD.md` (human/agent-readable contract) + `.sdd/registry.json` (machine state) + `.sdd/NNN-slug/{00-ideation,10-spec,20-plan}` + `_constitution`, `_living`, `_decisions`. Registry tracks implementation status reported back by implementers (OA-03). |
| Q20 | Where this document goes | repo markdown · + artifact · Claude Doc | **`.sdd/` ideation folder in this repo, following the Q19 layout** | This file lives at `.sdd/001-architect-agent-suite/00-ideation/ideation.md`, and the repo gets its own `.sdd/SDD.md` + `registry.json` (we use the method on itself from the start). |

### 4.6 Decisions implied by the answers (derived, [PROPOSED])

These follow from combining answers; flag any you disagree with at G1.

- **D-01** Interviewing must happen in the **main session**, because Claude Code removes
  `AskUserQuestion` from subagents. So the conductor runs as the main-session agent
  (`claude --agent sdd-conductor`), and phase commands run in the main thread too. Specialists
  never interview; they return `questions[]` to the main thread. (From Q5 + Q14.)
- **D-02** Spec-phase agents **must not modify source code**. Enforced by tool scoping and a
  `PreToolUse` guard that allows Write/Edit only under `.sdd/`. (From Q2.)
- **D-03** Package as a **plugin** from day one (Q4), but because plugin-packaged agents ignore
  their own `hooks`, `mcpServers` and `permissionMode` frontmatter, those go in the plugin's
  `hooks/hooks.json` and `.mcp.json` instead (OA-02).
- **D-04** Every artifact is **multi-file with stable IDs** (Q16 + Q19), and every
  requirement must trace to ≥1 acceptance scenario, ≥1 task and ≥1 DoD item.
- **D-05** ripwire is used through the **CLI**, not its MCP server, following its own guidance
  that the CLI costs no prompt tokens until called (Q9).

---

## 5. Goals, non-goals and scope boundary

### 5.1 Goals

| ID | Goal | Measure (see §25) |
|---|---|---|
| G-01 | Turn a raw idea into an approved ideation document through batched, researched, option-based Q&A | Every material decision has a DEC record with ≥2 alternatives |
| G-02 | Produce a multi-file specification precise enough to verify code against | 100% of REQs have ≥1 AC with Given/When/Then; 0 lint errors at G2 |
| G-03 | Produce a plan precise enough to execute without re-interpreting the spec | 100% of tasks name target paths/interfaces and verification steps; 100% REQ→task coverage |
| G-04 | Ground brownfield specs in the actual code | Every MODIFIED/REMOVED requirement cites code evidence (path + symbol) from the cartographer |
| G-05 | Make decisions auditable | Options analyses and rejected alternatives persisted |
| G-06 | Keep a machine-readable view of where each change stands | `registry.json` always consistent with artifact frontmatter (lint-checked) |
| G-07 | Tool-neutral hand-off | A plan is consumable by ≥2 different implementers (tested: Superpowers executing-plans + a plain Claude Code session) |
| G-08 | Shareable later | Plugin validates (`claude plugin validate`), has a README, no machine-specific paths |

### 5.2 Non-goals

| ID | Non-goal | Why |
|---|---|---|
| NG-01 | Writing production code | Q2 — out of scope; delegated to the implementer |
| NG-02 | Running tests or CI | Q2 |
| NG-03 | Reviewing implementation PRs | Q2 — but see v2 roadmap: a conformance checker that *reads* code against the spec is a natural extension (§26.3) |
| NG-04 | Replacing issue trackers | Registry is local state, not a project-management tool; export can come later |
| NG-05 | Supporting non-Claude-Code runtimes at v1 | Q1 — portability is designed in, not delivered |
| NG-06 | A GUI | Claude Code (CLI/desktop) is the UI; Archify HTML is the only rendered output |

### 5.3 Scope boundary (where the agents stop)

```
IN SCOPE                                             OUT OF SCOPE
──────────────────────────────────────────────────── ─────────────────────────────
 .sdd/ workspace init, constitution                   editing src/, tests/, config
 ideation: Q&A, research, options, decisions          running builds / tests
 spec: stories, EARS, scenarios, NFRs, domain,        implementing tasks
       interfaces, architecture (Archify), DoD        code review of diffs
 plan: ADRs, work breakdown, tasks, test plan,        deployments
       risks, rollout, traceability, hand-off
 reading code (read-only) for brownfield grounding
 recording implementation status *reported by others*
```

The last line matters: the suite does not implement anything, but it **does accept status
updates** (task done, commit links) so `.sdd/` stays the single place where an agent can learn
where a change stands [DECIDED, Q19].

---

## 6. Landscape research: SDD frameworks in 2026

Research date: 2026-10-10. Star counts and versions come from 2026 comparison articles and
READMEs [VERIFY before quoting externally].

### 6.1 The four frameworks that matter

#### 6.1.1 GitHub Spec Kit (~140k stars, v1.0.x)

- **Flow:** `/speckit-constitution` → `/speckit-specify` → `/speckit-clarify` → `/speckit-plan`
  → `/speckit-tasks` → `/speckit-analyze` / `/speckit-checklist` → `/speckit-implement` →
  `/speckit-converge` (repeats implement→converge until "Converged").
- **Layout:** `.specify/constitution.md`, `.specify/specs/NNN-feature/{spec.md, plan.md,
  research.md, data-model.md, contracts/, quickstart.md, tasks.md}`.
- **2026 additions:** extensions (bug-fix trio; an "idea assessment" extension: intake → research
  → define → shape → decide with a go/clarify/kill verdict), presets, workflows, bundles.
- **Ideas worth borrowing:**
  - the *constitution*: project-wide principles written once and referenced by every spec;
  - `[NEEDS CLARIFICATION]` markers instead of silent assumptions;
  - `analyze`: a cross-artifact consistency check;
  - the *assessment* extension's explicit **go / needs-clarification / kill** verdict, which
    maps well to our G1.
- **Weaknesses for us:** thin, prose-only ideation; no code intelligence; validation checks
  structure, not traceability; there is an open request to integrate EARS (issue #1356), so it
  is not native.

#### 6.1.2 OpenSpec (~71k stars, v1.14)

- **Flow:** `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`.
- **Layout:** `openspec/specs/` (current truth) + `openspec/changes/<id>/{proposal.md,
  design.md, tasks.md, specs/<capability>/spec.md (deltas)}` + archive.
- **Delta operations:** `ADDED`, `MODIFIED`, `REMOVED`, `RENAMED` requirements. Scenarios are
  written `#### Scenario:` with **WHEN/THEN** bullets.
- **Ideas worth borrowing:**
  - the split between **living specs** (what the system does now) and **change deltas**
    (what this change alters), which suits brownfield work;
  - archiving a change merges its deltas into the living specs.
- **Weaknesses for us:** light on ideation and decisions; a minimal format (proposal + tasks)
  that does not reach the detail Q16 asks for.

#### 6.1.3 BMAD Method (~54k stars, v6.x)

- **Model:** a simulated agile team of 12+ personas (analyst, PM, architect, UX, SM, dev,
  QA, …) producing PRD, architecture and sharded stories.
- **Ideas worth borrowing:**
  - role separation: an analyst who researches, a PM who writes requirements, an architect
    who designs;
  - "story sharding" (self-contained story files that carry their context).
- **Weaknesses for us:** heavy, ceremony-rich and token-hungry; a persona zoo where we want a
  small set of sharp specialists; covers implementation, which is out of our scope.

#### 6.1.4 Superpowers (obra; Claude Code plugin)

- **Model:** skills that trigger automatically: *brainstorming* (refines an idea through
  questions, explores alternatives, presents the design in sections for validation) →
  *writing-plans* (2–5 minute tasks with exact paths, code and verification) →
  *executing-plans* / TDD / review.
- **Ideas worth borrowing:**
  - interview-first ideation;
  - presenting a design in sections for incremental validation;
  - verification steps on every task.
- **Weaknesses for us:** one question at a time (you chose batched, Q14); plans at code
  level blur the spec/implement boundary (we chose file/interface level, OA-11); no EARS,
  no traceability IDs.
- **Interop:** our hand-off should be *consumable* by Superpowers' executing-plans (G-07).

#### 6.1.5 Kiro (AWS)

- IDE-native SDD with `requirements.md` (EARS), `design.md`, `tasks.md`, plus agent hooks.
- **Idea worth borrowing:** EARS as the default requirement syntax (already decided, Q8).
- Not a dependency: AWS-centric IDE, not Claude Code.

### 6.2 Cross-framework synthesis

| Capability | Spec Kit | OpenSpec | BMAD | Superpowers | Kiro | **Architect (target)** |
|---|---|---|---|---|---|---|
| Structured ideation / interview | ◐ (extension) | ◐ (explore) | ● (analyst) | ● (brainstorming) | ○ | ● batched, options-based |
| Web/doc research step | ◐ | ○ | ● | ○ | ○ | ● researcher + Context7 |
| Explicit options analysis | ○ | ○ | ◐ | ◐ | ○ | ● skill + agent + DEC records |
| Constitution / principles | ● | ◐ (project.md) | ◐ | ○ | ◐ (steering) | ● |
| EARS requirements | ○ (requested) | ○ | ○ | ○ | ● | ● |
| Given/When/Then scenarios | ◐ | ● (WHEN/THEN) | ◐ | ○ | ◐ | ● |
| Delta specs for brownfield | ○ | ● | ○ | ○ | ○ | ● |
| Code intelligence for grounding | ○ | ○ | ○ | ○ | ◐ | ● ripwire + Serena |
| Verified architecture diagrams | ○ | ○ | ○ | ○ | ○ | ● Archify |
| Deterministic traceability lint | ○ | ◐ (validate) | ○ | ○ | ○ | ● |
| Phase gates with hash pinning | ◐ | ◐ | ◐ | ◐ | ◐ | ● |
| Machine-readable progress registry | ○ | ◐ | ◐ | ○ | ◐ | ● |
| Implementation | ● | ● | ● | ● | ● | ○ (out of scope by design) |

● strong · ◐ partial · ○ absent

**Synthesis:** none of them combines strong ideation, enforced traceability and code-grounded
brownfield deltas. That combination is the reason to build our own suite instead of adopting
one of them.

### 6.3 What the evidence says about SDD

- **It helps, but not by itself.** Defect density roughly halves with a spec (0.46 vs 0.86),
  yet about 8% of spec-backed merges still diverge from their spec [VERIFY]. Our response:
  traceability IDs and a hand-off contract designed for a later conformance check.
- **EARS is the de facto standard for acceptance criteria that are unambiguous for both humans and models**
  (multiple 2026 guides). It standardizes phrasing; it does not test anything. That is why we
  pair it with Given/When/Then scenarios.
- **Over-specification is a real failure mode.** Critics point out that heavy frameworks
  produce more text than anyone reads. Our counter is not to write less (you explicitly want
  detail, Q16) but to keep it navigable: small focused files, stable IDs, an overview per
  phase that *indexes* rather than *summarizes*, and generated matrices.
- **Academic work (2026)** frames SDD as human-agent teamwork, with the human holding intent
  and the agent holding consistency. That matches our gate model: humans approve, agents check.

---

## 7. Landscape research: tools, MCP servers and skills

### 7.1 Disambiguation of the tools you named

| Name you used | What it actually is | Form factor | Notes |
|---|---|---|---|
| **Archify** | `tt-a1i/archify`: an *agent skill* (not an MCP) for verified architecture/workflow/sequence/data-flow/lifecycle diagrams | Skill + Node CLI (`node bin/archify.mjs …`), installed via `npx skills add tt-a1i/archify -g` | Another repo with the same name (`bluesky4485/archify`) is a simpler diagram skill; we mean **tt-a1i** (~23.5k stars). |
| **ripwire** | `redhat-et/ripwire`: a zero-dependency C++23 CLI and optional MCP server for ranked repo maps, blast radius, tests-to-run and quality deltas | Single binary; `--mcp` flag turns it into an MCP server | Several forks exist (whitecell-dev, mpapis, lennix1337, pt-act); upstream chosen [DECIDED Q10]. There is also a third-party `aquental/ripwire-broker` (a task-oriented 3-tool MCP over ripwire), not adopted. |
| **Serena** | `oraios/serena`: MCP toolkit for symbol-level retrieval and editing backed by language servers (40+ languages) or a JetBrains backend | Python; install with `uv tool install -p 3.13 serena-agent` | The project explicitly warns **not** to install it from MCP marketplaces (outdated commands). |

### 7.2 ripwire — details relevant to spec agents

- **Version:** 0.6.5 (2026-09-14); Apache-2.0. Windows x64 binary is **preview** [VERIFY on your
  machine]; it can be built from source with CMake 3.24+ and a C++23 compiler.
- **Verbs that matter to us (read-only):**

| Verb | Use in Architect | Phase |
|---|---|---|
| `ripwire . --for="<task>"` | Ranked symbols for a conceptual query; first orientation on a change | ideation (feasibility), spec (current state) |
| `--pack-task="<desc>"` | Ranking + bodies + callers + tests in one budgeted call; the cartographer's main input | spec |
| `--callers=SYM`, `--uses=SYM` | Who depends on what we will modify | spec (delta), plan (task ordering) |
| `--impact=SYM` | Blast radius + change amplification | plan (risk, task sizing) |
| `--test-gate` | Which tests reach the modified symbols | plan (test plan: regression set) |
| `--hotspots` | High-churn × high-complexity code | plan (risk register) |
| `--quality-panel` | Evidence ranking for risky symbols | plan (risk register) |
| `--pack-signatures` | Signatures at ~75% fewer bytes than bodies | interfaces section of the spec |
| `--doctor` | Install health | `/architect:doctor` |

- **Verbs we will not use:** the 3 span-addressed edit verbs (they write code; D-02),
  `--merge-scout` and `--pr-context` (review time, out of scope).
- **Honesty features worth relying on:** every truncation is disclosed, unindexed languages are
  named, `est_tokens=` appears in headers, and a zero result means "none found". The cartographer
  must pass these disclosures through into its evidence notes.
- **Token budget:** `--token-budget=N`, `--top-k=N`. The cartographer always sets a budget.
- **Context cost:** the installer stages **17 skills** for Claude Code. That is useful, but it
  adds to every session's skill listing. Decision OA-05b: install ripwire's skills only where
  the cartographer can reach them, or preload the one or two relevant ones into the
  cartographer's `skills:` [OPEN OQ-06].

### 7.3 Serena — details relevant to spec agents

- **Read-only operation:** `read_only: true` in `.serena/project.yml` and/or the **planning**
  mode, which excludes `create_text_file`, `replace_symbol_body`, `insert_*`, `delete_lines`,
  `replace_lines`, `replace_content` and `execute_shell_command`. Context `claude-code` for
  Claude Code clients.
- **Tools we want:** `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`,
  `search_for_pattern`, `list_dir`, `find_file`. Also, with the LSP backend, find
  implementations/declaration and diagnostics.
- **Memories:** Serena has its own project memory system (`.serena/memories`). It overlaps with
  Claude Code agent memory and with our `_living/` specs. Recommendation: **leave Serena
  memories off for Architect** so knowledge lives in one place (`.sdd/`).
- **Windows:** not explicitly documented as supported or unsupported in the README excerpt; it
  depends on Python 3.13 via uv and on per-language servers being installed [VERIFY].
- **Cost:** an MCP server adds tool schemas to the context of every agent that has it. Mitigation:
  scope Serena to the cartographer (and optionally the architect) only, via each agent's `tools`
  allowlist with the `mcp__serena__*` pattern, and exclude it from other agents.

### 7.4 Archify — details relevant to spec agents

- **Diagram types:** architecture (components, services, storage, trust boundaries; optional
  deployment-ownership profile), workflow, sequence, data-flow (lineage, PII boundaries),
  lifecycle (states, retries, terminal outcomes).
- **IR:** typed JSON with `nodes`, `edges`, `groups` and optional `evidence` pinned to a git
  commit and line ranges (nodes show `SRC n`). `meta` sets locale, animation and visual preset.
- **CLI:** `doctor`, `guide`, `validate <type> <file>`, `preview`, `deliver <type> <src> <out>`,
  `compare architecture base.json head.json <out>` (architecture delta). It returns
  machine-readable JSON diagnostics with repair hints, which suits an agent loop.
- **Why it fits a spec:** the JSON IR *is* the architecture model and can be checked by the
  lint; the HTML is the human view; `compare` gives an **as-is vs to-be architecture delta**,
  exactly the brownfield story (Q3).
- **Limit:** it does not parse Mermaid and has no auto-layout or general drawing. Hence the
  Mermaid fallback (Q12) for small inline diagrams (state machines inside a requirement file,
  for example).
- **Update check:** set `ARCHIFY_UPDATE_CHECK_DISABLED=1` in agent environments for
  determinism.

### 7.5 Research tooling

| Tool | Role | Cost / auth | Decision |
|---|---|---|---|
| WebSearch / WebFetch (built-in) | General research, competitor and prior-art scans | none | **Core** [DECIDED Q11] |
| **Context7** (`@upstash/context7-mcp` or remote `https://mcp.context7.com/mcp`) | Version-accurate library docs: `resolve-library-id` → `query-docs` | free tier; key optional | **Core** [DECIDED Q11] |
| **DeepWiki MCP** (Cognition; remote `https://mcp.deepwiki.com/mcp`) | Ask questions of *public GitHub repos* (`read_wiki_structure`, `read_wiki_contents`, `ask_question`); good for "how does library X do Y internally" | free, no auth, public repos only | **Proposed addition** (OQ-04) — not in your original list |
| Exa / Tavily / Perplexity | Higher-quality semantic search, multi-step research | paid keys | Optional slot, off by default |
| Firecrawl | Scraping hard pages | paid | Not needed for v1 |

### 7.6 Code-intelligence survey (Q9: "other authoritative tools, and tools we might have missed")

Sources: Sverklo's 12-server comparison (2026), the Repowise buyer's guide, GitNexus coverage
(MarkTechPost, April 2026) and the ast-grep docs. Benchmarks are mostly vendor-published
[VERIFY].

| Tool | Approach | License | Local? | Strength | Weakness for us | Verdict |
|---|---|---|---|---|---|---|
| **ripwire** | tree-sitter call graph, deterministic ranking, C++ binary | Apache-2.0 | yes | Blast radius, tests-to-run, hotspots, honest truncation, cheap CLI | Windows binary is preview; young (0.6) | **Core** |
| **Serena** | LSP-backed symbols | MIT | yes | 40+ languages, precise references | Python/uv + language-server setup; MCP schema cost | **Core (read-only, cartographer only)** |
| **Claude Code native LSP tool** | built-in `LSP` tool (inherited by subagents) | n/a | yes | Zero install where a language server is configured | Coverage depends on project setup | **Fallback** |
| **ast-grep** (+ `ast-grep-mcp`) | AST pattern search | MIT | yes | Structural queries ("all handlers without auth middleware") that make good *evidence* for NFRs and constraints | Not a graph; needs patterns | **Optional, recommended** (CLI, not MCP) |
| GitNexus | tree-sitter → KuzuDB knowledge graph, Cypher, 16 MCP tools, impact analysis, Claude Code hooks | **PolyForm Noncommercial** | yes | Expressive graph queries | **License forbids commercial use**, which clashes with "shareable later"; overlaps ripwire | **Rejected** |
| CodeGraph (TS) | local knowledge graph over MCP | OSS | yes | Popular (very fast growth in 2026) | Overlaps ripwire; another index to maintain | Watch-list |
| codebase-memory-mcp | single binary, symbol graph + git-aware diff, 66 languages | OSS | yes | Light, broad | Shallow graph; overlaps | Watch-list |
| jcodemunch-mcp | tree-sitter symbol index | dual / commercial fee | yes | Best definition lookup in one benchmark | Commercial license | Rejected |
| Sverklo | BM25 + embeddings + PageRank, memory | MIT | yes | Hybrid search, memory | Embeddings (ONNX) footprint; overlaps | Watch-list |
| Claude Context (Zilliz) | embeddings + BM25 | Apache-2.0 | partly (Milvus) | Cheap semantic search | No graph; external vector DB | Rejected |
| CodeGraphContext | graph in Neo4j | MIT | yes | Graph queries | Neo4j infrastructure | Rejected |
| Greptile / Sourcegraph | hosted | commercial | no | Enterprise scale | Code egress, cost | Rejected for v1 |
| Repomix | packs a repo into one file | MIT | yes | Handy for tiny repos | Floods the context; the opposite of ripwire's philosophy | Rejected |

### 7.7 Other tools and skills "we might have missed" (gap scan)

| Gap | Candidate | Recommendation |
|---|---|---|
| Structured requirement quality | No mature MCP found; implement as lint rules + critic using ISO/IEC/IEEE 29148 quality characteristics | Build in-house (§13.2) |
| ADR authoring | ADR conventions (MADR template) — no tool needed | Template in the `architecture-decisions` skill |
| C4-style models | Structurizr DSL, LikeC4 | Not v1 (Archify covers the views); revisit if you want model-as-code |
| API contracts | OpenAPI / JSON Schema / AsyncAPI files under `10-spec/50-interfaces/` | Yes: contracts as real schema files, linted for parseability |
| Sequential reasoning | "sequential-thinking" MCP | Not needed: Opus 5.5 at high/xhigh effort covers it; adds schema cost |
| GitHub issues export | GitHub MCP / `gh` CLI | v2: export tasks to issues (OQ-12) |
| Diagram rendering checks | Mermaid CLI (`@mermaid-js/mermaid-cli`) to validate syntax | Optional lint step (heavy: headless Chromium); v1 does a syntax-only regex sanity check |
| Requirements → tests scaffolding | Gherkin `.feature` files | Optional output format for acceptance scenarios (OQ-09) |
| Delegation reliability | `claude plugin eval` | Yes: write eval prompts for each agent description (§25) |

---

## 8. Option analyses

Scoring scale: 1 (poor) … 5 (excellent). Weights sum to 100%. "Weighted" = Σ(score × weight).
For each analysis, all 4–5 candidates are kept; the presented set is the top 2–3.

### OA-01 — Orchestration topology (Q5)

**Problem:** how do the phases get driven, given that subagents cannot call `AskUserQuestion`?

| Candidate | Q&A works | Re-entry per phase | Context hygiene | Simplicity | Robustness | Weighted |
|---|---|---|---|---|---|---|
| Weights | 30% | 20% | 20% | 15% | 15% | |
| A. Phase commands (main thread) + specialist subagents | 5 | 5 | 4 | 4 | 4 | **4.50** |
| B. Single `sdd-conductor` main-session agent + specialists | 5 | 2 | 4 | 4 | 4 | 3.90 |
| **C. Hybrid A+B: conductor for the end-to-end run, commands for re-entry, same specialists** | 5 | 5 | 4 | 3 | 4 | **4.35** |
| D. Agent team (persistent teammates) | 3 | 3 | 3 | 2 | 3 | 2.85 |
| E. Everything in one giant agent | 5 | 2 | 1 | 5 | 2 | 3.15 |

**Presented:** A (rec.), B, D. **You chose:** "1 + 2", which is C.
**Design for C:** the conductor and the commands are two front doors to the *same* procedure.
To avoid writing the procedure twice, each phase procedure lives in a skill
(`phase-ideation`, `phase-spec`, `phase-plan`). The conductor preloads all three; each command
loads exactly one. The ~0.15 simplicity cost of C over A is therefore paid once, in the skill
split.

### OA-02 — Packaging and distribution

| Candidate | Fits "you first, shareable later" | Hooks/MCP control | Dev loop speed | Versioning | Weighted |
|---|---|---|---|---|---|
| Weights | 30% | 25% | 25% | 20% | |
| A. Project-local `.claude/agents` in each target repo | 2 | 5 | 4 | 2 | 3.25 |
| B. User-level `~/.claude/agents` | 3 | 4 | 5 | 1 | 3.35 |
| **C. Plugin (agents/, skills/, commands/, hooks/hooks.json, .mcp.json, scripts/) installed from a local marketplace pointing at this repo** | 5 | 4 | 4 | 5 | **4.50** |
| D. Plugin + per-repo `.sdd/` overrides (constitution, templates) | 5 | 4 | 3 | 5 | 4.25 |
| E. Copy-in installer script | 3 | 5 | 2 | 2 | 3.05 |

**Presented:** C (rec.), D, B. **Recommendation:** C, with the D behaviour arriving
naturally: per-repo customization lives in `.sdd/_constitution/` and optional
`.sdd/_templates/` overrides, which the agents check before plugin defaults.
**Important constraint:** plugin subagents **ignore** `hooks`, `mcpServers` and
`permissionMode` in their own frontmatter. Hooks go in the plugin's `hooks/hooks.json` (with
`SubagentStart`/`SubagentStop` matchers on `architect:<agent>` where we need per-agent
behaviour); MCP servers go in the plugin's `.mcp.json`; tool restriction stays in `tools` /
`disallowedTools`, which plugins honour.
**Dev loop:** while developing, agents can also be symlinked into this repo's `.claude/agents/`
for instant reload; the plugin is the distribution format.

### OA-03 — The `.sdd/` description file (Q19)

**Problem:** agents (and implementers) must open `.sdd/` and immediately know what is there,
what to read and where each change stands, *including implementation status*.

| Candidate | Agent readability | Machine updatability | Human readability | Merge-conflict risk | Drift risk | Weighted |
|---|---|---|---|---|---|---|
| Weights | 25% | 25% | 20% | 15% | 15% | |
| A. Single `SDD.md` with prose + a big status table | 5 | 2 | 5 | 2 | 2 | 3.35 |
| B. Single `registry.json` | 3 | 5 | 2 | 3 | 4 | 3.45 |
| **C. `SDD.md` (stable contract: layout, reading order, conventions; generated status section) + `registry.json` (machine state written only by `sdd.mjs`) + `change.md` frontmatter per change** | 5 | 5 | 4 | 4 | 4 | **4.50** |
| D. YAML `sdd.yaml` only | 4 | 4 | 3 | 3 | 4 | 3.65 |
| E. Status only in each artifact's frontmatter, computed on demand | 4 | 3 | 3 | 5 | 5 | 3.85 |

**Presented:** C (rec.), E, D. **Recommendation:** C. **Rule:** frontmatter is the source
of truth for each artifact; `registry.json` is a *derived index* rebuilt by `sdd.mjs status
--write` and checked by the lint (G-06). The status block inside `SDD.md` sits between
`<!-- sdd:status:begin -->` / `<!-- sdd:status:end -->` markers and is regenerated, never
hand-edited. That keeps E's no-drift property and adds A's and B's readability.

### OA-04 — Decomposition of the spec and the plan into files (Q16)

| Candidate | Validation granularity | Navigability | Agent write parallelism | Diff/review friendliness | Over-fragmentation risk (inverted) | Weighted |
|---|---|---|---|---|---|---|
| Weights | 30% | 20% | 15% | 20% | 15% | |
| A. One `spec.md`, one `plan.md` | 2 | 3 | 1 | 2 | 5 | 2.50 |
| **B. Files by concern (stories, requirements, scenarios, NFRs, domain, interfaces, architecture, DoD, traceability)** | 4 | 4 | 4 | 4 | 4 | **4.00** |
| C. Files by capability (one folder per capability, each with stories/reqs/scenarios) | 5 | 4 | 5 | 4 | 3 | **4.30** |
| D. One file per requirement | 5 | 2 | 5 | 3 | 1 | 3.40 |
| E. Hybrid: by concern at the top, by capability inside requirements and scenarios | 5 | 4 | 5 | 4 | 3 | **4.30** |

**Presented:** E (rec.), C, B. **Recommendation:** E. Cross-cutting concerns (overview,
NFRs, domain model, architecture, DoD) are single files or folders; the functional core
(`20-requirements/`, `30-acceptance/`) is split **per capability** (`CAP-01-billing.md`, …).
That matches OpenSpec's per-capability living specs, so merging deltas into `_living/` is a
file-level operation. The detailed tree is in §11.

### OA-05 — Code-intelligence stack (Q9, widened)

| Candidate | Grounding quality | Token cost | Windows viability | Setup burden (inverted) | License/sharing | Weighted |
|---|---|---|---|---|---|---|
| Weights | 30% | 20% | 20% | 15% | 15% | |
| **A. ripwire CLI + Serena MCP (read-only, cartographer-scoped) + native LSP/Grep fallback** | 5 | 4 | 3 | 3 | 5 | **4.10** |
| B. A + ast-grep CLI for structural evidence | 5 | 4 | 3 | 2 | 5 | 3.95 |
| C. ripwire CLI only + LSP/Grep fallback | 4 | 5 | 3 | 4 | 5 | **4.15** |
| D. GitNexus (MCP + hooks) | 4 | 3 | 4 | 3 | 1 | 3.20 |
| E. Built-ins only (Grep/Glob/LSP) | 2 | 3 | 5 | 5 | 5 | 3.70 |

**Presented:** A (rec., your choice), C, B. C edges A by 0.05 on raw score (cheaper, simpler),
but A wins on the highest-weighted criterion, grounding quality. That criterion matters most
for Q16: precise references for MODIFIED requirements on polyglot repos, where tree-sitter call
graphs can mis-resolve dynamic dispatch and LSP does not. The 0.05 gap is within scoring noise,
so the qualitative argument decides.
**Recommendation:** A as the core, with **B's ast-grep as an optional capability** the
cartographer uses only if `ast-grep` is on PATH. Everything degrades in this order:
ripwire → Serena → LSP → Grep/Glob, and the cartographer records which layer produced each
piece of evidence (`evidence.source: ripwire|serena|lsp|grep|ast-grep`).

### OA-06 — Research stack (Q11 + DeepWiki discovery)

| Candidate | Accuracy on libraries | Breadth | Cost | Setup | Weighted |
|---|---|---|---|---|---|
| Weights | 35% | 25% | 20% | 20% | |
| A. WebSearch/WebFetch + Context7 | 5 | 4 | 5 | 4 | **4.55** |
| **B. A + DeepWiki MCP (remote, no auth)** | 5 | 5 | 5 | 4 | **4.80** |
| C. Exa + Context7 | 5 | 5 | 2 | 3 | 4.00 |
| D. Built-in only | 2 | 4 | 5 | 5 | 3.70 |
| E. GPT-Researcher MCP | 4 | 5 | 2 | 2 | 3.45 |

**Presented:** B (rec.), A (your choice), C. **Recommendation:** B. DeepWiki adds the
question "how does upstream library/repo X actually implement Y", which Context7 (API docs)
does not answer, at zero cost. Scope it to the researcher agent only. → **OQ-04**.

### OA-07 — Traceability enforcement (Q16)

| Candidate | Determinism | Catches semantic gaps | Cost per run | Explainability | Weighted |
|---|---|---|---|---|---|
| Weights | 35% | 30% | 15% | 20% | |
| A. Critic agent only | 1 | 5 | 2 | 4 | 2.95 |
| B. Node lint only | 5 | 1 | 5 | 4 | 3.60 |
| **C. Node lint (hard gate) + critic agent (advisory + blocking severities) + hooks running a fast lint after every write to `.sdd/`** | 5 | 5 | 3 | 5 | **4.70** |
| D. JSON-schema-validated YAML artifacts instead of markdown | 5 | 1 | 5 | 2 | 3.20 |
| E. External requirements tool (Doorstop, …) | 4 | 1 | 4 | 3 | 2.90 |

**Presented:** C (rec., your choice), B, A. **Design:** lint findings are `error`
(blocks the gate), `warn` (needs an explicit waiver in the gate record) or `info`. Critic
findings are `blocker`, `major` or `minor`; blockers must be resolved or waived by you at the gate.

### OA-08 — Identifier scheme

| Candidate | Stability across edits | Global uniqueness | Readability | Merge safety | Weighted |
|---|---|---|---|---|---|
| Weights | 35% | 25% | 20% | 20% | |
| A. Per-change sequential (`REQ-001` within CHG-004) | 4 | 2 | 5 | 3 | 3.50 |
| **B. Change-scoped prefix (`C004-REQ-012`, `C004-AC-012.3`, `C004-T-031`)** | 5 | 5 | 4 | 4 | **4.60** |
| C. UUIDs | 5 | 5 | 1 | 5 | 4.20 |
| D. Capability-scoped (`BILL-REQ-03`) | 4 | 3 | 5 | 3 | 3.75 |
| E. Hierarchical numbering (`3.2.1`) | 1 | 2 | 4 | 2 | 2.05 |

**Presented:** B (rec.), D, C. **Recommendation:** B, with a short alias in prose. Inside a
change folder, agents may write `REQ-012`; the lint resolves it to `C004-REQ-012`. Living specs
in `_living/` keep the *originating* full ID, so a requirement's provenance survives archiving.
IDs are **never reused**, and deleted IDs are tombstoned in the change's `ids.json` (managed by
`sdd.mjs id next <type>`).

### OA-09 — Living-spec strategy (brownfield, Q3)

| Candidate | Brownfield fidelity | Effort | Later code-validation value | Simplicity | Weighted |
|---|---|---|---|---|---|
| Weights | 30% | 20% | 30% | 20% | |
| A. Per-change specs only, no living view | 2 | 5 | 2 | 5 | 3.20 |
| **B. OpenSpec-style: `_living/` per capability + per-change deltas (ADDED/MODIFIED/REMOVED/RENAMED), merged at "archive" once the implementer reports done** | 5 | 3 | 5 | 3 | **4.20** |
| C. Single master spec edited in place | 3 | 3 | 3 | 4 | 3.20 |
| D. Living view generated on demand from all approved changes | 4 | 2 | 4 | 2 | 3.20 |
| E. Reverse-engineer the living spec from code every time | 3 | 1 | 3 | 1 | 2.20 |

**Presented:** B (rec.), A, D. **Recommendation:** B. Note that the *merge into `_living/`*
happens after implementation, which is out of scope for our agents. We provide
`/architect:archive <change>` as a **spec-maintenance** command (it touches only `.sdd/`), run
once the implementer reports the change done. That fits the scope, because it edits specs,
not code. → **[DECIDED OQ-07a: in v1]**.

### OA-10 — Running the interview when subagents cannot ask

| Candidate | UX | Context efficiency | Correctness | Weighted |
|---|---|---|---|---|
| Weights | 40% | 30% | 30% | |
| **A. Main thread asks; specialists return structured `questions[]` (with options pre-researched) which the main thread batches into AskUserQuestion rounds** | 5 | 4 | 5 | **4.70** |
| B. Main thread does everything itself (no specialists during ideation) | 5 | 1 | 4 | 3.50 |
| C. Specialists write questions to a file; you answer by editing | 2 | 5 | 4 | 3.50 |
| D. Agent team member with direct channel | 3 | 3 | 3 | 3.00 |

**Recommendation:** A. It mirrors how this session worked: research in parallel, then
batched questions with options. A JSON contract for `questions[]` is part of the
`interview-protocol` skill (§15.4).

### OA-11 — Plan granularity (the hand-off level)

| Candidate | Executability by any implementer | Validatability later | Stays out of implementation (Q2) | Robustness to code drift | Weighted |
|---|---|---|---|---|---|
| Weights | 30% | 30% | 20% | 20% | |
| A. Epic/story level only | 2 | 2 | 5 | 5 | 3.20 |
| **B. Task = one coherent change to named files/interfaces, with REQ/AC links, preconditions, step outline, verification commands and a done-check; no production code** | 5 | 5 | 4 | 4 | **4.60** |
| C. Superpowers-style 2–5 min tasks with complete code | 5 | 4 | 1 | 2 | 3.30 |
| D. Task = test scenario (write test X, make it pass) | 4 | 5 | 4 | 3 | 4.10 |
| E. B with optional interface *signatures* (no bodies) | 5 | 5 | 4 | 3 | 4.40 |

**Presented:** B (rec.), E, D. **Recommendation:** B, with E allowed **only in
`10-spec/50-interfaces/`**. Signatures belong to the spec's contract, not to tasks. Tasks
are *test-anchored* (each lists the TS-xxx scenarios that prove it done), which borrows D's
strength.

### OA-12 — `sdd.mjs` dependency policy (Q18)

| Candidate | Install friction | Robustness of parsing | Maintainability | Weighted |
|---|---|---|---|---|
| Weights | 40% | 35% | 25% | |
| A. Zero deps, hand-rolled markdown/frontmatter parsing | 5 | 3 | 3 | 3.80 |
| **B. Small vendored deps (a YAML parser bundled into the script by esbuild at build time) → still a single file at runtime** | 5 | 5 | 4 | **4.75** |
| C. Normal npm deps (`npm i` on install) | 2 | 5 | 5 | 3.80 |
| D. Deno/Bun single binary | 3 | 5 | 3 | 3.70 |

**Recommendation:** B. The source has dependencies (`yaml`, maybe `remark` for markdown
AST); the distributed artifact is one bundled `scripts/sdd.mjs`, runnable with plain
`node` ≥ 20.

### OA-13 — Agent memory usage

| Candidate | Value | Risk of stale or contradictory knowledge | Weighted (50/50) |
|---|---|---|---|
| A. No agent memory; all knowledge in `.sdd/` | 3 | 5 | 4.00 |
| **B. `memory: project` only for the cartographer (codebase navigation notes) and the researcher (source-quality notes); everything else memoryless** | 4 | 4 | **4.00** (tie → B for value) |
| C. Memory for all agents | 4 | 2 | 3.00 |
| D. User-level memory for cross-project learnings of the critic | 3 | 3 | 3.00 |

**Recommendation:** B, and memory never holds decisions or requirements. Those must live in
`.sdd/` so they are reviewable. → **OQ-08**.

### OA-14 — Plugin and command naming

| Candidate | Clarity | Collision risk | Typing ergonomics |
|---|---|---|---|
| **A. Plugin `architect`, commands `/architect:ideate` …, agents `sdd-*`** | 4 | 4 | 4 |
| B. Plugin `sdd`, commands `/sdd:ideate` | 5 | 2 (generic; other SDD plugins) | 5 |
| C. Plugin `spec-forge` | 3 | 5 | 3 |

**Recommendation:** A (repo name continuity), but this is cosmetic → **OQ-01**.

---

## 9. Design principles

These principles turn the Q&A into rules the agents and the critic can check.

| ID | Principle | Operational rule |
|---|---|---|
| P-01 | **Specs, not code.** | Spec agents write only under `.sdd/`. A `PreToolUse` guard denies Write/Edit outside it; Bash is allowlisted to read-only commands (§17.3). |
| P-02 | **Detail over summary.** (Q16) | No artifact may be a summary of another. Overviews *index* (links + IDs) and never paraphrase. Minimum-content lint rules per artifact type (§13.8). |
| P-03 | **Every claim has a source.** | Research claims cite URLs; code claims cite `path:line` + symbol + evidence layer; decisions cite a DEC record; requirements cite a story. |
| P-04 | **Every requirement is verifiable.** | EARS form + ≥1 Given/When/Then scenario + measurable values for NFRs. "Fast", "user-friendly", "robust" and similar words are banned unless quantified (lint word-list). |
| P-05 | **Every decision shows its alternatives.** (Q15) | Material decisions → DEC record with ≥2 presented options, scores and the rejected list. |
| P-06 | **Ask, don't assume.** | Unknowns become `[NEEDS CLARIFICATION: …]` markers (borrowed from Spec Kit) or interview questions. A gate cannot pass with open markers unless you waive them. |
| P-07 | **Stable identity.** | IDs never change meaning and are never reused (OA-08). |
| P-08 | **Gate before you build on it.** (Q13) | A phase starts only from an *approved, hash-matching* predecessor. |
| P-09 | **Cheapest sufficient tool.** | ripwire CLI before MCP; ripwire before Serena; Serena before reading whole files; Haiku for bookkeeping. |
| P-10 | **Degrade, never fail silently.** | When a tool is missing, say which layer was used and what is weaker as a result (e.g. "evidence from grep only — references unverified"). |
| P-11 | **Brownfield = delta.** (Q3) | Specs for existing systems are ADDED/MODIFIED/REMOVED/RENAMED against `_living/` or against cartographer evidence. |
| P-12 | **Portable core.** (Q1) | Standards, templates and procedures are plain markdown with no Claude-specific syntax; Claude-specific wiring lives only in frontmatter, hooks and commands. |
| P-13 | **Traceable both ways.** | Story ↔ REQ ↔ AC/TS ↔ task ↔ DoD, generated as a matrix; orphans in either direction are lint errors. |
| P-14 | **Human owns intent; agents own consistency.** | Agents never approve a gate; only you can (the conductor records your approval verbatim). |

---

## 10. Phase model

### 10.1 Overview

```
            ┌───────────────────────────── /architect:revise <phase> (re-entry) ────────────────────┐
            ▼                                                                                        │
 /architect:init ─► 00-IDEATION ──G1──► 10-SPEC ──G2──► 20-PLAN ──G3──► HAND-OFF ──► implementer   │
                    │                    │                │                  │          (external)  │
                    │ interview rounds   │ spec-writer    │ architect        │ handoff.md           │
                    │ researcher         │ test-designer  │ planner          │ registry: ready      │
                    │ cartographer       │ architect      │ test-designer    │                      │
                    │ options-analyst    │ cartographer   │ cartographer     ▼                      │
                    │ critic             │ critic, lint   │ critic, lint   status reports ──────────┘
                    ▼                    ▼                ▼               (task done / blocked /
               ideation.md+          10-spec/*        20-plan/*            spec defect found)
               research/, DEC-*                                                 │
                                                                                ▼
                                                                    /architect:archive → _living/
```

### 10.2 Phase 0 — Workspace init (`/architect:init`)

| Aspect | Definition |
|---|---|
| Purpose | Create `.sdd/` in a target repo, the constitution and the tool inventory |
| Inputs | Target repo; optional existing docs (README, ADRs, CLAUDE.md) |
| Steps | 1. `sdd.mjs init` scaffolds `.sdd/` (§11). 2. `sdd-cartographer` runs a **baseline survey** (languages, size, ripwire `--doctor`, Serena availability, test layout, build commands). 3. The conductor runs a short interview (≤2 rounds) to draft `_constitution/constitution.md` (quality bar, NFR defaults, forbidden tech, DoD defaults). 4. Tool inventory written to `.sdd/_constitution/toolchain.md`. |
| Outputs | `.sdd/SDD.md`, `registry.json`, `_constitution/{constitution.md, toolchain.md, glossary.md}`, `_living/` — empty for greenfield; for brownfield, one `CAP-*.md` stub per detected capability containing a **capability inventory** only (purpose line, entry points, main modules, owning tests, evidence layer), no requirements [DECIDED OQ-07b] |
| Exit | Constitution `approved` (gate G0, lightweight) |

### 10.3 Phase 1 — Ideation (`00-ideation/`)

| Aspect | Definition |
|---|---|
| Purpose | Understand the *why* and the *what*, and decide the approach; reduce uncertainty before committing to requirements |
| Entry | Change folder created (`sdd.mjs change new "<title>"`); constitution approved |
| Activities | (a) Restate the idea and find ambiguities. (b) **Parallel fan-out:** researcher (prior art, libraries, standards, competitor patterns), cartographer (feasibility, affected areas, blast-radius preview for brownfield), options-analyst (initial option space for the 1–3 key decisions). (c) **Interview rounds** (§15.4): ≤4 questions each, 2–3 options per question, recommendation first. Repeat until the critic's "ideation readiness" checklist passes or you stop. (d) Write the ideation document and its satellites. (e) Critic pass. (f) Gate G1. |
| Outputs | `ideation.md` (this document is the reference example), `questions-log.md` (every round, options and answers verbatim), `research/R-xxx-*.md` (one note per research thread with sources), `options/OA-xxx-*.md` (full analyses), `decisions/DEC-xxx-*.md`, `critic-report.md` |
| Exit criteria | No `blocker` critic findings; every [OPEN] question either answered or explicitly deferred to the spec with an owner; problem statement, goals, non-goals, scope boundary and key decisions present; you approve (G1) |
| Typical size | 800–2000 lines total across files for a medium feature (you asked for depth) |

### 10.4 Phase 2 — Specification (`10-spec/`)

| Aspect | Definition |
|---|---|
| Purpose | Define **what** the system shall do, verifiably, without prescribing implementation beyond architecture-level constraints |
| Entry | G1 approved and hash-matching |
| Activities | (a) spec-writer derives **capabilities** and **user stories** from ideation. (b) For each story: EARS requirements, then test-designer writes Given/When/Then scenarios (happy path, alternates, edge cases, errors, abuse). (c) NFRs with metrics. (d) Domain model and glossary. (e) Interfaces/contracts (OpenAPI/JSON Schema/CLI/events). (f) architect writes the **architecture view** (as-is and to-be for brownfield) as Archify IR + HTML + narrative, plus Mermaid where inline helps. (g) Brownfield: cartographer evidence for every MODIFIED/REMOVED item. (h) DoD (feature-level, inheriting constitution defaults). (i) `sdd.mjs trace` builds the matrix. (j) Lint, critic, interview rounds to resolve `[NEEDS CLARIFICATION]`. (k) Gate G2. |
| Outputs | See §11.3 tree |
| Exit criteria | Lint: 0 errors; critic: 0 unresolved blockers; every story has ≥1 REQ; every REQ has ≥1 AC with ≥1 scenario; every NFR has a metric and a measurement method; every interface is parseable; you approve (G2) |

### 10.5 Phase 3 — Planning (`20-plan/`)

| Aspect | Definition |
|---|---|
| Purpose | Define **how** and **in what order** the change will be built and verified, precisely enough for any implementer and for a later conformance check |
| Entry | G2 approved and hash-matching |
| Activities | (a) architect writes **ADRs** for the remaining technical decisions (via options-analysis). (b) Cartographer: blast radius (`--impact`), regression test set (`--test-gate` on the target symbols, or a heuristic when nothing is staged), hotspots. (c) planner: work breakdown (milestones → tasks), dependency graph, task files. (d) test-designer: test plan (levels, the scenario-to-test mapping, test data, environments, regression set). (e) Risk register, rollout/migration/rollback plan, observability plan. (f) Traceability (REQ → T → TS → DoD). (g) `handoff.md`. (h) Lint, critic, Gate G3. |
| Outputs | See §11.4 tree |
| Exit criteria | Every REQ is covered by ≥1 task; every task lists target paths/interfaces, REQ/AC links, verification steps and done-checks; the task DAG is acyclic; every scenario maps to a planned test; the risk register covers every hotspot touched; you approve (G3) |

### 10.6 Hand-off contract

The hand-off is the boundary between our agents and the implementer. `20-plan/handoff.md`
tells the implementer:

1. **Reading order** (constitution → spec overview → capability files → plan strategy → tasks
   in DAG order).
2. **Rules:** do not change requirements; if a requirement is wrong, report a *spec defect*
   instead of working around it.
3. **Reporting protocol** (implementer → `.sdd/`):
   - `node scripts/sdd.mjs task set C004-T-031 --status done --commit <sha> [--note "…"]`
   - `node scripts/sdd.mjs task set C004-T-032 --status blocked --reason "…"`
   - `node scripts/sdd.mjs defect add --ref C004-REQ-012 --summary "…"` (opens a spec defect
     that the conductor picks up on `/architect:revise spec`)
   - For implementers that cannot run scripts: tick the checkbox in the task file's
     `status:` frontmatter; the lint reconciles the registry.
4. **Done for the change** = all tasks done + DoD checklist evidence filled in + no open spec
   defects. Then `/architect:archive` merges deltas into `_living/`.

This is how `.sdd/` knows "where we are in terms of implementation" [DECIDED, Q19] without
our agents implementing anything.

### 10.7 Re-entry (`/architect:revise <phase> [--reason]`)

- Re-opening a phase sets its status back to `in-revision` and marks **every downstream
  phase `stale`** (its approval hash no longer matches its predecessor).
- The conductor computes the **impact** of the revision: which IDs changed (diff of the ID
  sets plus content hashes per ID), and therefore which downstream items need review. It
  reports this as a list, so you don't have to re-review everything.
- Downstream phases are revised incrementally: only affected files are rewritten, and the
  critic re-checks the touched IDs plus the matrix.

---

## 11. The `.sdd/` workspace

### 11.1 Root layout [PROPOSED, realising Q19]

```
.sdd/
├── SDD.md                      # description file: what's here, how to read it, conventions,
│                               #   and a generated status block (between sdd:status markers)
├── registry.json               # derived machine index (changes, phases, statuses, hashes,
│                               #   task progress, defects) — written only by sdd.mjs
├── _constitution/
│   ├── constitution.md         # principles, quality bar, NFR defaults, DoD defaults, forbidden tech
│   ├── toolchain.md            # detected tools (ripwire/Serena/Archify/ast-grep versions, fallbacks)
│   └── glossary.md             # project-wide ubiquitous language
├── _living/                    # current-state specs per capability (OpenSpec-style)
│   ├── CAP-billing.md
│   └── …
├── _decisions/                 # cross-change ADRs promoted from changes (optional)
├── _templates/                 # optional per-repo overrides of plugin templates
├── _archive/                   # archived change folders (after merge into _living)
└── 001-architect-agent-suite/  # one folder per change: NNN-kebab-slug
    ├── change.md               # change manifest (frontmatter = state; body = index of the change)
    ├── ids.json                # ID allocator + tombstones for this change
    ├── 00-ideation/
    ├── 10-spec/
    └── 20-plan/
```

### 11.2 `00-ideation/` tree

```
00-ideation/
├── ideation.md                 # main document (problem, goals, decisions, design direction)
├── questions-log.md            # every interview round: questions, options, recommendation, answer
├── research/
│   ├── R-001-<topic>.md        # one research thread each: question, sources, findings, confidence
│   └── …
├── options/
│   ├── OA-001-<topic>.md       # full option analysis (all candidates, weights, scores, rationale)
│   └── …
├── decisions/
│   ├── DEC-001-<topic>.md      # decision record (MADR-like), links to OA
│   └── …
├── evidence/                   # brownfield only: cartographer survey + feasibility notes
│   └── baseline-survey.md
└── critic-report.md
```

(For CHG-001 we bootstrap with only `ideation.md`. The satellites are written once the suite
exists, or extracted from this document during the spec phase — OQ-15.)

### 11.3 `10-spec/` tree

```
10-spec/
├── 00-index.md                 # navigation only: capability list, ID ranges, reading order (no prose summary)
├── 10-context/
│   ├── problem-and-goals.md    # traced from ideation (IDs IDEA-§…)
│   ├── stakeholders-and-personas.md
│   ├── scope.md                # in/out, assumptions, constraints, dependencies
│   └── current-state.md        # brownfield: as-is behaviour with cartographer evidence
├── 20-capabilities/
│   ├── CAP-01-<name>/
│   │   ├── stories.md          # US-xxx with persona, goal, value, notes, priority (MoSCoW), size hint
│   │   ├── requirements.md     # REQ-xxx in EARS; delta tag (ADDED/MODIFIED/REMOVED/RENAMED) when brownfield
│   │   ├── acceptance.md       # AC-xxx.n with Given/When/Then scenarios (TS-xxx), data tables, edge/error/abuse cases
│   │   └── ui-notes.md         # optional: states, copy, accessibility requirements
│   └── CAP-02-<name>/…
├── 30-nfr/
│   ├── performance.md          # NFR-xxx with metric, threshold, measurement method, environment
│   ├── security-privacy.md     # threats (STRIDE-lite), data classification, authz rules
│   ├── reliability.md
│   ├── observability.md
│   ├── accessibility.md        # if UI
│   └── compatibility.md        # platforms, versions, migrations, backward-compat
├── 40-domain/
│   ├── domain-model.md         # entities, attributes, invariants (INV-xxx), lifecycles
│   ├── state-machines.md       # Mermaid stateDiagram + transition tables
│   └── glossary-delta.md       # terms added to _constitution/glossary.md on archive
├── 50-interfaces/
│   ├── README.md               # list of contracts with IDs (IF-xxx)
│   ├── openapi.yaml            # or *.schema.json, events.asyncapi.yaml, cli.md, signatures.md
│   └── errors.md               # error catalogue (ERR-xxx) with codes and user messages
├── 60-architecture/
│   ├── architecture.md         # narrative: views, components (COMP-xxx), responsibilities, boundaries
│   ├── as-is.architecture.json # Archify IR (brownfield) with evidence pinned to commit
│   ├── to-be.architecture.json # Archify IR
│   ├── as-is.html / to-be.html / delta.html   # Archify deliver + compare outputs
│   ├── sequences/*.sequence.json (+ .html)    # key flows (one per critical scenario)
│   ├── dataflow.dataflow.json (+ .html)       # if data/PII matters
│   └── constraints.md          # architecture constraints (CON-xxx) the plan must respect
├── 70-dod.md                   # feature DoD (DOD-xxx), inheriting constitution defaults
├── 80-traceability.md          # GENERATED: US ↔ REQ ↔ AC/TS ↔ NFR ↔ COMP ↔ IF
├── 85-open-items.md            # GENERATED: [NEEDS CLARIFICATION] markers, waivers
└── 90-critic-report.md
```

### 11.4 `20-plan/` tree

```
20-plan/
├── 00-index.md                 # navigation only
├── 10-strategy.md              # approach, sequencing rationale, milestones (M-x), feature flags
├── 20-decisions/
│   └── ADR-xxx-<topic>.md      # technical decisions (from options-analysis), linked to CON/COMP
├── 30-impact/
│   ├── blast-radius.md         # ripwire --impact/--callers per touched symbol (evidence)
│   ├── hotspots.md             # ripwire --hotspots / --quality-panel for touched areas
│   └── regression-set.md       # tests that must keep passing (ripwire --test-gate / heuristics)
├── 40-work-breakdown.md        # milestones → tasks; Mermaid DAG; critical path
├── 50-tasks/
│   ├── T-001-<slug>.md         # one file per task (template in §12.5)
│   └── …
├── 60-test-plan.md             # levels, TS → test mapping (TC-xxx), data, environments, tooling
├── 70-risks.md                 # RISK-xxx: likelihood, impact, mitigation, trigger, owner
├── 75-rollout.md               # migration, data backfill, flags, rollback (RB-xxx), comms
├── 78-observability.md         # logs/metrics/traces/alerts that prove NFRs in production
├── 80-traceability.md          # GENERATED: REQ ↔ T ↔ TS/TC ↔ DOD ↔ RISK
├── 85-open-items.md            # GENERATED
├── 90-critic-report.md
└── handoff.md                  # contract for the implementer (§10.6)
```

### 11.5 `SDD.md` — the description file (draft content)

```markdown
---
sdd_version: 1
workspace: .sdd
generator: architect-plugin@<version>
id_scheme: "C{NNN}-{TYPE}-{seq}"   # e.g. C004-REQ-012
---
# Spec-Driven Development workspace

This folder holds the specifications for this repository. Agents: read this file first.

## How to orient yourself (agents)
1. Read `registry.json` → find changes with `status != archived`.
2. For the change you work on, read `NNN-slug/change.md` (phase, gate state, open defects).
3. Respect phase order: 00-ideation → 10-spec → 20-plan. Never consume an artifact whose
   `status` is not `approved` or whose `approved_hash` does not match its content.
4. Current system truth lives in `_living/`; per-change deltas live in the change folders.
5. Project rules: `_constitution/constitution.md`. Terms: `_constitution/glossary.md`.

## If you are implementing a change
Read `NNN-slug/20-plan/handoff.md` and report progress with `node <plugin>/scripts/sdd.mjs task set …`.

## Conventions
- IDs: US, REQ, AC, TS, NFR, INV, IF, ERR, COMP, CON, DEC, ADR, T, TC, RISK, DOD, M.
- Status: draft → in-review → approved → (stale | in-revision) → archived.
- Markers: `[NEEDS CLARIFICATION: …]`, `[ASSUMPTION: …]`, `[WAIVED: <gate> <reason>]`.

<!-- sdd:status:begin -->
| Change | Title | Phase | Status | Tasks done | Open defects | Updated |
|---|---|---|---|---|---|---|
| 001 | Architect agent suite | 00-ideation | draft | – | 0 | 2026-10-10 |
<!-- sdd:status:end -->
```

### 11.6 `registry.json` (draft schema)

```json
{
  "sdd_version": 1,
  "generated_at": "2026-10-10T12:00:00Z",
  "changes": [
    {
      "id": "CHG-001",
      "slug": "001-architect-agent-suite",
      "title": "Architect agent suite",
      "kind": "greenfield",
      "phase": "00-ideation",
      "phases": {
        "00-ideation": { "status": "draft", "approved_hash": null, "approved_at": null, "approved_by": null },
        "10-spec":     { "status": "not-started" },
        "20-plan":     { "status": "not-started" }
      },
      "implementation": {
        "status": "not-started",
        "tasks": { "total": 0, "done": 0, "blocked": 0, "in_progress": 0 },
        "last_report": null
      },
      "defects": [],
      "waivers": []
    }
  ]
}
```

### 11.7 `change.md` (manifest per change)

Frontmatter: `id`, `title`, `kind` (greenfield/brownfield/mixed), `capabilities[]`,
`phase`, per-phase `status` / `approved_hash` / `approved_at` / `approved_by`,
`implementation.status`, `owners`, `links` (issues, PRs). Body: a short index of the
change's folders and **the gate log** (each approval or rejection with date, your verbatim
decision text, waived items).

---

## 12. Artifact model, identifiers and traceability

### 12.1 ID types

| Prefix | Meaning | Defined in | Must link to |
|---|---|---|---|
| `IDEA-§n` | Section of the ideation doc | ideation.md | — |
| `R` | Research note | 00-ideation/research | sources (URLs) |
| `OA` | Option analysis | 00-ideation/options, 20-plan | DEC or ADR |
| `DEC` | Product/approach decision | 00-ideation/decisions | OA, IDEA-§ |
| `CAP` | Capability (group of stories) | 10-spec/20-capabilities | — |
| `US` | User story | stories.md | CAP, IDEA-§ or DEC |
| `REQ` | EARS functional requirement | requirements.md | US (≥1) |
| `AC` | Acceptance criterion (numbered per REQ: `AC-012.1`) | acceptance.md | REQ (exactly 1) |
| `TS` | Test scenario (Given/When/Then) | acceptance.md | AC (≥1) |
| `NFR` | Non-functional requirement | 30-nfr | US or CON or constitution |
| `INV` | Domain invariant | 40-domain | REQ or NFR |
| `IF` | Interface/contract | 50-interfaces | REQ |
| `ERR` | Error code | 50-interfaces/errors.md | REQ/AC (unwanted-behaviour) |
| `COMP` | Architecture component | 60-architecture | REQ/NFR it realizes |
| `CON` | Architecture constraint | 60-architecture/constraints.md | DEC/ADR/NFR |
| `DOD` | Definition-of-done item | 70-dod.md | REQ/NFR or "global" |
| `ADR` | Technical decision | 20-plan/20-decisions | OA, CON/COMP |
| `M` | Milestone | 10-strategy.md | — |
| `T` | Task | 50-tasks | REQ/AC (≥1), COMP, M |
| `TC` | Planned test case | 60-test-plan.md | TS (≥1), T |
| `RISK` | Risk | 70-risks.md | T or COMP |
| `RB` | Rollback step | 75-rollout.md | T or M |

Full form: `C{NNN}-{PREFIX}-{seq}` (OA-08). Change-local shorthand is allowed in prose.

### 12.2 Traceability rules (lint-enforced)

| Rule | Severity |
|---|---|
| TR-01 Every US has ≥1 REQ | error |
| TR-02 Every REQ links ≥1 US, and has ≥1 AC | error |
| TR-03 Every AC has ≥1 TS | error |
| TR-04 Every NFR has metric + threshold + method | error |
| TR-05 Every REQ and NFR is covered by ≥1 DOD (directly or via a global DoD rule) | error |
| TR-06 (plan) Every REQ is covered by ≥1 T | error |
| TR-07 (plan) Every T links ≥1 REQ/AC and ≥1 TS/TC for verification | error |
| TR-08 (plan) Every TS maps to ≥1 TC | error |
| TR-09 Every MODIFIED/REMOVED REQ has code evidence (path + symbol + layer) | error (brownfield) |
| TR-10 Every COMP in to-be IR appears in architecture.md and realizes ≥1 REQ/NFR | warn |
| TR-11 Task DAG acyclic; every `depends_on` resolves | error |
| TR-12 No dangling references (any ID mentioned must exist or be tombstoned) | error |
| TR-13 No ID reuse; tombstoned IDs never reappear | error |
| TR-14 Every RISK with impact ≥ high has a mitigation task or an explicit acceptance | warn |
| TR-15 Every hotspot from `30-impact/hotspots.md` touched by a T appears in RISK | warn |

### 12.3 Matrix generation

`sdd.mjs trace <change>` parses all artifacts, builds a graph and writes:

- `80-traceability.md` (markdown tables, forward and backward),
- `trace.json` (machine form, for the future conformance checker, NG-03 / v2),
- orphan and coverage statistics (included in the gate summary).

### 12.4 Requirement entry format (in `requirements.md`)

```markdown
### C004-REQ-012 — Reject expired payment methods
- **Delta:** MODIFIED (was C001-REQ-044 in `_living/CAP-billing.md`)
- **Pattern:** unwanted-behaviour
- **Statement:** IF the selected payment method's expiry date is before the current date,
  THEN the checkout service SHALL reject the payment with error `ERR-PAY-007` and SHALL NOT
  create a payment intent.
- **Rationale:** DEC-003 (fail fast before PSP call; avoids PSP fees, see R-004).
- **Stories:** C004-US-005
- **Priority:** Must
- **Acceptance:** C004-AC-012.1, C004-AC-012.2
- **Evidence (current behaviour):** `src/checkout/payments.ts:118` `createIntent()` — no expiry
  check; source: serena `find_symbol` + ripwire `--callers=createIntent` (7 callers).
- **Open items:** none
```

### 12.5 Task file format (`20-plan/50-tasks/T-xxx-*.md`)

```markdown
---
id: C004-T-031
title: Add expiry validation to payment-method selection
milestone: C004-M-2
status: todo            # todo | in-progress | blocked | done | dropped
depends_on: [C004-T-029]
implements: [C004-REQ-012]
satisfies_ac: [C004-AC-012.1, C004-AC-012.2]
verified_by: [C004-TS-040, C004-TS-041, C004-TC-077]
components: [C004-COMP-03]
risk_refs: [C004-RISK-004]
estimate: M             # S | M | L (relative, no hours)
report:                 # filled by implementer via sdd.mjs task set
  commit: null
  completed_at: null
  notes: null
---

## Intent
Why this task exists, in one paragraph traced to REQ-012.

## Targets
| Kind | Target | Change |
|---|---|---|
| modify | `src/checkout/payments.ts` › `createIntent()` | add pre-PSP expiry guard |
| add | `src/checkout/errors.ts` › `ERR_PAY_007` | new error code per IF-004/ERR-PAY-007 |
| add | `tests/checkout/payments.expiry.test.ts` | covers TS-040, TS-041 |

## Preconditions
- T-029 merged (clock abstraction available).

## Step outline (no production code)
1. …
2. …

## Verification
- Run: `npm test -- payments.expiry` → TS-040, TS-041 pass.
- Run regression set RS-checkout (see 30-impact/regression-set.md).
- Observable: metric `checkout.payment.rejected{reason="expired"}` increments (NFR-009).

## Done when
- [ ] All `satisfies_ac` scenarios pass as automated tests
- [ ] Regression set green
- [ ] DOD-003, DOD-007 evidence linked in report
```

---

## 13. Quality standards

### 13.1 User stories (Q16: "very detailed")

Template:

```markdown
### C004-US-005 — Prevent checkout with expired card
- **As a** returning customer (persona P-02)
- **I want** to be told immediately that my saved card has expired
- **So that** I can update it before I lose my basket
- **Value / outcome metric:** checkout abandonment due to payment errors ↓ (NFR-012 tracks)
- **Priority:** Must · **Size hint:** M · **Capability:** CAP-02
- **Context & notes:** current behaviour sends expired cards to the PSP (R-004 evidence)…
- **Out of scope for this story:** card auto-update via network tokens (DEC-006)
- **Requirements:** REQ-012, REQ-013
- **Dependencies:** US-002
- **Open questions:** none
```

Quality checklist (critic): INVEST (Independent, Negotiable, Valuable, Estimable, Small,
Testable); the persona exists; the value is a concrete outcome, not a restatement of the
feature; the out-of-scope line is present whenever a neighbouring feature is tempting.

### 13.2 Requirements quality (ISO/IEC/IEEE 29148 characteristics, adapted)

| Characteristic | Check | By |
|---|---|---|
| Necessary | Traces to a US/DEC/constraint | lint (TR-02) |
| Unambiguous | One interpretation; no weak words (banned list: *fast, easy, flexible, robust, user-friendly, appropriate, etc., and/or, as needed, if possible, support* …) | lint (word list) + critic |
| Singular | One SHALL per requirement (compound → split) | lint (count `SHALL`) + critic |
| Verifiable | ≥1 AC with scenario; measurable thresholds | lint (TR-02, TR-03) |
| Feasible | Not contradicted by cartographer evidence or constraints | critic + cartographer |
| Complete | Covers normal, alternate, error and abuse paths (critic checklist per pattern) | critic + test-designer |
| Consistent | No two REQs conflict; terms per glossary | critic (pairwise within a capability) + lint (glossary terms) |
| Traceable | IDs + links | lint |
| Implementation-free | No class names or algorithms unless it is a CON/IF | critic |

### 13.3 EARS patterns (lint regexes, case-insensitive)

| Pattern | Template | Lint signature |
|---|---|---|
| Ubiquitous | THE `<system>` SHALL `<response>` | starts with `the … shall` and contains no WHEN/WHILE/IF/WHERE |
| Event-driven | WHEN `<trigger>`, THE `<system>` SHALL `<response>` | `^when .+, the .+ shall ` |
| State-driven | WHILE `<state>`, THE `<system>` SHALL `<response>` | `^while .+, the .+ shall ` |
| Unwanted behaviour | IF `<condition>`, THEN THE `<system>` SHALL `<response>` | `^if .+, then the .+ shall ` |
| Optional feature | WHERE `<feature>`, THE `<system>` SHALL `<response>` | `^where .+, the .+ shall ` |
| Complex | WHILE `<state>`, WHEN `<trigger>`, THE `<system>` SHALL … (combinations) | ordered keyword prefix chain |

The lint checks the `Pattern:` field against the statement's actual shape, and checks that
`<system>` is a known system or component name (glossary or COMP list).

### 13.4 Acceptance criteria and scenarios

- Each **AC** is a *condition* (one sentence) that, if true, satisfies part of a REQ.
- Each AC has ≥1 **TS** written as Given/When/Then, with:
  - concrete data (example tables where values vary),
  - explicit preconditions (state, user, data),
  - observable outcomes (response, persisted state, emitted event, metric),
  - negative assertions where relevant ("AND no payment intent is created").
- Coverage checklist per REQ (test-designer, critic-checked): happy path; each alternate;
  each boundary (min/max/empty/null/unicode/timezone where relevant); each error from the
  `ERR` catalogue; authorization (who must *not* be able to); concurrency/idempotency if
  state changes; and an abuse case if the input is user-controlled.

```gherkin
#### C004-TS-040 — Expired saved card is rejected before PSP call   (AC-012.1)
Given a signed-in customer "P-02" with a saved card expiring "2026-09"
  And the current date is "2026-10-10"
  And the basket total is "49.90 EUR"
When the customer confirms checkout with that card
Then the response status is 422 with error code "ERR-PAY-007"
  And no call is made to the payment service provider
  And no payment intent is persisted
  And the metric "checkout.payment.rejected{reason=expired}" increases by 1
```

Format choice: scenarios live inside `acceptance.md` as fenced `gherkin` blocks, so they
render on GitHub and can be extracted mechanically to `.feature` files if you want
executable BDD later (OQ-09).

### 13.5 Non-functional requirements

Each NFR has: ID, category (ISO 25010 quality characteristic), EARS statement, **metric**,
**threshold**, **measurement method** (tool or test), **environment/conditions**, **rationale**
and **DoD link**. Example: "WHILE the system serves ≤ 200 req/s, THE checkout API SHALL
respond within 300 ms at p95 — measured by k6 scenario `checkout-load` on the staging
profile."

### 13.6 Definition of Done (Q16: "strong DoD")

Three layers, all with IDs and all requiring *evidence* in the implementer's report:

1. **Constitution DoD (global)**, e.g.:
   - DOD-G-01 all acceptance scenarios automated and passing;
   - DOD-G-02 regression set green;
   - DOD-G-03 no new high/critical findings from static analysis/security scan;
   - DOD-G-04 public interfaces documented;
   - DOD-G-05 observability signals for every NFR exist;
   - DOD-G-06 `_living/` updated via archive;
   - DOD-G-07 no open spec defects.
2. **Feature DoD (`70-dod.md`)**: feature-specific items (migration verified on a
   production-like snapshot, feature flag default, docs page, …), each linked to REQ/NFR.
3. **Task done-checks** (inside each task file): local, mechanical checks.

DoD items are written as **checkable statements with an evidence type** (test report, metric
screenshot, link, command output), never as aspirations.

### 13.7 Architecture outputs (Q16: "very detailed, no brief")

`60-architecture/architecture.md` must contain, at minimum:

- context and scope (system boundary, external actors, trust boundaries);
- a component catalogue (COMP-xxx: responsibility, owned data, interfaces, dependencies,
  realized REQ/NFR, as-is/to-be/delta status);
- key runtime flows (one Archify sequence per critical scenario);
- data view (entities → stores; PII classification; retention);
- deployment view, if the change affects it;
- cross-cutting concerns (authn/z, error handling, idempotency, caching, configuration,
  observability);
- constraints (CON-xxx) and how ADRs/DECs justify them;
- brownfield: the **as-is → to-be delta**, using Archify `compare` and evidence-pinned nodes.

### 13.8 Minimum-content lint rules (enforcing "no summary")

| Artifact | Rule (initial thresholds; tune after dogfooding — OQ-11) |
|---|---|
| stories.md | each US has all template fields; "So that" ≠ restatement of "I want" (critic) |
| requirements.md | each REQ has Pattern, Statement, Stories, Priority, Acceptance |
| acceptance.md | each AC has ≥1 TS; each TS has ≥1 Given, 1 When, ≥1 Then |
| NFR files | metric, threshold, method present |
| architecture.md | all mandatory headings present; every COMP has the catalogue fields |
| task files | Targets table has ≥1 row; Verification has ≥1 runnable step; Done-when has ≥1 checkbox |
| any file | no "TBD", "TODO", "lorem", "etc." outside code blocks; no `[NEEDS CLARIFICATION]` at gate time unless waived |

---

## 14. Agent roster (first cut)

### 14.1 Roster at a glance

| # | Agent | Kind | Runs as | Writes? | Model / effort | Core tools | Preloaded skills |
|---|---|---|---|---|---|---|---|
| A0 | `sdd-conductor` | orchestrator + interviewer | **main session** (`claude --agent architect:sdd-conductor`) | `.sdd/` only | Opus 5.5 / xhigh | Agent(allowlist), AskUserQuestion, Read, Glob, Grep, Write, Edit, Bash(sdd.mjs) | sdd-conventions, interview-protocol, options-analysis, phase-ideation, phase-spec, phase-plan, gate-protocol |
| A1 | `sdd-researcher` | specialist | subagent (background-capable) | `research/` only | Sonnet 5 / high | WebSearch, WebFetch, Context7, DeepWiki*, Read, Write | research-protocol, sdd-conventions |
| A2 | `sdd-cartographer` | specialist | subagent | `evidence/`, `30-impact/` only | Sonnet 5 / high | Bash(ripwire, ast-grep, git read-only), Serena (read-only), LSP, Read, Grep, Glob, Write | code-discovery, sdd-conventions |
| A3 | `sdd-options-analyst` | specialist | subagent | `options/`, `decisions/` drafts | Opus 5.5 / high | Read, Grep, Glob, WebSearch, WebFetch, Write | options-analysis, sdd-conventions |
| A4 | `sdd-spec-writer` | author | subagent | `10-spec/` (except architecture) | Opus 5.5 / xhigh | Read, Grep, Glob, Write, Edit, Bash(sdd.mjs) | sdd-conventions, ears-requirements, user-stories, nfr-catalogue, options-analysis |
| A5 | `sdd-test-designer` | author | subagent | `acceptance.md`, `60-test-plan.md`, `70-dod.md` | Opus 5.5 / high (Sonnet for drafting large scenario sets — OQ-10) | Read, Grep, Glob, Write, Edit, Bash(sdd.mjs) | acceptance-scenarios, dod-catalogue, sdd-conventions |
| A6 | `sdd-architect` | author | subagent | `60-architecture/`, `50-interfaces/`, `20-plan/20-decisions/` | Opus 5.5 / xhigh | Read, Grep, Glob, Write, Edit, Bash(archify, sdd.mjs), Serena (read-only) | diagramming, architecture-decisions, options-analysis, sdd-conventions |
| A7 | `sdd-planner` | author | subagent | `20-plan/` (except decisions, test plan) | Opus 5.5 / high | Read, Grep, Glob, Write, Edit, Bash(sdd.mjs) | planning, sdd-conventions |
| A8 | `sdd-critic` | reviewer (adversarial) | subagent | `*critic-report.md` only | Opus 5.5 / xhigh | Read, Grep, Glob, Bash(sdd.mjs lint/trace), Write | critique-rubrics, ears-requirements, sdd-conventions |
| A9 | `sdd-auditor` | bookkeeper | subagent | `80-traceability.md`, `85-open-items.md`, registry via script | Haiku 4.5 / low | Bash(sdd.mjs), Read, Write | sdd-conventions |

\* DeepWiki pending OQ-04.

**Why ten and not four or twenty.** Fewer agents (e.g. one "spec agent") would put
interviewing, writing and critiquing into one context: worse quality and no independent
critic. More agents (BMAD-style personas) would add coordination cost without new
capabilities. The test for each agent: **does it need a different context, model, tool set
or write scope from all the others?** All ten pass.

- researcher: web tools, cheap model.
- cartographer: code tools, read-only.
- options-analyst: an isolated decision context.
- spec-writer and architect: different skills and write scopes.
- test-designer: an adversarial-to-the-happy-path mindset.
- planner: different inputs.
- critic: must be independent of the authors.
- auditor: cheap model, purely mechanical.
- conductor: the only one that can talk to you.

### 14.2 Delegation graph

```
                     ┌──────────────────────┐
                     │   sdd-conductor (A0) │  main session · talks to you · runs gates
                     └──────────┬───────────┘
      ┌──────────┬──────────┬───┴──────┬───────────┬──────────┬──────────┬─────────┐
      ▼          ▼          ▼          ▼           ▼          ▼          ▼         ▼
 researcher cartographer options-  spec-writer test-     architect  planner   critic → auditor
   (A1)        (A2)      analyst     (A4)      designer    (A6)      (A7)      (A8)     (A9)
                           (A3)                  (A5)
 depth-1 subagents. Only the conductor holds Agent(...). Authors may NOT spawn agents (no nesting)
 → predictable cost; the conductor serializes the hand-offs and relays questions to you.
```

Nesting is deliberately disabled for specialists (no `Agent` in their tools). Claude Code
allows depth 3, but nested fan-out from authors would make cost and question routing
unpredictable. The conductor's `tools` uses the spawn allowlist
`Agent(sdd-researcher, sdd-cartographer, …)`.

### 14.3 Draft definitions

These are *ideation-level drafts* showing intent and frontmatter choices. Prompts get
written in full during the spec/plan of CHG-001. Plugin note (OA-02): the frontmatter
`hooks`/`mcpServers`/`permissionMode` fields are omitted on purpose, because plugin agents
ignore them; the equivalents live in the plugin's `hooks/hooks.json` and `.mcp.json`.
`initialPrompt` is also ignored for plugin agents, so the conductor's "orient first"
behaviour lives in its body (operating loop step 1) and in the `SessionStart` hook (§17.2).

#### A0 — `sdd-conductor`

```markdown
---
name: sdd-conductor
description: >
  Main entry point of the Architect spec-driven workflow. Drives a change through
  ideation → specification → planning with human gates, interviews the user in batched
  option-based rounds, delegates to sdd-* specialists, and maintains .sdd/ state.
  Run as the main session agent; do not invoke as a subagent.
model: opus
effort: xhigh
color: purple
tools: >
  Agent(sdd-researcher, sdd-cartographer, sdd-options-analyst, sdd-spec-writer,
  sdd-test-designer, sdd-architect, sdd-planner, sdd-critic, sdd-auditor),
  AskUserQuestion, Read, Glob, Grep, Write, Edit, Bash, TodoWrite, Skill
skills: [sdd-conventions, interview-protocol, options-analysis, gate-protocol,
         phase-ideation, phase-spec, phase-plan]
---
# Role
You are the conductor of a spec-driven development workflow. You own the conversation with
the user and the integrity of .sdd/. You never write production code.

# Operating loop
1. Orient: read SDD.md, registry.json, the active change's change.md.
2. Determine the phase and its entry conditions (gate-protocol). Refuse to proceed on stale
   or unapproved inputs; explain what is missing.
3. Plan the phase as a todo list (TodoWrite). Fan out specialists in parallel where independent.
4. Collect `questions[]` returned by specialists; dedupe; run interview rounds (≤4 per round,
   options with recommendation first) using interview-protocol.
5. Dispatch authors with precise briefs (inputs, IDs to use, files to write, quality bar).
6. Run sdd-auditor (lint/trace) then sdd-critic. Loop on blockers.
7. Present the gate: what was produced (file list + ID counts + coverage), lint/critic
   status, open items, waivers needed. Record the user's decision verbatim.

# Hard rules
- Only write under .sdd/. Only run node sdd.mjs, git (read-only), and tool doctors via Bash.
- Never approve a gate yourself. Never mark items waived without the user's words.
- Never summarize artifacts into other artifacts (P-02); link by ID.
```

#### A1 — `sdd-researcher`

```markdown
---
name: sdd-researcher
description: >
  Researches prior art, libraries, standards and competitor patterns for an sdd change.
  Uses web search, Context7 for version-accurate library docs, and DeepWiki for questions
  about public GitHub repos. Writes cited research notes. Use for any external-knowledge
  question during ideation, specification or planning.
model: sonnet
effort: high
color: cyan
tools: WebSearch, WebFetch, mcp__context7, mcp__deepwiki, Read, Glob, Write
skills: [research-protocol, sdd-conventions]
memory: project
---
# Output contract
For each research question write .sdd/<change>/00-ideation/research/R-xxx-<slug>.md with:
question · method (queries, tools) · findings (each with source URL and date) ·
confidence (high/medium/low with reason) · implications for the change ·
follow-up questions[] (JSON block) · conflicting evidence.
Return to the caller: a ≤15-line digest + the file path + questions[].
Never invent sources. Prefer primary sources (official docs, repos, standards).
```

#### A2 — `sdd-cartographer`

```markdown
---
name: sdd-cartographer
description: >
  Read-only codebase cartographer for brownfield specs. Maps current behaviour, affected
  symbols, callers, blast radius, regression tests and hotspots using ripwire (CLI),
  Serena (read-only), LSP and grep, and records evidence with its source layer.
  Never modifies code.
model: sonnet
effort: high
color: green
tools: Bash, Read, Grep, Glob, LSP, Write, mcp__serena__find_symbol,
       mcp__serena__get_symbols_overview, mcp__serena__find_referencing_symbols,
       mcp__serena__search_for_pattern, mcp__serena__list_dir, mcp__serena__find_file
skills: [code-discovery, sdd-conventions]
memory: project
---
# Tool ladder (cheapest sufficient first)
1. ripwire . --for="<concept>" --token-budget=4000  → orientation
2. ripwire --callers / --uses / --impact / --test-gate / --hotspots → structure & risk
3. serena find_symbol / find_referencing_symbols → precise references (polyglot, dynamic dispatch)
4. LSP / Grep / Glob → fallback; ast-grep (if on PATH) → structural evidence
Record every finding as: path:line · symbol · claim · layer (ripwire|serena|lsp|grep|ast-grep)
· confidence · ripwire disclosures (truncation, unindexed languages).
# Bash allowlist
ripwire …, ast-grep … (search only), git log/show/diff/blame/ls-files, node sdd.mjs … — nothing else.
```

#### A3 — `sdd-options-analyst`

```markdown
---
name: sdd-options-analyst
description: >
  Generates and scores 4–5 options for a decision against weighted criteria, presents the
  best 2–3 with a recommendation, and drafts an option analysis (OA) and decision record
  (DEC/ADR). Use for any non-trivial product, approach or architecture choice.
model: opus
effort: high
color: yellow
tools: Read, Grep, Glob, WebSearch, WebFetch, Write
skills: [options-analysis, sdd-conventions]
---
```

#### A4 — `sdd-spec-writer`

```markdown
---
name: sdd-spec-writer
description: >
  Writes the specification of an sdd change from an approved ideation: capabilities,
  detailed user stories, EARS requirements (with brownfield deltas), NFRs with metrics,
  domain model and scope. Does not write architecture or acceptance scenarios.
model: opus
effort: xhigh
color: blue
tools: Read, Grep, Glob, Write, Edit, Bash
skills: [sdd-conventions, ears-requirements, user-stories, nfr-catalogue, options-analysis]
---
```

#### A5 — `sdd-test-designer`

```markdown
---
name: sdd-test-designer
description: >
  Designs acceptance criteria and Given/When/Then scenarios for every requirement
  (happy, alternate, boundary, error, authorization, concurrency, abuse), the test plan
  mapping scenarios to planned tests, and the feature Definition of Done.
model: opus
effort: high
color: orange
tools: Read, Grep, Glob, Write, Edit, Bash
skills: [acceptance-scenarios, dod-catalogue, sdd-conventions]
---
```

#### A6 — `sdd-architect`

```markdown
---
name: sdd-architect
description: >
  Produces the architecture view of an sdd change (as-is/to-be/delta) as Archify JSON IR
  validated and rendered to HTML, the component catalogue, interfaces/contracts, constraints,
  and ADRs for technical decisions. Uses read-only code intelligence for evidence.
model: opus
effort: xhigh
color: red
tools: Read, Grep, Glob, Write, Edit, Bash, mcp__serena__find_symbol,
       mcp__serena__get_symbols_overview, mcp__serena__find_referencing_symbols
skills: [diagramming, architecture-decisions, options-analysis, sdd-conventions]
---
```

#### A7 — `sdd-planner`

```markdown
---
name: sdd-planner
description: >
  Turns an approved spec into an implementation plan: strategy, milestones, task DAG,
  one file per task with targets, REQ/AC links, verification and done-checks, risks,
  rollout/rollback and the implementer hand-off. Never writes production code.
model: opus
effort: high
color: pink
tools: Read, Grep, Glob, Write, Edit, Bash
skills: [planning, sdd-conventions]
---
```

#### A8 — `sdd-critic`

```markdown
---
name: sdd-critic
description: >
  Adversarial reviewer of sdd artifacts. Finds ambiguity, gaps, contradictions,
  untestable requirements, missing edge cases, summary-instead-of-detail, unsupported
  claims and traceability holes. Read-only except its own report. Use before every gate.
model: opus
effort: xhigh
color: red
tools: Read, Grep, Glob, Bash, Write
skills: [critique-rubrics, ears-requirements, sdd-conventions]
---
# Output: critic-report.md with findings {id, severity: blocker|major|minor, ref IDs,
# evidence (quote + file:line), why it matters, suggested fix}. Never fix artifacts yourself.
```

#### A9 — `sdd-auditor`

```markdown
---
name: sdd-auditor
description: >
  Mechanical bookkeeping for sdd: runs sdd.mjs lint/trace/status, regenerates
  traceability and open-items files and the SDD.md status block, and reports results.
model: haiku
effort: low
color: green
tools: Bash, Read, Write
skills: [sdd-conventions]
---
```

### 14.4 Agent-description quality (delegation reliability)

Claude delegates on the `description` text. Each description must:

- say *when* to use the agent and when **not** to (the conductor note "do not invoke as a
  subagent");
- name its phase(s);
- avoid overlapping trigger words with siblings: "acceptance" belongs only to the
  test-designer, "architecture/ADR" only to the architect.

This is tested with `claude plugin eval` (§25).

---

## 15. Skills (shared knowledge modules)

Skills keep agents short. Each agent's body states its role and contract; the reusable
know-how lives in skills that are preloaded (`skills:`) or loaded on demand.

| Skill | Content | Used by |
|---|---|---|
| `sdd-conventions` | `.sdd/` layout, ID scheme, frontmatter fields, status lifecycle, markers, file-naming rules, "link don't summarize" | all |
| `interview-protocol` | Round structure, question JSON contract, option-writing rules, recommendation-first, logging to questions-log.md | conductor |
| `options-analysis` | 4–5 candidates, criteria and weights selection, scoring rubric, sensitivity check, presentation of 2–3, rejected log, OA/DEC/ADR templates | conductor, options-analyst, spec-writer, architect |
| `gate-protocol` | Entry/exit criteria per phase, hash pinning, waivers, stale propagation, gate summary template | conductor |
| `phase-ideation` / `phase-spec` / `phase-plan` | Step-by-step procedure per phase (the shared core for conductor and commands, OA-01) | conductor, commands |
| `research-protocol` | Source hierarchy, citation format, confidence rubric, Context7/DeepWiki usage | researcher |
| `code-discovery` | ripwire verb selection table, Serena read-only usage, fallback ladder, evidence format, token budgets | cartographer (+ architect) |
| `ears-requirements` | 5+1 patterns, examples, anti-patterns, splitting compound requirements, delta tags | spec-writer, critic |
| `user-stories` | Template, INVEST, personas, value statements | spec-writer |
| `nfr-catalogue` | ISO 25010 categories, metric/threshold/method patterns, default NFR checklist | spec-writer |
| `acceptance-scenarios` | AC vs scenario, Gherkin style, coverage checklist, data tables | test-designer |
| `dod-catalogue` | Global/feature/task DoD layers, evidence types | test-designer |
| `diagramming` | Archify workflow (guide → JSON → validate → deliver → compare), IR conventions (node IDs = COMP IDs), evidence pinning, Mermaid fallback rules | architect |
| `architecture-decisions` | Architecture doc headings, component catalogue fields, ADR (MADR) template | architect |
| `planning` | Task template, sizing, DAG rules, milestone strategy, rollout/rollback templates, hand-off template | planner |
| `critique-rubrics` | Per-artifact checklists (29148, INVEST, scenario coverage, architecture completeness, plan executability), severity rules | critic |

### 15.1 Third-party skills

- **Archify** (`npx skills add tt-a1i/archify -g`) is required by the architect. Our
  `diagramming` skill *wraps* it with our conventions and does not duplicate its content.
- **ripwire's 17 skills**: avoid globally loading all of them (OQ-06); `code-discovery`
  encodes what the cartographer needs.

### 15.2 Portability (Q1)

All skill bodies are plain markdown. Only the frontmatter (`name`, `description`) is
Claude-specific, and that convention is now shared by Codex/OpenCode skill loaders, so the
standards travel.

### 15.3 Skill size budget

Each preloaded skill costs context in every invocation of that agent. Target ≤ 400 lines per
skill, with long examples in `references/` files loaded on demand.

### 15.4 The interview protocol (because you asked for this style explicitly)

```json
{
  "questions": [
    {
      "id": "Q-ide-07",
      "topic": "auth",
      "question": "Which identity provider must the feature support at launch?",
      "why_it_matters": "Determines REQ set for login, NFR for token lifetime, and COMP-auth design.",
      "blocking": true,
      "candidates_considered": 5,
      "options": [
        { "label": "Existing Keycloak (Recommended)", "rationale": "…", "score": 4.4 },
        { "label": "Entra ID", "rationale": "…", "score": 3.9 },
        { "label": "Both via OIDC abstraction", "rationale": "…", "score": 3.7 }
      ],
      "rejected": [ { "label": "Custom auth", "reason": "…" }, { "label": "Auth0", "reason": "…" } ],
      "source_refs": ["R-003", "evidence/baseline-survey.md#auth"]
    }
  ]
}
```

Round rules:

- ≤4 questions per round;
- blocking questions first;
- related questions grouped;
- multi-select only where the options are genuinely not exclusive;
- the recommended option is listed first;
- every answer is logged verbatim, including free-text "Other" answers, which are then
  **read carefully for embedded change requests**. In this session, several of your answers
  extended the question (Q5, Q9, Q16, Q19), and the protocol must catch that.

---

## 16. Commands / entry points

| Command | Runs in | Purpose |
|---|---|---|
| `claude --agent architect:sdd-conductor` | main session | Full guided flow (Q5 "main entry point") |
| `/architect:init` | main | Scaffold `.sdd/`, baseline survey, constitution interview |
| `/architect:new "<title>"` | main | Create change folder + manifest |
| `/architect:ideate [change]` | main | Run or resume ideation (phase-ideation skill) |
| `/architect:specify [change]` | main | Run or resume the spec phase |
| `/architect:plan [change]` | main | Run or resume the plan phase |
| `/architect:revise <phase> [change] --reason "…"` | main | Re-entry; marks downstream stale; incremental rework (Q5 "interact again with specific phases") |
| `/architect:gate [change]` | main | Show the gate summary and record approve / revise / reject |
| `/architect:status` | main (cheap) | Print registry + next actions |
| `/architect:lint [change]` | main (cheap) | Run lint + trace, no LLM |
| `/architect:decide "<question>"` | main | Ad-hoc options analysis (OA + DEC) |
| `/architect:research "<question>"` | main | Ad-hoc research note |
| `/architect:archive <change>` | main | After the implementer reports done: merge deltas into `_living/`, move to `_archive/` |
| `/architect:doctor` | main | Check node, ripwire, Serena, Archify, ast-grep, Context7/DeepWiki reachability; write toolchain.md |

Commands are implemented as plugin **skills/commands** whose bodies say "load
`phase-<x>`, then follow it", so the conductor and the commands share one procedure
(OA-01).

---

## 17. Helper scripts (Node.js) and hooks

### 17.1 `scripts/sdd.mjs` (single bundled file, Node ≥ 20, OA-12)

| Subcommand | Function |
|---|---|
| `init [--force]` | Scaffold `.sdd/` from templates; write SDD.md, registry.json |
| `change new "<title>" [--kind brownfield]` | Allocate NNN, create folder tree + change.md + ids.json |
| `id next <TYPE> [--change NNN]` | Allocate the next ID; update ids.json |
| `id tombstone <ID> --reason` | Retire an ID |
| `lint [<change>] [--phase] [--json]` | All rules from §12.2 and §13 (EARS shapes, banned words, required fields, markers, minimum content, interface parseability (YAML/JSON), Archify IR presence) |
| `trace [<change>] [--write]` | Build the graph; write 80-traceability.md, trace.json, coverage stats |
| `status [--write]` | Recompute registry from frontmatter; regenerate the SDD.md status block |
| `gate show|approve|reject <change> <phase> [--waive ID…] [--note]` | Gate summary; on approve, compute and store the content hash (sorted file list + SHA-256 per file → Merkle root), approver, timestamp |
| `stale check` | Compare stored hashes against current content; mark stale phases |
| `task set <ID> --status … [--commit] [--note]` | Implementer progress reports |
| `defect add|close` | Spec-defect lifecycle |
| `archive <change>` | Apply deltas to `_living/` (ADDED append, MODIFIED replace, REMOVED tombstone, RENAMED move), then move the folder |
| `extract-features <change>` | Optional: gherkin blocks → `.feature` files (OQ-09) |

Exit codes: `0` ok, `1` lint errors, `2` usage error (hooks use `2` to block).

### 17.2 Hooks (plugin `hooks/hooks.json`)

| Event | Matcher | Action | Purpose |
|---|---|---|---|
| `PreToolUse` | `Write|Edit|NotebookEdit` | `sdd.mjs guard-path` → exit 2 if the target is outside `.sdd/` **and** the active agent is an `architect:sdd-*` agent | Enforces P-01 / D-02 |
| `PreToolUse` | `Bash` | `sdd.mjs guard-bash` → allowlist (node sdd.mjs, ripwire read verbs, ast-grep search, git read-only, archify validate/deliver/compare/doctor) for sdd agents | Prevents mutation via shell |
| `PostToolUse` | `Write|Edit` on `.sdd/**` | `sdd.mjs lint --quick --file <path>`; findings returned as feedback | Immediate self-correction |
| `SubagentStop` | `architect:sdd-(spec-writer|architect|planner|test-designer)` | `sdd.mjs trace --quiet` | Keep matrix fresh |
| `SessionStart` | — | `sdd.mjs status --brief` when `.sdd/` exists | Orientation for any session, including implementers' sessions |

[VERIFY] how a plugin-level `PreToolUse` hook identifies the calling subagent (the hook input
includes agent context in recent versions; the docs mention `agent_type` in hooks). If it
can't, fall back to: specialists get no `Bash` and use dedicated wrapper commands, and the
path guard applies to all writes during conductor sessions.

### 17.3 Safety posture

- Specialists have **no `Agent` tool** (no nesting) and **no network tools** except the
  researcher and the options-analyst.
- The cartographer and architect get Serena **read-only** tools by explicit name (never
  `mcp__serena` wholesale), *and* Serena runs in `planning` mode/`read_only: true` as defense
  in depth.
- ripwire's span-edit verbs are not in the Bash allowlist.

---

## 18. Gates and status lifecycle

### 18.1 States

```
not-started → draft → in-review → approved ─┬─► archived
                 ▲         │                 │
                 │         ▼                 ▼
                 └── in-revision ◄──────── stale (predecessor changed after approval)
```

### 18.2 Gate procedure (G0 constitution, G1 ideation, G2 spec, G3 plan)

1. Auditor: `lint` + `trace` + `stale check`; results attached.
2. Critic: report with severities.
3. Conductor presents a **gate summary**:
   - files produced (list) and ID counts per type;
   - coverage percentages (TR rules);
   - lint errors/warnings;
   - critic blockers/majors;
   - open `[NEEDS CLARIFICATION]` items;
   - proposed waivers;
   - "what you are approving" in plain terms;
   - a link to each file.
4. You choose: **Approve** · **Approve with waivers** (named items + your reason) ·
   **Revise** (with direction) · **Reject/stop**.
5. On approve: `sdd.mjs gate approve` stores the hash, timestamp and your verbatim words;
   registry and SDD.md update.

### 18.3 Gate exit criteria (summary table)

| Gate | Hard criteria (lint/script) | Judgement criteria (critic + you) |
|---|---|---|
| G0 | constitution has all sections | principles are actionable, DoD defaults are checkable |
| G1 | ideation has required sections; questions-log present; every DEC links an OA | problem is real; scope is right; key decisions are made; open items are deferrable |
| G2 | TR-01..05, TR-09, TR-12, TR-13; EARS shapes; interfaces parse; Archify IR validates | stories are valuable; requirements complete/consistent; architecture is sound |
| G3 | TR-06..08, TR-11..15; every task file complete; handoff.md present | plan is executable; ordering de-risks early; rollout is safe |

---

## 19. Model, effort and cost routing (Q17)

| Agent | Model | Effort | Rationale |
|---|---|---|---|
| conductor | Opus 5.5 | xhigh | Judgement, synthesis of questions, gate summaries |
| spec-writer | Opus 5.5 | xhigh | Highest-leverage text in the system |
| architect | Opus 5.5 | xhigh | Design reasoning + IR correctness |
| critic | Opus 5.5 | xhigh | Must out-think the authors |
| options-analyst | Opus 5.5 | high | Structured reasoning with clear rubric |
| planner | Opus 5.5 | high | Structured decomposition |
| test-designer | Opus 5.5 | high | Edge-case imagination (OQ-10: Sonnet for bulk drafting?) |
| researcher | Sonnet 5 | high | Volume reading; synthesis is moderate |
| cartographer | Sonnet 5 | high | Tool-heavy, evidence extraction |
| auditor | Haiku 4.5 | low | Runs scripts, formats results |

**Cost controls:**

- ripwire token budgets;
- the researcher's digest-only return (full notes stay on disk);
- authors receive file paths, not pasted content;
- the critic reviews *changed IDs* on revisions;
- prompt-cache TTL `experimental.cacheTtl: 1h` for the conductor during long interviews
  [VERIFY effect].
- Respect any `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` the user sets (document it in the README).

---

## 20. End-to-end scenarios (walk-throughs)

These scenarios become acceptance scenarios for the suite itself in CHG-001's spec.

### 20.1 Greenfield feature from a one-liner

1. You run `claude --agent architect:sdd-conductor` in an empty repo and say: "a CLI that
   syncs my Obsidian vault to S3 with client-side encryption".
2. The conductor finds no `.sdd/`, proposes `/architect:init`, scaffolds it, runs a 2-round
   constitution interview (language: TypeScript? test framework? NFR defaults?) and writes
   the constitution. You approve (G0).
3. `/architect:new` → `.sdd/001-vault-s3-sync/`.
4. Ideation fan-out, in parallel:
   - the researcher looks at prior art (rclone, s3sync, age/libsodium), S3 SDK docs via
     Context7 and the Obsidian vault structure;
   - the options-analyst frames encryption-scheme and sync-model options;
   - the cartographer reports "empty repo — no evidence layer needed" (P-10).
5. Round 1 questions: encryption scheme, conflict policy, platforms, credential storage.
   Round 2 follows up on conflict-policy edge cases. You answer.
6. `ideation.md` plus research, options and decisions are written. The critic flags "no
   decision on deletion propagation" (a blocker). One more question, answered. G1 approved.
7. Spec:
   - the spec-writer produces CAP-01 sync, CAP-02 crypto and CAP-03 config: 14 stories,
     41 REQs;
   - the test-designer writes 97 scenarios;
   - the architect produces a to-be architecture, 3 sequences (initial sync, incremental
     sync, conflict) as Archify, plus a config schema;
   - lint finds 3 compound REQs and the spec-writer splits them;
   - the critic flags missing clock-skew handling and a REQ is added. G2 approved.
8. Plan:
   - 4 ADRs;
   - 26 tasks in 4 milestones;
   - a test plan mapping 97 scenarios to 61 test cases;
   - a risk register;
   - handoff.md.
   G3 approved.
9. You open a fresh session with Superpowers and say "execute .sdd/001-…/20-plan per
   handoff.md". The implementer reports progress through `sdd.mjs task set`, and
   `/architect:status` shows 26/26 done. `/architect:archive 001` populates `_living/`.

### 20.2 Brownfield change in a large repo

1. `/architect:new "add SEPA direct debit"` on an existing payments monorepo.
2. The cartographer runs `ripwire . --for="payment method"` and `--pack-task`, then Serena
   `find_referencing_symbols PaymentMethod`. It writes `evidence/baseline-survey.md`: 3
   services touched; 2 hotspots (`payments.ts` churn × complexity); unindexed language
   disclosed (`.proto` files) [P-10].
3. Ideation questions now include evidence ("`createIntent()` has 7 callers incl. the
   legacy batch job — should SEPA flow through it?").
4. The spec marks REQs ADDED/MODIFIED with evidence; the as-is and to-be Archify diagrams
   plus `compare` show the delta.
5. The plan's `30-impact/` holds blast radius per touched symbol and a regression set from
   `--test-gate`. Tasks are ordered to put the hotspot refactor behind a flag first.

### 20.3 Revision after a spec defect discovered during implementation

1. The implementer runs `sdd.mjs defect add --ref C004-REQ-012 --summary "PSP returns
   expiry in UTC; REQ assumes local date"`.
2. `SessionStart` shows "1 open spec defect on CHG-004".
3. `/architect:revise spec --reason "defect D-001"`: the conductor runs one question round
   (timezone policy). The spec-writer modifies REQ-012, the test-designer adds TS-044
   (timezone boundary) and the planner updates T-031 and adds T-047.
4. Gates G2 and G3 are re-approved on the changed IDs only. The defect is closed and the
   registry reflects it.

### 20.4 Ad-hoc decision outside a phase

`/architect:decide "Postgres advisory locks vs Redis Redlock for job dedup"` → the
options-analyst writes OA + DEC (or ADR, if a plan exists), and the conductor asks you to
accept. Use: quick, auditable architecture choices.

### 20.5 Missing tools

ripwire is not installed on a fresh Windows machine. The cartographer falls back to Serena
→ LSP → Grep and marks evidence `layer: grep, confidence: medium`. `toolchain.md` records
it, and the gate summary shows "brownfield evidence degraded". You decide whether that is
acceptable or install ripwire.

---

## 21. Environment and platform considerations

| Topic | Consideration | Plan |
|---|---|---|
| OS | You are on Windows 11; Claude Code desktop; shells: PowerShell 7 + Git Bash | All scripts in Node (Q18); hook commands invoke `node` directly, so they are shell-agnostic; paths normalised with `path.posix` in output |
| ripwire on Windows | Windows x64 binary is **preview** [VERIFY]; source build needs a C++23 compiler (MSVC recent / clang 16+) | `/architect:doctor` detects it; fallback ladder (P-10); verification spike in the plan (S-01) |
| Serena on Windows | Python 3.13 via `uv`; language servers per language; Windows support not stated explicitly [VERIFY] | Spike S-02; scope Serena to the cartographer and architect only |
| Archify | Node; `npx skills add tt-a1i/archify -g` → `~/.claude/skills/` | Doctor checks `node bin/archify.mjs doctor`; set `ARCHIFY_UPDATE_CHECK_DISABLED=1` |
| Context7 | Remote HTTP MCP or `npx @upstash/context7-mcp` | Prefer remote (no local process) |
| DeepWiki | Remote HTTP MCP, no auth | If adopted (OQ-04) |
| Git | Hash pinning uses file content, not git (works before the first commit); the repo is **not yet a git repo** | Recommend `git init` before the spec phase so worktrees/evidence pinning work (OQ-14) |
| Line endings | CRLF vs LF changes hashes | Hash after normalising to LF; add `.gitattributes` `* text=auto eol=lf` for `.sdd/` |
| Encoding | UTF-8 everywhere (PowerShell 7 default is UTF-8 without BOM) | Lint rejects a BOM in `.sdd/` files |

---

## 22. Risks and mitigations

| ID | Risk | Likelihood | Impact | Mitigation | Trigger to watch |
|---|---|---|---|---|---|
| RK-01 | Artifact bloat: specs so large nobody reads them; agents drown in context | High | High | Small files by capability; index-not-summary rule; authors get paths not content; the critic reviews deltas; ID-level navigation | Spec > ~5k lines for a medium feature; author agents hitting context limits |
| RK-02 | Over-ceremony for small changes | High | Medium | A "lite" profile in the constitution (OQ-05): same phases, fewer mandatory files for S-sized changes | You skip the suite for small changes |
| RK-03 | Plugin agents ignore `hooks`/`mcpServers`/`permissionMode` frontmatter | Certain | Medium | Use plugin `hooks.json` and `.mcp.json` (OA-02); explicit `tools` lists | — |
| RK-04 | Path guard can't tell which agent is writing | Medium | High | [VERIFY] hook input fields; fallback design §17.2 | Guard lets a write through in testing |
| RK-05 | ripwire Windows preview instability | Medium | Medium | Fallback ladder; doctor; spike S-01 | Crashes or wrong results on your repos |
| RK-06 | Serena setup friction (uv, language servers) | Medium | Medium | Optional; LSP/Grep fallback; spike S-02 | Setup > 30 min |
| RK-07 | MCP schema cost bloats every agent | Medium | Medium | Scope MCP tools per agent by name; ripwire via CLI; keep `mcp__*` out of authors | Context usage at agent start |
| RK-08 | Critic is sycophantic or too lenient (same model family as the authors) | Medium | High | Separate context, rubric-driven, "find ≥N issues or justify none", severity calibration examples, xhigh effort | Critic passes artifacts you later find defective |
| RK-09 | Lint becomes a box-ticking target (agents game minimum-content rules) | Medium | Medium | The critic checks substance; lint thresholds are modest; the critic flags padding | Repetitive filler text |
| RK-10 | Interview fatigue (too many rounds) | Medium | Medium | Stop criteria; "decide for me with recommendation" option per round; batch only blocking questions first | > 5 rounds per phase |
| RK-11 | Hash pinning too brittle (whitespace edits make things stale) | Medium | Low | Normalise (LF, trailing spaces) before hashing; per-ID hashes for impact analysis | Spurious stale states |
| RK-12 | Ecosystem churn (Claude Code fields, tool versions) | High | Medium | Pin versions in toolchain.md; `claude plugin validate` in CI; doctor | Validation failures after updates |
| RK-13 | Implementers ignore the reporting protocol, so the registry goes stale | High | Medium | `SessionStart` reminder hook; checkbox fallback reconciled by lint; v2 conformance checker | Tasks done in git but `todo` in registry |
| RK-14 | Licensing of third-party tools when sharing | Low | High | Only MIT/Apache tools as hard dependencies (GitNexus and jcodemunch rejected) | — |
| RK-15 | "Spec phases only" leaves the conformance gap open (the ~8% divergence) | Medium | Medium | Design trace.json + IDs for a v2 conformance checker; DoD evidence | — |

---

## 23. Assumptions

| ID | Assumption | Consequence if false |
|---|---|---|
| AS-01 | You use Claude Code (desktop/CLI) with plugin support and subagent frontmatter as documented (Oct 2026) | Re-target to project-local agents |
| AS-02 | Node ≥ 20 is available on your machine | Add a Node install step to the README |
| AS-03 | Target repos are git repositories (for evidence pinning and Archify evidence) | Evidence without commit pinning; weaker |
| AS-04 | You are willing to approve 3–4 gates per change | Revisit Q13 → configurable profile |
| AS-05 | English is the artifact language | Archify supports zh-CN/en; templates would need localization |
| AS-06 | Implementers can run `node sdd.mjs task set` or edit frontmatter | Registry drifts (RK-13) |
| AS-07 | Opus 5.5 / Sonnet 5 / Haiku 4.5 remain the available tiers | Update model fields (single place: frontmatter) |
| AS-08 | Medium-sized features are the common case (≈5–40 REQs) | Tune the lite profile and thresholds |

---

## 24. Open questions for gate G1

Each has a recommendation. Answer at G1, or defer explicitly to the spec phase.

| ID | Question | Recommendation | Blocking G1? |
|---|---|---|---|
| OQ-01 | Plugin and command name: `architect` (`/architect:*`) vs `sdd` vs another? | `architect` | No |
| OQ-02 | Agent count: accept the 10-agent roster, or merge test-designer into spec-writer (9) / auditor into conductor (8)? | **[DECIDED 2026-10-10] Keep 10.** | closed |
| OQ-03 | Should the conductor *also* be usable as a subagent from a normal session (without interviewing, returning questions instead)? | No for v1; commands cover that need | No |
| OQ-04 | Adopt **DeepWiki MCP** for the researcher (free, public repos)? | Yes | No |
| OQ-05 | Provide a "lite" profile for small changes (fewer mandatory files, same IDs/gates)? | **[DECIDED 2026-10-10] Yes**, defined in the constitution; same phases, IDs and gates, fewer mandatory files. Becomes a requirement in CHG-001's spec. | closed |
| OQ-06 | ripwire's 17 bundled skills: install globally, or keep only our `code-discovery` skill and let the cartographer call ripwire `--help-task`? | Ours only; disable the global install of ripwire skills | No |
| OQ-07 | (a) Is `/architect:archive` (merging a finished change's deltas into `_living/`) in scope for v1? (b) How does `_living/` start on a brownfield repo? | **[DECIDED 2026-10-10]** (a) **Yes, v1**: archive edits `.sdd/` only, so it respects Q2. (b) **Capability inventory at init**: the cartographer lists capabilities with code pointers (entry points, main modules, owning tests) and writes **no requirements**; `_living/CAP-*.md` files fill in as changes are archived. Full reverse-spec stays v2. | closed |
| OQ-08 | Agent memory for cartographer + researcher only? | Yes | No |
| OQ-09 | Also emit `.feature` files (executable Gherkin) from scenarios? | Optional command, off by default | No |
| OQ-10 | Test-designer model: Opus everywhere, or Sonnet for bulk scenario drafting with an Opus review? | Opus for v1; measure, then decide | No |
| OQ-11 | Lint thresholds for "minimum content": start strict or lenient? | Lenient + critic, tighten after 2 dogfood changes | No |
| OQ-12 | Export tasks to GitHub Issues/Linear in v1? | No (v2) | No |
| OQ-13 | Should the spec phase produce a contract-test skeleton (e.g. OpenAPI-based) or stay pure spec? | Pure spec (Q2) | No |
| OQ-14 | `git init` this repo now (needed for evidence pinning, worktrees, history of specs)? | **[DONE 2026-10-10]** | closed |
| OQ-15 | For CHG-001 itself: extract the research, options and decisions from this document into satellite files (questions-log, R-, OA-, DEC-) now, or when the suite exists? | Now, during the spec phase, to dogfood the layout | No |
| OQ-16 | Should the conductor be able to run *unattended* to a draft (no interview) when you ask "draft it, I'll review at the gate"? | Yes, as an explicit mode; gates still mandatory | No |
| OQ-17 | Requirement language: SHALL only, or allow SHOULD/MAY with defined semantics (RFC 2119)? | SHALL for requirements; SHOULD/MAY allowed only in NFR rationale | No |
| OQ-18 | Distribution: a local marketplace in this repo now, a public GitHub marketplace later? | Yes | No |

---

## 25. Success criteria for the suite itself

| ID | Criterion | How measured |
|---|---|---|
| SC-01 | Two real changes (one greenfield, one brownfield) taken through G1–G3 by you | Dogfood log |
| SC-02 | Gate summaries are trustworthy: 0 lint-passing artifacts with dangling IDs | Lint test fixtures |
| SC-03 | Critic usefulness: ≥70% of critic majors/blockers judged valid by you | Tally at gates |
| SC-04 | Hand-off portability: the same plan executed by 2 implementers without spec questions about missing information | Implementer defect reports tagged "missing info" = 0 for Must REQs |
| SC-05 | Delegation reliability: correct agent chosen ≥90% on an eval set of 40 prompts | `claude plugin eval` |
| SC-06 | Cost visibility: per-phase token usage recorded in change.md | Session usage export |
| SC-07 | Brownfield grounding: 100% of MODIFIED/REMOVED REQs have evidence | Lint TR-09 |
| SC-08 | Time-to-G2 for a medium feature ≤ one working session (excluding your think time) | Dogfood log |
| SC-09 | Plugin installs cleanly on a fresh Windows profile following the README | Clean-profile test |

---

## 26. Roadmap and next steps

### 26.1 Immediate next steps (this repo)

1. **You review this document** and answer the G1-blocking open questions (OQ-02, OQ-05,
   OQ-07); other OQs can take their recommended default.
2. Gate G1: approve / approve with waivers / revise.
3. `git init` (OQ-14).
4. **Spec phase for CHG-001** (manually orchestrated by me until the suite exists, using the
   same layout). The spec of the suite will contain capabilities such as:
   - CAP-01 Workspace & registry (`.sdd/`, SDD.md, registry.json, IDs)
   - CAP-02 Conductor & interview
   - CAP-03 Ideation (research, options, decisions)
   - CAP-04 Specification authoring
   - CAP-05 Architecture & diagrams
   - CAP-06 Planning & hand-off
   - CAP-07 Quality (lint, trace, critic)
   - CAP-08 Gates & revisions
   - CAP-09 Code intelligence integration
   - CAP-10 Packaging & doctor
5. Plan phase for CHG-001, then implementation (by you or another session; out of the
   suite's scope, but in this project's scope).

### 26.2 Verification spikes to schedule in the plan

| Spike | Question | Exit |
|---|---|---|
| S-01 | ripwire 0.6.x Windows x64 preview on 2 of your repos: correct `--for`, `--impact`, `--test-gate`? | Works / works-with-caveats / fallback only |
| S-02 | Serena via uv on Windows with TS + Python language servers in `planning` mode/read-only | Same |
| S-03 | Archify validate/deliver/compare from a subagent's Bash on Windows | Same |
| S-04 | Hook input contains the calling subagent identity (for the path guard) | Yes/No → choose §17.2 design |
| S-05 | Plugin agent with `AskUserQuestion` as `--agent` main session | Confirms D-01 |
| S-06 | `skills:` preload size impact on agent startup context | Numbers for §15.3 budget |

### 26.3 Versions

| Version | Content |
|---|---|
| v0.1 (MVP) | conductor, researcher, cartographer (ripwire + fallback), options-analyst, spec-writer, test-designer, critic, auditor; `sdd.mjs` init/change/id/lint/trace/status/gate; G1–G3; greenfield + basic brownfield evidence |
| v0.2 | architect + Archify (as-is/to-be/compare), planner with impact/regression from ripwire, Serena integration, revise/stale propagation, task reporting, defects |
| v0.3 | archive → `_living/`, lite profile, plugin eval suite, README, local marketplace |
| v1.0 | Hardened, shareable; public marketplace |
| v2 (beyond scope) | **sdd-conformance-checker**: reads code + `trace.json` and reports REQ/AC ↔ code/test alignment (closes RK-15); reverse-spec seeding of `_living/`; issue-tracker export; Codex/Cursor packaging via AGENTS.md |

---

## 27. Glossary

| Term | Definition |
|---|---|
| SDD | Spec-Driven Development: the spec is the primary artifact and code is derived from it |
| Phase | One of 00-ideation, 10-spec, 20-plan (plus init) |
| Gate | Human approval point at a phase exit (G0–G3) |
| Change | A unit of work with its own folder `.sdd/NNN-slug/` |
| Capability | A cohesive area of behaviour grouping stories and requirements |
| Living spec | Current-truth spec per capability in `_living/`, updated by archiving changes |
| Delta | ADDED/MODIFIED/REMOVED/RENAMED requirement relative to the living spec |
| EARS | Easy Approach to Requirements Syntax (ubiquitous, event-driven, state-driven, unwanted-behaviour, optional, complex) |
| AC / TS | Acceptance criterion / test scenario (Given/When/Then) |
| DoD | Definition of Done: global, feature and task layers with evidence |
| Evidence layer | The tool that produced a code claim (ripwire, serena, lsp, grep, ast-grep) |
| Hand-off | The contract (`handoff.md`) where our agents stop and an implementer starts |
| Stale | An approved artifact whose predecessor changed after approval |
| Waiver | Explicit, recorded acceptance of a known gap at a gate |
| Conductor | The main-session orchestrator agent |
| Critic | The independent adversarial reviewer agent |
| IR | Intermediate representation (Archify's typed JSON graph) |

---

## 28. Sources

Research performed 2026-10-10.

**Tools named in the brief**
- Archify — https://github.com/tt-a1i/archify ; https://explainx.ai/blog/archify-agent-skill-architecture-diagrams-guide-2026 ; https://docs.bswen.com/blog/2026-08-28-archify-claude-code-cursor-codex-architecture-diagrams/ ; (homonym) https://github.com/bluesky4485/archify
- ripwire — https://github.com/redhat-et/ripwire ; https://wavect.io/blog/ripwire-ai-repo-context-review-2026/ ; https://ai-tldr.dev/tools/ripwire/ ; https://github.com/aquental/ripwire-broker
- Serena — https://github.com/oraios/serena ; https://oraios.github.io/serena/02-usage/050_configuration.html ; https://deepwiki.com/oraios/serena/4.2-contexts-and-modes ; https://mcp.directory/blog/serena-mcp-complete-guide-2026

**Claude Code**
- Subagents reference — https://code.claude.com/docs/en/sub-agents
- https://www.tembo.io/blog/claude-code-subagents ; https://duet.so/guides/claude-code-skills-complete-guide

**SDD frameworks and evidence**
- Spec Kit — https://github.com/github/spec-kit ; EARS request: https://github.com/github/spec-kit/issues/1356
- OpenSpec — https://github.com/Fission-AI/OpenSpec
- Superpowers — https://github.com/obra/superpowers
- Comparisons — https://medium.com/@reenbit/bmad-vs-spec-kit-vs-openspec-choosing-your-spec-driven-ai-framework-in-2026-a6996b3ebb8d ; https://www.augmentcode.com/tools/best-spec-driven-development-tools ; https://felipefontoura.com/articles/spec-driven-development-tools-compared/ ; https://aicodingpatterns.com/en/patterns/openspec-vs-spec-kit-vs-bmad/ ; https://github.com/cameronsjo/spec-compare
- Benchmark — https://uvik.net/spec-driven-development-benchmark/
- Academic — https://arxiv.org/pdf/2609.00252 ; https://arxiv.org/pdf/2609.05667
- EARS — https://alistairmavin.com/ears/ ; https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax

**Code intelligence survey**
- https://sverklo.com/blog/practical-guide-mcp-code-intelligence/
- https://repowise.dev/blog/mcp/repository-intelligence-coding-agents-buyers-guide
- GitNexus — https://www.marktechpost.com/2026/04/24/meet-gitnexus-an-open-source-mcp-native-knowledge-graph-engine-that-gives-claude-code-and-cursor-full-codebase-structural-awareness/
- ast-grep MCP — https://github.com/ast-grep/ast-grep-mcp ; https://ast-grep.github.io/advanced/prompting
- https://dev.to/coder11/code-review-graph-vs-graphify-vs-codebase-memory-mcp-the-best-code-intelligence-mcp-tools-for-ai-3ea

**Research MCPs**
- Context7 — https://github.com/upstash/context7 ; https://mcp.directory/blog/context7-mcp-complete-guide-2026
- DeepWiki — https://docs.devin.ai/work-with-devin/deepwiki-mcp ; https://mcp.directory/blog/deepwiki-mcp-complete-guide-2026
- Overviews — https://www.builder.io/blog/best-mcp-servers-2026 ; https://www.firecrawl.dev/blog/best-mcp-servers-for-developers

---

*End of ideation document CHG-001 v0.1.0. Next action: gate G1 (see §24 for the blocking questions).*
