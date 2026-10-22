// Artifact encoding scan of `npm run check` (C001-NFR-404, C001-CON-09; C001-T-080, finding F-5): every
// `.sdd/` file the sdd CLI writes is UTF-8 without BOM, with LF line endings. A file violates the rule when
// it starts with a UTF-8 BOM, holds any CR byte, or is not valid UTF-8.
//   node scripts/check/encoding.mjs
// Scope (a), which fails the step: files written by the bundled CLI (plugins/architect/scripts/sdd.mjs)
//   - a fresh fx-large workspace (tests/fixtures/gen-large.mjs) after `status --write` and
//     `trace --active --write`;
//   - a workspace the CLI created from fx-empty (an empty git repository): `init`, then `change new` with
//     the full and the lite profile.
// Scope (b), reported only: this repository's `.sdd/` working tree. Those files are written by hand and by
// editing tools, not by the CLI, and git normalises them at commit (`.gitattributes`: `.sdd/** text eol=lf`).
// Output: one line per violating file, then a total per scope. Exit 1 when scope (a) has a violation or a
// CLI run fails. SDD_TEST_ENCODING_SEED=1 (tests only) plants a CRLF file in a scope (a) workspace after the
// CLI runs, to show that a violation fails the step (C001-TC-1129).
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { generateLarge } from "../../tests/fixtures/gen-large.mjs";

// Valid when this file runs as a script (the exports below take their paths as arguments).
const REPO = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const SDD = join(REPO, "plugins", "architect", "scripts", "sdd.mjs");

/** The rule violations of one file's bytes: "BOM", "CR", "not UTF-8" (empty when the file is clean). */
export function violations(buf) {
  const why = [];
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) why.push("BOM");
  if (buf.includes(13)) why.push("CR");
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    why.push("not UTF-8");
  }
  return why;
}

/** Scans every file below `dir`: `{ files, bad: [{ path, why }] }`, paths relative to `base` with `/`. */
export function scanDir(dir, base = dir) {
  const out = { files: 0, bad: [] };
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else {
        out.files++;
        const why = violations(readFileSync(p));
        if (why.length > 0) out.bad.push({ path: relative(base, p).split(sep).join("/"), why });
      }
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

function cli(cwd, args) {
  const r = spawnSync(process.execPath, [SDD, ...args], { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`sdd ${args.join(" ")} exited ${r.status} in ${cwd}: ${r.stderr}`);
}

/** Builds the scope (a) workspaces in `base`: their roots, keyed by a label. */
export function cliWorkspaces(base, { seed = false } = {}) {
  const large = join(base, "fx-large");
  generateLarge(large);
  cli(large, ["status", "--write"]);
  cli(large, ["trace", "--active", "--write"]);
  const empty = join(base, "fx-empty");
  spawnSync("git", ["init", "-q", empty], { stdio: "ignore" });
  cli(empty, ["init"]);
  cli(empty, ["change", "new", "Encoding probe full", "--profile", "full"]);
  cli(empty, ["change", "new", "Encoding probe lite", "--profile", "lite"]);
  if (seed) writeFileSync(join(empty, ".sdd", "seeded-crlf.md"), "# Seeded\r\n\r\nA CRLF file planted by SDD_TEST_ENCODING_SEED.\r\n");
  return { "fx-large after status --write, trace --write": large, "fx-empty after init, change new": empty };
}

function report(label, scan) {
  for (const b of scan.bad) console.log(`  ${b.path}: ${b.why.join(", ")}`);
  console.log(`${label}: ${scan.bad.length} of ${scan.files} file(s) violate UTF-8 without BOM, LF`);
}

// Run as a script only (not when bundled into a test, where import.meta.url is the test file).
if (process.argv[1]?.endsWith("encoding.mjs") && fileURLToPath(import.meta.url) === process.argv[1]) {
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-encoding-")));
  let failed = 0;
  try {
    const roots = cliWorkspaces(base, { seed: process.env.SDD_TEST_ENCODING_SEED === "1" });
    console.log("scope (a) — files written by the sdd CLI (fails the step):");
    for (const [label, root] of Object.entries(roots)) {
      const scan = scanDir(join(root, ".sdd"), root);
      report(`  ${label}`, scan);
      failed += scan.bad.length;
    }
    console.log("scope (b) — this repository's .sdd/ working tree (reported only, not written by the CLI):");
    report("  .sdd/", scanDir(join(REPO, ".sdd"), REPO));
  } catch (e) {
    console.error(`encoding scan: ${e instanceof Error ? e.message : String(e)}`);
    failed = Math.max(failed, 1);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  console.log(`encoding scan (C001-NFR-404): ${failed === 0 ? "pass" : "FAIL"} — ${failed} violation(s) in files written by the CLI`);
  process.exitCode = failed === 0 ? 0 : 1;
}
