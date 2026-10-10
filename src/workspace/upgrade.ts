// Lite → full upgrade (C001-REQ-119): split `10-spec/spec.md`, `10-spec/dod.md` and
// `20-plan/plan.md` into the full layout of C001-IF-06 §2. Section bodies are moved verbatim, so
// every ID and every requirement, criterion, scenario and task text is preserved; the result is
// checked against the model and rolled back on any difference.
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { writeTextAtomic } from "../io/atomic.ts";
import { CliError, usage } from "../cli/errors.ts";
import { parseBlocks } from "../model/blocks.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { buildChangeGraph, type ChangeGraph } from "../model/graph.ts";
import { findIds } from "../model/ids.ts";
import { setFrontmatterValue, slugify } from "./change.ts";
import { changeNumber } from "./ledger.ts";
import { renderTemplate, resolveTemplate, type TemplateOptions } from "./templates.ts";

interface Section {
  heading: string;
  body: string;
}

interface LiteFile {
  status: string;
  /** Text before the first `##` section, without the frontmatter and the `#` title. */
  preamble: string;
  sections: Section[];
}

function readLite(path: string): LiteFile | null {
  if (!existsSync(path)) return null;
  const doc = splitFrontmatter(readFileSync(path, "utf8"));
  const body = doc.lines.slice(doc.bodyStartLine - 1);
  const blocks = parseBlocks(body, 1);
  const tops = blocks.headings.filter((h) => h.level === 2);
  const text = (from: number, to: number) => body.slice(from - 1, to).join("\n").replace(/^\n+|\n+$/g, "");
  const firstTop = tops[0]?.line ?? body.length + 1;
  const preamble = text(1, firstTop - 1).replace(/^# .*\n?/, "").replace(/^\n+/, "");
  const sections = tops.map((h, i) => ({ heading: h.text, body: text(h.line + 1, (tops[i + 1]?.line ?? body.length + 1) - 1) }));
  return { status: typeof doc.data?.["status"] === "string" ? (doc.data["status"] as string) : "draft", preamble, sections };
}

const SPEC_MAP: Record<string, string> = {
  Context: "10-spec/10-context/problem-and-goals.md",
  Stories: "10-spec/20-capabilities/CAP-01-{{SLUG}}/stories.md",
  Requirements: "10-spec/20-capabilities/CAP-01-{{SLUG}}/requirements.md",
  Acceptance: "10-spec/20-capabilities/CAP-01-{{SLUG}}/acceptance.md",
  NFRs: "10-spec/30-nfr/nfr.md",
  "Domain notes": "10-spec/40-domain/domain-model.md",
  Interfaces: "10-spec/50-interfaces/README.md",
  "Architecture notes": "10-spec/60-architecture/architecture.md",
};
const PLAN_MAP: Record<string, string> = {
  Strategy: "20-plan/10-strategy.md",
  "Test mapping": "20-plan/60-test-plan.md",
  Risks: "20-plan/70-risks.md",
};
/** Full templates whose frontmatter the target files take (capability files share one). */
const TEMPLATE_OF = (target: string) => target.replace(/CAP-01-[^/]+\//, "CAP-{{NN}}-{{SLUG}}/");

interface Plan {
  writes: Map<string, string>;
  removes: string[];
}

function frontmatterOf(templateText: string, status: string): { fm: string; title: string } {
  const doc = splitFrontmatter(templateText);
  const end = doc.bodyStartLine - 1;
  const fmLines = doc.lines.slice(0, end).map((l) => (l.startsWith("status:") ? `status: ${status}` : l));
  const title = doc.lines.slice(end).find((l) => l.startsWith("# ")) ?? "";
  return { fm: fmLines.join("\n"), title };
}

const yamlList = (ids: string[]) => `[${ids.join(", ")}]`;

function taskFile(heading: string, block: string[], nnn: string): { rel: string; text: string } {
  const m = /^(C\d{3}-T-(\d+))(?:\s+—\s+(.*))?$/.exec(heading);
  if (!m?.[1] || !m[2]) throw usage("change profile", `task heading without a task ID: ${heading}`);
  const fields = new Map<string, string>();
  for (const l of block) {
    const f = /^\s*- \*\*([^*]+?):\*\*\s?(.*)$/.exec(l);
    if (f?.[1]) fields.set(f[1].trim().toLowerCase(), (f[2] ?? "").trim());
  }
  const ids = (key: string) => findIds(fields.get(key) ?? "", nnn).map((h) => h.id);
  const title = m[3] ?? "";
  const fm = [
    "---",
    `id: ${m[1]}`,
    `title: ${JSON.stringify(title)}`,
    `change: CHG-${nnn}`,
    "phase: 20-plan",
    "artifact: plan/task",
    `milestone: ${ids("milestone")[0] ?? "null"}`,
    `status: ${fields.get("status") || "todo"}`,
    `depends_on: ${yamlList(ids("depends on"))}`,
    `implements: ${yamlList(ids("implements"))}`,
    `satisfies_ac: ${yamlList(ids("satisfies ac"))}`,
    `verified_by: ${yamlList(ids("verified by"))}`,
    `components: ${yamlList(ids("components"))}`,
    `risk_refs: ${yamlList(ids("risks"))}`,
    `estimate: ${fields.get("estimate") || "M"}`,
    "report: { commit: null, completed_at: null, notes: null }",
    "---",
  ].join("\n");
  const body = block.join("\n").replace(/^\n+|\n+$/g, "");
  return { rel: `20-plan/50-tasks/T-${m[2]}-${slugify(title) || "task"}.md`, text: `${fm}\n# ${heading}\n\n${body}\n` };
}

function planUpgrade(dir: string, tpl: TemplateOptions): Plan {
  const nnn = changeNumber(dir);
  const slug = basename(dir).slice(4);
  const vars = { CHANGE: `CHG-${nnn}`, P: `C${nnn}`, NNN: nnn, NN: "01", B: "1", SLUG: slug, NAME: slug, TITLE: slug, DATE: "", KIND: "", PROFILE: "full", SEQ: "001" };
  const writes = new Map<string, string>();
  const append = (rel: string, status: string, chunk: string) => {
    const target = renderTemplate(rel, vars);
    const existing = writes.get(target);
    if (existing !== undefined) {
      writes.set(target, `${existing}\n${chunk}\n`);
      return;
    }
    const { fm, title } = frontmatterOf(renderTemplate(resolveTemplate("full", TEMPLATE_OF(rel), tpl).text, vars), status);
    writes.set(target, `${fm}\n${title}\n\n${chunk}\n`);
  };
  const removes: string[] = [];

  const spec = readLite(join(dir, "10-spec", "spec.md"));
  if (spec) {
    removes.push("10-spec/spec.md");
    if (spec.preamble) append("10-spec/00-index.md", spec.status, spec.preamble);
    for (const s of spec.sections) {
      const rel = SPEC_MAP[s.heading];
      if (rel) append(rel, spec.status, s.body);
      else append("10-spec/00-index.md", spec.status, `## ${s.heading}\n\n${s.body}`);
    }
  }
  const dod = readLite(join(dir, "10-spec", "dod.md"));
  if (dod) {
    removes.push("10-spec/dod.md");
    const parts = [dod.preamble, ...dod.sections.map((s) => `## ${s.heading}\n\n${s.body}`)].filter(Boolean);
    append("10-spec/70-dod.md", dod.status, parts.join("\n\n"));
  }
  const plan = readLite(join(dir, "20-plan", "plan.md"));
  if (plan) {
    removes.push("20-plan/plan.md");
    if (plan.preamble) append("20-plan/00-index.md", plan.status, plan.preamble);
    for (const s of plan.sections) {
      if (s.heading === "Tasks") {
        const lines = s.body.split("\n");
        const starts = lines.flatMap((l, i) => (/^### C\d{3}-T-\d+/.test(l) ? [i] : []));
        if (starts.length > 0 && starts[0]! > 0 && lines.slice(0, starts[0]).some((l) => l.trim()))
          append("20-plan/00-index.md", plan.status, lines.slice(0, starts[0]).join("\n"));
        starts.forEach((st, k) => {
          const block = lines.slice(st + 1, starts[k + 1] ?? lines.length);
          const t = taskFile(lines[st]!.replace(/^### /, ""), block, nnn);
          writes.set(t.rel, t.text);
        });
        continue;
      }
      const rel = PLAN_MAP[s.heading];
      if (rel) append(rel, plan.status, s.body);
      else append("20-plan/00-index.md", plan.status, `## ${s.heading}\n\n${s.body}`);
    }
  }
  return { writes, removes };
}

/** IDs found in the change (defined or referenced in text) and requirement texts. */
function snapshot(g: ChangeGraph): { ids: string[]; texts: Map<string, string> } {
  const texts = new Map<string, string>();
  for (const n of g.nodes) for (const f of n.fields) if (["Statement", "Pattern"].includes(f.name)) texts.set(`${n.id}:${f.name}`, f.value);
  const found = new Set([...g.byId.keys(), ...g.edges.filter((e) => e.context === "text").map((e) => e.to)]);
  return { ids: [...found].sort(), texts };
}

/** Upgrades the lite change in `dir` to full; returns the files written. */
export function upgradeToFull(dir: string, tpl: TemplateOptions = {}): string[] {
  const before = snapshot(buildChangeGraph(dir));
  const { writes, removes } = planUpgrade(dir, tpl);
  const originals = new Map<string, string>();
  for (const rel of [...removes, ...writes.keys()]) {
    const p = join(dir, ...rel.split("/"));
    if (existsSync(p)) originals.set(rel, readFileSync(p, "utf8"));
  }
  const changeMd = join(dir, "change.md");
  const changeText = readFileSync(changeMd, "utf8");
  try {
    for (const [rel, text] of writes) {
      const p = join(dir, ...rel.split("/"));
      mkdirSync(dirname(p), { recursive: true });
      writeTextAtomic(p, text);
    }
    for (const rel of removes) rmSync(join(dir, ...rel.split("/")));
    writeTextAtomic(changeMd, setFrontmatterValue(changeText, "profile", "full"));
    const after = snapshot(buildChangeGraph(dir));
    const lost = before.ids.filter((id) => !after.ids.includes(id));
    const gained = after.ids.filter((id) => !before.ids.includes(id));
    const changed = [...before.texts].filter(([k, v]) => after.texts.get(k) !== v).map(([k]) => k);
    if (lost.length + gained.length + changed.length > 0) {
      const list = (label: string, xs: string[]) => (xs.length ? `${label} ${xs.slice(0, 5).join(" ")}${xs.length > 5 ? " …" : ""}` : "");
      const detail = ["upgrade would change the change's content; nothing was changed:", list("lost", lost), list("gained", gained), list("changed", changed)].filter(Boolean).join(" ");
      throw new CliError("ERR-CLI-016", { detail });
    }
  } catch (e) {
    for (const rel of writes.keys()) if (!originals.has(rel)) rmSync(join(dir, ...rel.split("/")), { force: true });
    for (const [rel, text] of originals) writeTextAtomic(join(dir, ...rel.split("/")), text);
    writeTextAtomic(changeMd, changeText);
    throw e;
  }
  return [...writes.keys()].sort();
}
