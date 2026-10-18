---
spike: S-07
target: opencode
date: 2026-10-18
host_versions: { opencode: "1.15.10", opencode-sdk: "1.15.10", models: { opus: "openrouter/anthropic/claude-opus-5.5", sonnet: "openrouter/anthropic/claude-sonnet-5.5", haiku: "openrouter/anthropic/claude-haiku-5.5" } }
outcomes:
  edit_rules_match_path_corpus: false    # PROVISIONAL (hand sample, §3.2); C002-T-043 records the final value from the full replay
  bash_rules_match_shell_corpus: false   # PROVISIONAL (hand sample, §3.3); C002-T-043 records the final value from the full replay
  question_answerable_by_script: true
  post_write_feedback_channel: true
  agent_tools_closed: true
cmd_shims: []
enforcement_mode: sdd-mcp-server         # PROVISIONAL until C002-T-043 (S-07 rule: native-permissions only with 0 replay differences)
---

# S-07 — OpenCode 1.15.10 (C002-T-001)

**Status:** probes complete 2026-10-18; **P-01 sign-off pending.** The two `…_match_…` outcomes and
`enforcement_mode` are provisional values from a hand-replayed sample; C002-T-043 settles them from
the full corpus replay.

## 1. Method

- **Host:** REF-WIN (Windows 11), Node 22.13.0, OpenCode **1.15.10** (`~/.opencode/bin/opencode.exe`,
  the version P-01 named), `@opencode-ai/sdk` and `@opencode-ai/plugin` 1.15.10 (npm, same release),
  Serena 1.7.0.
- **Probe package** `docs/spikes/s07/` (throwaway, never shipped):
  - `stub-model.mjs` — loopback OpenAI-compatible chat endpoint (`127.0.0.1:4199`); answers each
    session's first turn with exactly the scripted tool call, then `done.`; logs every request with
    the tool list the agent was offered;
  - `mcp-stub.mjs` — an "adopter" stdio MCP server with one tool (`adopter_tool`);
  - `plugin/probe.js` — a plugin tool `plugin_tool`, a `tool.execute.after` hook that appends a
    marker to `edit`/`write` output, and a `tool.execute.before` logger;
  - `workspace/opencode.json` — provider `stub` (`@ai-sdk/openai-compatible`, loopback `baseURL`),
    `enabled_providers: ["stub"]`, `autoupdate: false`, `share: "disabled"`, three agents, each with
    `steps: 30` (the turn limit): `probe-open` (no tool map, no rules; control), `probe-closed`
    (`"*": false` plus the derived tools, C002-IF-001 §6.1), `probe-perm` (`edit` and `bash` rules
    hand-written from C001-IF-07 §3 in the form of C002-IF-001 §6.3);
  - `driver.mjs` — starts the stub and `opencode serve`, drives sessions through the SDK
    (`session.create`, `session.prompt` with `agent` and `model`, `event.subscribe`,
    `question.reply`/`reject`, `permission.reply`) and records each tool part's final state;
    `build-sample.mjs` / `classify.mjs` build the corpus sample and read decisions by C002-IF-009 §2.3;
  - `cases-*.json` — the probe cases; `results/` — driver outputs and stub/MCP logs.
- **Workspace:** a throwaway git folder in the session scratchpad (outside this repository), so no
  probe agent could write in the repository. No auto-approve mode was used.
- **Stub runs** isolate OpenCode completely: `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_CACHE_HOME`,
  `XDG_STATE_HOME` point at empty probe folders (no global config, **no stored credential**),
  `HTTP(S)_PROXY=http://127.0.0.1:9` with `NO_PROXY=127.0.0.1,localhost` (any non-loopback request
  fails), `OPENCODE_DISABLE_MODELS_FETCH=1`, `OPENCODE_DISABLE_AUTOUPDATE=1`,
  `OPENCODE_DISABLE_SHARE=1`, `npm_config_offline=true`. 139 stub sessions ran to a tool result (plus 8 of a first run that hung, §4), at no cost.
- **Paid runs** (§5): the same driver with `--real`, against OpenRouter through OpenCode's own
  credential store (the real data folder; the credential file was never read), a probe database
  (`OPENCODE_DB`, §6 F-8) and an isolated config folder.

## 2. Closed tool set — `agent_tools_closed: true`

`probe-closed` has `tools: { "*": false, read, glob, grep, list, write, edit, bash, question: true }`.
Tools offered to the model (stub request log, `results/stub-model-smoke.jsonl`):

