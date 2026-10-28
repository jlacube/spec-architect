---
id: C002-T-074
title: "Fix for revision D-036: package version 0.0.3 after the CHG-001 D-020 fix"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-073]
implements: [C002-REQ-509, C002-REQ-617]
satisfies_ac: [C002-AC-509.1, C002-AC-617.1]
verified_by: [C002-TS-620, C002-TC-620]
components: [C002-COMP-006, C002-COMP-009]
risk_refs: [C002-RISK-019, C002-RISK-036]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-074 — Fix for revision D-036: package version 0.0.3 after the CHG-001 D-020 fix

## Intent

In C002-T-071 at 0.0.2, 21 of 23 Copilot CLI sessions passed. `INJ-19` and `INJ-21` read acted
upon: run with `--no-ask-user`, the conductor refused to present the gate without its question tool,
before it read the planted file (commit c54c3fe). Copilot 0.0.2 is therefore refused (ERR-REL-002;
defect D-036). The cause is CHG-001 defect D-020. P-01 answered Q-noask-01 with "Text fallback +
0.0.3 (Recommended)": the conductor asks its question or presents the gate as plain text and ends
its turn. CHG-001's C001-T-084 fixes that in the conductor's source text.

Both 0.0.2 entries are final for 0.0.2 (C002-IF-010 §5.2 rule 3), so the packages move to version
**0.0.3** after that fix. C002-T-071 then retakes the Copilot CLI evidence at 0.0.3.

The task runs **no paid session**. It is the same kind of step as the 0.0.2 move of C002-T-073.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/.claude-plugin/plugin.json`, `package.json` › `version` | `0.0.2` → `0.0.3`. `plugin.json` is the single version source (C002-T-004), and `package.json` equals it by test. Every generated manifest, `architect-sdd`, the target zips and the doctor's version check follow from them (C002-REQ-509) |
| modify | `docs/runsheets/README.md`, `T-050-vscode-checklist.md`, `T-055-copilot-release.md`, `T-057-copilot-clean-profile.md`, and the npm-publish part of `T-052-publish-and-opencode-release.md` | the version, the zip and tarball names, the record names and the `docs/releases/copilot/<version>/` paths move to 0.0.3. The runsheet of the `architect-sdd` publication (C002-T-075) names 0.0.3. The OpenCode runsheets (`T-051-opencode-clean-profile.md`, the OpenCode part of `T-052-…`) name no version and carry the line "moved to CHG-003" (plan critic CR-87; `../10-strategy.md` §2). The 0.0.1 and 0.0.2 release folders stay as they are |

## Preconditions

- **Cross-change: C001-T-084 done** (plan critic CR-86). That CHG-001 task fixes D-020, the text
  fallback of the conductor without a question tool (P-01 answer to Q-noask-01). Its commit changes
  the source files that both packages are generated from, so this task moves the version after it.
  The direction: this task waits for C001-T-084, and C002-T-071 waits for this task. The conductor
  confirms C001-T-084 with `sdd status`. The edge lives on the CHG-002 side only, since C001-T-084
  belongs to CHG-001's plan (`../handoff.md`).
- C002-T-073 done (the move to 0.0.2, and the `INJ-21` session cap).
- G2 re-approved after the D-036 revision, and G3 after this plan revision (gate records of
  `../../change.md`).

## Step outline (no production code)

1. Change `plugin.json` and `package.json`, and the runsheets of the Targets table.
2. Run `npm run build` and `npm run package`. The generated packages, `architect-sdd-0.0.3.tgz` and
   `dist/architect-copilot-0.0.3.zip` all give 0.0.3, and the conductor text in `dist/copilot/` holds
   the CHG-001 D-020 fallback.
3. Run `npm test` (the version-equality test of `tests/smoke.test.ts`) and `npm run check`.
4. Report the commit and the version, and tell the conductor so that C002-T-071 can retake the
   Copilot CLI evidence at 0.0.3.

## Verification

- `npm run build`, `npm run package`, `npm test`, `npm run check`

## Done when

- [ ] `plugin.json` and `package.json` give 0.0.3, and `npm run package` writes the 0.0.3 packages, the Copilot zip and the tarball, after the CHG-001 D-020 fix
- [ ] The Copilot and npm runsheets name 0.0.3, and the OpenCode runsheets say "moved to CHG-003"; the 0.0.1 and 0.0.2 release folders are unchanged
- [ ] `npm test` and `npm run check` green, and no paid session ran
- [ ] Progress reported: `sdd task set C002-T-074 --status done --commit <sha>`
