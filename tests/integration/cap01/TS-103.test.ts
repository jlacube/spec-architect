// C001-TC-103 — verifies C001-TS-103 (C001-AC-102.1, C001-REQ-102): idempotent init (and --force).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";
import { specFile } from "../../helpers/spec-file.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

const ROOT_DIRS = ["_constitution", "_living", "_decisions", "_templates", "_archive"];
const registrySchema = JSON.parse(
  readFileSync(specFile("001", "10-spec/50-interfaces/registry.schema.json"), "utf8"),
) as object;
const validateRegistry = new Ajv2020({ strict: false }).compile(registrySchema);

test("C001-TS-103: a second init is non-destructive and recreates missing entries", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    const constitution = join(ws.root, ".sdd", "_constitution", "constitution.md");
    writeFileSync(constitution, "# My constitution\r\nEdited by the user.\n");
    const before = readFileSync(constitution);
    const sddBefore = readFileSync(join(ws.root, ".sdd", "SDD.md"));
    const registryBefore = readFileSync(join(ws.root, ".sdd", "registry.json"));
    rmSync(join(ws.root, ".sdd", "_decisions"), { recursive: true });
    const r = runBundled(["init"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(readFileSync(constitution), before);
    assert.deepEqual(readFileSync(join(ws.root, ".sdd", "SDD.md")), sddBefore);
    assert.deepEqual(readFileSync(join(ws.root, ".sdd", "registry.json")), registryBefore);
    assert.ok(statSync(join(ws.root, ".sdd", "_decisions")).isDirectory());
    assert.match(r.stdout, /workspace exists/);
    assert.match(r.stdout, /^created: _decisions\/$/m);
    assert.doesNotMatch(r.stdout, /created: _living/);
  } finally {
    ws.cleanup();
  }
});

test("init --force re-renders SDD.md but keeps its status block and every other file", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    const sdd = join(ws.root, ".sdd", "SDD.md");
    const custom = readFileSync(sdd, "utf8")
      .replace(/<!-- sdd:status:begin -->[\s\S]*<!-- sdd:status:end -->/, "<!-- sdd:status:begin -->\n| kept |\n<!-- sdd:status:end -->")
      .replace("## Conventions", "## Conventions (edited)");
    writeFileSync(sdd, custom);
    const registryBefore = readFileSync(join(ws.root, ".sdd", "registry.json"));
    const r = runBundled(["init", "--force"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const after = readFileSync(sdd, "utf8");
    assert.match(after, /^## Conventions$/m);
    assert.match(after, /<!-- sdd:status:begin -->\n\| kept \|\n<!-- sdd:status:end -->/);
    assert.deepEqual(readFileSync(join(ws.root, ".sdd", "registry.json")), registryBefore);
  } finally {
    ws.cleanup();
  }
});
