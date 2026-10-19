// C002-T-036 — deterministic generation (C002-NFR-301, C002-DOD-015, C002-CON-09): the whole
// `node scripts/generate.mjs` run, bundling step included (C002-ADR-003), generates both target packages
// twice into separate temporary folders; the two trees have 0 differing file names and 0 differing bytes,
// line endings included. The second run starts from another working folder with absolute --source and
// --out, so neither the working folder nor the output path can leak into a generated file. Run under
// PowerShell 7 and under Git Bash (C002-DOD-015).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TARGETS } from "../../../scripts/generate/tables.ts";
import { MANIFEST } from "../../../scripts/generate/writer.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");

/** Every file under `dir` (relative, "/"-separated) with its bytes, in path order. */
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

/** Number of differing bytes between two buffers; a length difference counts every extra byte. */
function differingBytes(a: Buffer, b: Buffer): number {
  let n = Math.abs(a.length - b.length);
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) n++;
  return n;
}

function generate(cwd: string, out: string) {
  const r = spawnSync(process.execPath, [join(root, "scripts", "generate.mjs"), "--source", PLUGIN, "--out", out, "--quiet"], { cwd, encoding: "utf8" });
  return { code: r.status, stderr: r.stderr };
}

test("C002-NFR-301 (C002-DOD-015): two generations into separate folders have 0 differing file names and 0 differing bytes for every target", () => {
  const first = mkdtempSync(join(tmpdir(), "sdd-det-a-"));
  const second = mkdtempSync(join(tmpdir(), "sdd-det-b-"));
  try {
    const a = generate(root, join(first, "dist"));
    assert.equal(a.code, 0, a.stderr);
    const b = generate(second, join(second, "out"));
    assert.equal(b.code, 0, b.stderr);

    for (const t of [...TARGETS].sort()) {
      const ta = tree(join(first, "dist", t));
      const tb = tree(join(second, "out", t));
      assert.ok(ta.has(MANIFEST), `${t}: the package holds its manifest`);
      assert.ok(ta.size > 1, `${t}: the package holds generated files beside the manifest`);
      assert.deepEqual([...tb.keys()], [...ta.keys()], `${t}: 0 differing file names`);
      const diffs = [...ta].map(([path, bytes]) => ({ path, bytes: differingBytes(bytes, tb.get(path)!) })).filter((d) => d.bytes > 0);
      assert.deepEqual(diffs, [], `${t}: 0 differing bytes`);
    }
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
});
