// C002-NFR-103 (C002-DOD-010): target generation time, p95 over 10 runs, threshold 5 s. Each run is the
// whole `node scripts/generate.mjs` process on the source plugin, both targets, its esbuild bundling step
// included (C002-ADR-003); one warm-up run first (warm file cache). Output goes to a temporary folder, so
// dist/ is left alone.
import { spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { p95, record, ROOT } from "./lib.mjs";

const GENERATE = join(ROOT, "scripts", "generate.mjs");
const RUNS = 10;
const THRESHOLD_MS = 5000;

/** Runs the generator once into `out`; returns the wall-clock time in ms (process start to exit). */
function timeGenerate(out) {
  const t0 = process.hrtime.bigint();
  const r = spawnSync(process.execPath, [GENERATE, "--out", out, "--quiet"], { cwd: ROOT, encoding: "utf8" });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  if (r.status !== 0) throw new Error(`generate exited ${r.status}: ${r.stderr}`);
  return ms;
}

export function benchGenerate() {
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-bench-gen-")));
  try {
    const out = join(base, "dist");
    timeGenerate(out);
    const times = Array.from({ length: RUNS }, () => timeGenerate(out));
    const p = p95(times);
    return record("generate", {
      nfr: "C002-NFR-103",
      fixture: "plugins/architect",
      command: "node scripts/generate.mjs --out <tmp> --quiet",
      threshold_ms: THRESHOLD_MS,
      runs: RUNS,
      times_ms: times.map((t) => Math.round(t)),
      p95_ms: p,
      pass: p <= THRESHOLD_MS,
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) benchGenerate();
