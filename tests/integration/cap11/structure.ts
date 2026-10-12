// A temporary copy of the plugin for the structure-check scenarios (C001-T-061): checks run against the
// copy, with this repository's CHG-001 interfaces and tasks.
import { cpSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { context } from "../../../scripts/check/lib.mjs";
import { runChecks } from "../../../scripts/check/run.mjs";
import { repoRoot } from "../../helpers.ts";

export function pluginCopy() {
  const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-plg-")));
  const plugin = join(repo, "plugins", "architect");
  cpSync(join(repoRoot(), "plugins", "architect"), plugin, { recursive: true });
  const real = context({ repo: repoRoot() });
  const ctx = context({ repo, plugin, interfaces: real.interfaces, tasks: real.tasks });
  return { repo, plugin, ctx, findings: (code: string) => runChecks(ctx).filter((f: { code: string }) => f.code === code), cleanup: () => rmSync(repo, { recursive: true, force: true }) };
}
