---
id: C001-IF-03
artifact: spec/interface
kind: conventions
change: CHG-001
phase: 10-spec
status: draft
---

# C001-IF-03 — Artifact frontmatter and entry formats

## §1 Common artifact frontmatter

Every markdown artifact under a change starts with YAML frontmatter:

| Field | Required | Type / values |
|---|---|---|
| `id` | yes | artifact ID (e.g. `C004-CAP-01`, `C004-SPEC-NFR`) |
| `artifact` | yes | artifact type path, e.g. `spec/requirements`, `plan/task` |
| `change` | yes | `CHG-NNN` |
| `phase` | yes | `00-ideation` \| `10-spec` \| `20-plan` |
| `status` | yes | phase-status values (C001-IF-02 `phaseStatus`) |
| `capability` | capability files | capability title |
| `traces_to` | optional | list of IDEA-§, Q, OQ or ID references |
| `generated` | generated files | `true` for `80-traceability.md`, `85-open-items.md` |

## §2 `change.md`

```yaml
id: CHG-004
title: Add SEPA direct debit
kind: brownfield            # greenfield | brownfield | mixed
profile: full               # lite | full
status: active              # active | stopped | archived
phase: 10-spec
phases:
  00-ideation: { status: approved, approved_hash: "sha256:…", approved_at: 2026-11-02, approved_by: jerome }
  10-spec:     { status: draft }
  20-plan:     { status: not-started }
implementation: { status: not-started }
stopped: null               # { reason, date } when status = stopped
owners: [jerome]
defects: []                 # list of C001-IF-02 defect objects
waivers: []                 # list of C001-IF-02 waiver objects
```

Body sections: `## Index` (links to phase folders), `## Gate log` (table: Date, Gate,
Decision, Words of approver, Waivers, Usage).

### §2.3 Implementation status derivation

Defined in `../40-domain/state-machines.md` §5 (rules 1–5).

## §3 Task frontmatter (`20-plan/50-tasks/T-*.md`)

```yaml
id: C004-T-031
title: Add expiry validation to payment-method selection
milestone: C004-M-2
status: todo                # todo | in-progress | blocked | done | dropped
depends_on: [C004-T-029]
implements: [C004-REQ-012]
satisfies_ac: [C004-AC-012.1, C004-AC-012.2]
verified_by: [C004-TS-040, C004-TC-077]
components: [C004-COMP-03]
risk_refs: [C004-RISK-004]
estimate: M                 # S | M | L
report: { commit: null, completed_at: null, notes: null }
```

Body sections, in order: Intent, Targets (table: Kind ∈ add/modify/delete/rename, Target
`path › symbol`, Change), Preconditions, Step outline (no production code), Verification
(runnable steps), Done when (checkboxes).

## §4 `ids.json` and `approvals.json`

```json
{
  "change": "CHG-004",
  "allocated": { "US": 12, "REQ": 41, "TS": 97, "T": 26 },
  "blocks": [ { "type": "REQ", "from": 101, "to": 199, "capability": "CAP-01" } ],
  "tombstones": [ { "id": "C004-REQ-020", "reason": "merged into REQ-019", "date": "2026-11-05" } ]
}
```

```json
{
  "10-spec": {
    "hash": "sha256:…",
    "approved_at": "2026-11-06",
    "ids": { "C004-REQ-012": "sha256:…", "C004-AC-012.1": "sha256:…" }
  }
}
```

AC IDs are not allocated through `ids.json`; they derive from their requirement
(`AC-<req-seq>.<n>`).

## §5 Ideation artifact templates

- **Research note** `R-<seq>-<slug>.md`: headings Question, Method, Findings, Confidence,
  Implications, Conflicting evidence, Follow-up questions. Each finding is a bullet:
  `- <finding> — sources: <url> (<YYYY-MM-DD>)[, …] — confidence: <high|medium|low> (<reason>)`.
- **Option analysis** `OA-<seq>-<slug>.md`: headings Problem, Criteria (table name/weight),
  Candidates, Scores (table: candidate, one column per criterion, Weighted), Sensitivity,
  Presented, Recommendation, Rejected.
- **Decision record** `DEC-<seq>-<slug>.md`: headings Context, Decision, Options considered,
  Consequences, Decided (date, decider, words verbatim).
- **Questions log** `questions-log.md`: one `## Round <n> — <date>` section per round; each
  question rendered from C001-IF-05 with its answer.

## §6 Story and requirement entry formats

As used throughout this spec (see any `CAP-*/stories.md` and `requirements.md`). Story
fields: As a, I want, So that, Value / outcome, Priority · Size hint · Capability, Context &
notes, Out of scope (when applicable), Requirements, Traces to. Requirement fields: Delta
(non-greenfield), Pattern, Statement, Rationale, Stories, Priority, Acceptance, Evidence
(MODIFIED/REMOVED), Open items (optional).

## §7 Acceptance coverage checklist

Columns of the coverage table (C001-REQ-412): `happy`, `alternate`, `boundary`, `error`,
`authorization`, `concurrency/idempotency`, `abuse`. A cell holds TS IDs, `n/a: <reason>`,
or `n/a` when a per-column reason is given in a note directly below the table.

## §8 DoD evidence types

`test-report` (automated test run output), `coverage-report`, `benchmark-report`,
`command-output`, `screenshot`, `link` (URL to PR, CI run or doc), `review-record`
(named reviewer and date), `metric-snapshot`.

## §9 Interface kinds and formats

| Kind | Format | File naming |
|---|---|---|
| HTTP API | OpenAPI 3.1 | `openapi.yaml` |
| JSON document | JSON Schema 2020-12 | `<name>.schema.json` |
| Event stream | AsyncAPI 3.0 | `events.asyncapi.yaml` |
| CLI | CLI contract template: headings Synopsis, Commands, Exit codes, Output | `<name>-cli.md` |
| Conventions (file formats, protocols without a standard) | Markdown with numbered sections | `<name>.md` |

## §10 Living-spec file format (`_living/CAP-<slug>.md`)

Frontmatter: `capability`, `inventory_only` (boolean), `updated` (date). Sections: Purpose,
Entry points, Main modules, Owning tests, Evidence (inventory part); Requirements
(requirement entries with their ACs and scenarios); History (table: ID, Event, Change, Date,
Note).

## §11 Evidence entry format

```markdown
- **E-<n>** `src/checkout/payments.ts:118` › `createIntent()` — <claim>
  - layer: ripwire | serena | lsp | grep | ast-grep · confidence: high | medium | low
  - commit: <HEAD sha> · pattern: <ast-grep pattern, if any>
  - disclosures: <text or "none">
```
