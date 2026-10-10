// Change creation (C001-REQ-107, 108, 117, 125): numbering across active and archived changes,
// slugs, manifest and profile scaffold from the templates.
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { writeTextAtomic } from "../io/atomic.ts";
import { usage } from "../cli/errors.ts";
import { LITE_SCAFFOLD, renderTemplate, resolveTemplate, type Profile, type TemplateOptions } from "./templates.ts";

export const PROFILES: readonly Profile[] = ["lite", "full"];
export const KINDS = ["greenfield", "brownfield", "mixed"] as const;
export type Kind = (typeof KINDS)[number];

/** Lowercase ASCII kebab-case, at most 40 characters, no trailing hyphen (C001-REQ-108). */
export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

/** One plus the highest change number in `.sdd/` and `.sdd/_archive/`, from 001 (C001-REQ-107). */
export function nextChangeNumber(sddDir: string): string {
  let max = 0;
  for (const dir of [sddDir, join(sddDir, "_archive")]) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const m = /^(\d{3})-/.exec(name);
      if (m?.[1] && statSync(join(dir, name)).isDirectory()) max = Math.max(max, Number(m[1]));
    }
  }
  return String(max + 1).padStart(3, "0");
}

export function isoDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Replaces the value of a top-level frontmatter key in place (the line `key: …`). */
export function setFrontmatterValue(text: string, key: string, yamlValue: string): string {
  const lines = text.split("\n");
  if (lines[0] !== "---") throw new Error("no frontmatter");
  const end = lines.indexOf("---", 1);
  const at = lines.findIndex((l, i) => i > 0 && i < end && l.startsWith(`${key}:`));
  if (at < 0) throw new Error(`frontmatter has no ${key}`);
  lines[at] = `${key}: ${yamlValue}`;
  return lines.join("\n");
}

export interface NewChange {
  id: string;
  folder: string;
  dir: string;
}

export function createChange(
  sddDir: string,
  title: string,
  options: { profile: Profile; kind: Kind; date?: Date } & TemplateOptions,
): NewChange {
  const slug = slugify(title);
  if (slug === "") throw usage("change new", "title yields an empty slug; use letters or digits");
  const nnn = nextChangeNumber(sddDir);
  const folder = `${nnn}-${slug}`;
  const dir = join(sddDir, folder);
  const vars = {
    CHANGE: `CHG-${nnn}`, P: `C${nnn}`, NNN: nnn, TITLE: title, DATE: isoDate(options.date),
    KIND: options.kind, PROFILE: options.profile,
    // Entity placeholders of the scaffolded lite files: the first entity of each kind.
    NAME: title, SEQ: "001", NN: "01", B: "1", SLUG: slug,
  };
  const tpl = { ...(options.pluginRoot !== undefined ? { pluginRoot: options.pluginRoot } : {}), sddDir };
  const render = (rel: string) => renderTemplate(resolveTemplate(options.profile, rel, tpl).text, vars);
  mkdirSync(dir);
  for (const phase of ["00-ideation", "10-spec", "20-plan"]) mkdirSync(join(dir, phase));
  // The title goes through YAML double quotes, so it is escaped there (JSON escapes are valid YAML).
  writeTextAtomic(join(dir, "change.md"), setFrontmatterValue(render("change.md"), "title", JSON.stringify(title)));
  writeTextAtomic(join(dir, "ids.json"), render("ids.json"));
  if (options.profile === "lite") for (const rel of LITE_SCAFFOLD) writeTextAtomic(join(dir, ...rel.split("/")), render(rel));
  return { id: `CHG-${nnn}`, folder, dir };
}
