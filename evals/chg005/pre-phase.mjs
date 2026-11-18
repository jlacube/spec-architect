// Pre-phase round cases (C005-TS-108 … 110, 112, 113; C005-T-012; C005-IF-004): the conductor as main agent
// on a full-profile change 002 "Export to CSV" whose gate G1 (or G2) is approved through the CLI and whose
// next phase is not started (or, for C005-TS-113, already draft). P-01's message asks the conductor to put
// one question; the answerer gives P-01's scripted answer as free text.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { constitution } from "../cap02/drafting.mjs";
import { askUserQuestions, checker } from "../harness/assert.mjs";
import { CLI, edit, git, sdd, write } from "../harness/workspaces.mjs";

export const DIR = ".sdd/002-export-to-csv";

const IDEATION = `# Ideation — Export to CSV

## 1. Document control

CHG-002, version 1, approved at G1.

## 2. Problem statement

Shop managers copy order lists by hand into spreadsheets.

## 3. Q&A decision record

Q-export-01: one CSV file per export (P-01, round 1).

## 4. Goals and non-goals

Goal: export the orders of a date range as CSV. Non-goal: other formats.

## 5. Scope boundary

In scope: one capability, **export**. Out of scope: scheduling.

## 6. Research index

None.

## 7. Options and decisions index

None needed.

## 8. Design direction

An export endpoint writes one CSV file per request.

## 9. Risks

Large date ranges (low).

## 10. Assumptions

None.

## 11. Open questions

None blocking.

## 12. Sources

None.
`;

const IDEATION_LOG = `---
id: "C002-IDEA-QLOG"
artifact: ideation/questions-log
change: "CHG-002"
phase: 00-ideation
status: draft
---
# CHG-002 — Questions log (00-ideation)

## Round 1 — 2026-11-16

### Q-export-01 — One file per export or one per day?
- **Blocking:** yes · **Material:** yes · **Candidates considered:** 2
- **Why it matters:** decides the export format.
- **Options:**
  1. One file per export (Recommended) — simplest.
  2. One file per day — more files.
- **Sources:** none
- **Answer:** One file per export (Recommended)
- **Extracted instructions:** none
`;

const SPEC_LOG = `---
id: "C002-SPEC-QLOG"
artifact: spec/questions-log
change: "CHG-002"
phase: 10-spec
status: draft
---
# CHG-002 — Questions log (10-spec)
`;

const hashOf = (root, phase) => execFileSync(process.execPath, [CLI, "hash", "002", phase], { cwd: root, encoding: "utf8" }).trim();

function approve(root, phase) {
  const h = hashOf(root, phase);
  edit(root, `${DIR}/change.md`, (t) =>
    t.split("\n").map((l) => (l.startsWith(`  ${phase}:`) ? `  ${phase}: { status: approved, approved_hash: "${h}", approved_at: 2026-11-17, approved_by: "p01" }` : l)).join("\n"));
}

/**
 * Change 002 at `gate` ("G1" or "G2"). `specDraft`: 10-spec draft after G1 (C005-TS-113). `specLog`: a
 * 10-spec questions log exists (G2 cases). `preRound`: text of round 1 already in 10-spec/questions-log.md
 * (C005-TS-110).
 */
