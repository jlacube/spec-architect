// C001-TC-808 — verifies C001-TS-808 (C001-AC-807.1, C001-REQ-807): refuse on lint error.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COVERAGE, runInProcess } from "../cli/helpers.ts";
import { approvedChange } from "./gate-fixture.ts";

test("TR-03 on C004-AC-012.2 refuses the approval; waiving the criterion lets it pass", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    const acc = join(ws.dir, "10-spec", "20-capabilities", "CAP-01-a", "acceptance.md");
    writeFileSync(acc, readFileSync(acc, "utf8").replace(COVERAGE, "#### C004-AC-012.2 — Second\nNo scenario yet.\n\n" + COVERAGE));
    const req = join(ws.dir, "10-spec", "20-capabilities", "CAP-01-a", "requirements.md");
    writeFileSync(req, readFileSync(req, "utf8").replace("- **Acceptance:** C004-AC-012.1", "- **Acceptance:** C004-AC-012.1, C004-AC-012.2"));
    const before = readFileSync(join(ws.dir, "change.md"), "utf8");
    const r = runInProcess(["gate", "approve", "004", "10-spec"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /ERR-CLI-010/);
    assert.match(r.stderr, /TR-03/);
    assert.equal(readFileSync(join(ws.dir, "change.md"), "utf8"), before);
    assert.equal(existsSync(join(ws.dir, "approvals.json")), false, "a refusal writes nothing");
    const ok = runInProcess(["gate", "approve", "004", "10-spec", "--waive", "C004-AC-012.2", "--note", "scenario added in plan", "--by", "p01"], { cwd: ws.root });
    assert.equal(ok.code, 0, ok.stderr);
  } finally {
    ws.cleanup();
  }
});
