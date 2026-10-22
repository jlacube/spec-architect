// C001-NFR-301: kill the CLI at random points of state-writing commands and check that every state
// file is either its previous or its new complete version. 0 corrupted files over 1,000 runs.
// The runs are split evenly over the four commands the NFR's method names: `status --write`, `task set`,
// `gate approve` and `archive` (250 each for 1,000 runs).
// Usage: node bench/faults.mjs [runs]
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
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
      return { ...c, before, after, changed, ms };
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
        for (const rel of STATE)
          if (now[rel] !== plan.before[rel] && now[rel] !== plan.after[rel]) results.corrupted.push({ run: i, command: plan.name, file: rel });
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
      files_written: Object.fromEntries(plans.map((p) => [p.name, p.changed])), pass: results.corrupted.length === 0,
      note: "kill delays are uniform over 0–1.2 × the command's uninterrupted duration; runs split evenly over the four commands",
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const doc = await benchFaults(Number(process.argv[2] ?? 1000));
  console.log(`faults: ${doc.runs} runs, ${doc.killed} killed, ${doc.corrupted_count} corrupted, ${doc.leftover_temp_files} leftover temp files`);
}
