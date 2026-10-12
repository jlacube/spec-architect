// C001-TC-1114 / C001-TS-1114 (C001-AC-1113.1, C001-REQ-1113): THIRD_PARTY_NOTICES.md lists every
// package bundled into sdd.mjs (from the build's metafile) with its version and license.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";
import { bundledPackages } from "../../../scripts/licenses.mjs";
import { repoRoot } from "../../helpers.ts";

test("notices match the bundle", async () => {
  const root = repoRoot();
  const r = await build({ entryPoints: [join(root, "src", "cli.ts")], bundle: true, platform: "node", format: "esm", write: false, metafile: true, logLevel: "silent", define: { __SDD_VERSION__: '"0.0.0"' } });
  const pkgs = bundledPackages(root, r.metafile);
  assert.ok(pkgs.some((p: { name: string; version: string }) => p.name === "yaml" && /^2\./.test(p.version)), JSON.stringify(pkgs));
  const notices = readFileSync(join(root, "plugins", "architect", "THIRD_PARTY_NOTICES.md"), "utf8");
  for (const p of pkgs) assert.ok(notices.includes(`### ${p.name} ${p.version} — ${p.license}`), `${p.name} ${p.version} (${p.license}) listed`);
});
