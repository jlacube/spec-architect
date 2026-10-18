---
id: C002-T-060
title: "Eval harness: auth switch between the prepaid API key and P-01's Claude subscription"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-01
status: todo
depends_on: []
implements: []
satisfies_ac: [C002-AC-623.1]
verified_by: [C002-TS-626, C002-TC-626]
components: [C002-COMP-009]
risk_refs: [C002-RISK-009, C002-RISK-015]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-060 — Eval harness: auth switch between the prepaid API key and P-01's Claude subscription

## Intent

Let every Claude Code eval session choose its billing: `--auth api-key` (the stored login, billed to
the prepaid API key) or `--auth subscription` (P-01's Claude Max plan, P-01 2026-10-18), so that the
paid Claude Code sessions of CHG-002 no longer draw on the 40 USD API-key budget (test plan §4.1).
The switch is harness infrastructure with no requirement of its own. It is linked to C002-AC-623.1
because the Claude Code evals of the regression set run through it, and the case API, the caps
(C002-NFR-105) and every regression-set test must stay as they are. Built and validated in commits
98e6353 and 6de8656 before this plan revision; this task records that work.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `evals/harness/env.mjs` › `AUTH_MODES`, `resolveAuth`, `authEnv`, `childEnv`, `checkKeySource` | mode from the option, else `EVAL_AUTH`, else `api-key`; for `subscription` an isolated `CLAUDE_CONFIG_DIR` and `CLAUDE_CODE_OAUTH_TOKEN` read from a token file outside the repository (`claude-oauth-token` or `claude-oauth-token.txt` in the eval home, or `EVAL_CLAUDE_OAUTH_TOKEN_FILE` / `EVAL_CLAUDE_OAUTH_TOKEN`); the accepted `apiKeySource` values per mode |
| modify | `evals/harness/session.mjs` | the session child gets the mode's environment; a subscription session whose reported `apiKeySource` is not `oauth` or `none` is refused, so it never falls back to the key |
| modify | `evals/harness/run.mjs` | option `--auth api-key\|subscription`; each result records `auth` and `api_key_source`; `--max-total-usd` and the printed total count api-key sessions only (subscription sessions keep a notional `cost_usd`) |
| add | `evals/smoke/auth-smoke.eval.mjs` | one-turn smoke case, run in each mode |
| add | `tests/unit/evals/auth.test.ts` | mode resolution, environment per mode, token-file names, key-source check, no fallback |

## Preconditions

- P-01's Claude Max plan and an OAuth token stored outside the repository (never committed; handoff
  "Rules").

## Step outline (no production code)

1. Resolve the mode once per run and pass it to every session; the default stays `api-key`, so a
   run that names no mode behaves as before.
2. Build the subscription environment from the isolated config folder and the token; strip the
   parent session's `CLAUDE*` and `ANTHROPIC*` variables as today.
3. Refuse a subscription session whose `apiKeySource` shows the key; a bad token ends the session
   with the host's error (401), never with a retry on the key.
4. Record `auth` and `api_key_source` in each result file, so that the spend ledger can tell the two
   apart (test plan §4.1 "Ledger").
5. Run the smoke case in both modes and an invalid-token case.

## Verification

- `npm test -- evals/auth`
- `node evals/harness/run.mjs evals/smoke/auth-smoke.eval.mjs --tier dev --auth subscription`: the
  result records `auth` `subscription` and `api_key_source` `none`, and the key shows no spend
  (`evals/results/auth-smoke-auth-smoke-2026-10-17T23-37-13-792Z.json`)
- the same case with an invalid token fails with 401 and no fallback
  (`evals/results/auth-smoke-negative-auth-smoke-2026-10-17T23-37-37-058Z.json`)
- `npm run check` (C002-TC-626: the regression set stays green)

## Done when

- [ ] Unit tests pass; the subscription smoke and the negative case are recorded as above
- [ ] `npm run check` green
- [ ] Progress reported: `sdd task set C002-T-060 --status done --commit 6de8656`
