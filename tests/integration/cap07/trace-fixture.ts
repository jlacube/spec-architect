// Trace fixture for C001-TS-706 … 716: the lint-clean minimal change, optionally with a started plan,
// run through `sdd trace` in process.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, minimalChange, runInProcess } from "../cli/helpers.ts";
import { plan } from "../cap06/plan-fixture.ts";

export const CHANGE_DIR = ".sdd/004-x";

export interface TraceRun {
  code: number;
  stdout: string;
  stderr: string;
  /** Contents of a change-relative file, or null when it was not written. */
  file(rel: string): string | null;
}

export function runTrace(args: string[], files: Record<string, string>, withPlan = false): TraceRun {
  const ws = makeWorkspace({ ...minimalChange(), ...(withPlan ? plan() : {}), ...files });
  try {
    const r = runInProcess(["trace", "004", ...args], { cwd: ws.root });
    const contents = new Map<string, string | null>();
    for (const rel of ["10-spec/80-traceability.md", "20-plan/80-traceability.md", "trace.json", "00-ideation/85-open-items.md", "10-spec/85-open-items.md", "20-plan/85-open-items.md"]) {
      const p = join(ws.root, ...CHANGE_DIR.split("/"), ...rel.split("/"));
      contents.set(rel, existsSync(p) ? readFileSync(p, "utf8") : null);
    }
    return { code: r.code, stdout: r.stdout, stderr: r.stderr, file: (rel) => contents.get(rel) ?? null };
  } finally {
    ws.cleanup();
  }
}
