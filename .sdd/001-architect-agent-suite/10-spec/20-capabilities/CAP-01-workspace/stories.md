---
id: C001-CAP-01
artifact: spec/stories
capability: "Workspace, registry and identifiers"
change: CHG-001
phase: 10-spec
status: approved
id_block: { US: 101-199, REQ: 101-199, TS: 101-199 }
---

# C001-CAP-01 — Workspace, registry and identifiers: user stories

### C001-US-101 — Initialize an SDD workspace in a repository
- **As a** P-01 spec owner
- **I want** one command to create the `.sdd/` workspace with its description file, registry and standard folders
- **So that** every repository I work on has the same predictable place and structure for specs, which agents can rely on without configuration
- **Value / outcome:** zero manual scaffolding; identical layout across repos (C001-GOAL-06, C001-GOAL-08)
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-01
- **Context & notes:** layout per IDEA-§11.1. The operation must be safe to re-run (people run init twice). It must accept the hand-written bootstrap of this very repo (current-state.md).
- **Out of scope:** constitution content (C001-US-106), toolchain detection (C001-US-106, C001-CAP-10).
- **Requirements:** C001-REQ-101, C001-REQ-102, C001-REQ-103, C001-REQ-123, C001-REQ-124
- **Traces to:** Q19, IDEA-§10.2, IDEA-§11.1

### C001-US-102 — Orient any agent from a single description file
- **As a** P-05 workspace agent (or a P-02 implementer)
- **I want** a single file at the root of `.sdd/` that tells me what is there, in which order to read it, and where each change stands, implementation included
- **So that** I don't have to explore the folder tree or guess which artifacts are authoritative
- **Value / outcome:** first-read orientation; no consumption of unapproved artifacts (C001-GOAL-06)
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-01
- **Context & notes:** OA-03 option C: a stable `SDD.md` contract plus a generated status block; `registry.json` as derived machine index.
- **Requirements:** C001-REQ-103, C001-REQ-104, C001-REQ-105, C001-REQ-106
- **Traces to:** Q19, OA-03, IDEA-§11.5, IDEA-§11.6

### C001-US-103 — Create a change with its own folder and manifest
- **As a** P-01 spec owner
- **I want** to start a new change with a title and get a numbered folder, manifest and empty phase folders
- **So that** each piece of work has an isolated, ordered history and a manifest stating its phase and gate state
- **Value / outcome:** consistent change folders; no number collisions
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-01
- **Context & notes:** numbering must consider archived changes too, so numbers are never reused.
- **Requirements:** C001-REQ-107, C001-REQ-108, C001-REQ-125
- **Traces to:** Q19, IDEA-§11.1, IDEA-§11.7

### C001-US-104 — Stable, never-reused identifiers
- **As a** P-04 validator
- **I want** every story, requirement, criterion, scenario, task and decision to have a permanent identifier that is never reused or renumbered
- **So that** I can trace code, tests and reports to requirements years later, even after the spec has been revised and archived
- **Value / outcome:** traceability survives revisions and archiving (C001-GOAL-02)
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-01
- **Context & notes:** OA-08 option B: change-scoped prefix `C{NNN}-{TYPE}-{seq}`, short form allowed inside a change. Blocks of sequence numbers per capability are allowed (this spec uses them).
- **Out of scope:** cross-repository IDs.
- **Requirements:** C001-REQ-109, C001-REQ-110, C001-REQ-111, C001-REQ-112, C001-REQ-113
- **Traces to:** OA-08, IDEA-§12.1, P-07

### C001-US-105 — Registry stays consistent with the artifacts
- **As a** P-01 spec owner
- **I want** the machine registry to be rebuilt from the artifacts' own frontmatter and checked by the lint
- **So that** the status I see is never stale or hand-edited into inconsistency
- **Value / outcome:** a single source of truth (frontmatter) with a derived, verified index (C001-SC-02)
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-01
- **Requirements:** C001-REQ-104, C001-REQ-105, C001-REQ-106, C001-REQ-126
- **Traces to:** OA-03, IDEA-G-06

### C001-US-106 — Establish a project constitution and toolchain record
- **As a** P-01 spec owner
- **I want** a short guided interview that writes the project constitution (principles, quality bar, NFR and DoD defaults, forbidden tech, profile thresholds) and a record of which tools are available
- **So that** every later spec inherits the same rules without my repeating them, and agents know which tools (and fallbacks) they can use
- **Value / outcome:** consistency across changes; honest tool degradation (IDEA-P-10)
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-01
- **Context & notes:** gate G0 (lightweight). Borrowed from Spec Kit's constitution (Q7).
- **Requirements:** C001-REQ-114, C001-REQ-115, C001-REQ-127
- **Traces to:** IDEA-§10.2, Q7

### C001-US-107 — Lite profile for small changes
- **As a** P-01 spec owner
- **I want** the conductor to suggest a lite profile for small changes and ask me to confirm it
- **So that** small changes get the same rigor (IDs, EARS, gates, lint) with far fewer files and less ceremony
- **Value / outcome:** the suite is still used for small changes (mitigates IDEA-RK-02)
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-01
- **Context & notes:** decided at OQ-05 and Spec-Q1: the conductor suggests and P-01 confirms; upgrading lite → full is allowed, downgrading full → lite is not.
- **Out of scope:** automatic profile switching.
- **Requirements:** C001-REQ-116, C001-REQ-117, C001-REQ-118, C001-REQ-119, C001-REQ-120
- **Traces to:** OQ-05, Spec-Q1

### C001-US-108 — Capability inventory for brownfield repositories
- **As a** P-01 spec owner working on an existing codebase
- **I want** init to produce one living-spec stub per detected capability listing its entry points, main modules and tests, without inventing requirements
- **So that** my first brownfield change has a map to write its deltas against, without the risk of confidently wrong reverse-engineered requirements
- **Value / outcome:** faster brownfield orientation (C001-GOAL-04)
- **Priority:** Should · **Size hint:** M · **Capability:** C001-CAP-01
- **Context & notes:** decided at OQ-07b. Full reverse-spec is v2.
- **Requirements:** C001-REQ-121, C001-REQ-122
- **Traces to:** OQ-07b, OA-09