| Agent | Tools offered |
|---|---|
| `probe-open` (control) | `adopter_adopter_tool`, `bash`, `edit`, `glob`, `grep`, `plugin_tool`, `read`, `skill`, `task`, `todowrite`, `webfetch`, `write` |
| `probe-closed` | `bash`, `edit`, `glob`, `grep`, `question`, `read`, `write` |

| Scripted call | `probe-closed` | `probe-open` |
|---|---|---|
| adopter MCP tool `adopter_adopter_tool` | refused: `Model tried to call unavailable tool …`; the MCP server logged no call | ran (MCP server logged `CALLED adopter_tool`) |
| plugin tool `plugin_tool` | refused (same message); plugin logged no call | ran (`PLUGIN_TOOL_CALLED`) |
| `webfetch` (not named) | refused | — |
| `read`, `write` (named) | ran | ran |

- The catch-all keeps adopter MCP and plugin tools away, and named entries override it.
- `opencode debug agent probe-closed` shows how: OpenCode 1.15.10 turns the `tools` map into
  permission rules, `"*": false` → `{permission: "*", pattern: "*", action: "deny"}`, then one
  `allow` per named tool (`write` → `edit`), placed after the defaults and before the agent's own
  `permission` entries.
- `list` was named but is not a tool at 1.15.10 (§6 F-1); naming an absent tool is no error.

## 3. Permission rules (hand sample) — provisional

### 3.1 Sample

109 corpus cases plus 6 extra probes, all through the agent `probe-perm` and the stub, so each
decision is OpenCode's own (`results/out-sample-classified.json`, `results/out-question.json`):

- **Path:** 52 cases of `tests/guards/path-corpus.json` (categories inside, outside, prefix,
  traversal, relative, case, separators; `Write` → `write`, `Edit` → `edit`), plus 2 junction cases and
  2 edit cases with a matching `oldString`. Not sampled: symlink (beyond the 2 junctions), unc,
  short-name, windows-names, drive, memory, identity, tool, malformed, cwd.
- **Shell:** 57 cases of `tests/guards/bash-corpus.json` (scenario, sdd, ripwire, ast-grep, git,
  version, pipe, compound, quoted), plus 1 redirect probe. Not sampled: powershell, identity, tool,
  malformed.
- `{repo}` = the workspace, `{outside}` = a sibling probe folder, `{sdd}` = a non-existent
  `C:/p/scripts/sdd.mjs`. Expected values: the corpus `expect` (win32 value where it differs).

### 3.2 `edit` rules — 51 of 52 same; 3 differences with the extra probes

Rules: `"*": "deny"`, `".sdd/*": "allow"`, `external_directory: deny`.

| Finding | Evidence |
|---|---|
| The string matched is the path **relative to the project root**, forward slashes | absolute `{repo}/.sdd/…` inputs match `.sdd/*` (PG-001, PG-043 … PG-045 allow); the deny message quotes the rules `edit * deny`, `edit .sdd/* allow` (PG-049) |
| `..` and `.` are resolved before matching | PG-096 … PG-099, PG-105, PG-110, PG-124 deny; PG-106 … PG-109, PG-125 allow |
| Backslashes and mixed separators are normalised; doubled `/` collapses | PG-112, PG-114, PG-127, PG-128, PG-147, PG-148, PG-150 as expected |
| Case-insensitive on Windows | PG-139, PG-140, PG-144 allow; PG-143, PG-146 deny |
| `%2e%2e` stays literal (a folder named `%2e%2e`) | PG-046 allow, as the guard |
| Paths outside the project are decided by `external_directory` first | PG-081, PG-082, PG-099, PG-122 deny (rule list in the message) |
| **Links are not resolved** — a junction under `.sdd/` writes through | `.sdd/link-to-src/new-file.ts` **allowed** (file created in `src/`); `.sdd/link-to-outside/x.md` **allowed** and written **outside the project**, `external_directory` not consulted (corpus PG-047-type cases expect deny) |
| A directory path fails before the permission check | PG-048 `{repo}/.sdd/004-x/` → `BadResource: FileSystem.readFile`: a **false deny** (guard: allow); PG-079, PG-080, PG-103 the same error (expected deny) |
| `edit` checks `oldString` against the file **before** the permission check | PG-050, PG-052 (`oldString` absent) → `Could not find oldString …`, no permission decision; with a matching `oldString`, `src/app.ts` is denied by the rule and `.sdd/004-x/existing.md` allowed |

Provisional `edit_rules_match_path_corpus: false` (PG-048 and the two junction cases).

### 3.3 `bash` rules — 41 of 57 same

