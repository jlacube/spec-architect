// C001-NFR-202 (C001-T-054): the no-network preload is active in the test run and in the CLI processes
// the tests spawn; a network attempt is recorded and fails. The run itself must record none
// (checked by scripts/test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("the preload is active in this test process", async () => {
  assert.match(process.env["NODE_OPTIONS"] ?? "", /no-network\.mjs/);
  // This deliberate attempt is recorded in a private log, not the run's.
  const dir = mkdtempSync(join(tmpdir(), "sdd-net-"));
  const runLog = process.env["SDD_NO_NETWORK_LOG"];
  process.env["SDD_NO_NETWORK_LOG"] = join(dir, "net.log");
  try {
    await assert.rejects(async () => fetch("http://127.0.0.1:9/"), /network access blocked/);
    assert.match(readFileSync(join(dir, "net.log"), "utf8"), /^fetch /);
  } finally {
    process.env["SDD_NO_NETWORK_LOG"] = runLog;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a child Node process inherits the stubs and records the attempt", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-net-"));
  try {
    const log = join(dir, "net.log");
    const r = spawnSync(process.execPath, ["-e", "require('node:net').connect(9, '127.0.0.1')"], { env: { ...process.env, SDD_NO_NETWORK_LOG: log }, encoding: "utf8" });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /network access blocked in tests \(net\.connect\)/);
    assert.match(readFileSync(log, "utf8"), /^net\.connect /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
