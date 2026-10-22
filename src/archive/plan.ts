// `sdd archive` planner (C001-REQ-913 … 921): checks the preconditions, then computes every merge in
// memory — living-spec entries (ADDED / MODIFIED / REMOVED / RENAMED, with their ACs and scenarios),
// History rows, glossary terms, the change.md status and the folder move — without touching a file.
// The applier writes the result; `--dry-run` prints the operations only.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { CliError } from "../cli/errors.ts";
import { parseBlocks } from "../model/blocks.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { findIds } from "../model/ids.ts";
import { setTopLevel } from "../workspace/change-md.ts";
import { addHistory, appendEntry, deleteRange, entrySource, findEntry, hasHistory, historyCells, markUpdated, newLivingFile, replaceRange } from "./living.ts";

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
  /** [absolute path, new text] in write order; a living file may appear twice (the two passes of CR-11). */
  writes: [string, string][];
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

/**
 * Adds or replaces `row` (matched on its first cell, ignoring case) in the table of `section`;
 * `unchanged` when the table already has the same term with the same definition.
 */
function upsertRow(text: string, section: [RegExp, string, string], row: string[]): { text: string; replaced: boolean; unchanged?: boolean } {
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
    if (ls[hit.line - 1] === line || (hit.cells.length === row.length && hit.cells.every((c, i) => c.trim() === row[i]))) return { text, replaced: false, unchanged: true };
    ls[hit.line - 1] = line;
    return { text: ls.join("\n"), replaced: true };
  }
  const last = rows.length > 0 ? rows[rows.length - 1]!.line : h.line;
  if (rows.length === 0) ls.splice(last, 0, section[2], "|---|---|", line);
  else ls.splice(last, 0, line);
  return { text: ls.join("\n").replace(/\n*$/, "\n"), replaced: false };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Date of an interrupted run of `change`: a `Source` line of one of its entries, or one of its History rows, in `_living/`. */
function earlierRunDate(living: Map<string, string | null>, ids: string[], change: string): string | null {
  for (const text of living.values()) {
    if (text === null) continue;
    for (const id of ids) {
      const s = entrySource(text, id);
      if (s?.change === change) return s.date;
    }
    const row = historyCells(text).find((c) => c[2] === change && /^\d{4}-\d{2}-\d{2}$/.test(c[3] ?? ""));
    if (row) return row[3]!;
  }
  return null;
}

type Copy = { name: string; start: number; end: number; title: string };

