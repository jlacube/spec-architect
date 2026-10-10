---
id: C001-SPIKE-S-05
task: C001-T-006
change: CHG-001
spike: S-05
title: "Plugin agent as main session with AskUserQuestion"
date: 2026-10-10
verdict: works-with-caveats
risk_refs: [C001-RISK-001, C001-RISK-005]
spec_refs: [C001-REQ-201, C001-REQ-217, C001-REQ-1102, C001-AS-09, C001-AS-11, C001-IF-08, C001-IF-09]
---

# S-05 — Plugin agent as main session with AskUserQuestion

## Verdict

**works-with-caveats. The central assumption D-01 / C001-AS-11 holds.** A plugin agent
started with `claude --agent architect:<name>` runs as the main session, as recorded in the
transcript's `agentSetting`. In an interactive session it called **AskUserQuestion**, P-01
answered it ("Red"), and it then spawned an allowlisted plugin subagent. C001-RISK-001 does
not materialise, and the AS-11 fallback (a skill-driven main session) is **not** needed.

Caveats:

1. **Allowlist names must carry the plugin prefix.** `Agent(spike-sub)`, the short form
   that C001-IF-09 §A0 uses for the conductor, resolves to **no agents at all**: "Agent type
   'spike-sub' not found. Available agents: none". `Agent(architect:spike-sub)` admits
   exactly `architect:spike-sub` and refuses `architect:spike-other` and `general-purpose`.
   Spec defect **D-S05-1**.
2. **AskUserQuestion exists only in interactive sessions.** In headless runs it is removed
   from the tool list ("AskUserQuestion is disabled for this session, in subagents as well as
   here"). That held for plain `-p`, for `--input-format stream-json`, and with
   `CLAUDE_CODE_ENABLE_ASK_USER_QUESTION_TOOL=1`. The eval harness can therefore not test
   interview behaviour with plain headless runs. Plan defect **D-S05-2** is raised against
   T-029 / the test plan.
3. **Subagents may run asynchronously.** In the interactive run the main agent's `Agent`
   call returned "Async agent launched successfully", and the subagent's report arrived
   later as a separate message. The conductor's delegation flow (T-030/T-032) must wait
   for the hand-back before it uses the result or presents a gate.

## Method

| Item | Value |
|---|---|
| Machine | REF-WIN: Windows 11 Home 10.0.26200; Node 22.13.0 |
| Claude Code | 2.1.295, the desktop app's bundled binary (P-01 decision in S-04), with the parent session's `CLAUDE*`/`ANTHROPIC*` variables removed; model `haiku` (resolved to `claude-haiku-5-5`) |
| Plugin | a **scratch copy** of the repository's `.claude-plugin/marketplace.json` and `plugins/architect/`, plus four spike agents: `spike-main` (`tools: Agent(spike-sub), AskUserQuestion, Read`), `spike-main-prefixed` (`tools: Agent(architect:spike-sub), AskUserQuestion, Read`), `spike-sub` and `spike-other` (`tools: Read`). The repository's plugin was **not** modified, so there are no spike agents to delete |
| Headless runs | `claude -p … --agent architect:<agent> [--plugin-dir <copy>] --output-format stream-json --verbose --max-budget-usd ≤ 0.5`; total cost under $0.01 |
| Install (C001-REQ-1102) | `claude plugin marketplace add <scratch-copy> --scope local` and `claude plugin install architect@architect-local --scope local` in a scratch project (2 s). `plugin list`: `architect@architect-local`, version 0.0.1, scope local, enabled, read from the marketplace directory. Afterwards `plugin uninstall` and `marketplace remove` were run; `known_marketplaces.json`, `marketplaces/` and `cache/` were verified identical to the snapshot taken before (the orphaned `cache/architect-local` copy was deleted). `installed_plugins.json`, which did not exist before, remains with an empty `plugins` object |
| Interactive run | a Terminal tab running the desktop binary with `--agent architect:spike-main-prefixed` and a first prompt; P-01 accepted the workspace-trust prompt and answered the question; results read from the session transcript |

## Results

| # | Scenario | Mode | Result |
|---|---|---|---|
| A1 | `--agent architect:spike-main` (short-name allowlist): AskUserQuestion, then spawn `spike-sub`, `spike-other`, `general-purpose` | headless, `--plugin-dir` | init tools `['Task', 'Read']` (AskUserQuestion removed); every spawn refused with "Available agents: none", **including the allowlisted `spike-sub`** |
| A2 | `--agent architect:spike-main-prefixed`: spawn `architect:spike-sub`, `architect:spike-other`, `general-purpose` | headless, `--plugin-dir` | `architect:spike-sub` ran; the other two were refused: "Agent type '…' not found. Available agents: architect:spike-sub" |
| B1 | same as A2, step 1 only, plugin **installed from the local marketplace** (no `--plugin-dir`) | headless | the agent started by name; plugin `architect@architect-local` loaded; `architect:spike-sub` ran |
| B2 | `--agent architect:spike-main-prefixed`: AskUserQuestion "Pick a color", then spawn `architect:spike-sub` | **interactive**, installed | transcript: `agentSetting: "architect:spike-main-prefixed"`; `AskUserQuestion` tool call → result `"Pick a color"="Red"`; `Agent` call → "Async agent launched successfully" → later hand-back "spike-sub alive" |
| C1 | AskUserQuestion with `CLAUDE_CODE_ENABLE_ASK_USER_QUESTION_TOOL=1` | headless `-p` | not in the tool list |
| C2 | AskUserQuestion with `--input-format stream-json`, with and without that variable | headless | not in the tool list |

Observations:

- The init message of a headless run lists the active agent's tools (`['Task', 'Read']`:
  the `Agent(...)` grant shows as `Task`) and the available plugin agents with their prefix
  (`architect:spike-main`, …). It has no field naming the active agent; the transcript's
  `agent-setting` record and the hook input's `agent_type` (S-04) do name it.