Rules: `"*": "deny"`, then the `allow` forms of §6.3 (`sdd *`, the eight git read verbs `git <verb> *`,
one rule per ripwire read verb, `ast-grep run *`, the version probes as exact strings, pipe-only
`head -n *`, `tail -n *`, `wc -l`, `sort`, `uniq`), then the `deny` forms (git output options,
ast-grep rewrite flags, `sdd serena-config *`, `sdd serena-launch *`), then the Serena
`--user-data` allows, and `sdd *--cwd*` deny last.

Semantics found:

- **Last matching rule wins:** `sdd trace 001 --write --cwd ../other-repo` and every `--cwd` case are
  denied by the trailing `sdd *--cwd*` although `sdd *` allows; `ast-grep run --pattern 'x'
  --update-all` is denied by the later `ast-grep * --update-all*`.
- **Compound commands are split, each part must be allowed:** `git status; rm -rf src`,
  `git status || rm -rf src`, `sdd lint; curl http://x`, `git log | tee …`, `git log | node`,
  `echo $(cat secrets.txt)`, `git log "$(rm -rf src)"`, `cat <(git log)` all denied; quoted
  separators are not split (`git log --grep='a;b'`, `--grep="a|b"`, `--grep='$(x)'` allowed,
  `--grep="$(x)"` denied).
- **Redirections are not checked:** `git log >> src/log.txt`, `git log < input.txt` and
  `git status > src/redirected.txt` were **allowed and ran** (files written in `src/`).
- `git status;` (trailing `;`) and `git log $((1+1))` are allowed (guard: deny).
- **Pipe parts are evaluated independently**, so a pipe-only entry also allows the command alone:
  `tail -n 5 x` allowed (guard: deny, pipe-only).
- The shell tool on REF-WIN is **Git Bash** (`/usr/bin/bash`; GNU `tail` messages).

The 16 differences:

| Class | Cases | Kind | Rule fix possible? |
|---|---|---|---|
| script form `node <path>/sdd.mjs` | BG-001, BG-015 | false deny | no (expected, §6.3) |
| `--cwd` inside the root | BG-307, BG-358 | false deny | no (expected, §6.3) |
| Serena folder outside the repository | BG-394 | false deny | no (expected, §6.3) |
| pipe-only flags (`head`, `head -5`, `tail -2`, `sort -r`, `uniq -c`) | BG-010, BG-167, BG-170, BG-173 | false deny | yes (wider pipe-only rules), but each widening adds standalone false allows |
| pipe-only command alone | BG-176 | false allow | no (parts evaluated alone) |
| ripwire flag value (`--max-tokens=x`) | BG-069 | false allow | no (expected, §6.3) |
| `ast-grep run` without `--pattern` | BG-109 | false allow | yes (`ast-grep run *--pattern*`) |
| redirection | BG-203, BG-206 | false allow | no |
| `$((…))`, trailing `;` | BG-215, BG-221 | false allow | no |

Provisional `bash_rules_match_shell_corpus: false`.

## 4. Stub-model driver (C002-ADR-005) — feasible

| Question | Answer | Evidence |
|---|---|---|
| Runs a session against a loopback provider with no other network access? | **yes** | 139 sessions against `stub/stub-model` with every non-loopback request sent to a closed proxy port; the server log names no URL other than `127.0.0.1` (`opencode-serve.log`, smoke rerun) |
| Executes exactly the one scripted call? | **yes** | every case produced exactly one tool part with the scripted name and arguments; the stub's second request carries that call's result (`results/stub-model-*.jsonl`) |
| Needs no real provider (no OpenRouter entry, no key, no network)? | **yes** | `enabled_providers: ["stub"]`, empty isolated data folder (no credential store), proxy to a closed port |

Conditions the replay fixture must meet, or OpenCode reaches the network at start:

- `OPENCODE_DISABLE_MODELS_FETCH=1` (otherwise it fetches `https://models.dev/api.json`; the failure
  is not fatal);
- `rg.exe` present in `<cache>/opencode/bin/` (otherwise it downloads ripgrep from GitHub);
- with a project `.opencode/` folder (plugins): `package.json` and `node_modules` there already, and
  npm offline; otherwise OpenCode runs npm for that folder at start and, without network, every
  request hung about 5 minutes (first smoke run).

So the Q-replay-01 fallback is **not** needed; ADR-005 option A stands.

**SDK against the real provider: yes.** The same driver started, drove and ended three sessions
against OpenRouter (`session.create`, `session.prompt` with `agent: probe-closed`, the model per
tier, `session.messages`): each called `read` once and answered with the file's first line
(`results/out-real-*.json`). Each assistant message carries `cost` and `tokens` (input, output,
cache read/write), which the harness can read. The tested 1.15.10 needs its own database (F-8).

