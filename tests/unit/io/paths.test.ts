import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { envValue, executableNames, findNativeOnPath, findOnPath, isInside, normalisePath, pathFolders, pathKey, pathValue, realPath } from "../../../src/io/paths.ts";

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

// --- The executable lookup (C002-IF-007 §Executable lookup, C002-CON-17; C002-T-065) ---

test("lookup: PATH folders keep their order; empty, `.` and relative entries are skipped", () => {
  assert.deepEqual(pathFolders("C:\\a;;.;b\\c;C:x;\\root;D:/d;\\\\srv\\share\\bin", "win32"), ["C:\\a", "D:/d", "\\\\srv\\share\\bin"]);
  assert.deepEqual(pathFolders('"C:\\Program Files\\x";..', "win32"), ["C:\\Program Files\\x"]);
  assert.deepEqual(pathFolders("/usr/bin::.:bin:/opt/x", "posix"), ["/usr/bin", "/opt/x"]);
  assert.deepEqual(pathFolders("", "win32"), []);
});

test("lookup: the names tried follow PATHEXT in its order, the default when unset or empty; a name with an extension is tried as given", () => {
  const names = (n: string, ext?: string) => executableNames(n, "win32", ext).map((x) => `${x.name}:${x.kind}`);
  assert.deepEqual(names("git"), ["git.com:native", "git.exe:native", "git.bat:shim", "git.cmd:shim"]);
  assert.deepEqual(names("git", ""), names("git"), "an empty PATHEXT is the default");
  assert.deepEqual(names("git", ".CMD;.EXE;.VBS;.JS"), ["git.cmd:shim", "git.exe:native"], "PATHEXT order; other extensions passed over");
  assert.deepEqual(names("git.exe"), ["git.exe:native"]);
  assert.deepEqual(names("opencode.cmd"), ["opencode.cmd:shim"]);
  assert.deepEqual(names("tool.ps1"), [], "any other extension is passed over");
  assert.deepEqual(executableNames("git", "posix"), [{ name: "git", kind: "native" }]);
});

test("lookup: the PATH key matches whatever its letter case on Windows only", () => {
  assert.equal(pathValue({ Path: "C:\a" }, "win32"), "C:\a");
  assert.equal(pathValue({ path: "C:\b" }, "win32"), "C:\b");
  assert.equal(pathValue({ Path: "/a" }, "posix"), "");
  assert.equal(envValue({ pathext: ".EXE" }, "PATHEXT", "win32"), ".EXE");
  assert.equal(pathValue({}, "win32"), "");
});

/** Temporary folders `a`, `b`, `cwd` with the given empty files. */
function lookupDirs(files: Record<"a" | "b" | "cwd", string[]>, fn: (d: Record<"a" | "b" | "cwd", string>) => void): void {
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-lookup-")));
  try {
    const d = { a: join(base, "a"), b: join(base, "b"), cwd: join(base, "cwd") };
    for (const k of ["a", "b", "cwd"] as const) {
      mkdirSync(d[k]);
      for (const f of files[k]) {
        writeFileSync(join(d[k], f), "#!/bin/sh\n");
        if (process.platform !== "win32") chmodSync(join(d[k], f), 0o755);
      }
    }
    fn(d);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

const WINDOWS = process.platform === "win32";

test("lookup (Windows): the first match in PATH order, native or shim; the native answer passes over shims", { skip: !WINDOWS && "Windows only" }, () => {
  lookupDirs({ a: ["opencode.cmd"], b: ["opencode.exe"], cwd: ["opencode.exe"] }, (d) => {
    const path = `.;${d.a};${d.b}`;
    assert.deepEqual(findOnPath("opencode", path, { pathext: "" }), { file: join(d.a, "opencode.cmd"), kind: "shim" });
    assert.deepEqual(findNativeOnPath("opencode", path, { pathext: "" }), { file: join(d.b, "opencode.exe") });
    assert.equal(findOnPath("opencode", ".", {}), null, "the working folder through `.` is never searched");
    assert.deepEqual(findOnPath("opencode", `${d.cwd}`, {}), { file: join(d.cwd, "opencode.exe"), kind: "native" }, "only by its absolute path");
  });
  lookupDirs({ a: ["git.exe", "git.com"], b: [], cwd: [] }, (d) => {
    assert.deepEqual(findNativeOnPath("git", d.a, {}), { file: join(d.a, "git.com") }, "PATHEXT order: .COM before .EXE");
    assert.deepEqual(findNativeOnPath("git", d.a, { pathext: ".EXE;.COM" }), { file: join(d.a, "git.exe") });
    assert.deepEqual(findNativeOnPath("git", d.a, { env: { PATHEXT: ".EXE" } }), { file: join(d.a, "git.exe") }, "PATHEXT of the environment");
  });
  lookupDirs({ a: ["git.cmd", "git.bat"], b: ["git.ps1", "git"], cwd: [] }, (d) => {
    assert.deepEqual(findNativeOnPath("git", `${d.a};${d.b}`, {}), { error: "only a .cmd or .bat shim was found" });
    assert.deepEqual(findNativeOnPath("git", d.b, {}), { error: "not found on PATH" }, "a file without a known extension is passed over");
    assert.deepEqual(findOnPath("git", d.a, {}), { file: join(d.a, "git.bat"), kind: "shim" });
    assert.deepEqual(findNativeOnPath("git", "", {}), { error: "not found on PATH" });
  });
  lookupDirs({ a: [], b: [], cwd: [] }, (d) => {
    mkdirSync(join(d.a, "git.exe"));
    assert.deepEqual(findNativeOnPath("git", d.a, {}), { error: "not found on PATH" }, "a folder named git.exe is no match");
  });
});

test("lookup (POSIX): a regular file with execute permission", { skip: WINDOWS && "POSIX only" }, () => {
  lookupDirs({ a: [], b: ["git"], cwd: ["git"] }, (d) => {
    writeFileSync(join(d.a, "git"), "");
    chmodSync(join(d.a, "git"), 0o644);
    assert.deepEqual(findNativeOnPath("git", `.:${d.a}:${d.b}`, {}), { file: join(d.b, "git") });
    assert.deepEqual(findOnPath("git", `${d.b}`, {}), { file: join(d.b, "git"), kind: "native" });
  });
});
