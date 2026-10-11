// C001-NFR-201 (C001-T-050): the path guard decides every case of tests/guards/path-corpus.json as
// expected — no false allow and no false deny — over at least 200 cases on Windows (REF-WIN).
import { test } from "node:test";
import assert from "node:assert/strict";
import { applies, buildFixture, decide, expected, hookInput, loadCorpus } from "./fixture.ts";

test("the path guard corpus is decided 100% as expected", (t) => {
  const corpus = loadCorpus();
  const fx = buildFixture(corpus.fixture);
  try {
    const matrix = { "allow/allow": 0, "allow/deny": 0, "deny/allow": 0, "deny/deny": 0 };
    const wrong: string[] = [];
    let run = 0;
    for (const c of corpus.cases) {
      if (!applies(c, fx)) continue;
      run++;
      const want = expected(c);
      const got = decide(hookInput(c, fx));
      matrix[`${want}/${got}`]++;
      if (got !== want) wrong.push(`${c.id} ${c.category} ${JSON.stringify(c.path ?? c.stdin)}: expected ${want}, got ${got}`);
    }
    t.diagnostic(`cases run ${run} of ${corpus.cases.length}; expected/decided ${JSON.stringify(matrix)}`);
    assert.deepEqual(wrong, [], wrong.join("\n"));
    assert.equal(matrix["deny/allow"], 0, "no false allow");
    if (process.platform === "win32") assert.ok(run >= 200, `at least 200 cases run on Windows (${run})`);
  } finally {
    fx.cleanup();
  }
});

test("case IDs are unique and every case names its expectation", () => {
  const { cases } = loadCorpus();
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  for (const c of cases) assert.ok(typeof c.expect === "string" || (c.expect.win32 && c.expect.posix), c.id);
});