export function changeAtGate({ gate = "G1", specDraft = false, preRound = null } = {}) {
  return (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    constitution(root, "approved");
    sdd(root, "change", "new", "Coupon codes", "--profile", "lite", "--kind", "greenfield");
    sdd(root, "change", "new", "Export to CSV", "--profile", "full", "--kind", "greenfield");
    write(root, `${DIR}/00-ideation/ideation.md`, IDEATION);
    write(root, `${DIR}/00-ideation/questions-log.md`, IDEATION_LOG);
    edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1in-review"));
    sdd(root, "gate", "approve", "002", "00-ideation", "--note", "Approve", "--by", "p01");
    if (gate === "G2") {
      write(root, `${DIR}/10-spec/20-capabilities/CAP-01-export/requirements.md`, "---\nid: C002-CAP-01\nartifact: spec/requirements\n---\n\n### C002-REQ-101 — Export orders\n- **Pattern:** event-driven\n- **Statement:** WHEN a manager requests an export of a date range, THE export service SHALL write the orders of that range to one CSV file.\n- **Rationale:** ideation Goals\n- **Stories:** C002-US-101\n- **Priority:** Must\n- **Acceptance:** C002-AC-101.1\n");
      write(root, `${DIR}/10-spec/questions-log.md`, SPEC_LOG + "\n## Round 1 — 2026-11-16\n\n### Q-spec-01 — Date range limit?\n- **Blocking:** no · **Material:** no · **Candidates considered:** 2\n- **Why it matters:** bounds the export size.\n- **Options:**\n  1. 1 year (Recommended) — enough.\n  2. None — unbounded.\n- **Sources:** none\n- **Answer:** 1 year (Recommended)\n- **Extracted instructions:** none\n");
      const CAP = `${DIR}/10-spec/20-capabilities/CAP-01-export`;
      write(root, `${CAP}/stories.md`, "---\nid: C002-CAP-01\nartifact: spec/stories\n---\n\n### C002-US-101 — Export orders\n- **As a** shop manager\n- **I want** to export orders as CSV\n- **So that** I stop copying them by hand\n- **Value / outcome:** no manual copying\n- **Priority:** Must · **Size hint:** S · **Capability:** C002-CAP-01\n- **Context & notes:** none\n- **Requirements:** C002-REQ-101\n- **Traces to:** IDEA\n");
      write(root, `${CAP}/acceptance.md`, "---\nid: C002-CAP-01\nartifact: spec/acceptance\n---\n\n## C002-REQ-101\n\n#### C002-AC-101.1 — Export written\n```gherkin\nScenario: C002-TS-101 — export a date range\n  Given orders in November\n  When the manager exports November\n  Then one CSV file holds those orders\n```\n\n| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |\n|---|---|---|---|---|---|---|---|\n| C002-REQ-101 | TS-101 | n/a: one path | n/a: no limit in v1 | n/a: no error path in v1 | n/a: no roles | n/a: single request | n/a: no abuse vector in v1 |\n");
      write(root, `${DIR}/10-spec/70-dod.md`, "---\nid: C002-SPEC-DOD\nartifact: spec/dod\n---\n# Definition of done\n\n| ID | Statement | Evidence type | Covers |\n|---|---|---|---|\n| C002-DOD-001 | Acceptance tests pass | test-report | C002-REQ-101 |\n");
      // G2 through the CLI, as in a real workspace: approvals.json record and Gate log row (a status edited
      // by hand alone made the conductor stop on the missing record, dev run of 2026-11-18).
      edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}10-spec: \{ status: )not-started/m, "$1in-review").replace(/^phase: .*$/m, "phase: 10-spec"));
      sdd(root, "gate", "approve", "002", "10-spec", "--note", "Approve", "--by", "p01");
    }
    if (specDraft) edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}10-spec: \{ status: )not-started/m, "$1draft").replace(/^phase: .*$/m, "phase: 10-spec"));
    if (preRound) write(root, `${DIR}/10-spec/questions-log.md`, SPEC_LOG + "\n" + preRound);
    sdd(root, "status", "--write");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "fixture");
  };
}

/** Round 1 of C005-TS-108 as the conductor would have logged it (fixture of C005-TS-110). */
export const ROUND_1 = `## Round 1 — 2026-11-17

**Pre-phase round:** answered after the approval of G1, before \`10-spec\` started.

### Q-header-01 — Does the CSV export write a header row?
- **Blocking:** no · **Material:** yes · **Candidates considered:** 2
- **Why it matters:** decides the first line of every export file.
- **Options:**
  1. Yes (Recommended) — readers see the column names.
  2. No — data rows only.
- **Sources:** P-01's request
- **Answer:** Yes, and use a semicolon separator
- **Extracted instructions:** use a semicolon separator
`;

export const read = (root, rel) => (existsSync(join(root, ...rel.split("/"))) ? readFileSync(join(root, ...rel.split("/")), "utf8") : null);

/** Round sections of a questions log: `{ n, text }`. */
export function rounds(log) {
  return (log ?? "")
    .split(/^(?=## Round \d+)/m)
    .slice(1)
    .map((text) => ({ n: Number(/^## Round (\d+)/.exec(text)[1]), text }));
}

/** True when a round entry states it was given after the approval of `gate`, before `phase` started. */
export const markedPrePhase = (text, gate, phase) => new RegExp(gate).test(text) && new RegExp(`before\\W+\`?${phase.replace("-", "\\-")}\`?\\W+start`, "i").test(text);

/** A pre-phase case: `prompt`, P-01's free-text `reply`, `check(ctx)` with `before` (log texts at fixture time). */
export function prePhaseCase({ id, title, fixture, prompt, reply, check: caseCheck, watch = [] }) {
  let before = {};
  return {
    id,
    title,
    agent: "architect:sdd-conductor",
    fixture: (root) => {
      fixture(root);
      before = Object.fromEntries(watch.map((rel) => [rel, read(root, rel)]));
    },
    allowTools: ["Write", "Edit", "Bash", "Read", "Glob", "Grep"],
    maxTurns: 20,
    prompt,
    answer: () => reply,
    assert({ transcript, root }) {
      const { failures, check } = checker();
      caseCheck({ transcript, root, check, before, asked: askUserQuestions(transcript) });
      return failures;
    },
  };
}

/** `sdd stale check 002` reports no stale phase, and `sdd hash 002 <phase>` equals the recorded approval. */
export function noStale(root, check, phases = ["00-ideation"]) {
  const out = execFileSync(process.execPath, [CLI, "stale", "check", "002"], { cwd: root, encoding: "utf8" });
  check(!/stale \(/.test(out), `stale check: ${out.trim()}`);
  const approvals = JSON.parse(readFileSync(join(root, ...DIR.split("/"), "approvals.json"), "utf8"));
  for (const p of phases) check(hashOf(root, p) === approvals[p]?.hash, `sdd hash 002 ${p} differs from approvals.json`);
}
