import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./helpers.ts";

const root = repoRoot();
const cli = join(root, "plugins", "architect", "scripts", "sdd.mjs");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string };

test("sdd version prints architect-plugin@<package version>", () => {
  const out = execFileSync(process.execPath, [cli, "version"], { encoding: "utf8" });
  assert.equal(out.trim(), `architect-plugin@${pkg.version}`);
});

test("build produces exactly one file in plugins/architect/scripts", () => {
  assert.deepEqual(readdirSync(join(root, "plugins", "architect", "scripts")), ["sdd.mjs"]);
});

test("plugin manifest version matches package.json", () => {
  const manifest = JSON.parse(
    readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8"),
  ) as { version: string };
  assert.equal(manifest.version, pkg.version);
});
