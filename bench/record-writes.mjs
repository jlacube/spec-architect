// Preload of the uninterrupted reference run of `bench/faults.mjs` (C001-TC-1126): after every rename,
// unlink or whole-file write of the CLI process, it records the content of each state file (null when it
// does not exist) as one JSON line. The bench turns these lines into the complete versions the command
// writes to each path, intermediate versions included (for example `change.md` with `status: archived`
// before `archive` moves the folder).
//   SDD_BENCH_RECORD=<jsonl file> SDD_BENCH_STATE=<JSON array of paths relative to the cwd>
//   node --import=<this file> sdd.mjs …
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { join } from "node:path";

const out = process.env.SDD_BENCH_RECORD;
const state = JSON.parse(process.env.SDD_BENCH_STATE ?? "[]");
const root = process.cwd();
const { appendFileSync, existsSync, readFileSync } = fs;

let busy = false;
function snapshot() {
  if (!out || busy) return;
  busy = true;
  try {
    record();
  } finally {
    busy = false;
  }
}

function record() {
  const doc = {};
  for (const rel of state) {
    const p = join(root, rel);
    doc[rel] = existsSync(p) ? readFileSync(p, "utf8") : null;
  }
  appendFileSync(out, JSON.stringify(doc) + "\n");
}

for (const name of ["renameSync", "unlinkSync", "writeFileSync"]) {
  const original = fs[name];
  fs[name] = function (...args) {
    const r = original.apply(this, args);
    snapshot();
    return r;
  };
}
syncBuiltinESMExports();
