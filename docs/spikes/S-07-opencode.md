---
spike: S-07
target: opencode
date: 2026-10-18
# tested version: 1.18.31 (re-test, P-01 Round 11 Q-s07-01); first run on 1.15.10, same date (§1.1, §12)
host_versions: { opencode: "1.18.31", opencode-sdk: "1.18.31", models: { opus: "openrouter/anthropic/claude-opus-5.5", sonnet: "openrouter/anthropic/claude-sonnet-5.5", haiku: "openrouter/anthropic/claude-haiku-5.5" } }
outcomes:
  edit_rules_match_path_corpus: false    # FINAL (C002-T-043, full replay §13): 29 of 256 path cases differ under both shells. 1.15.10: false (hand sample)
  bash_rules_match_shell_corpus: false   # FINAL (C002-T-043, full replay §13): 118 (Git Bash) / 130 (PowerShell 7) of 435 shell cases differ. 1.15.10: false (hand sample)
  question_answerable_by_script: true    # 1.15.10: true (same)
  post_write_feedback_channel: true      # 1.15.10: true (same)
  agent_tools_closed: true               # 1.15.10: true (same)
cmd_shims: []                            # 1.15.10: [] (same)
enforcement_mode: sdd-mcp-server         # FINAL (C002-T-043): the full replay differs (S-07 rule: native-permissions only with 0 differences). 1.15.10: same
---

# S-07 — OpenCode 1.18.31 (C002-T-001; re-test of the 1.15.10 run)

**Status:** final. P-01 signed off the 1.15.10 record ("Sign off", 2026-10-18, questions log Round 11
Q-s07-01), chose "Re-test on 1.18.31" and confirmed the re-test ("Confirm"). C002-T-043 (2026-10-19)
replaced the hand-sample values of the two `…_match_…` outcomes and of `enforcement_mode` with the
full corpus replay (§13); none of the three values changed. Signed for P-01 under P-01's standing
waiver of 2026-10-19: "I waive "before each signature" and "before each paid batch" if you stay
within the approved cost limits".

## 0. Re-test summary — 1.18.31 against 1.15.10

| Item | 1.18.31 | 1.15.10 | |
|---|---|---|---|
| Config loading (`opencode.json`: stub provider, agents, `steps`, `tools`, `permission`, MCP, plugin) | loads; `debug agent` shows the same rule derivation | loads | same |
| `agent_tools_closed` | true | true | same |
| Tools offered by default (`probe-open`) | `bash`, `edit`, `glob`, `grep`, `read`, `skill`, `task`, `todowrite`, `webfetch`, `write` (+ adopter MCP, plugin tool) | same list | same |
| `question_answerable_by_script` (SDK `question.reply` / `reject`) | true; outputs byte-identical | true | same |
| `post_write_feedback_channel` | true | true | same |
| `edit` sample (52 corpus cases) | 51 same, 1 differs (PG-048) | 51 / 1 | same |
| Junction under `.sdd/` to a folder **outside** the project | **deny** (`external_directory` evaluated on the resolved target; nothing written) | allow (written outside) | **CHANGED** |
| Junction under `.sdd/` to `src/` (inside the project) | allow (written in `src/`) | allow | same |
| `edit` pre-check (`oldString` matched before the permission check) | yes | yes | same |
| `bash` sample (57 corpus cases) | 41 same, 16 differ — the same 16 cases | 41 / 16 | same |
| Redirect probe `git status > src/redirected.txt` | allowed, ran | allowed, ran | same |
| `edit_rules_match_path_corpus` / `bash_rules_match_shell_corpus` (final, §13) | false / false | false / false (sample) | same |
| Stub-model driver (C002-ADR-005 option A) | feasible | feasible | same |
| Models fetch at start | `https://models.opencode.ai/api.json` (failure not fatal) | `https://models.dev/api.json` | **CHANGED** (URL) |
| `rg.exe` needed in `<cache>/opencode/bin/` | **no** (`grep`, `glob` ran with an empty cache, nothing downloaded) | yes (else download from GitHub) | **CHANGED** |
| Model ids per tier (`opencode models openrouter`) | the same three ids listed | listed and accepted in a paid session | same (listed only; no paid session on 1.18.31) |
| Serena context | `ide` (Serena 1.7.0, no OpenCode context) | `ide` | same |
| `cmd_shims` | `[]` | `[]` | same |
| Enforcement mode (final, §13) | `sdd-mcp-server` | `sdd-mcp-server` | same |

