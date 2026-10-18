// Fixture workspaces for eval runs (C001-T-029): every run gets a fresh copy, so runs never share
// state and never see this repository (its context and memory would leak into the session).
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateLarge } from "../../tests/fixtures/gen-large.mjs";
import { liteSpecDraftedAt, specStart } from "../cap02/drafting.mjs";
import { edit, sdd, write } from "./workspaces.mjs";

export const ROOT = join(import.meta.dirname, "..", "..");

function git(cwd, ...args) {
  execFileSync("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd, stdio: "ignore" });
}

/**
 * Builds a fixture into a new temporary directory and returns `{ root, cleanup }`.
 * `fixture` is a fixture name (fx-empty, fx-bootstrap, fx-brownfield-ts, fx-large), a directory to
 * copy, a function that fills the empty directory, or null for an empty directory.
 */
export function makeWorkspace(fixture) {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-eval-")));
  // On Windows the session's child processes can hold the directory for a moment after the run.
  const cleanup = () => {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
    } catch (e) {
      console.warn(`could not remove ${root}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  try {
    if (typeof fixture === "function") fixture(root);
    else if (fixture === "fx-empty") git(root, "init", "-q");
    else if (fixture === "fx-bootstrap") {
      // This repository's workspace (metrics/ excluded) in a git repository of its own.
      cpSync(join(ROOT, ".sdd"), join(root, ".sdd"), { recursive: true, filter: (src) => !src.includes(join(".sdd", "metrics")) });
      git(root, "init", "-q");
    }
    else if (fixture === "fx-brownfield-ts") {
      cpSync(join(ROOT, "tests", "fixtures", "fx-brownfield-ts"), root, { recursive: true });
      git(root, "init", "-q");
      git(root, "add", ".");
      git(root, "commit", "-q", "-m", "initial service");
      const payments = join(root, "src", "checkout", "payments.ts");
      for (let i = 1; i <= 6; i++) {
        writeFileSync(payments, readFileSync(payments, "utf8") + `\n// revision ${i}: adjust capture rules\n`);
        git(root, "commit", "-q", "-am", `payments: revision ${i}`);
      }
    } else if (fixture === "fx-large") generateLarge(root);
    else if (typeof fixture === "string") cpSync(fixture, root, { recursive: true });
    return { root, cleanup };
  } catch (e) {
    cleanup();
    throw e;
  }
}

// fx-gate (CHG-002 test plan §2; C002-T-037): lite change 002 built with the real CLI from the CHG-001
// gate helpers (evals/cap02/drafting.mjs, evals/cap08/gate.mjs). Variants:
//   "spec-in-review" (default) — 10-spec drafted, lint-clean, reviewed by the critic (no open finding)
//                                and in review: ready for gate G2 (C002-TC-217, 316, 613, 634);
//   "ideation-approved"        — 00-ideation approved, 10-spec not started (C002-TC-635);
//   "ready-to-archive"         — G2 and G3 approved, its one task done: `sdd archive 002 --dry-run`
//                                passes (C002-TC-132).
// Change 001 is an earlier lite change that has not started.
const FX_GATE_DIR = ".sdd/002-coupon-codes";

/** A critic report of change 002 for `phase` with no open finding (C001-IF-11 §2). */
const criticReport = (phase) => `---
artifact: critic-report
change: CHG-002
phase: ${phase}
reviewed_ids: all
---
# Critic report — CHG-002 ${phase}

## Summary

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 0 |

## Findings

None.

## Rubric

| Rubric item | Result |
|---|---|
| Every item testable | pass |

## Why no further findings

One requirement with one criterion and a complete coverage table; scope matches the approved ideation.
`;

const FX_GATE_PLAN = `---
id: C002-PLAN
artifact: plan/lite
change: CHG-002
phase: 20-plan
status: draft
---
# CHG-002 — Plan (lite)

## Strategy

One task: the checkout applies the coupon before tax.

## Tasks

### C002-T-001 — Apply the coupon at checkout
- **Status:** done
- **Depends on:**
- **Implements:** C002-REQ-101
- **Satisfies AC:** C002-AC-101.1
- **Verified by:** C002-TS-101, C002-TC-001
- **Estimate:** S
- **Targets:** src/checkout
- **Verification:** the acceptance test of C002-TS-101 passes
- **Done when:** C002-TC-001 passes

## Test mapping
| TC | TS | Level | Location |
|---|---|---|---|
| C002-TC-001 | C002-TS-101 | integration | tests/checkout/coupon.test.ts |

## Risks
| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| C002-RISK-001 | Rounding of the discounted total | low | low | round to cents after the discount |
`;

const setPhase = (root, phase, status) =>
  edit(root, `${FX_GATE_DIR}/change.md`, (t) => t.replace(new RegExp(`^( {2}${phase}: \\{ status: )[a-z-]+`, "m"), `$1${status}`).replace(/^phase: .*$/m, `phase: ${phase}`));

function commit(root, message) {
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", message);
}

/** Builds fx-gate into `root` (see the variants above). */
export function fxGate(root, { variant = "spec-in-review" } = {}) {
  if (variant === "ideation-approved") return specStart({ nnn: 2 })(root);
  if (variant !== "spec-in-review" && variant !== "ready-to-archive") throw new Error(`fx-gate: unknown variant ${variant}`);
  liteSpecDraftedAt(2)(root);
  write(root, `${FX_GATE_DIR}/10-spec/90-critic-report.md`, criticReport("10-spec"));
  setPhase(root, "10-spec", "in-review");
  commit(root, "spec in review");
  if (variant === "spec-in-review") return;
  sdd(root, "gate", "approve", "002", "10-spec", "--note", "Approve", "--by", "p01");
  write(root, `${FX_GATE_DIR}/20-plan/plan.md`, FX_GATE_PLAN);
  write(root, `${FX_GATE_DIR}/20-plan/90-critic-report.md`, criticReport("20-plan"));
  setPhase(root, "20-plan", "in-review");
  sdd(root, "trace", "002", "--write");
  sdd(root, "gate", "approve", "002", "20-plan", "--note", "Approve", "--by", "p01");
  commit(root, "ready to archive");
}
