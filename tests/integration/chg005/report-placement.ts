// Helper of C005-TS-176 … 179 (C005-REQ-127; defect D-001): lite change 004 whose task section C004-T-001 holds
// exactly the given lines, followed by one of three tails, and `sdd task set` run through the bundled CLI.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { litePlan, liteChange } from "./lite-fixture.ts";

/** What follows the task section C004-T-001: the task section C004-T-002, `## Test mapping`, or the end of the file. */
export type Tail = "t002" | "mapping" | "eof";

export interface PlacementCase {
  root: string;
  planPath: string;
  /** The plan's lines before the run. */
  before: string[];
  /** Runs `sdd task set C004-T-001 <args>` and returns the plan's lines after it. */
  run: (args: string[]) => string[];
  cleanup: () => void;
}

export function placementCase(section: string[], tail: Tail): PlacementCase {
  const ws = liteChange();
  const planPath = join(ws.dir, "20-plan", "plan.md");
  const base = litePlan();
  const prefix = base.slice(0, base.indexOf("### C004-T-001"));
  const after = tail === "t002" ? base.slice(base.indexOf("### C004-T-002")) : tail === "mapping" ? base.slice(base.indexOf("## Test mapping")) : "";
  writeFileSync(planPath, prefix + section.join("\n") + "\n" + after);
  const before = readFileSync(planPath, "utf8").split("\n");
  return {
    root: ws.root,
    planPath,
    before,
    run(args) {
      const r = runBundled(["task", "set", "C004-T-001", ...args], { cwd: ws.root });
      assert.equal(r.code, 0, r.stderr);
      return readFileSync(planPath, "utf8").split("\n");
    },
    cleanup: ws.cleanup,
  };
}

/** Index of the line `text` after the heading of C004-T-001. */
export function lineAt(lines: string[], text: string): number {
  const head = lines.indexOf("### C004-T-001 — CSV export");
  return lines.findIndex((l, i) => i >= head && l === text);
}
