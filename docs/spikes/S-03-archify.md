---
id: C001-SPIKE-S-03
task: C001-T-004
change: CHG-001
spike: S-03
title: "Archify validate, deliver and compare"
date: 2026-10-10
verdict: fallback-only
risk_refs: [C001-RISK-009]
spec_refs: [C001-REQ-504, C001-REQ-505, C001-REQ-506, C001-REQ-507, C001-CON-05, C001-IF-14]
---

# S-03 — Archify validate, deliver and compare

## Verdict

**fallback-only on Windows.** Archify 3.0.1 is MIT-licensed (C001-CON-05 is satisfied for its
code) and accepts component IDs such as `C001-COMP-01` as node IDs. But on the reference
machine (Windows 11), **every command that produces output fails**: `validate`, `render`,
`deliver`, `compare` and `examples`. This happens even on Archify's own bundled examples,
and each failure leaves temporary, lock and staging files behind.

This is a known upstream defect: tt-a1i/archify issue #474, "Unify Windows path identity,
portable-path contracts, and release gates", open since 2026-09-18. Its fix, PR #765
("tolerate Win32 link-count inflation"), is still open, and Archify's CI runs on Ubuntu only.
`archify doctor` still reports "Archify is ready" on this machine, so it **cannot** be used to
detect a working Archify.

On REF-WIN, the required platform (C001-CON-06), C001-REQ-504/505/506 therefore cannot be
satisfied, and the architect must use the Mermaid fallback (C001-REQ-507). This is the
contingency already named in the strategy (§4 S-03 row) and in C001-RISK-009. Spec defects
D-S03-1 and D-S03-2 are raised.

## Method

| Item | Value |
|---|---|
| Machine | REF-WIN: Windows 11 Home 10.0.26200, Git Bash and PowerShell 7; Node 22.13.0 |
| Archify | 3.0.1 (`skill-release.json`, channel stable; GitHub release v3.0.1 of 2026-09-28) |
| Install | `npx -y skills@1.7.2 add tt-a1i/archify -a claude-code -y` run in a scratch project (12 s). It copied the skill to `<project>/.claude/skills/archify` (315 files, 10.6 MB) and wrote `<project>/skills-lock.json`. Your global skills were not touched, by P-01's choice; `-g` installs to `~/.claude/skills/` according to the `skills` README (not executed) |
| Runtime deps | none: `package.json` lists only devDependencies, and `bin/archify.mjs` runs on plain Node ≥ 18 |
| Environment | `ARCHIFY_UPDATE_CHECK_DISABLED=1` for every command (the skill has an update manifest URL in `skill-release.json`) |
| Inputs | a 4-component as-is IR and a 5-component to-be IR using `C001-COMP-01…05`, pinned to bolt.diy `41bb909f8d9f20b1bff11b86fde20a846b6e7e18`; plus Archify's own `examples/web-app.architecture.json` and `checkout-platform.{base,head}.architecture.json` as controls |
| Locations tried | the session scratch folder under `%TEMP%`, and the git-ignored `build/` folder of this repository (removed afterwards). The outcome was identical: validate renders into its own `%TEMP%\archify-validate-*` folder anyway |

## License (C001-CON-05)

| Item | Finding |
|---|---|
| Archify code and content | MIT, "Copyright (c) 2026 tt-a1i (Archify)" (`archify/LICENSE`; GitHub reports MIT) |
| Bundled brand marks (`brand-marks/`, from Simple Icons 16.28.0) | mixed: CC0-1.0, MIT, Apache-2.0, CC-BY-4.0, CC-BY-SA-3.0/4.0, and **CC-BY-NC-SA-4.0 (Vue.js)**, plus trademark policies (`THIRD_PARTY_NOTICES.md`) |
| `skills` installer CLI | MIT (vercel-labs/skills 1.7.2) |
| Verdict | Permissive for the code that the architect invokes. Archify is an optional external tool and is not bundled into the plugin. The architect must **not** use the `brand` or `icon` fields of components: some marks are non-commercial or share-alike, and their use carries trademark conditions |

## Commands

Exit 1 everywhere except `doctor`, `guide` and `--help`. Times are wall clock.

| Command | Input | Exit | Time | Result |
|---|---|---|---|---|
| `doctor` | — | 0 | 0.4 s | all 20 checks `[ok]`, "Archify is ready": a **false positive** for output commands |
| `guide architecture` | — | 0 | 0.3 s | recommendation text |
| `validate architecture` | own IR, schema errors | 1 | 0.3 s | precise schema diagnostics with a `Fix:` line each (see ID rules below) |
| `validate architecture` | own IR, no `pos` (or `col`/`row` only) | 1 | 0.6 s | `[internal/unclassified] Cannot read properties of undefined (reading '0')`: crash |
| `validate architecture` | own IR with `pos`, overlapping label | 1 | 0.6 s | layout diagnostic with suggested `labelDy`/`labelAt` fix: usable for a validate-until-clean loop |
| `validate architecture` | own IR, layout clean | 1 | 0.6–0.9 s | `[output/target-changed]`, evidence `candidate-identity-changed` on `%TEMP%\archify-validate-*\.archify-render-*.tmp` |
| `validate architecture` | Archify `web-app` example | 1 | 1.0 s | same `output/target-changed` |
| `render architecture … web-app.html` | Archify example | 1 | 0.9 s | same; leaves `.archify-render-*.tmp` (762 kB) |
| `deliver architecture … web-app-d.html` | Archify example | 1 | 0.3 s | `[delivery/ownership-lost]` "an owned lock path no longer names the entry created by this attempt"; leaves `.archify-delivery-lock.json` |
| `compare architecture base head delta.html` | Archify checkout-platform pair | 1 | 1.5 s | `[delta/freeze-snapshot]` "compare-staging-entry-changed-during-inspection"; leaves `.archify-compare-*/` |
| `examples` | — | 1 | 1.2 s | `[output/target-indeterminate]` |
| `inspect architecture` | own IR with evidence | 1 | 0.5 s | requires `--repo-root` |

