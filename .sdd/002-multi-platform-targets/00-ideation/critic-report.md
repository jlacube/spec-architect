---
artifact: critic-report
change: CHG-002
phase: 00-ideation
reviewed_ids: [C002-DEC-001, C002-DEC-003, C002-DEC-004, C002-DEC-005, C002-DEC-006, C002-DEC-007, C002-DEC-008, C002-DEC-009, C002-OA-001, C002-R-001]
---
# Critic report — CHG-002 00-ideation

**Re-review (2026-10-14) of ideation v0.2.0.** Scope: the items changed after the first review and
the findings they address. That covers `ideation.md` v0.2.0 (§1, §2, §3, G-2, G-4, G-5, NG-4, §5,
§6, §7, §8, §9, §10, §11, §12), `questions-log.md` (rounds 1–2 rewritten, round 3 added), the new
C002-DEC-004…C002-DEC-009 and the corrected C002-DEC-001. Linked items read for consistency:
C002-DEC-003, C002-OA-001 and C002-R-001 (unchanged).

In CR-1…CR-15, line numbers refer to the first review (ideation v0.1.0). Re-review evidence refers
to v0.2.0. `sdd lint 002 --phase 00-ideation --json`: 0 errors, 0 warnings, 0 info.

## Summary
Open findings after the re-review:

| blocker | major | minor |
|---|---|---|
| 0 | 1 | 3 |

Resolved: CR-1, CR-2, CR-3, CR-4, CR-5, CR-6, CR-7, CR-8, CR-10, CR-11, CR-13, CR-14, CR-15.
Still open: CR-9 and CR-12 (both minor, partly resolved). New: CR-16 (major) and CR-17 (minor).

## Findings

### CR-1 — Brownfield deltas against CHG-001 cannot pass lint before CHG-001 is archived, and CHG-001's archive waits for this change
- **Severity:** major
- **Refs:** C001-T-074, C001-T-075, C001-REQ-1106
- **Evidence:** "CHG-001's brownfield dogfood (C001-T-074): it is specified with Architect itself." — `00-ideation/ideation.md:18` (v0.1.0); "Inventory only: describes the code that exists today; it holds no requirements." — `.sdd/_living/CAP-packaging-safety.md:9`; "which is not in _living/" — `C:/Users/jerom/.claude/plugins/marketplaces/local-desktop-app-uploads/architect/scripts/sdd.mjs:8120`; "depends_on: [C001-T-073, C001-T-074, C001-T-053]" — `.sdd/001-architect-agent-suite/20-plan/50-tasks/T-075-archive-chg001.md:9`
- **Why it matters:** Every MODIFIED delta citing CHG-001 would be a lint error at G2, and CHG-001 can only be archived after CHG-002's spec and plan.
- **Suggested fix:** Record the dependency and ask P-01 how deltas cite CHG-001.
- **Status:** resolved — P-01 chose "Cite + waive at G2/G3" (`questions-log.md:111`), recorded in C002-DEC-008, and §5 "Dependencies" (`ideation.md:100-102`) states the waiver and that C001-T-075 must come before CHG-002's archive.

### CR-2 — The Copilot fallback when S-08 refutes tool-list confinement is contradictory, and DEC-001 records none
- **Severity:** major
- **Refs:** C002-DEC-001, C002-OA-001, Q-safety-01
- **Evidence:** "A stays the fallback if S-08 shows" / "that subagent tool lists are not enforced." — `00-ideation/options/OA-001-copilot-guards.md:174-175`; "the Copilot target cannot ship (G-2) until another enforcement exists" — `00-ideation/ideation.md:132` (v0.1.0); "Presented: (A) sdd MCP write server — 3.70, recommended, fails closed; (B) agent-scoped hooks" — `DEC-001-copilot-guards.md:20` (first version)
- **Why it matters:** Three different outcomes were recorded for the same spike result, and the option letters were swapped.
- **Suggested fix:** Ask P-01 and record the fallback in DEC-001, using OA-001's letters.
- **Status:** resolved — P-01 answered "Ship with agent-scoped hooks" (`questions-log.md:122`). DEC-001 records it (`DEC-001-copilot-guards.md:28`) and uses OA-001's letters (`:20`). Gaps in the exception itself are in CR-16.

