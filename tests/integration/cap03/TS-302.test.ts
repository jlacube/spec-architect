// C001-TC-302 — verifies C001-TS-302 (C001-AC-302.1, C001-REQ-302): sources in research notes. Plan
// owner C001-T-035 (researcher); LINT-RES-001 arrives with C001-T-021.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { NOTE, note } from "./research-fixture.ts";

const GOOD = "Stripe retries idempotent requests — sources: https://docs.stripe.com/x (2026-10-01) — confidence: high (official docs)";

test("each of 5 findings without a URL or a YYYY-MM-DD access date raises LINT-RES-001", () => {
  const { findings } = lint({
    [NOTE]: note([
      GOOD,
      "No source at all — confidence: low (hearsay)",
      "URL without date — sources: https://example.com/a — confidence: medium (blog)",
      "Date without URL — sources: the docs (2026-10-01) — confidence: medium (memory)",
      "Wrong date form — sources: https://example.com/b (01/10/2026) — confidence: high (docs)",
    ]),
  });
  const hits = withCode(findings, "LINT-RES-001");
  assert.deepEqual(hits.map((h) => h.line), [12, 13, 14, 15], JSON.stringify(findings));
});
