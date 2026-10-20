// C002-TC-684 (C002-TS-684; C002-T-065): the `gate` commands of CHG-001's CLI start `git` from the PATH
// folders only (C002-IF-007 §Executable lookup, C002-CON-17). The npm `sdd` of fx-tgz runs in a copy of
// the CHG-001 gate fixture (change 004 with 00-ideation approved, standing for fx-gate's change 002 with
// 10-spec in review), made a git repository by the test, whose root holds a recording `git.exe`
// (stub-exe) that prints `Mallory` for `config user.name`. Per row a folder standing for C:/fx/git-bin
// holds the real `git.exe` of Git for Windows (found once over the test runner's PATH), nothing named
// `git`, or only a recording `git.cmd`; the `sdd` process's PATH is the row's path with that folder
// substituted, followed by a folder holding only the real `node.exe`. CHG-001's own gate tests are
// unchanged (regression-set §4.6).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { findNativeOnPath, pathValue } from "../../../src/io/paths.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { cleanupFxTgz, fxTgz } from "../../fixtures/fx-tgz.ts";
import { approvedChange } from "../cap08/gate-fixture.ts";
import { cmdStarts, envWithPath, exeStarts, nodeOnlyDir, plantCmd, plantExe, STUB_EXE_SKIP } from "../stub-exe.ts";

after(() => cleanupFxTgz());

/** The real git of this machine (REF-WIN: Git for Windows), by the lookup rule over the runner's PATH. */
const REAL_GIT = (() => {
  const r = findNativeOnPath("git", pathValue(process.env), { env: process.env });
  return "file" in r ? r.file : null;
})();

function realGit(cwd: string, ...args: string[]): string {
  const r = spawnSync(REAL_GIT!, args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

type Bin = "real" | "none" | "cmd";
const ROWS: { path: string; bin: Bin; commit: boolean; code: number; by: string | null }[] = [
  { path: "BIN", bin: "real", commit: false, code: 0, by: "Alice" },
  { path: ".;BIN", bin: "real", commit: false, code: 0, by: "Alice" },
  { path: "BIN", bin: "real", commit: true, code: 0, by: "Alice" },
  { path: "BIN", bin: "none", commit: false, code: 0, by: "unknown" },
  { path: "BIN", bin: "cmd", commit: false, code: 0, by: "unknown" },
  { path: "BIN", bin: "none", commit: true, code: 2, by: null },
];

const phases = (dir: string) => splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data?.["phases"] as Record<string, { status: string; approved_by?: string }>;

ROWS.forEach((row, i) => {
  const skip = STUB_EXE_SKIP || (REAL_GIT === null && "no git on the test runner's PATH");
  test(`C002-TS-684 row ${i + 1} — PATH ${row.path}, git-bin ${row.bin}, gate approve${row.commit ? " --commit" : ""}: ${row.code === 0 ? `approved_by ${row.by}` : "ERR-CLI-018"}`, { skip }, () => {
    const ws = approvedChange(["00-ideation"]);
    try {
      realGit(ws.root, "init", "-q");
      realGit(ws.root, "config", "user.name", "Alice");
      realGit(ws.root, "config", "user.email", "alice@example.invalid");
      realGit(ws.root, "add", "-A");
      realGit(ws.root, "commit", "-q", "-m", "fixture");
      plantExe(ws.root, "git", { on: { "config user.name": "Mallory" }, print: "planted" });
      // C:/fx/git-bin: a folder of the fixture, named on PATH by its absolute path.
      const bin = join(ws.root, "fx-git-bin");
      mkdirSync(bin, { recursive: true });
      const binDir = row.bin === "real" ? dirname(REAL_GIT!) : bin;
      if (row.bin === "cmd") plantCmd(bin, "git", { print: "Mallory" });
      const path = [...row.path.split(";").map((e) => (e === "BIN" ? binDir : e)), nodeOnlyDir()].join(";");
      const args = ["gate", "approve", "004", "10-spec", "--note", "ok", ...(row.commit ? ["--commit"] : [])];
      const r = fxTgz().runEntry("sdd", args, { cwd: ws.root, env: envWithPath(path) });
      assert.equal(r.code, row.code, r.stderr);
      const p = phases(ws.dir)["10-spec"]!;
      if (row.code === 0) {
        assert.equal(p.status, "approved");
        assert.equal(p.approved_by, row.by);
        if (row.commit) assert.equal(realGit(ws.root, "log", "-1", "--format=%an"), "Alice");
      } else {
        assert.match(r.stderr, /ERR-CLI-018/);
        assert.match(r.stderr, /not a git repository/);
        assert.notEqual(p.status, "approved", "10-spec still not approved");
      }
      assert.deepEqual(exeStarts(ws.root, "git"), [], "the planted git.exe records no start");
      if (row.bin === "cmd") assert.deepEqual(cmdStarts(bin, "git"), [], "git.cmd records no start");
    } finally {
      ws.cleanup();
    }
  });
});
