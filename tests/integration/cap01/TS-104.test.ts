// C001-TC-104 — verifies C001-TS-104 (C001-AC-103.1, C001-REQ-103): SDD.md structure.
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

test("C001-TS-104: SDD.md has the required frontmatter keys, sections and one status block", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    const text = readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8");
    const doc = splitFrontmatter(text);
    for (const k of ["sdd_version", "workspace", "generator", "id_scheme"]) assert.ok(doc.data && k in doc.data, k);
    assert.match(String(doc.data?.["generator"]), /^architect-plugin@\d+\.\d+\.\d+/);
    for (const h of ["How to orient yourself (agents)", "If you are implementing a change", "Conventions"])
      assert.match(text, new RegExp(`^#{1,3} ${h.replace(/[()]/g, "\\$&")}$`, "m"), h);
    assert.equal(text.split("<!-- sdd:status:begin -->").length, 2);
    assert.equal(text.split("<!-- sdd:status:end -->").length, 2);
    assert.ok(text.indexOf("<!-- sdd:status:begin -->") < text.indexOf("<!-- sdd:status:end -->"));
    assert.equal(text.includes("\r"), false);
  } finally {
    ws.cleanup();
  }
});
