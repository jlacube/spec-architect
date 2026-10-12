---
id: C001-T-061
title: "Plugin structure checks, license check, npm run check"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: done
depends_on: [C001-T-060]
implements: [C001-REQ-1113, C001-REQ-1114, C001-REQ-1117, C001-REQ-1118, C001-REQ-1120, C001-REQ-1122]
satisfies_ac: [C001-AC-1113.1, C001-AC-1114.1, C001-AC-1117.1, C001-AC-1118.1, C001-AC-1120.1, C001-AC-1122.1]
verified_by: [C001-TS-1114, C001-TS-1115, C001-TS-1118, C001-TS-1119, C001-TS-1121, C001-TS-1123, C001-TC-1114, C001-TC-1115, C001-TC-1118, C001-TC-1119, C001-TC-1121, C001-TC-1123]
components: [C001-COMP-12]
risk_refs: []
estimate: M
report: { commit: "1569904", completed_at: 2026-10-12, notes: "npm run check green on REF-WIN; structure checks 0 errors, 36 pending (owned by T-062/T-063/T-064/T-076)" }
---

# C001-T-061 — Plugin structure checks, license check, npm run check

## Intent

Implement the PLG-* checks of C001-IF-08 §3 (PLG-SIZE-001 in characters per C001-NFR-105: ≤ 24,000 per skill, ≤ 64,000 per agent; PLG-TOOLS-001 against the plugin-scoped names of C001-IF-09), the bundled-dependency license allowlist with THIRD_PARTY_NOTICES.md generation, and the aggregate `npm run check`.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/check/*.mjs` | one module per PLG code |
| add | `scripts/licenses.mjs` | esbuild metafile → package licenses → allowlist → notices |
| modify | `package.json` | `check` = validate + tests + lint fixtures + structure checks |

## Preconditions

- T-060
- Dependencies done: C001-T-060

## Step outline (no production code)

1. Implement checks.
2. Generate notices.
3. Wire npm run check.

## Verification

- C001-TC-1114, 1115, 1118, 1119, 1121, 1123 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] `npm run check` green on REF-WIN
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-061 --status done --commit <sha>` (or frontmatter fallback before T-026)
