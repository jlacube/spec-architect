# C002-T-084 — 0.1.0 release candidate after D-056 and D-057

Date: 2026-11-13. Executor: the conductor (steps 1, 7 to 9; steps 2 to 7 by an implementer agent,
reviewed). Task:
`.sdd/002-multi-platform-targets/20-plan/50-tasks/T-084-researcher-probe-preinstall-warning-d056-d057.md`.

## Why

C002-T-050 run 3 (2026-11-12, `C:\Sandbox\runs\t050e`, candidate e89dae8) stopped after P-01's end
batch with two findings:

- **D-057:** `/architect:doctor` reported Context7 and DeepWiki `unreachable` while both servers ran.
  Only `sdd-researcher` is granted their tools, so the cartographer's probe never reached them.
- **D-056:** the twin folder, registered in `chat.pluginLocations` before the install, showed the
  Architect prompt files and agents. Assumption A-3 is refuted: VS Code loads a folder without a
  manifest as soon as it is registered.

P-01 (2026-11-12) chose: "Fix shared source", "Keep docs and spec fix", "Full run 4".

## Candidate

- **Release-candidate commit:** `7b8414a`. `plugin.json` gives 0.1.0.
  - The first candidate commit `0a20c4e` carried steps 2 to 7.
  - `7b8414a` adds one sentence to the researcher's probe line (see "Fix during step 8") and the
    replay reports regenerated at the candidate.
- **Local tag:** `v0.1.0` moved from `e89dae8` (C002-T-082) to `7b8414a`, annotated, local only.
  On the way it pointed at `0a20c4e`. Pushing the tag and every publication stay P-01's (C002-T-075,
  C002-T-055).
