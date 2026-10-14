---
id: C002-CAP-04
artifact: spec/requirements
change: CHG-002
phase: 10-spec
status: draft
capability: "sdd MCP server"
---
# C002-CAP-04 — Requirements

Brownfield change: every requirement carries a Delta. The server is new (C002-DEC-001), so this
capability is `ADDED` throughout; the guard cores it calls stay unchanged (C002-GOAL-05).

### C002-REQ-401 — Writes confined to `.sdd/`
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN an agent calls a write tool of the sdd MCP server, THE sdd MCP server SHALL write the file only if the path guard core allows the target path for an Architect agent without a memory folder, and refuse the call with rule `GUARD-PATH-001` otherwise.
- **Rationale:** C002-DEC-001; the decision and its normalisation are those of C001-REQ-1103 and C001-REQ-1104 (current-state §1, path guard row); no memory folder on the generated targets (C002-DEC-009); no agent identity needed, because only Architect agents are granted the server's tools (C002-REQ-117, C002-REQ-210, C002-REQ-307)
- **Stories:** C002-US-401
- **Priority:** Must
- **Acceptance:** C002-AC-401.1
- **Open items:** the `.sdd/` meant is the one under the server repository root; how that root is fixed, multi-root VS Code workspaces included, is settled in C002-IF-002 §3.

### C002-REQ-402 — Faults leave the file unchanged
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF the sdd MCP server cannot complete a write call (invalid arguments, an exception in the path guard core or an I/O error), THEN THE sdd MCP server SHALL return an error result and leave the target file with its previous content.
- **Rationale:** C002-US-401 (refuse on any internal error, fail closed); C001-NFR-301 for the CLI's own state files
- **Stories:** C002-US-401
- **Priority:** Must
- **Acceptance:** C002-AC-402.1

### C002-REQ-403 — Write operations of the agents
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE sdd MCP server SHALL provide one write tool that creates or replaces a whole file and one write tool that replaces one exact text span in an existing file.
- **Rationale:** agents without a generic edit tool keep the operations they perform with Write and Edit today (ideation §9; C002-OA-001, option B notes)
- **Stories:** C002-US-401
- **Priority:** Must
- **Acceptance:** C002-AC-403.1

### C002-REQ-404 — Ambiguous text span refused
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF the text span to replace occurs zero times or more than once in the file, THEN THE sdd MCP server SHALL refuse the edit and report the number of occurrences found.
- **Rationale:** an edit applies to exactly one place, as with Edit on Claude Code
- **Stories:** C002-US-401
- **Priority:** Must
- **Acceptance:** C002-AC-404.1

### C002-REQ-405 — Commands confined to the allowlist
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN an agent calls the command tool of the sdd MCP server, THE sdd MCP server SHALL run the command only if the bash guard core allows it for an Architect agent, and refuse the call with the guard's rule (`GUARD-BASH-001` or `GUARD-BASH-002`) otherwise.
- **Rationale:** C002-DEC-001; the decision is that of C001-REQ-1106 (as changed by C002-REQ-503) and C001-REQ-1107; the server's shell surface is the allowlist only (ideation §9)
- **Stories:** C002-US-402
- **Priority:** Must
- **Acceptance:** C002-AC-405.1

### C002-REQ-406 — Command results returned
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the sdd MCP server has run an allowed command, THE sdd MCP server SHALL return the command's exit code, standard output and standard error to the calling agent.
- **Rationale:** C002-US-402 (agents read `sdd lint`, `sdd trace` and git output)
- **Stories:** C002-US-402
- **Priority:** Must
- **Acceptance:** C002-AC-406.1

### C002-REQ-407 — Commands use the server's own CLI
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the sdd MCP server runs an `sdd` command, THE sdd MCP server SHALL run the sdd CLI of the `architect-sdd` package version it belongs to.
- **Rationale:** C002-GOAL-04; a PATH `sdd` of another version cannot change what the server runs
- **Stories:** C002-US-402
- **Priority:** Must
- **Acceptance:** C002-AC-407.1

### C002-REQ-408 — Quick-lint findings with each write
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the sdd MCP server has written a file under `.sdd/`, THE sdd MCP server SHALL return the quick-lint findings for that file together with the write result.
- **Rationale:** ideation §5 (hook table: findings with the write result on Copilot VS Code); the lint core is reusable, only the Claude output envelope is host-specific (baseline survey §2, `post-write.ts`, E-12); format of C001-IF-07 §4
- **Stories:** C002-US-403
- **Priority:** Must
- **Acceptance:** C002-AC-408.1

### C002-REQ-409 — Write result without findings
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF the quick-lint check cannot run after a successful write, THEN THE sdd MCP server SHALL return the write result with a note that the findings are unavailable.
- **Rationale:** the post-write hook never blocks a write (C001-IF-07 §2: always exit 0)
- **Stories:** C002-US-403
- **Priority:** Must
- **Acceptance:** C002-AC-409.1

### C002-REQ-410 — Standard input and output only
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE sdd MCP server SHALL exchange MCP messages over its standard input and standard output only.
- **Rationale:** C002-CON-04; ideation §8 (a stdio process the host starts per session)
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-410.1

### C002-REQ-411 — Ends with the session
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the host closes the standard input of the sdd MCP server, THE sdd MCP server SHALL exit with code 0.
- **Rationale:** C002-CON-04 (not a daemon); constitution, forbidden technologies
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-411.1

### C002-REQ-412 — Shipped in `architect-sdd`
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL contain the sdd MCP server as a bundled entry of its own, next to the `sdd` executable.
- **Rationale:** C002-DEC-001 (Constitution check); not under `plugins/architect/scripts/`, which `build.mjs` keeps for `sdd.mjs` only (current-state E-2); C001-CON-02 is reviewed in the architecture step (`../../10-context/scope.md` §4); the templates and the Serena read-only mode file the CLI needs are shipped by C002-REQ-512
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-412.1

### C002-REQ-413 — License check of every bundled entry
- **Delta:** ADDED
- **Pattern:** unwanted-behaviour
- **Statement:** IF a package bundled into an entry of the `architect-sdd` package has a license outside the allowlist of C001-REQ-1114, THEN THE build SHALL fail with a message naming the package and its license.
- **Rationale:** constitution, forbidden technologies; C001-REQ-1114 stays as it is for `scripts/sdd.mjs`
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-413.1

### C002-REQ-414 — License and notices in `architect-sdd`
- **Delta:** ADDED
- **Pattern:** ubiquitous
- **Statement:** THE `architect-sdd` package SHALL contain the MIT `LICENSE` and a `THIRD_PARTY_NOTICES.md` that lists every package bundled into its entries with its version and license.
- **Rationale:** C001-REQ-1112 and C001-REQ-1113 carried to the npm package
- **Stories:** C002-US-404
- **Priority:** Must
- **Acceptance:** C002-AC-414.1

### C002-REQ-415 — One tool set per server profile
- **Delta:** ADDED
- **Pattern:** event-driven
- **Statement:** WHEN the host starts the sdd MCP server with a server profile, THE sdd MCP server SHALL list only the tools of that profile: the write tools for the profile `files` and the command tool for the profile `shell`.
- **Rationale:** a host that grants whole servers only (`<server>/*` on Copilot, C002-OA-001) can then grant the command tool apart from the write tools (C002-REQ-117, C002-REQ-210, C002-REQ-307); one program, two declared servers (C002-IF-002 §1, §2; architecture §6.2)
- **Stories:** C002-US-401, C002-US-402
- **Priority:** Must
- **Acceptance:** C002-AC-415.1
