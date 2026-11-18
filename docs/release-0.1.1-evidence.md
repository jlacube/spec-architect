# Release 0.1.1 — evidence (CHG-005)

Evidence of CHG-005 "0.1.1 fixes" (`.sdd/005-0-1-1-fixes/`): the dogfood of the lite hash rule, the size
figures of C005-DOD-004, the eval floor of DOD-G-01, and the release checks. Sections are added by the tasks
that own them (`.sdd/005-0-1-1-fixes/20-plan/plan.md`).

## Dogfood

C005-T-002 (C005-REQ-122): CHG-005 is a lite change whose G3 was approved with the sdd CLI 0.1.0. After
C005-T-001 (`deb770b`), every command ran the working-tree CLI `node plugins/architect/scripts/sdd.mjs`
from the repository root, 2026-11-17.

**Step 1: first stale check of the 0.1.1 hash rule** (`stale check 005`, exit 0), the live case of C005-TS-170:

```text
CHG-005 00-ideation: approved (hash matches)
CHG-005 10-spec: approved (hash matches)
CHG-005 20-plan: stale (hash changed)
```

**Steps 2–3:** `change revise 005 20-plan --reason "C005-REQ-122: re-approve G3 under the 0.1.1 hash rule"`; no
plan text changed. `lint 005 --phase 20-plan` first reported one error, LINT-TASK-001 on C005-T-001 ("empty Done
when"): the `task set` report of C005-T-001 had inserted its Commit, Notes and Completed at lines between the Done
when field and its checkboxes. The three lines were moved below the checkboxes by hand, in the form `task set`
writes them (hand-off, frontmatter fallback), which leaves the approval hash unchanged (C005-IF-005), and recorded
as defect D-001 of CHG-005. The lint then reported 0 findings. `gate show 005 20-plan` listed C005-T-001 as the
only modified ID, because the per-ID content hashes keep the report-field lines (C005-IF-005 §3). G3 approved
under P-01's standing approval of routine gates (2026-10-24), `66fad5b`, hash
`sha256:1a4aa77c32fd5408691b61498821f3026aceb9982bf11462fbbc310a0c5f1c1c`.

**Step 4: a task report after the approval, then the stale check**, the live case of C005-TS-171:
`task set C005-T-002 --status in-progress` (`todo → in-progress`), then `stale check 005`:

```text
CHG-005 00-ideation: approved (hash matches)
CHG-005 10-spec: approved (hash matches)
CHG-005 20-plan: approved (hash matches)
```

## Sizes

C005-DOD-004 (constitution, NFR defaults, Skill size: 24,000 characters per SKILL.md body, 64,000 per agent). Bodies as
PLG-SIZE-001 counts them (frontmatter removed, code points); the Copilot conductor as TGT-SIZE-001 counts it (the
inlined `## Skill:` sections of `npm run generate -- --target copilot`).

| Measure | Before C005-T-010 | After C005-T-010 |
|---|---|---|
| conductor body | 4656 | 4947 |
| phase-ideation SKILL.md body | 9296 | 11820 |
| interview-protocol SKILL.md body | 7270 | 7270 |
| conductor preloaded skills total | 43534 | 46058 |
| copilot inlined sdd-conventions | 9089 | 9089 |
| copilot inlined interview-protocol | 9148 | 9148 |
| copilot inlined options-analysis | 3716 | 3716 |
| copilot inlined gate-protocol | 8114 | 8114 |
| copilot inlined phase-ideation | 9294 | 11818 |
| copilot inlined phase-spec | 6300 | 6300 |
| copilot inlined phase-plan | 2087 | 2087 |
| copilot conductor inlined total | 47748 | 50272 |

After C005-T-012 (interview-protocol §5, pre-phase round; conductor item 6):

| Measure | After C005-T-012 |
|---|---|
| conductor body | 5027 |
| phase-ideation SKILL.md body | 11820 |
| interview-protocol SKILL.md body | 8134 |
| conductor preloaded skills total | 46922 |
| copilot inlined sdd-conventions | 9089 |
| copilot inlined interview-protocol | 10012 |
| copilot inlined options-analysis | 3716 |
| copilot inlined gate-protocol | 8114 |
| copilot inlined phase-ideation | 11818 |
| copilot inlined phase-spec | 6300 |
| copilot inlined phase-plan | 2087 |
| copilot conductor inlined total | 51136 |
