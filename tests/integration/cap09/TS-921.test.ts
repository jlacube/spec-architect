// C001-TC-921 / C001-TS-921 (C001-AC-920.1, C001-REQ-920): the change folder moves to _archive/, its
// status becomes archived, and registry.json and the SDD.md status block are regenerated.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace } from "./archive-fixture.ts";

test("final move", () => {
  const ws = archiveWorkspace({ reqs: [{ cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "ADDED" }] });
  try {
    runBundled(["status", "--write"], { cwd: ws.root });
    assert.match(readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8"), /^\| 004 \|/m);
    const r = runBundled(["archive", "004"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /archived: CHG-004 → \.sdd\/_archive\/004-x/);
    assert.ok(existsSync(join(ws.root, ".sdd", "_archive", "004-x", "change.md")));
    assert.ok(!existsSync(join(ws.root, ".sdd", "004-x")));
    assert.match(readFileSync(join(ws.root, ".sdd", "_archive", "004-x", "change.md"), "utf8"), /^status: archived$/m);
    const reg = JSON.parse(readFileSync(join(ws.root, ".sdd", "registry.json"), "utf8")) as { changes: { id: string; status: string }[] };
    assert.deepEqual(reg.changes.map((c) => [c.id, c.status]), [["CHG-004", "archived"]]);
    const sddMd = readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8");
    const block = sddMd.slice(sddMd.indexOf("<!-- sdd:status:begin -->"), sddMd.indexOf("<!-- sdd:status:end -->"));
    assert.doesNotMatch(block, /004/);
    // An archived change cannot be archived again.
    assert.equal(runBundled(["archive", "004"], { cwd: ws.root }).code, 2);
  } finally {
    ws.cleanup();
  }
});
