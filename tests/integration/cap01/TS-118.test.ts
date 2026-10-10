// C001-TC-118 — verifies C001-TS-118 (C001-AC-113.1, C001-REQ-113): unknown ID type.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWorkspace, minimalChange, runBundled } from "../cli/helpers.ts";

test("id next FOO exits 2 with ERR-CLI-004 and the list of valid types", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const r = runBundled(["id", "next", "FOO", "--change", "004"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.equal(
      r.stderr,
      "ERR-CLI-004: Unknown ID type `FOO`; valid: GOAL, SC, NG, AS, CON, CAP, US, REQ, AC, TS, NFR, INV, IF, ERR, COMP, DEC, ADR, OA, R, M, T, TC, RISK, RB, DOD. Fix: Use a type from C001-IF-04 §2\n",
    );
    assert.equal(r.stdout, "");
  } finally {
    ws.cleanup();
  }
});
