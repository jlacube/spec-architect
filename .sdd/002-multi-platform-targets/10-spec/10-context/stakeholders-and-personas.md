---
id: C002-SPEC-CTX-02
artifact: spec/context/personas
change: CHG-002
phase: 10-spec
status: draft
---
# Stakeholders and personas

Persona numbers keep the meaning they have in CHG-001
(`.sdd/001-architect-agent-suite/10-spec/10-context/stakeholders-and-personas.md`), so that P-01 means
the same person in both changes. Each section below records only what CHG-002 adds or changes; the
base description stays in the CHG-001 file. Terms are defined in `../40-domain/glossary-delta.md`.

## P-01 — Spec owner and maintainer (primary)

| Attribute | Value |
|---|---|
| Base | CHG-001 P-01 (spec owner; sole approver of gates, waivers, profile and scope) |
| Added role | Maintains the source plugin and runs `npm run package`, `npm run check` and the evals; publishes `architect-sdd`; runs and records the manual VS Code checklist before each release |
| Environment | REF-WIN (Windows 11). In addition to Claude Code: OpenCode, VS Code with GitHub Copilot Chat, and Copilot CLI for evals. Corpus replays for a release run with Developer Mode on or elevated, so that file symbolic links can be created (C002-REQ-634, Q-safety-05) |
| Goals in CHG-002 | Write the plugin once and ship it to every target; hold gates on any target with the same guarantees; keep eval spend under control when three hosts are tested |
| Pain points | Per-target copies that drift; a boundary that looks enforced but is not (Copilot hooks without agent identity); hosts whose agent features are Preview or Experimental and change between releases |
| Authority | Unchanged: only P-01 approves gates, on every target. A skipped answer of a question tool is never an approval |

## P-02 — Implementer

| Attribute | Value |
|---|---|
| Base | CHG-001 P-02 |
| In CHG-002 | Implements CHG-002 in this repository from `20-plan/handoff.md`, with task IDs in commits and progress through `sdd task set` (ideation §5, hand-over). The hand-off contract is unchanged (C002-NG-03) |

## P-03 — Adopter

| Attribute | Value |
|---|---|
| Base | CHG-001 P-03 (installs the suite after it is shared) |
| Change | P-03 now works on one of three hosts. Stories name the host: "P-03 adopter on Claude Code", "on OpenCode" or "on Copilot VS Code" |
| On Claude Code | Expects nothing to change (C002-GOAL-05); installs the plugin as today and needs no npm package |
| On OpenCode | Installs the OpenCode target package and `architect-sdd`; starts the conductor as an OpenCode primary agent |
| On Copilot VS Code | Installs the Copilot target package and `architect-sdd`; enables the VS Code settings the package needs (plugins, the question tool); starts the conductor as a custom agent in Copilot Chat |
| Constraints | Node.js 20 or later on the PATH for `sdd`; host versions may differ from the tested ones; may lack ripwire, Serena or ast-grep (CHG-001 fallbacks apply) |

## P-04 — Validator and P-05 — Workspace agent

Unchanged (CHG-001 file). The `.sdd/` format does not change (C002-NG-03), so their contracts hold on
every target. No CHG-002 story is written for them.

## Stakeholder map

| Stakeholder | Interest | Influence | Engagement |
|---|---|---|---|
| P-01 | All outcomes; safety bar on every target | Decides | Gates G1–G3, interviews, manual VS Code checklist |
| P-02 | A plan that names generator, server and checks precisely | Indirect | Hand-off of CHG-002 |
| P-03 on Claude Code | No regression | Low | Regression set (C002-GOAL-05) |
| P-03 on OpenCode or Copilot VS Code | Install notes, a working boundary, interviews that work in their host | Medium (future users) | Per-target README sections, doctor |
| OpenCode maintainers | None directly | Constraints: permission engine semantics, `question` tool, plugin API, release cadence | Spike S-07; tested version recorded by the doctor |
| Microsoft (VS Code) and GitHub (Copilot Chat, Copilot CLI) | None directly | Constraints: agent-scoped hooks and plugins are Preview, `vscode/askQuestions` is Experimental, hook input carries no agent identity | Spike S-08; tested versions recorded by the doctor |
| npm registry | None directly | Constraint: package name availability and publishing account | Publishing `architect-sdd` |
