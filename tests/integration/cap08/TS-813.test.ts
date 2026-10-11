// C001-TC-813 — verifies C001-TS-813 (C001-AC-811.1, C001-REQ-811): plan blocked by stale spec. The
// conductor's refusal is driven by the phase status the CLI computes and by the entry step of the
// phase skills (the dialogue itself: evals/cap08/TS-813.eval.mjs); the CLI refuses to approve a
// phase whose predecessor is stale.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { repoRoot } from "../../helpers.ts";
import { approvedChange, REQ, statuses } from "./gate-fixture.ts";

test("an edited approved spec is reported stale and the plan cannot be approved", () => {
  const ws = approvedChange(["00-ideation", "10-spec"]);
  try {
    const p = join(ws.root, ...REQ.split("/"));
    writeFileSync(p, readFileSync(p, "utf8").replace("do one thing", "do two things"));
    assert.equal(runBundled(["stale", "check", "004"], { cwd: ws.root }).code, 0);
    assert.equal(statuses(ws.dir)["10-spec"], "stale");
    const r = runBundled(["gate", "approve", "004", "20-plan", "--note", "Approve"], { cwd: ws.root });
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /ERR-CLI-015[\s\S]*10-spec/);
  } finally {
    ws.cleanup();
  }
});

test("the phase skills refuse to start on a predecessor that is not approved or is stale", () => {
  const skill = (n: string) => readFileSync(join(repoRoot(), "plugins", "architect", "skills", n, "SKILL.md"), "utf8");
  const spec = skill("phase-spec");
  const entry = spec.slice(spec.indexOf("## Step 1"), spec.indexOf("## Step 2"));
  assert.match(entry, /`approved` and not `stale`/);
  assert.match(entry, /Dispatch no specialist/);
  assert.match(entry, /\/architect:revise/);
  const ideation = skill("phase-ideation");
  const g0 = ideation.slice(ideation.indexOf("## Step 1"), ideation.indexOf("## Step 2"));
  assert.match(g0, /_constitution\/constitution\.md/);
  assert.match(g0, /\/architect:gate\s+constitution/);
  assert.match(g0, /Dispatch no specialist/);
});