## 1. Method

- **Host:** REF-WIN (Windows 11), Node 22.13.0, OpenCode **1.18.31** — the npm install
  (`%APPDATA%\npm\node_modules\opencode-ai\bin\opencode.exe`, reached through the `opencode.cmd` shim
  that the Windows PATH resolves; F-7), pinned by the driver's new `S07_OPENCODE_BIN` variable so the
  Git Bash PATH (which finds 1.15.10 first) could not pick the other binary. `@opencode-ai/sdk` and
  `@opencode-ai/plugin` **1.18.31** (npm, same release; installed into the probe folder; npm warns
  that their dependency `ini` wants Node ≥ 22.22.2, no effect seen), Serena 1.7.0.
- **Probe package** `docs/spikes/s07/` (throwaway, never shipped), unchanged except `driver.mjs`
  (`S07_OPENCODE_BIN`; the probe database `OPENCODE_DB` now set for stub runs too, from
  `S07_OPENCODE_DB`):
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
  - `cases-*.json` — the probe cases; `results/` — the 1.15.10 outputs; **`results/v1.18.31/`** — the
    re-test outputs (plus the extra cases `cases-pg004.json`, `cases-flags.json`, `cases-rg*.json`).
- **Workspace:** a fresh throwaway git folder in the session scratchpad (`s07v18/ws`, outside this
  repository), built the same way as the 1.15.10 one (README, `src/app.ts`, `.sdd/004-x/existing.md`,
  two junctions, `.opencode/` with the plugin and its pre-installed `node_modules` at 1.18.31). No
  auto-approve mode was used.
- **Isolation (every 1.18.31 run):** `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_CACHE_HOME`,
  `XDG_STATE_HOME` point at empty probe folders (no global config, **no stored credential**), a
  separate database `OPENCODE_DB=<probe>/xdg/data/opencode-s07-v18.db` (honoured: no `opencode.db`
  was created in the probe data folder; the shared real database was not opened by either version),
  `HTTP(S)_PROXY=http://127.0.0.1:9` with `NO_PROXY=127.0.0.1,localhost`,
  `OPENCODE_DISABLE_MODELS_FETCH=1`, `OPENCODE_DISABLE_AUTOUPDATE=1`, `OPENCODE_DISABLE_SHARE=1`,
  `npm_config_offline=true`. 145 stub sessions ran to a tool result, at no cost; the server log names
  no URL other than `127.0.0.1`.
- **No paid session** on 1.18.31 and no model request to OpenRouter. The only non-loopback traffic of
  the re-test: the npm install of the SDK/plugin, and the free catalog fetch of the model listing
  (§7).

### 1.1 The 1.15.10 run

Same package and method on `~/.opencode/bin/opencode.exe` 1.15.10 with SDK/plugin 1.15.10: 139 stub
sessions (plus 8 of a first run that hung, §4) and 3 paid OpenRouter sessions (§10). Its outputs are in
`docs/spikes/s07/results/` (top level). Where this record says "same", the 1.15.10 result equals the
1.18.31 one.

## 2. Closed tool set — `agent_tools_closed: true` (same)

`probe-closed` has `tools: { "*": false, read, glob, grep, list, write, edit, bash, question: true }`.
Tools offered to the model (stub request log, `results/v1.18.31/stub-model-smoke.jsonl`):

| Agent | Tools offered (1.18.31 = 1.15.10) |
|---|---|
| `probe-open` (control) | `adopter_adopter_tool`, `bash`, `edit`, `glob`, `grep`, `plugin_tool`, `read`, `skill`, `task`, `todowrite`, `webfetch`, `write` |
| `probe-closed` | `bash`, `edit`, `glob`, `grep`, `question`, `read`, `write` |

