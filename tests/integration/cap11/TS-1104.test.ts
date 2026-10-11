// C001-TC-1104 / C001-TS-1104 (C001-AC-1103.2): the denial message names the rule, the path and .sdd/
// (C001-IF-07 §4: `<RULE>: <tool> on <target> denied — <reason>. Allowed: <summary>.`).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { buildFixture, loadCorpus } from "../../guards/fixture.ts";
import { runBundled } from "../cli/helpers.ts";

const fx = buildFixture(loadCorpus().fixture);
after(() => fx.cleanup());

test("a denied write to src/app.ts names GUARD-PATH-001, the path and .sdd/ on standard error", () => {
  const input = { session_id: "s", cwd: fx.repo, hook_event_name: "PreToolUse", agent_type: "architect:sdd-spec-writer", tool_name: "Write", tool_input: { file_path: `${fx.repo}/src/app.ts`, content: "x" } };
  const r = runBundled(["guard-path"], { cwd: fx.repo, stdin: JSON.stringify(input) });
  assert.equal(r.code, 2);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /GUARD-PATH-001/);
  assert.ok(r.stderr.includes("src/app.ts"), r.stderr);
  assert.ok(r.stderr.includes(".sdd/"), r.stderr);
  assert.match(r.stderr, /^GUARD-PATH-001: Write on .+ denied — .+\. Allowed: .+\.\n$/);
});
