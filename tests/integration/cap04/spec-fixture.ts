// Shared fixture for the requirement-quality lint scenarios (C001-TS-402 … 410): the lint-clean
// minimal change of the CLI tests, with one artifact replaced per scenario.
import { makeWorkspace, minimalChange, runInProcess, STORY_FIELDS } from "../cli/helpers.ts";

export const CAP = ".sdd/004-x/10-spec/20-capabilities/CAP-01-a";
export const REQ_FILE = `${CAP}/requirements.md`;
export const STORIES_FILE = `${CAP}/stories.md`;
export const ACCEPTANCE_FILE = `${CAP}/acceptance.md`;
export const PERSONAS_FILE = ".sdd/004-x/10-spec/10-context/stakeholders-and-personas.md";
export const GLOSSARY_FILE = ".sdd/004-x/10-spec/40-domain/glossary-delta.md";

export interface LintFinding {
  code: string;
  severity: string;
  path: string;
  line?: number;
  ids?: string[];
  message: string;
}

const REQ_FIELDS: [string, string][] = [
  ["Pattern", "ubiquitous"],
  ["Statement", "THE sdd CLI SHALL do one thing."],
  ["Rationale", "r"],
  ["Stories", "C004-US-001"],
  ["Priority", "Must"],
  ["Acceptance", "C004-AC-012.1"],
];

/** requirements.md with C004-REQ-012; `fields` overrides values, `omit` drops fields, `extra` appends them. */
export function requirements(opts: { fields?: Record<string, string>; omit?: string[]; extra?: Record<string, string> } = {}): string {
  const rows = REQ_FIELDS.filter(([name]) => !(opts.omit ?? []).includes(name)).map(([name, value]) => [name, opts.fields?.[name] ?? value] as const);
  for (const [name, value] of Object.entries(opts.extra ?? {})) rows.push([name, value]);
  return "---\nid: C004-CAP-01\nartifact: spec/requirements\n---\n\n### C004-REQ-012 — Thing\n" + rows.map(([n, v]) => `- **${n}:** ${v}\n`).join("");
}

/** A story section with every field of C001-REQ-402; `asA` replaces the persona line, `omit` drops a label. */
export function story(id: string, opts: { asA?: string; omit?: string } = {}): string {
  let fields = STORY_FIELDS + "- **Requirements:** C004-REQ-012\n- **Traces to:** Q1\n";
  if (opts.asA !== undefined) fields = fields.replace("- **As a** P-01 owner", `- **As a** ${opts.asA}`);
  if (opts.omit !== undefined) fields = fields.split("\n").filter((l) => !l.includes(`**${opts.omit}`)).join("\n");
  return `### ${id} — Story\n${fields}`;
}

export function storiesFile(...sections: string[]): string {
  return "---\nid: C004-CAP-01\nartifact: spec/stories\n---\n\n" + sections.join("\n");
}

export function acceptance(title: string): string {
  return `---\nid: C004-CAP-01\nartifact: spec/acceptance\n---\n\n#### C004-AC-012.1 — ${title}\n\`\`\`gherkin\nScenario: C004-TS-012 — s\n  Given a\n  When b\n  Then c\n\`\`\`\n`;
}

export function personas(...ids: string[]): string {
  return "---\nid: C004-SPEC-CTX-04\nartifact: spec/context/personas\n---\n\n" + ids.map((p) => `## ${p} — Persona\n\nText.\n`).join("\n");
}

export function glossary(...names: string[]): string {
  return "---\nid: C004-SPEC-GLOSSARY\nartifact: spec/glossary-delta\n---\n\n## 2. System names\n\n| Name | Component |\n|---|---|\n" + names.map((n) => `| ${n} | — |\n`).join("");
}

/** Runs `sdd lint --json` on the minimal change with `overrides` applied. */
export function lint(overrides: Record<string, string>): { code: number; findings: LintFinding[] } {
  const ws = makeWorkspace({ ...minimalChange(), ...overrides });
  try {
    const r = runInProcess(["lint", "--json"], { cwd: ws.root });
    if (r.code !== 0 && r.code !== 1) throw new Error(r.stderr);
    return { code: r.code, findings: (JSON.parse(r.stdout) as { findings: LintFinding[] }).findings };
  } finally {
    ws.cleanup();
  }
}

export function withCode(findings: LintFinding[], code: string): LintFinding[] {
  return findings.filter((f) => f.code === code);
}
