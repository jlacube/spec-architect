---
id: C002-ADR-005
artifact: plan/adr
change: CHG-002
phase: 20-plan
status: accepted
---

# C002-ADR-005 — OpenCode replay through a scripted model endpoint

## Context and problem

The OpenCode mechanism of the corpus replay (C002-COMP-008, `opencode-permissions`) must be decided
by OpenCode at its tested version through a headless session or its SDK (C002-IF-009 §2). It is
replayed in both enforcement modes:

- the identity cases of C002-REQ-626 and C002-REQ-632 run on OpenCode only;
- the S-07 replay selects the mode (C002-IF-001 §6.3).

The spec fixes the case-to-call mapping (§2.2) and how a decision is read (§2.3). It does not say how
OpenCode is made to issue a given tool call when no model chooses it. Without a decision, the
implementer could fall back to real-model sessions, which are non-deterministic and paid per case, or
to a model of OpenCode's matcher, which is not OpenCode. Either would weaken the 0-difference evidence
of C002-NFR-201 and C002-NFR-202.

## Considered options

C002-OA-009 (`OA-009-opencode-replay-driver.md`) scores four drivers and presents three:

- **A — Scripted model endpoint** (recommended, 4.40).
- **C — Permission module in-process** (3.90).
- **B — Real-model sessions** (2.65).

Rejected: a re-implemented matcher, which is not OpenCode at its tested version.

## Decision outcome

**A.** The `opencode-permissions` adapter works as follows:

- It starts the pinned host binary of the tested OpenCode through its server and JS SDK on the
  replay fixture (host process below). The fixture holds the generated package, the fixture's adopter
  agent of C002-IF-009 §2.2, and auto-update and sharing turned off.
- The fixture's model provider points at a loopback stub run by the adapter. For each case, the stub
  answers the session's first turn with exactly the tool call of §2.2, then ends the turn.
- The adapter reads the decision from the tool part's final state, as §2.3 defines it.

Every decision comes from the shipped binary, deterministically and without API spend. The session
driver, in particular session start, the event stream and permission replies, is shared with the
OpenCode eval runner (C002-COMP-009, C002-IF-010 §4).

`@opencode-ai/sdk` is a root devDependency, pinned exactly to the release that matches the tested
OpenCode version (1.18.31). It is never bundled into a shipped file, so the licence check of
C002-REQ-413 does not apply to it. Both `tests/replay/` and `evals/harness/` resolve it.

### Host process (revised for defect D-009, 2026-10-18)

Spike S-07 ran on OpenCode 1.15.10 and was re-tested on 1.18.31, which P-01 confirmed as the tested
version (Q-s07-01, Q-s07-02, `../questions-log.md` round 11). Facts F-7 … F-10 of
`docs/spikes/S-07-opencode.md` §9 fix how the driver starts OpenCode. The spec states the same rules
(C002-IF-010 §4 "OpenCode host process"; `../../10-spec/10-context/scope.md` §3.1):

- **Pinned host binary (F-7).** The driver starts the executable of the tested version by its
  absolute path from the harness configuration. It never starts the `opencode` that PATH resolves:
  on REF-WIN the Windows PATH finds the npm shim `opencode.cmd` (1.18.31), and the Git Bash PATH
  finds another install (1.15.10) first. The driver reads the version from the pinned binary and
  records it in `host_versions.opencode`.
- **Own database (F-8).** `OPENCODE_DB` names an absolute database file of the run, so the tested
  version neither reads nor migrates the user's shared OpenCode database. The stub-model replay also
  points the data, config, cache and state folders at empty run folders, so it reads no credential.
  The eval runner isolates the same folders, so it reads neither the user's OpenCode configuration
  nor its credential store; a paid session reads the OpenRouter key from P-01's key file
  `%USERPROFILE%\.architect-evals\openrouter-key.txt`, passes it to the host process as
  `OPENROUTER_API_KEY` only, and is refused when the file is missing or empty (C002-IF-010 §4,
  revised for defect D-015 item 4).
- **Start-up network conditions of the stub replay (F-9).** Three conditions apply:
  - The models fetch is switched off (`OPENCODE_DISABLE_MODELS_FETCH`). Otherwise OpenCode 1.18.31
    fetches the catalogue from `models.opencode.ai` (1.15.10: `models.dev`).
  - npm runs offline. `@opencode-ai/plugin` of the tested version is ready in the project
    `.opencode/` folder (`package.json` and `node_modules`), and its package is in the npm cache for
    the global config folder, where OpenCode 1.18.31 also installs it.
  - Every non-loopback request goes to a closed proxy port.

  `rg.exe` is no longer pre-provisioned: 1.18.31 ran `grep` and `glob` with an empty cache.
- **Node.js (F-10).** The SDK of 1.18.31 needs Node.js 22.22.2 or later on the machine that runs the
  replay or the eval runner (REF-WIN, upgraded by P-01, Q-s07-02). `architect-sdd` keeps its Node.js
  20 floor (C002-NFR-401).

## Consequences

- Good:
  - every OpenCode replay difference is OpenCode's own;
  - the replay costs no API spend;
  - the eval runner and the replay share one driver.
- **Feasibility settled by spike S-07: feasible.** On both 1.15.10 and 1.18.31, `docs/spikes/S-07-opencode.md` §4
  records that the tested OpenCode:
  - runs a session against a loopback provider without other network access (145 stub sessions on
    1.18.31, no URL other than `127.0.0.1` in the server log);
  - executes exactly the scripted call;
  - needs no real provider, key or network access.

  Option A stands. The Q-replay-01 fallback (C or B) is not needed, and no superseding ADR is
  written. The infeasible-driver branch of `../10-strategy.md` §4 is not taken. The frontmatter keys
  of C002-IF-009 §3 are unchanged.
- **Replay host.** It needs the pinned host binary of the tested version (host process above). That
  binary's version is recorded in the report's `host_versions`. Release replays run on REF-WIN with
  the `file-symlink` capability (C002-REQ-634).
- **Decision reading (S-07 facts F-4, F-5).** `Edit` cases carry the fixture file's text as
  `oldString`, because OpenCode matches it before the permission check (C002-TS-655). A refused call
  shows in one of two forms, and both read as `deny` (C002-TS-656): a tool part with status `error`
  and `Model tried to call unavailable tool`, or a part named `invalid`.
- **Fragility.** The stub implements one provider's streaming protocol. An OpenCode update that
  changes its provider client is caught by the new S-07 record that each change of the tested version
  requires (C002-IF-001 §1, ERR-REL-006).
- Affects: C002-COMP-008, C002-COMP-009, C002-COMP-010, C002-COMP-003; constraint C002-CON-06 (a
  glob gap shows as a replay difference).
