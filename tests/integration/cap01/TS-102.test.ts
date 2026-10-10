// C001-TC-102 — verifies C001-TS-102 (C001-AC-101.2, C001-REQ-101): init writes only inside .sdd/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

const ROOT_DIRS = ["_constitution", "_living", "_decisions", "_templates", "_archive"];
const registrySchema = JSON.parse(
  readFileSync(join(repoRoot(), ".sdd", "001-architect-agent-suite", "10-spec", "50-interfaces", "registry.schema.json"), "utf8"),
) as object;
const validateRegistry = new Ajv2020({ strict: false }).compile(registrySchema);

test("C001-TS-102: init writes only inside .sdd/ of a git repository", () => {
  const ws = makeWorkspace({ "package.json": "{}\n", "src/billing/invoice.ts": "export const x = 1;\n", "src/auth/login.ts": "export {};\n" });
  const git = (...args: string[]) => execFileSync("git", args, { cwd: ws.root, encoding: "utf8" });
  try {
    git("init", "-q");
    git("-c", "user.name=t", "-c", "user.email=t@example.com", "add", ".");
    git("-c", "user.name=t", "-c", "user.email=t@example.com", "commit", "-qm", "fixture");
    // Run from a subfolder: the workspace goes to the repository root (C001-IF-01).
    const r = runBundled(["init"], { cwd: join(ws.root, "src", "billing") });
    assert.equal(r.code, 0, r.stderr);
    const changed = git("status", "--porcelain", "--untracked-files=all").split("\n").filter(Boolean);
    assert.ok(changed.length > 0);
    for (const line of changed) assert.match(line.slice(3), /^\.sdd\//, line);
  } finally {
    ws.cleanup();
  }
});
