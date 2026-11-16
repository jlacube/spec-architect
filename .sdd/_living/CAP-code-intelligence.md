---
capability: code-intelligence
inventory_only: false
updated: 2026-11-16
---

# Code intelligence (`C001-CAP-10`)

Inventory only: describes the code that exists today; it holds no requirements.

## Purpose

Layered code discovery for brownfield work: the cartographer agent and `code-discovery` skill
(ripwire, then Serena, then LSP, then grep, with ast-grep for shapes), the Serena configuration and
launcher that the plugin ships, and the read-only Serena mode.

## Entry points

- Agent `plugins/architect/agents/sdd-cartographer.md`.
- Skill `plugins/architect/skills/code-discovery/SKILL.md`.
- `sdd serena-config`, `sdd serena-launch` (`serenaConfig`, `serenaLaunchCmd` in `src/cli/commands.ts`);
  MCP server `serena` in `plugins/architect/.mcp.json`.

## Main modules

- `src/workspace/serena-config.ts`, `src/workspace/serena-launch.ts`.
- `plugins/architect/serena/architect-read-only.yml`.
- Bash allowlist for ripwire and ast-grep verbs in `src/hooks/guard-bash.ts` (shared with `C001-CAP-11`).

## Owning tests

- `tests/integration/cap10/` (`TS-1003`, `TS-1006` … `TS-1009`, `serena-config.test.ts`, `serena-tools.ts`).
- Evals: `evals/cap10/` (`carto.mjs`, `callers-full.eval.mjs`, `TS-1001` … `TS-1015`).
- Fixture for discovery tests: `tests/fixtures/fx-brownfield-ts/`.

## Evidence

- **E-1** `src/workspace/serena-config.ts:33` › `writeSerenaConfig()` — writes the Serena configuration.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-2** `src/workspace/serena-launch.ts:15` › `serenaLaunch()` — launcher invoked by the MCP server definition.
  - layer: serena · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127
- **E-3** `plugins/architect/.mcp.json:11` › `serena` — server definition running `sdd.mjs serena-launch` with `architect-read-only.yml`.
  - layer: grep (file read) · confidence: high
  - commit: b3892d4 · pattern: -
  - disclosures: ripwire failed: exit 127

## Requirements

### C001-REQ-1001 — Layer ladder
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the cartographer answers a code question, THE cartographer SHALL use the first available layer, in the order ripwire, Serena, LSP, Grep/Glob, that supports the question type according to the layer table of the `code-discovery` skill.
- **Rationale:** IDEA-P-09; OA-05
- **Stories:** C001-US-1001
- **Priority:** Must
- **Acceptance:** C001-AC-1001.1, C001-AC-1001.2

#### C001-AC-1001.1 — ripwire used first when present
```gherkin
Scenario: C001-TS-1001 — callers question on cfg-full
  Given machine configuration "cfg-full" and repository "fx-brownfield-ts"
  When the cartographer is asked "who calls createIntent?"
  Then its first code-intelligence call is "ripwire … --callers=createIntent"
  And the resulting evidence entries have layer "ripwire"
```

#### C001-AC-1001.2 — Ladder order without ripwire
```gherkin
Scenario Outline: C001-TS-1002 — fallback by configuration
  Given machine configuration "<cfg>"
  When the cartographer is asked "who calls createIntent?"
  Then the evidence layer is "<layer>"
  Examples:
    | cfg            | layer  |
    | cfg-full       | ripwire |
    | cfg-no-ripwire | serena |
    | cfg-bare       | grep   |
```

### C001-REQ-1002 — Evidence entries
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE cartographer SHALL record every code claim as an evidence entry conforming to C001-IF-03 §11 (path, line, symbol, claim, layer, confidence, disclosures).
- **Rationale:** IDEA-P-03; TR-09 input
- **Stories:** C001-US-1005
- **Priority:** Must
- **Acceptance:** C001-AC-1002.1

