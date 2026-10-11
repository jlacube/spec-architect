// C001-TC-604 — verifies C001-TS-604 (C001-AC-604.1, C001-REQ-604): code in task files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";
import { plan, task } from "./plan-fixture.ts";

const rows: [lang: string, lines: number, contains: boolean][] = [
  ["typescript", 12, true],
  ["typescript", 4, false],
  ["shell", 20, false],
  ["powershell", 8, false],
];

for (const [lang, lines, contains] of rows) {
  test(`a ${lang} block of ${lines} lines: LINT-TASK-002 ${contains ? "reported" : "not reported"}`, () => {
    const block = "\n```" + lang + "\n" + Array.from({ length: lines }, (_, i) => `line ${i + 1}`).join("\n") + "\n```\n";
    const { code, findings } = lint(plan(task("001", { extra: block })));
    const hits = withCode(findings, "LINT-TASK-002");
    assert.equal(hits.length, contains ? 1 : 0, JSON.stringify(findings));
    if (contains) {
      assert.equal(hits[0]?.severity, "warn");
      assert.equal(code, 0);
    }
  });
}
