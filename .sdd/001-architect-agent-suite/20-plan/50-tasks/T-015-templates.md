---
id: C001-T-015
title: "Artifact templates (full and lite)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: done
depends_on: [C001-T-001]
implements: [C001-REQ-117]
satisfies_ac: [C001-AC-117.1]
verified_by: [C001-TS-123, C001-TC-123]
components: [C001-COMP-13]
risk_refs: []
estimate: M
report: { commit: 9e08f0f, completed_at: 2026-10-11, notes: "54 templates (full 46, lite 8) covering every file of C001-IF-06 §2/§3; override resolution from .sdd/_templates/<profile>/. C001-TC-123 checks the lite scaffold set against IF-06 §3 at module level; the sdd change new run belongs to C001-T-014. Entity templates (task, research note, OA, DEC, ADR, capability files, interfaces, sequences) carry placeholder file names for agents and later CLI commands." }
---

# C001-T-015 — Artifact templates (full and lite)

## Intent

Author the starting templates for every artifact type of both profiles, matching C001-IF-03 and C001-IF-06, with per-repository overrides from .sdd/_templates/.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/templates/full/**` | ideation, questions-log, research note, OA, DEC, spec files, NFR, domain, interfaces README/errors, architecture, constraints, DoD, plan files, task, test plan, risks, rollout, observability, handoff |
| add | `plugins/architect/templates/lite/**` | ideation.md, questions-log.md, spec.md, dod.md, plan.md, handoff.md |
| add | `src/workspace/templates.ts` | template resolution: .sdd/_templates override, else plugin default |

## Preconditions

- T-001
- Dependencies done: C001-T-001

## Step outline (no production code)

1. Derive each template from the CHG-001 artifacts (the reference examples), stripped of content.
2. Keep templates free of Claude-specific tool names (C001-REQ-1118).
3. Implement override resolution.

## Verification

- C001-TC-123 passes (lite scaffold exact file set)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Every file of C001-IF-06 §2/§3 has a template
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-015 --status done --commit <sha>` (or frontmatter fallback before T-026)
