// C001-TC-101 — verifies C001-TS-101 (C001-AC-101.1, C001-REQ-101): init on an empty repository.
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

test("C001-TS-101: init on an empty repository creates the workspace", () => {
  const ws = makeWorkspace({ "README.md": "# fx-empty\n" });
  try {
    const r = runBundled(["init"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.ok(existsSync(join(ws.root, ".sdd", "SDD.md")));
    for (const d of ROOT_DIRS) assert.ok(statSync(join(ws.root, ".sdd", d)).isDirectory(), d);
    const registry = JSON.parse(readFileSync(join(ws.root, ".sdd", "registry.json"), "utf8")) as Record<string, unknown>;
    assert.ok(validateRegistry(registry), JSON.stringify(validateRegistry.errors));
    assert.equal(registry["sdd_version"], 1);
    assert.deepEqual(registry["changes"], []);
    assert.match(r.stdout, /^created workspace: /m);
  } finally {
    ws.cleanup();
  }
});
