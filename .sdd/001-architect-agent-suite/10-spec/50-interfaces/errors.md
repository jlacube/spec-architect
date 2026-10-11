---
id: C001-SPEC-ERRORS
artifact: spec/error-catalogue
change: CHG-001
phase: 10-spec
status: approved
---

# C001 — Error, warning and rule catalogue

Every code has a condition, a message, a fix (C001-NFR-601) and the requirement that
specifies it. Severity applies to lint/check rules; CLI errors exit with code 2 unless noted.

## 1. CLI errors (`ERR-CLI-*`)

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| ERR-CLI-001 | No `.sdd/` found (command other than `init`) | Not an SDD workspace | Run `sdd init` or `/architect:init` | C001-IF-01 |
| ERR-CLI-002 | Change number not found or ambiguous | Change `<NNN>` not found | Check `sdd status` | C001-IF-01 |
| ERR-CLI-003 | Invalid arguments or options | Usage error: `<detail>` | See `sdd <command> --help` | C001-IF-01, C001-REQ-704 |
| ERR-CLI-004 | Unknown ID type | Unknown ID type `<TYPE>`; valid: … | Use a type from C001-IF-04 §2 | C001-REQ-113 |
| ERR-CLI-005 | Invalid task status | Invalid status `<s>`; valid: todo, in-progress, blocked, done, dropped | Use a valid status | C001-REQ-902 |
| ERR-CLI-006 | `blocked` without reason | `--reason` is required for status blocked | Add `--reason "<text>"` | C001-REQ-903 |
| ERR-CLI-007 | Profile downgrade requested | A full change cannot become lite | Keep full; split the work into a new lite change | C001-REQ-120 |
| ERR-CLI-008 | Defect reference unknown | `<ID>` is not defined in an active change | Reference an existing REQ/AC/TS/T ID | C001-REQ-908 |
| ERR-CLI-009 | Archive preconditions unmet | Cannot archive `<NNN>`: `<list>` | Finish/drop tasks, close defects, approve G3 | C001-REQ-913 |
| ERR-CLI-010 | Unwaived lint errors at approval | Approval blocked by lint errors: `<list>` | Fix the findings or `--waive` them with a note | C001-REQ-807 |
| ERR-CLI-011 | Open clarification markers at approval | Approval blocked by open markers: `<list>` | Answer the questions or `--waive` them | C001-REQ-720 |
| ERR-CLI-012 | Unresolved critic blockers at approval | Approval blocked by critic blockers: `<list>` | Resolve the findings or `--waive` them | C001-REQ-808 |
| ERR-CLI-013 | Task transition not allowed | Transition `<from>` → `<to>` not allowed | See task state machine | C001-REQ-922 |
| ERR-CLI-014 | Change not active | Change `<NNN>` is `<stopped\|archived>` | Create a new change | C001-INV-06 |
| ERR-CLI-015 | Predecessor phase not approved at approval | `<phase>` requires approved `<predecessor>` | Approve the predecessor first | C001-INV-09 |
| ERR-CLI-016 | Internal error (exit 3) | Internal error: `<detail>` | Re-run with `SDD_DEBUG=1` and report | C001-IF-01 |
| ERR-CLI-017 | Atomic write failed (exit 3) | Could not write `<file>`; previous version kept | Check disk space and permissions | C001-REQ-126 |

## 2. CLI warnings

| Code | Condition | Message | Fix | Spec |
|---|---|---|---|---|
| WARN-CLI-001 | Task done while dependencies unfinished | `<T>` done before `<deps>` | Confirm order or update dependencies | C001-REQ-904 |

## 3. Lint rules

