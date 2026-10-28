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
| 2 | `architect-sdd` on npm | P-01 runs `npm publish dist/architect-sdd-<version>.tgz` from the account recorded by C002-T-003 (C002-ADR-004), then checks `npm view architect-sdd version` | Published **before or together with** the first target release, and again for every later target release whose version it does not have yet: each generated doctor requires the exact version (C002-REQ-509). From revision D-036 on, a task of its own publishes it, C002-T-075, apart from any target release. In CHG-002 that is `architect-sdd@0.0.3`, after a `released` Copilot dry run and before or with the Copilot release, the OpenCode release having moved to CHG-003 (`10-strategy.md` §2). CHG-003 publishes the version of its OpenCode release by the same steps. Never published when no target passes the release check | C002-T-003, C002-T-023, C002-T-075, C002-T-055 |
| 3 | OpenCode target package | **Zip in `dist/`** (Q-release-01): P-01 shares `dist/architect-opencode-<version>.zip` (built by C002-T-034 from `dist/opencode/`, compared with the regenerated package by the release check) the way the Claude Code zips are shared today; release record under `docs/releases/opencode/<version>/` with the zip's SHA-256 in `zip.sha256` | The release check passes for this target on its own (C002-T-047); `architect-sdd` of the same version is on npm; does not wait for any Copilot release task (C002-T-050, C002-T-054, C002-T-055, C002-T-057). **Moved to CHG-003** (revision D-036; P-01 answers to Q-opencode-defer-01 and Q-opencode-scope-01): 0.0.1 and 0.0.2 are refused, C002-T-051 and C002-T-052 are dropped, and CHG-002 shares no OpenCode zip | C002-T-034, C002-T-047, C002-T-049, C002-T-051, C002-T-052 |
| 3 | Copilot target package | **Zip in `dist/`** (Q-release-01): P-01 shares `dist/architect-copilot-<version>.zip` built from `dist/copilot/`; release record under `docs/releases/copilot/<version>/` with `zip.sha256`; flagged under C002-DEC-005 when the hooks fallback is in use (C002-REQ-622) | As for OpenCode, plus the checklist record (C002-T-050); refused while the S-08 record is `deferred` (§5) | C002-T-034, C002-T-047, C002-T-050, C002-T-054, C002-T-055, C002-T-057 |

The two targets are decided independently: a refused target is not released and its refusal stays
recorded; the other target still ships. Each target has its own evidence, clean-profile and release
tasks (`10-strategy.md` §2), so no Copilot evidence or release task holds back the OpenCode release;
the shared tooling named in `40-work-breakdown.md` ("Critical path") still does.

**Retention of released zips.** P-01 keeps every released zip, unchanged, where P-01 shares it, and
the release record folder holds its SHA-256 (`zip.sha256`). A lost zip is rebuilt at the release
commit of its record (generation is deterministic, C002-NFR-301) and checked file by file against the
generation manifest of the record; the zip container itself is not byte-identical across builds.

## 2. Migration

| Step | What | Task |
|---|---|---|
| MIG-1 | Version source moves from `package.json` to `plugin.json`; `package.json` keeps an equal version, checked by test | C002-T-004 |
| MIG-2 | Claude Code staging leaves out `plugins/architect/targets/` before the first mapping table exists | C002-T-015 |
| MIG-3 | Guard corpora gain the replay fields; existing cases keep their expectations (regression-set §4.1) | C002-T-007 |
| MIG-4 | Claude Code adopters: no migration. Serena keeps its per-user data folder (C002-IF-007); `sdd serena-config <folder>` keeps today's behaviour | C002-T-010, C002-T-013 |
| MIG-5 | OpenCode and Copilot adopters: new installs only, following the install notes of each package; no earlier release exists. Copilot adopters run `sdd install copilot --package <folder>` once per repository, and again after the package moves or changes version (C002-IF-005 §5); a later install replaces only the files and server entries its install record recognises (C002-REQ-324) | C002-T-029, C002-T-031, C002-T-039, C002-T-058 |

## 3. Feature flags

None. The enforcement mode of each target (`native-permissions`, `sdd-mcp-server`, `copilot-hooks`) is a
mapping-table value set at generation time from the spike records (C002-IF-009 §3), not a runtime
flag. Changing it means regenerating and passing the release check again (C002-RB-005).

## 4. Rollback

