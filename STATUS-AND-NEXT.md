# Status and next steps (2026-10-12, updated after T-062)

## 1. Milestones

| Milestone | Scope | State |
|---|---|---|
| M-1 | verification spikes S-01 … S-06, repository scaffolding | done |
| M-2 | deterministic `sdd` CLI, dogfooded on this repository | done |
| M-3 | conductor, interview, phase skills, commands, gate protocol, ideation/spec specialists, eval harness | done — exit criteria at milestone tier **deferred to release** |
| M-4 | cartographer, architect, planner, revise/stop/doctor | done — exit criteria at milestone tier **deferred to release** |
| M-5 | path guard, shell guard, hooks, archive, security corpus | done — injection evals at milestone tier **deferred to release** |
| M-6 | packaging and quality gates | in progress — T-060, T-061, T-062 done |
| M-7 | release v0.1.0 and dogfooding on two real changes | after M-6 |

Tasks: **50 of 59 done**, one dropped (T-071, Archify — fallback only on Windows per spike S-03),
8 to do. Defects: 8 found, 8 closed (D-008 fixed 2026-10-12, see §3a). Phases G1/G2/G3: approved, hashes match.

## 2. Deferred items (to be closed before release)

Recorded with P-01's words in `docs/milestone-log.md`; the release gate (T-072) checks them.

| From | Item | Why deferred |
|---|---|---|
| M-3 | all M-3 eval scenarios at milestone tier (3 runs each); a toy change reaching G2; P-01 sets the release eval budget from the metrics report | cost: one dev-tier pass of the 52 M-3 scenarios ≈ $14.70 |
| M-4 | M-4 evals at milestone tier; a toy change reaching G3 on cfg-full and cfg-bare | run together with M-3 |
| M-5 | injection evals at milestone tier (≈ $12) and the re-planted case INJ-19 | dev tier passed (0 of 21 acted upon); budget |

## 3. What M-6 contains

| Task | Content | Paid evals? |
|---|---|---|
| T-060 | plugin configuration (manifest, marketplace entry, settings) | no |
| T-061 | plugin structure checks (`PLG-*` codes: tool grants, skill sizes, duplicated procedures, portability) | no |
| T-062 | README and user documentation of the plugin | no |
| T-063 | routing and delegation evals (descriptions route ≥ 90% correctly) | **yes** |
| T-064 | dormant CI configuration | no |
| T-065 | NFR measurements report | partly |
| T-076 | plan lint rules (from defect D-003) | no |

Plan: free tasks first (T-060, T-061, T-062, T-076, T-064), then ask P-01 for an M-6 eval budget
before T-063 and the paid parts of T-065.

## 3a. Defect D-008 (closed 2026-10-12)

Started as the plugin's `.mcp.json` says (`--project-from-cwd`), Serena activates no project in a
folder without `.git` or `.serena/project.yml`, and then its read-only mode is not applied: it lists
23 tools including editing ones. The agents still cannot call them (they are granted the five read
tools by name), but the spec says the server itself exposes only read-only tools. Verified fix:
`--project .` (Claude Code starts MCP servers in the project folder) gives the seven read-only tools
with or without git. P-01 approved the revision ("ok for fixing D-008"; G2 and G3 re-approved); `.mcp.json` now uses
`--project .`, and TS-1007 checks the tool list in folders with and without git.

## 4. What M-7 contains

T-070 repository constitution, T-072 release gate (all deferred items closed, evidence complete),
T-073 dogfood on a greenfield change, T-074 dogfood on a brownfield change, T-075 archive CHG-001
into the living specs with its own `sdd archive`.

## 5. Budgets

- **Plan usage:** work pauses near 90% of the 5-hour window and resumes after the reset (a
  session timer is set for 01:37 local on 2026-10-12).
- **API key for evals:** about $15.15 of the $20 top-up used; M-5 used ≈ $4.25 of its $5 budget.

## 6. How to check the state yourself

```bash
node plugins/architect/scripts/sdd.mjs status
node plugins/architect/scripts/sdd.mjs stale check 001
node plugins/architect/scripts/sdd.mjs lint
npm run check
```
