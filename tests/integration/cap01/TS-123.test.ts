// C001-TC-123 — verifies C001-TS-123 (C001-AC-117.1, C001-REQ-117): lite scaffold file set.
// `sdd change new` (C001-T-014) scaffolds LITE_SCAFFOLD from these templates; T-014 adds the
// command-level run of the scenario.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LITE_SCAFFOLD, listTemplates } from "../../../src/workspace/templates.ts";
import { repoRoot } from "../../helpers.ts";
import { specFile } from "../../helpers/spec-file.ts";

const IF06 = specFile("001", "10-spec/50-interfaces/workspace-layout.md");

test("the lite scaffold is exactly the file set of C001-IF-06 §3, each with a lite template", () => {
  const section = readFileSync(IF06, "utf8").split("## §3")[1] ?? "";
  // Tree lines such as "├── 10-spec/spec.md   sections: …" and "├── 00-ideation/ideation.md, questions-log.md".
  const listed: string[] = [];
  for (const m of section.matchAll(/^[├└]── (\d\d-[a-z]+)\/(\S+?)(?:,\s*([\w.-]+))?(?:\s|$)/gm)) {
    listed.push(`${m[1]}/${m[2]}`);
    if (m[3]) listed.push(`${m[1]}/${m[3]}`);
  }
  assert.deepEqual([...LITE_SCAFFOLD].sort(), listed.sort());
  const templates = listTemplates("lite", { pluginRoot: join(repoRoot(), "plugins", "architect") });
  for (const f of LITE_SCAFFOLD) assert.ok(templates.includes(f), f);
  for (const f of ["change.md", "ids.json"]) assert.ok(templates.includes(f), f);
});