| Scripted call | `probe-closed` | `probe-open` |
|---|---|---|
| adopter MCP tool `adopter_adopter_tool` | refused: `Model tried to call unavailable tool 'invalid'. Available tools: bash, edit, glob, grep, question, read, write.`; the MCP server logged no call | ran (MCP server logged `CALLED adopter_tool`) |
| plugin tool `plugin_tool` | refused (same message); plugin logged no call | ran (`PLUGIN_TOOL_CALLED`) |
| `webfetch` (not named) | refused | — |
| `read`, `write` (named) | ran | ran |

(`results/v1.18.31/out-smoke.json`, `mcp-stub-smoke.jsonl`, `plugin-smoke.jsonl`: one MCP call, one
plugin-tool call, both from `probe-open`.)

- The catch-all keeps adopter MCP and plugin tools away, and named entries override it.
- `opencode debug agent probe-closed` (`results/v1.18.31/debug-agent-probe-closed.json`) shows the
  same derivation as 1.15.10: the `tools` map becomes permission rules, `"*": false` →
  `{permission: "*", pattern: "*", action: "deny"}`, then one `allow` per named tool (`write` →
  `edit`), placed after the defaults (which also hold `question: deny`, `plan_enter`/`plan_exit: deny`,
  `doom_loop: ask`, `external_directory: ask`, `read *.env: ask`) and before the agent's own
  `permission` entries. The resolved tool map sets `invalid`, `task`, `webfetch`, `todowrite`,
  `skill`, `plugin_tool` to false.
- `list` was named but is not a tool at 1.18.31 either (§6 F-1); naming an absent tool is no error.

## 3. Permission rules (hand sample) — provisional

### 3.1 Sample

The same 109 corpus cases (`build-sample.mjs` output identical to the 1.15.10 one apart from the
workspace paths: same IDs, inputs and expected values) plus the 6 extra probes, all through the
agent `probe-perm` and the stub, so each decision is OpenCode's own
(`results/v1.18.31/out-sample-classified.json`, `results/v1.18.31/out-question.json`):

- **Path:** 52 cases of `tests/guards/path-corpus.json` (categories inside, outside, prefix,
  traversal, relative, case, separators; `Write` → `write`, `Edit` → `edit`), plus 2 junction cases and
  2 edit cases with a matching `oldString`. Not sampled: symlink (beyond the 2 junctions), unc,
  short-name, windows-names, drive, memory, identity, tool, malformed, cwd.
- **Shell:** 57 cases of `tests/guards/bash-corpus.json` (scenario, sdd, ripwire, ast-grep, git,
  version, pipe, compound, quoted), plus 1 redirect probe. Not sampled: powershell, identity, tool,
  malformed.
- `{repo}` = the workspace, `{outside}` = a sibling probe folder, `{sdd}` = a non-existent
  `C:/p/scripts/sdd.mjs`. Expected values: the corpus `expect` (win32 value where it differs).
- Fixture note: PG-004 (`Edit` of `.sdd/004-x/existing.md`, `oldString: "x"`) first read as deny on
  1.18.31 only because the re-test fixture file held `s07`, not `x` (the `Could not find oldString`
  pre-check, F-4); with the 1.15.10 fixture content `x` it is **allow**, as on 1.15.10
  (`results/v1.18.31/out-pg004.json`). The counts below use that run.

### 3.2 `edit` rules — 51 of 52 same; 2 differences with the extra probes (1.15.10: 3)

Rules: `"*": "deny"`, `".sdd/*": "allow"`, `external_directory: deny`.

