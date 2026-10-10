---
id: C001-SPEC-CTX-02
artifact: spec/context/personas
change: CHG-001
phase: 10-spec
status: draft
traces_to: [IDEA-§2, IDEA-§4, IDEA-§10.6]
---

# Stakeholders and personas

User stories reference these persona IDs. The system components named in EARS statements are
defined in `../40-domain/glossary-delta.md` §2.

## P-01 — Spec owner (primary)

| Attribute | Value |
|---|---|
| Who | Jerome: solo developer and decision maker; also the first user of the suite |
| Environment | Windows 11, Claude Code desktop app (Code tab) and CLI, PowerShell 7 + Git Bash, Node ≥ 20 |
| Goals | Turn ideas into detailed, verifiable specs and plans; keep decisions auditable; reuse the method across projects; share it later |
| Interaction style | Batched rounds of ≤ 4 option-based questions with a recommendation first; often extends a chosen option with free-text requirements (e.g. "1 + search for other tools") |
| Pain points | Agents assuming instead of asking; briefs and summaries instead of detail; specs that drift from code; context cost of tools |
| Authority | Only P-01 approves gates, grants waivers and changes profile or scope |

## P-02 — Implementer

| Attribute | Value |
|---|---|
| Who | Any executor of the hand-off: a Claude Code session (e.g. with Superpowers executing-plans), another agent runtime (Codex), or a human developer |
| Goals | Know exactly what to build, in which order, where, and how to prove it is done; report progress and spec defects with minimal friction |
| Constraints | May not have the Architect plugin installed. Can run `node` scripts, or can only edit markdown frontmatter |
| Contract | `20-plan/handoff.md` (C001-CAP-06) and the reporting commands (C001-CAP-09) |

## P-03 — Adopter

| Attribute | Value |
|---|---|
| Who | Another developer or team installing the plugin after it is shared |
| Goals | Install it in minutes; understand the workflow; customize the constitution and templates per repo without forking |
| Constraints | macOS or Linux possible (prepared, not tested at v1); may lack ripwire/Serena/Archify |

## P-04 — Validator

| Attribute | Value |
|---|---|
| Who | A human reviewer or a future conformance-checker agent (v2) that checks code against the spec |
| Goals | Find, for each requirement and acceptance criterion, the tasks, tests and code that realize it; detect divergence |
| Needs from v1 | Stable IDs, `trace.json`, task reports with commit SHAs, DoD evidence, `_living/` current-truth specs |

## P-05 — Workspace agent (system persona)

| Attribute | Value |
|---|---|
| Who | Any agent session that opens a repository containing `.sdd/`: the Architect agents, but also unrelated coding sessions |
| Goals | Learn in one read what the workspace contains, which change is active, which artifacts are approved and what to read next |
| Contract | `.sdd/SDD.md` + `registry.json` + `change.md` (C001-CAP-01) and the session-start orientation (C001-CAP-09) |

## Stakeholder map

| Stakeholder | Interest | Influence on v1 | Engagement |
|---|---|---|---|
| P-01 | All outcomes | Decides | Gates G0–G3, interviews |
| P-02 | Hand-off quality, reporting friction | Indirect (dogfood feedback) | Dogfood executions (C001-SC-04) |
| P-03 | Install and docs | Low at v1 | README, clean-profile test (C001-SC-09) |
| P-04 | Traceability artifacts | Medium (shapes `trace.json`) | v2 design input |
| Third-party tool authors (ripwire, Serena, Archify, Context7, DeepWiki) | None directly | Constraints (versions, licenses, behaviours) | Version pinning in toolchain.md |
