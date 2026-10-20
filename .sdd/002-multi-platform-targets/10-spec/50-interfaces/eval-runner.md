---
id: C002-IF-010
artifact: spec/interface
kind: conventions
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-010 — Eval runner contract

The eval cases under `evals/` call `runSession` of `evals/harness/session.mjs` (current-state E-9).
CHG-002 keeps that call and its options, and puts the host behind it: a runner per host
(C002-COMP-009). No case file of CHG-001 changes (C002-REQ-608); the case files that CHG-002 adds
use the case fields of §2.1. Revised for defect D-015 (findings of C002-T-044 and C002-T-046): the
names a case reads (§3), the `answer` option (§2), the selection of rows per host (§1), the
OpenRouter key file with isolated data folders (§4), what `allowTools` gates (§2) and the direct
relay on OpenCode (§2). Revised for defect D-019 (findings of C002-T-045 on Copilot CLI 1.0.98): the
session agent's model passed with `--model` (P-01 answer to Q-cli-model-01), prompt files in prompt
mode, the runner's further Copilot CLI options, workspace hooks in prompt mode and the subagent names
(§2, §3, §4). Revised for defect D-020 (findings of C002-T-056 on OpenCode 1.18.31): the spend-cap
rule and the caps above 0.50 USD that P-01 approved (§2.2; P-01 answer to Q-ts634-budget-01), the
dot-folder limit of OpenCode's `glob` (§4) and the PATH lead of the pinned host binary (§4). After
the critic's D-018 … D-020 review: the spend cap checked per step only where the host reports step
costs, per session on Copilot CLI (CR-64); the result field `caps` (CR-65); the cap exception matched
by row ID, case file and host, the run limit checked by the owning task, and capped sessions that a
later exception raised counted as no runs (CR-68; P-01 answer to Q-capped-runs-01). Revised for
defect D-022 (findings of C002-T-056): the cap exception of C002-TS-634 on OpenCode raised to
2.00 USD for one further run without a rerun (P-01 answer to Q-ts634-budget-02), the overshoot of
the per-step spend cap bounded by the steps running when the cap is reached, with no fixed
allowance, the reserve of the stop rule for a cap-exception session (§2.2), and the SDK client's
requests without a headers timeout (§4). After the critic's D-021 … D-022 review: the waiver of
C002-TS-634 on OpenCode limited to a session that the spend cap or a host or provider error ends
before the second gate question, recorded by P-01 at the G2 of that revision (CR-70, CR-71; P-01
answer to Q-ts634-waiver-01); the `cap` and `step-after-cap` records from which the overshoot bound
is decided, and the reserve of a cap-exception session as a formula (CR-72); a step whose cost the
host does not report making the session's spend `partial` (CR-73); the session timeout of
20 minutes (CR-74).

## §1 Selection

`npm run eval -- --host claude-code|opencode|copilot-cli` (default `claude-code`, the existing
behaviour; `node evals/harness/run.mjs … --host …` alike). The host is passed to `runSession` through
the harness context (else the variable `EVAL_HOST`); a case never sets the host a session runs on.

**Rows for one host** (revised for defect D-015 items 3 and 7). A case row may carry a `host` field
(`claude-code`, `opencode` or `copilot-cli`): the row then runs only under that `--host`, and its
session result uses that host's own names (§3). A row without a `host` field runs under every
`--host`. A case file that holds one row per host (the CHG-002 doctor, gate, generator and
question-tool cases, C002-T-037, C002-T-038) gives every row its `host` field, the Claude Code rows
included; a run may also keep rows by ID with `--only <id>,…`. Without either, a Claude Code row of
such a file would also run under `--host opencode`. Rows for one host live in the case files of their
scenario, under `evals/targets/<area>/`; there is no case folder per host (no
`evals/targets/opencode-host/` and no `evals/targets/copilot-cli/`; revised for defect D-019 item 3).
A selection that leaves no row for the host ends the run before any session, with exit code 1.

## §2 `runSession` options (unchanged names)

