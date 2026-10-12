// C001-TC-1115 / C001-TS-1115 (C001-AC-1114.1, C001-REQ-1114): a GPL-3.0 package imported by the CLI
// sources makes the build fail, naming the package and "GPL-3.0". Run on a copy of the build inputs
// (scripts/, src/, package.json) with a fake GPL package added, so the repository is untouched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";

test("GPL dependency", () => {
  const root = repoRoot();
  const tmp = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-gpl-")));
  try {
    for (const d of ["scripts", "src"]) cpSync(join(root, d), join(tmp, d), { recursive: true });
    cpSync(join(root, "package.json"), join(tmp, "package.json"));
    mkdirSync(join(tmp, "plugins", "architect", "scripts"), { recursive: true });
    cpSync(join(root, "plugins", "architect", "THIRD_PARTY_NOTICES.md"), join(tmp, "plugins", "architect", "THIRD_PARTY_NOTICES.md"));
    // node_modules: the real packages, plus a GPL one imported by the CLI entry.
    mkdirSync(join(tmp, "node_modules"));
    for (const name of ["esbuild", "yaml", "@esbuild"]) symlinkSync(join(root, "node_modules", name), join(tmp, "node_modules", name), "junction");
    mkdirSync(join(tmp, "node_modules", "gpl-thing"));
    writeFileSync(join(tmp, "node_modules", "gpl-thing", "package.json"), JSON.stringify({ name: "gpl-thing", version: "1.2.3", license: "GPL-3.0", main: "index.js" }));
    writeFileSync(join(tmp, "node_modules", "gpl-thing", "index.js"), "module.exports = 1;\n");
    const cli = join(tmp, "src", "cli.ts");
    writeFileSync(cli, `import gpl from "gpl-thing";\nvoid gpl;\n${readFileSync(cli, "utf8")}`);
    const r = spawnSync(process.execPath, [join(tmp, "scripts", "build.mjs")], { cwd: tmp, encoding: "utf8" });
    assert.notEqual(r.status, 0, r.stdout);
    assert.match(r.stderr, /gpl-thing@1\.2\.3 \(GPL-3\.0\)/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
