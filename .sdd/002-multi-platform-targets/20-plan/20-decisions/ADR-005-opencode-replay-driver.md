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

- It starts the tested `opencode` binary through its server and JS SDK on the replay fixture. The
  fixture holds the generated package, the fixture's adopter agent of C002-IF-009 §2.2, and auto-update
  and sharing turned off.
- The fixture's model provider points at a loopback stub run by the adapter. For each case, the stub
  answers the session's first turn with exactly the tool call of §2.2, then ends the turn.
- The adapter reads the decision from the tool part's final state, as §2.3 defines it.

Every decision comes from the shipped binary, deterministically and without API spend. The session
driver, in particular session start, the event stream and permission replies, is shared with the
OpenCode eval runner (C002-COMP-009, C002-IF-010 §4).

`@opencode-ai/sdk` is a root devDependency, pinned exactly to the release that matches the tested
OpenCode version. It is never bundled into a shipped file, so the licence check of C002-REQ-413 does
not apply to it. Both `tests/replay/` and `evals/harness/` resolve it.

## Consequences

- Good:
  - every OpenCode replay difference is OpenCode's own;
  - the replay costs no API spend;
  - the eval runner and the replay share one driver.
- **Feasibility is a spike S-07 item.** The S-07 task records in the body of
  `docs/spikes/S-07-opencode.md` whether the tested OpenCode:
  - runs a session against a loopback provider without other network access;
  - executes exactly the scripted call.

  The frontmatter keys of C002-IF-009 §3 are unchanged. If S-07 shows it is infeasible, a new ADR
  supersedes this one with P-01's answer to Q-replay-01 (fallback C or B). Until then the OpenCode
  release lacks its replay evidence (ERR-REL codes of C002-IF-009 §5).
- **Replay host.** It needs the tested `opencode` binary on PATH, recorded in the report's
  `host_versions`. Release replays run on REF-WIN with the `file-symlink` capability
  (C002-REQ-634).
- **Fragility.** The stub implements one provider's streaming protocol. An OpenCode update that
  changes its provider client is caught by the new S-07 record that each change of the tested version
  requires (C002-IF-001 §1, ERR-REL-006).
- Affects: C002-COMP-008, C002-COMP-009, C002-COMP-010, C002-COMP-003; constraint C002-CON-06 (a
  glob gap shows as a replay difference).
