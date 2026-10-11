// Research-note fixture for C001-TS-302 and C001-TS-308 (findings start on line 11).
export const NOTE = ".sdd/004-x/00-ideation/research/R-001-retries.md";

export function note(findings: string[]): string {
  return "---\nid: C004-R-001\nartifact: ideation/research-note\n---\n# R-001 — Retries\n\n## Question\nQ.\n\n## Findings\n" + findings.map((f) => `- ${f}\n`).join("") + "\n## Confidence\nMedium.\n";
}
