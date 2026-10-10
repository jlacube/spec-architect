---
id: C001-SPEC-GLOSSARY
artifact: spec/glossary-delta
change: CHG-001
phase: 10-spec
status: approved
---

# C001 — Glossary delta

Terms introduced by CHG-001. On archive they are merged into `_constitution/glossary.md`
(C001-REQ-919). §1 defines domain terms; §2 defines the **system names** that may appear
after `THE` in EARS statements (checked by C001-REQ-407).

## 1. Domain terms

| Term | Definition |
|---|---|
| Architect | The plugin and agent suite specified by CHG-001 |
| Workspace | The `.sdd/` folder of a repository and everything in it |
| Change | A unit of specification work with its own folder `NNN-slug/` |
| Phase | One of `00-ideation`, `10-spec`, `20-plan` of a change |
| Gate | Human approval point at a phase exit: G0 constitution, G1 ideation, G2 spec, G3 plan |
| Profile | `full` (multi-file layout) or `lite` (reduced file set, same rules) |
| Capability | A cohesive area of behaviour grouping stories and requirements (`CAP-nn`) |
| Living spec | Current-truth specification of a capability in `_living/` |
| Capability inventory | An `inventory_only` living-spec stub listing entry points, modules and tests without requirements |
| Delta | `ADDED`, `MODIFIED`, `REMOVED` or `RENAMED` tag of a requirement relative to the living spec |
| Evidence entry | A recorded code claim with path, symbol, layer, confidence and disclosures |
| Evidence layer | The tool that produced an evidence entry: ripwire, serena, lsp, grep or ast-grep |
| Marker | Inline tag `[NEEDS CLARIFICATION: …]`, `[ASSUMPTION: …]` or `[WAIVED: …]` |
| Waiver | Recorded acceptance of a known gap at a gate |
| Stale | Status of an approved phase whose content or predecessor changed after approval |
| Approval hash | SHA-256 of a phase's normalised content stored at approval (C001-IF-13 §2) |
| Gate summary | The report shown before a gate decision (C001-IF-13 §1) |
| Hand-off | The `handoff.md` contract where Architect stops and an implementer starts |
| Defect (spec defect) | An implementer-reported error in a specification item (`D-<seq>`) |
| Unattended drafting | Conductor mode that applies recommended options to non-blocking questions until the next gate |
| Interview round | One AskUserQuestion call of 1–4 questions |
| Options analysis | Scored comparison of 4–5 candidates for a decision (`OA`) |
| Reference machine | REF-WIN: the Windows 11 configuration used for NFR measurement |

## 2. System names (allowed after `THE` in EARS statements)

| System name | Meaning | Component |
|---|---|---|
| plugin | The installed `architect` Claude Code plugin as a whole | C001-COMP-11 |
| plugin's MCP configuration | The plugin's `.mcp.json` | C001-COMP-11 |
| repository | The Architect source repository (this repo) | — |
| build | The bundling and license-check step producing `scripts/sdd.mjs` | C001-COMP-12 |
| plugin structure check | The checks of C001-IF-08 §3 run by `npm run check` | C001-COMP-12 |
| unit tests | The `node --test` suite of the repository | C001-COMP-12 |
| distributed plugin | The plugin as installed by a user (no dev dependencies) | C001-COMP-11 |
| README | The repository's `README.md` | C001-COMP-11 |
| sdd CLI | `scripts/sdd.mjs` and its subcommands | C001-COMP-03 … COMP-07 |
| lint | The `sdd lint` subcommand and rule engine | C001-COMP-04 |
| path guard | The PreToolUse hook checking write targets | C001-COMP-08 |
| bash guard | The PreToolUse hook checking shell commands | C001-COMP-08 |
| guard | Either the path guard or the bash guard | C001-COMP-08 |
| session-start hook | The SessionStart hook emitting the status brief | C001-COMP-08 |
| conductor | Agent A0 `sdd-conductor` (main session) | C001-COMP-01 |
| researcher | Agent A1 `sdd-researcher` | C001-COMP-02 |
| cartographer | Agent A2 `sdd-cartographer` | C001-COMP-02 |
| options-analyst | Agent A3 `sdd-options-analyst` | C001-COMP-02 |
| spec-writer | Agent A4 `sdd-spec-writer` | C001-COMP-02 |
| test-designer | Agent A5 `sdd-test-designer` | C001-COMP-02 |
| architect | Agent A6 `sdd-architect` | C001-COMP-02 |
| planner | Agent A7 `sdd-planner` | C001-COMP-02 |
| critic | Agent A8 `sdd-critic` | C001-COMP-02 |
| auditor | Agent A9 `sdd-auditor` | C001-COMP-02 |
| specialist | Any of agents A1–A9 | C001-COMP-02 |
| author agent | Any of spec-writer, test-designer, architect, planner | C001-COMP-02 |
| Architect agent | Any of agents A0–A9 | C001-COMP-01, COMP-02 |
| agent | Any Architect agent (used in NFRs) | C001-COMP-01, COMP-02 |
| agent definitions | The markdown files under the plugin's `agents/` | C001-COMP-11 |
| definitions of | Prefix: a subset of the agent definitions named after "of" | C001-COMP-11 |
| `sdd-conductor` definition | `agents/sdd-conductor.md` | C001-COMP-11 |
| skills preloaded by any one agent | The `skills` list of one agent definition | C001-COMP-10 |
| suite | All Architect components acting together (used in NFRs) | all |
| Ordered task list section of `handoff.md` | The hand-off section listing tasks topologically | output of C001-COMP-02 (planner) |
| commands in `hooks/hooks.json` | The hook command lines declared by the plugin | C001-COMP-08 |
