---
id: C002-OA-002
artifact: ideation/option-analysis
change: CHG-002
phase: 00-ideation
status: draft
title: "Skill delivery on targets without skill preloading"
---

# C002-OA-002 — Skill delivery on targets without skill preloading

## Problem

On Claude Code, each agent's `skills:` field preloads the listed `SKILL.md` bodies into the
subagent's first request. The cost is linear, about 308 tokens per 1,000 characters
(`docs/spikes/S-06-skills-mcp.md`). The agent bodies are short and rely on that procedure text
being present from the start.

OpenCode loads skills only on demand. An agent calls the `skill` tool, and per-agent
`permission.skill` patterns can restrict it ([OpenCode skills](https://opencode.ai/docs/skills/)).
Its agent pages document no preload ([OpenCode agents](https://opencode.ai/docs/agents/)).
Copilot in VS Code also loads skills on demand, and its custom-agent frontmatter has no skills
field ([custom agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)).
`PORTING-STUDY.md` §3.1 and §6 flag "specialists skip their procedures" as a risk.

Binding constraints:

- **Size budget (C001-NFR-105):** at most 24,000 characters per skill and 64,000 per agent,
  checked by `PLG-SIZE-001` (`scripts/check/size.mjs`).
- **Procedures in one place (C001-CON-15):** phase procedures exist once, in the phase skills.
- **Generated packages (Q-source-01):** the target packages are generated from
  `plugins/architect/`.
- **Eval bar:** agent-behaviour scenarios pass in at least 9 of 10 runs (constitution, global
  DoD).

The binding case for the size budget is the conductor, which preloads seven skills. Those seven
`SKILL.md` files have about 570 non-empty lines, roughly 46,000–51,000 characters at the
repository's line width. This is an estimate: `PLG-SIZE-001` on the generated output will measure
it. The spec-writer preloads five skills, about 307 lines.

Out of scope:

- the Claude Code target, which keeps native `skills:` preloading;
- the content of the skills;
- the tool-name substitution in the "Claude Code wiring" sections (`PORTING-STUDY.md` §3.3).

## Criteria

| Criterion | Weight |
|---|---|
| Procedure in context from the start | 35% |
| Within skill budgets | 20% |
| Single generated source | 20% |
| Low build effort | 15% |
| Low platform risk | 10% |

- **Procedure in context from the start:** the specialist has its procedure skills before its
  first action, as on Claude Code. This does not depend on the model choosing to load them.
- **Within skill budgets:** the approach meets C001-NFR-105 with margin and avoids paying for
  text an agent rarely uses.
- **Single generated source:** each skill is written once in `plugins/architect/skills/`. Any
  copy is a build output that is checked, never edited (C001-CON-15, Q-source-01).
- **Low build effort:** the generator change, the per-target checks and the eval work are small.
- **Low platform risk:** the approach relies only on documented behaviour of both targets.

## Candidates

- **A — Inline at generation:** for each agent, the generator appends the bodies of the
  skills in its `skills:` field to the generated agent body. Wiring names are substituted and
  `references/` paths are rewritten to the shipped skill folder. `PLG-SIZE-001` runs on the
  generated output.
- **B — Load instruction in the body:** the generated body opens with "Before anything else,
  load the skills X, Y with the skill tool". The skills ship unchanged.
- **C — Hybrid:** procedure and protocol skills are inlined as in A. Large reference catalogues
  get a load instruction at the step that needs them. Each skill's frontmatter records which
  delivery applies to it.
- **D — Host file include:** the generated body references the `SKILL.md` files through a
  platform include (VS Code `#file:` or Markdown links, OpenCode `prompt: "{file:…}"`), so the
  host resolves them at run time.
- **E — Command- or fork-based:** procedures run as commands or forked subtasks: OpenCode
  commands with `agent:`/`subtask`, VS Code prompt files with `agent:`, and the Claude-only
  `context: fork` pattern. A specialist would receive its procedure through the command that
  starts it.

## Scores

| Candidate | Procedure in context from the start | Within skill budgets | Single generated source | Low build effort | Low platform risk | Weighted |
|---|---|---|---|---|---|---|
| A — Inline at generation | 5 | 3 | 5 | 4 | 5 | 4.45 |
| B — Load instruction in the body | 2 | 4 | 5 | 5 | 3 | 3.55 |
| C — Hybrid | 4 | 5 | 5 | 3 | 4 | 4.25 |
| D — Host file include | 3 | 3 | 5 | 3 | 2 | 3.30 |
| E — Command- or fork-based | 3 | 4 | 3 | 2 | 2 | 2.95 |

Justification:

- **A:**
  - *Procedure 5.* The text is in the system prompt, exactly like Claude's preload.
  - *Budget 3.* It meets C001-NFR-105, because the metric counts the same bodies. But the
    conductor's margin is low (estimate above), and reference catalogues are paid on every start.
  - *Source 5.* The copies are generated and checked.
  - *Effort 4.* It is concatenation plus substitution, which the generator needs anyway.
  - *Risk 5.* It uses plain body text on both targets.
- **B:**
  - *Procedure 2.* It depends on the model obeying at the start of every run, and no spike or
    eval shows this. A skipped load means a skipped procedure (`PORTING-STUDY.md` §6).
  - *Budget 4.* The files are small, but loading every listed skill costs the same tokens plus
    tool round-trips.
  - *Source 5.* Skills ship once.
  - *Effort 5.* One generated line per agent.
  - *Risk 3.* The `skill` tool and its permissions differ per target, and VS Code's on-demand
    loading by name is not verified.
- **C:**
  - *Procedure 4.* Procedures are present from the start. Catalogues depend on a load at the
    right step, which is a narrower ask than B.
  - *Budget 5.* It has the lowest start cost and the widest margin.
  - *Source 5.* The delivery choice is one frontmatter field per skill, so each fact lives in one
    place.
  - *Effort 3.* It needs two mechanisms, a classification and eval cases for both.
  - *Risk 4.* Only the on-demand part relies on the `skill` tool.
- **D:**
  - *Procedure 3.* The VS Code page says the body "can reference files", but does not say that
    the content is loaded. OpenCode's `prompt` takes one file and replaces the body, so it
    reduces to A plus an extra file.
  - *Budget 3.* The cost is the same as A.
  - *Source 5.* It references the shipped skills.
  - *Effort 3.* It needs a mechanism per platform.
  - *Risk 2.* The behaviour it depends on is undocumented.
- **E:**
  - *Procedure 3.* Commands can carry the conductor's phase procedures. But specialists are
    started by the agent/task tool, which does not run commands.
  - *Budget 4.* Its context cost is moderate.
  - *Source 3.* It splits procedures into commands and restructures what C001-CON-15 keeps in
    phase skills.
  - *Effort 2.* The delegation flow must be redesigned around C001-REQ-218.
  - *Risk 2.* The command and subtask semantics differ per target, and `context: fork` exists
    only on Claude Code.

## Sensitivity

A leads C by 0.20. The ranking flips in two cases:

- **Weights change.** If "Within skill budgets" rises to 30% and "Procedure in context from the
  start" drops to 25%, A scores 4.25 and C scores 4.35. This is plausible if the Copilot model
  catalogue has smaller context windows, or if per-start token cost becomes a concern.
- **A score change.** If `PLG-SIZE-001` on the generated conductor exceeds 64,000 characters,
  A breaks C001-NFR-105 for that agent. Then C becomes the recommendation, at least for that
  agent.

B is not a realistic winner. With the other weights unchanged, it overtakes A only if procedure
compliance weighs less than about 5%, which contradicts the eval bar.

## Presented

1. A — Inline at generation (Recommended)
2. C — Hybrid
3. B — Load instruction in the body

## Recommendation

**A — Inline at generation.** It reproduces Claude Code's preload exactly, needs no model
cooperation, and stays within C001-NFR-105 on the current estimate.

C's per-skill delivery field is the planned fallback. The generator should support marking a
skill `on-demand`, and should use it only for an agent whose generated output fails
`PLG-SIZE-001`. The skills also ship as normal skills, so the conductor's on-demand use through
the skill tool keeps working. The evals should check on each target that specialists follow
their procedure.

## Rejected

- D — Host file include: it depends on undocumented include behaviour. Where an include is
  documented (OpenCode `prompt`), it reduces to A.
- E — Command- or fork-based: specialists started as subagents do not receive commands, and
  `context: fork` is Claude-only. It would restructure delegation (C001-REQ-218) and procedure
  ownership (C001-CON-15).
