// C005-TC-045 — verifies C005-TS-145 (C005-AC-115.1, C005-REQ-115): zero or one marked task accepted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { taskMd } from "../workspace-fixtures.ts";
import { change002, lint } from "./lint-fixture.ts";

for (const count of [0, 1]) {
  test(`full-profile change with ${count} marked task(s): no LINT-TASK-005`, () => {
    const ws = change002();
    try {
      const dir = join(ws.dir, "20-plan", "50-tasks");
      for (const seq of [3, 4]) {
        const marked = seq === 4 && count === 1 ? "archive_task: true\n" : "";
        writeFileSync(join(dir, `T-00${seq}-t.md`), taskMd("002", seq, "todo").replace("---\n# ", `${marked}---\n# `));
      }
      assert.deepEqual(lint(ws.root, ["002"]).findings.filter((f) => f.code === "LINT-TASK-005"), []);
    } finally {
      ws.cleanup();
    }
  });
}
