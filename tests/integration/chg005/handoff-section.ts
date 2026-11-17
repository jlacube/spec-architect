// Reporting protocol helpers for C005-TS-114 … 119 (C005-IF-003 §3).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";

export const PLUGIN_VERSION = (JSON.parse(readFileSync(join(repoRoot(), "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;

/** Lines of the `## Reporting protocol` section, up to the next level-2 heading. */
export function reportingSection(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const at = lines.indexOf("## Reporting protocol");
  if (at < 0) throw new Error("no Reporting protocol section");
  let end = lines.findIndex((l, i) => i > at && /^## /.test(l));
  if (end < 0) end = lines.length;
  return lines.slice(at + 1, end);
}

/** The install line of C005-IF-003 §1 for one version, as a whole-line test. */
export function isInstallLine(line: string, version: string): boolean {
  return line.trim() === `npm install -g architect-sdd@${version}`;
}

/** Index of the install line and the CLI command lines (`task set`, `defect add`) of a section. */
export function commands(section: string[]): { install: number; cli: { i: number; line: string }[] } {
  const install = section.findIndex((l) => l.trim().startsWith("npm install -g architect-sdd@"));
  const cli = section.map((line, i) => ({ i, line: line.trim() })).filter((x) => x.line.includes("task set ") || x.line.includes("defect add "));
  return { install, cli };
}

/** The single change folder created under `.sdd/` (`001-*`). */
export function createdChange(root: string): string {
  const dirs = readdirSync(join(root, ".sdd")).filter((d) => /^\d{3}-/.test(d));
  if (dirs.length !== 1) throw new Error(`expected one change folder, got ${dirs.join(", ")}`);
  return join(root, ".sdd", dirs[0]!);
}