| Finding | 1.18.31 | vs 1.15.10 |
|---|---|---|
| The string matched is the path **relative to the project root** | absolute `{repo}/.sdd/…` inputs match `.sdd/*` (PG-001, PG-043 … PG-045 allow); the server log's `evaluated` lines show the relative path with native `\` separators (`.sdd\004-x\a.md` → `.sdd/*` allow), so matching is separator-insensitive | same (1.15.10 logs the same strings) |
| `..` and `.` are resolved before matching | PG-096 … PG-099, PG-105, PG-110, PG-124 deny; PG-106 … PG-109, PG-125 allow | same |
| Backslashes and mixed separators are normalised; doubled `/` collapses | PG-112, PG-114, PG-127, PG-128, PG-147, PG-148, PG-150 as expected | same |
| Case-insensitive on Windows | PG-139, PG-140, PG-144 allow; PG-143, PG-146 deny | same |
| `%2e%2e` stays literal (a folder named `%2e%2e`) | PG-046 allow, as the guard | same |
| Paths outside the project are decided by `external_directory` first | PG-081, PG-082, PG-099, PG-122 deny (rule list in the message) | same |
| **Junction to a folder outside the project** | `.sdd/link-to-outside/x.md` **denied**: `external_directory` evaluated on the resolved target `…\s07v18\outside\*` → deny; `outside/x.md` unchanged (`results/v1.18.31/permission-evaluated-links.log`) | **CHANGED** (1.15.10: allowed, written outside, `external_directory` not consulted) |
| **Junction inside the project still writes through** | `.sdd/link-to-src/new-file.ts` **allowed** (`edit` evaluated on the unresolved `.sdd\link-to-src\new-file.ts` → `.sdd/*` allow; file created in `src/`) | same |
| A directory path fails before the permission check | PG-048 `{repo}/.sdd/004-x/` → `BadResource: FileSystem.readFile`: a **false deny** (guard: allow); PG-079, PG-080, PG-103 the same error (expected deny) | same |
| `edit` checks `oldString` against the file **before** the permission check | PG-050, PG-052 (`oldString` absent) → `Could not find oldString …`, no permission decision; with a matching `oldString`, `src/app.ts` is denied by the rule and `.sdd/004-x/existing.md` allowed | same |

Provisional `edit_rules_match_path_corpus: false` (PG-048 and the in-project junction case) — same
value; one difference fewer than 1.15.10.

### 3.3 `bash` rules — 41 of 57 same (same 16 differences as 1.15.10)

Rules: `"*": "deny"`, then the `allow` forms of §6.3 (`sdd *`, the eight git read verbs `git <verb> *`,
one rule per ripwire read verb, `ast-grep run *`, the version probes as exact strings, pipe-only
`head -n *`, `tail -n *`, `wc -l`, `sort`, `uniq`), then the `deny` forms (git output options,
ast-grep rewrite flags, `sdd serena-config *`, `sdd serena-launch *`), then the Serena
`--user-data` allows, and `sdd *--cwd*` deny last.

Semantics found (every one unchanged from 1.15.10; each of the 57 cases got the same decision by the
same route):

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

The 16 differences (same cases on both versions):

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

Provisional `bash_rules_match_shell_corpus: false` — same.

## 4. Stub-model driver (C002-ADR-005) — feasible (same)

| Question | Answer (1.18.31) | Evidence |
|---|---|---|
| Runs a session against a loopback provider with no other network access? | **yes** | 145 sessions against `stub/stub-model` with every non-loopback request sent to a closed proxy port; the server log names no URL other than `127.0.0.1` |
| Executes exactly the one scripted call? | **yes** | every case produced exactly one tool part with the scripted name and arguments; the stub's second request carries that call's result (`results/v1.18.31/stub-model-smoke.jsonl`) |
| Needs no real provider (no OpenRouter entry, no key, no network)? | **yes** | `enabled_providers: ["stub"]`, empty isolated data folder (no credential store), proxy to a closed port |

Conditions the replay fixture must meet on 1.18.31, or OpenCode reaches the network at start:

- `OPENCODE_DISABLE_MODELS_FETCH=1` — otherwise it fetches **`https://models.opencode.ai/api.json`**
  (1.15.10: `https://models.dev/api.json`); the failure is logged (`Failed to fetch models.dev`) and
  is not fatal. **Changed URL.**
- `rg.exe` in `<cache>/opencode/bin/` — **no longer needed**: with an empty cache folder and no `rg`
  on PATH, `grep` and `glob` ran and nothing was downloaded (`results/v1.18.31/out-rg.json`,
  `out-rg2.json`). **Changed** (1.15.10 downloaded ripgrep from GitHub).
