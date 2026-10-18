// Skill inlining (C002-COMP-001; C002-IF-001 §3 step 5, C002-IF-005 §1): each generated agent body ends with
// the bodies of the skills its source `skills` field lists, in that order, each under the heading
// `## Skill: <name>` (C002-REQ-109). The skill bodies are taken after the variant pass and the construct
// translation of the skill itself, so an inlined skill carries the target's wiring variants and
// constructs, and a diagnostic of a skill line names the skill file once, not once per inlining agent.
import { diagnostic, type Diagnostic } from "../diagnostics.ts";
import type { SourcePlugin } from "../model.ts";
import type { Target } from "../tables.ts";
import type { TranslatedDoc } from "./constructs.ts";
import { fieldLine, listField } from "./frontmatter.ts";

export interface InlinedAgent {
  /** Source path (`agents/<name>.md`). */
  path: string;
  name: string;
  /** Inlined skills, in source order. */
  skills: string[];
  /** Translated agent body followed by the inlined skill sections (LF, ends with a newline). */
  body: string;
}

export interface InlineResult {
  agents: InlinedAgent[];
  diagnostics: Diagnostic[];
}

/** The heading an inlined skill is written under (C002-IF-005 §1). */
export const skillHeading = (name: string) => `## Skill: ${name}`;

/** Inlines the translated skill bodies into the translated agent bodies of one target. */
export function inlineSkills(source: SourcePlugin, docs: readonly TranslatedDoc[], target?: Target): InlineResult {
  const byPath = new Map(docs.map((d) => [d.path, d]));
  const agents: InlinedAgent[] = [];
  const diagnostics: Diagnostic[] = [];
  for (const a of source.agents) {
    const doc = byPath.get(a.path);
    if (!doc) continue;
    const skills = listField(a.data?.["skills"]);
    const parts = [doc.body.replace(/\s+$/, "")];
    for (const name of skills) {
      const skill = byPath.get(`skills/${name}/SKILL.md`);
      if (!skill) {
        const line = fieldLine(a, "skills") ?? 1;
        diagnostics.push(diagnostic("ERR-GEN-007", `${a.path}:${line}: preloaded skill "${name}" is not a skill of the source plugin`, { file: a.path, line, construct: name, ...(target ? { target } : {}) }));
        continue;
      }
      parts.push(`${skillHeading(name)}\n\n${skill.body.replace(/^\s+|\s+$/g, "")}`);
    }
    agents.push({ path: a.path, name: a.name, skills, body: `${parts.join("\n\n")}\n` });
  }
  return { agents, diagnostics };
}
