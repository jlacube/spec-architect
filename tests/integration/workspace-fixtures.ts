// Fixture builders for workspace tests: change manifests and task files as text.

export interface ChangeSpec {
  nnn: string;
  title?: string;
  phase?: "00-ideation" | "10-spec" | "20-plan";
  status?: "active" | "stopped" | "archived";
  profile?: "lite" | "full";
  phases?: Partial<Record<"00-ideation" | "10-spec" | "20-plan", { status: string; approved_hash?: string; approved_at?: string; approved_by?: string }>>;
  defects?: { id: string; ref: string; summary: string; reporter: string; date: string; status: "open" | "closed" }[];
}

export function changeMd(c: ChangeSpec): string {
  const phase = (p: "00-ideation" | "10-spec" | "20-plan") => {
    const v = c.phases?.[p] ?? { status: "not-started" };
    const extra = (["approved_hash", "approved_at", "approved_by"] as const)
      .filter((k) => v[k] !== undefined)
      .map((k) => `, ${k}: ${k === "approved_hash" ? JSON.stringify(v[k]) : v[k]}`)
      .join("");
    return `  ${p}: { status: ${v.status}${extra} }`;
  };
  const defects = c.defects?.length
    ? "defects:\n" + c.defects.map((d) => `  - { id: ${d.id}, ref: ${d.ref}, summary: ${JSON.stringify(d.summary)}, reporter: ${d.reporter}, date: ${d.date}, status: ${d.status} }`).join("\n")
    : "defects: []";
  return [
    "---",
    `id: CHG-${c.nnn}`,
    `title: ${JSON.stringify(c.title ?? `Change ${c.nnn}`)}`,
    "kind: greenfield",
    `profile: ${c.profile ?? "full"}`,
    `status: ${c.status ?? "active"}`,
    `phase: ${c.phase ?? "00-ideation"}`,
    "phases:",
    phase("00-ideation"),
    phase("10-spec"),
    phase("20-plan"),
    "implementation: { status: not-started }",
    "stopped: null",
    "owners: []",
    defects,
    "waivers: []",
    "---",
    `# CHG-${c.nnn} — ${c.title ?? `Change ${c.nnn}`}`,
    "",
    "## Index",
    "",
    "## Gate log",
    "| Date | Gate | Decision | Words of approver | Waivers | Usage |",
    "|---|---|---|---|---|---|",
    "",
  ].join("\n");
}

export function taskMd(nnn: string, seq: number, status: string, completedAt: string | null = null): string {
  const id = `C${nnn}-T-${String(seq).padStart(3, "0")}`;
  return [
    "---",
    `id: ${id}`,
    `title: "Task ${seq}"`,
    `change: CHG-${nnn}`,
    "phase: 20-plan",
    "artifact: plan/task",
    `status: ${status}`,
    "depends_on: []",
    `implements: [C${nnn}-REQ-101]`,
    "satisfies_ac: []",
    `verified_by: [C${nnn}-TS-101]`,
    `report: { commit: ${completedAt ? "abc1234" : "null"}, completed_at: ${completedAt ?? "null"}, notes: null }`,
    "---",
    `# ${id} — Task ${seq}`,
    "",
  ].join("\n");
}

export const SDD_MD = [
  "---",
  "sdd_version: 1",
  "workspace: .sdd",
  "generator: architect-plugin@0.0.1",
  'id_scheme: "C{NNN}-{TYPE}-{seq}"',
  "---",
  "# Spec-Driven Development workspace",
  "",
  "<!-- sdd:status:begin -->",
  "| Change | Title | Phase | Status | Tasks done | Open defects | Updated |",
  "|---|---|---|---|---|---|---|",
  "<!-- sdd:status:end -->",
  "",
].join("\n");
