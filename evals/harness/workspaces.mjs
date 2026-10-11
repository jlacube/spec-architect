// Workspace builders for evals that need a specific .sdd/ state (C001-T-030 …): they run the real CLI
// and then edit only what the scenario's Given requires.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ROOT } from "./fixtures.mjs";

export const CLI = join(ROOT, "plugins", "architect", "scripts", "sdd.mjs");

export function sdd(root, ...args) {
  return execFileSync(process.execPath, [CLI, ...args], { cwd: root, encoding: "utf8" });
}

export function write(root, rel, text) {
  const p = join(root, ...rel.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

export function edit(root, rel, fn) {
  const p = join(root, ...rel.split("/"));
  writeFileSync(p, fn(readFileSync(p, "utf8")));
}

export function git(root, ...args) {
  execFileSync("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: root, stdio: "ignore" });
}
