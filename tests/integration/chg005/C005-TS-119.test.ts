// C005-TC-019 — verifies C005-TS-119 (C005-AC-106.1, C005-REQ-106; C005-CON-04): template show prints the
// hand-off template unfilled.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

test("template show lite/20-plan/handoff.md is byte-identical to the source template", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    const r = runBundled(["template", "show", "lite/20-plan/handoff.md"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, readFileSync(join(repoRoot(), "plugins", "architect", "templates", "lite", "20-plan", "handoff.md"), "utf8"));
  } finally {
    ws.cleanup();
  }
});
