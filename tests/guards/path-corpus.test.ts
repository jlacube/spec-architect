// C001-NFR-201 (C001-T-050): the path guard decides every case of tests/guards/path-corpus.json as
// expected — no false allow and no false deny — over at least 200 cases on Windows (REF-WIN).
//
// Case format (C002-T-007; read the same way by the replay suite, C002-T-040; checked by
// tests/guards/corpus-format.test.ts, field lists in ./fixture.ts):
//   id, category, tool, agent, expect, note   as before
//   path, field     target path (placeholders) and the tool_input field it goes to (default file_path)
//   cwd             absent: {repo}; null: no cwd in the hook input; a string: that folder (placeholders)
//   env             variables set while the case is decided (placeholders; null unsets), e.g. CLAUDE_PLUGIN_DATA
//   requires        host capability; the case is skipped here when the fixture lacks it
//   platforms       win32 / posix; the case runs only there
//   dialect         shell dialect of the tool (bash / powershell, must match it: PowerShell is powershell); absent: from the tool
//   stdin           raw hook input used unchanged
// The fixture repository has .git next to .sdd, so {repo} is its repository root.
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
      const got = decide(hookInput(c, fx), c.env, fx.resolve);
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
