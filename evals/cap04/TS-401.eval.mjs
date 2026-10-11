// C001-TC-401 — verifies C001-TS-401 (C001-AC-401.1, C001-REQ-401): capability folders created on the
// spec-writer's first pass for a full-profile change whose ideation names billing and notifications.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { checker } from "../harness/assert.mjs";
import { brief, SPEC, writerRun } from "./spec.mjs";

export default {
  id: "TS-401",
  title: "Capability folders created",
  ...writerRun(brief("step 2 — Capabilities and stories", "derive the capabilities from the approved ideation and write their folders and user stories (stories only; requirements come in step 3).", `one folder per capability under \`${SPEC}/20-capabilities/\` with stories.md, requirements.md and acceptance.md from the templates; \`${SPEC}/10-context/stakeholders-and-personas.md\` for the personas.`)),
  assert({ root }) {
    const { failures, check } = checker();
    for (const cap of ["CAP-01-billing", "CAP-02-notifications"]) {
      const dir = join(root, ...SPEC.split("/"), "20-capabilities", cap);
      check(existsSync(dir), `${cap} missing`);
      for (const f of ["stories.md", "requirements.md", "acceptance.md"]) check(existsSync(join(dir, f)), `${cap}/${f} missing`);
    }
    return failures;
  },
};