## 5. Question tool — `question_answerable_by_script: true`

- The SDK receives `question.asked` (`{ id, sessionID, questions, tool: { messageID, callID } }`) on
  `event.subscribe` and answers with `question.reply({ requestID, answers: [["<label>"], …] })` (one
  array per question) or dismisses with `question.reject({ requestID })`.
- **Answered:** tool part `completed`, output `User has answered your questions: "<question>"="<label>".
  You can now continue with the user's answers in mind.`, `metadata.answers` = `[["<label>"]]`;
  two questions in one call and `multiple: true` work.
- **Dismissed:** tool part `error`, error text `The user dismissed this question` (this text is the
  tool result the model sees). No `answers` field.
- **Header length: not enforced.** Headers of 30, 31 and 60 characters were all accepted and shown
  in `question.asked`; the 30-character limit of C002-R-001 C-05 is only the schema's description.
  C002-REQ-214's limit stays a valid self-imposed rule.
- Option `description` is required: without it the call fails with
  `SchemaError(Missing key at ["questions"][0]["options"][0]["description"])`.
- The question tool is **off by default** for SDK/serve sessions (default rule `question: deny`;
  `probe-open` got `unavailable tool 'question'`); an agent needs `question: allow` (C002-IF-001 §6.3
  sets it for the conductor).

Scripted interviews and gates (C002-REQ-610) are possible; no defect against C002-REQ-610 is needed.

## 6. Post-write feedback — `post_write_feedback_channel: true`

The plugin's `tool.execute.after` hook set `output.output` for `write` and `edit`; the next model
request carried `Wrote file successfully.\nS07-POST-WRITE-FEEDBACK: lint says 0 findings` (and the
same after `Edit applied successfully.`) as the tool result. A plugin can return text to the agent
after an edit (C002-REQ-215). `tool.execute.before` input is `{ tool, sessionID, callID }` with no
agent field (C002-R-001 C-06 confirmed).

## 7. Other items

- **Model ids per tier (C002-REQ-105)**, listed by `opencode models openrouter` and each accepted in
  a paid session: opus `openrouter/anthropic/claude-opus-5.5`, sonnet
  `openrouter/anthropic/claude-sonnet-5.5`, haiku `openrouter/anthropic/claude-haiku-5.5`. The
  listing also has floating aliases (`openrouter/~anthropic/claude-opus-latest` …), not used.
- **Serena context for OpenCode (C002-REQ-114):** `ide`. Serena 1.7.0 has no OpenCode context
  (`serena context list`: agent, claude-code, codex, copilot-cli, desktop-app, ide, vscode, …); `ide`
  is the generic context for a client with its own file and shell tools (it excludes Serena's
  `read_file`, `create_text_file`, `execute_shell_command`, `find_file`, `list_dir`).
- **`cmd_shims: []`** — `where.exe` on REF-WIN: `node`, `git`, `ast-grep`, `sg`, `serena`, `uv`,
  `uvx`, `claude` resolve to `.exe` files; `sdd`, `sdd-mcp`, `ripwire` are not installed. (`opencode`,
  not an allowlisted executable, resolves to an npm `.cmd` shim, F-7.)
- **Auto-update and sharing** off in the probe config (`autoupdate: false`, `share: "disabled"`) and
  by environment.
- **Turn limit:** `steps: 30` on every probe agent (the agent field of 1.15.10); no session came
  near it.

## 8. Enforcement mode: `sdd-mcp-server` (provisional)

S-07 rule (C002-IF-009 §3, C002-IF-001 §6.3): `native-permissions` only with 0 replay differences.
The sample already differs in both mechanisms, including differences no rule can remove (links,
redirections, pipe parts, script form), so the mode is **`sdd-mcp-server`**, as the spec expected.
C002-T-043 confirms it from the full replay. `agent_tools_closed: true` holds in both modes, so
ERR-REL-013 does not apply.

## 9. Facts that contradict the approved spec (to triage with P-01)

No spec defect was raised from this task (P-02 does not edit `.sdd/`); each row is a candidate for
`sdd defect add`.

