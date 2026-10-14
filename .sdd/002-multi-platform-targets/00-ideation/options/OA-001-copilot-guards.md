---
id: C002-OA-001
artifact: ideation/option-analysis
change: CHG-002
phase: 00-ideation
status: draft
title: "Write/shell boundary on Copilot in VS Code"
---

# C002-OA-001 — Write/shell boundary on Copilot in VS Code

## Problem

On Claude Code, the path and bash guards are PreToolUse hooks that act only for Architect
agents, identified by `agent_type` (`docs/spikes/S-04-hooks.md`). They enforce C001-NFR-201,
C001-REQ-1103, C001-REQ-1104, C001-REQ-1106 and C001-REQ-1107, with the corpora in
`tests/guards/` as evidence. In Copilot in VS Code, PreToolUse input has no agent identity. It
carries only `tool_name`, `tool_input`, `tool_use_id` and common fields. Only SubagentStart and
SubagentStop carry `agent_type` ([hooks reference](https://code.visualstudio.com/docs/agents/reference/hooks-reference)).
VS Code also ignores the matchers of Claude-format hooks, so installing today's plugin there
allows everything (`PORTING-STUDY.md` §3.6). P-01 decided that Copilot in VS Code is in scope
(Q-scope-01). P-01 also decided that a target ships only when the write/shell boundary is
enforced as on Claude Code (Q-safety-01). Packages are generated from `plugins/architect/`
(Q-source-01), and the CLI comes from npm or a bundled copy (Q-cli-01).

The constitution sets more constraints. Agents write only inside `.sdd/` (principle 3). Guards
are deterministic (principle 2). The CLI runs as one process per call, with no daemon
(C001-CON-12). Path normalisation stays in `src/io/paths.ts`. This decision must be made now
because it sets the size of the Copilot target and the S-08 spike agenda. A second question
follows from it: should the chosen mechanism also replace the guards on OpenCode and Claude Code?
That answer is in Recommendation. Out of scope: question tools, skill delivery (OA-002), and the
Copilot CLI and cloud agent.

## Criteria

| Criterion | Weight |
|---|---|
| Fail-closed enforcement | 30% |
| Copilot delivered in this change | 20% |
| Low platform risk | 15% |
| Low build effort | 15% |
| Workflow fidelity | 10% |
| Constitution fit | 10% |

- **Fail-closed enforcement:** the mechanism denies 100% of writes outside `.sdd/` and of
  shell commands that are not on the allowlist (C001-NFR-201). It does not open silently when a
  setting, a policy or a Preview feature is off.
- **Copilot delivered in this change:** Copilot in VS Code ships in CHG-002 (Q-scope-01).
- **Low platform risk:** the mechanism depends on documented, non-Preview features and needs
  few spike checks.
- **Low build effort:** little new code, little to maintain, and little new eval work.
- **Workflow fidelity:** agents keep the same tools and procedure text as on Claude Code.
- **Constitution fit:** the mechanism respects the generated single source, the deterministic
  CLI, the no-daemon rule and the dependency rules.

## Candidates

- **A — Agent-scoped hooks:** each generated `.agent.md` has a `hooks` map. Its PreToolUse
  entry runs `sdd guard-path` / `sdd guard-bash` through a Copilot adapter that maps tool names
  and `tool_input` fields. Identity comes from the scope, because the hooks run only while that
  agent is active.
- **B — `sdd` MCP write server:** generated agents get no edit tool and no terminal tool. A
  small local stdio MCP server, bundled next to `sdd.mjs`, is their only way to write or run
  commands. It offers write and edit of a `.sdd/` artifact, checked with the guard's path
  normalisation, and a fixed set of `sdd` subcommands and read-only `git` commands. Each call
  spawns the CLI once. The server checks every call, so it needs no agent identity.
- **C — Tool-list restriction only:** generated agents have no terminal tool but keep the
  generic edit tool. Paths are not checked.
- **D — VS Code extension:** an extension registers language-model tools (write artifact, run
  `sdd`) in the extension host. Agents get only those tools for writing and running commands.
- **E — Defer Copilot:** ship OpenCode only in CHG-002. Copilot waits until VS Code gives hook
  input an agent identity or a later change takes it up.

## Scores

| Candidate | Fail-closed enforcement | Copilot delivered in this change | Low platform risk | Low build effort | Workflow fidelity | Constitution fit | Weighted |
|---|---|---|---|---|---|---|---|
| A — Agent-scoped hooks | 3 | 4 | 2 | 4 | 5 | 5 | 3.60 |
| B — sdd MCP write server | 5 | 4 | 4 | 2 | 2 | 3 | 3.70 |
| C — Tool-list restriction only | 1 | 5 | 5 | 5 | 3 | 1 | 3.20 |
| D — VS Code extension | 5 | 3 | 4 | 1 | 2 | 2 | 3.25 |
| E — Defer Copilot | 3 | 1 | 5 | 5 | 1 | 5 | 3.20 |

Justification:

- **A:**
  - *Enforcement 3.* A deny works through `permissionDecision: "deny"` or exit code 2
    ([hooks reference](https://code.visualstudio.com/docs/agents/reference/hooks-reference)),
    and the existing guard corpora can be replayed through the adapter. But agent-scoped hooks
    need `chat.useHooks` and a trusted workspace, and an organisation can restrict hooks
    ([hooks](https://code.visualstudio.com/docs/copilot/customization/hooks)). When hooks are
    off, the agents keep their edit and terminal tools with no check at all, so the mechanism
    fails open. A liveness heartbeat that the CLI checks could detect this, but only after the
    first unguarded call.
  - *Delivery 4.* Delivery is likely if S-08 passes.
  - *Risk 2.* Agent-scoped hooks are Preview and work only in the Local harness. The custom-agents
    page says they run "whether invoked by the user or as a subagent"
    ([custom agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)),
    but the hooks reference does not cover it. The tool names and `tool_input` of the edit and
    terminal tools are undocumented, so they must be read from the debug logs.
  - *Effort 4.* The guards are reused; only the adapter and the generated hook maps are new.
  - *Fidelity 5.* Agents keep the same tools as on Claude Code.
  - *Fit 5.* The decision stays in the CLI, and no new process is added.
- **B:**
  - *Enforcement 5.* No agent has an edit or terminal tool, so if the server is missing, nothing
    can be written. The server checks every path with C001-REQ-1104 normalisation, and it runs
    no shell, so it does not need to parse compound commands. The `tests/guards/` corpora can be
    replayed against its tools.
  - *Delivery 4.* Delivery is likely, but the server is the largest part of the Copilot target.
  - *Risk 4.* MCP and agent `tools` lists are generally available features. Three points remain
    for S-08: whether a subagent is limited to its own `tools` list (not documented), how to list
    single MCP tools (only `server/*` is documented), and whether every MCP call asks the user
    for approval. A prompt file's `tools` take precedence over the agent's, so generated prompt
    files must set them too.
  - *Effort 2.* The server, its tool schemas, a second body variant for agents ("call the `sdd`
    tool" instead of "use Bash") and new eval cases are all new work.
  - *Fidelity 2.* Agents lose Edit and Bash. The cartographer's read-only `git` commands need
    dedicated tools.
  - *Fit 3.* The server is a long-lived stdio process for each session. The CLI stays one process
    per call, as C001-CON-12 requires, and the suite already runs Serena this way. Still, it is a
    new component. If it uses an MCP SDK, that SDK must be bundled under the licence allowlist.
- **C:**
  - *Enforcement 1.* The generic edit tool can write anywhere. This fails C001-NFR-201 and
    Q-safety-01.
  - *Delivery 5, risk 5, effort 5.* Delivery, risk and effort are all trivial.
  - *Fidelity 3.* Without a terminal, agents cannot run `sdd lint`.
  - *Fit 1.* It breaks principle 3.
- **D:**
  - *Enforcement 5.* It is fail-closed in the same way as B.
  - *Delivery 3.* It is a separate product with Marketplace publishing.
  - *Risk 4.* The language-model tool API is stable.
  - *Effort 1.* It needs a VS Code-only codebase and its own test harness.
  - *Fidelity 2.* Fidelity is the same as B.
  - *Fit 2.* It is not generated from `plugins/architect/` (Q-source-01), and its platform code
    sits outside the generator.
- **E:**
  - *Enforcement 3.* Nothing unsafe ships, but no mechanism exists for later.
  - *Delivery 1.* It contradicts Q-scope-01.
  - *Risk 5, effort 5.* There is nothing to build now.
  - *Fidelity 1.* Copilot users get no workflow.
  - *Fit 5.* It raises no constitution issue.

## Sensitivity

B leads A by 0.10. The ranking flips in two cases:

- **Weights change.** If fail-closed enforcement drops to 25% and workflow fidelity rises to
  15%, A scores 3.70 and B scores 3.55. This is plausible if P-01 reads "same as Claude" as
  "hooks, which can also be switched off on Claude Code", rather than "fail-closed".
- **A spike result.** If S-08 shows that agent-scoped hooks are on by default and cannot be
  disabled without notice, A's enforcement score rises to 4 and A scores 3.90.

Two other spike results would eliminate a candidate instead of reordering them:

- If S-08 shows that agent-scoped PreToolUse does not fire for a custom agent running as a
  subagent, A fails Q-safety-01 and only B remains.
- If S-08 shows that a subagent is not limited to its own `tools` list, B's enforcement falls to
  the conductor's tool list. B stays safe only if the conductor also has no edit or terminal tool,
  which is part of B. If that fails too, E is the fallback.

## Presented

1. B — sdd MCP write server (Recommended)
2. A — Agent-scoped hooks

## Recommendation

**B — `sdd` MCP write server on Copilot in VS Code.** It is the only generated candidate that
fails closed.

Near-tie: B leads A by only 0.10. The tie-breaker is Q-safety-01 together with constitution
principle 3. P-01 asked for an enforced boundary, and A's enforcement disappears without notice
when `chat.useHooks`, Workspace Trust or an organisation policy turns hooks off, while B's
absence of tools cannot be switched back on by a setting. A stays the fallback if S-08 shows
that subagent tool lists are not enforced.

**Uniformity across targets: no.** The enforcement mechanism should differ per target, while
one enforcement core is shared:

- **Claude Code** keeps today's hooks. `agent_type` works (S-04), the guard corpora pass, and
  replacing released guards would cost evals and fidelity for no gain in safety.
- **OpenCode** keeps its native per-agent `permission` blocks. A `tool.execute.before` plugin
  calls `sdd guard-bash` if S-07 shows that compound commands are not split.
- **Shared core:** the path and command decisions live once, in the CLI (`guard-path`,
  `guard-bash` and their normalisation). The Claude hooks, the OpenCode plugin and the MCP server
  all call that core, and every target replays the `tests/guards/` corpora. This gives the
  benefit of uniformity, one decision logic with one evidence set, without the cost.
- **Condition:** if S-07 shows that OpenCode's matcher cannot be made safe, OpenCode uses the
  `sdd` MCP server too. The server will already exist, so the switch is cheap.

## Rejected

- C — Tool-list restriction only: it leaves the edit tool unchecked, which violates
  C001-NFR-201 and Q-safety-01.
- D — VS Code extension: it is fail-closed like B, but it is a separate VS Code-only product,
  not generated from `plugins/architect/` (Q-source-01), and it costs the most effort.
- E — Defer Copilot: it contradicts P-01's scope answer (Q-scope-01). It stays the fallback only
  if S-08 rules out both A and B.
