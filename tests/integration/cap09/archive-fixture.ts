// Fixture builder for the archive scenarios (C001-TS-914 … 922): a brownfield change "004" with G3
// approved, capability folders, tasks, defects, a glossary delta, and `_living/` files.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { makeWorkspace, REBUILD } from "../cli/helpers.ts";
import { changeMd, SDD_MD, taskMd } from "../workspace-fixtures.ts";

export interface Req {
  cap: string;
  id: string;
  title: string;
  delta: string;
  acs?: string[];
  scenarios?: string[];
}

export interface TaskSpec {
  status: string;
  marked?: boolean;
  title?: string;
}

export interface ArchiveFixture {
  living?: Record<string, string>;
  reqs?: Req[];
  /** Task statuses, or tasks with the archive-task marker (C005-IF-002) and a title. */
  tasks?: (string | TaskSpec)[];
  /** Lite profile: the tasks are sections of `20-plan/plan.md` (C005-REQ-113). */
  lite?: boolean;
  /** Sequence number of the first task (default 32). */
  firstSeq?: number;
  defects?: { id: string; status: "open" | "closed" }[];
  planStatus?: string;
  glossary?: { terms: [string, string][]; systems?: [string, string][] };
  constitutionGlossary?: string;
}

const H = "sha256:" + "a".repeat(64);
const approved = { status: "approved", approved_hash: H, approved_at: "2026-10-01", approved_by: "p01" };

function reqBlock(r: Req): string {
  const num = r.id.split("-REQ-")[1]!;
  const acs = r.acs ?? [`C004-AC-${num}.1`];
  return [
    `### ${r.id} — ${r.title}`,
    `- **Delta:** ${r.delta}`,
    "- **Pattern:** ubiquitous",
    `- **Statement:** THE billing service SHALL do ${r.title.toLowerCase()}.`,
    "- **Rationale:** r",
    "- **Stories:** C004-US-101",
    "- **Priority:** Must",
    `- **Acceptance:** ${acs.join(", ")}`,
    "",
  ].join("\n");
}

function accBlock(r: Req): string {
  const num = r.id.split("-REQ-")[1]!;
  const acs = r.acs ?? [`C004-AC-${num}.1`];
  const tss = r.scenarios ?? acs.map((_, i) => `C004-TS-${num}${i}`);
  return [`## ${r.id}`, "", ...acs.flatMap((ac, i) => [`#### ${ac} — criterion ${i + 1}`, "```gherkin", `Scenario: ${tss[i]} — scenario ${i + 1}`, "  # a gherkin comment, not a heading", "  Given g", "  When w", "  Then t", "```", ""])].join("\n");
}

export const inventoryStub = (slug: string) =>
  ["---", `capability: ${slug}`, "inventory_only: true", "updated: 2026-09-01", "---", `# CAP-${slug}`, "", "## Purpose", "", "Bills customers.", "", "## Entry points", "", "- `src/billing/index.ts`", ""].join("\n");

export function livingWith(slug: string, entries: [string, string][]): string {
  return [
    "---",
    `capability: ${slug}`,
    "inventory_only: false",
    "updated: 2026-09-01",
    "---",
    `# CAP-${slug} — Living specification`,
    "",
    "## Purpose",
    "",
    "Bills customers.",
    "",
    "## Requirements",
    "",
    ...entries.flatMap(([id, title]) => [`### ${id} — ${title}`, "- **Statement:** THE billing service SHALL x.", "", `#### ${id.replace("REQ", "AC")}.1 — old criterion`, "```gherkin", `Scenario: ${id.replace("REQ", "TS")} — old`, "  Given g", "```", ""]),
    "## History",
    "",
    "| ID | Event | Change | Date | Note |",
    "|---|---|---|---|---|",
    "",
  ].join("\n");
}

