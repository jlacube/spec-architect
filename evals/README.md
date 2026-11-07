# Agent evals

Agent-behaviour scenarios (test level `eval`) run real Claude Code sessions on fixture workspaces
and assert what the agents did: tool calls (AskUserQuestion, Agent, Write, Bash), files and lint
results, never free text alone (test plan §4). Decision record: C001-ADR-007.

## Setup

- Node ≥ 20.11 and the Claude desktop app with Claude Code ≥ 2.1.295 (C001-REQ-1123). Runs use
  the desktop-bundled binary from `CLAUDE_CODE_EXECPATH`, which the app sets in its sessions; set it
  yourself when running from another terminal.
- Install the harness dependency once, without the SDK's own Claude binary:

  ```bash
  cd evals && npm install --omit=optional
  ```

- Runs use your Claude Code login (on disk) and cost real usage. Each session is capped at
  $0.50 (`maxBudgetUsd`) and each invocation at `--max-total-usd` (default $5).

## Two mechanisms

| Mechanism | For | Why |
|---|---|---|
| Agent SDK harness (`harness/run.mjs`) | interview and behaviour scenarios (`evals/cap*/TS-*.eval.mjs`) | answers AskUserQuestion with scripted choices through `canUseTool`, selects the main-thread agent, records the full transcript; headless `claude -p` removes AskUserQuestion (spike S-05) |
| `claude plugin eval` case files (`plugins/<plugin>/evals/<case>/prompt.md` + `graders/*.md`) | routing and delegation suites (C001-REQ-1116) | the standard plugin-eval format with deterministic `tool_used` graders |

Case files run two ways: `harness/plugin-cases.mjs` runs them through the SDK harness with your
on-disk login (deterministic graders only), and `harness/plugin-eval.mjs` runs `claude plugin eval`
itself. The latter needs an authentication variable for its isolated child sessions (for example
a token created with `claude setup-token` and exported as `CLAUDE_CODE_OAUTH_TOKEN`); without one
its runs fail with "Not logged in".

## Writing a scenario

A scenario is an ES module (`evals/cap02/TS-206.eval.mjs`) whose default export holds the fields
below. A Scenario Outline exports an array with one scenario per Examples row
(`evals/cap03/TS-318.eval.mjs`); the runner runs each.

| Field | Meaning |
|---|---|
| `id`, `title` | TS ID (or sample name) and a short title |
| `agent` | main-thread agent, e.g. `architect:sdd-conductor` |
| `plugins` | plugin directories, relative to the repository (default `plugins/architect`), or functions returning a path — `architectWithStubs` (`harness/overlay.mjs`) gives the plugin with haiku stand-ins for specialists not written yet |
| `fixture` | `fx-empty`, `fx-brownfield-ts`, `fx-large`, a directory to copy, or `null` (empty) |
| `prompt` | the user's message (or a function of the workspace root) |
| `answer(question)` | label to answer each AskUserQuestion question (default: the first option, the recommended one) |
| `allowTools` | tools approved without asking; every other permission request is denied |
| `maxTurns`, `maxBudgetUsd`, `model` | run limits (budget capped at $0.50) |
| `assert({ transcript, answers, result, root })` | returns the list of failed checks (empty = pass) |

Assertion helpers are in `harness/assert.mjs`: `toolCalls`, `askUserQuestions`, `writesOutside`,
`firstReply`, `finalReply`, `optionProblems` (C001-TS-207 option format) and `checker`.

## Running

```bash
node evals/harness/run.mjs evals/samples/TS-206-stub.eval.mjs --tier dev
node evals/harness/run.mjs evals/cap02/*.eval.mjs --tier milestone --label m3
node evals/harness/plugin-cases.mjs plugins/architect --label cases
node evals/harness/report.mjs
```

Tiers (C001-ADR-003):

| Tier | When | Runs | Pass rule |
|---|---|---|---|
| dev | task completion | 1 | pass |
| milestone | milestone exit (M-3 … M-6) | 3 | 3 / 3; 2 / 3 triggers a 10-run check |
| release | C001-T-072 | per release class (below) | per release class (below) |

Release classes (C001-ADR-003, revision 2026-10-23, Q-release-tier-01:
`.sdd/001-architect-agent-suite/20-plan/20-decisions/ADR-003-eval-tiers.md`; the floor is the constitution's
DOD-G-01):

| Release class | Applies to | Runs | Pass rule |
|---|---|---|---|
| release-high | the high-risk scenarios of C001-ADR-003 | 10 | ≥ 9 / 10 |
| release-standard | every other eval scenario | 3 | 3 / 3; 2 / 3 triggers a 10-run check needing ≥ 9 / 10 |
| routing suite | the 42 `claude plugin eval` cases (`plugins/architect/evals/`) | 10 per case | ≥ 90% of runs |
| injection suite | the 22 cases of `evals/injection/` | 10 per case | 0 runs act on an injection |

### Release 0.1.0 results

Run 2026-10-28 – 2026-11-07 for C001-T-072, with the cuts P-01 chose (routing and injection at 5 runs per case
where noted). Details, run decisions and the replaced sets: `docs/release-0.1.0-evidence.md` §0 and §4.7.

| Class | Rows | Runs counted | Pass | Result |
|---|---|---|---|---|
| Routing suite (C001-TS-1117) | 42 cases | 350 (28 × 10, 14 × 5) | 350 after re-grade | met (100%) |
| Release-high | 22 rows (6 under rule 1) | 220 | 218 (TS-209 and TS-215 9 / 10, the rest 10 / 10) | met |
| Release-standard | 70 rows (9 under rule 1) | 210 | 210 | met |
| Injection suite (C001-NFR-205) | 22 cases | 110 (5 each) | 0 acted upon | met |

Notional cost 350.95 USD (evidence §4.5).

## Results and metrics

Every run writes a record to `evals/results/<label>-<scenario>-<time>.json`: pass/fail with the
failed checks, cost, tokens by model (exact) and by agent (input and cache exact, output derived),
session, subagent and tool-call timings, tool-call counts. Transcripts go to
`evals/results/transcripts/` and are not committed (they can contain local paths and account
details). `node evals/harness/report.mjs` aggregates the results into
`docs/metrics/eval-metrics.md` (mean, p50, p95, max per scenario and agent, and a release-tier
projection).

Session settings that matter: `settingSources: []` and a fixture workspace keep this repository's
context and memory out of the run; the Claude Code system-prompt preset is required for the
selected agent's instructions to apply.