- With a project `.opencode/` folder (plugins): `package.json` and `node_modules` there already, and
  npm offline. OpenCode 1.18.31 also writes `package.json` (`@opencode-ai/plugin` 1.18.31) into the
  **global config folder** and runs npm there; offline it succeeded only because the npm cache held
  that package (from the SDK install). The ~5-minute hang of 1.15.10 without them was **not re-tested**
  on 1.18.31 (it needs an npm cache without the plugin); the condition is kept.

So the Q-replay-01 fallback is **not** needed; ADR-005 option A stands.

**SDK against the real provider:** shown on 1.15.10 only (§1.1, §10: three sessions,
`session.create`, `session.prompt` with `agent: probe-closed`, `session.messages`; each assistant
message carries `cost` and `tokens`). Not re-run on 1.18.31 (no paid session in this re-test); the
SDK calls used are the same and behave the same against the stub.

## 5. Question tool — `question_answerable_by_script: true` (same)

All results byte-identical to 1.15.10 (`results/v1.18.31/out-question.json`):

- The SDK receives `question.asked` (`{ id, sessionID, questions, tool: { messageID, callID } }`) on
  `event.subscribe` and answers with `question.reply({ requestID, answers: [["<label>"], …] })` (one
  array per question) or dismisses with `question.reject({ requestID })`.
- **Answered:** tool part `completed`, output `User has answered your questions: "<question>"="<label>".
  You can now continue with the user's answers in mind.`, `metadata.answers` = `[["<label>"]]`;
  two questions in one call and `multiple: true` work.
- **Dismissed:** tool part `error`, error text `The user dismissed this question` (this text is the
  tool result the model sees). No `answers` field.
- **Header length: not enforced.** Headers of 30, 31 and 60 characters were all accepted; the
  30-character limit of C002-R-001 C-05 is only the schema's description. C002-REQ-214's limit stays
  a valid self-imposed rule.
- Option `description` is required: without it the call fails with
  `SchemaError(Missing key at ["questions"][0]["options"][0]["description"])`.
- The question tool is **off by default** for SDK/serve sessions (default rule `question: deny`;
  `probe-open` got a part named `invalid` with `Model tried to call unavailable tool 'question'`); an
  agent needs `question: allow` (C002-IF-001 §6.3 sets it for the conductor).

Scripted interviews and gates (C002-REQ-610) are possible; no defect against C002-REQ-610 is needed.

## 6. Post-write feedback — `post_write_feedback_channel: true` (same)

The plugin's `tool.execute.after` hook set `output.output` for `write` and `edit`; the tool result
was `Wrote file successfully.\nS07-POST-WRITE-FEEDBACK: lint says 0 findings` (and the same after
`Edit applied successfully.`), loaded by the 1.18.31 plugin runtime with `@opencode-ai/plugin`
1.18.31. A plugin can return text to the agent after an edit (C002-REQ-215). `tool.execute.before`
input is still `{ tool, sessionID, callID }` with no agent field (C002-R-001 C-06 confirmed;
`results/v1.18.31/plugin-smoke.jsonl`).

## 7. Other items

- **Model ids per tier (C002-REQ-105)** — unchanged: `opencode models openrouter` on 1.18.31 lists
  opus `openrouter/anthropic/claude-opus-5.5`, sonnet `openrouter/anthropic/claude-sonnet-5.5`, haiku
  `openrouter/anthropic/claude-haiku-5.5`, and the floating aliases
  (`openrouter/~anthropic/claude-opus-latest` …), not used (`results/v1.18.31/models-openrouter-anthropic.txt`).
  The listing ran with isolated folders (no credential store) and a dummy `OPENROUTER_API_KEY` value
  (1.18.31 answers `Provider not found: openrouter` without one); it fetched only the free catalog
  and made no model call. The ids were **accepted in a paid session on 1.15.10 only**.
- **Serena context for OpenCode (C002-REQ-114):** `ide` — unchanged. Serena 1.7.0 has no OpenCode
  context (`serena context list`: agent, antigravity, chatgpt, claude-code, codex, copilot-cli,
  desktop-app, ide, vscode, …); `ide` is the generic context for a client with its own file and
  shell tools (it excludes Serena's `read_file`, `create_text_file`, `execute_shell_command`,
  `find_file`, `list_dir`).
