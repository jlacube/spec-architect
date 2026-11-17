// Workspace with the scaffolded change 003 (lite or full) at G1 or G2, for the pre-phase questions-log
// scenarios C005-TS-111 and C005-TS-175 (C005-IF-004). `sdd change new` scaffolds change 001, which is
// renumbered to 003; the approved phases get their real hashes.
import { readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { phaseHash } from "../../../src/gate/hash.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

export interface PrePhaseWs {
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

/** Change 003 with `gate` approved ("G1": 00-ideation; "G2": 00-ideation and 10-spec); later phases not started. */
export function prePhaseChange(profile: "lite" | "full", gate: "G1" | "G2"): PrePhaseWs {
  const ws = makeWorkspace({ "README.md": "x\n" });
  const run = (args: string[]) => {
    const r = runBundled(args, { cwd: ws.root });
    if (r.code !== 0) throw new Error(`${args.join(" ")}: ${r.stderr}`);
  };
  run(["init"]);
  run(["change", "new", "Export to CSV", "--profile", profile, "--kind", "brownfield"]);
  const old = readdirSync(join(ws.root, ".sdd")).find((d) => d.startsWith("001-"))!;
  const dir = join(ws.root, ".sdd", old.replace(/^001-/, "003-"));
  renameSync(join(ws.root, ".sdd", old), dir);
  walk(dir, (p) => writeFileSync(p, readFileSync(p, "utf8").split("C001-").join("C003-").split("CHG-001").join("CHG-003")));
  const approved = gate === "G1" ? ["00-ideation"] : ["00-ideation", "10-spec"];
  const next = gate === "G1" ? "10-spec" : "20-plan";
  const cm = join(dir, "change.md");
  let text = readFileSync(cm, "utf8").replace(/^phase: .*$/m, `phase: ${next}`);
  for (const p of approved) {
    const line = `  ${p}: { status: approved, approved_hash: "${phaseHash(dir, p).hash}", approved_at: 2026-11-17, approved_by: "P-01" }`;
    text = text.split("\n").map((l) => (l.startsWith(`  ${p}:`) ? line : l)).join("\n");
  }
  writeFileSync(cm, text);
  run(["status", "--write"]);
  return { root: ws.root, dir, cleanup: ws.cleanup };
}

/** A pre-phase questions log of C005-IF-004 for `phase`, after `gate`, with one round; `sources` fills its Sources line. */
export function prePhaseLog(phase: "10-spec" | "20-plan", gate: "G1" | "G2", sources = "none"): string {
  const [id, artifact] = phase === "10-spec" ? ["SPEC-QLOG", "spec/questions-log"] : ["PLAN-QLOG", "plan/questions-log"];
  return [
    "---",
    `id: "C003-${id}"`,
    `artifact: ${artifact}`,
    'change: "CHG-003"',
    `phase: ${phase}`,
    "status: draft",
    "---",
    `# CHG-003 — Questions log (${phase})`,
    "",
    "## Round 1 — 2026-11-18",
    "",
    `**Pre-phase round:** answered after the approval of ${gate}, before \`${phase}\` started.`,
    "",
    "### Q-export-01 — Should the CSV export be in v1?",
    "- **Blocking:** no · **Material:** yes · **Candidates considered:** 2",
    "- **Why it matters:** decides the scope of the first release.",
    "- **Options:**",
    "  1. Keep it out of v1 (Recommended) — smaller first release.",
    "  2. Include it — one more story.",
    `- **Sources:** ${sources}`,
    "- **Answer:** Keep the CSV export out of v1",
    "- **Extracted instructions:** none",
    "",
  ].join("\n");
}
