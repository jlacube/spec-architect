// `sdd template show <profile>/<path>` and `sdd template list <profile>` (C002-IF-007, C002-REQ-513,
// C002-REQ-514, C002-REQ-520): generated agents read templates through the CLI. Both use the shared
// template resolution, which confines every lookup to the profile folder; a workspace is optional
// (its `.sdd/_templates/` overrides the shipped templates when one is found from the working folder).
import { join } from "node:path";
import { findWorkspace } from "../workspace/find.ts";
import { listResolvableTemplates, resolveTemplate, TEMPLATE_PROFILES, type TemplateOptions, type TemplateProfile } from "../workspace/templates.ts";
import type { CommandContext } from "./commands.ts";
import { CliError } from "./errors.ts";

function isProfile(p: string): p is TemplateProfile {
  return (TEMPLATE_PROFILES as readonly string[]).includes(p);
}

function options(cwd: string): TemplateOptions {
  const root = findWorkspace(cwd);
  return root === null ? {} : { sddDir: join(root, ".sdd") };
}

/** Prints the template bytes unchanged; ERR-CLI-019 for an unknown profile or template, or a path out of the profile folder. */
export function templateShow(ctx: CommandContext): number {
  const arg = ctx.args["template"]!;
  const slash = arg.indexOf("/");
  const profile = slash < 0 ? arg : arg.slice(0, slash);
  const path = slash < 0 ? "" : arg.slice(slash + 1);
  if (!isProfile(profile)) throw new CliError("ERR-CLI-019", { profile, path });
  const t = resolveTemplate(profile, path, options(ctx.cwd));
  ctx.out.trace("template", { source: t.source, path: t.path });
  ctx.out.raw(t.text);
  return 0;
}

/** One path per line in code-point order; an unknown profile prints nothing (exit 0). */
export function templateList(ctx: CommandContext): number {
  const profile = ctx.args["profile-name"]!;
  if (!isProfile(profile)) return 0;
  for (const p of listResolvableTemplates(profile, options(ctx.cwd))) ctx.out.line(p);
  return 0;
}
