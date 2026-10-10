import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isInside, normalisePath, pathKey, realPath } from "../../../src/io/paths.ts";

// Lexical normalisation tables, testable on any OS (C001-NFR-402: simulated POSIX paths).
const WIN: [string, string][] = [
  ["C:\\repo\\.sdd\\..\\src\\app.ts", "C:/repo/src/app.ts"],
  ["c:/repo/.sdd/004-x/a.md", "C:/repo/.sdd/004-x/a.md"],
  ["C:/repo//.sdd/./a.md", "C:/repo/.sdd/a.md"],
  ["C:/repo/.sdd/", "C:/repo/.sdd"],
  ["C:\\", "C:/"],
  ["\\\\server\\share\\repo\\.sdd\\a.md", "//server/share/repo/.sdd/a.md"],
  ["\\\\?\\C:\\repo\\.sdd\\a.md", "C:/repo/.sdd/a.md"],
  ["\\\\?\\UNC\\server\\share\\a.md", "//server/share/a.md"],
  [".sdd\\a.md", "C:/repo/.sdd/a.md"],
];
const POSIX: [string, string][] = [
  ["/repo/.sdd/../src/app.ts", "/repo/src/app.ts"],
  ["/repo//.sdd/./a.md", "/repo/.sdd/a.md"],
  ["/repo/.sdd/", "/repo/.sdd"],
  ["/", "/"],
  [".sdd/a.md", "/repo/.sdd/a.md"],
  ["/Repo/.SDD/a.md", "/Repo/.SDD/a.md"],
];

test("normalisePath on Windows paths", () => {
  for (const [input, out] of WIN) assert.equal(normalisePath(input, { platform: "win32", cwd: "C:\\repo" }), out, input);
});

test("normalisePath on POSIX paths", () => {
  for (const [input, out] of POSIX) assert.equal(normalisePath(input, { platform: "posix", cwd: "/repo" }), out, input);
});

test("pathKey folds case on Windows only", () => {
  assert.equal(pathKey("C:/REPO/.SDD/a.md", { platform: "win32" }), pathKey("c:\\repo\\.sdd\\A.MD", { platform: "win32" }));
  assert.notEqual(pathKey("/Repo/a", { platform: "posix" }), pathKey("/repo/a", { platform: "posix" }));
});

test("isInside decisions of C001-TS-1105 (lexical part)", () => {
  const win = { platform: "win32" as const, cwd: "C:/repo" };
  const root = "C:/repo/.sdd";
  assert.equal(isInside(root, "C:/repo/.sdd/../src/app.ts", win), false);
  assert.equal(isInside(root, "C:/REPO/.SDD/004-x/a.md", win), true);
  assert.equal(isInside(root, "D:/other/.sdd/a.md", win), false);
  assert.equal(isInside(root, "C:/repo/.sdd", win), true);
  assert.equal(isInside(root, "C:/repo/.sddx/a.md", win), false);
  assert.equal(isInside("C:/", "C:/repo/a.md", win), true);
  const posix = { platform: "posix" as const, cwd: "/repo" };
  assert.equal(isInside("/repo/.sdd", "/repo/.SDD/a.md", posix), false);
  assert.equal(isInside("/repo/.sdd", ".sdd/004-x/a.md", posix), true);
});

test("realPath resolves symbolic links and junctions, also for targets that do not exist yet", () => {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-paths-")));
  try {
    mkdirSync(join(dir, "src"));
    mkdirSync(join(dir, ".sdd"));
    // A junction needs no elevation on Windows; elsewhere the type is ignored (directory symlink).
    symlinkSync(join(dir, "src"), join(dir, ".sdd", "link-to-src"), "junction");
    const target = join(dir, ".sdd", "link-to-src", "new-file.ts");
    assert.equal(realPath(target), normalisePath(join(dir, "src", "new-file.ts")));
    assert.equal(isInside(join(dir, ".sdd"), target, { real: true }), false);
    assert.equal(isInside(join(dir, ".sdd"), join(dir, ".sdd", "004-x", "a.md"), { real: true }), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("realPath expands Windows 8.3 short names", { skip: process.platform !== "win32" }, (t) => {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-paths-")));
  try {
    const long = join(dir, "a-long-directory-name");
    mkdirSync(long);
    // `.` inside the directory avoids quoting the path for cmd.exe.
    const short = execFileSync("cmd.exe", ["/d", "/c", "for %I in (.) do @echo %~sI"], { cwd: long, encoding: "utf8" }).trim();
    if (!short || short.toLowerCase() === long.toLowerCase()) {
      t.skip("8.3 short names are disabled on this volume");
      return;
    }
    assert.equal(pathKey(realPath(join(short, "x.md"))), pathKey(join(long, "x.md")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
