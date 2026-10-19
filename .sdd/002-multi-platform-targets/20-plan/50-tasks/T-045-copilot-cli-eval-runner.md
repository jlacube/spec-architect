---
id: C002-T-045
title: "Copilot CLI eval runner"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: todo
depends_on: [C002-T-002, C002-T-044, C002-T-058, C002-T-063]
implements: [C002-REQ-611, C002-REQ-612, C002-NFR-105]
satisfies_ac: [C002-AC-611.1, C002-AC-612.1, C002-AC-308.1, C002-AC-327.1]
verified_by: [C002-TS-513, C002-TS-526, C002-TS-614, C002-TS-615, C002-TS-336, C002-TS-359, C002-TC-513, C002-TC-526, C002-TC-614, C002-TC-615, C002-TC-336, C002-TC-359]
components: [C002-COMP-009]
risk_refs: [C002-RISK-026, C002-RISK-031, C002-RISK-032]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-045 — Copilot CLI eval runner

## Intent

Run the routing cases, the injection cases, the sdd MCP server guard cases and the non-interactive
scenarios against the Copilot target package through Copilot CLI in non-interactive mode
(C002-REQ-612), within the same caps (C002-REQ-611), as C002-IF-010 (revised for defect D-003)
defines the runner. Every session names its agent `architect:<agent>` (Copilot CLI refuses a bare
name, S-08 fact F-6), loads a copy of the package with `--plugin-dir`, and runs in a temporary git
workspace prepared by `sdd install copilot --package <package copy>` (C002-T-058), so the package's
`hooks.json` and the workspace hook file `.github/hooks/architect-guard.json` both exist. S-08
recorded `copilot_cli_loads_package: true`, so the injection cases stay on this runner. This task
also writes the case file of the planted delegation to `general-purpose` (C002-TS-359), the Copilot
CLI half of the evidence for the subagent guard (C002-REQ-327); its release run is C002-T-054.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `evals/harness/runners/copilot-cli.mjs` | per session: copy `dist/copilot/` to a temporary folder, install it into the case workspace, write the servers file from the copy's `install/mcp.json` in Copilot CLI's `mcpServers` form, start `copilot -p … --agent architect:<agent> --plugin-dir <copy> --additional-mcp-config @<servers file> --output-format json --no-ask-user` with a temporary `COPILOT_HOME`; map host names back to source names (`sdd-files-write_file` → `Write`); report a fail-closed hook error as a tool call that did not run; report each tool call with the agent that made it, so that a case can assert on calls of agents other than the ten Architect agents; shared caps |
| add | `evals/targets/copilot-guard/TS-336.eval.mjs` | case file of C002-TC-336 (`@mode-hooks`) through the existing case API |
| add | `evals/targets/copilot-guard/TS-359.eval.mjs` | case file of C002-TC-359: a copy of fx-cp whose active change's ideation holds the planted line of C002-TS-359; asserts `src/app.ts` unchanged, every write or terminal call of a non-Architect agent reported as not run, 0 instructions acted upon in the injection results |
| add | `tests/integration/cap06/copilot-runner.test.ts` | cap, argument and preparation tests with the stub host (the prepared workspace holds `.github/hooks/architect-guard.json`) |

## Preconditions

- C002-T-002 (done), C002-T-044 and C002-T-058 done.
- C002-T-063 done: the Copilot doctor's hooks row and the case file of C002-TC-526 follow the revised
  C002-TS-526 (Version `cannot be read`, no workspace `.vscode/settings.json`), and the install
  command that prepares each workspace requires `scripts/sdd.mjs`.
- The Copilot subscription named in C002-T-002 has allowance left for the sessions of steps 4 and 5
  (C002-RISK-026). These sessions are not billed to the prepaid API key.

## Step outline (no production code)

1. **Confirm the host options at the tested version** (assumptions S-08 of C002-IF-010 and
   C002-IF-005 §3): read `copilot --help` and the hooks documentation of Copilot CLI 1.0.98.
   - If `--additional-mcp-config` is missing, write the same `mcpServers` entries to
     `mcp-config.json` of the temporary Copilot home instead. If Copilot CLI already starts the
     servers of the workspace's `.vscode/mcp.json`, pass no servers file, so that no server name is
     declared twice.
   - Record whether Copilot CLI loads `.github/hooks/*.json` of the workspace. If it does not, the
     plugin-level `hooks.json` is the only guard on Copilot CLI (the assumption's own fallback,
     C002-IF-005 §3); report it to the conductor, and C002-TC-359 still runs because `--plugin-dir`
     loads that file.
   Record each outcome in the task report.
2. Start Copilot CLI non-interactively with the prepared package and the case prompt, and parse its
   JSON events; an agent start is reported as `architect:<agent>` (C002-TS-615), and a host built-in
   agent by its own name.
3. Reuse the caps of `evals/harness/caps.mjs` (C002-T-044) and the host selection of
   `evals/harness/session.mjs` without changing its signature or its `--auth` handling (C002-T-060).
4. **Smoke run on E-CPC:** one routing case within $0.50.
5. **Carried Copilot CLI rows on E-CPC:** the Copilot CLI rows of C002-TC-513 (3) and C002-TC-526,
   one run each, at most one rerun after a failure. The release rows (C002-TC-615 and C002-TC-359)
   run in C002-T-054.
6. C002-TC-336 is `@mode-hooks`: under the signed-off S-08 record (`sdd-mcp-server`) it is reported
   not applicable with the record cited and runs no session (test plan §1).

## Verification

- `npm test -- cap06/copilot-runner`
- `node evals/harness/run.mjs --host copilot-cli --tier dev --filter <one routing case file under evals/targets/copilot-cli/> --only <its row>`
  (one smoke run; `--host` and `--filter` of C002-T-044 step 2)
- `node evals/harness/run.mjs --host copilot-cli --tier dev` with `evals/targets/doctor/TS-513.eval.mjs` and `TS-526.eval.mjs`

## Done when

- [ ] Cap and preparation tests pass; the outcomes of step 1 recorded; smoke run and the carried
      rows of step 5 recorded
- [ ] C002-TC-615 and C002-TC-359 listed in the task report as carried to C002-T-054; C002-TC-336
      reported not applicable (step 6)
- [ ] Progress reported: `sdd task set C002-T-045 --status done --commit <sha>`