#### C001-AC-1002.1 — Evidence format
```gherkin
Scenario: C001-TS-1003 — evidence entry fields
  When the lint parses "00-ideation/evidence/baseline-survey.md"
  Then every evidence entry has path, line, symbol (or "-" for file-level claims), claim, layer, confidence and disclosures (or "none")
  And an entry missing the layer raises "LINT-EVD-001"
```

### C001-REQ-1003 — ripwire budgets
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the cartographer invokes a ripwire query verb, THE cartographer SHALL pass the bounding flag that C001-IF-14 §2 assigns to that verb, with a value no greater than the matching budget set in the `code-discovery` skill (defaults: 4000 tokens for `--token-budget` and `--max-tokens`, 50 rows for `--limit`).
- **Rationale:** IDEA-§7.2 token budget; spike S-01 (ripwire 0.6.5 refuses `--token-budget` and `--top-k` on graph and list verbs, `docs/spikes/S-01-ripwire.md`)
- **Stories:** C001-US-1002
- **Priority:** Must
- **Acceptance:** C001-AC-1003.1

#### C001-AC-1003.1 — Bounding flag matches the verb
```gherkin
Scenario Outline: C001-TS-1004 — ripwire budget flag per verb family
  When the cartographer runs the ripwire verb "<verb>" in a scripted session
  Then the command line contains "<flag>" with a value ≤ <max>
  And the command line contains neither "--token-budget=" nor "--top-k=" when <flag> is "--limit="
  Examples:
    | verb              | flag            | max  |
    | --for=            | --token-budget= | 4000 |
    | (default map)     | --max-tokens=   | 4000 |
    | --pack-signatures | --max-tokens=   | 4000 |
    | --callers=        | --limit=        | 50   |
    | --impact=         | --limit=        | 50   |
    | --test-gate       | --limit=        | 50   |
    | --hotspots        | --limit=        | 50   |
```

The command lines of C001-TS-1004 reach ripwire only through the forms the bash guard admits,
C001-IF-07 §3.1 (defect D-012): the default map needs a map bound, and `--test-gate` takes its file
as `--test-gate=<file>`.

### C001-REQ-1004 — Disclosures carried
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN a ripwire output header reports a truncation, an unindexed language or a parse-health issue, THE cartographer SHALL copy that disclosure into the `disclosures` field of every evidence entry derived from that output.
- **Rationale:** ripwire honesty contract (IDEA-§7.2)
- **Stories:** C001-US-1002
- **Priority:** Must
- **Acceptance:** C001-AC-1004.1

#### C001-AC-1004.1 — Disclosures copied
```gherkin
Scenario: C001-TS-1005 — unindexed language disclosed
  Given ripwire's header reports unindexed="proto:12"
  When the cartographer records evidence from that output
  Then each derived evidence entry has disclosures containing "unindexed: proto (12 files)"
```

### C001-REQ-1005 — ripwire never as MCP
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL NOT register ripwire as an MCP server.
- **Rationale:** D-05; C001-CON-07
- **Stories:** C001-US-1002
- **Priority:** Must
- **Acceptance:** C001-AC-1005.1

#### C001-AC-1005.1 — No ripwire MCP entry
```gherkin
Scenario: C001-TS-1006 — plugin MCP config
  When the plugin's ".mcp.json" is parsed
  Then no server entry has a command "ripwire" or arguments containing "--mcp"
```

### C001-REQ-1006 — Serena launched read-only
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE plugin's MCP configuration SHALL start Serena with the launch arguments and environment of C001-IF-14 §4 (context `claude-code`, modes `planning` and the plugin's read-only mode file, project activated from the working directory whether or not it is a git repository, web dashboard disabled), so that the server exposes only the read-only tools listed there.
- **Rationale:** C001-CON-08; IDEA-§7.3; spike S-02 (planning mode alone leaves file-changing and memory tools exposed)
- **Stories:** C001-US-1003
- **Priority:** Must
- **Acceptance:** C001-AC-1006.1

