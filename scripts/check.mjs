// `npm run check` (C001-REQ-1117): typecheck, `claude plugin validate`, the test suites (unit and
// integration), the lint fixture suite and the plugin structure checks of C001-IF-08 §3. Every step
// runs and prints its result; the exit code is non-zero when any step failed. The step `targets`
// (C002-REQ-601, C002-IF-005 §6) generates the OpenCode and Copilot packages from the current source
// plugin into a fresh temporary folder and runs the target structure checks on them. The step `tarball`
// (C002-T-023, C002-IF-003 §2) stages and packs architect-sdd into a fresh temporary folder and runs the
// manifest check TGT-NPM-001 and the SPDX header scan on it. The step `encoding` (C001-NFR-404) scans the
// files the bundled CLI writes for a BOM, CR bytes and invalid UTF-8 (scripts/check/encoding.mjs). The last
// step `coverage` (C001-NFR-502) runs the tests in coverage mode (scripts/test.mjs, SDD_TEST_COVERAGE=1),
// checks the thresholds over src/ (scripts/check/coverage.mjs), and always restores the shipped bundles
// with scripts/build.mjs, also when the tests or the threshold fail (C001-T-080, finding F-5). On Node 20 the
// step runs nothing and reports skipped with the reason, counting as passed (finding F-7).
//   node scripts/check.mjs [--steps typecheck,validate,build,tests,fixtures,encoding,structure,targets,tarball,coverage]
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { coverageSkip } from "./check/coverage.mjs";

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
  encoding: { title: "artifact encoding scan (C001-NFR-404)", run: () => run(node, [join(root, "scripts", "check", "encoding.mjs")]) },
  structure: { title: "plugin structure checks", run: () => run(node, [join(root, "scripts", "check", "run.mjs")]) },
  targets: { title: "target structure checks (opencode, copilot)", run: () => run(node, [join(root, "scripts", "check", "targets", "run.mjs")]) },
  tarball: { title: "architect-sdd tarball check (TGT-NPM-001, SPDX)", run: () => run(node, [join(root, "scripts", "check", "tarball.mjs")]) },
  coverage: {
    title: "coverage (C001-NFR-502)",
    run: () => {
      // F-7: on Node 20 neither the coverage mode nor the threshold check runs; the step counts as passed.
      const skip = coverageSkip();
      if (skip !== null) {
        console.log(`coverage: skipped — ${skip}`);
        return { status: 0, skipped: skip };
      }
      let tests = { status: 1 };
      let threshold = { status: 1 };
      try {
        // Its own output folder, so the coverage-mode transpile never touches the tests step's folder.
        tests = run(node, [join(root, "scripts", "test.mjs")], { SDD_TEST_COVERAGE: "1", SDD_TEST_OUTDIR: join(root, "build", "tests-coverage") });
        threshold = run(node, [join(root, "scripts", "check", "coverage.mjs")]);
      } finally {
        // The coverage run rebuilt both bundles with inline source maps; restore the shipped ones.
        const restore = run(node, [join(root, "scripts", "build.mjs")]);
        if (restore.status !== 0) console.error("coverage: restoring the shipped bundles failed (node scripts/build.mjs)");
        tests = restore.status === 0 ? tests : restore;
      }
      if (tests.status !== 0) console.error("coverage: the test run in coverage mode failed; the figures above may be incomplete");
      return { status: tests.status === 0 && threshold.status === 0 ? 0 : 1 };
    },
  },
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
