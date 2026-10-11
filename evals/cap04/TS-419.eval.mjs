// C001-TC-419 — verifies C001-TS-419 (C001-AC-417.1, C001-REQ-417): lifecycle with four states. For the
// entity PhaseArtifact (draft, in-review, approved, stale), state-machines.md holds a stateDiagram-v2
// block and a transition table (from, event, guard, to, effect) covering every arrow.
import { checker } from "../harness/assert.mjs";
import { brief, read, SPEC, writerRun } from "./spec.mjs";

export default {
  id: "TS-419",
  title: "Lifecycle with four states",
  ...writerRun(brief("step 5 — Domain", "the entity PhaseArtifact (an invoice document's review lifecycle) has the states draft, in-review, approved and stale: it is submitted for review, approved or sent back, and becomes stale when its source data changes after approval. Write its lifecycle.", `\`${SPEC}/40-domain/state-machines.md\` (and \`${SPEC}/40-domain/glossary-delta.md\` for new terms).`)),
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, `${SPEC}/40-domain/state-machines.md`);
    check(text, "state-machines.md not written");
    const block = /```mermaid\s*\n\s*stateDiagram-v2([\s\S]*?)```/.exec(text);
    check(block && /PhaseArtifact/.test(text), "no stateDiagram-v2 block for PhaseArtifact");
    const arrows = [...(block?.[1] ?? "").matchAll(/^\s*([\w\[\]*-]+)\s*-->\s*([\w\[\]*-]+)/gm)].map((m) => [m[1], m[2]]).filter(([a, b]) => a !== "[*]" && b !== "[*]");
    check(arrows.length >= 4, `${arrows.length} arrows between states`);
    const header = /^\|\s*from\s*\|\s*event\s*\|\s*guard\s*\|\s*to\s*\|\s*effect\s*\|/im.test(text);
    check(header, "no transition table with columns from, event, guard, to, effect");
    const rows = text.split("\n").filter((l) => /^\|/.test(l)).map((l) => l.split("|").map((c) => c.trim().replace(/`/g, "")));
    for (const [a, b] of arrows) {
      const norm = (s) => s.replace(/_/g, "-").toLowerCase();
      check(rows.some((r) => norm(r[1] ?? "") === norm(a) && norm(r[4] ?? "") === norm(b)), `arrow ${a} → ${b} has no table row`);
    }
    return failures;
  },
};
