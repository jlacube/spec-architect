// `sdd archive` planner (C001-REQ-913 … 921): checks the preconditions, then computes every merge in
// memory — living-spec entries (ADDED / MODIFIED / REMOVED / RENAMED, with their ACs and scenarios),
// History rows, glossary terms, the change.md status and the folder move — without touching a file.
// The applier writes the result; `--dry-run` prints the operations only.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { CliError } from "../cli/errors.ts";
import { parseBlocks } from "../model/blocks.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { findIds } from "../model/ids.ts";
import { setTopLevel } from "../workspace/change-md.ts";
import { addHistory, appendEntry, deleteRange, findEntry, markUpdated, newLivingFile, replaceRange } from "./living.ts";

export interface ArchiveOp {
  /** Workspace-relative path (`.sdd/…`). */
  file: string;
  op: string;
  id: string;
  detail?: string;
}

export interface ArchivePlan {
  change: string;
  ops: ArchiveOp[];
  /** Absolute path → new text, in write order. */
  writes: Map<string, string>;
  move: { from: string; to: string };
}

interface Requirement {
  id: string;
  title: string;
  slug: string;
  delta: string;
  /** Entry lines for the living file (heading, fields without Delta, ACs and scenarios). */
  entry: string[];
}

const REQ_HEADING = /^(C\d{3}-REQ-\d+)\s*—\s*(.*)$/;
const SEPARATOR = /^\|?\s*:?-{3,}/;

function trimBlank(ls: string[]): string[] {
  let a = 0;
  let b = ls.length;
  while (a < b && ls[a]!.trim() === "") a++;
  while (b > a && ls[b - 1]!.trim() === "") b--;
  return ls.slice(a, b);
}

/** AC blocks (`#### C<nnn>-AC-<num>.<n>`) of a file, keyed by requirement number. */
function acceptanceBlocks(text: string): Map<string, string[][]> {
  const ls = text.split("\n");
  const b = parseBlocks(ls, 1);
  const out = new Map<string, string[][]>();
  for (const h of b.headings) {
    const m = /^(C\d{3})-AC-(\d+)\.\d+\b/.exec(h.text);
    if (h.level !== 4 || !m) continue;
    const block: string[] = [];
    for (let i = h.line; i <= b.sectionEnd(h.line); i++) {
      // A lite spec's coverage table follows the last AC without a heading of its own.
      if (i > h.line && ls[i - 1]!.startsWith("|") && !b.inFence(i)) break;
      block.push(ls[i - 1]!);
    }
    const key = `${m[1]}-REQ-${m[2]}`;
    out.set(key, [...(out.get(key) ?? []), trimBlank(block)]);
  }
  return out;
}

function requirements(reqText: string, accText: string, slug: string, kind: string, change: string, date: string): Requirement[] {
  const ls = reqText.split("\n");
  const b = parseBlocks(ls, 1);
  const acs = acceptanceBlocks(accText);
  const out: Requirement[] = [];
  for (const h of b.headings) {
    const m = REQ_HEADING.exec(h.text);
    if (h.level !== 3 || !m) continue;
    const block = trimBlank(ls.slice(h.line - 1, b.sectionEnd(h.line)));
    const deltaLine = block.find((l) => /^- \*\*Delta:\*\*/.test(l));
    const delta = deltaLine ? deltaLine.replace(/^- \*\*Delta:\*\*\s*/, "").trim() : kind === "greenfield" ? "ADDED" : "";
    const body = block.slice(1).filter((l) => l !== deltaLine);
    const entry = [block[0]!, `- **Source:** ${change}, archived ${date}`, ...body];
    for (const ac of acs.get(m[1]!) ?? []) entry.push("", ...ac);
    out.push({ id: m[1]!, title: m[2]!.trim(), slug, delta, entry });
  }
  return out;
}

function frontmatter(path: string): Record<string, unknown> {
  return (splitFrontmatter(readFileSync(path, "utf8")).data ?? {}) as Record<string, unknown>;
}

