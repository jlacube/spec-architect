// C001-TC-1105 / C001-TS-1105 (C001-AC-1104.1): traversal, case, link and drive tricks, through
// `sdd guard-path`. ".sdd/link-to-src" is a link (a junction on Windows) to "src" in the fixture. The
// full corpus is tests/guards/path-corpus.json.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { buildFixture, loadCorpus } from "../../guards/fixture.ts";
import { runBundled } from "../cli/helpers.ts";

const fx = buildFixture(loadCorpus().fixture);
after(() => fx.cleanup());
const WIN = process.platform === "win32";

const examples: [string, number, boolean][] = [
  ["C:/repo/.sdd/../src/app.ts", 2, true],
  ["C:/REPO/.SDD/004-x/a.md", 0, WIN], // case-insensitive file names: Windows only
  ["C:/repo/.sdd/link-to-src/app.ts", 2, true],
  ["D:/other/.sdd/a.md", 2, true],
];

for (const [path, code, runs] of examples) {
  test(`an Architect write to ${path} exits ${code}`, { skip: !runs && "Windows only" }, () => {
    const target = path
      .replace("C:/repo", fx.repo)
      .replace("C:/REPO", fx.repo.toUpperCase())
      .replace("D:/other", WIN ? `${fx.resolve("{otherdrive}")}:/other` : `${fx.base}/other`);
    const input = { session_id: "s", cwd: fx.repo, hook_event_name: "PreToolUse", agent_type: "architect:sdd-spec-writer", tool_name: "Write", tool_input: { file_path: target, content: "x" } };
    const r = runBundled(["guard-path"], { cwd: fx.repo, stdin: JSON.stringify(input) });
    assert.equal(r.code, code, r.stderr);
  });
}
