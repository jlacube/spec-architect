// Artifact templates (C001-COMP-13): plugin defaults under `<plugin>/templates/<profile>/`, overridden
// per repository by `.sdd/_templates/<profile>/<same path>`. Every lookup is confined to the profile
// folder: a path whose normalised or real path leaves it is never read (C002-REQ-514, C002-IF-007).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CliError } from "../cli/errors.ts";
import { isInside, realPath } from "../io/paths.ts";

export type Profile = "full" | "lite";

/** Profiles `sdd template show|list` accepts: the change profiles and the constitution (C002-IF-007). */
export const TEMPLATE_PROFILES = ["full", "lite", "constitution"] as const;
export type TemplateProfile = (typeof TEMPLATE_PROFILES)[number];

/** Files `sdd change new --profile lite` scaffolds besides change.md and ids.json (C001-IF-06 §3, C001-REQ-117). */
export const LITE_SCAFFOLD = [
  "00-ideation/ideation.md",
  "00-ideation/questions-log.md",
  "10-spec/spec.md",
  "10-spec/dod.md",
  "20-plan/plan.md",
  "20-plan/handoff.md",
] as const;

export interface TemplateOptions {
  /** Plugin root (`<plugin>`); defaults to the folder above the bundled script when it holds `templates/`, else CLAUDE_PLUGIN_ROOT. */
  pluginRoot?: string;
  /** Workspace folder (`.sdd`) whose `_templates/` overrides plugin defaults. */
  sddDir?: string;
}

export interface ResolvedTemplate {
  path: string;
  source: "override" | "plugin";
  text: string;
}

/**
 * The templates shipped with the running CLI: the folder above the bundle (`<root>/scripts/sdd.mjs`)
 * when it holds `templates/`, so the npm `sdd` reads its own (translated) templates even when a
 * Claude Code session has set CLAUDE_PLUGIN_ROOT; on Claude Code both name the same plugin folder.
 * Unbundled runs fall back to CLAUDE_PLUGIN_ROOT.
 */
export function defaultPluginRoot(): string {
  const beside = join(dirname(fileURLToPath(import.meta.url)), "..");
  if (existsSync(join(beside, "templates"))) return beside;
  return process.env["CLAUDE_PLUGIN_ROOT"] || beside;
}

function templatesDir(profile: TemplateProfile, options: TemplateOptions): string {
  return join(options.pluginRoot ?? defaultPluginRoot(), "templates", profile);
}

/** Profile folders in lookup order: the repository override first, then the shipped one. */
function profileFolders(profile: TemplateProfile, options: TemplateOptions): { root: string; source: ResolvedTemplate["source"] }[] {
  return [
    ...(options.sddDir ? [{ root: join(options.sddDir, "_templates", profile), source: "override" as const }] : []),
    { root: templatesDir(profile, options), source: "plugin" as const },
  ];
}

/** True when `candidate` lies inside `root` both lexically and after resolving links. */
function confined(root: string, candidate: string): boolean {
  return isInside(root, candidate) && isInside(root, candidate, { real: true });
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

/** Template paths of a profile, relative to its folder, with `/` separators, sorted. */
export function listTemplates(profile: Profile, options: TemplateOptions = {}): string[] {
  const root = templatesDir(profile, options);
  const out: string[] = [];
  const walk = (dir: string, rel: string) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, `${rel}${name}/`);
      else out.push(`${rel}${name}`);
    }
  };
  walk(root, "");
  return out.sort();
}

/** Ascending Unicode code-point order (C002-REQ-520); `<` on strings compares UTF-16 code units. */
export function byCodePoint(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const d = x[i]!.codePointAt(0)! - y[i]!.codePointAt(0)!;
    if (d !== 0) return d;
  }
  return x.length - y.length;
}

/** Files under `root` whose real path stays inside it, relative with `/` separators. */
function confinedFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const walk = (dir: string, rel: string) => {
    const real = realPath(dir);
    if (seen.has(real)) return; // a link back to a folder already listed
    seen.add(real);
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (!confined(root, p)) continue;
      let st;
      try {
        st = statSync(p);
      } catch {
        continue; // dangling link
      }
      if (st.isDirectory()) walk(p, `${rel}${name}/`);
      else if (st.isFile()) out.push(`${rel}${name}`);
    }
  };
  walk(root, "");
  return out;
}

/**
 * Every path `resolveTemplate` resolves for `profile`: the union of the override and shipped folders,
 * each path once, in code-point order (C002-REQ-520).
 */
export function listResolvableTemplates(profile: TemplateProfile, options: TemplateOptions = {}): string[] {
  const all = new Set(profileFolders(profile, options).flatMap((f) => confinedFiles(f.root)));
  return [...all].sort(byCodePoint);
}

/**
 * The repository override, else the shipped template. A candidate whose normalised or real path
 * leaves its profile folder is not used; ERR-CLI-019 when none remains (C002-REQ-513, C002-REQ-514).
 */
export function resolveTemplate(profile: TemplateProfile, rel: string, options: TemplateOptions = {}): ResolvedTemplate {
  const parts = rel.split("/");
  for (const { root, source } of profileFolders(profile, options)) {
    const path = join(root, ...parts);
    if (!isFile(path) || !confined(root, path)) continue;
    return { path, source, text: readFileSync(path, "utf8") };
  }
  throw new CliError("ERR-CLI-019", { profile, path: rel });
}

/** Replaces `{{KEY}}` for every key given; other placeholders are left in place. */
export function renderTemplate(text: string, vars: Readonly<Record<string, string>>): string {
  return text.replace(/\{\{([A-Z]+)\}\}/g, (m, key: string) => vars[key] ?? m);
}

/** Placeholders still present in `text`. */
export function placeholders(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{([A-Z]+)\}\}/g)].map((m) => m[1]!))].sort();
}
