// C002-TC-121 / C002-TS-121 (C002-AC-113.1), staging part (C002-T-015): with a targets/ folder in the
// plugin, the Claude Code staging and both zips hold no targets/ entry, the staged plugin (the input of
// `claude plugin validate`) is the source plugin minus targets/, and PLG-PATH-001 and PLG-LAYOUT-001
// still pass with targets/ present (regression-set §4.4). The routing eval suite plugins/architect/evals/
// and its implicit set evals-implicit/ (C001-T-063) are left out the same way. Runs on a temporary copy of the repository.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { files } from "../../../scripts/check/lib.mjs";
import { stageMarketplace, zipDir } from "../../../scripts/package.mjs";
import { repoRoot } from "../../helpers.ts";
import { pluginCopy } from "../cap11/structure.ts";

const copy = pluginCopy();
after(() => copy.cleanup());
mkdirSync(join(copy.repo, ".claude-plugin"), { recursive: true });
cpSync(join(repoRoot(), ".claude-plugin", "marketplace.json"), join(copy.repo, ".claude-plugin", "marketplace.json"));
mkdirSync(join(copy.plugin, "targets", "opencode"), { recursive: true });
writeFileSync(join(copy.plugin, "targets", "opencode", "dummy.md"), "# Dummy target file\n\nWritten by package-staging.test.ts.\n");

const stage = join(copy.repo, "dist", "architect-0.0.0-test");
stageMarketplace(copy.repo, stage, "0.0.0-test");
const stagedPlugin = join(stage, "plugins", "architect");
const EVALS = /^evals(-implicit)?\//;
const relFiles = (dir: string) => files(dir).map((p: string) => p.slice(dir.length + 1).split("\\").join("/"));

/** Entry names of a zip archive, read from its central directory. */
function zipEntries(path: string): string[] {
  const buf = readFileSync(path);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  assert.ok(eocd >= 0, `${path}: no end of central directory`);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50, `${path}: bad central directory entry`);
    const n = buf.readUInt16LE(p + 28);
    out.push(buf.toString("utf8", p + 46, p + 46 + n));
    p += 46 + n + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  return out;
}

test("the source plugin of the fixture has a targets/ file and the eval cases", () => {
  assert.ok(relFiles(copy.plugin).includes("targets/opencode/dummy.md"));
  assert.ok(relFiles(copy.plugin).some((r: string) => /^evals\/[^/]+\/prompt\.md$/.test(r)), "evals/<case>/prompt.md");
  assert.ok(relFiles(copy.plugin).some((r: string) => /^evals-implicit\/[^/]+\/prompt\.md$/.test(r)), "evals-implicit/<case>/prompt.md");
});

test("the staged plugin holds no targets/ or evals/ entry and is otherwise the source plugin", () => {
  const staged = relFiles(stagedPlugin);
  assert.deepEqual(staged.filter((r: string) => r.startsWith("targets/") || EVALS.test(r)), []);
  assert.deepEqual(staged, relFiles(copy.plugin).filter((r: string) => !r.startsWith("targets/") && !EVALS.test(r)));
});

test("the plugin and marketplace zips hold no targets/ or evals/ entry", () => {
  const pluginZip = join(copy.repo, "dist", "plugin.zip");
  const marketZip = join(copy.repo, "dist", "market.zip");
  zipDir(stagedPlugin, pluginZip);
  zipDir(stage, marketZip);
  const pz = zipEntries(pluginZip);
  const mz = zipEntries(marketZip);
  assert.ok(pz.includes(".claude-plugin/plugin.json"), "plugin zip has plugin.json at its root");
  assert.ok(mz.includes("plugins/architect/.claude-plugin/plugin.json"), "marketplace zip has the plugin");
  assert.deepEqual(pz.filter((e) => /^targets(\/|$)/.test(e)), []);
  assert.deepEqual(mz.filter((e) => /(^|\/)targets(\/|$)/.test(e)), []);
  assert.deepEqual(pz.filter((e) => /^evals(-implicit)?(\/|$)/.test(e)), []);
  assert.deepEqual(mz.filter((e) => /^plugins\/architect\/evals(-implicit)?(\/|$)/.test(e)), []);
});

test("PLG-PATH-001 and PLG-LAYOUT-001 pass with targets/ present", () => {
  assert.deepEqual(copy.findings("PLG-PATH-001"), []);
  assert.deepEqual(copy.findings("PLG-LAYOUT-001"), []);
});
