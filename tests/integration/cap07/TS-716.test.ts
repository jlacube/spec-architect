// C001-TC-716 — verifies C001-TS-716 (C001-AC-716.1, C001-REQ-716): markers collected.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runTrace } from "./trace-fixture.ts";

const SCOPE = ".sdd/004-x/10-spec/10-context/scope.md";
const scope = [
  "---", "id: C004-SPEC-CTX-03", "artifact: spec/context/scope", "---", "", "# Scope", "",
  "Retry budget [NEEDS CLARIFICATION: Q-spec-03] is open.",
  "Storage [NEEDS CLARIFICATION: Q-spec-04] too.",
  "Users are internal [ASSUMPTION: AS-02].",
  "Not markers: `[NEEDS CLARIFICATION: Q-x]` and \"[ASSUMPTION: y]\".",
  "```text", "[WAIVED: G2]", "```", "",
].join("\n");

test("two clarifications and one assumption give 3 rows; code, quotes and fences are not listed", () => {
  const md = runTrace(["--write"], { [SCOPE]: scope }).file("10-spec/85-open-items.md") ?? "";
  const rows = md.split("\n").filter((l) => /^\| (NEEDS CLARIFICATION|ASSUMPTION|WAIVED) \|/.test(l));
  assert.deepEqual(rows, [
    "| NEEDS CLARIFICATION | `10-spec/10-context/scope.md` | 8 | Q-spec-03 |",
    "| NEEDS CLARIFICATION | `10-spec/10-context/scope.md` | 9 | Q-spec-04 |",
    "| ASSUMPTION | `10-spec/10-context/scope.md` | 10 | AS-02 |",
  ]);
  assert.match(md, /^Total: 3$/m);
});

test("open items are written in every started phase folder only", () => {
  const spec = runTrace(["--write"], {});
  assert.notEqual(spec.file("10-spec/85-open-items.md"), null);
  assert.equal(spec.file("20-plan/85-open-items.md"), null);
  assert.notEqual(runTrace(["--write"], {}, true).file("20-plan/85-open-items.md"), null);
});
