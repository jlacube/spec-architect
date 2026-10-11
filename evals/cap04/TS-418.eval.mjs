// C001-TC-418 — verifies C001-TS-418 (C001-AC-416.1, C001-REQ-416): domain entity fields. Every entity
// section of domain-model.md lists Attributes (name, type, constraints), Relationships, Owning
// component and an INV- invariant or "Invariants: none (reason)".
import { checker } from "../harness/assert.mjs";
import { brief, read, SPEC, writerRun } from "./spec.mjs";

export default {
  id: "TS-418",
  title: "Domain entity fields",
  ...writerRun(brief("step 5 — Domain", "write the domain model for the billing capability: the entities Clinic, Subscription and Invoice (components C004-COMP-01 billing service, C004-COMP-02 notification service).", `\`${SPEC}/40-domain/domain-model.md\` and, for new terms, \`${SPEC}/40-domain/glossary-delta.md\`.`)),
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, `${SPEC}/40-domain/domain-model.md`);
    check(text, "domain-model.md not written");
    // One section per entity: from its heading to the next heading of the same or a higher level.
    const lines = text.split("\n");
    const entities = [];
    lines.forEach((l, i) => {
      const m = /^(#{2,3}) .*\b(Clinic|Subscription|Invoice)\b/.exec(l);
      if (!m) return;
      const end = lines.findIndex((x, j) => j > i && new RegExp(`^#{1,${m[1].length}} `).test(x));
      entities.push(lines.slice(i, end < 0 ? undefined : end).join("\n"));
    });
    check(entities.length >= 3, `${entities.length} entity sections`);
    for (const e of entities) {
      const name = e.split("\n")[0];
      check(/Attributes/i.test(e) && /\|.*type.*\|/i.test(e) || /Attributes[\s\S]*\(.*\)/i.test(e), `${name}: no attribute list with types`);
      check(/Relationships/i.test(e), `${name}: no Relationships`);
      check(/Owning component[\s\S]*COMP-\d+/i.test(e), `${name}: no Owning component`);
      check(/INV-\d+|Invariants:\s*none\s*\(/i.test(e), `${name}: no INV- invariant or "Invariants: none (reason)"`);
    }
    return failures;
  },
};
