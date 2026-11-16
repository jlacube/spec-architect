---
id: C001-ADR-007
artifact: plan/adr
change: CHG-001
phase: 20-plan
status: approved
---

# C001-ADR-007 — Agent eval harness: Agent SDK for interviews, plugin-eval case files for routing

## Context and problem

Spike S-05 (D-S05-2) showed that headless Claude Code removes AskUserQuestion, so interview
scenarios cannot run with `claude -p`. C001-T-029 must provide a harness that answers
AskUserQuestion with scripted choices, selects a plugin agent as the main thread, records tokens
and timings per agent and model (C001-ADR-003), and also serves the routing suite of
C001-REQ-1116, which is specified as a `claude plugin eval` suite.

## Considered options

1. **Agent SDK (`@anthropic-ai/claude-agent-sdk`)** — `canUseTool` receives AskUserQuestion and
   returns `answers`; `agent` selects the main-thread agent; `plugins` loads the plugin; the message
   stream carries usage per request, subagent task events and the session result.
2. **Pseudo-terminal driving interactive Claude Code** — answers by sending keystrokes to the TUI;
   needs a native PTY module (build tools on Windows) and screen parsing that breaks with UI changes.
3. **`claude plugin eval` only** — the standard plugin-eval runner; has no scripted answers for
   AskUserQuestion and runs its children in an isolated environment.

## Decision outcome

Option 1 for scenarios, with the `claude plugin eval` case format kept for the routing suite
(recommended in C001-T-029 and accepted by P-01's standing instruction to follow the
recommendations for M-3, 2026-10-11):

- `evals/harness/` runs scenarios through the Agent SDK with the desktop-bundled Claude Code
  (`pathToClaudeCodeExecutable` = `CLAUDE_CODE_EXECPATH`, ≥ 2.1.295), the parent's CLAUDE…/ANTHROPIC…
  variables removed, `settingSources: []`, a fresh fixture copy per run, and the Claude Code
  system-prompt preset (without it the selected agent's instructions are not applied).
- Routing cases are `claude plugin eval` case files; `evals/harness/plugin-cases.mjs` runs them
  through the SDK harness with deterministic graders, and `evals/harness/plugin-eval.mjs` runs
  `claude plugin eval` when an authentication variable is available for its isolated children.
- The SDK is installed in `evals/` with `--omit=optional` (P-01, 2026-10-11: no bundled binary), as
  a development tool only; it is not part of the shipped plugin (C001-CON-05 unaffected).
- Budget: $0.50 per session, $5 per task unless P-01 agrees otherwise (P-01, 2026-10-11).

Demonstrated in C001-T-029: a stub interviewer asked 9 prepared questions in rounds of at most four,
each answered with a scripted choice, passing in the dev (1/1), milestone (3/3) and release
(10/10) tiers; a stub delegator's subagent metrics; a routing case graded by `tool_used: Agent`.

## Consequences

- Subagents launched by the Agent tool run in the background; a session can emit several result
  messages, and assertions read the last one.
- Per-agent output tokens are derived (subagent `task_notification` totals minus their input and
  cache tokens; the main thread gets the remainder of its model's output); per-model figures are
  exact. Both are recorded in every run.
- Transcripts are kept out of the repository; result records with metrics are committed.
- Affects: C001-COMP-12; C001-T-031 … C001-T-039 and C001-T-063 write their evals on this harness;
  test plan §4.