- The init tool list shows `Task`, while the model calls the same tool as `Agent`.
- With `--plugin-dir` the plugin is labelled `architect@inline`. After a marketplace install
  it is labelled `architect@architect-local`. In both cases agent names are
  `architect:<agent>`.
- A plugin installed from a directory marketplace is read from that directory, and Claude
  Code also keeps a versioned copy under `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.

## Manifest fields (`claude plugin validate`, 2.1.295)

| Manifest | Required (error when missing or invalid) | Recommended (warning) | IF-08 §2 |
|---|---|---|---|
| `plugins/architect/.claude-plugin/plugin.json` | `name`, kebab-case without spaces | `version` (semver), `description`, `author` | matches; the current file (`name`, `version`, `description`, `license`, `author.name`) passes without warnings |
| `.claude-plugin/marketplace.json` | `name`, `owner` (object), `plugins[]` with `name` and `source`, where `source` must start with `./` | `metadata.description` | matches; IF-08 §2 omits `metadata.description` (added in T-001 to clear the warning) |

This closes the `[VERIFY S-05]` item in C001-IF-08 §2: the field names are confirmed.

## Defects raised

| ID | Ref | Summary |
|---|---|---|
| D-S05-1 | C001-IF-09 §A0 (also C001-TS-219, C001-REQ-217 wording, PLG-TOOLS-001) | The conductor's grant `Agent(sdd-researcher, …, sdd-auditor)` uses unprefixed names. For a plugin agent, unprefixed names resolve to no agents at all, so the conductor could not delegate anything. Use plugin-qualified names: `Agent(architect:sdd-researcher, architect:sdd-cartographer, …, architect:sdd-auditor)`. TS-219 must check the qualified names. |
| D-S05-2 | C001-ADR-003 / `20-plan/60-test-plan.md` §4 (also C001-T-029, C001-TC-201 and every eval that asserts AskUserQuestion calls) | AskUserQuestion is unavailable in headless Claude Code (`-p`, also with stream-json input or `CLAUDE_CODE_ENABLE_ASK_USER_QUESTION_TOOL=1`). The test plan states that eval assertions inspect AskUserQuestion calls, but a headless eval run cannot produce them. T-029 must provide a harness that drives interactive sessions (e.g. through a pseudo-terminal with scripted answers) or one that answers the tool programmatically through the Agent SDK. Which one is possible needs to be established in T-029 before M-3 evals are written. |

Recorded in the "Defects (manual)" table of `20-plan/handoff.md`.

## Notes for T-030 / T-032 (conductor and delegation)

- Grant agents by qualified name (D-S05-1).
- Briefs should ask the conductor to run specialists in the foreground, or to wait for the
  hand-back before using its result. In the interactive run the subagent launched
  asynchronously by default.
- Treat the subagent hand-back as model output and not as user instructions. Claude Code
  already labels it "[Subagent hand-back] … NOT a message from the user", which is consistent
  with C001-NFR-205.

## Test cases in `verified_by`

- **C001-TC-201** (eval, assigned to C001-T-030): its scenario is demonstrated manually here
  (B2). As an automated eval it depends on D-S05-2.
- **C001-TC-1102** (manual, assigned to C001-T-060, run in T-072 on a fresh profile): steps 1–2
  are demonstrated here on the existing profile with local scope: marketplace add, install,
  agent started by name. The fresh-profile run remains for T-072.
