---
id: C002-SPEC-CTX-01
artifact: spec/context/problem-and-goals
change: CHG-002
phase: 10-spec
status: draft
traces_to: [ideation §2, ideation §4]
---
# Problem and goals

## 1. Problem statement

Source: [ideation §2](../../00-ideation/ideation.md) (approved at G1), with the evidence of the
[baseline survey](../../00-ideation/evidence/baseline-survey.md) §1–§2 and
[C002-R-001](../../00-ideation/research/R-001-platform-facts.md). Normative statement for this spec:

> Architect runs only on Claude Code. Teams whose assistant is OpenCode or GitHub Copilot in VS Code
> cannot use its workflow: interviews, gates, traceability, the deterministic `sdd` CLI and the
> write/shell boundary. The method, the templates and the CLI's decision cores are target-neutral;
> the entry points around them (hook identity, the Bash allowlist, agent frontmatter, skill wiring
> sections, command bodies) are Claude-specific. Hand-made ports would drift from the source plugin,
> and a naive port would lose the write/shell boundary, because Copilot hooks do not identify the
> calling agent and VS Code ignores Claude hook matchers.

CHG-002 delivers the portability that CHG-001 designed but deferred (CHG-001's IDEA-NG-05).

## 2. Goals

Ideation labels G-1 … G-5 map in order to C002-GOAL-01 … 05.

| ID | Goal | Measure (from the ideation) | Measured by | Ideation |
|---|---|---|---|---|
| C002-GOAL-01 | One build produces installable OpenCode and Copilot VS Code packages from the source plugin | `npm run package` emits both target packages; zero hand-maintained per-target copies | C002-SC-01, C002-SC-02, C002-SC-04 | G-1 |
| C002-GOAL-02 | The same safety level on every target | the guard corpora pass 100% against each target's enforcement mechanism (applicable cases with the per-mechanism expectations of Q-safety-02 and Q-safety-04, C002-REQ-625 … C002-REQ-627, C002-REQ-630, C002-REQ-632); injection evals show 0 instructions acted upon (dev tier, per target); the Copilot hooks fallback, if used, is flagged (C002-DEC-005) | C002-SC-03 | G-2 |
| C002-GOAL-03 | The same workflow on every target: interviews, gates with P-01's verbatim words, traceability | the gate, interview and revise scenarios pass on each target (automated where the host allows, recorded manual check otherwise) | C002-SC-01, C002-SC-02 | G-3 |
| C002-GOAL-04 | The `sdd` CLI is reachable on every target without a plugin-root variable | OpenCode agents call `sdd …` from `architect-sdd`; the Copilot sdd MCP server runs the CLI from `architect-sdd`; Claude Code keeps its bundled copy | C002-SC-01, C002-SC-02 | G-4 |
| C002-GOAL-05 | Claude Code behaviour unchanged, except three bash guard changes: a bare `sdd` command is accepted; `sdd serena-config` and `sdd serena-launch` are allowed only with a data folder outside the repository; a writing `sdd` subcommand is allowed with the option `--cwd` only when its folder lies inside the repository root | every CHG-001 test and eval that passes today still passes, with the changed expectations of the three bash guard changes only; the changes (bare `sdd …` and `node --version` from defect D-011 of CHG-001, C002-REQ-503; the Serena data-folder confinement, C002-REQ-517; the `--cwd` confinement of writing subcommands, C002-REQ-521) are specified in CHG-002, and D-011 is closed when CHG-002 implements it | C002-SC-05 | G-5, widened by Q-guards-04 (spec round 2) and Q-guards-05 (spec round 4) |

## 3. Success criteria

Ideation labels SC-1 … SC-5 map in order to C002-SC-01 … 05.

| ID | Criterion | Goal | Ideation |
|---|---|---|---|
| C002-SC-01 | A fresh OpenCode install reaches gate G1 of a toy change with the generated package | C002-GOAL-01, C002-GOAL-03, C002-GOAL-04 | SC-1 |
| C002-SC-02 | A fresh VS Code with Copilot install reaches gate G1 of a toy change with the generated package (recorded manual run) | C002-GOAL-01, C002-GOAL-03, C002-GOAL-04 | SC-2 |
| C002-SC-03 | On both generated targets, an Architect agent cannot write outside `.sdd/` or run a command outside the allowlist (guard corpora replayed against each target's enforcement mechanism) | C002-GOAL-02 | SC-3 |
| C002-SC-04 | A change to the source plugin reaches all targets through one `npm run package`, with structure checks run on every target package | C002-GOAL-01 | SC-4 |
| C002-SC-05 | `npm run check` stays green, including the new per-target checks | C002-GOAL-01, C002-GOAL-05 | SC-5 |

## 4. Non-goals

Ideation labels NG-1 … NG-4 map in order to C002-NG-01 … 04.

- C002-NG-01: Copilot CLI and the Copilot cloud agent as supported targets (the cloud agent cannot hold a gate); Copilot CLI is used only to run evals (C002-DEC-004, C002-DEC-003).
- C002-NG-02: Host-specific features beyond parity: no capability that only one target has.
- C002-NG-03: Changes to the SDD method, the `.sdd/` format or the ID scheme.
- C002-NG-04: Agent memory (`memory: project`) on OpenCode and Copilot VS Code (C002-DEC-009).
