// C001-TC-909 — verifies C001-TS-909 (C001-AC-908.1, C001-REQ-908): bad ref.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runInProcess } from "../cli/helpers.ts";
import { tracking } from "./tracking-fixture.ts";

test("a reference to an undefined ID is refused with ERR-CLI-008", () => {
  const ws = tracking();
  try {
    for (const ref of ["C004-REQ-999", "C009-REQ-012"]) {
      const r = runInProcess(["defect", "add", "--ref", ref, "--summary", "x"], { cwd: ws.root });
      assert.equal(r.code, 2, ref);
      assert.match(r.stderr, new RegExp(`^ERR-CLI-008: \`${ref}\` is not defined in an active change`));
    }
  } finally {
    ws.cleanup();
  }
});
