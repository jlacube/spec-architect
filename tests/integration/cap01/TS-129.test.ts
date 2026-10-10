// C001-TC-129 — verifies C001-TS-129 (C001-AC-123.1, C001-REQ-123): adopt the hand-written bootstrap.
// `sdd status --write` (C001-T-017) calls adoptBootstrap(); until then adoption is exercised directly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adoptBootstrap } from "../../../src/workspace/adopt.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";
import { makeWorkspace, minimalChange, runBundled } from "../cli/helpers.ts";

function bootstrapCopy(): { root: string; cleanup: () => void } {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-bootstrap-")));
  cpSync(join(repoRoot(), ".sdd"), join(root, ".sdd"), { recursive: true, filter: (src) => !src.includes(`${join(".sdd", "metrics")}`) });
  // This repository's workspace was adopted in C001-T-017; restore the bootstrap generator so the
  // copy is the hand-written workspace of the scenario.
  const sddMd = join(root, ".sdd", "SDD.md");
  writeFileSync(sddMd, readFileSync(sddMd, "utf8").replace(/^generator: .*$/m, "generator: manual (bootstrap — Architect suite not yet built)"));
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

const gateLog = (text: string) => text.slice(text.indexOf("## Gate log"));

test("C001-TS-129: adopting the bootstrap keeps phases, hashes and gate log and sets the generator", () => {
  const ws = bootstrapCopy();
  try {
    const changeMd = join(ws.root, ".sdd", "001-architect-agent-suite", "change.md");
    const before = readFileSync(changeMd, "utf8");
    const sddBefore = readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8");
    assert.match(String(splitFrontmatter(sddBefore).data?.["generator"]), /^manual/);

    assert.equal(adoptBootstrap(join(ws.root, ".sdd")), true);

    const after = readFileSync(changeMd, "utf8");
    assert.equal(after, before);
    const phases = splitFrontmatter(after).data?.["phases"] as Record<string, { status: string; approved_hash: string }>;
    assert.equal(phases["00-ideation"]?.status, "approved");
    assert.match(phases["00-ideation"]?.approved_hash ?? "", /^sha256:c9c7849f/);
    assert.equal(gateLog(after), gateLog(before));
    const sddAfter = readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8");
    assert.match(String(splitFrontmatter(sddAfter).data?.["generator"]), /^architect-plugin@/);
    // Only the generator line changed.
    const diff = sddBefore.split("\n").filter((l, i) => l !== sddAfter.split("\n")[i]);
    assert.deepEqual(diff.map((l) => l.split(":")[0]), ["generator"]);
    // A second run is a no-op.
    assert.equal(adoptBootstrap(join(ws.root, ".sdd")), false);
    assert.equal(readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8"), sddAfter);
  } finally {
    ws.cleanup();
  }
});

test("init on a copy of this repository's workspace only adds the missing root folders", () => {
  const ws = bootstrapCopy();
  try {
    const snapshot = (dir: string): Record<string, string> => {
      const out: Record<string, string> = {};
      const walk = (d: string, rel: string) => {
        for (const e of readdirSync(d, { withFileTypes: true })) {
          const p = join(d, e.name);
          if (e.isDirectory()) walk(p, `${rel}${e.name}/`);
          else out[`${rel}${e.name}`] = readFileSync(p, "base64");
        }
      };
      walk(dir, "");
      return out;
    };
    const before = snapshot(join(ws.root, ".sdd"));
    const r = runBundled(["init"], { cwd: join(ws.root, ".sdd", "001-architect-agent-suite") });
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(snapshot(join(ws.root, ".sdd")), before);
    assert.deepEqual(
      r.stdout.split("\n").filter((l) => l.startsWith("created: ")).sort(),
      ["created: _archive/", "created: _constitution/", "created: _decisions/", "created: _living/", "created: _templates/"],
    );
  } finally {
    ws.cleanup();
  }
});

test("C001-TS-129 through the CLI: `sdd status --write` adopts the bootstrap and keeps change.md", () => {
  const ws = bootstrapCopy();
  try {
    const changeMd = join(ws.root, ".sdd", "001-architect-agent-suite", "change.md");
    const before = readFileSync(changeMd, "utf8");
    const r = runBundled(["status", "--write"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /^adopted: bootstrap workspace/m);
    assert.equal(readFileSync(changeMd, "utf8"), before);
    const phases = splitFrontmatter(before).data?.["phases"] as Record<string, { status: string; approved_hash: string }>;
    const reg = JSON.parse(readFileSync(join(ws.root, ".sdd", "registry.json"), "utf8")) as { changes: { phases: Record<string, { status: string; approved_hash: string }> }[] };
    assert.equal(reg.changes[0]?.phases["00-ideation"]?.status, "approved");
    assert.equal(reg.changes[0]?.phases["00-ideation"]?.approved_hash, phases["00-ideation"]?.approved_hash);
    assert.match(String(splitFrontmatter(readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8")).data?.["generator"]), /^architect-plugin@/);
  } finally {
    ws.cleanup();
  }
});
