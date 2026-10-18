// C002-T-034 — target zips of `npm run package` (C002-REQ-101, Q-release-01): each
// dist/architect-<target>-<version>.zip lists exactly the files of its dist/<target>/ folder, at the zip
// root, with equal bytes, and its generation manifest equals the folder's; after a generator failure no
// target zip exists. Runs packageTargets of scripts/package.mjs on a temporary dist/.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GENERATED_TARGETS, packageTargets, targetZipName } from "../../../scripts/package.mjs";
import { MANIFEST } from "../../../scripts/generate/writer.ts";
import { repoRoot } from "../../helpers.ts";
import { readZip } from "../../helpers/zip.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const version = (JSON.parse(readFileSync(join(PLUGIN, ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;
const base = mkdtempSync(join(tmpdir(), "sdd-tzip-"));
after(() => rmSync(base, { recursive: true, force: true }));

/** Every file under `dir`, relative and "/"-separated, to its bytes. */
function tree(dir: string): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  const walk = (abs: string, rel: string) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out.set(r, readFileSync(p));
    }
  };
  walk(dir, "");
  return out;
}

const dist = join(base, "ok");
const run = packageTargets({ root, dist, version, stdio: "pipe" });

for (const t of GENERATED_TARGETS) {
  test(`${t}: the zip lists exactly the files of dist/${t}/ with equal content`, () => {
    assert.equal(run.code, 0, run.stderr);
    const folder = tree(join(dist, t));
    const zip = readZip(join(dist, targetZipName(t, version)));
    assert.deepEqual([...zip.keys()].sort(), [...folder.keys()].sort());
    for (const [p, data] of folder) assert.ok(zip.get(p)!.equals(data), `${t}: ${p} differs`);
  });

  test(`${t}: the zip's generation manifest equals the folder's and lists every other entry`, () => {
    assert.equal(run.code, 0, run.stderr);
    const zip = readZip(join(dist, targetZipName(t, version)));
    const inZip = zip.get(MANIFEST);
    assert.ok(inZip, `${MANIFEST} at the zip root`);
    assert.ok(inZip.equals(readFileSync(join(dist, t, MANIFEST))));
    const m = JSON.parse(inZip.toString("utf8")) as { target: string; files: { path: string }[] };
    assert.equal(m.target, t);
    assert.deepEqual(m.files.map((f) => f.path).sort(), [...zip.keys()].filter((k) => k !== MANIFEST).sort());
  });
}

test("no target zip exists after a generator failure", () => {
  const src = join(base, "src", "plugins", "architect");
  cpSync(PLUGIN, src, { recursive: true });
  const table = join(src, "targets", "copilot.json");
  writeFileSync(table, JSON.stringify({ ...(JSON.parse(readFileSync(table, "utf8")) as object), enforcement_mode: "bogus" }, null, 2) + "\n");
  const failDist = join(base, "fail");
  mkdirSync(failDist, { recursive: true });
  for (const t of GENERATED_TARGETS) writeFileSync(join(failDist, targetZipName(t, version)), "earlier run\n");
  const r = packageTargets({ root, dist: failDist, version, source: src, stdio: "pipe" });
  assert.equal(r.code, 1, r.stderr);
  for (const t of GENERATED_TARGETS) {
    assert.ok(!existsSync(join(failDist, targetZipName(t, version))), `${t}: no zip`);
    assert.ok(!existsSync(join(failDist, t)), `${t}: no folder`);
  }
});
