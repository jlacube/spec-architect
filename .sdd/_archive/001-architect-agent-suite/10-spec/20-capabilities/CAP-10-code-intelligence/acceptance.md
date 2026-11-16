---
id: C001-CAP-10
artifact: spec/acceptance
capability: "Code intelligence integration"
change: CHG-001
phase: 10-spec
status: approved
---

# C001-CAP-10 — Acceptance criteria and scenarios

Machine configurations used below: `cfg-full` (ripwire, Serena, ast-grep installed),
`cfg-no-ripwire`, `cfg-bare` (only built-in tools). Defined in the test plan.

## C001-REQ-1001

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

## C001-REQ-1002

#### C001-AC-1002.1 — Evidence format
```gherkin
Scenario: C001-TS-1003 — evidence entry fields
  When the lint parses "00-ideation/evidence/baseline-survey.md"
  Then every evidence entry has path, line, symbol (or "-" for file-level claims), claim, layer, confidence and disclosures (or "none")
  And an entry missing the layer raises "LINT-EVD-001"
```

## C001-REQ-1003

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

## C001-REQ-1004

#### C001-AC-1004.1 — Disclosures copied
```gherkin
Scenario: C001-TS-1005 — unindexed language disclosed
  Given ripwire's header reports unindexed="proto:12"
  When the cartographer records evidence from that output
  Then each derived evidence entry has disclosures containing "unindexed: proto (12 files)"
```

## C001-REQ-1005

#### C001-AC-1005.1 — No ripwire MCP entry
```gherkin
Scenario: C001-TS-1006 — plugin MCP config
  When the plugin's ".mcp.json" is parsed
  Then no server entry has a command "ripwire" or arguments containing "--mcp"
```

## C001-REQ-1006

#### C001-AC-1006.1 — Serena launch arguments
```gherkin
Scenario: C001-TS-1007 — Serena read-only launch
  When the plugin's ".mcp.json" is parsed
  Then the "serena" server is started with "node" "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" "serena-launch" "${CLAUDE_PLUGIN_DATA}" "--", followed by arguments that include "--context" "claude-code", "--mode" "planning", "--mode" "${CLAUDE_PLUGIN_ROOT}/serena/architect-read-only.yml", "--project" ".", "--enable-web-dashboard" "False" and "--open-web-dashboard" "False"
  And its environment sets "SERENA_HOME" to "${CLAUDE_PLUGIN_DATA}/serena"
  And, with the server running, every tool it lists is one of find_symbol, get_symbols_overview, find_referencing_symbols, find_declaration, find_implementations, get_diagnostics_for_file, initial_instructions, also in a working directory that is not a git repository
```

## C001-REQ-1007

#### C001-AC-1007.1 — Explicit Serena tool names
```gherkin
Scenario: C001-TS-1008 — cartographer and architect Serena grants
  When the frontmatter of "sdd-cartographer" and "sdd-architect" is parsed
  Then every Serena entry in "tools" is one of "mcp__plugin_architect_serena__find_symbol", "mcp__plugin_architect_serena__get_symbols_overview", "mcp__plugin_architect_serena__find_referencing_symbols", "mcp__plugin_architect_serena__find_declaration", "mcp__plugin_architect_serena__find_implementations"
  And no entry is the bare server pattern "mcp__plugin_architect_serena"
  And "tools" contains "ToolSearch"
```

## C001-REQ-1008

#### C001-AC-1008.1 — No Serena in other agents
```gherkin
Scenario: C001-TS-1009 — other agents
  When the frontmatter of the other eight agents is parsed
  Then none of their "tools" entries starts with "mcp__plugin_architect_serena"
```

## C001-REQ-1009

#### C001-AC-1009.1 — ast-grep used for structural search
```gherkin
Scenario: C001-TS-1010 — structural question with ast-grep present
  Given "toolchain.md" records ast-grep detected
  When the cartographer is asked "list Express route handlers registered without the auth middleware"
  Then the transcript contains "ast-grep run --pattern"
  And the evidence entries have layer "ast-grep" and record the pattern
```

## C001-REQ-1010

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

## C001-REQ-1011

#### C001-AC-1011.1 — Greenfield
```gherkin
Scenario: C001-TS-1012 — empty repository
  Given the fixture "fx-empty" after "$SDD init"
  When the cartographer is dispatched for a baseline survey
  Then its reply contains "no code evidence applicable"
  And no file is written under "00-ideation/evidence/"
```

## C001-REQ-1012

#### C001-AC-1012.1 — Lean return
```gherkin
Scenario: C001-TS-1013 — cartographer return size
  When the cartographer returns to the conductor
  Then the returned text, excluding file paths and the questions block, is at most 20 lines
  And it names the layers used
```

## C001-REQ-1013

#### C001-AC-1013.1 — Serena configuration written before first use
```gherkin
Scenario: C001-TS-1015 — Serena data kept outside the repository
  Given the plugin's data folder contains no "serena/serena_config.yml"
  When a session starts in "fx-brownfield-ts" with the plugin enabled, without "/architect:init" or "/architect:doctor"
  Then "serena/serena_config.yml" exists in the plugin's data folder with "project_serena_folder_location" inside that folder and "web_dashboard" false
  And after the cartographer's first Serena call in "fx-brownfield-ts", "git status --porcelain --ignored" lists no ".serena/" entry
```

## Coverage table

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-1001 | TS-1001 | TS-1002 | n/a | TS-1002 (missing tools) | n/a | n/a | n/a |
| C001-REQ-1002 | TS-1003 | n/a | n/a | TS-1003 | n/a | n/a | n/a |
| C001-REQ-1003 | TS-1004 | n/a | TS-1004 (≤ 4000) | n/a | n/a | n/a | n/a |
| C001-REQ-1004 | TS-1005 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1005 | TS-1006 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1006 | TS-1007 | n/a | n/a | n/a | TS-1007 (no write tools) | n/a | n/a |
| C001-REQ-1007 | TS-1008 | n/a | n/a | n/a | TS-1008 | n/a | n/a |
| C001-REQ-1008 | TS-1009 | n/a | n/a | n/a | TS-1009 | n/a | n/a |
| C001-REQ-1009 | TS-1010 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1010 | TS-1011 | TS-1014 (answer exit code) | n/a | TS-1011 | n/a | n/a | n/a |
| C001-REQ-1011 | TS-1012 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1012 | TS-1013 | n/a | TS-1013 (20 lines) | n/a | n/a | n/a | n/a |
| C001-REQ-1013 | TS-1015 | n/a | n/a | n/a | n/a | n/a | n/a |

Per-column n/a reasons: as in CAP-05. Abuse (malicious repository content steering the
cartographer) is covered by C001-NFR-205.
