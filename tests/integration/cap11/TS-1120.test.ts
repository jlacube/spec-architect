// C001-TC-1120 / C001-TS-1120 (C001-REQ-1120, C001-T-064): the workflows under .github/workflows/
// together run "npm run check" on windows-latest, macos-latest and ubuntu-latest, and every workflow is
// started by hand only (its "on" key holds workflow_dispatch and nothing else).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { repoRoot } from "../../helpers.ts";

const DIR = join(repoRoot(), ".github", "workflows");
const files = readdirSync(DIR).filter((n) => /\.ya?ml$/.test(n));
const workflows = files.map((n) => ({ name: n, doc: parseYaml(readFileSync(join(DIR, n), "utf8")) as Record<string, unknown> }));

test("C001-TS-1120: every workflow's on key contains only workflow_dispatch", () => {
  assert.ok(workflows.length > 0, "at least one workflow");
  for (const { name, doc } of workflows) {
    const on = doc["on"];
    const keys = typeof on === "string" ? [on] : Array.isArray(on) ? on.map(String) : Object.keys((on ?? {}) as object);
    assert.deepEqual(keys, ["workflow_dispatch"], name);
  }
});

test('C001-TS-1120: the workflows cover windows-latest, macos-latest and ubuntu-latest running "npm run check"', () => {
  const covered = new Set<string>();
  for (const { doc } of workflows) {
    for (const job of Object.values((doc["jobs"] ?? {}) as Record<string, Record<string, unknown>>)) {
      const steps = (job["steps"] ?? []) as { run?: string }[];
      if (!steps.some((s) => typeof s.run === "string" && s.run.split("\n").some((l) => l.trim() === "npm run check"))) continue;
      const matrix = ((job["strategy"] as Record<string, unknown> | undefined)?.["matrix"] ?? {}) as Record<string, unknown>;
      const runsOn = String(job["runs-on"] ?? "");
      const oses = runsOn.includes("matrix.os") ? ((matrix["os"] ?? []) as string[]) : [runsOn];
      for (const os of oses) covered.add(os);
    }
  }
  for (const os of ["windows-latest", "macos-latest", "ubuntu-latest"]) assert.ok(covered.has(os), os);
});