### CR-3 — DEC-001's memory-folder exception cannot be applied without agent identity, and the memory parity loss is unrecorded
- **Severity:** major
- **Refs:** C002-DEC-001, C002-OA-001
- **Evidence:** "refuses anything outside `.sdd/` (and the agent's memory folder)" — `DEC-001-copilot-guards.md:16` (first version); "generated agents lose this folder and the guard rule has no counterpart there." — `00-ideation/evidence/baseline-survey.md:193`
- **Why it matters:** The write boundary was undefined, and the loss of memory was not recorded.
- **Suggested fix:** Ask P-01, correct DEC-001, and add a non-goal or a mechanism.
- **Status:** resolved — C002-DEC-009 drops memory on the targets, DEC-001 now says "no memory folder on this target, C002-DEC-009" (`DEC-001-copilot-guards.md:16`), and NG-4 is added (`ideation.md:70`).

### CR-4 — The `sdd` MCP server and OpenCode's native permissions are not reconciled with the constitution
- **Severity:** major
- **Refs:** C002-DEC-001, C002-OA-001, C001-CON-12
- **Evidence:** "| Daemons or background services for the CLI | one process per call (C001-CON-12) |" — `.sdd/_constitution/constitution.md:71`; "status, guards) is done by the `sdd` CLI, never by a model." — `.sdd/_constitution/constitution.md:18`; "**Enforcement per target, one core.**" — `00-ideation/ideation.md:105` (v0.1.0)
- **Why it matters:** Where the server lives and why it is not a daemon were unstated, and "one core" was false for OpenCode.
- **Suggested fix:** Add a constitution check to DEC-001 and correct ideation §8.
- **Status:** resolved — the constitution check is at `DEC-001-copilot-guards.md:29`, §8 says OpenCode is "not the CLI cores" and must pass the corpora 100% (`ideation.md:134-139`), and the server's lifetime is stated (`ideation.md:140-141`). One leftover sentence in DEC-001 is in CR-17.

### CR-5 — The OpenCode boundary risks named by R-001 are missing, and the shell fallback has the identity gap DEC-001 avoids
- **Severity:** major
- **Refs:** C002-R-001, C002-OA-001
- **Evidence:** "the key risks are the unverified path string" / "and traversal behaviour (C-03) and redirection or indirect writes through an allowed `sdd *`" — `00-ideation/research/R-001-platform-facts.md:330-331`; "the shell boundary needs a plugin running `sdd guard-bash`" — `00-ideation/ideation.md:131` (v0.1.0)
- **Why it matters:** The research named boundary-bypass risks that the ideation did not list, and the stated fallback lacked agent identity.
- **Suggested fix:** Add the risk rows and reword assumption 1.
- **Status:** resolved — risk rows for the path string, indirect writes, PowerShell on REF-WIN and the plugin's missing identity are at `ideation.md:152-155`, assumption 1 now falls back to the MCP server (`ideation.md:167`), and the S-07 open question is at `ideation.md:179`.

### CR-6 — The Copilot and OpenCode goal measures depend on verification routes that R-001 did not establish
- **Severity:** major
- **Refs:** C002-DEC-003, C002-R-001
- **Evidence:** "does it load Claude-format plugin `agents/` and `commands/`? (not researched here; not needed" — `00-ideation/research/R-001-platform-facts.md:383`; "injection evals 0 acted upon (dev tier per target)" — `00-ideation/ideation.md:49` (v0.1.0)
- **Why it matters:** The Copilot CLI proxy and the OpenCode replay method were unverified and not listed anywhere.
- **Suggested fix:** Add an assumption, an S-08 item and the replay method.
- **Status:** resolved — the assumption is at `ideation.md:169` with a stated fallback, the S-08 open question at `ideation.md:180`, and the replay route ("replay through a headless OpenCode session or its SDK") at `ideation.md:137`.

### CR-7 — Round-1 material decisions have no DEC record
- **Severity:** major
- **Refs:** Q-scope-01, Q-safety-01, Q-source-01, Q-cli-01, C002-DEC-003
- **Evidence:** §7 listed only C002-DEC-001…003 — `00-ideation/ideation.md:92-96` (v0.1.0); "Question Q-eval-01 (non-material)." — `00-ideation/decisions/DEC-003-copilot-evals.md:12`
- **Why it matters:** Material answers had no Context or Consequences, so spec rationales would have no DEC ID to cite.
- **Suggested fix:** Record DEC records for the four round-1 questions and reclassify Q-eval-01.
- **Status:** resolved — C002-DEC-004…C002-DEC-007 exist and are indexed (`ideation.md:119-122`). The log now marks Q-eval-01 material, but DEC-003 was not updated; that leftover is in CR-17.

### CR-8 — G-4's measure contradicts DEC-001 for Copilot
- **Severity:** minor
- **Refs:** C002-DEC-001, Q-cli-01
- **Evidence:** "agents on OpenCode/Copilot call `sdd …`" — `00-ideation/ideation.md:51` (v0.1.0)
- **Why it matters:** The measure was false for Copilot.
- **Suggested fix:** Restate the measure per target.
- **Status:** resolved — the measure is now per target: "the Copilot MCP server runs the CLI from `architect-sdd`" (`ideation.md:61`).

