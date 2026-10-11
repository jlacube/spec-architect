// Architecture fixture for the CAP-05 lint scenarios: a lint-clean architecture.md for the minimal
// change, built from components, with the component diagram and flows derived from them.
export const ARCH_FILE = ".sdd/004-x/10-spec/60-architecture/architecture.md";

export interface Component {
  id: string;
  status?: string;
  realizes?: string;
  /** Field names to leave out. */
  omit?: string[];
  evidence?: string;
}

export function component(c: Component): string {
  const fields: [string, string][] = [
    ["Name", "Thing"],
    ["Responsibility", "does the thing"],
    ["Owned data", "none"],
    ["Interfaces", "none"],
    ["Depends on", "none"],
    ["Realizes", c.realizes ?? "C004-REQ-012"],
    ["Status", c.status ?? "new"],
  ];
  const body = fields.filter(([n]) => !(c.omit ?? []).includes(n)).map(([n, v]) => `- **${n}:**${v === "" ? "" : " " + v}\n`).join("");
  return `### ${c.id} — Component\n${body}${c.evidence !== undefined ? `- **Evidence:**${c.evidence}\n` : ""}\n`;
}

/** architecture.md; `diagram` defaults to every component, `sections` to all mandatory ones. */
export function architecture(opts: { components?: Component[]; diagram?: string[]; omitSections?: string[]; extraSections?: string[]; flows?: string[] } = {}): string {
  const comps = opts.components ?? [{ id: "C004-COMP-01" }];
  const diagram = opts.diagram ?? comps.map((c) => c.id.replace(/-/g, "_"));
  const flows = opts.flows ?? ["F1"];
  const sections: [string, string][] = [
    ["Context and scope", "The minimal change.\n"],
    ["Component catalogue", comps.map(component).join("")],
    ["Runtime flows", "| Flow | Description | Scenarios realized |\n|---|---|---|\n" + flows.map((f) => `| ${f} | A flow | C004-TS-012 |\n`).join("")],
    ["Data view", "Files.\n"],
    ["Deployment view", "Local.\n"],
    ["Cross-cutting concerns", "None.\n"],
    ["Constraints", "None.\n"],
    ...(opts.extraSections ?? []).map((s) => [s, "Text.\n"] as [string, string]),
    [
      "Diagrams",
      "### Component view\n\n```mermaid\nflowchart LR\n" + diagram.map((d) => `  ${d}[Thing]\n`).join("") + "```\n\n" +
        flows.map((f) => `### ${f} — A flow (realizes C004-TS-012)\n\n\`\`\`mermaid\nsequenceDiagram\n  A->>B: call\n\`\`\`\n`).join("\n"),
    ],
  ];
  return "---\nid: C004-SPEC-ARCH\nartifact: spec/architecture\n---\n\n# Architecture\n\n" +
    sections.filter(([n]) => !(opts.omitSections ?? []).includes(n)).map(([n, body], i) => `## ${i + 1}. ${n}\n\n${body}\n`).join("");
}