| Code | Severity | Condition | Fix | Spec |
|---|---|---|---|---|
| LINT-WS-002 | info | Unknown entry in `.sdd/` | None needed (preserved) | C001-REQ-124 |
| LINT-REG-001 | error | Registry differs from rebuild | Run `sdd status --write` | C001-REQ-106 |
| LINT-LIV-001 | error | Requirement in inventory-only living file | Remove it or set `inventory_only: false` via archive | C001-REQ-122 |
| LINT-RES-001 | error | Research finding without URL or access date | Add source URL and date | C001-REQ-302 |
| LINT-RES-002 | error | Research finding without confidence rating | Add high/medium/low with reason | C001-REQ-307 |
| LINT-OA-001 | error | Weighted total arithmetic wrong | Recompute Σ score × weight | C001-REQ-310 |
| LINT-IDE-001 | error | Ideation section missing | Add the section | C001-REQ-313 |
| LINT-US-001 | error | Unknown persona | Define the persona or fix the reference | C001-REQ-403 |
| LINT-US-002 | error | Story field missing | Add the field | C001-REQ-402 |
| LINT-REQ-001 | error | Requirement field missing | Add the field | C001-REQ-404 |
| LINT-EARS-001 | error | Statement shape ≠ declared pattern | Rewrite or change the pattern | C001-REQ-405 |
| LINT-EARS-002 | error | More than one SHALL | Split the requirement | C001-REQ-406 |
| LINT-EARS-003 | warn | Unknown system name | Add to glossary or fix the name | C001-REQ-407 |
| LINT-WORD-001 | error | Weak word | Replace with a measurable term | C001-REQ-408 |
| LINT-DELTA-001 | error | Delta cites unknown living requirement | Fix the cited ID | C001-REQ-409 |
| LINT-COV-001 | error | Requirement missing from coverage table | Add its row | C001-REQ-412 |
| LINT-COV-002 | error | Empty coverage cell | Add TS IDs or `n/a: <reason>` | C001-REQ-412 |
| LINT-TS-001 | error | Scenario step structure wrong | Exactly one When and ≥ 1 Then (Given optional) | C001-REQ-413 |
| LINT-NFR-001 | error | NFR field missing | Add the field | C001-REQ-414 |
| LINT-DOD-001 | error | DoD item without evidence type | Add an evidence type (C001-IF-03 §8) | C001-REQ-420 |
| LINT-ARCH-001 | error | Component ID mismatch between diagrams and catalogue | Align IDs | C001-REQ-509 |
| LINT-ARCH-002 | error | Architecture section missing | Add the section | C001-REQ-501 |
| LINT-ARCH-003 | error | Component field missing | Add the field | C001-REQ-502 |
| LINT-ARCH-004 | error | Runtime flow without sequence diagram | Add the diagram | C001-REQ-508 |
| LINT-ARCH-005 | error | Existing/modified/removed component without evidence | Add cartographer evidence | C001-REQ-516 |
| LINT-IF-001 | error | Contract file does not parse | Fix syntax at the reported position | C001-REQ-512 |
| LINT-IF-002 | error | Contract file not registered | Add a row to `50-interfaces/README.md` | C001-REQ-510 |
| LINT-ERR-001 | error | Error code referenced but not catalogued | Add it to `errors.md` | C001-REQ-513 |
| LINT-CON-001 | error | Constraint without source | Add DEC/ADR/NFR/constitution source | C001-REQ-514 |
| LINT-PLAN-001 | error | Milestone field missing | Add goal, exit criterion, tasks | C001-REQ-601 |
| LINT-TASK-001 | error | Task section empty | Fill Targets, Verification, Done when | C001-REQ-603 |
| LINT-TASK-002 | warn | Production code in task | Move signatures to 50-interfaces; remove bodies | C001-REQ-604 |
| LINT-TASK-003 | warn | Done task without commit | Add `--commit` | C001-REQ-906 |
| LINT-TASK-004 | error | Task file shape wrong (frontmatter of C001-IF-03 §3 or body headings) | Add the field or heading, in order | C001-REQ-602 |
| LINT-TC-001 | error | Test case field missing (level, location, test data, environment; executor of a manual case) | Add the field | C001-REQ-609 |
| LINT-RISK-001 | error | Risk field missing or rating outside low, medium, high | Fix the risk row | C001-REQ-613 |
| LINT-ROLL-001 | error | Rollout content missing | Add migration, flags with defaults, RB-IDs linked to T or M, communication — or "No rollout impact — <reason>" | C001-REQ-614 |
| LINT-HAND-001 | error | Hand-off section missing or reporting protocol incomplete | Add the section, the `task set` and `defect add` commands and the frontmatter fallback | C001-REQ-616 |
| LINT-HAND-002 | error | Ordered task list incomplete or out of dependency order | List every non-dropped task once, with its path, after its dependencies | C001-REQ-617 |
| LINT-OBS-001 | error | NFR without observability signal | Map it in `78-observability.md` | C001-REQ-615 |
| LINT-EVD-001 | error | Evidence entry field missing | Add path/symbol/layer/confidence/disclosures | C001-REQ-1002 |
| LINT-TXT-001 | error | Placeholder text | Replace with real content | C001-REQ-719 |
| LINT-SEC-001 | error | Secret-like string | Remove the secret; rotate it if real | C001-NFR-203 |
| LINT-GATE-001 | error | Gate-log row without usage cell | Record usage or `unavailable` | C001-NFR-701 |
| TR-01 … TR-15 | per C001-IF-04 §5 | Traceability rules | See rule | CAP-04, 05, 06, 07 |

## 4. Guard rules

| Code | Condition | Spec |
|---|---|---|
| GUARD-PATH-001 | Architect agent write outside `.sdd/` | C001-REQ-1103, 1104, 1105 |
| GUARD-BASH-001 | Shell command not allowlisted | C001-REQ-1106 |
| GUARD-BASH-002 | Redirection, substitution or non-allowlisted chained segment | C001-REQ-1107 |

## 5. Plugin structure checks

See C001-IF-08 §3 (`PLG-*` codes).