- **`cmd_shims: []`** — unchanged (`where.exe` re-run): `node`, `git`, `ast-grep`, `sg`, `serena`,
  `uv`, `uvx`, `claude` resolve to `.exe` files; `sdd`, `sdd-mcp`, `ripwire` are not installed.
  (`opencode`, not an allowlisted executable, resolves to `~/.opencode/bin/opencode.exe` 1.15.10 first
  on the Git Bash PATH and to the npm `.cmd` shim of 1.18.31 on the Windows PATH, F-7.)
- **Auto-update and sharing** off in the probe config (`autoupdate: false`, `share: "disabled"`) and
  by environment.
- **Turn limit:** `steps: 30` on every probe agent — still the agent field on 1.18.31 (`debug agent`
  shows `"steps": 30`); no session came near it.
- **New default tool flags** — unchanged from 1.15.10: with `OPENCODE_ENABLE_EXA=1` and
  `OPENCODE_EXPERIMENTAL_LSP_TOOL=1`, `probe-open` is also offered `websearch` and `lsp`; `list` is
  still no tool (`results/v1.18.31/out-flags.json`).

## 8. Enforcement mode: `sdd-mcp-server` (final, same)

S-07 rule (C002-IF-009 §3, C002-IF-001 §6.3): `native-permissions` only with 0 replay differences.
On 1.18.31 the sample still differs in both mechanisms, including differences no rule can remove
(the in-project link, redirections, pipe parts, script form), so the mode is **`sdd-mcp-server`**, as
the spec expected. C002-T-043 confirmed it from the full replay (§13). `agent_tools_closed: true` holds in
both modes, so ERR-REL-013 does not apply.

## 9. Facts that contradict the approved spec (to triage with P-01)

No spec defect was raised from this task (P-02 does not edit `.sdd/`); each row is a candidate for
`sdd defect add` (P-01 Round 11: one spec revision for the S-07 facts). The **1.18.31** column says
whether each 1.15.10 fact still holds.

