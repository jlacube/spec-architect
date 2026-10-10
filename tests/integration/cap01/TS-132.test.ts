// C001-TC-132 — verifies C001-TS-132 (C001-AC-126.1, C001-REQ-126): atomic registry write.
// The fault is injected the way the test harness does it for a CLI subprocess: through the
// SDD_TEST_FAULT environment variable. `sdd status --write` (C001-T-017) writes through the same
// function; the CLI-level run is added there.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AtomicWriteError, writeTextAtomic } from "../../../src/io/atomic.ts";

test("a temporary-file write failing after 10 bytes keeps registry.json and leaves no temp file", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-ts132-"));
  const previous = JSON.stringify({ version: 1, changes: [{ number: "004", status: "spec" }] }, null, 2) + "\n";
  const target = join(dir, "registry.json");
  writeFileSync(target, previous);
  process.env["SDD_TEST_FAULT"] = "atomic-write-after-bytes=10";
  try {
    assert.throws(() => writeTextAtomic(target, previous.replace("spec", "plan")), AtomicWriteError);
    assert.deepEqual(readFileSync(target), Buffer.from(previous));
    assert.deepEqual(
      readdirSync(dir).filter((n) => n.startsWith("registry.json.tmp")),
      [],
    );
  } finally {
    delete process.env["SDD_TEST_FAULT"];
    rmSync(dir, { recursive: true, force: true });
  }
});

test("C001-TS-132 through the CLI: `sdd status --write` with the fault injected exits non-zero and keeps registry.json", async () => {
  const { makeWorkspace, runBundled, REBUILD } = await import("../cli/helpers.ts");
  const { changeMd, SDD_MD } = await import("../workspace-fixtures.ts");
  const ws = makeWorkspace({ ".sdd/SDD.md": SDD_MD, ".sdd/registry.json": REBUILD, ".sdd/001-alpha/change.md": changeMd({ nnn: "001", phase: "10-spec" }) });
  try {
    const target = join(ws.root, ".sdd", "registry.json");
    // Make the stored registry stale so that status --write has to write it.
    const stale = readFileSync(target, "utf8").replace('"phase": "10-spec"', '"phase": "20-plan"');
    writeFileSync(target, stale);
    const r = runBundled(["status", "--write"], { cwd: ws.root, env: { SDD_TEST_FAULT: "atomic-write-after-bytes=10" } });
    assert.notEqual(r.code, 0);
    assert.equal(r.code, 3);
    assert.match(r.stderr, /^ERR-CLI-017: Could not write `.*registry\.json`; previous version kept\. Fix: Check disk space and permissions\n$/);
    assert.equal(readFileSync(target, "utf8"), stale);
    assert.deepEqual(readdirSync(join(ws.root, ".sdd")).filter((n) => n.startsWith("registry.json.tmp")), []);
  } finally {
    ws.cleanup();
  }
});
