// C001-TC-1103 / C001-TS-1103 (C001-AC-1103.1): path guard decisions through `sdd guard-path`, with
// hook input shaped as in spike S-04. "C:/repo" of the scenario is a temporary fixture repository.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { buildFixture, loadCorpus } from "../../guards/fixture.ts";
import { runBundled } from "../cli/helpers.ts";

const fx = buildFixture(loadCorpus().fixture);
after(() => fx.cleanup());

function guard(tool: string, agent: string | null, path: string, cwd = fx.repo) {
  const input: Record<string, unknown> = { session_id: "s", cwd, hook_event_name: "PreToolUse", tool_name: tool, tool_input: { file_path: path, content: "x" } };
  if (agent !== null) input["agent_type"] = agent;
  return runBundled(["guard-path"], { cwd, stdin: JSON.stringify(input) });
}

const examples: [string, string | null, string, number][] = [
  ["Write", "architect:sdd-spec-writer", "C:/repo/.sdd/004-x/a.md", 0],
  ["Write", "architect:sdd-spec-writer", "C:/repo/src/app.ts", 2],
  ["Edit", "architect:sdd-architect", "C:/repo/README.md", 2],
  ["Write", "general-purpose", "C:/repo/src/app.ts", 0],
  ["Write", null, "C:/repo/src/app.ts", 0],
  // D-007: an Architect agent's own memory folder, never another agent's.
  ["Write", "architect:sdd-cartographer", "C:/repo/.claude/agent-memory/architect-sdd-cartographer/MEMORY.md", 0],
  ["Write", "architect:sdd-researcher", "C:/repo/.claude/agent-memory/architect-sdd-cartographer/MEMORY.md", 2],
];

for (const [tool, agent, path, code] of examples) {
  test(`${tool} by ${agent ?? "(plain main session)"} on ${path} exits ${code}`, () => {
    const r = guard(tool, agent, path.replace("C:/repo", fx.repo));
    assert.equal(r.code, code, r.stderr);
    if (code === 0) assert.equal(r.stderr, "");
  });
}
