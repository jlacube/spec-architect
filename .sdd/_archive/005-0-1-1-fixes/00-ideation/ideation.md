---
id: "CHG-005"
artifact: ideation
change: "CHG-005"
phase: 00-ideation
status: draft
version: 0.3.0
created: "2026-11-15"
---
# 0.1.1 fixes — ideation

## 1. Document control
| Field | Value |
|---|---|
| Change | CHG-005 "0.1.1 fixes" · lite · brownfield |
| Version | 0.3.0 |
| Date | 2026-11-17 |
| Status | draft |
| Authors | conductor (with sdd-cartographer, sdd-researcher) |
| Approver | P-01 (Jerome LACUBE) |

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-11-15 | conductor | Scaffold |
| 0.2.0 | 2026-11-17 | conductor | Rounds 2–3, evidence and research; all sections written |
| 0.3.0 | 2026-11-17 | conductor | Round 4; critic CR-1…CR-9 addressed |

**Conventions used here.** "D-032", "D-034" and "D-035" mean the defects of **CHG-001** (registry, CHG-001 defects), not
CHG-002's defects with the same numbers. "Both hosts" means the two released targets of 0.1.0: the Claude Code plugin and
the GitHub Copilot package (VS Code and Copilot CLI); OpenCode is not released (CHG-003).

## 2. Problem statement
Architect 0.1.0 (released 2026-11-15) shipped with five known faults that P-01 and implementers hit in normal use. A change
requested in plain words is created with the CLI defaults and no profile round (D-032; evidence E-10…E-16). An interview
answer given between a gate approval and the start of the next phase is logged in no questions log (D-034; E-19…E-23).
An implementer without the Architect plugin cannot run the reporting commands of the hand-off, of the generated `SDD.md`
or of the plugin README, so task status stays `todo` (D-035; E-27, E-34; critic CR-1). `sdd archive` refuses while the
archive task itself is not done, and does not check the tasks of a lite change at all (E-37…E-43). `sdd hash` and
`sdd gate show` fail with ERR-CLI-002 on any archived change (E-46, E-48, E-51). Affected: P-01 as spec owner, the
conductor on both hosts, and any implementer agent following a hand-off.

## 3. Q&A decision record
Full entries, options and verbatim answers: `questions-log.md`.

| ID | Question | Answer |
|---|---|---|
| Q-route-01 | Revise CHG-001 or carry the defects to a new change? | "go with B" (round 1) |
| Q-scope-01 | What should CHG-005 cover besides D-032, D-034, D-035? | "Add archive precondition + sdd hash can't has an archived change - both to fix" |
| Q-newchange-01 | Plain-words request for a new change? | Always run new procedure (Recommended) |
| Q-postgate-01 | Where to log an answer given between a gate approval and the next phase? | Next phase's log (Recommended) |
| Q-scope-02 | Which commands accept an archived change? | Read-only lookups (Recommended) |
| Q-scope-03 | Archive precondition also covers lite tasks? | Include lite tasks (Recommended) |
| Q-handoff-01 | Hand-off reporting command without the plugin? | Bare sdd + install line (Recommended) |
| Q-release-01 | Is the 0.1.1 release part of CHG-005? | Release 0.1.1 here (Recommended) |
| Q-scope-04 | Also decide where an answer after G3 (or a Stop) is logged? | Mark as non-goal (Recommended) |

## 4. Goals and non-goals
### 4.1 Goals
Each goal names how it is checked; the spec turns these into acceptance scenarios.

1. **G-1 (D-032):** every request to create a change, with or without `/architect:new`, runs the new-change procedure
   (size estimate, profile and kind round) before `sdd change new`. Check: eval cases defined in 10-spec, one
   plain-words create request per host, pass when the profile question is asked before any `sdd change new` call
   (0 creations with unasked defaults).
