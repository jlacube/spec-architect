// C001-NFR-301: kill the CLI at random points of state-writing commands and check that every state
// file is either its previous or a complete new version. 0 failing files over 1,000 runs.
// The runs are split evenly over the four commands the NFR's method names: `status --write`, `task set`,
// `gate approve` and `archive` (250 each for 1,000 runs).
// Pass rule (C001-TC-1126), per state file and run: the file is its previous version or a complete
// version that the command writes to that path in an uninterrupted run, intermediate versions included
// (for example `change.md` with `status: archived` before `archive` moves the folder). Absence passes for
// a file that did not exist before or that the command moves away. A mixed state (some files new, others
// previous) passes. The versions come from one uninterrupted reference run per command under
// bench/record-writes.mjs, which records the state files after every rename, unlink and write. The
// process exits 1 when any run has a failing file.
// Usage: node bench/faults.mjs [runs]
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateLarge, makeArchivable } from "../tests/fixtures/gen-large.mjs";
import { record, SDD, timeCli } from "./lib.mjs";

const TASK = ".sdd/001-change-001/20-plan/50-tasks/T-001-work-1.md";
const COMMANDS = [
  { name: "status --write", args: ["status", "--write"], prepare: (root) => rmSync(join(root, ".sdd", "registry.json"), { force: true }) },
  { name: "task set", args: ["task", "set", "C001-T-001", "--status", "in-progress"], prepare: () => {} },
  { name: "gate approve", args: ["gate", "approve", "001", "20-plan", "--note", "ok", "--by", "bench"], prepare: () => {} },
  // G3 approved and every task done (C001-REQ-913), so archive merges into _living/ and moves the change.
  { name: "archive", args: ["archive", "001"], prepare: (root) => makeArchivable(root) },
];
const STATE = [
  ".sdd/registry.json",
  ".sdd/SDD.md",
  ".sdd/001-change-001/change.md",
  ".sdd/001-change-001/approvals.json",
  TASK,
  // Written by `archive`: the living specs, the project glossary and the change folder under _archive/.
  ".sdd/_living/CAP-area-1.md",
  ".sdd/_living/CAP-area-2.md",
  ".sdd/_living/CAP-area-3.md",
  ".sdd/_living/CAP-area-4.md",
  ".sdd/_constitution/glossary.md",
  ".sdd/_archive/001-change-001/change.md",
  TASK.replace(".sdd/", ".sdd/_archive/"),
];

/** File contents with volatile timestamps removed, so two complete versions compare equal. */
function stable(text) {
  return text.replace(/"generated_at": "[^"]*"/g, '"generated_at": ""');
}

/**
 * The C001-TC-1126 rule for one state file of one run. `now` and `plan.before` / `plan.after` are the
 * stable contents (null: absent) after the killed run, before the command and after an uninterrupted
 * run; `plan.versions` holds every complete content the uninterrupted run wrote to the path.
 */
export function fileOk(now, plan) {
  if (now === plan.before) return true;
  if (now === null) return plan.before === null || plan.after === null;
  return plan.versions.has(now);
}

const RECORDER = pathToFileURL(join(fileURLToPath(new URL(".", import.meta.url)), "record-writes.mjs")).href;

/** An uninterrupted run of `args` in `cwd` under the recorder: per state file, every content it wrote. */
function recordVersions(args, cwd, log) {
  const env = { ...process.env, SDD_BENCH_RECORD: log, SDD_BENCH_STATE: JSON.stringify(STATE) };
  env.NODE_OPTIONS = [process.env.NODE_OPTIONS, `--import=${RECORDER}`].filter(Boolean).join(" ");
  const r = spawnSync(process.execPath, [SDD, ...args], { cwd, env, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`reference run of ${args.join(" ")} failed: ${r.stderr}`);
  const versions = Object.fromEntries(STATE.map((rel) => [rel, new Set()]));
  const lines = existsSync(log) ? readFileSync(log, "utf8").split("\n").filter(Boolean) : [];
  if (lines.length === 0) throw new Error(`the recorder saw no write of ${args.join(" ")}`);
  for (const line of lines) {
    const doc = JSON.parse(line);
    for (const rel of STATE) if (doc[rel] !== null && doc[rel] !== undefined) versions[rel].add(stable(doc[rel]));
  }
  return versions;
}

function snapshot(root) {
  return Object.fromEntries(STATE.map((rel) => [rel, existsSync(join(root, rel)) ? stable(readFileSync(join(root, rel), "utf8")) : null]));
}

function leftovers(root) {
  const out = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tmp-\d+-[0-9a-f]+$/.test(n)) out.push(relative(root, p));
    }
  };
  walk(join(root, ".sdd"));
  return out;
}

