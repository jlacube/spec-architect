// `npm run check` (C001-REQ-1117): typecheck, `claude plugin validate`, the test suites (unit and
// integration), the lint fixture suite and the plugin structure checks of C001-IF-08 §3. Every step
// runs and prints its result; the exit code is non-zero when any step failed. The step `targets`
// (C002-REQ-601, C002-IF-005 §6) generates the OpenCode and Copilot packages from the current source
// plugin into a fresh temporary folder and runs the target structure checks on them. The step `tarball`
// (C002-T-023, C002-IF-003 §2) stages and packs architect-sdd into a fresh temporary folder and runs the
// manifest check TGT-NPM-001 and the SPDX header scan on it.
//   node scripts/check.mjs [--steps typecheck,validate,build,tests,fixtures,structure,targets,tarball]
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;
const claude = process.env.CLAUDE_CODE_EXECPATH || "claude";

const run = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });

const STEPS = {
  typecheck: { title: "typecheck (tsc)", run: () => run(node, [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json", "--noEmit"]) },
  validate: {
    title: "claude plugin validate",
    run: () => {
      for (const target of ["plugins/architect", "."]) {
        const r = run(claude, ["plugin", "validate", target]);
        if (r.error) return { status: null, skipped: `Claude Code not found (${claude}); set CLAUDE_CODE_EXECPATH or put claude on PATH` };
        if (r.status !== 0) return r;
      }
      return { status: 0 };
    },
  },
  build: { title: "build (bundle, license allowlist, notices)", run: () => run(node, [join(root, "scripts", "build.mjs")]) },
  tests: { title: "unit and integration tests", run: () => run(node, [join(root, "scripts", "test.mjs")]) },
  fixtures: {
    title: "lint fixtures",
    // A separate output folder, so this run never touches the folder of a test run that started it.
    run: () => run(node, [join(root, "scripts", "test.mjs"), "tests/unit/lint/fixtures"], { SDD_TEST_OUTDIR: join(root, "build", "tests-fixtures") }),
  },
  structure: { title: "plugin structure checks", run: () => run(node, [join(root, "scripts", "check", "run.mjs")]) },
  targets: { title: "target structure checks (opencode, copilot)", run: () => run(node, [join(root, "scripts", "check", "targets", "run.mjs")]) },
  tarball: { title: "architect-sdd tarball check (TGT-NPM-001, SPDX)", run: () => run(node, [join(root, "scripts", "check", "tarball.mjs")]) },
};

const i = process.argv.indexOf("--steps");
const selected = i >= 0 ? process.argv[i + 1].split(",") : Object.keys(STEPS);
const results = [];
for (const name of selected) {
  const step = STEPS[name];
  if (!step) throw new Error(`unknown step ${name}; steps: ${Object.keys(STEPS).join(", ")}`);
  console.log(`\n=== ${step.title} ===`);
  const r = step.run();
  results.push({ title: step.title, ok: r.skipped ? true : r.status === 0, note: r.skipped });
}
console.log("\n=== npm run check ===");
for (const r of results) console.log(`${r.note ? "SKIP" : r.ok ? "PASS" : "FAIL"}  ${r.title}${r.note ? ` — ${r.note}` : ""}`);
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
