// Shared benchmark helpers (C001-T-027): timed runs of the bundled CLI, p95, machine info and result
// files under bench/results/.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { cpus, release, tmpdir, totalmem, type } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateLarge } from "../tests/fixtures/gen-large.mjs";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SDD = join(ROOT, "plugins", "architect", "scripts", "sdd.mjs");

/** Runs `node sdd.mjs <args>` and returns the wall-clock time in ms (process start to exit). */
export function timeCli(args, cwd, env = {}) {
  const t0 = process.hrtime.bigint();
  const r = spawnSync(process.execPath, [SDD, ...args], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  if (r.status !== 0 && r.status !== 1) throw new Error(`sdd ${args.join(" ")} exited ${r.status}: ${r.stderr}`);
  return ms;
}

export function p95(values) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil(0.95 * s.length) - 1)];
}

export function machine() {
  return { os: `${type()} ${release()}`, cpu: cpus()[0]?.model ?? "unknown", cores: cpus().length, memory_gb: Math.round(totalmem() / 2 ** 30), node: process.version };
}

/** A fresh fx-large workspace in a temporary directory, with its registry built. */
export function fxLarge() {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-large-")));
  generateLarge(root);
  timeCli(["status", "--write"], root);
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

/** Writes bench/results/<name>-<timestamp>.json and prints a one-line summary. */
export function record(name, result) {
  const at = new Date().toISOString();
  const doc = { benchmark: name, measured_at: at, machine: machine(), ...result };
  const dir = join(ROOT, "bench", "results");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}-${at.replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  const verdict = result.skipped
    ? `skipped (${result.skipped})`
    : result.p95_ms !== undefined
      ? `p95 ${result.p95_ms.toFixed(0)} ms / threshold ${result.threshold_ms} ms → ${result.pass ? "pass" : "FAIL"}`
      : `${result.pass ? "pass" : "FAIL"} (${result.threshold})`;
  console.log(`${name}: ${verdict}`);
  return doc;
}

/** N timed runs after one warm-up run (warm file cache). */
export function measure(args, cwd, runs) {
  timeCli(args, cwd);
  const times = Array.from({ length: runs }, () => timeCli(args, cwd));
  return { runs, times_ms: times.map((t) => Math.round(t)), p95_ms: p95(times) };
}
