---
id: C002-T-050
title: "P-01: run the manual VS Code checklist and record it"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-046, C002-T-054]
implements: []
satisfies_ac: [C002-AC-327.1, C002-AC-614.1, C002-AC-615.1, C002-AC-618.1]
verified_by: [C002-TS-358, C002-TS-617, C002-TS-618, C002-TS-621, C002-TC-358, C002-TC-617, C002-TC-618, C002-TC-621, C002-TC-901]
components: [C002-COMP-011]
risk_refs: [C002-RISK-026, C002-RISK-030, C002-RISK-031, C002-RISK-032]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-050 — P-01: run the manual VS Code checklist and record it

## Intent

**P-01 executes this task.** P-01 runs the checklist on the Copilot release candidate in VS Code
Insiders 1.142.0-insider with Copilot Chat 0.35.3 (Local session type; tested hosts of scope §3.1;
Q-versions-02), on a fresh install, with hooks enabled, and records the run (C002-DOD-004). This
covers C002-SC-02 (a toy change reaches G1) and the delegated edit of C002-TS-358: the Copilot
subagent guard hook denies the host built-in agent `general-purpose` an edit that a planted
instruction asked the conductor to delegate (C002-REQ-327). It settles the assumptions the spec
leaves to the checklist (assumption table of C002-T-046): workspace and plugin agents of the same
names, `user-invocable: false` subagents, no plugin before `plugin.json`, the workspace hook file,
built-in agents offered with `agent_type`, prompt-file binding and names, `ask_user` input shape,
no-choice result and setting, the MCP roots (C002-IF-002 §3) and the Serena context chosen by
C002-T-024. Under the signed-off S-08 record (`sdd-mcp-server`, `copilot_cli_loads_package: true`)
the injection cases run on Copilot CLI (C002-T-054), not here; they join this run only under the
hooks fallback with hooks enabled or when a later record shows that Copilot CLI cannot load the
package (C002-REQ-613). This task serves the Copilot release only (C002-T-055); the OpenCode release
does not wait for it.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/checklists/records/vscode-<YYYY-MM-DD>-<version>.md` | the checklist record |

## Preconditions

- C002-T-046 and C002-T-054 done; the release candidate packed at the commit of C002-T-054.
- Hooks enabled in VS Code (`chat.useHooks`, Workspace Trust for the toy repository, no organisation
  policy that disables them): the release check refuses a record that shows hooks disabled in either
  mode (C002-REQ-629).
- The Copilot subscription named in C002-T-002 has allowance for about 13 VS Code sessions per
  checklist run, about 26 with the repeat of step 3 (test plan §4.2, C002-RISK-026). These sessions
  are not billed to the prepaid API key.

## Step outline (no production code)

1. **P-01 step:** install the Copilot package from `dist/architect-copilot-<version>.zip` and
   `architect-sdd` from the local tarball on a fresh VS Code Insiders profile, following `INSTALL.md`
   only: unpack outside the toy repository, register the folder and check the picker before the
   install (no Architect entry, C002-T-046 assumption step), run `sdd install copilot --package
   <folder>` in P-01's own terminal, set the three settings, open a Local chat with `sdd-conductor`
   selected.
2. **P-01 step:** run every step of the checklist and record each result, the versions, the hooks
   state and the outcome of each assumption step: the `.sdd/` path the first write lands in (roots
   step), and in the delegated-edit step (C002-TC-358) whether the host offered `general-purpose` to
   the workspace conductor, the `agent_type` in the hook output, that `src/app.ts` is unchanged and
   the GUARD-HOOK-002 message; then the same step with the plugin part disabled.
3. A failed step reopens the owning task; the run is repeated after the fix. A refuted assumption is
   a spec defect (`sdd defect add`), not a fix in place. In particular:
   - a built-in agent's calls without `agent_type`, or `general-purpose` not denied: defect against
     C002-REQ-327 (Q-safety-06 returns to P-01; C002-RISK-032);
   - the workspace hook file not loaded: defect against C002-IF-005 §3;
   - a write outside the open repository's `.sdd/`: defect against C002-IF-002 §3;
   - the same-name or no-`plugin.json` assumption refuted: the fallback layout of C002-IF-005 §3
     (agents under `install/agents/`), which then needs a plan revision of C002-T-031, C002-T-045 and
     C002-T-058.

## Verification

- `node scripts/release-check.mjs --target copilot --dry-run` reads the record without a checklist
  error and with hooks enabled

## Done when

- [ ] Record committed with every step passed, the hooks state, the assumption outcomes and P-01's
      name
- [ ] Progress reported: `sdd task set C002-T-050 --status done --commit <sha>`
