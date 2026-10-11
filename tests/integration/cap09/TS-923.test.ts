// C001-TC-923 — verifies C001-TS-923 (C001-AC-922.1, C001-REQ-922): task transitions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runInProcess } from "../cli/helpers.ts";
import { tracking } from "./tracking-fixture.ts";

const rows: [from: string, to: string, code: number][] = [
  ["todo", "in-progress", 0],
  ["done", "in-progress", 0],
  ["dropped", "todo", 2],
  ["dropped", "done", 2],
];

for (const [from, to, code] of rows) {
  test(`${from} → ${to} exits ${code}`, () => {
    const ws = tracking({ "031": { status: from, commit: from === "done" ? "abc1234" : null } });
    try {
      const r = runInProcess(["task", "set", "C004-T-031", "--status", to, ...(to === "done" ? ["--commit", "abc1234"] : [])], { cwd: ws.root });
      assert.equal(r.code, code, r.stderr);
      if (code === 2) {
        assert.match(r.stderr, /ERR-CLI-013/);
        assert.match(r.stderr, new RegExp(`Transition \`${from}\` → \`${to}\` not allowed`));
      }
    } finally {
      ws.cleanup();
    }
  });
}