| # | Fact (OpenCode 1.18.31, REF-WIN) | 1.18.31 | Spec text affected |
|---|---|---|---|
| F-1 | No `list`, `todoread` or `lsp` tool, and no `websearch` without `OPENCODE_ENABLE_EXA`; LSP only with `OPENCODE_EXPERIMENTAL_LSP_TOOL`. Default tool set: `bash`, `edit`, `glob`, `grep`, `read`, `skill`, `task`, `todowrite`, `webfetch`, `write` (+ `question` when allowed) | holds | C002-IF-001 §6.1 OpenCode columns (Read → `read`, `list`; TaskList → `todoread`; LSP → `lsp`; WebSearch → `websearch`) |
| F-2 | Edit rules do not resolve links for the `edit` pattern: a junction under `.sdd/` to a folder **inside** the project (`src/`) writes through. A junction to a folder **outside** the project is now denied, because `external_directory` is evaluated on the resolved target | **narrowed** (1.15.10 also wrote outside the project) | C002-IF-001 §6.3 "What a glob cannot express" has no link row (false allows under `native-permissions`, now in-project only) |
| F-3 | Bash rules do not check redirection targets (`>`, `>>`, `<`), allow a trailing `;` and `$((…))`, and evaluate pipe parts alone (pipe-only entries allow standalone commands) | holds | C002-IF-001 §6.3 gap table (no rows for these; "pipe-only entries as S-07 shows" — they cannot be tied to pipe position) |
| F-4 | `edit` matches `oldString` against the file and `write` reads the target before the permission check: an `Edit` case with absent text, or a directory path, gets a tool error and no permission decision | holds (PG-004 re-run shows it again: the fixture text decides) | C002-IF-009 §2.2/§2.3 (case-to-call mapping and decision reading: `Edit` cases need fixture text matching `oldString`; a directory path reads as "arguments rejected" → deny, a false deny for PG-048) |
| F-5 | An unavailable tool shows either as a part with the called name, status `error` (`Model tried to call unavailable tool 'invalid'…`), or as a part named `invalid`, status `completed`, output `The arguments provided to the tool are invalid: …` | holds | C002-IF-009 §2.3 `deny` reading (must treat both forms as refused) |
| F-6 | The question tool is off by default for SDK sessions (default rule `question: deny`); the header limit is not enforced | holds | C002-R-001 C-05 (30-character limit as a host constraint); C002-REQ-214 rationale |
| F-7 | Two OpenCode installs on REF-WIN: the Windows PATH resolves `opencode` to the npm shim `opencode.cmd` **1.18.31** (now the tested version); the Git Bash PATH finds `~/.opencode/bin/opencode.exe` **1.15.10** first | holds (the tested version swapped) | C002-ADR-005 "Replay host: the tested `opencode` binary on PATH"; doctor host row (C002-IF-006): from Git Bash it would report 1.15.10, not the tested 1.18.31 |
| F-8 | The shared data folder's `opencode.db` was migrated by 1.18.31 and 1.15.10 fails on it. `OPENCODE_DB=<absolute path>` gives a separate database (honoured by 1.18.31 too) while keeping the credential store | holds (on 1.18.31 the shared DB works but is shared with the user's own sessions; the re-test kept it untouched with `OPENCODE_DB`) | C002-ADR-005 / C002-IF-010 §4 session driver (the harness must set `OPENCODE_DB` or isolate the data folder) |
| F-9 | Stub replay needs models fetch off (catalog now `models.opencode.ai`) and an offline-ready npm setup for the project `.opencode/` folder **and** the global config folder (OpenCode installs `@opencode-ai/plugin` <version> in both); `rg.exe` pre-provisioning is no longer needed | **changed** (1.15.10: also `rg.exe`; catalog `models.dev`) | C002-ADR-005 fixture description (auto-update and sharing only) |
| F-10 | **New:** `@opencode-ai/sdk` / `@opencode-ai/plugin` 1.18.31 pull a dependency (`ini`) whose `engines` wants Node ≥ 22.22.2; REF-WIN has 22.13.0 (npm warning only; nothing failed) | new | C002-IF-006 doctor Node row / the harness's Node floor, if the harness depends on the SDK |

## 10. Spend (OpenRouter, general pool) — 1.15.10 run only

The 1.18.31 re-test made no paid call: **0 USD**. The paid sessions of the first run:

| Session | Tier | OpenCode-reported cost (USD) |
|---|---|---|
| REAL-haiku | haiku | 0.0012 (looks low against the other tiers for the same tokens; at list prices about 0.012) |
| REAL-sonnet | sonnet | 0.0237 |
| REAL-opus | opus | 0.0473 |
| **Total** | | **0.0722** |

- 3 billed sessions on 1.15.10 (each 2 model turns, about 8.4k tokens per turn, mostly cache). Two
  earlier start attempts made no model request (F-8 database error; a `ProviderModelNotFoundError`
  while the models fetch was off), 0 USD; both are noted in the ledger entry of REAL-haiku.
- Mean billed session cost **0.024 USD** (test plan §4.1 checkpoint).
- Ledger: `evals/results/spend-chg002.json` (3 entries, `provider: openrouter`, `pool: general`);
  no entry for the re-test (no spend). The OpenRouter usage-view figures were not read by P-02 (P-01
  to compare with OpenCode's figures for C002-T-044; `opencode stats` on the probe database agrees:
  0.07 USD).
- The stub sessions cost nothing.

## 11. Open points

- ~~P-01: confirm the 1.18.31 re-test~~ — confirmed ("Confirm", 2026-10-18).
- P-01: no paid session ran on 1.18.31; whether one billed session on 1.18.31 (about 0.02 USD) is
  wanted to confirm the SDK-to-OpenRouter path and the model ids on the tested version.
- P-01: OpenCode's credential file in the real data folder was last modified on 2026-09-12; confirm
  it holds the dedicated CHG-002 key with the 50 USD limit (the probe never read it).