/** The unmet preconditions of C001-REQ-913 (empty when the change can be archived). */
export function archiveBlockers(changeDir: string): string[] {
  const fm = frontmatter(join(changeDir, "change.md"));
  const out: string[] = [];
  const plan = (fm["phases"] as Record<string, { status?: string }> | undefined)?.["20-plan"]?.status ?? "not-started";
  if (plan !== "approved") out.push(`G3 not approved (20-plan ${plan})`);
  const tasksDir = join(changeDir, "20-plan", "50-tasks");
  if (existsSync(tasksDir))
    for (const f of readdirSync(tasksDir).filter((n) => n.endsWith(".md")).sort()) {
      const t = frontmatter(join(tasksDir, f));
      const status = String(t["status"] ?? "todo");
      if (status !== "done" && status !== "dropped") out.push(`${String(t["id"] ?? f)} ${status}`);
    }
  for (const d of (fm["defects"] as Record<string, unknown>[] | undefined) ?? []) if (d["status"] === "open") out.push(`${String(d["id"])} open`);
  return out;
}

/** Requirement and acceptance sources: one pair per capability (full) or the single spec.md (lite). */
function sources(changeDir: string, folder: string): { req: string; acc: string; slug: string }[] {
  const capDir = join(changeDir, "10-spec", "20-capabilities");
  if (existsSync(capDir))
    return readdirSync(capDir)
      .filter((n) => /^CAP-\d+-/.test(n) && existsSync(join(capDir, n, "requirements.md")))
      .sort()
      .map((n) => ({ req: join(capDir, n, "requirements.md"), acc: join(capDir, n, "acceptance.md"), slug: n.replace(/^CAP-\d+-/, "") }));
  const lite = join(changeDir, "10-spec", "spec.md");
  if (!existsSync(lite)) return [];
  const cap = frontmatter(lite)["capability"];
  return [{ req: lite, acc: lite, slug: typeof cap === "string" && cap !== "" ? cap : folder.replace(/^\d{3}-/, "") }];
}

/** Glossary rows (first two cells) of the sections whose heading matches `name`. */
function tableRows(text: string, name: RegExp): string[][] {
  const ls = text.split("\n");
  const b = parseBlocks(ls, 1);
  const out: string[][] = [];
  for (const h of b.headings) {
    if (!name.test(h.text)) continue;
    const end = b.sectionEnd(h.line);
    for (const r of b.tableRows) {
      if (r.line <= h.line || r.line > end) continue;
      if (SEPARATOR.test(ls[r.line - 1]!.trim()) || SEPARATOR.test((ls[r.line] ?? "").trim())) continue;
      if (r.cells.length >= 2 && r.cells[0]!.trim() !== "") out.push([r.cells[0]!.trim(), r.cells[1]!.trim()]);
    }
  }
  return out;
}

const GLOSSARY_SECTIONS: [RegExp, string, string][] = [
  [/domain terms/i, "## Domain terms", "| Term | Definition |"],
  [/system names/i, "## System names (allowed after `THE` in EARS statements)", "| Name | Component |"],
];

/** Adds or replaces `row` (matched on its first cell, ignoring case) in the table of `section`. */
function upsertRow(text: string, section: [RegExp, string, string], row: string[]): { text: string; replaced: boolean } {
  const ls = text.split("\n");
  let b = parseBlocks(ls, 1);
  let h = b.headings.find((x) => x.level === 2 && section[0].test(x.text));
  if (!h) {
    while (ls.length > 0 && ls[ls.length - 1] === "") ls.pop();
    ls.push("", section[1]);
    b = parseBlocks(ls, 1);
    h = b.headings.find((x) => x.level === 2 && section[0].test(x.text))!;
  }
  const end = b.sectionEnd(h.line);
  const line = `| ${row.map((c) => c.replace(/\|/g, "\\|")).join(" | ")} |`;
  const rows = b.tableRows.filter((r) => r.line > h!.line && r.line <= end);
  const hit = rows.find((r) => !SEPARATOR.test(ls[r.line - 1]!.trim()) && !SEPARATOR.test((ls[r.line] ?? "").trim()) && r.cells[0]?.trim().toLowerCase() === row[0]!.toLowerCase());
  if (hit) {
    ls[hit.line - 1] = line;
    return { text: ls.join("\n"), replaced: true };
  }
  const last = rows.length > 0 ? rows[rows.length - 1]!.line : h.line;
  if (rows.length === 0) ls.splice(last, 0, section[2], "|---|---|", line);
  else ls.splice(last, 0, line);
  return { text: ls.join("\n").replace(/\n*$/, "\n"), replaced: false };
}