function runKilled(args, cwd, delayMs) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SDD, ...args], { cwd, stdio: "ignore" });
    const timer = setTimeout(() => child.kill("SIGKILL"), delayMs);
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, killed: signal !== null });
    });
  });
}

export async function benchFaults(runs = 1000, concurrency = 8) {
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-faults-")));
  try {
    const template = join(base, "template");
    generateLarge(template, 1);
    timeCli(["status", "--write"], template);
    // Old and new complete versions and the duration of each command.
    const plans = COMMANDS.map((c) => {
      const dir = join(base, `expected-${c.args[0]}`);
      cpSync(template, dir, { recursive: true });
      c.prepare(dir);
      const before = snapshot(dir);
      const ms = timeCli(c.args, dir);
      const after = snapshot(dir);
      const changed = STATE.filter((rel) => before[rel] !== after[rel]);
      if (changed.length === 0) throw new Error(`${c.name} changed no state file; the campaign would prove nothing`);
      // The complete versions an uninterrupted run writes, recorded in a second copy of the same state.
      const rec = join(base, `recorded-${c.args[0]}`);
      cpSync(template, rec, { recursive: true });
      c.prepare(rec);
      const versions = recordVersions(c.args, rec, join(base, `recorded-${c.args[0]}.jsonl`));
      for (const rel of changed) if (after[rel] !== null) versions[rel].add(after[rel]);
      const files = Object.fromEntries(STATE.map((rel) => [rel, { before: before[rel], after: after[rel], versions: versions[rel] }]));
      const intermediate = STATE.reduce((n, rel) => n + [...versions[rel]].filter((v) => v !== before[rel] && v !== after[rel]).length, 0);
      return { ...c, before, after, changed, files, intermediate, ms };
    });
    const results = { runs: 0, killed: 0, completed: 0, corrupted: [], leftover_temp_files: 0, by_command: {} };
    let next = 0;
    const worker = async () => {
      for (;;) {
        const i = next++;
        if (i >= runs) return;
        const plan = plans[i % plans.length];
        const dir = join(base, `run-${i}`);
        cpSync(template, dir, { recursive: true });
        plan.prepare(dir);
        const r = await runKilled(plan.args, dir, Math.random() * plan.ms * 1.2);
        const now = snapshot(dir);
        for (const rel of STATE) if (!fileOk(now[rel], plan.files[rel])) results.corrupted.push({ run: i, command: plan.name, file: rel });
        results.leftover_temp_files += leftovers(dir).length;
        results.runs++;
        r.killed ? results.killed++ : results.completed++;
        results.by_command[plan.name] = (results.by_command[plan.name] ?? 0) + 1;
        rmSync(dir, { recursive: true, force: true });
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
    return record("faults", {
      nfr: "C001-NFR-301", threshold: "0 corrupted state files", ...results, corrupted_count: results.corrupted.length,
      command_ms: Object.fromEntries(plans.map((p) => [p.name, Math.round(p.ms)])),
      files_written: Object.fromEntries(plans.map((p) => [p.name, p.changed])),
      intermediate_versions: Object.fromEntries(plans.map((p) => [p.name, p.intermediate])),
      rule: "C001-TC-1126: previous version, or a complete version the command writes to the path in an uninterrupted run (intermediate versions included); absent passes when it did not exist before or the command moves it away",
      pass: results.corrupted.length === 0,
      note: "kill delays are uniform over 0–1.2 × the command's uninterrupted duration; runs split evenly over the four commands",
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

// Run as a script only (not when bundled into a test, where import.meta.url is the test file).
if (process.argv[1]?.endsWith("faults.mjs") && fileURLToPath(import.meta.url) === process.argv[1]) {
  const doc = await benchFaults(Number(process.argv[2] ?? 1000));
  console.log(`faults: ${doc.runs} runs, ${doc.killed} killed, ${doc.corrupted_count} failing state files, ${doc.leftover_temp_files} leftover temp files`);
  if (!doc.pass) process.exitCode = 1;
}
