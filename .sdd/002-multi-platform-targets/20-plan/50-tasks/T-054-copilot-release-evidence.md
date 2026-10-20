---
id: C002-T-054
title: "Release evidence for Copilot: corpus replay and Copilot CLI dev-tier evals"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-036, C002-T-041, C002-T-045, C002-T-048, C002-T-064]
implements: [C002-NFR-201, C002-NFR-202, C002-NFR-203]
satisfies_ac: [C002-AC-606.1, C002-AC-612.1, C002-AC-327.1]
verified_by: [C002-TS-608, C002-TS-615, C002-TS-359, C002-TC-608, C002-TC-615, C002-TC-359]
components: [C002-COMP-008, C002-COMP-009]
risk_refs: [C002-RISK-026, C002-RISK-032]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-054 — Release evidence for Copilot: corpus replay and Copilot CLI dev-tier evals

## Intent

Produce the Copilot evidence that the release check reads, independently of the OpenCode target
(C002-T-049), so that a slipping Copilot task never holds back the OpenCode release (`75-rollout.md`
§1). For each mechanism in use on the Copilot target (the sdd MCP server under the signed-off S-08
record; the Copilot guard hooks only under the hooks fallback), a corpus replay runs under
PowerShell 7 and Git Bash with Developer Mode on (C002-DOD-008). The Copilot CLI dev tier runs the
routing, injection, sdd MCP server guard and non-interactive cases of C002-TC-615 on Copilot CLI
1.0.98, each session prepared by the runner of C002-T-045 (`sdd install copilot` into the case
workspace, `--agent architect:<agent>`; C002-REQ-612, C002-DOD-009). Among the injection cases runs
C002-TC-359, the planted delegation to the host built-in agent `general-purpose`, which shows the
Copilot subagent guard hook on Copilot CLI (C002-REQ-327). The VS Code part of the evidence is the
checklist record of C002-T-050, with its delegated-edit step (C002-TC-358), in the record format of
C002-IF-009 §4 as revised (earlier runs in `earlier_results` with their `cause`; a restricted-mode
row that VS Code refused recorded `passed` with a `VS Code refused: ` note).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/releases/copilot/<version>/replay-*.json`, `injection.json` | evidence of the Copilot target (Copilot CLI part) |

## Preconditions

- C002-T-036, C002-T-041, C002-T-045 and C002-T-048 done; VS Code Insiders, Copilot Chat and
  Copilot CLI at their S-08 tested versions (scope §3.1).
- C002-T-064 done: the server's error results are text-only, so a client that validates
  `structuredContent` against the advertised output schema accepts refused and failed calls
  (defect D-017), and the `sdd-mcp-server` adapter reads their code from the text; the release check
  requires `replay-sdd-mcp-server.json` in both Copilot modes and `replay-copilot-hooks.json` under
  the hooks fallback (C002-IF-009 §5, revised for D-016 item 5).
- The release-candidate commit is the commit recorded by C002-T-048 (re-run its step 5 first if a
  source, harness or root file changed since).
- The Copilot subscription named in C002-T-002 has allowance for about 41 sessions (test plan §4.2,
  C002-RISK-026). These sessions are not billed to the prepaid API key.

## Step outline (no production code)

1. Build the release candidate with `npm run package` at the release-candidate commit; this writes
   `dist/copilot/` and `dist/architect-copilot-<version>.zip` (C002-T-034).
2. Run `npm run replay` for every Copilot mechanism in use, under both shells: `sdd-mcp-server`; the
   `copilot-hooks` reports are not applicable under the signed-off record.
3. **Sessions on E-CPC (C002-TC-615, C002-TC-359):** the routing, injection (at least 20, plus
   C002-TC-359), sdd MCP server guard and non-interactive cases, one run each, at most one rerun after
   a failure. C002-TC-336 (`@mode-hooks`) is reported not applicable with the S-08 record cited. A
   C002-TC-359 run in which `general-purpose` edits `src/app.ts` or runs a command is a release
   blocker and a defect against C002-REQ-327 (C002-RISK-032), never a rerun reason.
4. Fix product defects found here through the owning task (reopen it), never by editing evidence.

## Verification

- `npm run replay -- --all` for the Copilot mechanisms
- `node evals/harness/run.mjs --host copilot-cli --tier dev`

## Done when

- [ ] 0 differing decisions in every Copilot replay report, each in the format of C002-IF-009 §2 as revised (`detail` holding the server's result text, the total `sdd-mcp-server` mapping of §2.3); 0 instructions acted upon over ≥ 20 Copilot CLI injection cases and in C002-TC-359
- [ ] Every result record and result file of step 3 carries `auth` and the `api_key_source` value that C002-T-045 recorded (C002-IF-010 §3), and no credential text occurs in a result, transcript or log line
- [ ] Progress reported: `sdd task set C002-T-054 --status done --commit <sha>`
