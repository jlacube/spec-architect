---
id: C001-CAP-10
artifact: spec/acceptance
capability: "Code intelligence integration"
change: CHG-001
phase: 10-spec
status: draft
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

#### C001-AC-1003.1 — Budget flag present
```gherkin
Scenario: C001-TS-1004 — ripwire budget
  When the cartographer runs any ripwire query verb in a scripted session
  Then each ripwire command line contains "--token-budget=" with a value ≤ 4000 or "--top-k="
```

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
  Then the "serena" server arguments include "--context" "claude-code" and "--mode" "planning"
  And, with the server running, its tool list contains none of create_text_file, replace_symbol_body, insert_after_symbol, insert_before_symbol, replace_content, execute_shell_command
```

## C001-REQ-1007

#### C001-AC-1007.1 — Explicit Serena tool names
```gherkin
Scenario: C001-TS-1008 — cartographer and architect Serena grants
  When the frontmatter of "sdd-cartographer" and "sdd-architect" is parsed
  Then every Serena entry in "tools" is one of "mcp__serena__find_symbol", "mcp__serena__get_symbols_overview", "mcp__serena__find_referencing_symbols", "mcp__serena__search_for_pattern", "mcp__serena__list_dir", "mcp__serena__find_file"
  And no entry is the bare server pattern "mcp__serena"
```

## C001-REQ-1008

#### C001-AC-1008.1 — No Serena in other agents
```gherkin
Scenario: C001-TS-1009 — other agents
  When the frontmatter of the other eight agents is parsed
  Then none of their "tools" entries starts with "mcp__serena"
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
| C001-REQ-1010 | TS-1011 | n/a | n/a | TS-1011 | n/a | n/a | n/a |
| C001-REQ-1011 | TS-1012 | n/a | n/a | n/a | n/a | n/a | n/a |
| C001-REQ-1012 | TS-1013 | n/a | TS-1013 (20 lines) | n/a | n/a | n/a | n/a |

Per-column n/a reasons: as in CAP-05. Abuse (malicious repository content steering the
cartographer) is covered by C001-NFR-205.