| # | Fact (OpenCode 1.15.10, REF-WIN) | Spec text affected |
|---|---|---|
| F-1 | No `list`, `todoread` or `lsp` tool, and no `websearch` without `OPENCODE_ENABLE_EXA`; LSP only with `OPENCODE_EXPERIMENTAL_LSP_TOOL`. Default tool set: `bash`, `edit`, `glob`, `grep`, `read`, `skill`, `task`, `todowrite`, `webfetch`, `write` (+ `question` when allowed) | C002-IF-001 §6.1 OpenCode columns (Read → `read`, `list`; TaskList → `todoread`; LSP → `lsp`; WebSearch → `websearch`) |
| F-2 | Edit rules do not resolve links: a junction under `.sdd/` writes into `src/` and outside the project, `external_directory` not consulted | C002-IF-001 §6.3 "What a glob cannot express" has no link row (false allows under `native-permissions`) |
| F-3 | Bash rules do not check redirection targets (`>`, `>>`, `<`), allow a trailing `;` and `$((…))`, and evaluate pipe parts alone (pipe-only entries allow standalone commands) | C002-IF-001 §6.3 gap table (no rows for these; "pipe-only entries as S-07 shows" — they cannot be tied to pipe position) |
| F-4 | `edit` matches `oldString` against the file and `write` reads the target before the permission check: an `Edit` case with absent text, or a directory path, gets a tool error and no permission decision | C002-IF-009 §2.2/§2.3 (case-to-call mapping and decision reading: `Edit` cases need fixture text matching `oldString`; a directory path reads as "arguments rejected" → deny, a false deny for PG-048) |
| F-5 | An unavailable tool shows either as a part with the called name, status `error` (`Model tried to call unavailable tool 'invalid'…`), or as a part named `invalid`, status `completed`, output `The arguments provided to the tool are invalid: …` | C002-IF-009 §2.3 `deny` reading (must treat both forms as refused) |
| F-6 | The question tool is off by default for SDK sessions (default rule `question: deny`); the header limit is not enforced | C002-R-001 C-05 (30-character limit as a host constraint); C002-REQ-214 rationale |
| F-7 | Two OpenCode installs on REF-WIN: the Windows PATH (`where.exe`) resolves `opencode` to the npm shim `opencode.cmd` **1.18.31**; the tested **1.15.10** is first only on the Git Bash PATH (`~/.opencode/bin`) | C002-ADR-005 "Replay host: the tested `opencode` binary on PATH"; doctor host row (C002-IF-006) would report 1.18.31 from a Windows shell |
| F-8 | The shared data folder's `opencode.db` was migrated by 1.18.31; 1.15.10 fails on it (`NOT NULL constraint failed: session_message.seq`). `OPENCODE_DB=<absolute path>` gives a separate database while keeping the credential store | C002-ADR-005 / C002-IF-010 §4 session driver (the harness must set `OPENCODE_DB` or isolate the data folder) |
| F-9 | Stub replay needs models fetch off, a pre-provisioned `rg.exe` and an offline `.opencode` npm folder (§4) | C002-ADR-005 fixture description (auto-update and sharing only) |

## 10. Spend (OpenRouter, general pool)

| Session | Tier | OpenCode-reported cost (USD) |
|---|---|---|
| REAL-haiku | haiku | 0.0012 (looks low against the other tiers for the same tokens; at list prices about 0.012) |
| REAL-sonnet | sonnet | 0.0237 |
| REAL-opus | opus | 0.0473 |
| **Total** | | **0.0722** |

- 3 billed sessions (each 2 model turns, about 8.4k tokens per turn, mostly cache). Two earlier
  start attempts made no model request (F-8 database error; a `ProviderModelNotFoundError` while the
  models fetch was off), 0 USD; both are noted in the ledger entry of REAL-haiku.
- Mean billed session cost **0.024 USD** (test plan §4.1 checkpoint).
- Ledger: `evals/results/spend-chg002.json` (3 entries, `provider: openrouter`, `pool: general`).
  The OpenRouter usage-view figures were not read by P-02 (P-01 to compare with OpenCode's figures
  for C002-T-044; `opencode stats` on the probe database agrees: 0.07 USD).
- The stub sessions cost nothing.

## 11. Open points

- P-01 sign-off of this record.
- P-01: OpenCode's credential file in the real data folder was last modified on 2026-09-12; confirm
  it holds the dedicated CHG-002 key with the 50 USD limit (the probe never read it).
- P-01: compare the three session costs with OpenRouter's usage view (the haiku figure in
  particular).
- P-01: which OpenCode on PATH is the tested one (F-7), and whether the harness pins
  `~/.opencode/bin/opencode.exe`.
- C002-T-043: full replay; settles both `…_match_…` values and the mode.
- C002-TC-620 and C002-TC-648 (release-check cases that read this record) carry to C002-T-047.
