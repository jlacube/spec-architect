// Artifact templates (C001-COMP-13): plugin defaults under `<plugin>/templates/<profile>/`, overridden
// per repository by `.sdd/_templates/<profile>/<same path>`.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type Profile = "full" | "lite";

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
  /** Plugin root (`<plugin>`); defaults to CLAUDE_PLUGIN_ROOT, else the folder above the bundled script. */
  pluginRoot?: string;
  /** Workspace folder (`.sdd`) whose `_templates/` overrides plugin defaults. */
  sddDir?: string;
}

export interface ResolvedTemplate {
  path: string;
  source: "override" | "plugin";
  text: string;
}

export function defaultPluginRoot(): string {
  const env = process.env["CLAUDE_PLUGIN_ROOT"];
  if (env) return env;
  // The bundle lives at <plugin>/scripts/sdd.mjs.
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

function templatesDir(profile: Profile, options: TemplateOptions): string {
  return join(options.pluginRoot ?? defaultPluginRoot(), "templates", profile);
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

export function resolveTemplate(profile: Profile, rel: string, options: TemplateOptions = {}): ResolvedTemplate {
  const parts = rel.split("/");
  if (options.sddDir) {
    const override = join(options.sddDir, "_templates", profile, ...parts);
    if (existsSync(override)) return { path: override, source: "override", text: readFileSync(override, "utf8") };
  }
  const path = join(templatesDir(profile, options), ...parts);
  if (!existsSync(path)) throw new Error(`no ${profile} template for ${rel}`);
  return { path, source: "plugin", text: readFileSync(path, "utf8") };
}

/** Replaces `{{KEY}}` for every key given; other placeholders are left in place. */
export function renderTemplate(text: string, vars: Readonly<Record<string, string>>): string {
  return text.replace(/\{\{([A-Z]+)\}\}/g, (m, key: string) => vars[key] ?? m);
}

/** Placeholders still present in `text`. */
export function placeholders(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{([A-Z]+)\}\}/g)].map((m) => m[1]!))].sort();
}
