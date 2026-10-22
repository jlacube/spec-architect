// `sdd archive` applier (C001-REQ-914 … 920): writes the planned files atomically, moves the change folder
// to `.sdd/_archive/` and regenerates registry.json and the SDD.md status block.
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { renameWithRetry, writeTextAtomic } from "../io/atomic.ts";
import { writeStatus } from "../workspace/status.ts";
import type { ArchivePlan } from "./plan.ts";

/**
 * `SDD_TEST_FAULT=archive-move-fail` makes the command fail after every write and before the folder
 * move (C001-TC-1131, the interrupted archive of C001-REQ-924). Not a user-facing setting.
 */
function moveFails(): boolean {
  return /(?:^|,)archive-move-fail(?:,|$)/.test(process.env["SDD_TEST_FAULT"] ?? "");
}

export function applyArchive(root: string, plan: ArchivePlan): void {
  for (const [path, text] of plan.writes) {
    mkdirSync(dirname(path), { recursive: true });
    writeTextAtomic(path, text);
  }
  if (moveFails()) throw new Error("SDD_TEST_FAULT: archive folder move failed");
  mkdirSync(dirname(plan.move.to), { recursive: true });
  if (existsSync(plan.move.to)) throw new Error(`${plan.move.to} already exists`);
  renameWithRetry(plan.move.from, plan.move.to);
  writeStatus(join(root, ".sdd"));
}
