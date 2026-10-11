// `sdd archive` applier (C001-REQ-914 … 920): writes the planned files atomically, moves the change folder
// to `.sdd/_archive/` and regenerates registry.json and the SDD.md status block.
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { writeTextAtomic } from "../io/atomic.ts";
import { writeStatus } from "../workspace/status.ts";
import type { ArchivePlan } from "./plan.ts";

export function applyArchive(root: string, plan: ArchivePlan): void {
  for (const [path, text] of plan.writes) {
    mkdirSync(dirname(path), { recursive: true });
    writeTextAtomic(path, text);
  }
  mkdirSync(dirname(plan.move.to), { recursive: true });
  if (existsSync(plan.move.to)) throw new Error(`${plan.move.to} already exists`);
  renameSync(plan.move.from, plan.move.to);
  writeStatus(join(root, ".sdd"));
}
