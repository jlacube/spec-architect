// C001-NFR-301 — crash-safe state files, deterministic part: every atomic write of the state-writing
// commands is failed in turn (SDD_TEST_FAULT=atomic-write-fail-at=k, half the bytes written), and
// each state file must remain its previous or its new complete version, with no temporary files
// left. The random-kill campaign of 1,000 runs is bench/faults.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateLarge } from "../fixtures/gen-large.mjs";
import { runBundled } from "./cli/helpers.ts";

const STATE = [".sdd/registry.json", ".sdd/SDD.md", ".sdd/001-change-001/change.md", ".sdd/001-change-001/approvals.json", ".sdd/001-change-001/20-plan/50-tasks/T-001-work-1.md"];
const COMMANDS: { name: string; args: string[]; prepare?: (root: string) => void }[] = [
  { name: "status --write", args: ["status", "--write"], prepare: (root) => rmSync(join(root, ".sdd", "registry.json")) },
  { name: "task set", args: ["task", "set", "C001-T-001", "--status", "in-progress"] },
  { name: "gate approve", args: ["gate", "approve", "001", "20-plan", "--note", "ok", "--by", "test"] },
  { name: "defect add", args: ["defect", "add", "--ref", "C001-REQ-101", "--summary", "s", "--by", "test"] },
];

const read = (root: string) => STATE.map((rel) => (existsSync(join(root, rel)) ? readFileSync(join(root, rel), "utf8").replace(/"generated_at": "[^"]*"/g, "") : null));

function temps(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? temps(p) : /\.tmp-\d+-[0-9a-f]+$/.test(n) ? [p] : [];
  });
}

test("a failed write at any point of a state-writing command leaves each state file old or new", () => {
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-faults-")));
  try {
    const template = join(base, "template");
    generateLarge(template, 1);
    assert.equal(runBundled(["status", "--write"], { cwd: template }).code, 0);
    let injected = 0;
    for (const c of COMMANDS) {
      const copy = (name: string) => {
        const dir = join(base, name);
        cpSync(template, dir, { recursive: true });
        c.prepare?.(dir);
        return dir;
      };
      const ref = copy(`${c.args[0]}-ref`);
      const before = read(ref);
      assert.equal(runBundled(c.args, { cwd: ref }).code, 0, c.name);
      const after = read(ref);
      const writes = after.filter((v, i) => v !== before[i]).length;
      assert.ok(writes > 0, `${c.name} writes state`);
      for (let k = 1; k <= writes + 1; k++) {
        const dir = copy(`${c.args[0]}-${k}`);
        const r = runBundled(c.args, { cwd: dir, env: { SDD_TEST_FAULT: `atomic-write-fail-at=${k}` } });
        const now = read(dir);
        STATE.forEach((rel, i) => assert.ok(now[i] === before[i] || now[i] === after[i], `${c.name}, write ${k}: ${rel} is neither old nor new`));
        assert.deepEqual(temps(join(dir, ".sdd")), [], `${c.name}, write ${k}: temporary files left`);
        if (r.code === 3) {
          assert.match(r.stderr, /ERR-CLI-017/);
          injected++;
        }
      }
    }
    assert.ok(injected >= COMMANDS.length, `faults injected: ${injected}`);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