export function planArchive(root: string, changeDir: string, date: string): ArchivePlan {
  const sdd = join(root, ".sdd");
  const folder = basename(changeDir);
  const fm = frontmatter(join(changeDir, "change.md"));
  const change = String(fm["id"] ?? `CHG-${folder.slice(0, 3)}`);
  const nnn = folder.slice(0, 3);
  if (fm["status"] === "stopped" || fm["status"] === "archived") throw new CliError("ERR-CLI-014", { NNN: nnn, "stopped|archived": String(fm["status"]) });
  const blockers = archiveBlockers(changeDir);

  const kind = typeof fm["kind"] === "string" ? fm["kind"] : "greenfield";
  const reqs = sources(changeDir, folder).flatMap((s) => requirements(readFileSync(s.req, "utf8"), existsSync(s.acc) ? readFileSync(s.acc, "utf8") : "", s.slug, kind, change, date));

  // Living files: current text (null = absent), edited in memory.
  const livingDir = join(sdd, "_living");
  const living = new Map<string, string | null>();
  if (existsSync(livingDir)) for (const n of readdirSync(livingDir).filter((x) => /^CAP-.+\.md$/.test(x)).sort()) living.set(n, readFileSync(join(livingDir, n), "utf8"));
  const original = new Map(living);
  const ops: ArchiveOp[] = [];
  const rel = (n: string) => `.sdd/_living/${n}`;
  const fileOf = (slug: string) => `CAP-${slug}.md`;
  const edit = (name: string, slug: string, fn: (t: string) => string) => {
    const cur = living.get(name);
    const base = cur === undefined || cur === null ? newLivingFile(slug, date) : markUpdated(cur, slug, date);
    living.set(name, fn(base));
  };
  const locate = (id: string) => {
    for (const [name, text] of living) if (text !== null) {
      const e = findEntry(text, id);
      if (e) return { name, ...e };
    }
    return null;
  };
  const slugOf = (name: string) => name.replace(/^CAP-/, "").replace(/\.md$/, "");

  for (const r of reqs) {
    const tag = /^[A-Z]+/.exec(r.delta)?.[0] ?? "";
    const cited = findIds(r.delta, null).filter((h) => !h.short && h.id.includes("-REQ-")).map((h) => h.id);
    if (tag === "ADDED") {
      const name = fileOf(r.slug);
      ops.push({ file: rel(name), op: living.has(name) ? "add" : "create+add", id: r.id });
      edit(name, r.slug, (t) => appendEntry(t, r.entry));
      continue;
    }
    if (!["MODIFIED", "REMOVED", "RENAMED"].includes(tag)) {
      blockers.push(`${r.id} has no valid Delta (${r.delta || "missing"})`);
      continue;
    }
    if (cited.length === 0) {
      blockers.push(`${r.id} is ${tag} but cites no living requirement`);
      continue;
    }
    for (const old of cited) {
      const at = locate(old);
      if (!at) {
        blockers.push(`${old} (cited by ${r.id}) is not in _living/`);
        continue;
      }
      const slug = slugOf(at.name);
      if (tag === "MODIFIED") {
        ops.push({ file: rel(at.name), op: "replace", id: old, detail: `superseded by ${r.id}` });
        edit(at.name, slug, (t) => {
          const e = findEntry(t, old)!;
          return addHistory(replaceRange(t, e.start, e.end, r.entry), [old, `superseded by ${r.id}`, change, date, ""]);
        });
      } else if (tag === "REMOVED") {
        ops.push({ file: rel(at.name), op: "remove", id: old, detail: `removed by ${r.id}` });
        edit(at.name, slug, (t) => {
          const e = findEntry(t, old)!;
          return addHistory(deleteRange(t, e.start, e.end), [old, "removed", change, date, `by ${r.id}`]);
        });
      } else {
        const text = living.get(at.name)!;
        const body = text.split("\n").slice(at.start - 1, at.end);
        const renamed = [`### ${old} — ${r.title}`, ...body.slice(1)];
        const event = `renamed from "${at.title}" to "${r.title}"`;
        if (r.slug === slug) {
          ops.push({ file: rel(at.name), op: "rename", id: old, detail: `"${at.title}" → "${r.title}"` });
          edit(at.name, slug, (t) => {
            const e = findEntry(t, old)!;
            return addHistory(replaceRange(t, e.start, e.end, renamed), [old, event, change, date, `by ${r.id}`]);
          });
        } else {
          const target = fileOf(r.slug);
          ops.push({ file: rel(at.name), op: "move-out", id: old, detail: `to ${rel(target)}, "${at.title}" → "${r.title}"` });
          ops.push({ file: rel(target), op: living.has(target) ? "move-in" : "create+move-in", id: old, detail: `from ${rel(at.name)}` });
          edit(at.name, slug, (t) => {
            const e = findEntry(t, old)!;
            return addHistory(deleteRange(t, e.start, e.end), [old, `${event}, moved to CAP-${r.slug}`, change, date, `by ${r.id}`]);
          });
          edit(target, r.slug, (t) => addHistory(appendEntry(t, renamed), [old, `moved from CAP-${slug} (was "${at.title}")`, change, date, `by ${r.id}`]));
        }
      }
    }
  }
  if (blockers.length > 0) throw new CliError("ERR-CLI-009", { NNN: nnn, list: blockers.join("; ") });

  const writes = new Map<string, string>();
  for (const [name, text] of living) if (text !== null && text !== original.get(name)) writes.set(join(livingDir, name), text);

  // Glossary (C001-REQ-919).
  const delta = join(changeDir, "10-spec", "40-domain", "glossary-delta.md");
  if (existsSync(delta)) {
    const dText = readFileSync(delta, "utf8");
    const gPath = join(sdd, "_constitution", "glossary.md");
    let g = existsSync(gPath) ? readFileSync(gPath, "utf8") : ["---", "id: GLOSSARY", "artifact: constitution/glossary", `updated: ${date}`, "---", "# Glossary", ""].join("\n");
    const before = g;
    for (const section of GLOSSARY_SECTIONS)
      for (const row of tableRows(dText, section[0])) {
        const r = upsertRow(g, section, row);
        g = r.text;
        ops.push({ file: ".sdd/_constitution/glossary.md", op: r.replaced ? "redefine" : "add-term", id: row[0]! });
      }
    if (g !== before) writes.set(gPath, setTopLevel(g, "updated", date).replace(/\n*$/, "\n"));
  }

  // Status and move (C001-REQ-920).
  const changeMd = join(changeDir, "change.md");
  writes.set(changeMd, setTopLevel(readFileSync(changeMd, "utf8"), "status", "archived"));
  ops.push({ file: `.sdd/${folder}/change.md`, op: "set-status", id: change, detail: "archived" });
  const to = join(sdd, "_archive", folder);
  ops.push({ file: `.sdd/${folder}`, op: "move", id: change, detail: `to .sdd/_archive/${folder}` });
  ops.push({ file: ".sdd/registry.json, .sdd/SDD.md", op: "regenerate", id: change });
  return { change, ops, writes, move: { from: changeDir, to } };
}

export function formatOp(o: ArchiveOp): string {
  return `${o.file}: ${o.op} ${o.id}${o.detail ? ` — ${o.detail}` : ""}`;
}