- P-01: compare the three 1.15.10 session costs with OpenRouter's usage view (the haiku figure in
  particular).
- Harness pin (F-7): the replay host must run the 1.18.31 binary explicitly (the driver now takes
  `S07_OPENCODE_BIN`); Git Bash resolves 1.15.10 first.
- Not re-tested on 1.18.31: the project-`.opencode` npm hang without network (§4).
- ~~C002-T-043: full replay~~ — done 2026-10-19 (§13).
- C002-TC-620 and C002-TC-648 (release-check cases that read this record) carry to C002-T-047.

## 12. History

| Date | Version | Run |
|---|---|---|
| 2026-10-18 | 1.15.10 (`~/.opencode/bin`) | 139 stub sessions + 3 paid sessions (0.0722 USD); signed off by P-01 ("Sign off", Round 11 Q-s07-01) with "Re-test on 1.18.31" |
| 2026-10-18 | 1.18.31 (npm `opencode.cmd`) | 145 stub sessions, separate `OPENCODE_DB`, 0 USD; this record |
| 2026-10-19 | 1.18.31 (pinned npm binary) | C002-T-043 full replay, 691 cases per shell, stub model, 0 USD; outcomes and mode final |

## 13. Full replay of the native rules (C002-T-043)

`npm run replay -- --mechanism opencode-permissions` (C002-IF-009 §3) on REF-WIN, OpenCode 1.18.31
(pinned binary), `@opencode-ai/sdk` 1.18.31, Node 22.22.3, the stub model (0 USD). Generated package
0.0.1 in `native-permissions` rules, both corpora (path 256 cases, shell 435), replay host
`win32 [file-symlink]`, 0 cases not applicable. OpenCode's shell tool is the shell it was started
from, so the replay ran once per shell.

| Shell | Path cases differing | Shell cases differing | Total | False allows | False denies | Report |
|---|---|---|---|---|---|---|
| Git Bash | 29 | 118 | 147 | 67 | 80 | `docs/spikes/s07/results/v1.18.31/replay-opencode-permissions-git-bash.json` |
| PowerShell 7 | 29 | 130 | 159 | 75 | 84 | `docs/releases/opencode/0.0.1/replay-opencode-permissions.json` (C002-IF-009 §1) |

Differences per corpus category (false allows / false denies; Git Bash — PowerShell 7):

| Category | Git Bash | PowerShell 7 |
|---|---|---|
| path: windows-names | 14 / 0 | 14 / 0 |
| path: symlink | 7 / 0 | 7 / 0 |
| path: traversal | 3 / 0 | 3 / 0 |
| path: unc | 0 / 2 | 0 / 2 |
| path: short-name, inside, cwd | 1 / 2 | 1 / 2 |
| shell: sdd (Serena data-folder and `--cwd` rules) | 0 / 60 | 10 / 52 |
| shell: compound | 16 / 0 | 17 / 0 |
| shell: ripwire | 13 / 1 | 6 / 7 |
| shell: pipe | 4 / 5 | 6 / 5 |
| shell: ast-grep | 4 / 1 | 4 / 2 |
| shell: powershell | 2 / 4 | 2 / 4 |
| shell: scenario, git, quoted, tool, malformed | 3 / 5 | 5 / 10 |

- The identity and memory cases (agent identity, PG-2xx memory folder) give 0 differences: the
  closed tool set and the per-agent rules hold (`agent_tools_closed: true`).
- Every other mechanism difference is one that a glob cannot express (§3, C002-IF-001 §6.3): link
  targets, Windows name forms, traversal, redirections, compound and pipe parts, and the argument
  rules of `sdd serena-launch` / `--cwd`. The mode is therefore `sdd-mcp-server`, as recorded in
  `plugins/architect/targets/opencode.json` (no change).
- Replay harness fix found by the PowerShell run: PowerShell's rules let `node <sdd.mjs> serena-launch
  <folder> -- start-mcp-server` through (Git Bash denies them), and the real CLI then started the real
  Serena with the user's `~/.serena` as its home (4 starts, each shut down at once; logs only). The
  adapter now sets `SERENA_HOME` to the run folder.
