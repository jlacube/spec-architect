// A gate workspace under git (C001-TS-818, 819): change 004 ready for G2, everything committed once, with a
// local committer identity so the test never depends on the user's git configuration.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { approvedChange, type GateWorkspace } from "./gate-fixture.ts";

export function git(root: string, ...args: string[]): string {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

export function gitWorkspace(): GateWorkspace {
  const ws = approvedChange(["00-ideation"]);
  writeFileSync(join(ws.root, "src-app.ts"), "export const a = 1;\n");
  git(ws.root, "init", "-q");
  git(ws.root, "config", "user.name", "Test");
  git(ws.root, "config", "user.email", "test@example.invalid");
  git(ws.root, "add", "-A");
  git(ws.root, "commit", "-q", "-m", "fixture");
  return ws;
}
