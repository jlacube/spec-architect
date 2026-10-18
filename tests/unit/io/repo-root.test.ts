import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalisePath } from "../../../src/io/paths.ts";
import {
  findRepositoryRoot,
  isInsideRepository,
  isOutsideRepository,
  locateInRepository,
} from "../../../src/io/repo-root.ts";

// Repository root of C002-IF-008 §1.1 rule 3 and the containment test of §1.1 rule 2 and §1.2.

function withDir(fn: (dir: string) => void): void {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-repo-root-")));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const n = (p: string) => normalisePath(p);

test("findRepositoryRoot takes the nearest .git first, also above a nearer .sdd/", () => {
  withDir((dir) => {
    mkdirSync(join(dir, "outer", ".sdd"), { recursive: true });
    mkdirSync(join(dir, "outer", "repo", ".git"), { recursive: true });
    mkdirSync(join(dir, "outer", "repo", "pkg", ".sdd"), { recursive: true });
    mkdirSync(join(dir, "outer", "repo", "pkg", "src"), { recursive: true });
    const root = n(join(dir, "outer", "repo"));
    assert.equal(findRepositoryRoot(join(dir, "outer", "repo", "pkg", "src")), root);
    assert.equal(findRepositoryRoot(join(dir, "outer", "repo", "pkg")), root);
    assert.equal(findRepositoryRoot(join(dir, "outer", "repo")), root);
  });
});

test("findRepositoryRoot accepts a .git file (worktree or submodule)", () => {
  withDir((dir) => {
    mkdirSync(join(dir, "wt", "src"), { recursive: true });
    writeFileSync(join(dir, "wt", ".git"), "gitdir: ../main/.git/worktrees/wt\n");
    assert.equal(findRepositoryRoot(join(dir, "wt", "src")), n(join(dir, "wt")));
  });
});

// The fallbacks need a temporary folder that lies in no git working tree and under no .sdd/.
const tmpRoot = findRepositoryRoot(realpathSync.native(tmpdir()));
const tmpIsBare = tmpRoot === n(realpathSync.native(tmpdir()));

test("findRepositoryRoot falls back to the nearest .sdd/ folder, then to the start folder", { skip: !tmpIsBare && "the temporary folder lies in a repository" }, () => {
  withDir((dir) => {
    mkdirSync(join(dir, "ws", ".sdd"), { recursive: true });
    mkdirSync(join(dir, "ws", "a", "b"), { recursive: true });
    assert.equal(findRepositoryRoot(join(dir, "ws", "a", "b")), n(join(dir, "ws")));
    // A `.sdd` file is not a workspace.
    mkdirSync(join(dir, "plain", "x"), { recursive: true });
    writeFileSync(join(dir, "plain", ".sdd"), "");
    assert.equal(findRepositoryRoot(join(dir, "plain", "x")), n(join(dir, "plain", "x")));
  });
});

test("containment is per path segment, inclusive of the root, and resolves relative folders against cwd", () => {
  withDir((dir) => {
    const root = join(dir, "repo");
    mkdirSync(join(root, ".git"), { recursive: true });
    mkdirSync(join(dir, "repo-data"));
    assert.equal(isInsideRepository(root, root, dir), true);
    assert.equal(isInsideRepository(root, "repo/sub/new", dir), true);
    assert.equal(isOutsideRepository(root, "repo-data", dir), true);
    assert.equal(isInsideRepository(root, "repo/../repo-data", dir), false);
    assert.equal(isOutsideRepository(root, "..", root), true);
    const l = locateInRepository(root, "./sub", root);
    assert.equal(l.written, n(join(root, "sub")));
  });
});

test("containment folds letter case on Windows only", () => {
  withDir((dir) => {
    const root = join(dir, "Repo");
    mkdirSync(join(root, ".git"), { recursive: true });
    const upper = join(dir, "REPO", "sub");
    if (process.platform === "win32") {
      assert.equal(isInsideRepository(root, upper, dir), true);
      assert.equal(isOutsideRepository(root, upper, dir), false);
    } else {
      assert.equal(isOutsideRepository(root, upper, dir), true);
    }
  });
});

test("links and junctions: a folder is inside only when it is inside both as written and after resolution", () => {
  withDir((dir) => {
    const root = join(dir, "repo");
    mkdirSync(join(root, ".git"), { recursive: true });
    mkdirSync(join(root, "src"));
    mkdirSync(join(dir, "elsewhere"));
    // A junction needs no elevation on Windows; elsewhere the type is ignored (directory symlink).
    symlinkSync(join(dir, "elsewhere"), join(root, "out-link"), "junction");
    symlinkSync(join(root, "src"), join(dir, "in-link"), "junction");
    const out = locateInRepository(root, join(root, "out-link", "data"), dir);
    assert.deepEqual([out.insideWritten, out.insideReal], [true, false]);
    assert.equal(out.real, n(join(dir, "elsewhere", "data")));
    assert.equal(isInsideRepository(root, join(root, "out-link"), dir), false);
    assert.equal(isOutsideRepository(root, join(root, "out-link"), dir), false);
    const inn = locateInRepository(root, join(dir, "in-link"), dir);
    assert.deepEqual([inn.insideWritten, inn.insideReal], [false, true]);
    assert.equal(isInsideRepository(root, join(dir, "in-link"), dir), false);
    assert.equal(isOutsideRepository(root, join(dir, "in-link"), dir), false);
    // A root reached through a link compares by its real path too.
    symlinkSync(root, join(dir, "repo-link"), "junction");
    assert.equal(isInsideRepository(join(dir, "repo-link"), join(dir, "repo-link", "src"), dir), true);
  });
});

test("8.3 short names resolve to the long folder", { skip: process.platform !== "win32" }, (t) => {
  withDir((dir) => {
    const long = join(dir, "a-long-repository-name");
    mkdirSync(join(long, ".git"), { recursive: true });
    // `.` inside the directory avoids quoting the path for cmd.exe.
    const short = execFileSync("cmd.exe", ["/d", "/c", "for %I in (.) do @echo %~sI"], { cwd: long, encoding: "utf8" }).trim();
    if (!short || short.toLowerCase() === long.toLowerCase()) {
      t.skip("8.3 short names are disabled on this volume");
      return;
    }
    const l = locateInRepository(long, join(short, "sub"), dir);
    assert.equal(l.insideReal, true);
    assert.equal(l.insideWritten, false);
    assert.equal(isOutsideRepository(long, join(short, "sub"), dir), false);
    assert.equal(isInsideRepository(long, join(dir, "a-long-repository-name-data"), dir), false);
  });
});
