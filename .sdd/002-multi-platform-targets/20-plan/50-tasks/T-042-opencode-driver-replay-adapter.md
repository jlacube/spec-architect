---
id: C002-T-042
title: "OpenCode session driver and the opencode-permissions replay adapter"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: done
depends_on: [C002-T-001, C002-T-030, C002-T-040]
implements: [C002-REQ-606, C002-REQ-626, C002-REQ-632, C002-NFR-201, C002-NFR-202]
satisfies_ac: [C002-AC-606.1, C002-AC-626.1, C002-AC-632.1]
verified_by: [C002-TS-630, C002-TS-646, C002-TS-647, C002-TS-652, C002-TS-655, C002-TS-656, C002-TC-630, C002-TC-646, C002-TC-647, C002-TC-652, C002-TC-655, C002-TC-656]
components: [C002-COMP-008, C002-COMP-009]
risk_refs: [C002-RISK-020]
estimate: L
report: { commit: a9ea014, completed_at: 2026-10-19, notes: "Driver + replay adapter; replay 691 cases 0 errors, identity/memory 0 differing, 147/159 shell+path differences (OpenCode native rules, for T-043); TC-133/211/213/655/656 pass; TC-630/646/647/652 skipped (server mode); TC-226 fails on spec assumption (D-011); no paid sessions" }
---

# C002-T-042 — OpenCode session driver and the opencode-permissions replay adapter

## Intent

Implement C002-ADR-005 as revised for defect D-009. The shared session driver starts the **pinned host
binary** of the tested OpenCode (1.18.31) through its server and JS SDK, with a database of its own
(`OPENCODE_DB`), never the `opencode` that PATH resolves (C002-IF-010 §4 "OpenCode host process";
S-07 facts F-7, F-8). A loopback stub model answers each case with exactly the tool call of
C002-IF-009 §2.2, and the adapter reads the decision from the tool part's final state (§2.3). Both
forms of an unavailable-tool result read as `deny`, and `Edit` cases carry the fixture file's first
line as `oldString` (S-07 facts F-4, F-5; C002-TS-655, C002-TS-656). Identity cases run on OpenCode
only, with the fixture's adopter agent (C002-REQ-626). Unknown `architect:sdd-*` callers expect
`allow` (C002-REQ-632). The eval runner of C002-T-044 reuses the driver.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `package.json` | `@opencode-ai/sdk` as a devDependency pinned exactly to 1.18.31, the SDK of the tested OpenCode of the S-07 record; licence checked against the allowlist |
| add | `evals/harness/opencode/driver.mjs` | host process of C002-ADR-005 (pinned binary by absolute path from the harness configuration, own `OPENCODE_DB`, models fetch, auto-update and sharing off); session start, event stream, permission replies; `host_versions.opencode` read from that binary |
| add | `tests/replay/adapters/opencode-permissions.ts`, `tests/replay/stub-model.mjs` | loopback provider; one scripted call per case; decision reading with both unavailable-tool forms |
| add | `tests/replay/fixtures/opencode/` | fixture with the generated package, the adopter agent, the target files that the `Edit` cases need (e.g. `.sdd/004-x/existing.md`), and the project `.opencode/` folder with `package.json` and `node_modules` of `@opencode-ai/plugin` 1.18.31 |
| add | `tests/unit/replay/opencode-decision.test.ts` | C002-TC-656 on an in-process stub host (no socket, so `npm test` and its no-network preload can run it) |
| modify | `tests/replay/scenarios/opencode-host.test.ts` | adds C002-TC-655 |

## Preconditions

- C002-T-001 done: the S-07 record gives the stub-model driver as feasible on 1.18.31 (§4) and lists
  the host-process conditions (§9, facts F-7 … F-10).
- C002-T-030 (generated rules) and C002-T-040 done.
- The replay machine (REF-WIN) runs Node.js 22.22.2 or later, the floor of the OpenCode JS SDK
  (S-07 fact F-10; scope §5). P-01 upgrades REF-WIN (Q-s07-02, `../questions-log.md` round 11).

## Step outline (no production code)

1. Build the session driver `evals/harness/opencode/driver.mjs`. It takes the absolute path of the
   pinned host binary from the harness configuration and refuses to start without it; it never
   resolves `opencode` on PATH. It sets `OPENCODE_DB` to a database file of the run. It opens a
   session through the SDK, follows the event stream and answers permission requests. The eval
   runner of C002-T-044 uses it against the real provider, and C002-TC-226 reads the command list
   through it without a model call.
2. Build the loopback stub model and the `opencode-permissions` adapter on the driver. The stub
   replay also isolates the data, config, cache and state folders (no credential store is read) and
   meets the start-up conditions of C002-ADR-005: models fetch off (catalogue
   `models.opencode.ai`), npm offline with `@opencode-ai/plugin` 1.18.31 ready in the project
   `.opencode/` folder and in the isolated global config folder, every non-loopback request sent to a
   closed proxy port. No `rg.exe` is provisioned (S-07 §4).
3. Map `Edit` cases as C002-TS-655 states: the fixture holds the target file, and `oldString` is that
   file's first line. Read a tool part with status `error` and the text `Model tried to call
   unavailable tool`, and a part named `invalid`, as `deny`; read `allow` only when the call ran
   (C002-TS-656).
4. Record `host_versions.opencode` from the pinned binary in every report. The driver only reads and
   returns the version; the `opencode-permissions` replay adapter refuses to run on another version
   (the eval runner of C002-T-044 records it as read, ERR-REL-006).
5. The infeasible-driver branch of `10-strategy.md` §4 is not taken (S-07 §4: feasible on 1.15.10
   and 1.18.31), so no fallback adapter is built and no case moves to C002-T-056.

## Verification

- `npm run replay -- --mechanism opencode-permissions` (pinned host binary of the tested version,
  Node.js 22.22.2 or later)
- `npm run replay -- opencode-host` (C002-TC-655 and the cases of C002-T-029 and C002-T-030)
- `npm test -- unit/replay` (C002-TC-656)

## Done when

- [ ] `evals/harness/opencode/driver.mjs` delivered; it starts only the pinned binary, with its own `OPENCODE_DB`
- [ ] Reports written for both shells; identity and unknown-caller cases replayed as specified; C002-TC-655 and C002-TC-656 pass
- [ ] The `opencode-host` replay scenarios written by C002-T-029 and C002-T-030 run under `npm run replay -- opencode-host`
- [ ] Progress reported: `sdd task set C002-T-042 --status done --commit <sha>`
