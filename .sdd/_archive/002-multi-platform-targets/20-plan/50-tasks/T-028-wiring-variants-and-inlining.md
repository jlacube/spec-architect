---
id: C002-T-028
title: "Wiring variants, anchors and skill inlining"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-04
status: done
depends_on: [C002-T-027]
implements: [C002-REQ-109, C002-REQ-111, C002-REQ-112, C002-REQ-113]
satisfies_ac: [C002-AC-109.1, C002-AC-111.1, C002-AC-112.1, C002-AC-113.1]
verified_by: [C002-TS-115, C002-TS-117, C002-TS-118, C002-TS-119, C002-TS-120, C002-TS-121, C002-TS-122, C002-TS-123, C002-TC-115, C002-TC-117, C002-TC-118, C002-TC-119, C002-TC-120, C002-TC-121, C002-TC-122, C002-TC-123]
components: [C002-COMP-001, C002-COMP-002, C002-COMP-016]
risk_refs: []
estimate: L
report: { commit: 08a61b2, completed_at: 2026-10-18, notes: "Variants + skill inlining; TC-115/117/118/119/120/123 + generator part of TC-121, TC-107 CLI row, TC-134 inlined-body clause; TC-122 and PLG-SIZE part of TC-121 to T-035; interview/gate/doctor/toolchain variants are drafts for T-037/T-038; three extra anchors (gate-protocol wiring line, doctor task-tools and probe/report blocks) — add to D-010 batch; frontmatter mentions of Claude (doctor description, conductor claude --agent) not covered by body variants" }
---

# C002-T-028 — Wiring variants, anchors and skill inlining

## Intent

Replace every wiring anchor of an agent, command or skill with the target's variant (C002-REQ-111).
Anchors are the "Claude Code wiring" sections, the CLI invocation lines, the command guard line and
the other anchors of C002-IF-001 §2–§3. A missing variant stops generation (C002-REQ-112). The variants
live under `plugins/architect/targets/<target>/wiring/` and never in the files Claude Code loads
(C002-REQ-113). Preloaded skills are inlined into the agent body (C002-REQ-109).

**Follow-up (revision D-018 … D-020), not a reopening.** Defect D-020 item 1 (found in C002-T-056:
OpenCode 1.18.31's `glob` lists no file inside `.sdd/`) and P-01's answer to Q-opencode-glob-01
("Guide agents") add the construct `glob-prose` and the fourteenth variant `file-inspection` of the
sdd-conventions file-inspection lines (C002-IF-001 §2, §2.1, §6.1 Dot folders). The tables, the two
variant texts, the stand-in detector, C002-TC-673, C002-TC-674 and the `fx-plugin-novariant-glob`
row of C002-TC-120 are done by C002-T-065.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `scripts/generate/translate/wiring.ts` | anchor detection by section heading or exact line; variant lookup; ERR-GEN for a missing variant with file, line, target |
| add | `scripts/generate/translate/inline.ts` | inline the bodies of the skills listed in `skills`, in list order |
| add | `plugins/architect/targets/opencode/wiring/*.md`, `plugins/architect/targets/copilot/wiring/*.md` | variants for: CLI invocation lines (`sdd`), the command guard line, research-protocol and code-discovery wiring sections; first drafts of the interview-protocol and gate-protocol sections (C002-T-037 completes them) and of the doctor rows and toolchain record (C002-T-038 completes them) |
| add | `tests/integration/cap01/wiring.test.ts` | the listed scenarios; source files byte-unchanged |

## Preconditions

- C002-T-027 done.

## Step outline (no production code)

1. Find the anchors listed in `30-impact/blast-radius.md` §3.5. Each one becomes a required anchor of
   the tables (C002-IF-001 §3).
2. Write each variant as plain Markdown in `targets/`. Leave the source agent, command and `SKILL.md`
   text untouched (C002-CON-10).
3. Inline after variant replacement, so that the inlined skills are already translated.
4. Run `npm run generate` on the real plugin: 0 diagnostics for both targets.

## Verification

- `npm test -- cap01` and `npm test -- cap02` (the source-plugin tests stay green)
- `npm run generate -- --out <tmp>`

## Done when

- [ ] Every anchor has a variant for both targets; `git diff` shows no change under `agents/`, `commands/`, `skills/`
- [ ] Progress reported: `sdd task set C002-T-028 --status done --commit <sha>`