| ID | Situation | Steps | Linked |
|---|---|---|---|
| C002-RB-001 | A published `architect-sdd` version is defective | npm versions are immutable. P-01 runs `npm deprecate architect-sdd@<version> "<reason>"` and moves the tag back with `npm dist-tag add architect-sdd@<previous> latest`. The owning task is reopened, and a patch version is published through C002-T-052 with its install smoke test (C002-T-023). Unpublish only inside npm's unpublish window and only when no released target package requires that version | C002-T-023, C002-T-052 |
| C002-RB-002 | A released OpenCode target package misbehaves | 1. P-01 stops sharing the released `architect-opencode-<version>.zip` and names the version, the reason and the replacement in the README section. 2. If an earlier OpenCode release exists, P-01 shares its retained zip again (its SHA-256 equals its `zip.sha256`; if lost, rebuild at its release commit as §1 says) and points the README section and install notes to it. 3. A **first release can only be withdrawn**: no earlier zip exists, so adopters are told to remove the package (C002-RB-006) until the fix is released. 4. The fix goes through the owning task and a new release check (C002-T-047, C002-T-052); its `architect-sdd` version stays installable (C002-RB-001 if the CLI is at fault) | C002-T-034, C002-T-047, C002-T-052 |
| C002-RB-003 | A released Copilot target package misbehaves | As C002-RB-002 for `architect-copilot-<version>.zip`, with C002-T-055 for the new release; under the hooks fallback P-01 also re-runs the checklist (C002-T-050) before a new release | C002-T-033, C002-T-050, C002-T-055 |
| C002-RB-004 | The shared guard or CLI changes of C002-M-02 break Claude Code work | Reinstall the previous plugin version as in C001-RB-001 (previous commit of `plugins/architect`, rebuild, reinstall from the local marketplace). Revert the guard task's commit and reopen the task with `sdd task set <T-ID> --status in-progress`. If C002-T-008 is reverted, D-011 of CHG-001 is reopened (`sdd defect reopen`) | C002-M-02, C002-T-008, C002-T-009, C002-T-010 |
| C002-RB-005 | After release, the OpenCode permission rules turn out not to follow a guard rule (C002-T-043's glob-gap list grows) | Switch the OpenCode mapping table to `sdd-mcp-server` (architecture §6.2; Q-safety-03), regenerate, re-run the replay for that mechanism, pass the release check and release a new version | C002-T-030, C002-T-043, C002-T-047 |
| C002-RB-006 | An adopter must remove a generated target | Reverse the placement step of the package's install notes: remove the package's `.opencode/` files and its `opencode.json` entries (OpenCode); or (VS Code) remove its `chat.pluginLocations` entry and, in each repository, the files (the agents and the workspace hook file `.github/hooks/architect-guard.json`) and `.vscode/mcp.json` server entries that `.github/architect-install.json` lists with their present SHA-256 (an entry edited since the install is the adopter's and stays), then the install record itself; then `npm uninstall -g architect-sdd` if no other target uses it. Per-user Serena data stays outside the repository (C002-IF-007) | C002-T-029, C002-T-031, C002-T-039, C002-T-058 |

## 5. Copilot defer branch

Not taken: the signed-off S-08 record (C002-T-002, 2026-10-17) gives `enforcement_mode:
sdd-mcp-server` on the tested hosts of scope §3.1. This branch applies only if a later S-08 record
for a new tested version (C002-REQ-621) gives `deferred`; step 3 then also drops C002-T-058.

If an S-08 record gives `enforcement_mode: deferred`:

1. The implementer raises a spec defect (`sdd defect add --ref C002-CAP-03 --summary "…"`) that cites
   the record. Work on tasks that need no Copilot value continues (`10-strategy.md` §1).
2. The conductor runs `/architect:revise spec` with P-01 under scope §1.1 (Q-defer-01). The revision
   removes C002-CAP-03, C002-SC-02 and the Copilot DoD items and reviews every item that names the
   Copilot target.
3. After the new G2 approval, the plan revision drops C002-T-031, C002-T-032, C002-T-033, C002-T-045,
   C002-T-046, C002-T-050, C002-T-054, C002-T-055 and C002-T-057. It removes the Copilot parts of
   C002-T-024, C002-T-034, C002-T-035, C002-T-039, C002-T-041 and C002-T-047, and the Copilot
   dependencies of C002-T-047 and C002-T-048 (`10-strategy.md` §4), then goes through G3 again.
4. Until that revision the release check refuses the Copilot target (C002-REQ-620). OpenCode, the
   Claude Code plugin and `architect-sdd` ship as in §1.

## 6. Communication

P-01 is the release owner and the only approver. Adopters (P-03) learn of a release through the
README target sections (C002-T-039), the install notes of each package and the npm page of
`architect-sdd`. Release records, refusals and the checklist record stay under `docs/releases/` and
`docs/checklists/records/`. A withdrawal (C002-RB-002, C002-RB-003) or deprecation (C002-RB-001)
names the version, the reason and the replacement in the README section of the target.