export function archiveWorkspace(f: ArchiveFixture) {
  const files: Record<string, string> = {
    ".sdd/SDD.md": SDD_MD,
    ".sdd/registry.json": REBUILD,
    ".sdd/004-x/change.md": changeMd({
      nnn: "004",
      profile: f.lite ? "lite" : "full",
      phase: "20-plan",
      phases: { "00-ideation": approved, "10-spec": approved, "20-plan": f.planStatus ? { status: f.planStatus } : approved },
      defects: (f.defects ?? []).map((d) => ({ id: d.id, ref: "C004-REQ-012", summary: "s", reporter: "p01", date: "2026-10-05", status: d.status })),
    }).replace("kind: greenfield", "kind: brownfield"),
  };
  const specs = (f.tasks ?? ["done", "dropped"]).map((t) => (typeof t === "string" ? { status: t } : t));
  const first = f.firstSeq ?? 32;
  if (f.lite) {
    files[".sdd/004-x/20-plan/plan.md"] = [
      "---", 'id: "C004-PLAN"', "artifact: plan/lite", 'change: "CHG-004"', "phase: 20-plan", "status: draft", "---", "# CHG-004 — Plan (lite)", "", "## Tasks", "",
      ...specs.flatMap((t, i) => {
        const id = `C004-T-${String(first + i).padStart(3, "0")}`;
        return [`### ${id} — ${t.title ?? `Task ${first + i}`}`, `- **Status:** ${t.status}`, ...(t.marked ? ["- **Archive task:** true"] : []), "- **Implements:** C004-REQ-012", "- **Estimate:** S", ""];
      }),
    ].join("\n");
  } else
    specs.forEach((t, i) => {
      const seq = first + i;
      const md = taskMd("004", seq, t.status, t.status === "done" ? "2026-10-06" : null);
      files[`.sdd/004-x/20-plan/50-tasks/T-${String(seq).padStart(3, "0")}-t.md`] = t.marked ? md.split("\n---\n#").join("\narchive_task: true\n---\n#") : md;
    });
  const caps = [...new Set((f.reqs ?? []).map((r) => r.cap))];
  caps.forEach((cap, i) => {
    const rs = f.reqs!.filter((r) => r.cap === cap);
    const dir = `.sdd/004-x/10-spec/20-capabilities/CAP-0${i + 1}-${cap}`;
    files[`${dir}/requirements.md`] = ["---", `id: "C004-CAP-0${i + 1}"`, "artifact: spec/requirements", `capability: "${cap}"`, "---", `# C004-CAP-0${i + 1} — Requirements`, "", ...rs.map(reqBlock)].join("\n");
    files[`${dir}/acceptance.md`] = ["---", `id: "C004-CAP-0${i + 1}"`, "artifact: spec/acceptance", "---", `# C004-CAP-0${i + 1} — Acceptance`, "", ...rs.map(accBlock), "## Coverage table", "", "| REQ | happy |", "|---|---|", ...rs.map((r) => `| ${r.id} | TS |`), ""].join("\n");
  });
  if (f.glossary)
    files[".sdd/004-x/10-spec/40-domain/glossary-delta.md"] = [
      "---",
      'id: "C004-SPEC-GLOSSARY"',
      "artifact: spec/glossary-delta",
      "---",
      "# C004 — Glossary delta",
      "",
      "## 1. Domain terms",
      "| Term | Definition |",
      "|---|---|",
      ...f.glossary.terms.map(([t, d]) => `| ${t} | ${d} |`),
      "",
      "## 2. System names (allowed after `THE` in EARS statements)",
      "| Name | Component |",
      "|---|---|",
      ...(f.glossary.systems ?? []).map(([t, d]) => `| ${t} | ${d} |`),
      "",
    ].join("\n");
  if (f.constitutionGlossary) files[".sdd/_constitution/glossary.md"] = f.constitutionGlossary;
  for (const [name, text] of Object.entries(f.living ?? {})) files[`.sdd/_living/${name}`] = text;
  return makeWorkspace(files);
}

/** sha256 of every file under `.sdd/` (path and content), to prove nothing changed. */
export function checksum(root: string): string {
  const h = createHash("sha256");
  const walk = (dir: string) => {
    for (const n of readdirSync(dir).sort()) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else h.update(relative(root, p) + "\0").update(readFileSync(p)).update("\0");
    }
  };
  walk(join(root, ".sdd"));
  return h.digest("hex");
}

/** Level-3 requirement headings of a living file. */
export function requirementHeadings(text: string): string[] {
  let fence = false;
  return text.split("\n").filter((l) => {
    if (/^(```|~~~)/.test(l)) fence = !fence;
    return !fence && l.startsWith("### ");
  });
}

/** History table rows as cell arrays. */
export function historyRows(text: string): string[][] {
  const at = text.indexOf("## History");
  return text
    .slice(at)
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*(ID|-)/.test(l))
    .map((l) => l.slice(1, -1).split("|").map((c) => c.trim()));
}