2. **G-2 (D-034):** every answer P-01 gives between a gate approval and the start of the next phase is logged verbatim
   in the next phase's `questions-log.md`, marked as given before the phase started. Check: a scenario that answers after
   a G1 approval and asserts the entry in `10-spec/questions-log.md`, the approved phase's hash unchanged and
   `sdd stale check` reporting no stale phase.
3. **G-3 (D-035):** every place that tells an implementer how to report progress — both hand-off templates, the
   `SDD.md` text the CLI writes (`src/workspace/sddmd.ts:33`, C001-REQ-103) and `plugins/architect/README.md:114` —
   names `sdd …` preceded by a one-time `npm install -g architect-sdd@<version>`, where `<version>` is the plugin version
   filled in deterministically (rule set in 10-spec). Check: a test that no shipped text contains `<plugin-root>` or
   `<plugin>/scripts/sdd.mjs`, and a test that a scaffolded hand-off names the actual plugin version.
4. **G-4 (archive):** `sdd archive` does not block on its own archive task, and blocks on open tasks of both profiles
   (`50-tasks/` files and lite `plan.md` task sections), as C001-REQ-913 states. Check: integration tests on a full and
   a lite fixture.
5. **G-5 (archived lookup):** read-only commands (`hash`, `gate show` and the other read-only lookups listed in 10-spec)
   resolve a change under `.sdd/_archive/`; writing commands keep refusing an archived change. Check: one test per
   command of the list, and one refusal test per writing command.
6. **G-6 (release):** 0.1.1 released on both hosts, and `architect-sdd` 0.1.1 published on npm before or with the plugin
   (Q-release-01). Check: `npm run check` green on the release commit; the registry lists 0.1.1.

### 4.2 Non-goals
1. No change to the `sdd change new` defaults or required options (Q-newchange-01: CLI unchanged).
2. No editing of archived changes through the CLI.
3. No rule for answers given after the G3 approval or after a Stop (Q-scope-04).
4. No cost or token work (CHG-004) and no OpenCode release (CHG-003).
5. No rework of the hand-off's frontmatter fallback beyond keeping it.

## 5. Scope boundary
- **In scope:** the five items of §2 and the 0.1.1 release (Q-release-01): the shared plugin text
  (`plugins/architect/` agents, commands, skills, templates, README), the CLI sources in `src/` (including
  `src/workspace/sddmd.ts`) and the tracked bundle; tests whose pinned line numbers move (E-9, E-36); spec text of the
  superseded or touched requirements (C002-REQ-213, C001-REQ-103, C001-REQ-210, C001-REQ-616, C001-REQ-913,
  C002-REQ-518, C002-REQ-519); building the Claude Code and Copilot packages, P-01's npm publish of `architect-sdd`
  0.1.1, and the release record.
- **Out of scope:** new CLI commands; Copilot/OpenCode mapping changes (shared text flows unchanged, E-8); paid eval
  campaigns beyond the cases these fixes need.
- **Later:** any wider sweep of 0.1.0 gaps (Q-scope-01 option 3 not chosen); answers after G3 (Q-scope-04).

## 6. Research index
| Note | Question | Confidence |
|---|---|---|
| `research/R-001-sdd-without-plugin.md` | How an implementer without the plugin can run `sdd` — `architect-sdd` 0.1.0 is published, bins `sdd` and `sdd-mcp`; prior art edits files or uses a published CLI | high (registry), medium (npx form) |
| `evidence/baseline-survey.md` | Baseline, location, callers, blast radius and test reach of the five items (E-1…E-53) | evidence entries per claim |

## 7. Options and decisions index
Lite profile: each decision is P-01's answer to the listed question; candidates and rejected options are in
`questions-log.md`.