### CR-9 — G-5 says Claude Code behaviour is unchanged, but the in-scope Bash-guard change applies to Claude Code
- **Severity:** minor
- **Refs:** C001-REQ-1106, C002-DEC-007, C002-DEC-008
- **Evidence:** "| G-5 | Claude Code behaviour unchanged |" — `00-ideation/ideation.md:52` (v0.1.0); "id: D-011, ref: C001-REQ-1106" — `.sdd/001-architect-agent-suite/change.md:23`
- **Re-review:** "the allowlist change is specified with defect D-011" — `00-ideation/ideation.md:62`; "merge with defect D-011" — `00-ideation/decisions/DEC-007-cli-npm.md:24`; "CHG-002's spec cites the CHG-001 requirements it changes as MODIFIED deltas" — `00-ideation/decisions/DEC-008-delta-sequencing.md:16`
- **Why it matters:** G-5 is now worded correctly. But "specified with D-011" and "merge" leave open which change owns the bare-`sdd` requirement. It could be CHG-001's D-011 revision, in which case CHG-001 gains a CHG-002 feature and CHG-002 has no delta for it. Or it could be a CHG-002 MODIFIED delta of C001-REQ-1106 under C002-DEC-008, after D-011 lands. The spec writer needs to know which.
- **Suggested fix:** In G-5, §5 and DEC-007, name the owning change. For example: "D-011's CHG-001 revision specifies `node --version` only; CHG-002 adds bare `sdd` as a MODIFIED delta of C001-REQ-1106 after D-011 closes".
- **Status:** open — the G-5 wording is fixed (`ideation.md:62`), but which change specifies the bare-`sdd` allowlist is still ambiguous.

### CR-10 — The problem statement overstates how target-neutral the CLI and skills are
- **Severity:** minor
- **Refs:** C002-R-001
- **Evidence:** "the `.sdd/` method, the templates and the skills) has nothing Claude-specific in it" — `00-ideation/ideation.md:24` (v0.1.0)
- **Why it matters:** It understated the CLI work.
- **Suggested fix:** Separate the target-neutral cores from the Claude-specific entry points.
- **Status:** resolved — `ideation.md:25-29` now names the Claude-specific entry points and cites the baseline survey §1–§2.

### CR-11 — The scope does not say whether the non-guard hooks are ported
- **Severity:** minor
- **Refs:** C002-R-001
- **Evidence:** "| `hooks/hooks.json` | events: PreToolUse (2 entries), PostToolUse (1), SubagentStop (1), SessionStart (1) |" — `00-ideation/evidence/baseline-survey.md:75`
- **Why it matters:** Workflow parity (G-3) for the session-start brief, the post-write lint and the trace was undefined.
- **Suggested fix:** Add a scope line per hook and target.
- **Status:** resolved — a per-target hook table is at `ideation.md:88-95`, with the OpenCode feedback channel tied to S-07.

### CR-12 — Open questions are not classified, and known items are missing
- **Severity:** minor
- **Refs:** C002-R-001, C002-OA-001
- **Evidence:** "| Question | Owner | Needed by |" — `00-ideation/ideation.md:136` (v0.1.0); "- Which OpenCode version and VS Code/Copilot Chat version will be the supported baseline? (the" — `00-ideation/research/R-001-platform-facts.md:372`; "single MCP tools (only `server/*` is documented), and whether every MCP call asks the user" / "for approval." — `00-ideation/options/OA-001-copilot-guards.md:112-113`
- **Re-review:** "| Platforms change fast (hooks, plugins, tools are Preview) | high | medium | pin tested versions in the doctor; re-run spikes before each release |" — `00-ideation/ideation.md:160`. The open-questions table (`ideation.md:173-180`) has no row on the supported versions and none on per-call MCP approval.
- **Why it matters:** The classification and the model baseline are now in place. Two items are still missing. Without supported versions there is nothing to pin in the doctor. And if VS Code asks P-01 to approve every MCP call, every `.sdd/` write on Copilot is interrupted, which is a workflow-fidelity risk that S-08 should measure.
- **Suggested fix:** Add two deferred rows: supported OpenCode and VS Code/Copilot Chat versions (researcher, S-07/S-08, plan) and per-call approval of the `sdd` MCP tools in VS Code (researcher, S-08, plan).
- **Status:** open — the Blocking column and the model-baseline question were added (`ideation.md:173-176`), but the version-baseline and MCP-approval questions are still missing.