#### C001-AC-1006.1 — Serena launch arguments
```gherkin
Scenario: C001-TS-1007 — Serena read-only launch
  When the plugin's ".mcp.json" is parsed
  Then the "serena" server is started with "node" "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" "serena-launch" "${CLAUDE_PLUGIN_DATA}" "--", followed by arguments that include "--context" "claude-code", "--mode" "planning", "--mode" "${CLAUDE_PLUGIN_ROOT}/serena/architect-read-only.yml", "--project" ".", "--enable-web-dashboard" "False" and "--open-web-dashboard" "False"
  And its environment sets "SERENA_HOME" to "${CLAUDE_PLUGIN_DATA}/serena"
  And, with the server running, every tool it lists is one of find_symbol, get_symbols_overview, find_referencing_symbols, find_declaration, find_implementations, get_diagnostics_for_file, initial_instructions, also in a working directory that is not a git repository
```

### C001-REQ-1007 — Serena tools by explicit name
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE definitions of the cartographer and the architect SHALL grant Serena tools only by explicit plugin-scoped name (`mcp__plugin_architect_serena__<tool>`), limited to `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, `find_declaration` and `find_implementations`.
- **Rationale:** defense in depth; IDEA-§17.3; spikes S-02 (tool set under the `claude-code` context) and S-06 (plugin-scoped tool names)
- **Stories:** C001-US-1003
- **Priority:** Must
- **Acceptance:** C001-AC-1007.1

#### C001-AC-1007.1 — Explicit Serena tool names
```gherkin
Scenario: C001-TS-1008 — cartographer and architect Serena grants
  When the frontmatter of "sdd-cartographer" and "sdd-architect" is parsed
  Then every Serena entry in "tools" is one of "mcp__plugin_architect_serena__find_symbol", "mcp__plugin_architect_serena__get_symbols_overview", "mcp__plugin_architect_serena__find_referencing_symbols", "mcp__plugin_architect_serena__find_declaration", "mcp__plugin_architect_serena__find_implementations"
  And no entry is the bare server pattern "mcp__plugin_architect_serena"
  And "tools" contains "ToolSearch"
```

### C001-REQ-1008 — No Serena elsewhere
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE definitions of the agents other than the cartographer and the architect SHALL NOT grant any tool whose name starts with `mcp__plugin_architect_serena__`.
- **Rationale:** context cost (IDEA-RK-07)
- **Stories:** C001-US-1003
- **Priority:** Must
- **Acceptance:** C001-AC-1008.1

#### C001-AC-1008.1 — No Serena in other agents
```gherkin
Scenario: C001-TS-1009 — other agents
  When the frontmatter of the other eight agents is parsed
  Then none of their "tools" entries starts with "mcp__plugin_architect_serena"
```

### C001-REQ-1009 — ast-grep for structural queries
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** complex
- **Statement:** WHERE `toolchain.md` records ast-grep as detected, WHEN the cartographer needs to find code by syntactic structure, THE cartographer SHALL use `ast-grep run --pattern` in search mode and record the pattern used in the evidence entry.
- **Rationale:** OA-05 option B
- **Stories:** C001-US-1004
- **Priority:** Could
- **Acceptance:** C001-AC-1009.1

#### C001-AC-1009.1 — ast-grep used for structural search
```gherkin
Scenario: C001-TS-1010 — structural question with ast-grep present
  Given "toolchain.md" records ast-grep detected
  When the cartographer is asked "list Express route handlers registered without the auth middleware"
  Then the transcript contains "ast-grep run --pattern"
  And the evidence entries have layer "ast-grep" and record the pattern