| Question | Candidates | Chosen option |
|---|---|---|
| Q-route-01 | 2 (round 1, before this phase's analysis rules applied) | Release 0.1.0 with known gaps; fix in this lite change |
| Q-scope-01 | 4 | Three defects + archive precondition + archived `sdd hash` |
| Q-newchange-01 | 4 | Conductor always runs the new-change procedure; CLI unchanged |
| Q-postgate-01 | 4 | Next phase's questions log, created on first use |
| Q-scope-02 | 5 | Read-only lookups resolve archived changes |
| Q-scope-03 | 4 | Archive task check covers lite tasks |
| Q-handoff-01 | 5 | Bare `sdd` plus one-time npm install line |
| Q-release-01 | 4 | 0.1.1 released in this change, npm included |
| Q-scope-04 | 4 | Answers after G3 are a non-goal |

## 8. Design direction
- **D-032:** move the new-change procedure out of `commands/new.md` into shared conductor text (agent or a skill) that
  any create-change intent triggers; `/architect:new` calls the same procedure (E-10…E-18).
- **D-034:** interview-protocol §5 and gate-protocol name the target log for the window between phases; the conductor
  creates the next phase's `questions-log.md` on first use (E-19…E-26).
- **D-035:** the hand-off templates, the CLI-written `SDD.md` text and the plugin README use bare `sdd` with an install
  line carrying the plugin version; the npm rewrite of those lines becomes a no-op (E-27…E-36; critic CR-1, CR-2).
- **Archive:** `archiveBlockers` identifies the archive task (or the running archive) and reads lite `plan.md` tasks the
  way `task set` does (E-37…E-45).
- **Archived lookup:** the change resolver searches `.sdd/_archive/` for read-only commands only; writing commands keep
  the existing refusal (E-46…E-53).
- **Release:** version bump in `plugin.json` (single source, E-5), packages built by `npm run check`, npm publish by P-01.

## 9. Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tests pinned to line numbers of the shared text break (E-9, E-36) | high | low | Update the pins in the same task as each text edit |
| A 0.1.1 hand-off names a version not yet on npm | medium | medium | Publish `architect-sdd` before or with the plugin release; plan orders it |
| `<version>` left unfilled, repeating D-035's placeholder cause (CR-2) | medium | high | Deterministic fill rule set in 10-spec; test of a scaffolded hand-off |
| Implementer lacks registry access or global-install rights (R-001) | medium | medium | Keep the frontmatter fallback; mention `npm install` without `-g` in the spec if needed |
| PowerShell execution policy blocks npm shims on Windows (R-001, low confidence) | low | medium | Spec notes the `.cmd` shim; manual check on REF-WIN |
| A next-phase `questions-log.md` created before the phase starts trips lint on a lite change (E-25) | medium | low | Spec checks lint on a lite fixture; template the log |
| Archived resolver lets a writing command touch a closed change | low | high | Allow-list read-only commands; test every writing command refuses |
| How the archive task is identified misfires on hand-named tasks | medium | medium | P-01 settles the rule in 10-spec; test full and lite fixtures |
| Plain-words create intent not recognised on one host | medium | medium | Eval cases on both hosts at dev tier |

## 10. Assumptions
| Assumption | If wrong |
|---|---|
| [ASSUMPTION: the frontmatter fallback stays in the hand-off unchanged] | Spec rewrites it alongside G-3 |
| [ASSUMPTION: Copilot packages receive the shared-text fixes with no mapping change, per E-8] | Spec adds the mapping change to scope |

## 11. Open questions
| Question | Owner | Needed by |
|---|---|---|
| Rule that identifies the archive task (task title, a frontmatter flag, or the last task) | P-01 (material), prepared by spec-writer | 10-spec |
| Rule that fills `<version>` in the install line (CLI substitution at scaffold or planner) | spec-writer, architect | 10-spec |
| Exact list of read-only commands that resolve archived changes | spec-writer from E-46…E-53 | 10-spec |
| Eval budget for the D-032 and D-034 cases | P-01 | 20-plan |

## 12. Sources
- npm registry, package `architect-sdd`, https://registry.npmjs.org/architect-sdd — retrieved 2026-11-17 (via R-001).
- npm docs, `npx`, https://docs.npmjs.com/cli/v11/commands/npx — retrieved 2026-11-17 (via R-001).
- Further sources with retrieval dates: `research/R-001-sdd-without-plugin.md` §Sources.