- **Run sheet:** the Package line of `docs/runsheets/T-050-vscode-checklist.md` names `7b8414a`.
- **Artifacts** (copied to `C:\Sandbox\runs\t050f\7b8414a\` with `SHA256SUMS`; baseline in
  `C:\Sandbox\runs\t050f\e89dae8\`):

| Artifact | e89dae8 | 7b8414a |
|---|---|---|
| `architect-copilot-0.1.0.zip` | `bafc6533…ffe8907b` | `0d5b1c63…38681bdf` |
| `architect-0.1.0-plugin.zip` | `750ac0b3…9de30963` | `064f7d87…58b100a7` |
| `architect-0.1.0.zip` | `1c62baff…945dd773` | `d6ec1912…05cc50dc` |
| `architect-sdd-0.1.0.tgz` | `802e2363…9a2eb56d` | `802e2363…9a2eb56d` (byte-identical) |

- **`git diff --stat e89dae8 7b8414a -- plugins/architect/`:** 15 files changed, 140 insertions(+),
  53 deletions(-).

## File comparison (step 7, CR-103 and CR-206)

File by file by SHA-256 over the unpacked artifacts, the baseline against `7b8414a`'s `dist/`. No file
was added or removed in any artifact, and each changed-file list equals the allowed list exactly.

**Copilot zip** (49 files, 7 changed):

| File | e89dae8 | 7b8414a | Fix |
|---|---|---|---|
| `INSTALL.md` | `a96096d1…6bc04834` | `93154f98…140d7c8e` | D-056 (line 52, step 3) |
| `prompts/doctor.prompt.md` | `11f3b0b6…a0abaeaa` | `9de6315b…b026de7d` | D-057 (steps 2, 3, remedies) |
| `prompts/init.prompt.md` | `61243c0e…4900bbdd` | `c2dcc429…ef7f7c4c` | D-057 (step 3) |
| `skills/code-discovery/SKILL.md` | `23101b34…e116dafc` | `149a7e6e…144d300d` | D-057 (toolchain item) |
| `agents/sdd-cartographer.agent.md` | `2df5c226…c9c27c98` | `cd6168ad…3273cd77` | D-057 (inlined toolchain item) |
| `agents/sdd-researcher.agent.md` | `283c2b13…a783b5fa` | `c8ad0e0b…b88797a6` | D-057 (probe line) |
| `architect-target.json` | `8e453cf6…1e89c533` | `300682ea…844f58a3` | D-057 (anchors) |

**Claude Code plugin zip** (106 files, 5 changed):

| File | e89dae8 | 7b8414a | Fix |
|---|---|---|---|
| `commands/doctor.md` | `29573c31…463ffaf9` | `f16e5742…a2f8fd1a` | D-057 |
| `commands/init.md` | `1447ee45…36ff4bfb` | `f5a5f3cc…63ca1262` | D-057 |
| `skills/code-discovery/SKILL.md` | `8b58f7c3…ad5dd5a9` | `1e9e4470…88ec11df` | D-057 |
| `agents/sdd-researcher.md` | `e60ce3a6…ccd78d34` | `ed3c4185…ca8db125` | D-057 |
| `README.md` | `b96e8537…cee635a9` | `b2a7dac6…7a4ae86b` | D-057 (Troubleshooting) |

**Claude Code full zip** (108 files, 5 changed): the same five files under `plugins/architect/`, with
the same hashes. `INSTALL.md` and `.claude-plugin/marketplace.json` are equal.

**`architect-sdd-0.1.0.tgz`:** no file differs, and the tarball is byte-identical.

## Line comparison (CR-199)

`git diff e89dae8 7b8414a -- plugins/architect/`: every hunk lies in an allowed region.

| File | Hunk | Region |
|---|---|---|
| `README.md` | @194 | Troubleshooting rows (`Context7 untested`, `DeepWiki untested`; `unreachable` rows reworded) |
| `agents/sdd-researcher.md` | @22 | the researcher's probe line |
| `commands/doctor.md` | @11 | step 2 |
| `commands/doctor.md` | @23, @27 | step 3 |
| `commands/doctor.md` | @50 | Context7 and DeepWiki remedies rows |
| `commands/init.md` | @12 | step 3 |
| `skills/code-discovery/SKILL.md` | @101 | toolchain-record item |
| `targets/copilot/install.md` | @52, @63 | install notes line 52 and step 3 |
| `targets/mapping-table.schema.json` | @73 | target schema copy line 73 (now equal to the spec copy) |
| `targets/copilot.json`, `targets/opencode.json` | @131, @152, @156, @201 | the three anchors |
| six `targets/*/wiring/` files | all | `doctor-probe`, `doctor-report`, `code-discovery-toolchain` variants |

In the generated Copilot agents:
- `sdd-cartographer.agent.md` @126 is the inlined toolchain item;
- `sdd-researcher.agent.md` @20 is the probe line, the only hunk of that file.

The README Copilot section's settings sentence was not changed: that section never repeated the
install-notes sentence.

## Changed golden copies

| Test | Change | REQ |
|---|---|---|
| `tests/integration/cap05/doctor-variants.test.ts` | doctor SHA-256 pin `29573c31…463ffaf9` → `f16e5742…a2f8fd1a`; "eight rows" check on flattened text | C002-REQ-504, C002-REQ-506 |
| `tests/integration/cap01/wiring.test.ts` TC-123 | source lines 12/33 → 17/45; anchor starts doctor-report 17 → 21, doctor-remedies-host 33 → 45 | C002-REQ-504 |
| `tests/integration/cap01/wiring.test.ts` TC-120 | fixture line 33 → 45 | C002-REQ-504 |
| `tests/integration/cap01/wiring.test.ts` TC-134 | code-discovery section 115 → 118 | C002-REQ-507 |
| `tests/integration/cap01/constructs.test.ts` TC-134 | code-discovery lines 117/115 → 120/118 | C002-REQ-507 |
| `evals/cap11/TS-1112.eval.mjs` `deepwiki-down` | `unreachable` → `untested` with the `not offered` fix | C002-REQ-522 (C002-TS-626) |

New tests: `tests/unit/evals/mcp-overrides.test.ts`, `tests/unit/evals/stub-mcp.test.ts`. Changed
tests: `cap03/package.test.ts` (C002-TC-306), `cap06/checklist.test.ts` (C002-TC-617, C002-TC-618).
New eval cases: `evals/targets/doctor/TS-709.eval.mjs`, `TS-710.eval.mjs`, with the stub
`evals/harness/stub-mcp.mjs`. Runner support: `mcpOverrides` `<url> | false` in `run.mjs` through
`overlay.mjs` (Claude Code), `runners/opencode.mjs` and `runners/copilot-cli.mjs`.

Deviation reported by the implementer: the new tests were written in the same pass as the code, so they
were never run against the old text to show them failing.

## Unpaid steps (at 7b8414a)

- `npm run check`: 10/10 steps pass, at `0a20c4e` and again at `7b8414a`.
- `npm run package`: `dist/` rebuilt. A second regeneration at `0a20c4e` gave the same files with the
  same content in every artifact, while the zip bytes differed. The tarball was byte-identical.
- **Replays** `npm run replay -- --mechanism sdd-mcp-server,copilot-hooks --target copilot` on win32:
  683 replayed, 26 not applicable, 0 differing, for both mechanisms. They ran under Git Bash and
  PowerShell 7.6.10, at `0a20c4e` and again at `7b8414a`. Reports: `replay-sdd-mcp-server.json`,
  `replay-copilot-hooks.json`.
- `sdd host-version vscode`: `vscode 1.145.2`, `copilot-chat 0.73.0`, `hooks enabled`.

## Claude Code sessions (label `c002-t084`, `--auth subscription`, Claude Code 2.1.296)

One session per row; result files under `evals/results/c002-t084-<row>-<timestamp>.json`, transcripts
under `evals/results/transcripts/`. Cost is notional (subscription); API-key spend 0.

### Batch 1, at 0a20c4e (19 rows, 2026-11-13 04:01–05:21 local)

| Row | Kind | Result | Notional USD |
|---|---|---|---|
| TS-506-claude-code | changed | pass | 0.4111 |
| TS-506-claude-code-no-sdd | changed | pass | 0.3076 |
| TS-509-claude-code-no-sdd | changed | pass | 0.3130 |
| TS-509-claude-code-deepwiki-probe-fails | changed | pass | 0.3034 |
| TS-511-claude-code | changed | pass | 0.3296 |
| TS-512-claude-code (init) | changed | pass | 0.5571 |
| TS-709-claude-code-iserror (C002-TC-935) | changed | pass | 0.3164 |
| TS-709-claude-code-32603 (C002-TC-935) | changed | pass | 0.3074 |
| TS-710-claude-code-context7-off (C002-TC-936) | changed | pass | 0.3246 |
| TS-710-claude-code-deepwiki-off (C002-TC-936) | changed | pass | 0.3365 |
| TS-710-claude-code-deepwiki-down (C002-TC-936) | changed | **fail** | 0.3063 |
| C001-TS-1112 `deepwiki-down` | changed | **fail** | 0.3226 |
| `doctor-no-ripwire` (regression-set §5 row 1) | changed | pass | 0.3357 |
| C001-TS-1112 `bare` | unchanged | pass | 0.3278 |
| C001-TS-1112 `node18` | unchanged | pass | 0.3643 |
| C001-TS-1124 | unchanged | pass | 0.3320 |
| TS-509-claude-code-node18 | unchanged | pass | 0.3298 |
| TS-510-claude-code-2.0.76 | unchanged | pass | 0.3299 |
| TS-510-claude-code-2.1.295 | unchanged | pass | 0.3299 |

17/19 pass, 6.4850 USD notional.

### Fix during step 8

What happened in the two failed rows (the `cfg-deepwiki-down` URL `deepwiki-unreachable.invalid`):
- The DeepWiki server never connected (init message: `plugin:architect:deepwiki` `failed`).
- The researcher's `ToolSearch` for DeepWiki returned no tool, with the host's note that the server
  failed to connect (`getaddrinfo ENOTFOUND`).
- The researcher made no DeepWiki call and replied `DeepWiki: failed: getaddrinfo ENOTFOUND …`.
- The doctor mapped `failed` to `unreachable`, so the row expectation was not met.

C002-IF-006 §2.1 holds a server with no tool offered as `not offered` → `untested`. The researcher text
did not say what to do when the host gives a reason. Fix in `7b8414a`, inside the probe-line region:

> A server none of whose tools you are offered is `not offered`, also when the host gives a reason (a
> failed connection, for example); `failed` is only for a call you made.

No spec, plan or test change was needed.

### Batch 2, at 7b8414a (4 rows, 05:22–05:46)

| Row | Run | Result | Notional USD |
|---|---|---|---|
| TS-710-claude-code-deepwiki-down | rerun after fail (DOD-G-01 waiver: at most one) | pass | 0.3228 |
| C001-TS-1112 `deepwiki-down` | rerun after fail | pass | 0.3022 |
| TS-710-claude-code-context7-off | repeat on the new text | pass | 0.3240 |
| TS-710-claude-code-deepwiki-off | repeat on the new text | pass | 0.3274 |

4/4 pass, 1.2764 USD notional.

### Scope of the evidence at 7b8414a

- `7b8414a` differs from `0a20c4e` in one sentence of the researcher's probe line. That sentence applies
  only when no tool of a server is offered to the researcher.
- The four rows that set that up all ran again on `7b8414a` and pass.
- The other 15 rows of batch 1 offer the researcher both servers' tools: real servers, or the stub,
  which lists the DeepWiki tools. The new sentence does not apply to them, so their batch-1 result
  stands for `7b8414a`. This follows the same reasoning as the plan's exclusion of regression-set §5
  row 5.

### Totals and checks

- 23 sessions, 21 pass, 7.7614 USD notional, API-key spend 0.
- In all 23 transcripts the doctor or init dispatched `sdd-researcher`.
- No session had the researcher write or edit a file.
- No row failed twice.

## Dry run

`node scripts/release-check.mjs --target copilot --dry-run` at `7b8414a`:

```
ERR-REL-003: copilot: no checklist record for version 0.1.0
release-check: copilot 0.1.0 (sdd-mcp-server): refused (1 refusals); release record not written (--dry-run; would be docs/releases/copilot/0.1.0/release.json)
```

Refused on ERR-REL-003 only, the record of C002-T-050 run 4.

## CHG-001 note

CHG-001's Claude Code 0.1.0 evidence was taken on e89dae8's doctor, init and researcher text
(`handoff.md`, CHG-001 impact). `7b8414a` changes those five files of the Claude Code zips; defect D-033
covers correcting the CHG-001 release record before C001-T-075.
