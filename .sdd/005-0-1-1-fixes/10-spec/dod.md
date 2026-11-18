---
id: "C005-SPEC-DOD"
artifact: spec/dod
change: "CHG-005"
phase: 10-spec
status: draft
---
# CHG-005 — Definition of Done (lite)

Scenarios and their verification levels (`@eval`, `@manual-vscode`, `@review`, untagged): `spec.md` § Acceptance. The
eval budget for the `@eval` scenarios is set in 20-plan (ideation §11); the pass floor is that of DOD-G-01. Copilot VS
Code is checked by recorded manual runs (Q-vscode-01), not through the Copilot CLI eval runner.

| ID | Statement | Evidence type | Covers |
|---|---|---|---|
| C005-DOD-001 | Every `@eval` scenario of C005-AC-101.1, C005-AC-102.1, C005-AC-123.1, C005-AC-124.1, C005-AC-103.1, C005-AC-104.1, C005-AC-107.1 and C005-AC-114.1 other than C005-TS-156 (C005-TS-101 to C005-TS-110, C005-TS-112, C005-TS-113, C005-TS-120, C005-TS-121, C005-TS-141 to C005-TS-143, C005-TS-158 to C005-TS-163, C005-TS-173, C005-TS-174) passes on Claude Code through the Claude Code eval runner at the dev tier, at the floor of DOD-G-01, each Examples row a case of its own. C005-TS-156, the OpenCode row of C002-TS-219 restated, is carried to CHG-003 (Q-opencode-01; carry note in `.sdd/003-opencode-release/change.md`) and runs there with the OpenCode `@eval` scenarios that C002-DOD-002 moved; in CHG-005 it is closed by a DOD-G-01 waiver that P-01 decides at CHG-005's close | test-report | C005-REQ-101, C005-REQ-102, C005-REQ-103, C005-REQ-104, C005-REQ-107, C005-REQ-114, C005-REQ-123, C005-REQ-124 |
| C005-DOD-002 | Every untagged scenario of `spec.md` § Acceptance (C005-TS-111, C005-TS-114 to C005-TS-119, C005-TS-122 to C005-TS-140, C005-TS-144 to C005-TS-150, C005-TS-166 to C005-TS-171, C005-TS-175 to C005-TS-179) is an automated unit or integration test that carries its TS ID and passes in `npm run check` on the release commit | test-report | C005-REQ-105, C005-REQ-106, C005-REQ-108, C005-REQ-109, C005-REQ-110, C005-REQ-111, C005-REQ-112, C005-REQ-113, C005-REQ-115, C005-REQ-116, C005-REQ-117, C005-REQ-121, C005-REQ-122, C005-REQ-126, C005-REQ-127 |
| C005-DOD-003 | The line and branch coverage of the CLI source in the `npm run check` run of the release commit meets the thresholds of C001-NFR-502 | coverage-report | C005-REQ-106, C005-REQ-108, C005-REQ-109, C005-REQ-112, C005-REQ-113, C005-REQ-115, C005-REQ-116, C005-REQ-117, C005-REQ-121, C005-REQ-122, C005-REQ-126, C005-REQ-127 |
| C005-DOD-004 | On the release commit, the body of `plugins/architect/agents/sdd-conductor.md` has at most 64,000 characters and the body of every `SKILL.md` that holds the new-change procedure or the pre-phase round rule has at most 24,000 characters (constitution, NFR defaults, Skill size) | command-output | C005-REQ-101, C005-REQ-102, C005-REQ-103, C005-REQ-104, C005-REQ-123, C005-REQ-124 |
| C005-DOD-005 | The link to the published 0.1.1 GitHub release is recorded, with P-01's review record of C005-TS-152 | link | C005-REQ-118 |
| C005-DOD-006 | The output of `npm view architect-sdd@0.1.1 version` and `npm view architect-sdd time --json` is recorded with the publish time of the 0.1.1 GitHub release, and meets C005-TS-153 | command-output | C005-REQ-119 |
| C005-DOD-007 | P-01's review record of C005-TS-154 and C005-TS-172 on the published 0.1.1 release notes shows present the old and the new `SDD.md` sentence and, for lite plans approved with the sdd CLI 0.1.0, the statement that the first `sdd stale check` of the sdd CLI 0.1.1 sets `20-plan` stale, that one revision and one G3 approval with the sdd CLI 0.1.1 make it approved again, that before that G3 approval P-01 moves each report-field line that stands between a field line and that field's indented lines to directly after them, and that this approval holds only while every later `sdd stale check` of the change runs the sdd CLI 0.1.1 | review-record | C005-REQ-120, C005-REQ-125 |
| C005-DOD-008 | The manual check of C005-NFR-001 is recorded per shell (PowerShell 7, Command Prompt, Git Bash) with the fixture tasks and the command order of its Method, each command, its exit code and the task or defect state afterwards, and reaches 5 of 5 in each shell | command-output | C005-NFR-001 |
| C005-DOD-009 | A record of one manual run per `@manual-vscode` scenario (C005-TS-155 with each of its 2 Examples rows, C005-TS-157, C005-TS-164, C005-TS-165) in Copilot VS Code, with the Copilot target package 0.1.1 built from the release commit, names the VS Code and GitHub Copilot Chat versions and the date, and for each scenario gives the `askQuestions` dialog shown (screenshot or chat export), P-01's answer, the content of the files its Then steps name and the result `passed`; C005-TS-164 and C005-TS-165 may share one run | review-record | C005-REQ-101, C005-REQ-102, C005-REQ-103, C005-REQ-104 |

## Inherited global items

- **DOD-G-01** — applies to every scenario of the change. C005-DOD-001 and C005-DOD-002 are its instances for the
  `@eval` and untagged scenarios; the `@manual-vscode` scenarios (C005-DOD-009) and the `@review` scenarios
  C005-TS-152 to C005-TS-154 and C005-TS-172 (C005-DOD-005 to C005-DOD-007) are the manual ones with an executed
  record. C005-TS-156 is carried to CHG-003 and needs a DOD-G-01 waiver, decided by P-01 at CHG-005's close
  (C005-DOD-001; Q-opencode-01).
- **DOD-G-02** — `npm run check` passes on REF-WIN on the release commit (the check of goal G-6, ideation §4.1).
- **DOD-G-03** — applies to this repository's `.sdd/` after the change, including the approved and archived hand-offs
  that the install-line rule of C005-REQ-108 leaves out (C005-TS-124).
- **DOD-G-04** — applies to the CLI contract set in the Interfaces section of `spec.md`: the archive-task marker, the
  refusal of writing subcommands on an archived change, the two new lint findings, the install line, and the phase
  hash without the report fields of lite task sections (C005-REQ-121).
- **DOD-G-05** — applies to C005-NFR-001 (C005-DOD-008) and to the inherited NFR defaults named in `spec.md` § NFRs,
  among them 0 network connections from the CLI during the test suite.
- **DOD-G-06** — applies: `sdd archive 005` replaces C002-REQ-213, C001-REQ-913, C001-REQ-806 in their living files,
  adds the ADDED requirements to `_living/CAP-0-1-1-fixes.md`, merges `10-spec/40-domain/glossary-delta.md` into
  `_constitution/glossary.md`. The replacing entries carry the restated scenarios of C002-TS-219, C002-TS-220,
  C001-TS-806 and C001-TS-807 (`spec.md` § Acceptance, Restated living scenarios).
- **DOD-G-07** — applies to the defects of CHG-005 at the close of the change.
