// Tracking fixture for C001-TS-901 … 924: the minimal change with a started plan and tasks T-029,
// T-031 and T-032 in chosen statuses, plus helpers to read task and change state back.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { makeWorkspace, minimalChange } from "../cli/helpers.ts";
import { plan, task, type TaskOptions } from "../cap06/plan-fixture.ts";

export const DIR = ".sdd/004-x";

export function tracking(tasks: Record<string, TaskOptions> = {}): { root: string; dir: string; cleanup: () => void } {
  const files: Record<string, string> = { ...minimalChange(), ...plan() };
  for (const [seq, o] of Object.entries({ "029": { status: "in-progress" }, "031": { status: "in-progress", dependsOn: ["C004-T-029"] }, "032": {}, ...tasks })) {
    const [path, text] = task(seq, o);
    files[path] = text;
  }
  const ws = makeWorkspace(files);
  return { root: ws.root, dir: join(ws.root, ...DIR.split("/")), cleanup: ws.cleanup };
}

export function taskFm(dir: string, seq: string): Record<string, unknown> {
  return splitFrontmatter(readFileSync(join(dir, "20-plan", "50-tasks", `T-${seq}-x.md`), "utf8")).data ?? {};
}

export function changeFm(dir: string): Record<string, unknown> {
  return splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data ?? {};
}

export function registry(root: string): { changes: { id: string; implementation: { tasks: { done: number } }; defects: Record<string, unknown>[] }[] } {
  return JSON.parse(readFileSync(join(root, ".sdd", "registry.json"), "utf8"));
}
