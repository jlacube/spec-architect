---
id: C001-IF-06
artifact: spec/interface
kind: conventions
change: CHG-001
phase: 10-spec
status: approved
---

# C001-IF-06 — Workspace layout

## §1 Root

```text
.sdd/
├── SDD.md                 description file (C001-REQ-103)
├── registry.json          derived index (C001-IF-02)
├── _constitution/         constitution.md, toolchain.md, glossary.md
├── _living/               CAP-<slug>.md (C001-IF-03 §10)
├── _decisions/            cross-change ADRs (optional)
├── _templates/            per-repo template overrides (optional)
├── _archive/              archived change folders
├── <unknown entries>      preserved, reported as info (C001-REQ-124)
└── NNN-<slug>/            change folders (§2 or §3)
```

## §2 Full-profile change

```text
NNN-<slug>/
├── change.md, ids.json, approvals.json (after first approval), trace.json (generated)
├── 00-ideation/
│   ├── ideation.md, questions-log.md, critic-report.md
│   ├── research/R-*.md, options/OA-*.md, decisions/DEC-*.md
│   └── evidence/baseline-survey.md            (brownfield/mixed)
├── 10-spec/
│   ├── 00-index.md
│   ├── 10-context/{problem-and-goals, stakeholders-and-personas, scope, current-state}.md
│   ├── 20-capabilities/CAP-<nn>-<slug>/{stories, requirements, acceptance}.md (+ ui-notes.md optional)
│   ├── 30-nfr/*.md                           one or more files; NFR blocks by category
│   ├── 40-domain/{domain-model, state-machines, glossary-delta}.md
│   ├── 50-interfaces/README.md, errors.md, contract files (C001-IF-03 §9)
│   ├── 60-architecture/architecture.md, constraints.md, sequences/
│   ├── 70-dod.md
│   ├── 80-traceability.md                    generated
│   ├── 85-open-items.md                      generated
│   └── 90-critic-report.md
└── 20-plan/
    ├── 00-index.md, 10-strategy.md
    ├── 20-decisions/ADR-*.md (+ OA-*.md)
    ├── 30-impact/{blast-radius, hotspots, regression-set}.md   (brownfield/mixed)
    ├── 40-work-breakdown.md
    ├── 50-tasks/T-*.md
    ├── 60-test-plan.md, 70-risks.md, 75-rollout.md, 78-observability.md
    ├── 80-traceability.md, 85-open-items.md   generated
    ├── 90-critic-report.md
    └── handoff.md
```

Generated files (excluded from approval hashes): `trace.json`, `80-traceability.md`,
`85-open-items.md`. `approvals.json` and `ids.json` are state files at the change root and
are not part of any phase hash.

## §3 Lite-profile change

```text
NNN-<slug>/
├── change.md, ids.json, approvals.json, trace.json
├── 00-ideation/ideation.md, questions-log.md
├── 10-spec/spec.md        sections: Context, Stories, Requirements, Acceptance (with coverage table), NFRs, Domain notes, Interfaces, Architecture notes
├── 10-spec/dod.md
├── 20-plan/plan.md        sections: Strategy, Tasks (IF-03 §3 fields per task), Test mapping, Risks
└── 20-plan/handoff.md
```

Critic reports and generated files are added next to these files when produced. A lite
change is limited to one capability.
