// C001-TC-903 — verifies C001-TS-903 (C001-AC-902.1, C001-REQ-902): unknown status value.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { runInProcess } from "../cli/helpers.ts";
import { tracking } from "./tracking-fixture.ts";

function snapshot(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else out.set(p, readFileSync(p, "utf8"));
    }
  };
  walk(dir);
  return out;
}

test('status "finished" is refused with ERR-CLI-005 listing the valid values, and nothing changes', () => {
  const ws = tracking();
  try {
    const before = snapshot(join(ws.root, ".sdd"));
    const r = runInProcess(["task", "set", "C004-T-031", "--status", "finished"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /ERR-CLI-005/);
    assert.match(r.stderr, /todo, in-progress, blocked, done, dropped/);
    assert.deepEqual(snapshot(join(ws.root, ".sdd")), before);
  } finally {
    ws.cleanup();
  }
});
