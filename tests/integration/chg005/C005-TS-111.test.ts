// C005-TC-011 — verifies C005-TS-111 (C005-AC-126.1, C005-REQ-126): a pre-phase log in a not-started phase
// adds or removes no lint finding.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { lint } from "./lint-fixture.ts";
import { prePhaseChange, prePhaseLog } from "./prephase-fixture.ts";

const ROWS: ["lite" | "full", "G1" | "G2", "10-spec" | "20-plan"][] = [
  ["lite", "G1", "10-spec"],
  ["lite", "G2", "20-plan"],
  ["full", "G1", "10-spec"],
];

for (const [profile, gate, phase] of ROWS) {
  test(`${profile} change at ${gate}: a pre-phase ${phase}/questions-log.md changes no finding`, () => {
    const ws = prePhaseChange(profile, gate);
    try {
      const log = join(ws.dir, phase, "questions-log.md");
      // A lite scaffold already holds the phase's questions log only for 00-ideation; start without one.
      rmSync(log, { force: true });
      const without = lint(ws.root, ["003"]).findings;
      writeFileSync(log, prePhaseLog(phase, gate));
      const withLog = lint(ws.root, ["003"]).findings;
      assert.deepEqual(withLog.filter((f) => f.path.endsWith(`${phase}/questions-log.md`)), []);
      assert.deepEqual(withLog, without);
      const s = runBundled(["stale", "check", "003"], { cwd: ws.root });
      assert.equal(s.code, 0, s.stderr);
      assert.doesNotMatch(s.stdout, /stale \(/);
    } finally {
      ws.cleanup();
    }
  });
}