| Option | Meaning on the generated targets |
|---|---|
| `agent` | Architect agent name. OpenCode: the runner removes the `architect:` prefix. Copilot CLI: the runner passes `--agent architect:<agent>`, the `<plugin>:<agent>` form Copilot CLI requires (a bare name fails; `docs/spikes/S-08-copilot-vscode.md §2.3`, fact F-6), `architect` being the package's plugin name (C002-IF-005 §3), so a case's `architect:` name is passed unchanged, and `--model` with the model of that agent (row `model`) |
| `model` | as today on Claude Code: the model of the session, when the case gives one. OpenCode: a value `<provider>/<model>` selects the session's model; without it the agent's own `model` of the package applies. Copilot CLI (revised for defect D-019 item 1; P-01 answer to Q-cli-model-01, "Pass --model (Recommended)"): the runner always passes `--model <model>`, `<model>` being the case's value when given, else the `model` field of the session agent's file in the package copy (`agents/<agent>.agent.md`; for the conductor `claude-opus-5.5`, the table's model of its tier, C002-IF-001 §2). Copilot CLI 1.0.98 runs the session agent that `--agent` names on its default model (`claude-sonnet-5.5`), not on the `model` of that agent's file, while the subagents it starts run on the models of their own files (C002-T-045); without `--model` the conductor would run a tier below its own. The session result's `models` lists the models of the steps, so a row can check the conductor's model |
| `prompt`, `cwd` | as today. OpenCode: a prompt `/architect:<name> <arguments>` or `/architect-<name> <arguments>` runs the package command `architect-<name>` with those arguments. Copilot CLI (revised for defect D-019 item 2): a prompt `/<name> <arguments>`, `/architect:<name> <arguments>` or `/architect-<name> <arguments>` for which the package copy holds `prompts/<name>.prompt.md` runs that prompt file's body, its frontmatter removed, as the prompt of the session agent, followed by a blank line and `Arguments: <arguments>` when arguments are given; the transcript holds a harness record with `event: "prompt-file"` naming the file. Copilot CLI 1.0.98 sends slash text given with `-p` to the model unexpanded (it registers the prompt files as skills named `architect:<name>.prompt`), so a prompt file runs only this way; any other prompt is passed as it is. The eval relay (`agent` `architect:eval-dispatcher`, prompt `Dispatch: <agent>` followed by a brief) has no OpenCode or Copilot CLI counterpart: the runner starts `<agent>` (OpenCode: prefix removed; Copilot CLI: `architect:<agent>`) as the session's agent with the brief as its prompt, and the transcript holds a harness record with `event: "relay"` naming that agent. The relay is therefore `direct` on both (revised for defect D-015 item 6) |
| `answer` | the case's answer function `answer(question, call)`, called once per question of a question-tool call (revised for defect D-015 item 2: the earlier name `answers` was wrong; `answers` is a field of the session result, §3). It returns the label to choose, an array of labels, or, on OpenCode, `{ reject: true }`, which dismisses the whole call. Default: the label of the first option, which the interview protocol marks "(Recommended)". `question` and `call` are given in the names the row reads (§3). On OpenCode, a return value that is none of these (nothing, an empty string, an exception) leaves the call unanswerable (§4). Used where the host lets a script answer (C002-REQ-610) |
| `allowTools` | Claude Code tool names. They gate only the permission requests of the host (revised for defect D-015 item 5). OpenCode: the runner answers a permission request `once` when its permission maps to a tool of `allowTools` (through the target's mapping table, C002-IF-001; `edit` for Write, Edit, MultiEdit and NotebookEdit, `bash` for Bash and PowerShell, `task` for Agent) and rejects every other request; it answers the read-only permissions (`read`, `glob`, `grep`, `list`, `lsp`, `todowrite`, `todoread`, `codesearch`) and `question` with `once`, and rejects `external_directory` and `doom_loop`. Copilot CLI (revised for defect D-019 item 6): the runner maps each tool of `allowTools` through the table's grants of the package's mode and passes one `--allow-tool=<permission>` per resulting permission, each once, in sorted order: a grant `<server>/*` gives `<server>`, the grant `edit` gives `write`, the grant `execute` gives `shell`, and a source MCP name `mcp__plugin_architect_<server>__<tool>` gives `<server>(<tool>)`; read-only tools need no permission. A tool that the host runs without asking, because the package's own rules allow it (for example the sdd MCP server tools that an Architect agent is granted), is not gated by `allowTools`: the package decides it, as it does for an adopter |
| `maxTurns` | default 30 (C002-NFR-105) |
| `maxBudgetUsd` | default 0.50; at most 0.50 unless §2.2 lists the row; applied when the host reports spend, else recorded as `unreported` (C002-NFR-105 open item); checked by the spend-cap rule of §2.2 |
| `env` | variables of the host process (for example a machine configuration of a doctor case); a `PATH` given here replaces the runner's own `PATH` for the host, with the PATH lead of the pinned OpenCode binary placed into it on OpenCode (§4) |

### §2.1 Case fields of the generated-target runners

Fields of a case row that the generated-target runners read beside the options (C002-T-038,
C002-T-044); the Claude Code runner ignores them.

| Field | Meaning |
|---|---|
| `host` | the host the row is for (§1); selects the names of §3 |
| `targetPackage` | `{ target, mode?, tested_versions?, version? }`: the package generated for the session. `mode` is an enforcement mode (`--mode <target>=<mode>`, C002-IF-004); `tested_versions` replaces the table's `host.tested_versions` in a copy of the source plugin; `version` is the package version: the package is generated from a copy of the source plugin whose `.claude-plugin/plugin.json` gives this version, so that the wiring token `{{package_version}}` and the manifest's `package_version` both carry it (C002-IF-004 §Output; the fixture of C002-TS-515) |
| `mcpOverrides` | `{ <server>: <url> }`: the URL of a remote MCP server replaced in the generated configuration (the unreachable-DeepWiki row of C002-TS-509 on OpenCode) |

### §2.2 Spend cap

**Spend-cap rule** (revised for defect D-020 item 3 and for critic CR-64). No runner checks the spend
cap before a step: no host reports the cost of a step before the step has run, so a pre-step
estimate would be a guess the runner cannot check. What the runner checks depends on what its host
reports:

- **Per step**, on a runner whose host reports the cost of each step (OpenCode, at the step's end):
  the runner checks the cap after each step. The **capping step** is the step whose finish brings
  the sum of the costs of the finished steps, the session's and its subagents', to `maxBudgetUsd` or
  above; it is the last step the session starts. The **steps running when the cap is reached** are
  the capping step and every other step of the session or of its subagents that had started but not
  finished when the runner received the capping step's finish. Each of them counts with the cost
  that the host reports for it, in full, the cost of a running step that the abort ends included.
  A step whose cost the host does not report (a step that the abort ends before its step-finish, or
  a step-finish without a cost) never counts as zero: the session's `spend` reads `partial` (§3),
  and the ledger books the session by the test plan's rule for a `partial` spend until it is
  reconciled with OpenRouter's usage view (cap records below; revised for critic CR-73). The
  per-step metric of C002-NFR-105 (steps started after the capping step) is decided on these
  runners only, from the cap records of the session.
- **Per session**, on Copilot CLI, whose host reports the AI Credits of the whole session only: the
  cap is the host's own limit `--max-ai-credits`, which the host applies to its own count of the
  session's credits, and the runner checks the session total that the usage file gives after the
  session; a session whose measured credits reached the limit ends with `spend cap`. No step's cost
  is known there, so the per-step metric does not apply: the measure is the session total against
  the limit.

**Overshoot rule** (revised for defect D-022 item 2). The overshoot of a session that ends with
`spend cap` is its recorded spend minus its cap. On a per-step runner it is at most the sum of the
costs of the steps running when the cap is reached, and no fixed allowance applies: no amount is
added to the cap, and none is accepted on top of it. Since the spend before the capping step is
below the cap, the bound holds whenever no step starts after the capping step; a step that starts
later breaches the per-step metric of C002-NFR-105, and its cost is recorded too. Why no fixed
allowance: the cost of one step grows with the context it sends and the cache it writes (a
subagent's first step writes its whole context), so no fixed amount bounds it; the 0.05 USD
allowance of the earlier test plan held at a 0.50 USD cap (0.511 and 0.525 USD in C002-T-056) and
failed at a 1.00 USD cap (1.114 USD, a session ended during the critic's re-review in C002-T-056).
The runner honours the rule by aborting the session as soon as it receives the capping step's
finish, by counting every cost the host reports, the costs reported after the abort included, and
by adding no allowance in the cap check; no grader, ledger check or stop rule adds one either. The
bound is verified where the per-step metric is, by the runner tests with the stub host
(C002-TS-677, a parallel subagent step included); on a paid session it is decided after the
session from the cap records.

**Cap records** (revised for critic CR-72). A per-step runner writes these harness records into the
transcript (§3):

- `{ "event": "cap", "reason", "step_usd", "usage" }`, once per session, for the step whose finish
  reached a cap: `reason` `spend cap` (the capping step) or `turn cap`; `step_usd` the cost that the
  step's finish gives, `null` when it gives none; `usage` the session's `{ turns, usd }` with that
  cost counted, that is the session's spend at the cap.
- `{ "event": "step-after-cap", "step_usd", "agent", "started_before_cap" }`, one per step of the
  session or of its subagents that finishes after the `cap` record, and one per step that had
  started and has no finish when the session ends (the abort ended it; `step_usd` `null`):
  `step_usd` the cost that the step's finish gives, `null` when it gives none; `agent` the agent
  that ran the step, in the names of the row (§3); `started_before_cap` `true` when the runner
  received the step's start (its `step-start` part) before the capping step's finish, else `false`.

The overshoot bound holds for a session that ended with `spend cap` when every `step-after-cap`
record gives `started_before_cap` `true`, neither the `cap` record nor any `step-after-cap` record
gives `step_usd` `null`, and the session's `usage.usd` equals the `cap` record's `usage.usd` plus the
`step_usd` of every `step-after-cap` record; the overshoot (`usage.usd` minus `caps.usd`) is then at
most the `cap` record's `step_usd` plus those `step_usd`. A record with `started_before_cap`
`false` breaches the per-step metric of C002-NFR-105. A `step_usd` `null` leaves the bound
undecided: the session's `spend` reads `partial` (§3), its `usage.usd` is a lower bound of its
cost, and the ledger books the session by the test plan's rule for a `partial` spend
(`20-plan/60-test-plan.md` §4.1 Ledger) until the entry is reconciled with the session's cost in
OpenRouter's usage view; the generations listed there for the session give the missing `step_usd`,
from which the bound is then decided. The Copilot CLI runner writes `cap` records with `reason` and
either the session's `usage`, the host's limit text (`host_text`) or the measured credits against
the limit (`ai_credits`, `limit`), and no `step-after-cap` record: no step's cost is known there.

Per runner:

| Runner | Check | Overshoot |
|---|---|---|
| OpenCode | per step: the runner adds the cost of every finished step, of the session and of its subagents, as the step-finish event gives it, and compares the sum with the cap after each step; when the sum reaches the cap it aborts the session at once (`end_reason` `spend cap`) | at most the costs of the steps running when the cap is reached: the capping step, plus a subagent's step that ran in parallel and reported its cost before the abort took effect; no fixed allowance (overshoot rule above) |
| Copilot CLI | per session: the host's own limit `--max-ai-credits <n>`, with `<n>` = the larger of 30 and `maxBudgetUsd` / 0.01 rounded to a whole number (1 AI Credit = 0.01 USD; Copilot CLI 1.0.98 accepts no limit below 30 credits, so a cap below 0.30 USD is applied as 0.30 USD); the host refuses the next model call once the session's credits reached the limit (a soft cap), and the runner reads the session's credits from `--usage-output-file` after the session: a session whose measured credits reached the limit ends with `spend cap` even when the host printed no limit text | the model call that reached the limit; the usage file gives the session total only, never a step's cost, so `usage.usd` is that total |
| Claude Code | the Agent SDK's `maxBudgetUsd`, as today (test plan §4.1 rule 1) | the turn that reached it |

The pools of the test plan (`20-plan/60-test-plan.md` §4), not the per-session cap, bound what a run
of many sessions may spend.

**Caps above 0.50 USD** (revised for defect D-020 item 2; P-01 answer to Q-ts634-budget-01, "Budget
exception $1"; raised for defect D-022 item 1, P-01 answer to Q-ts634-budget-02, "One run at $2
(Recommended)"). A case row sets `maxBudgetUsd` above 0.50 only where P-01 approved an exception for
that row and host; the exceptions in force are the rows of this table. The harness checks it before
any session (revised for critic CR-68): a selected row that sets `maxBudgetUsd` above 0.50 runs only
when an exception of this table matches all three of its row ID (the row's `id`), its case file (the
repository-relative path with `/` separators of the file that defines the row) and the run's
`--host`, with a cap at least the row's value. Otherwise the run ends before any session, with exit
code 1 and the row's ID and case file in the message. Because the case file is part of the match, a
row of the same ID in another case file gets no exception from this table; row IDs need not be unique
across case files. The harness then passes the row's `maxBudgetUsd` unchanged to `runSession`, and
the result records it (`caps`, §3).

| Row | Host | Cap per session | Runs | Approved |
|---|---|---|---|---|
| `TS-634` (`evals/targets/gate/TS-634.eval.mjs`, C002-TS-634) | `opencode` | 2.00 USD | one further run at 2.00 USD and no rerun; no further session of the row runs at any cap. A failure of that run is waived only when it is of the kind that the waiver below names; any other failure is a defect that is not waived | P-01, Q-ts634-budget-01 (2026-10-20, 1.00 USD): the gate rework between the two gate questions does not fit 0.50 USD on OpenCode; raised by P-01, Q-ts634-budget-02 (2026-10-20): at 1.00 USD the rerun ended by the cap during the critic's re-review, at 1.11 USD (C002-T-056) |

**Runs** (revised for critic CR-68 and for P-01's answer to Q-capped-runs-01, "Don't count them").
The Runs column counts the sessions of the row that are runs by the ledger rule of the test plan
(`20-plan/60-test-plan.md` §4.1, `valid_run`). A session of the row that ended with `spend cap`
under a cap below the one that an exception of this table later approved for the row and host is no
run: the ledger records it with `valid_run: false` and its cost, which counts toward its pool. The
harness does not count runs; the done-check of the task that runs the exception row checks the run
limit (C002-T-056 for C002-TS-634). For C002-TS-634 the limit is the one session at 2.00 USD: the
sessions of C002-T-056 at 0.50 and 1.00 USD do not count toward it, and after it no session of the
row runs, whatever its result (P-01 answer to Q-ts634-budget-02).

**Waiver of C002-TS-634 on OpenCode** (revised for critics CR-70 and CR-71; P-01 answer to
Q-ts634-waiver-01, "Cap-only waiver (Recommended)"). The waiver covers one failure kind of the
session at 2.00 USD (C002-T-056 rerun plan X3, its result record giving `caps.usd` 2.00), and only
when all of these hold:

1. the session ends with `end_reason` `spend cap`, or with `error` whose `error` text is the host's
   or the provider's (for example an OpenRouter refusal, §3), not an error of the harness and not
   the session timeout (§4);
2. it ends before the transcript shows the second gate G2 question (the third Then line of
   C002-TS-634);
3. the first two Then lines of C002-TS-634 are met: one `sdd gate record 002 10-spec --decision
   revise` command with the scripted words as its note, and no `sdd gate approve` command in the
   same turn;
4. no step started after the cap: every `step-after-cap` record of the session gives
   `started_before_cap` `true` (cap records above); a session ended with `error` before any cap has
   no such record and meets this condition.

Any other failure of that session is not waived, for example a `gate approve` after the Revise, a
missing gate record or one with other words, a step started after the cap, an end by `turn cap`,
`question unanswerable`, the session timeout or a harness error, or a second gate question with
other options. Such a failure is a defect of CHG-002: it reopens the task that owns the failing
behaviour (the package's, or the harness's when the harness ended the session) and holds the
OpenCode release (test plan §6 "Exit (release, per target)") until P-01 decides how the row is
verified after the fix, since the run limit above allows no further session. P-01 records the
waiver at the G2 of revision D-021 … D-022, decision "Approve with waivers", item C002-TS-634
(OpenCode), conditional on this failure kind; the done-check of C002-T-056 decides from the result
record and the cap records whether a failure of the X3 session is of this kind.

**Reserve of a cap-exception session** (revised for defect D-022 item 3 and for critic CR-72).
Before each paid session, `evals/harness/run.mjs` checks the stop rule of the test plan
(`20-plan/60-test-plan.md` §4.1, rule 1, and rule 8, which takes H as rule 1 does): the session
starts only if the pool's total T plus the reserve H stays within the pool's limit. For an ordinary
session, one not of a row that an exception of this table matches, H is the larger of 0.65 USD and
the highest cost of the ordinary sessions seen so far; the sessions of a cap-exception row are left
out of that highest cost, since their cost measures the exception (rule 1, by the ledger field
`caps_usd`). For a session of a row that an exception of this table matches:

H = exception cap + max(0.65 USD, highest ordinary session cost)

`run.mjs` takes the cap from the exception that matched the row (this table), not from the largest
ledger entry, and the second term, the H of an ordinary session, stands for the overshoot bound:
the overshoot is the cost of the steps running when the cap is reached (overshoot rule above) and
is known only after those steps end. For C002-TS-634 this gives the 2.65 USD of test plan §4.1
rule 1 (2.00 USD plus 0.65 USD). No fixed allowance applies (the 0.05 USD of the earlier test
plan, 1.05 USD for C002-TS-634, no longer does).

## §3 Session result

Each runner returns the shape the graders read today (`transcript`, `answers`, `result`, `wallMs`).

**Names** (revised for defect D-015 item 1). A row whose `host` field names the session's host (§1)
reads that host's own names and inputs: a tool call by the host's tool name with the host's input
(OpenCode: `question`, `edit`, `sdd-shell_run_command`, …), a started agent by the host's agent name
(OpenCode: `sdd-critic`), a question call as the host's question tool with the host's questions.
Every other row reads the source names, mapped back through the target's mapping table: an agent
start is reported as `architect:<agent>`, a tool call by its Claude Code tool name with Claude Code
input keys beside the host's (for example `sdd-files_write_file` or `sdd-files-write_file` →
`Write` with `file_path`), a question-tool call as AskUserQuestion with the host's answer or `null`
for a skipped or dismissed call; a host tool that the table does not map keeps its host name. Every
tool call also carries `host_tool`, the host's own name. The result's `answers` list holds each
answered call with its questions and the answers given, and on OpenCode the reply route
(`question.reply`, or `question.reject` for a dismissed call).

**Agent names on Copilot CLI** (revised for defect D-019 item 7). Copilot CLI 1.0.98 reports a
subagent it starts by its bare name (`sdd-cartographer` in the `subagent.started` event), although
its command line and the hook input of S-08 use `architect:sdd-cartographer` (S-08 §2.3). In every
row, whatever its `host` field, the runner reports a started Architect agent, and the agent that made
a tool call, as `architect:<agent>`, the form of the Copilot CLI command line, and keeps the host's own
name in `host_agent`; an agent that is none of the ten Architect agents (a host built-in agent such as
`general-purpose`) keeps the host's name in both. Tool names follow the row's `host` field as above.

Added fields:

| Field | Value |
|---|---|
| `target` | `claude-code`, `opencode` or `copilot` (C002-TS-611, C002-TS-612, C002-TS-615) |
| `host_versions` | versions read at session start (C002-IF-009, release evidence); on OpenCode the version of the pinned host binary (§4) |
| `end_reason` | `completed`, `turn cap`, `spend cap`, `question unanswerable`, `error` (C002-TS-614); `error` also when the provider refuses a step of the session, for example an OpenRouter error with HTTP status 402 stored on an assistant message, and when the session timeout of §4 ends the session |
| `usage` | `{ "turns": n, "usd": number or null }` |
| `caps` | `{ "turns": n, "usd": number }`: the caps the session ran with (revised for critic CR-65), which the harness (`evals/harness/run.mjs`) writes into each result record beside `usage`: `turns` the `maxTurns` and `usd` the `maxBudgetUsd` that it passed to `runSession`, after the cap-exception check of §2.2 (2.00 for C002-TS-634 on OpenCode). On every host; on Copilot CLI the host applies `usd` as the credit limit of §2.2, which is 30 credits (0.30 USD) when `usd` is below 0.30 |
| `spend` | on a per-step runner (§2.2): `reported` when the host reported the cost of every step of the session and of its subagents that started; `partial` (revised for critic CR-73) when it reported the cost of some of them but not of every one, a step that the abort at a cap, the session timeout (§4) or another end stopped before its step-finish, or a step-finish without a cost, being one it did not report; `unreported` when it reported the cost of none. `usage.usd` sums the reported costs, so under `partial` it is a lower bound of the session's cost, and the ledger books the session by the test plan's rule for a `partial` spend (§2.2 cap records). On Copilot CLI: `reported` when the usage file gives the session's credits, else `unreported` |
| `provider`, `models` | the inference provider (`openrouter` on OpenCode; `stub` for the stub host) and the model IDs of the session's steps |
| `error` | present when `end_reason` is `error`: the host's or the provider's error text |
| `api_key_source` | the source of the credential the session ran with, never the credential itself (revised for critic CR-37 of the plan review); the session result carries it as `apiKeySource`, and the harness writes it into each result record and the result file as `api_key_source`, beside `auth`. OpenCode: `openrouter-key-file` for a session on the pinned host binary, whose key comes from P-01's key file (§4 Provider key), and `null` on the stub host, which uses no credential; Claude Code: the `apiKeySource` of the session's init message, as the eval auth switch records it today (for example `none` under the subscription route, C002-T-060); Copilot CLI: the name of the credential source its runner gives the host, `copilot-credential-store` for a session on Copilot CLI, which reads P-01's token from the system credential store where `copilot login` keeps it (§4 Copilot CLI session), `null` on the stub host |
| `copilot_usage` | Copilot CLI only: the measured units of `--usage-output-file` (AI Credits, premium requests, tokens and credits per model) with the USD estimate (credits × 0.01) that `usage.usd` takes (revised for defect D-019 item 6) |

## §4 Back ends

| Runner | Drives | Caps | Question calls |
|---|---|---|---|
| OpenCode | the OpenCode server (`opencode serve`) of the pinned host binary and the JS SDK of the same version, with the generated OpenCode package in a temporary project (C002-R-001 D-01, D-02; host process below); permission requests answered under `allowTools` (§2) | turns counted from assistant steps; spend from the cost of each finished step when present (S-07 §10); the session is aborted at a cap (C002-REQ-611), the spend cap by the per-step rule of §2.2, and at the session timeout (below) | answered from `answer` through the SDK's reply route (`question.reply`, S-07 §5), or dismissed through `question.reject` when `answer` returns `{ reject: true }`; this works because the conductor holds `question: allow` (C002-REQ-217); a `question` call that `answer` does not cover ends the session with `question unanswerable` |
| Copilot CLI | `copilot -p <prompt> --agent architect:<agent> --plugin-dir <package copy> --additional-mcp-config @<servers file> --output-format json --no-ask-user`, run in the case's temporary git workspace with a temporary Copilot home (`COPILOT_HOME`; C002-R-001 D-03; C002-AS-04 settled by S-08 §2.1, §2.4). Preparation per session: copy `dist/copilot/` to a temporary folder and run `sdd install copilot --package <package copy>` in the workspace (C002-IF-007), so that the copy has its `plugin.json` and `hooks.json` and the workspace its agents, its workspace hook file `.github/hooks/architect-guard.json` and `.vscode/mcp.json` (whether Copilot CLI loads the workspace hook file is an assumption of C002-IF-005 §3 that the runner's events confirm; the plugin-level entry holds the same guard); then write the `servers` entries of the copy's `install/mcp.json` in Copilot CLI's `mcpServers` form to the servers file. The servers do not come from a plugin MCP configuration: the package declares none (C002-REQ-307). The further options and the environment of the session: Copilot CLI session below | turns counted from the assistant messages of the session agent in the JSON events; at the turn cap the process tree is killed; the spend cap is the host's `--max-ai-credits` limit, checked per session on the measured total (§2.2) | none: `--no-ask-user`; only non-interactive scenarios run (C002-REQ-612) |
| Stub | a scripted host for the runner tests (C002-TS-614) | as the runner under test | scripted |

**Session timeout** (revised for critic CR-74). Each generated-target runner bounds a session by a
session timeout of 20 minutes: the OpenCode runner counts from the moment it sends the session's
prompt, the Copilot CLI runner from the start of the host process. At the timeout the OpenCode
runner aborts the session and its subagents' sessions through the SDK, and the Copilot CLI runner
ends the host process; the session ends with `end_reason` `error`, its `error` text beginning with
`session timed out` on OpenCode (`session timed out after 1200000 ms`) and reading `session
exceeded 20 minutes` on Copilot CLI. The timeout is no cap (neither `turn cap` nor `spend cap`) and
no host or provider error (§2.2, waiver of C002-TS-634).

**MCP servers on Copilot CLI** (settled in C002-T-045; before, an assumption on the S-08 record).
Copilot CLI 1.0.98 accepts `--additional-mcp-config @<file>` and does not read the workspace's
`.vscode/mcp.json`, so the servers file is the only declaration of the package's servers in the
session and no server name is declared twice (a duplicate name kept a server from being reached in
S-08 §3.1).
A hook deny shows in the JSON events as a fail-closed hook error, not as exit code 2 (S-08 §2.2);
the runner reports such a call as a tool call that did not run.

**Copilot CLI session** (revised for defect D-019 items 5 and 6; Copilot CLI 1.0.98, C002-T-045).
Besides the options of the table, the runner starts each session with:

- `--model <model>` (§2 `model`), the session agent's model;
- `--no-auto-update`, and `COPILOT_AUTO_UPDATE=false` in the environment: the tested version stays
  the one that runs;
- `--disable-builtin-mcps`: the host's built-in MCP servers (such as its GitHub server) are not
  started, so the session's MCP tools are those of the servers file alone;
- `--max-ai-credits <n>`: the spend cap of §2.2 (at least 30 credits);
- `--usage-output-file <file>` in the run folder: the session's usage (AI Credits as `totalNanoAiu`
  / 10^9, premium requests, tokens per model), read after the session into `usage` and
  `copilot_usage` (§3); Copilot CLI reports usage per session, not per turn;
- `--log-dir <folder>` in the run folder: the host's logs, read after the session for the
  workspace-hooks line below;
- one `--allow-tool=<permission>` per permission that `allowTools` maps to (§2 `allowTools`).

**Workspace hooks in prompt mode.** Copilot CLI 1.0.98 loads the workspace hook files
`.github/hooks/*.json` in prompt mode (`-p`) only for a trusted folder, or when the environment sets
`GITHUB_COPILOT_PROMPT_MODE_REPO_HOOKS=true`. The case workspace is a temporary folder that is not
trusted, so the runner sets the variable; the plugin-level entry of the copy's `hooks.json` loads in
either case. The runner records whether the host's log holds the line `Loading repo hooks in prompt
mode` as the harness event `hooks` (`workspace_hooks_loaded`), with the hook sources of the denies
the session met (C002-IF-005 §3, assumption on workspace hook files).

**Credentials.** The temporary Copilot home holds a `config.json` with the login identity of P-01's
Copilot CLI login only (host, login and kind, read from P-01's own Copilot configuration), never a
token; the host then reads the token from the system credential store, where `copilot login` keeps
it (`api_key_source` `copilot-credential-store`, §3). Token variables (`COPILOT_GITHUB_TOKEN`,
`GH_TOKEN`, `GITHUB_TOKEN`) and the host's own provider and model variables are removed from its
environment; after the session the temporary home is scanned for token text, and a session in whose
home such text is found ends with `error` and is no evidence. Copilot CLI sessions spend from the
Copilot pool of the test plan (`20-plan/60-test-plan.md` §4).

**OpenCode host process** (revised for defect D-009; `docs/spikes/S-07-opencode.md §9`, facts F-7,
F-8, F-10; revised for defect D-015 item 4). The OpenCode runner, and the corpus replay suite for
`opencode-permissions` (C002-IF-009 §2), start OpenCode as follows:

- **Pinned host binary.** The executable of the tested version, named by its absolute path in the
  harness configuration, never the `opencode` that PATH resolves: on REF-WIN the Windows PATH
  resolves the npm shim `opencode.cmd` (1.18.31) and the Git Bash PATH finds another install
  (1.15.10) first (F-7). The runner reads the version that binary reports at session start and
  records it in `host_versions.opencode`; a version other than the tested one is recorded as read,
  and the release check refuses that evidence (ERR-REL-006, C002-REQ-621).
- **PATH lead** (revised for defect D-020 item 4). The doctor's OpenCode row reads the `opencode` that
  the session's PATH resolves (`sdd host-version opencode`, C002-IF-007; C002-IF-006 §2), not the
  binary that runs the session, and on REF-WIN the user PATH finds another install first
  (`~/.opencode/bin`, 2.0.32, in C002-T-056), so the row read `untested`. The harness therefore puts
  the folder of the pinned binary on the host process's PATH ahead of every other folder that holds
  an `opencode` executable: the runner places it right after the run's own `bin` folder (`sdd`,
  `sdd-mcp`) when the case gives no PATH; when the case gives one, the machine configuration that
  builds it (`evals/harness/machines.mjs`, through `doctorCase` of the doctor cases) places it right
  after the folders the case prepends (its version shims, such as the `opencode` shim of
  C002-TS-513 and C002-TS-514, which must answer first) and before the folders of the
  configuration. The sdd CLI and the `sdd-shell` server inherit that PATH, so a doctor session on the
  tested host reports the tested version, as P-03's doctor does when the tested install is the first
  on their PATH. A case that removes OpenCode from its PATH (an `opencode missing` row) gets no PATH
  lead.
- **Dot folders** (revised for defect D-020 item 1). OpenCode 1.18.31's `glob` does not list files
  inside dot folders when it searches from the project root, so `.sdd/` looks empty to it; the
  generated package's texts find `.sdd/` files with `sdd status` and `read` instead (C002-IF-001 §6.1
  Dot folders). A session that still globs `.sdd/` spends turns on empty results; the runner does
  not correct it, since the package's texts are under test.
- **SDK requests without a headers timeout** (revised for defect D-022 item 4). The JS SDK client
  sends its requests to the loopback `opencode serve` through a fetch with no headers or body
  timeout (`untimedFetch` of `evals/harness/opencode/driver.mjs`, over `node:http`), never through
  Node.js's built-in `fetch`: a prompt request answers only when the prompt has ended, and the
  built-in `fetch` (undici, `headersTimeout` 300 s) drops a request whose response headers take
  longer than 300 s, which ended a C002-TS-634 session at 300 s with an empty error (C002-T-056,
  fixed in commit `f87d885`). The fetch honours the request's abort signal, so the abort at a cap
  (§2.2) still ends the request, and the event stream still streams; the session timeout of
  20 minutes (above) bounds a session instead. An error that the SDK returns is recorded in `error` (§3) by its
  message and cause, never as an empty object.
- **Own database.** `OPENCODE_DB` names an absolute database file of the run, so the user's shared
  OpenCode database is neither read nor migrated by the tested version (F-8).
- **Isolated data folders.** The host process gets configuration, data, cache and state folders of
  its own under the run folder (`XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_CACHE_HOME`,
  `XDG_STATE_HOME`), so neither the user's OpenCode configuration nor its credential store is read;
  the global configuration of the run enables the provider `openrouter` only, with auto-update and
  sharing off. Serena's home folder and, on Windows, `LOCALAPPDATA` also point into the run folder.
  Provider variables of the caller's environment (for example `OPENROUTER_*`, `ANTHROPIC_*`,
  `OPENAI_*`) are removed from the host's environment. The stub-model replay isolates the same
  folders and needs no credential.
- **Provider key.** A paid session reads the OpenRouter key from P-01's key file
  `%USERPROFILE%\.architect-evals\openrouter-key.txt` (one line; `~/.architect-evals/openrouter-key.txt`
  on other platforms), passes it to the host process as `OPENROUTER_API_KEY` only and records the
  key source `openrouter-key-file`; the runner refuses to start the session when the file is missing
  or empty. The key is never printed, logged, written to a result or committed (P-01's key file
  replaces the credential store that an earlier text of this contract named).
- **Node.js.** The machine that runs the runner or the replay with the OpenCode JS SDK has Node.js
  22.22.2 or later (F-10; `../10-context/scope.md` §5); the adopter's floor stays Node.js 20
  (C002-IF-006 §2).
- **Start-up network conditions** (F-9; C002-ADR-005). Auto-update, sharing and the LSP download
  are switched off (`OPENCODE_DISABLE_AUTOUPDATE`, `OPENCODE_DISABLE_SHARE`,
  `OPENCODE_DISABLE_LSP_DOWNLOAD`) in every run. The corpus replay, which must reach no network,
  also switches the model catalogue fetch off (`OPENCODE_DISABLE_MODELS_FETCH`), runs npm offline
  with `@opencode-ai/plugin` of the tested version ready in the project `.opencode/` folder and the
  isolated global configuration folder, and sends every non-loopback request to a closed proxy port.
  At start OpenCode 1.18.31 also tries to download ripgrep from GitHub; in the replay the closed
  proxy blocks the attempt, the session goes on, and its `grep` and `glob` tools run without it
  (S-07 §4). No ripgrep is provisioned, and neither the replay nor the eval runner depends on the
  download: the replay keeps it blocked as one more network request at start (revised for defect
  D-011 item 3).

Eval spend stays within the project budget: dev tier on every target, milestone tier on Claude Code
and on the first port only, the first generated target that is released (ideation §9, C002-US-603).

**Release evidence by mode.** The injection summary of a runner is release evidence for OpenCode,
and for Copilot VS Code under sdd MCP server enforcement when spike S-08 shows that Copilot CLI
loads the package (C002-AS-04). Under the Copilot hooks fallback the boundary is the Copilot guard
hooks in VS Code, which Copilot CLI does not exercise (a separate hook implementation, C002-R-001),
so the Copilot CLI runner's injection results are recorded with `source: copilot-cli-runner` but not
counted: the injection evidence is the checklist record's injection steps, run in VS Code with hooks
enabled (C002-REQ-628, C002-REQ-629, C002-IF-009 §5).
