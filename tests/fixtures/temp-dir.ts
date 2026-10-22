// Removal of temporary test folders that a process the test started may still hold for a moment (a
// language server Serena started, a stub that is ending): the folder is removed with retries for up to
// `waitMs`; when it is still held, more attempts are made when the test process exits, and a detached
// remover keeps trying for up to two minutes after it (a language server Serena started can outlive the
// killed process tree, under load for longer than the test file). Without this, each run left such
// folders in the temporary folder (C001-T-080).
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

const pending = new Set<string>();
let exitHook = false;

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function tryRemove(dir: string): boolean {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // Still held; the caller retries.
  }
  return !existsSync(dir);
}

/** A detached Node.js process that retries the removal of `dirs` every 2 s for up to 2 minutes. */
function removeLater(dirs: string[]): void {
  const script = [
    `const { existsSync, rmSync } = require("node:fs");`,
    `const dirs = ${JSON.stringify(dirs)};`,
    `const end = Date.now() + 120000;`,
    `const tick = () => {`,
    `  for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }); } catch {} }`,
    `  if (dirs.some((d) => existsSync(d)) && Date.now() < end) setTimeout(tick, 2000);`,
    `};`,
    `tick();`,
  ].join("\n");
  try {
    const env = { ...process.env };
    delete env["NODE_V8_COVERAGE"]; // the remover is not code under test
    spawn(process.execPath, ["-e", script], { detached: true, stdio: "ignore", windowsHide: true, env }).unref();
  } catch {
    // Best effort: the folder is left for the OS.
  }
}

/** Removes `dir`, retrying for up to `waitMs`; returns false when it is still there (an exit retry is then registered). */
export function removeTempDir(dir: string, { waitMs = 15000 }: { waitMs?: number } = {}): boolean {
  const end = Date.now() + waitMs;
  for (;;) {
    if (tryRemove(dir)) {
      pending.delete(dir);
      return true;
    }
    if (Date.now() >= end) break;
    sleep(250);
  }
  pending.add(dir);
  if (!exitHook) {
    exitHook = true;
    process.once("exit", () => {
      for (const d of pending) {
        for (let i = 0; i < 8 && !tryRemove(d); i++) sleep(250);
      }
      const left = [...pending].filter((d) => existsSync(d));
      if (left.length > 0) removeLater(left);
    });
  }
  return false;
}
