// Workspace of C005-TS-146 … 150 and 166: change 001 "Coupon codes" (lite) lies under
// `.sdd/_archive/001-coupon-codes/`, with no folder `.sdd/001-*`. Its phases are approved with their real
// hashes, its tasks C001-T-001 and C001-T-075 are done and it has the closed defect D-001. `snapshot`
// records every file under `.sdd/` so a test can assert that a run wrote nothing.
import { cpSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { phaseHash } from "../../../src/gate/hash.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

export interface ArchivedWs {
  root: string;
  /** `.sdd/_archive/001-coupon-codes`. */
  dir: string;
  /** `sdd hash 001 10-spec` before the archive. */
  specHash: string;
  cleanup: () => void;
}

const PLAN = [
  "---",
  'id: "C001-PLAN"',
  "artifact: plan/lite",
  'change: "CHG-001"',
  "phase: 20-plan",
  "status: draft",
  "---",
  "# CHG-001 — Plan (lite)",
  "",
  "## Tasks",
  "",
  "### C001-T-001 — Coupon codes",
  "- **Status:** done",
  "- **Implements:** C001-REQ-913",
  "- **Estimate:** S",
  "",
  "### C001-T-075 — Archive CHG-001 into living specs",
  "- **Status:** done",
  "- **Implements:** C001-REQ-913",
  "- **Estimate:** S",
  "",
].join("\n");

const SPEC = "---\nid: C001-SPEC\nartifact: spec/lite\n---\n# Spec\n\n### C001-REQ-913 — Coupons\n- **Statement:** THE shop SHALL accept coupon codes.\n";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Every file under `.sdd/` with its content. */
export function snapshot(root: string): Map<string, string> {
  const sdd = join(root, ".sdd");
  return new Map(walk(sdd).map((p) => [relative(sdd, p).split("\\").join("/"), readFileSync(p, "utf8")]));
}

export function archivedChange(): ArchivedWs {
  const ws = makeWorkspace({ "README.md": "x\n" });
  const run = (args: string[]) => {
    const r = runBundled(args, { cwd: ws.root });
    if (r.code !== 0) throw new Error(`${args.join(" ")}: ${r.stderr}`);
    return r.stdout;
  };
  run(["init"]);
  run(["change", "new", "Coupon codes", "--profile", "lite", "--kind", "brownfield"]);
  const active = join(ws.root, ".sdd", "001-coupon-codes");
  writeFileSync(join(active, "10-spec", "spec.md"), SPEC);
  writeFileSync(join(active, "20-plan", "plan.md"), PLAN);
  const specHash = run(["hash", "001", "10-spec"]).trim();
  const cm = join(active, "change.md");
  let text = readFileSync(cm, "utf8").replace(/^status: active$/m, "status: archived").replace(/^phase: .*$/m, "phase: 20-plan");
  for (const p of ["00-ideation", "10-spec", "20-plan"]) {
    const line = `  ${p}: { status: approved, approved_hash: "${phaseHash(active, p).hash}", approved_at: 2026-11-17, approved_by: "P-01" }`;
    text = text.split("\n").map((l) => (l.startsWith(`  ${p}:`) ? line : l)).join("\n");
  }
  text = text.replace(
    /^defects: \[\]$/m,
    "defects:\n  - { id: D-001, ref: C001-REQ-913, summary: \"late coupon rule\", reporter: P-01, date: 2026-11-17, status: closed, resolution: \"fixed\" }",
  );
  writeFileSync(cm, text);
  const dir = join(ws.root, ".sdd", "_archive", "001-coupon-codes");
  cpSync(active, dir, { recursive: true });
  rmSync(active, { recursive: true, force: true });
  run(["status", "--write"]);
  return { root: ws.root, dir, specHash, cleanup: ws.cleanup };
}