```

### C001-REQ-1010 — Layer failure fallback
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF a layer's invocation fails (non-zero exit other than an exit code that C001-IF-14 §2 documents as an answer, timeout of 120 seconds, or tool error), THEN THE cartographer SHALL retry the question on the next available layer and record the failed layer and its error in the disclosures of the resulting evidence.
- **Rationale:** IDEA-P-10; IDEA-§20.5; spike S-01 (`--test-gate` exits 4 when it returns a result)
- **Stories:** C001-US-1001
- **Priority:** Must
- **Acceptance:** C001-AC-1010.1

#### C001-AC-1010.1 — Failure recorded and next layer used
```gherkin
Scenario: C001-TS-1011 — ripwire crashes
  Given machine configuration "cfg-full" where ripwire exits with code 134 on the fixture
  When the cartographer is asked "who calls createIntent?"
  Then the evidence layer is "serena"
  And the disclosures contain "ripwire failed: exit 134"
```

```gherkin
Scenario: C001-TS-1014 — documented answer exit code is not a failure
  Given machine configuration "cfg-full" and repository "fx-brownfield-ts"
  When the cartographer runs "ripwire … --test-gate=src/checkout/payments.ts --limit=50" and ripwire exits with code 4
  Then the evidence layer is "ripwire"
  And no disclosure contains "ripwire failed"
```

### C001-REQ-1011 — Empty repository
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** unwanted-behaviour
- **Statement:** IF the repository contains no source files outside `.sdd/`, THEN THE cartographer SHALL report "no code evidence applicable" and write no evidence file.
- **Rationale:** greenfield behaviour (IDEA-§20.1 step 4)
- **Stories:** C001-US-1001
- **Priority:** Must
- **Acceptance:** C001-AC-1011.1

#### C001-AC-1011.1 — Greenfield
```gherkin
Scenario: C001-TS-1012 — empty repository
  Given the fixture "fx-empty" after "$SDD init"
  When the cartographer is dispatched for a baseline survey
  Then its reply contains "no code evidence applicable"
  And no file is written under "00-ideation/evidence/"
```

### C001-REQ-1012 — Cartographer return contract
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** event-driven
- **Statement:** WHEN the cartographer returns to the conductor, THE cartographer SHALL return a digest of at most 20 lines, the paths of the evidence files written, the layers used, and any `questions` block.
- **Rationale:** cost control; mirrors C001-REQ-305
- **Stories:** C001-US-1005
- **Priority:** Should
- **Acceptance:** C001-AC-1012.1

#### C001-AC-1012.1 — Lean return
```gherkin
Scenario: C001-TS-1013 — cartographer return size
  When the cartographer returns to the conductor
  Then the returned text, excluding file paths and the questions block, is at most 20 lines
  And it names the layers used
```

### C001-REQ-1013 — Serena data outside the repository
- **Source:** CHG-001, archived 2026-11-16
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL start Serena through `sdd serena-launch "${CLAUDE_PLUGIN_DATA}" -- <Serena arguments>`, which ensures that `serena/serena_config.yml` exists in that data folder, with `project_serena_folder_location` set to a folder inside it and `web_dashboard` set to false, before it starts Serena (`sdd serena-config` writes the same file when `/architect:init` or `/architect:doctor` runs; agents themselves write only under `.sdd/`).
- **Rationale:** C001-CON-01, C001-CON-08; spikes S-02 and S-06 (without this file Serena writes `<repo>/.serena/`; it must exist before Serena first starts, C001-IF-14 §4); defect D-004; defect D-010 (the MCP server starts with every session, also in repositories where init never ran)
- **Stories:** C001-US-1003
- **Priority:** Must
- **Acceptance:** C001-AC-1013.1

#### C001-AC-1013.1 — Serena configuration written before first use
```gherkin
Scenario: C001-TS-1015 — Serena data kept outside the repository
  Given the plugin's data folder contains no "serena/serena_config.yml"
  When a session starts in "fx-brownfield-ts" with the plugin enabled, without "/architect:init" or "/architect:doctor"
  Then "serena/serena_config.yml" exists in the plugin's data folder with "project_serena_folder_location" inside that folder and "web_dashboard" false
  And after the cartographer's first Serena call in "fx-brownfield-ts", "git status --porcelain --ignored" lists no ".serena/" entry
```

## History

| ID | Event | Change | Date | Note |
|---|---|---|---|---|
