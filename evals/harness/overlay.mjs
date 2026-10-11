// Eval-only plugin overlay (C001-T-032): a temporary copy of plugins/architect in which every
// specialist agent that does not exist yet is replaced by a cheap stand-in (haiku). Conductor
// scenarios that dispatch specialists can then run before the specialists are written; a stand-in
// does the brief in minimal form and can return a scripted hand-back from the workspace
// (`.eval/handbacks/<agent-name>.md`). Real agent files are always kept.
import { cpSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROOT } from "./fixtures.mjs";

export const SPECIALISTS = ["researcher", "cartographer", "options-analyst", "spec-writer", "test-designer", "architect", "planner", "critic", "auditor"].map((n) => `sdd-${n}`);

function stub(name) {
  return `---
name: ${name}
description: Evaluation stand-in for the ${name} specialist of the Architect suite. Dispatched only by the sdd-conductor.
tools: Read, Glob, Grep, Write, Edit
model: haiku
---

You are an evaluation stand-in for the ${name} specialist. Do the brief in minimal form:

1. If the file \`.eval/handbacks/${name}.md\` exists in the working directory, read it.
2. Write each output file the brief names (only under \`.sdd/\`), with short placeholder content
   of a few lines. Follow every marker instruction of the brief exactly (for example, mark a
   statement with \`[ASSUMPTION: <question-id>]\` when told to).
3. Your final message: if step 1 found the file, its content verbatim; otherwise
   "Digest: done (stand-in). Written: <paths>".
`;
}

let cached = null;

/** Path of the overlay plugin (built once per process). */
export function architectWithStubs() {
  if (cached && existsSync(cached)) return cached;
  const dir = join(mkdtempSync(join(tmpdir(), "sdd-eval-plugin-")), "architect");
  cpSync(join(ROOT, "plugins", "architect"), dir, { recursive: true });
  mkdirSync(join(dir, "agents"), { recursive: true });
  for (const name of SPECIALISTS) {
    const file = join(dir, "agents", `${name}.md`);
    if (!existsSync(file)) writeFileSync(file, stub(name));
  }
  cached = dir;
  return dir;
}
