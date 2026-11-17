// Change 002 for the lint scenarios of C005-TS-122 … 125 and 144 … 145: a copy of the LINT-HAND-001 good
// fixture (full profile, plan started) renumbered from 004 to 002, with the 20-plan status, the Reporting
// protocol body and task markers set per scenario.
import { cpSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rebuildRegistry } from "../../../src/workspace/status.ts";
import { repoRoot } from "../../helpers.ts";
import { runInProcess } from "../cli/helpers.ts";

export interface LintWs {
  root: string;
  dir: string;
  cleanup: () => void;
}

function walk(dir: string, f: (p: string) => void): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, f);
    else f(p);
  }
}

/** Change 002 (`002-x`) with `20-plan` at `planStatus`; `archived` moves it under `.sdd/_archive/`. */
export function change002(o: { planStatus?: string; reporting?: string; archived?: boolean } = {}): LintWs {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-c005-lint-")));
  cpSync(join(repoRoot(), "tests", "lint-fixtures", "LINT-HAND-001", "good", ".sdd"), join(root, ".sdd"), { recursive: true });
  renameSync(join(root, ".sdd", "004-x"), join(root, ".sdd", "002-x"));
  let dir = join(root, ".sdd", "002-x");
  walk(dir, (p) => writeFileSync(p, readFileSync(p, "utf8").split("004").join("002")));
  const cm = join(dir, "change.md");
  writeFileSync(cm, readFileSync(cm, "utf8").split("20-plan: { status: draft }").join(`20-plan: { status: ${o.planStatus ?? "draft"} }`));
  if (o.reporting !== undefined) {
    const h = join(dir, "20-plan", "handoff.md");
    const text = readFileSync(h, "utf8");
    const at = text.indexOf("## Reporting protocol\n") + "## Reporting protocol\n".length;
    const end = text.indexOf("\n## ", at);
    writeFileSync(h, text.slice(0, at) + "\n" + o.reporting + "\n" + text.slice(end));
  }
  if (o.archived) {
    cpSync(dir, join(root, ".sdd", "_archive", "002-x"), { recursive: true });
    rmSync(dir, { recursive: true, force: true });
    dir = join(root, ".sdd", "_archive", "002-x");
  }
  writeFileSync(join(root, ".sdd", "registry.json"), JSON.stringify(rebuildRegistry(join(root, ".sdd")), null, 2) + "\n");
  return { root, dir, cleanup: () => rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }) };
}

/** The Reporting protocol body of the fixture with one extra line at the top. */
export const reporting = (line: string | null) =>
  (line === null ? "" : `\`\`\`bash\n${line}\n\`\`\`\n\n`) + "Run `sdd task set` and `sdd defect add`. Frontmatter fallback: edit the task file's frontmatter.\n";

export interface LintFinding {
  code: string;
  severity: string;
  path: string;
  line?: number;
  ids?: string[];
  message: string;
}

/** `sdd lint [args] --json` in-process: exit code and findings. */
export function lint(root: string, args: string[]): { code: number; findings: LintFinding[] } {
  const r = runInProcess(["lint", ...args, "--json"], { cwd: root });
  if (r.code !== 0 && r.code !== 1) throw new Error(`lint exit ${r.code}: ${r.stderr}`);
  return { code: r.code, findings: (JSON.parse(r.stdout) as { findings: LintFinding[] }).findings };
}
