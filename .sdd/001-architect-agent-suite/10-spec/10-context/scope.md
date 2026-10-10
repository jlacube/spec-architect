---
id: C001-SPEC-CTX-03
artifact: spec/context/scope
change: CHG-001
phase: 10-spec
status: approved
traces_to: [IDEA-§5.3, IDEA-§21, IDEA-§23, Spec-Q1..Q4]
---

# Scope, assumptions, constraints and dependencies

## 1. In scope (v1.0 of the suite)

| Area | Capability |
|---|---|
| `.sdd/` workspace, registry, IDs, constitution, profiles, brownfield capability inventory | C001-CAP-01 |
| Conductor (main-session orchestrator) and the interview protocol | C001-CAP-02 |
| Ideation phase: research, options analysis, decisions, ideation document | C001-CAP-03 |
| Specification phase: stories, EARS requirements, acceptance scenarios, NFRs, domain, interfaces, DoD | C001-CAP-04 |
| Architecture views, component catalogue, constraints, ADRs, Archify and Mermaid diagrams | C001-CAP-05 |
| Planning phase and implementer hand-off | C001-CAP-06 |
| Quality: lint, traceability matrix, critic, auditor | C001-CAP-07 |
| Gates, approvals, hashing, waivers, stale propagation, revision | C001-CAP-08 |
| Implementation tracking (task reports, spec defects), session orientation, archive to `_living/` | C001-CAP-09 |
| Code intelligence integration (ripwire, Serena, LSP, ast-grep, grep) | C001-CAP-10 |
| Plugin packaging, local marketplace, MCP config, hooks/guards, doctor, docs, evals, dormant CI | C001-CAP-11 |

## 2. Out of scope

- Everything listed in `problem-and-goals.md` §4 (NG-01 … NG-08).
- Reverse-spec generation of requirements from existing code (v2; IDEA-§26.3).
- Conformance checking of code against specs (v2), although v1 must produce its inputs
  (C001-CAP-07 `trace.json`, C001-CAP-09 reports).
- Issue-tracker export (OQ-12, v2).
- Executable Gherkin generation beyond an optional extraction command (OQ-09).

## 3. Assumptions

Carried from IDEA-§23 (AS-01 … AS-08), plus:

| ID | Assumption | If false |
|---|---|---|
| C001-AS-09 | The Claude Code version in use supports plugin agents, skills, `hooks.json`, `.mcp.json`, `--agent` with plugin-scoped names, and per-agent `tools` allowlists with `Agent(...)` and `mcp__server__tool` patterns (docs, Oct 2026) | Fall back to project-local `.claude/agents/`; spike S-05 |
| C001-AS-10 | Hook input for `PreToolUse` lets the hook tell which agent is calling | Path guard uses the fallback design (C001-REQ-1110) |
| C001-AS-11 | `AskUserQuestion` is available to a plugin agent run as the main session via `--agent` | Conductor runs as a skill-driven main session instead; spike S-05 |
| C001-AS-12 | Remote MCP endpoints for Context7 and DeepWiki remain free for public use | Researcher degrades to WebSearch/WebFetch (C001-REQ-306) |

## 4. Constraints

| ID | Constraint | Source |
|---|---|---|
| C001-CON-01 | Spec-phase agents never modify files outside `.sdd/` | Q2, IDEA-P-01 |
| C001-CON-02 | Helper scripts are Node.js (≥ 20), shipped as a single bundled file with no runtime npm install | Q18, OA-12 |
| C001-CON-03 | Distribution is a Claude Code plugin; per-agent `hooks`/`mcpServers`/`permissionMode`/`initialPrompt` frontmatter must not be relied upon | OA-02, D-03 |
| C001-CON-04 | Only subagents without `AskUserQuestion`; all user interviewing happens in the main session | D-01 |
| C001-CON-05 | Suite license MIT; hard dependencies only under permissive licenses (MIT, Apache-2.0, BSD, ISC) | Spec-Q2, IDEA-RK-14 |
| C001-CON-06 | Windows 11 is the required tested platform at v1; macOS/Linux supported by design and CI workflows authored but not executed remotely | Spec-Q4 |
| C001-CON-07 | ripwire is invoked through its CLI, never as an MCP server | D-05, Q9 |
| C001-CON-08 | Serena is used read-only (planning mode and/or `read_only: true`), scoped to cartographer and architect | IDEA-§7.3, §17.3 |
| C001-CON-09 | Artifacts in `.sdd/` are UTF-8 without BOM with LF line endings | IDEA-§21 |
| C001-CON-10 | Agent count is ten (A0–A9) | OQ-02 |

## 5. External dependencies

| Dependency | Version policy | Required? | Used by | License |
|---|---|---|---|---|
| Claude Code | Current stable (Oct 2026) | Yes | All | Proprietary (host) |
| Node.js | ≥ 20 LTS | Yes | sdd CLI, hooks, Archify | MIT |
| git | ≥ 2.40 | Yes for brownfield evidence pinning; optional otherwise | cartographer, archive | GPL-2.0 (tool, not linked) |
| ripwire (redhat-et) | pinned minor (0.6.x at time of writing), recorded in toolchain.md | Optional (fallback ladder) | cartographer | Apache-2.0 |
| Serena (oraios) | pinned minor via `uv tool install` | Optional | cartographer, architect | MIT |
| Archify (tt-a1i) | pinned via skills install | Optional (Mermaid fallback) | architect | verify at S-03 (must be permissive) |
| ast-grep | any recent | Optional | cartographer | MIT |
| Context7 MCP (remote) | n/a | Optional (degrades to web) | researcher | MIT (server) |
| DeepWiki MCP (remote) | n/a | Optional (degrades to web) | researcher | service |
| esbuild, yaml (dev-time) | pinned in package.json devDependencies | Build only | sdd CLI bundling | MIT, ISC |
