// C001-TC-510 — verifies C001-TS-510 (C001-AC-510.1, C001-REQ-510): interface registry. Plan owner
// C001-T-042 (architect); LINT-IF-002 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";

const IF = ".sdd/004-x/10-spec/50-interfaces";
const OPENAPI = "openapi: 3.1.0\ninfo:\n  title: Pay\n  version: 1.0.0\npaths: {}\n";
const registry = (rows: string) =>
  "---\nid: C004-SPEC-IF\nartifact: spec/interfaces-registry\n---\n\n| ID | Interface | Kind | File | Provider | Consumers | Serves |\n|---|---|---|---|---|---|---|\n" + rows;

test("a registered openapi.yaml raises no LINT-IF-002", () => {
  const { findings } = lint({
    [`${IF}/openapi.yaml`]: OPENAPI,
    [`${IF}/README.md`]: registry("| C004-IF-001 | Pay API | HTTP API | `openapi.yaml` | C004-COMP-01 | web | C004-REQ-012 |\n"),
  });
  assert.deepEqual(withCode(findings, "LINT-IF-002"), []);
});

test("an interface file without a registry row raises LINT-IF-002", () => {
  const { findings } = lint({ [`${IF}/openapi.yaml`]: OPENAPI, [`${IF}/README.md`]: registry(""), [`${IF}/errors.md`]: "# Errors\n" });
  const hits = withCode(findings, "LINT-IF-002");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.path, `${IF}/openapi.yaml`);
});