export function planArchive(root: string, changeDir: string, today: string): ArchivePlan {
  const sdd = join(root, ".sdd");
  const folder = basename(changeDir);
  const fm = frontmatter(join(changeDir, "change.md"));
  const change = String(fm["id"] ?? `CHG-${folder.slice(0, 3)}`);
  const nnn = folder.slice(0, 3);
  // C001-REQ-924: `archived` while the folder is still outside `_archive/` can only come from an interrupted
  // archive, so the run resumes it (the C001-REQ-913 preconditions are checked again). `stopped` is refused.
  const resumed = fm["status"] === "archived" && basename(dirname(changeDir)) !== "_archive";
  if (fm["status"] === "stopped" || (fm["status"] === "archived" && !resumed)) throw new CliError("ERR-CLI-014", { NNN: nnn, "stopped|archived": String(fm["status"]) });
  const blockers = archiveBlockers(changeDir);

  const kind = typeof fm["kind"] === "string" ? fm["kind"] : "greenfield";
  const srcs = sources(changeDir, folder).map((s) => ({ slug: s.slug, req: readFileSync(s.req, "utf8"), acc: existsSync(s.acc) ? readFileSync(s.acc, "utf8") : "" }));
  const reqsOn = (d: string) => srcs.flatMap((s) => requirements(s.req, s.acc, s.slug, kind, change, d));

  // Living files: current text (null = absent), edited in memory.
  const livingDir = join(sdd, "_living");
  const living = new Map<string, string | null>();
  if (existsSync(livingDir)) for (const n of readdirSync(livingDir).filter((x) => /^CAP-.+\.md$/.test(x)).sort()) living.set(n, readFileSync(join(livingDir, n), "utf8"));
  const original = new Map(living);

  // CR-13: when `_living/` already holds results of this change, the re-run writes with the interrupted run's date.
  const date = earlierRunDate(living, reqsOn(today).map((r) => r.id), change) ?? today;
  const reqs = reqsOn(date);

  const ops: ArchiveOp[] = [];
  const rel = (n: string) => `.sdd/_living/${n}`;
  const fileOf = (slug: string) => `CAP-${slug}.md`;
  const slugOf = (name: string) => name.replace(/^CAP-/, "").replace(/\.md$/, "");
  const text = (name: string) => original.get(name) ?? "";
  const present = () => [...original.keys()].filter((n) => original.get(n) !== null);
  const edit = (name: string, slug: string, fn: (t: string) => string) => {
    const cur = living.get(name);
    const base = cur === undefined || cur === null ? newLivingFile(slug, date) : markUpdated(cur, slug, date);
    living.set(name, fn(base));
  };
  // Decisions use the files as found; the edits run afterwards, moved entries first (CR-11).
  const moveIns: (() => void)[] = [];
  const others: (() => void)[] = [];
  const moveTargets = new Set<string>();
  const tagOf = (r: Requirement) => /^[A-Z]+/.exec(r.delta)?.[0] ?? "";
  const citedBy = (r: Requirement) => findIds(r.delta, null).filter((h) => !h.short && h.id.includes("-REQ-")).map((h) => h.id);
  const MOVED_IN = /^moved from CAP-/;

  /** The living entry of `id`. An ID in two files is resolved only as the split state of this change's move. */
  const locate = (id: string): { at: Copy; moveIn?: Copy } | { duplicate: string } | null => {
    const copies: Copy[] = [];
    for (const name of present()) {
      const e = findEntry(text(name), id);
      if (e) copies.push({ name, ...e });
    }
    if (copies.length === 0) return null;
    if (copies.length === 1) return { at: copies[0]! };
    const isMoveIn = (c: Copy) =>
      reqs.some((r) => tagOf(r) === "RENAMED" && citedBy(r).includes(id) && c.name === fileOf(r.slug) && c.title === r.title) && hasHistory(text(c.name), id, MOVED_IN, change);
    const moved = copies.filter(isMoveIn);
    if (copies.length === 2 && moved.length === 1) return { at: copies.find((c) => c !== moved[0])!, moveIn: moved[0]! };
    return { duplicate: `${id} is a requirement heading in ${copies.map((c) => rel(c.name)).join(" and ")}` };
  };

  for (const r of reqs) {
    const tag = tagOf(r);
    const cited = citedBy(r);
    if (tag === "ADDED") {
      const name = fileOf(r.slug);
      // Already applied: the capability file has an entry for the ID whose Source line names this change.
      if (entrySource(text(name), r.id)?.change === change) continue;
      ops.push({ file: rel(name), op: living.has(name) ? "add" : "create+add", id: r.id });
      others.push(() => edit(name, r.slug, (t) => appendEntry(t, r.entry)));
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
      const found = locate(old);
      if (found && "duplicate" in found) {
        blockers.push(found.duplicate);
        continue;
      }
      if (!found) {
        // Already applied: the cited ID is absent and this change's History row (and new entry) exists.
        const applied =
          tag === "MODIFIED"
            ? present().some((n) => entrySource(text(n), r.id)?.change === change && hasHistory(text(n), old, `superseded by ${r.id}`, change))
            : tag === "REMOVED" && present().some((n) => hasHistory(text(n), old, "removed", change));
        if (!applied) blockers.push(`${old} (cited by ${r.id}) is not in _living/`);
        continue;
      }
      const at = found.at;
      const slug = slugOf(at.name);
      if (tag === "MODIFIED") {
        ops.push({ file: rel(at.name), op: "replace", id: old, detail: `superseded by ${r.id}` });
        others.push(() =>
          edit(at.name, slug, (t) => {
            const e = findEntry(t, old)!;
            return addHistory(replaceRange(t, e.start, e.end, r.entry), [old, `superseded by ${r.id}`, change, date, ""]);
          }),
        );
      } else if (tag === "REMOVED") {
        ops.push({ file: rel(at.name), op: "remove", id: old, detail: `removed by ${r.id}` });
        others.push(() =>
          edit(at.name, slug, (t) => {
            const e = findEntry(t, old)!;
            return addHistory(deleteRange(t, e.start, e.end), [old, "removed", change, date, `by ${r.id}`]);
          }),
        );
      } else {
        const body = text(at.name).split("\n").slice(at.start - 1, at.end);
        const renamed = [`### ${old} — ${r.title}`, ...body.slice(1)];
        const event = `renamed from "${at.title}" to "${r.title}"`;
        const target = fileOf(r.slug);
        if (r.slug === slug) {
          if (at.title === r.title && hasHistory(text(at.name), old, MOVED_IN, change)) {
            // Both halves of a cross-capability move already applied: the move-out row is in another file.
            const out = new RegExp(`^renamed from ".*" to "${escapeRe(r.title)}", moved to CAP-${escapeRe(r.slug)}$`);
            if (!present().some((n) => n !== at.name && hasHistory(text(n), old, out, change))) blockers.push(`${old} (cited by ${r.id}) is in ${rel(at.name)} without the History row of its move-out`);
            continue;
          }
          // Already applied: the entry has the new title and the History row exists.
          if (at.title === r.title && hasHistory(text(at.name), old, new RegExp(`^renamed from ".*" to "${escapeRe(r.title)}"$`), change)) continue;
          ops.push({ file: rel(at.name), op: "rename", id: old, detail: `"${at.title}" → "${r.title}"` });
          others.push(() =>
            edit(at.name, slug, (t) => {
              const e = findEntry(t, old)!;
              return addHistory(replaceRange(t, e.start, e.end, renamed), [old, event, change, date, `by ${r.id}`]);
            }),
          );
        } else {
          ops.push({ file: rel(at.name), op: "move-out", id: old, detail: `to ${rel(target)}, "${at.title}" → "${r.title}"` });
          others.push(() =>
            edit(at.name, slug, (t) => {
              const e = findEntry(t, old)!;
              return addHistory(deleteRange(t, e.start, e.end), [old, `${event}, moved to CAP-${r.slug}`, change, date, `by ${r.id}`]);
            }),
          );
          // Split state: the move-in half is already in the target, so only the move-out half remains.
          if (found.moveIn) continue;
          ops.push({ file: rel(target), op: living.has(target) ? "move-in" : "create+move-in", id: old, detail: `from ${rel(at.name)}` });
          moveTargets.add(target);
          moveIns.push(() => edit(target, r.slug, (t) => addHistory(appendEntry(t, renamed), [old, `moved from CAP-${slug} (was "${at.title}")`, change, date, `by ${r.id}`])));
        }
      }
    }
  }
  if (blockers.length > 0) throw new CliError("ERR-CLI-009", { NNN: nnn, list: blockers.join("; ") });

  // CR-11 write order. Pass 1 writes each file that receives a moved entry with its additions only, so a
  // moved entry is in its target before it leaves its source. Pass 2 writes every changed file with its
  // final content, in sorted order, skipping a file unchanged since pass 1. Without moves: one pass.
  for (const f of moveIns) f();
  const firstPass = new Map<string, string>();
  for (const name of [...moveTargets].sort()) firstPass.set(name, living.get(name)!);
  for (const f of others) f();
  const writes: [string, string][] = [...firstPass].map(([name, t]) => [join(livingDir, name), t]);
  for (const name of [...living.keys()].sort()) {
    const t = living.get(name);
    if (t !== null && t !== undefined && t !== original.get(name) && t !== firstPass.get(name)) writes.push([join(livingDir, name), t]);
  }

  // Glossary (C001-REQ-919); a row that already matches the delta row is left out (CR-14).
  const delta = join(changeDir, "10-spec", "40-domain", "glossary-delta.md");
  if (existsSync(delta)) {
    const dText = readFileSync(delta, "utf8");
    const gPath = join(sdd, "_constitution", "glossary.md");
    let g = existsSync(gPath) ? readFileSync(gPath, "utf8") : ["---", "id: GLOSSARY", "artifact: constitution/glossary", `updated: ${date}`, "---", "# Glossary", ""].join("\n");
    const before = g;
    for (const section of GLOSSARY_SECTIONS)
      for (const row of tableRows(dText, section[0])) {
        const r = upsertRow(g, section, row);
        if (r.unchanged) continue;
        g = r.text;
        ops.push({ file: ".sdd/_constitution/glossary.md", op: r.replaced ? "redefine" : "add-term", id: row[0]! });
      }
    if (g !== before) writes.push([gPath, setTopLevel(g, "updated", date).replace(/\n*$/, "\n")]);
  }

  // Status and move (C001-REQ-920); the status write is left out when change.md already says `archived`.
  const changeMd = join(changeDir, "change.md");
  if (!resumed) {
    writes.push([changeMd, setTopLevel(readFileSync(changeMd, "utf8"), "status", "archived")]);
    ops.push({ file: `.sdd/${folder}/change.md`, op: "set-status", id: change, detail: "archived" });
  }
  const to = join(sdd, "_archive", folder);
  ops.push({ file: `.sdd/${folder}`, op: "move", id: change, detail: `to .sdd/_archive/${folder}` });
  ops.push({ file: ".sdd/registry.json, .sdd/SDD.md", op: "regenerate", id: change });
  return { change, ops, writes, move: { from: changeDir, to } };
}

export function formatOp(o: ArchiveOp): string {
  return `${o.file}: ${o.op} ${o.id}${o.detail ? ` — ${o.detail}` : ""}`;
}