### CR-13 — Questions-log entries lack protocol fields, and §3's "Answer (P-01)" column paraphrases
- **Severity:** minor
- **Refs:** Q-safety-01
- **Evidence:** "| Q-safety-01 | Safety bar where hooks cannot identify the caller | Same as Claude: a target ships only when the boundary is enforced |" — `00-ideation/ideation.md:36` (v0.1.0)
- **Why it matters:** The meaning shown to P-01 was not recorded, and an interpretation sat under P-01's name.
- **Suggested fix:** Complete the log entries and rename or split the §3 column.
- **Status:** resolved — every entry now has the protocol fields and "Extracted instructions", and §3 is headed "Outcome" (`ideation.md:37`). Nit: Q-safety-01 states "**Candidates considered:** 3" but presents 2 options and "**Rejected:** none presented" (`questions-log.md:28,33`).

### CR-14 — No record that P-01 confirmed the full profile
- **Severity:** minor
- **Refs:** Q-scope-01
- **Evidence:** "Change CHG-002 · profile full · kind brownfield · approver P-01 (jerome.lacube)." — `00-ideation/ideation.md:17` (v0.1.0)
- **Why it matters:** Readiness item I10 needs P-01's confirmation.
- **Suggested fix:** Log P-01's confirmation.
- **Status:** resolved — Q-profile-01 is answered "Full (Recommended)" (`questions-log.md:144`) and `ideation.md:18` says so.

### CR-15 — The Sources section cites the wrong commit for the baseline survey
- **Severity:** minor
- **Refs:** none
- **Evidence:** "repository at commit b3892d4 and later." — `00-ideation/ideation.md:145` (v0.1.0)
- **Why it matters:** A reader would re-check the counts against the wrong tree.
- **Suggested fix:** Cite 74fe494.
- **Status:** resolved — `ideation.md:185` cites commit 74fe494 and names the workspace survey separately.

### CR-16 — The Copilot hooks exception has no ship condition of its own, no end to the fallback chain, and a detection that cannot fire
- **Severity:** major
- **Refs:** C002-DEC-005, C002-DEC-001, Q-guards-02, Q-safety-01, C002-OA-001, C002-R-001
- **Evidence:** "**Exception (round 3, Q-guards-02):** if spike S-08 refutes the Copilot MCP-server boundary, Copilot ships with agent-scoped hooks, whose boundary is off when hooks are disabled (setting, Workspace Trust, policy)." — `00-ideation/decisions/DEC-005-safety-bar.md:16`; "### Q-guards-02 — If spike S-08 shows Copilot subagents are not confined to their tool list, what happens to the Copilot target?" — `00-ideation/questions-log.md:114`; "- If S-08 shows that agent-scoped PreToolUse does not fire for a custom agent running as a" / "subagent, A fails Q-safety-01 and only B remains." — `00-ideation/options/OA-001-copilot-guards.md:155-156`; "confidence: low (internal names are source-confirmed, medium on their own, but the mapping to hook `tool_name` is not confirmed)" — `00-ideation/research/R-001-platform-facts.md:99`; "the doctor (or a SessionStart check) reporting whether hooks are enabled" — `00-ideation/decisions/DEC-005-safety-bar.md:25`
- **Why it matters:** This is the only path by which a target can ship with a weaker boundary, and four points are open:
  1. DEC-005's rule requires the corpora to pass 100% and the injection evals to show 0, but the exception reads as an unconditional "Copilot ships with agent-scoped hooks". G-2 (`ideation.md:59`) implies the corpora still apply, and DEC-005 does not say so.
  2. The fallback works only if S-08 confirms what R-001 rates medium (A-01: agent-scoped PreToolUse fires for subagents) or low (A-05: hook `tool_name` values). If S-08 refutes these too, nothing is recorded. OA-001 says A then "fails Q-safety-01", and the remaining choice P-01 has not ruled out is deferral; P-01 already rejected "Ship with a warning" in Q-safety-01.
  3. DEC-005's trigger ("refutes the Copilot MCP-server boundary") is wider than the question P-01 answered (subagents not confined to their tool list).
  4. A SessionStart check is itself a hook, so it cannot report that hooks are disabled. Only the on-demand doctor and the README remain.
- **Suggested fix:**
  - In DEC-005 and DEC-001 Consequences, state that the hooks fallback ships only if, with hooks enabled, it passes the path and shell corpora 100% and the injection evals, including calls made by subagents.
  - Record what happens if S-08 shows that agent-scoped hooks do not block a subagent's calls (P-01: `Q-guards-03`).
  - Use Q-guards-02's trigger wording.
  - Replace the SessionStart check with a detection that does not depend on hooks, for example the heartbeat noted under OA-001 candidate A, checked by the CLI on the conductor's first `sdd` call.
