// C001-T-080 (D-014, finding F-1 of docs/nfr-results.md): the `cpSync` filter of the Claude Code plugin copy
// excludes plugins/architect/targets/ whether the paths carry the Windows long-path prefix `\\?\` or not.
// Node 20's fs.cpSync passes prefixed paths to the filter on Windows, Node 22 plain ones; this test calls
// the filter directly, so it does not depend on what cpSync passes and runs the same on both versions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { CLAUDE_EXCLUDES, pluginFilter, stripLongPathPrefix } from "../../../scripts/package.mjs";

const win = process.platform === "win32";
const root = win ? "C:\\work\\repo\\plugins\\architect" : "/work/repo/plugins/architect";
const prefix = (p: string) => `\\\\?\\${p}`;
// Root and argument, each with or without the prefix (the prefix exists only on Windows).
const variants = win
  ? [
      { name: "plain root, plain path", src: root, arg: (p: string) => p },
      { name: "plain root, prefixed path", src: root, arg: prefix },
      { name: "prefixed root, plain path", src: prefix(root), arg: (p: string) => p },
      { name: "prefixed root, prefixed path", src: prefix(root), arg: prefix },
    ]
  : [{ name: "plain root, plain path", src: root, arg: (p: string) => p }];

test("CLAUDE_EXCLUDES names targets, evals and evals-implicit", () => {
  assert.deepEqual(CLAUDE_EXCLUDES, ["targets", "evals", "evals-implicit"]);
});

for (const v of variants) {
  test(`pluginFilter (${v.name}): targets, evals and their content are excluded, other folders are kept`, () => {
    const keep = pluginFilter(v.src);
    assert.equal(keep(v.arg(join(root, "targets"))), false, "targets/");
    assert.equal(keep(v.arg(join(root, "targets", "x", "a.md"))), false, "targets/x/a.md");
    assert.equal(keep(v.arg(join(root, "evals"))), false, "evals/");
    assert.equal(keep(v.arg(join(root, "evals", "route-critic-01", "graders", "routes-to-critic.md"))), false, "evals/<case>/graders/x.md");
    assert.equal(keep(v.arg(join(root, "evals-implicit", "implicit-critic-01", "prompt.md"))), false, "evals-implicit/<case>/prompt.md");
    assert.equal(keep(v.arg(root)), true, "the plugin root itself");
    for (const kept of [["skills", "a", "SKILL.md"], ["agents", "x.md"], ["scripts", "sdd.mjs"], [".claude-plugin", "plugin.json"], ["targets-old"], ["docs", "targets", "y.md"], ["skills", "evals", "SKILL.md"], ["evals-old"]]) {
      assert.equal(keep(v.arg(join(root, ...kept))), true, kept.join("/"));
    }
  });
}

test("stripLongPathPrefix removes \\\\?\\ and maps \\\\?\\UNC\\ to \\\\, other paths unchanged", () => {
  assert.equal(stripLongPathPrefix("\\\\?\\C:\\a\\b"), "C:\\a\\b");
  assert.equal(stripLongPathPrefix("\\\\?\\UNC\\server\\share\\a"), "\\\\server\\share\\a");
  assert.equal(stripLongPathPrefix("C:\\a\\b"), "C:\\a\\b");
  assert.equal(stripLongPathPrefix("\\\\server\\share"), "\\\\server\\share");
  assert.equal(stripLongPathPrefix("/a/b"), "/a/b");
});

test("pluginFilter with a \\\\?\\UNC\\ root and argument excludes targets", { skip: !win && "Windows paths" }, () => {
  const unc = "\\\\server\\share\\plugins\\architect";
  const keep = pluginFilter(`\\\\?\\UNC\\server\\share\\plugins\\architect`);
  assert.equal(keep(`\\\\?\\UNC\\server\\share\\plugins\\architect\\targets\\x.md`), false);
  assert.equal(keep(join(unc, "targets")), false);
  assert.equal(keep(join(unc, "skills")), true);
});
