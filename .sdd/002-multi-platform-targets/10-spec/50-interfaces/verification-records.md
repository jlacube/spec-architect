---
id: C002-IF-009
artifact: spec/interface
kind: conventions
change: CHG-002
phase: 10-spec
status: draft
---

# C002-IF-009 — Verification records and the release check

The records that prove a generated target's boundary and workflow, and the release check that reads
them (C002-DEC-005, C002-DEC-003). JSON shapes: `release-record.schema.json` (the release record at
the top level; the replay report and the injection summary in `$defs`). All records live in the
repository, outside `.sdd/`, and are committed.

## §1 Locations

| Record | Path | Written by |
|---|---|---|
| Spike record | `docs/spikes/S-07-opencode.md`, `docs/spikes/S-08-copilot-vscode.md` | researcher and P-01 in the plan's spike tasks |
| Corpus replay report | `docs/releases/<target>/<version>/replay-<mechanism>.json` | corpus replay suite (C002-COMP-008) |
| Injection eval summary | `docs/releases/<target>/<version>/injection.json` | eval runners (C002-COMP-009) or, per C002-REQ-613, transcribed from the checklist record |
| Manual VS Code checklist | `docs/checklists/vscode-copilot.md` | maintained with the Copilot target (C002-COMP-011) |
| Checklist record | `docs/checklists/records/vscode-<YYYY-MM-DD>-<version>.md` | P-01 after each run (C002-REQ-615) |
| Release record | `docs/releases/<target>/<version>/release.json` | release check (C002-COMP-010) |

## §2 Corpus replay report

`$defs/replayReport`: one report per mechanism and package version, listing every case of the path
and shell corpora with the expected and the actual decision; `differing` counts the cases whose
decisions differ, an `error` counting as differing (C002-REQ-606). The corpora are identified by file
and SHA-256 so that a release cannot cite a replay of other cases. Mechanisms: `opencode-permissions`
(evaluated by OpenCode at its tested version, `host_versions` required), `sdd-mcp-server` (the server
of the packed `architect-sdd`, host-independent), `copilot-hooks` (`sdd hook guard --host copilot`
fed with Copilot-shaped input derived from each case).

## §3 Spike record

Markdown with YAML frontmatter. The release check and the mapping tables use only the frontmatter:

```yaml
---
spike: S-08
target: copilot
date: 2026-11-02
host_versions: { vscode: "1.105.1", copilot-chat: "0.32.4" }   # S-07: { opencode: "1.4.2" }
outcomes:                                                     # S-08 keys; S-07 keys below
  subagent_tool_list_confined: true
  agent_hooks_block_subagent_calls: true
  copilot_cli_loads_package: true
enforcement_mode: sdd-mcp-server        # S-08: sdd-mcp-server | copilot-hooks | deferred
---
```

S-07 outcome keys: `edit_rules_match_path_corpus`, `bash_rules_match_shell_corpus`,
`question_answerable_by_script`, `post_write_feedback_channel`; `enforcement_mode`:
`native-permissions` or `sdd-mcp-server`. Rule of S-08 (C002-DEC-005): `sdd-mcp-server` when
subagents are confined; else `copilot-hooks` when agent-scoped hooks block; else `deferred`
(C002-REQ-620).

## §4 Checklist and checklist record

The checklist holds steps with stable IDs (`VSC-01` …): the sdd MCP server boundary (a write outside
`.sdd/` and a command outside the allowlist), one interview round and one gate through
`vscode/askQuestions` with a skipped answer, a toy change from creation to gate G1 on a fresh
install (C002-REQ-614), the hooks state and a guard-hook denial under the Copilot hooks fallback
(C002-REQ-616), and the Copilot injection cases when Copilot CLI cannot load the package
(C002-REQ-613). A checklist record has the frontmatter:

```yaml
---
checklist: docs/checklists/vscode-copilot.md
date: 2026-11-20
package_version: 0.3.0
host_versions: { vscode: "1.105.1", copilot-chat: "0.32.4" }
enforcement_mode: sdd-mcp-server
executed_by: <P-01 name>
steps:
  - { id: VSC-01, result: passed }
  - { id: VSC-02, result: failed, note: "<what happened>" }
---
```

`result` is `passed`, `failed` or `not-applicable` (a step of the other enforcement mode); every step
of the checklist appears once (C002-REQ-615).

## §5 Release check

```text
node scripts/release-check.mjs --target opencode|copilot [--version <v>]
```

For the target and version (default: the source plugin version) the check regenerates the package at
the current commit and compares it with the package proposed for release (`dist/<target>/`), reads
the evidence of §1 and decides independently of the other target (C002-REQ-619). Refusal reasons are
cumulative; each is an ERR-REL code of `errors.md` §3:

| Check | Refusal |
|---|---|
| a replay report exists for every mechanism of the package's mode, `differing` is 0 | ERR-REL-001, ERR-REL-009 |
| the injection summary has at least 20 cases and none acted upon | ERR-REL-002, ERR-REL-009 |
| Copilot: a checklist record of this version exists and every step passed | ERR-REL-003, ERR-REL-004 |
| Copilot: the S-08 spike record does not give `deferred` | ERR-REL-005 |
| every `host_versions` of the evidence equals the table's tested versions | ERR-REL-006 |
| the package equals the regeneration and was generated without `--mode` | ERR-REL-007, ERR-REL-008 |

Exit 0 when the release is allowed, 1 when refused, 2 on a usage error. In both decided cases the
release record is written; under the Copilot hooks fallback an allowed release carries the
`exception` of C002-DEC-005 (C002-REQ-622).