The failures match the mechanism described in issue #474 and PR #765. On Windows, a file
that is created through `linkSync` + `unlinkSync` keeps reporting two links, so Archify's
atomic-publication checks treat files it created itself as changed by another process.

## Archify IR rules relevant to the spec (C001-IF-14 §3)

Taken from `schemas/architecture.schema.json`, `schemas/common.schema.json` and the
validator's diagnostics:

| Topic | Rule observed | Spec today |
|---|---|---|
| Node IDs | `^[a-zA-Z][a-zA-Z0-9_-]*$`; `C001-COMP-01` is **accepted** (hyphens allowed); `C001.COMP.01` is rejected | "node IDs = COMP IDs": OK |
| Animation | `meta.animation` ∈ {`trace`, `none`}; `"static"` is rejected (`[schema/enum]`) | `meta.animation = "static"`: **wrong**, must be `"none"` |
| Output | `meta.output` is **required**: a relative path ending in `.html`, with no `..` and no Windows-reserved names | not mentioned |
| Layout | component `pos` `[x, y]` is required in practice; without it, validate crashes (the schema marks it optional) | not mentioned |
| Groups | `boundaries[].kind` ∈ {`region`, `security-group`}, with `label` and `wraps` (IDs) | "groups = deployment units or trust boundaries": map deployment unit → `region`, trust boundary → `security-group` |
| Evidence pinning | `meta.repository` = {`url`, `revision`}: `url` must be a credential-free remote address (`git remote get-url origin`; a local path is rejected), `revision` a 40-hex SHA, `link_mode: "local-only"` for internal repositories; per-component `sources[]` (1–3 × {`path`, `line`, `end_line`, `label`}) | "evidence nodes pinned to the HEAD commit": possible through `meta.repository.revision` plus `sources`, not through "evidence nodes" |
| Evidence verification | an IR that declares `sources` requires `--repo-root <checkout>` on validate, inspect and render | not mentioned; the C001-IF-07 §3 Archify allowlist entry must permit `--repo-root` |
| Component types | `frontend`, `backend`, `database`, `cloud`, `security`, `messagebus`, `external` | not mentioned |

## Spec defects raised

| ID | Ref | Summary |
|---|---|---|
| D-S03-1 | C001-REQ-504, C001-REQ-505, C001-REQ-506 (also C001-TS-504…506, C001-IF-10 §3 Archify detection, C001-T-042, C001-T-071) | Archify 3.0.1 produces no output on Windows 11: `validate`, `render`, `deliver`, `compare` and `examples` fail with `output/target-changed`, `delivery/ownership-lost` or `delta/freeze-snapshot`, also on Archify's own examples (upstream issue #474, fix PR #765 unmerged). `archify doctor` still reports ready, so detection by `doctor` gives a false positive. Contingency per strategy §4 and C001-RISK-009: Mermaid fallback (C001-REQ-507) on REF-WIN; T-071 dropped with a waiver. Detection must become functional: validate a known-good IR in a scratch folder. |
| D-S03-2 | C001-IF-14 §3 (also C001-IF-07 §3 Archify entry, C001-REQ-504) | IR conventions are inaccurate: `meta.animation` must be `"none"` (not `"static"`); `meta.output` and component `pos` are required in practice; evidence pinning is `meta.repository.{url, revision}` plus component `sources`, and requires `--repo-root` on validate/render; groups map to `boundaries` of kind `region`/`security-group`; components must not use `brand`/`icon` (mixed licenses, CON-05). |

Recorded in the "Defects (manual)" table of `20-plan/handoff.md`.

## Install notes for the README and doctor

- Install: `npx skills add tt-a1i/archify -g -a claude-code -y` (non-interactive; this spike
  ran the project-scoped form). It needs network access and npm.
- Archify needs no `npm install`; run it as `node <skills>/archify/bin/archify.mjs`.
- Detection: `archify doctor` is **not** sufficient. Probe with
  `validate architecture <known-good IR>` in a scratch folder and treat any non-zero exit as
  "Archify unavailable: Mermaid fallback".
- On Windows, recommend Archify only after a release that includes the fix for issue #474.

## Test cases in `verified_by`

C001-TC-504, TC-505 and TC-506 are architect evals assigned to C001-T-042. On REF-WIN they
cannot pass with Archify 3.0.1. Under the strategy's contingency, those scenarios are
satisfied by the Mermaid fallback path instead (C001-TS-507 and following), pending P-01's
decision on D-S03-1.