- **Status:** open

### CR-17 — DEC records carry round-3 content without a Decided row, and two stale statements remain
- **Severity:** minor
- **Refs:** C002-DEC-001, C002-DEC-005, C002-DEC-003
- **Evidence:** "| 2026-10-13 | P-01 (jerome.lacube) | "Same as Claude (Recommended)" |" (the only Decided row, under a Decision that now contains the round-3 exception) — `00-ideation/decisions/DEC-005-safety-bar.md:30`; "| 2026-10-14 | P-01 (jerome.lacube) | "sdd MCP write server (Recommended)" |" (the only row, under the round-3 fallback at line 28) — `00-ideation/decisions/DEC-001-copilot-guards.md:34`; "using the same guard cores (`guard-path`, `guard-bash`) and corpora as the other targets" — `00-ideation/decisions/DEC-001-copilot-guards.md:16`, versus "— not the CLI cores, so S-07 must show it decides" — `00-ideation/ideation.md:136`; "Question Q-eval-01 (non-material)." — `00-ideation/decisions/DEC-003-copilot-evals.md:12`, versus "**Material:** yes (it sets a release-gate condition)" — `00-ideation/questions-log.md:88`
- **Why it matters:** The Decided table is the record of what P-01 approved, in which words and on which date. As written, the fail-open exception appears approved on 2026-10-13 with the words "Same as Claude". DEC-001 still says OpenCode uses the guard cores, contrary to §8, and DEC-003's label contradicts the log.
- **Suggested fix:**
  - Add a 2026-10-14 Decided row with P-01's words "Ship with agent-scoped hooks" to DEC-001 and DEC-005.
  - Change DEC-001 to "the same corpora as the other targets and the same guard cores as Claude Code".
  - Drop "(non-material)" from DEC-003.
- **Status:** open

## Rubric
| Rubric | Item | Result |
|---|---|---|
| ideation | I1 Problem stated and evidenced | pass (CR-10 resolved; `ideation.md:23-32` cites the baseline survey and C002-R-001) |
| ideation | I2 Goals measurable | pass (CR-6 and CR-8 resolved; each goal G-1…G-5 has a measure, `ideation.md:58-62`) |
| ideation | I3 Non-goals and scope boundary explicit | CR-9 (NG-4, hooks per target and Dependencies added; the owner of the allowlist change is still ambiguous) |
| ideation | I4 Every material decision has a DEC with ≥ 2 presented options | CR-17 (C002-DEC-001…C002-DEC-009 each present ≥ 2 options; Decided rows and stale statements open) |
| ideation | I5 Open questions classified with an owner | CR-12 (all rows classified "deferred" with owner and phase; two questions missing; none blocks G1) |
| ideation | I6 Key risks and assumptions listed | CR-16 (CR-5 resolved; the hooks exception lacks its condition, its chain end and a working detection) |
| ideation | I7 Brownfield: baseline survey exists and is cited | pass (`ideation.md:29`, `:110`, `:185` at commit 74fe494) |
| ideation | I8 Sources cited for external claims | pass (platform claims trace to C002-R-001; Copilot CLI loading is now an assumption, `ideation.md:169`) |
| ideation | I9 Q&A answers logged verbatim, incl. embedded instructions | pass (CR-13 resolved; answers in rounds 1–3 match the DEC Decided words; "Extracted instructions: none" throughout) |
| ideation | I10 Profile confirmed by P-01 | pass (CR-14 resolved, `questions-log.md:144`) |

Stories, requirements, NFR, acceptance, domain/interfaces/architecture, DoD/index and plan rubrics: n/a, as the ideation has no stories, requirements or plan.

## Verdict
**go**

- No blocker, and none of the first review's findings were blockers. The revision resolves 13 of the 15 findings, including all seven majors. C002-DEC-004…C002-DEC-009 record P-01's answers verbatim, and every open question is classified with an owner and a phase. Lint is clean.
- One major remains, CR-16. The hooks exception must state that it still passes the corpora with hooks on, must state what happens if S-08 also refutes agent-scoped hooks (`Q-guards-03`), and needs a detection that does not depend on hooks. It is not a G1 blocker, because the fallback only applies after S-08 in the plan, but the spec cannot write Copilot's ship requirement without it. Fix it before G1 or present it at the gate.
- Minors CR-9, CR-12 and CR-17 are record corrections that the conductor can make without P-01.
