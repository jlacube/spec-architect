// Release check entry (C002-IF-009 §5, C002-COMP-010, C002-ADR-003): options, print forms and exit
// codes. Bundled and run by scripts/release-check.mjs; tests import `main` directly.
//   node scripts/release-check.mjs --target opencode|copilot [--version <v>] [--dry-run] [--root <dir>]
// Exit 0 when the release is allowed, 1 when refused (every refusal printed on standard error as
// `<code>: <message>`, errors.md §3), 2 on a usage error, 3 on an internal error. In both decided cases
// the release record docs/releases/<target>/<version>/release.json is written, unless --dry-run.
// --root names the repository whose evidence, source plugin and dist/ are read (default: this one).
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import type { Target } from "../generate/tables.ts";
import { releaseCheck, UsageError, type CheckOptions } from "./check.ts";
import { formatRefusal } from "./errors.ts";

const USAGE = "usage: node scripts/release-check.mjs --target opencode|copilot [--version <v>] [--dry-run] [--root <dir>]";
const TARGETS: readonly Target[] = ["opencode", "copilot"];

export interface MainOptions {
  cwd?: string;
  stdout?: (line: string) => void;
  stderr?: (line: string) => void;
  /** Overrides of the check options (tests: a shared source plugin and dist/, a fixed date). */
  check?: Partial<Pick<CheckOptions, "source" | "dist" | "today">>;
  /** Default repository root when --root is not given. */
  root?: string;
}

/** The repository of this script: the bundle runs from build/release/, the source from scripts/release/. */
function defaultRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function main(argv: readonly string[], options: MainOptions = {}): number {
  const stdout = options.stdout ?? ((l: string) => void process.stdout.write(l + "\n"));
  const stderr = options.stderr ?? ((l: string) => void process.stderr.write(l + "\n"));
  const usage = (message: string) => {
    stderr(`release-check: ${message}`);
    stderr(USAGE);
    return 2;
  };
  let values: { target?: string; version?: string; "dry-run"?: boolean; root?: string };
  try {
    ({ values } = parseArgs({
      args: [...argv],
      options: { target: { type: "string" }, version: { type: "string" }, "dry-run": { type: "boolean" }, root: { type: "string" } },
      strict: true,
      allowPositionals: false,
    }));
  } catch (e) {
    return usage(e instanceof Error ? e.message : String(e));
  }
  if (values.target === undefined) return usage("--target is required");
  if (!TARGETS.includes(values.target as Target)) return usage(`unknown target "${values.target}"; targets: ${TARGETS.join(", ")}`);
  const target = values.target as Target;
  const root = values.root !== undefined ? resolve(options.cwd ?? process.cwd(), values.root) : (options.root ?? defaultRoot());

  try {
    const r = releaseCheck({ target, root, ...(values.version !== undefined ? { version: values.version } : {}), dryRun: values["dry-run"] === true, ...options.check });
    for (const x of r.refusals) stderr(formatRefusal(x));
    const where = values["dry-run"] ? `release record not written (--dry-run; would be ${r.recordPath})` : `release record ${r.recordPath}`;
    stdout(`release-check: ${target} ${r.record.package_version} (${r.record.enforcement_mode}): ${r.outcome}${r.refusals.length > 0 ? ` (${r.refusals.length} refusals)` : ""}; ${where}`);
    return r.outcome === "released" ? 0 : 1;
  } catch (e) {
    if (e instanceof UsageError) return usage(e.message);
    stderr(`release-check: internal error: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
    return 3;
  }
}
