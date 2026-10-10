---
id: C001-CAP-10
artifact: spec/requirements
capability: "Code intelligence integration"
change: CHG-001
phase: 10-spec
status: draft
delta_default: ADDED
---

# C001-CAP-10 — Requirements

All `Delta: ADDED`. Interfaces: evidence entry format C001-IF-03 §11, plugin `.mcp.json`
C001-IF-08, Bash allowlist C001-IF-07 §3, ripwire and Serena (external, C001-IF-14).

### C001-REQ-1001 — Layer ladder
- **Pattern:** event-driven
- **Statement:** WHEN the cartographer answers a code question, THE cartographer SHALL use the first available layer, in the order ripwire, Serena, LSP, Grep/Glob, that supports the question type according to the layer table of the `code-discovery` skill.
- **Rationale:** IDEA-P-09; OA-05
- **Stories:** C001-US-1001
- **Priority:** Must
- **Acceptance:** C001-AC-1001.1, C001-AC-1001.2

### C001-REQ-1002 — Evidence entries
- **Pattern:** ubiquitous
- **Statement:** THE cartographer SHALL record every code claim as an evidence entry conforming to C001-IF-03 §11 (path, line, symbol, claim, layer, confidence, disclosures).
- **Rationale:** IDEA-P-03; TR-09 input
- **Stories:** C001-US-1005
- **Priority:** Must
- **Acceptance:** C001-AC-1002.1

### C001-REQ-1003 — ripwire budgets
- **Pattern:** event-driven
- **Statement:** WHEN the cartographer invokes a ripwire query verb, THE cartographer SHALL pass `--token-budget` with a value no greater than the budget set in the `code-discovery` skill (default 4000) or `--top-k`.
- **Rationale:** IDEA-§7.2 token budget
- **Stories:** C001-US-1002
- **Priority:** Must
- **Acceptance:** C001-AC-1003.1

### C001-REQ-1004 — Disclosures carried
- **Pattern:** event-driven
- **Statement:** WHEN a ripwire output header reports a truncation, an unindexed language or a parse-health issue, THE cartographer SHALL copy that disclosure into the `disclosures` field of every evidence entry derived from that output.
- **Rationale:** ripwire honesty contract (IDEA-§7.2)
- **Stories:** C001-US-1002
- **Priority:** Must
- **Acceptance:** C001-AC-1004.1

### C001-REQ-1005 — ripwire never as MCP
- **Pattern:** ubiquitous
- **Statement:** THE plugin SHALL NOT register ripwire as an MCP server.
- **Rationale:** D-05; C001-CON-07
- **Stories:** C001-US-1002
- **Priority:** Must
- **Acceptance:** C001-AC-1005.1

### C001-REQ-1006 — Serena launched read-only
- **Pattern:** ubiquitous
- **Statement:** THE plugin's MCP configuration SHALL start Serena with the `claude-code` context and the `planning` mode, so that Serena's editing and shell tools are excluded.
- **Rationale:** C001-CON-08; IDEA-§7.3 (planning mode excludes write tools)
- **Stories:** C001-US-1003
- **Priority:** Must
- **Acceptance:** C001-AC-1006.1

### C001-REQ-1007 — Serena tools by explicit name
- **Pattern:** ubiquitous
- **Statement:** THE definitions of the cartographer and the architect SHALL grant Serena tools only by explicit name, limited to `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, `search_for_pattern`, `list_dir` and `find_file`.
- **Rationale:** defense in depth; IDEA-§17.3
- **Stories:** C001-US-1003
- **Priority:** Must
- **Acceptance:** C001-AC-1007.1

### C001-REQ-1008 — No Serena elsewhere
- **Pattern:** ubiquitous
- **Statement:** THE definitions of the agents other than the cartographer and the architect SHALL NOT grant any `mcp__serena` tool.
- **Rationale:** context cost (IDEA-RK-07)
- **Stories:** C001-US-1003
- **Priority:** Must
- **Acceptance:** C001-AC-1008.1

### C001-REQ-1009 — ast-grep for structural queries
- **Pattern:** complex
- **Statement:** WHERE `toolchain.md` records ast-grep as detected, WHEN the cartographer needs to find code by syntactic structure, THE cartographer SHALL use `ast-grep run --pattern` in search mode and record the pattern used in the evidence entry.
- **Rationale:** OA-05 option B
- **Stories:** C001-US-1004
- **Priority:** Could
- **Acceptance:** C001-AC-1009.1

### C001-REQ-1010 — Layer failure fallback
- **Pattern:** unwanted-behaviour
- **Statement:** IF a layer's invocation fails (non-zero exit, timeout of 120 seconds, or tool error), THEN THE cartographer SHALL retry the question on the next available layer and record the failed layer and its error in the disclosures of the resulting evidence.
- **Rationale:** IDEA-P-10; IDEA-§20.5
- **Stories:** C001-US-1001
- **Priority:** Must
- **Acceptance:** C001-AC-1010.1

### C001-REQ-1011 — Empty repository
- **Pattern:** unwanted-behaviour
- **Statement:** IF the repository contains no source files outside `.sdd/`, THEN THE cartographer SHALL report "no code evidence applicable" and write no evidence file.
- **Rationale:** greenfield behaviour (IDEA-§20.1 step 4)
- **Stories:** C001-US-1001
- **Priority:** Must
- **Acceptance:** C001-AC-1011.1

### C001-REQ-1012 — Cartographer return contract
- **Pattern:** event-driven
- **Statement:** WHEN the cartographer returns to the conductor, THE cartographer SHALL return a digest of at most 20 lines, the paths of the evidence files written, the layers used, and any `questions` block.
- **Rationale:** cost control; mirrors C001-REQ-305
- **Stories:** C001-US-1005
- **Priority:** Should
- **Acceptance:** C001-AC-1012.1
