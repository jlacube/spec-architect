---
id: C002-OA-009
artifact: plan/option-analysis
change: CHG-002
phase: 20-plan
status: draft
title: "How the corpus replay obtains OpenCode's permission decisions"
---

# C002-OA-009 — How the corpus replay obtains OpenCode's permission decisions

## Problem

The corpus replay (C002-COMP-008) feeds every applicable case of the path and shell corpora (533
cases today, plus the cases of C002-REQ-607) to each enforcement mechanism in use. For OpenCode, the
mechanism `opencode-permissions` is "evaluated by OpenCode at its tested version through a headless
session or its SDK" (C002-IF-009 §2). It runs in both enforcement modes:

- the identity cases of C002-REQ-626 and C002-REQ-632 replay on OpenCode only;
- the S-07 replay selects the OpenCode mode (C002-IF-001 §6.3).

The spec fixes the case-to-call mapping (§2.2) and how a decision is read (§2.3). It does not fix how
an OpenCode tool call is produced without a model choosing it.

Binding:

- 0 differences (C002-NFR-201, C002-NFR-202);
- release evidence at the tested version (C002-REQ-617, C002-REQ-620);
- eval spend caps of C002-NFR-105 and P-01's eval budget;
- the OpenCode server and SDK facts of C002-R-001 D-01 and D-02.

Out of scope: the other two mechanisms, whose drivers C002-IF-009 §2.2 fixes.

## Criteria

| Criterion | Weight |
|---|---|
| Evidence fidelity | 35% |
| Determinism | 25% |
| No API spend | 20% |
| Low implementation effort and fragility | 20% |

- **Evidence fidelity:** the shipped OpenCode binary at the tested version decides the exact call of
  §2.2, with the generated `opencode.json` loaded as an adopter's would be.
- **Determinism:** two replays of the same corpus and package give the same report.
- **No API spend:** no model tokens are paid per replay.
- **Low implementation effort and fragility:** code to write, and how often an OpenCode update breaks
  it.

## Candidates

Four genuinely different drivers exist. A plugin or server endpoint that injects agent tool calls was
searched for in C002-R-001 D-01 and D-02 and is not documented.

- **A — Scripted model endpoint:** OpenCode at the tested version, started through its server and JS
  SDK on the replay fixture. The fixture's provider points at a loopback stub that answers each turn
  with exactly the case's tool call, then ends the turn. The decision is read from the tool part's
  state (§2.3).
- **B — Real-model sessions:** the same server and SDK, with a low-cost model prompted to make the
  case's call.
- **C — Permission module in-process:** the permission-evaluation code of the OpenCode source at the
  tested tag, imported by the replay adapter and fed the generated rules and the case.
- **D — Re-implemented matcher:** the adapter models OpenCode's documented matching (last matching
  rule wins, `*` crosses `/` and spaces) and decides itself.

## Scores

| Candidate | Evidence fidelity | Determinism | No API spend | Low implementation effort and fragility | Weighted |
|---|---|---|---|---|---|
| A — Scripted model endpoint | 5 | 5 | 5 | 2 | 4.40 |
| B — Real-model sessions | 4 | 1 | 1 | 4 | 2.65 |
| C — Permission module in-process | 3 | 5 | 5 | 3 | 3.90 |
| D — Re-implemented matcher | 1 | 5 | 5 | 4 | 3.40 |

- **A:**
  - *Fidelity 5:* the binary's own engine decides the exact call, with its own configuration loading.
  - *Effort 2:* a stub of one provider's streaming protocol, and a feasibility point for S-07. The
    tested OpenCode must accept a loopback provider endpoint and run with auto-update and sharing
    off.
  - The session plumbing is shared with the OpenCode eval runner (C002-COMP-009, C002-IF-010 §4).
- **B:**
  - *Determinism 1:* the model may reword or skip the call, so a difference may be the model's
    rather than the rules'.
  - *Spend 1:* about 550 sessions per replay. Each starts with an agent body of up to 64,000
    characters (C002-NFR-104), which comes to several dollars per replay against the prepaid key.
- **C:**
  - *Fidelity 3:* OpenCode's code, not its build. Configuration merging and agent resolution are
    bypassed.
  - *Effort 3:* deep imports of internal modules, which can break across OpenCode versions.
- **D:**
  - *Fidelity 1:* a model of OpenCode written by us, so the replay would confirm the generator's own
    assumptions.

## Sensitivity

A leads C by 0.50. If A's effort score drops to 1, A still leads by 0.30.

A loses its lead only if S-07 shows A infeasible: OpenCode cannot use a loopback provider without
other network access, or cannot be held to a single scripted tool call. C is then the deterministic
fallback, but it changes the evidence base. The P-01 question Q-replay-01 covers that case.

## Presented

1. A — Scripted model endpoint (Recommended)
2. C — Permission module in-process
3. B — Real-model sessions

## Recommendation

**A — Scripted model endpoint.** The tested binary decides every case deterministically at no API
cost, and the plumbing is the one the OpenCode eval runner needs anyway.

## Rejected

- D — Re-implemented matcher: not "OpenCode at its tested version" (C002-IF-009 §2). It would replay
  the generator's assumptions rather than OpenCode's behaviour.
