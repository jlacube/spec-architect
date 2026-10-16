---
id: C002-PLAN-ROLLOUT
artifact: plan/rollout
change: CHG-002
phase: 20-plan
status: draft
---

# CHG-002 — Rollout, migration and rollback

## 1. Release model and publish order

Three deliverables leave `npm run package` at one commit and carry the version of
`plugins/architect/.claude-plugin/plugin.json`, the single version source (C002-ADR-004, C002-T-004).

| Order | Deliverable | Channel | Condition | Task |
|---|---|---|---|---|
| 1 | Claude Code plugin | Unchanged path: the local marketplace of this repository and the Claude Code zips of `npm run package`, as in CHG-001 (C001-RB-001). The only behaviour change is the bash guard of C002-M-02 (scope §2, C002-GOAL-05) | `npm run check` green and the regression run recorded (C002-T-048, C002-DOD-022) | C002-T-015, C002-T-048 |
| 2 | `architect-sdd` on npm | P-01 runs `npm publish dist/architect-sdd-<version>.tgz` from the account recorded by C002-T-003 (C002-ADR-004), then checks `npm view architect-sdd version` | Published **before or together with** the first target release, and again for every later target release whose version it does not have yet: each generated doctor requires the exact version (C002-REQ-509). Never published when no target passes the release check | C002-T-003, C002-T-023, C002-T-052 |
| 3 | OpenCode target package (`dist/opencode/`) | Release by P-01 with its release record under `docs/releases/opencode/<version>/` | The release check passes for this target on its own (C002-T-047); `architect-sdd` of the same version is on npm | C002-T-047, C002-T-052 |
| 3 | Copilot target package (`dist/copilot/`) | Release by P-01 with its release record under `docs/releases/copilot/<version>/`; flagged under C002-DEC-005 when the hooks fallback is in use (C002-REQ-622) | As for OpenCode; refused while the S-08 record is `deferred` (§5) | C002-T-047, C002-T-052 |

The two targets are decided independently: a refused target is not released and its refusal stays
recorded; the other target still ships.

## 2. Migration

| Step | What | Task |
|---|---|---|
| MIG-1 | Version source moves from `package.json` to `plugin.json`; `package.json` keeps an equal version, checked by test | C002-T-004 |
| MIG-2 | Claude Code staging leaves out `plugins/architect/targets/` before the first mapping table exists | C002-T-015 |
| MIG-3 | Guard corpora gain the replay fields; existing cases keep their expectations (regression-set §4.1) | C002-T-007 |
| MIG-4 | Claude Code adopters: no migration. Serena keeps its per-user data folder (C002-IF-007); `sdd serena-config <folder>` keeps today's behaviour | C002-T-010, C002-T-013 |
| MIG-5 | OpenCode and Copilot adopters: new installs only, following the install notes of each package; no earlier release exists | C002-T-029, C002-T-031, C002-T-039 |

## 3. Feature flags

None. The enforcement mode of each target (`native-permissions`, `sdd-mcp-server`, `copilot-hooks`) is a
mapping-table value set at generation time from the spike records (C002-IF-009 §3), not a runtime
flag. Changing it means regenerating and passing the release check again (C002-RB-005).

## 4. Rollback

| ID | Situation | Steps | Linked |
|---|---|---|---|
| C002-RB-001 | A published `architect-sdd` version is defective | npm versions are immutable. P-01 runs `npm deprecate architect-sdd@<version> "<reason>"` and moves the tag back with `npm dist-tag add architect-sdd@<previous> latest`. The owning task is reopened, and a patch version is published through C002-T-052 with its install smoke test (C002-T-023). Unpublish only inside npm's unpublish window and only when no released target package requires that version | C002-T-023, C002-T-052 |
| C002-RB-002 | A released OpenCode target package misbehaves | P-01 withdraws the release and points the README section and install notes to the previous released version. That package is rebuilt at its release commit (generation is deterministic, C002-NFR-301) and matches its release record. The fix goes through the owning task and a new release check; its `architect-sdd` version stays installable (C002-RB-001 if the CLI is at fault) | C002-T-047, C002-T-052, C002-M-07 |
| C002-RB-003 | A released Copilot target package misbehaves | As C002-RB-002 for `dist/copilot/`; under the hooks fallback P-01 also re-runs the checklist (C002-T-050) before a new release | C002-T-033, C002-T-050, C002-T-052 |
| C002-RB-004 | The shared guard or CLI changes of C002-M-02 break Claude Code work | Reinstall the previous plugin version as in C001-RB-001 (previous commit of `plugins/architect`, rebuild, reinstall from the local marketplace). Revert the guard task's commit and reopen the task with `sdd task set <T-ID> --status in-progress`. If C002-T-008 is reverted, D-011 of CHG-001 is reopened (`sdd defect reopen`) | C002-M-02, C002-T-008, C002-T-009, C002-T-010 |
| C002-RB-005 | After release, the OpenCode permission rules turn out not to follow a guard rule (C002-T-043's glob-gap list grows) | Switch the OpenCode mapping table to `sdd-mcp-server` (architecture §6.2; Q-safety-03), regenerate, re-run the replay for that mechanism, pass the release check and release a new version | C002-T-030, C002-T-043, C002-T-047 |
| C002-RB-006 | An adopter must remove a generated target | Reverse the placement step of the package's install notes: remove the package's `.opencode/` files and its `opencode.json` entries (OpenCode), or its `chat.pluginLocations` entry (VS Code); then `npm uninstall -g architect-sdd` if no other target uses it. Per-user Serena data stays outside the repository (C002-IF-007) | C002-T-029, C002-T-031, C002-T-039 |

## 5. Copilot defer branch

If the S-08 record (C002-T-002) gives `enforcement_mode: deferred`:

1. The implementer raises a spec defect (`sdd defect add --ref C002-CAP-03 --summary "…"`) that cites
   the record. Work on tasks that need no Copilot value continues (`10-strategy.md` §1).
2. The conductor runs `/architect:revise spec` with P-01 under scope §1.1 (Q-defer-01). The revision
   removes C002-CAP-03, C002-SC-02 and the Copilot DoD items and reviews every item that names the
   Copilot target.
3. After the new G2 approval, the plan revision drops C002-T-031, C002-T-032, C002-T-033, C002-T-045,
   C002-T-046 and C002-T-050. It removes the Copilot parts of C002-T-024, C002-T-034, C002-T-035,
   C002-T-039, C002-T-041, C002-T-047 and C002-T-052 (`10-strategy.md` §4), then goes through G3 again.
4. Until that revision the release check refuses the Copilot target (C002-REQ-620). OpenCode, the
   Claude Code plugin and `architect-sdd` ship as in §1.

## 6. Communication

P-01 is the release owner and the only approver. Adopters (P-03) learn of a release through the
README target sections (C002-T-039), the install notes of each package and the npm page of
`architect-sdd`. Release records, refusals and the checklist record stay under `docs/releases/` and
`docs/checklists/records/`. A withdrawal (C002-RB-002, C002-RB-003) or deprecation (C002-RB-001)
names the version, the reason and the replacement in the README section of the target.
