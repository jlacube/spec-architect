// C002-T-013 — `--user-data` and `--read-only` of `sdd serena-config` and `sdd serena-launch`
// (C002-REQ-515, C002-REQ-516, C002-IF-007): the per-user data folder per platform, ERR-CLI-020 with
// nothing written and Serena not started, and the read-only mode file beside the CLI in the plugin and
// in the npm layout. The four platform rules are checked on the rule itself; containment, writes and
// starts run on this machine's rule with a temporary user profile (the variables are stubs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalisePath, userDataFolder, USER_OS, type UserOs } from "../../../src/io/paths.ts";
import { readOnlyModeFile, setSpawner } from "../../../src/workspace/serena-launch.ts";
import { userDataDir } from "../../../src/workspace/user-data.ts";
import { CliError } from "../../../src/cli/errors.ts";
import { repoRoot } from "../../helpers.ts";
import { fxBootstrap } from "../../fixtures/fixtures.ts";
import { cmdStarts, envWithPath, exeStarts, nodeOnlyDir, plantCmd, plantExe, STUB_EXE_SKIP } from "../stub-exe.ts";
import { CLI, runBundled, runInProcess } from "./helpers.ts";

interface Start {
  command: string;
  args: string[];
  env: Readonly<Record<string, string | undefined>> | undefined;
}

/** A temporary user profile `<base>` with a repository `<base>/repo` (`.sdd/` marks its root). */
function withProfile(fn: (base: string, repo: string, starts: Start[]) => void): void {
  const base = normalisePath(realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-user-data-"))));
  const repo = `${base}/repo`;
  mkdirSync(join(repo, ".sdd"), { recursive: true });
  writeFileSync(join(repo, ".sdd", "SDD.md"), "# SDD workspace\n");
  const starts: Start[] = [];
  setSpawner((command, args, env) => {
    starts.push({ command, args, env });
    return { status: 0 };
  });
  try {
    fn(base, repo, starts);
  } finally {
    setSpawner(null);
    rmSync(base, { recursive: true, force: true });
  }
}

/** The environment that points this machine's rule at `folder`, and the data folder it yields. */
function hostEnv(folder: string): { env: Record<string, string>; data: string } {
  if (USER_OS === "windows") return { env: { LOCALAPPDATA: folder }, data: `${folder}/architect-sdd` };
  if (USER_OS === "macos") return { env: { HOME: folder }, data: `${folder}/Library/Application Support/architect-sdd` };
  return { env: { XDG_DATA_HOME: folder }, data: `${folder}/architect-sdd` };
}

/** Every `serena_config.yml` under `dir`. */
function configsUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((p) => p.endsWith("serena_config.yml"));
}

test("C002-TC-523 (C002-TS-523): the per-user data folder follows the platform rule", () => {
  const rows: [UserOs, Record<string, string | undefined>, string][] = [
    ["windows", { LOCALAPPDATA: "C:/fx-home/AppData/Local" }, "C:/fx-home/AppData/Local/architect-sdd"],
    ["windows", { LOCALAPPDATA: "C:\\fx-home\\AppData\\Local" }, "C:/fx-home/AppData/Local/architect-sdd"],
    ["linux", { XDG_DATA_HOME: "/fx-home/data", HOME: "/fx-home" }, "/fx-home/data/architect-sdd"],
    ["linux", { HOME: "/fx-home" }, "/fx-home/.local/share/architect-sdd"],
    ["linux", { XDG_DATA_HOME: "", HOME: "/fx-home" }, "/fx-home/.local/share/architect-sdd"],
    ["macos", { HOME: "/Users/fx" }, "/Users/fx/Library/Application Support/architect-sdd"],
  ];
  for (const [os, env, folder] of rows) assert.deepEqual(userDataFolder("architect-sdd", env, os), { folder }, `${os} ${JSON.stringify(env)}`);
});

test("C002-TC-523 (C002-TS-523): serena-config --user-data writes the config with the dashboard off in the per-user folder, not in the repository", () => {
  withProfile((base, repo) => {
    const { env, data } = hostEnv(`${base}/AppData/Local`);
    const r = runInProcess(["serena-config", "--user-data"], { cwd: repo, env });
    assert.equal(r.code, 0, r.stderr);
    const text = readFileSync(join(data, "serena", "serena_config.yml"), "utf8");
    assert.match(text, /^web_dashboard: false$/m);
    assert.match(text, /^web_dashboard_open_on_launch: false$/m);
    assert.ok(!existsSync(join(repo, ".serena")));
    assert.deepEqual(configsUnder(repo), []);
  });
});

test("C002-TC-523 (C002-TS-523): a positional folder is used as given, with the user data variable set", () => {
  withProfile((base, repo) => {
    const { env } = hostEnv(`${base}/AppData/Local`);
    const r = runInProcess(["serena-config", `${base}/fx-plugin-data`], { cwd: repo, env });
    assert.equal(r.code, 0, r.stderr);
    assert.ok(existsSync(join(base, "fx-plugin-data", "serena", "serena_config.yml")));
    assert.ok(!existsSync(join(base, "AppData", "Local", "architect-sdd")), "the per-user folder is not used");
  });
});

test("C002-TC-524 (C002-TS-524): serena-launch --user-data starts Serena with SERENA_HOME in the per-user folder and the arguments unchanged", () => {
  withProfile((base, repo, starts) => {
    const { env, data } = hostEnv(`${base}/AppData/Local`);
    const r = runInProcess(["serena-launch", "--user-data", "--", "start-mcp-server", "--project", "."], { cwd: repo, env });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, "", "standard output belongs to the MCP channel");
    assert.equal(starts.length, 1);
    assert.equal(starts[0]!.command, "serena");
    assert.deepEqual(starts[0]!.args, ["start-mcp-server", "--project", "."]);
    assert.equal(starts[0]!.env?.["SERENA_HOME"], `${data}/serena`);
    assert.ok(existsSync(join(data, "serena", "serena_config.yml")));
    assert.ok(!existsSync(join(repo, ".serena")));
  });
});

test("C002-TC-524: the positional form of serena-launch keeps the inherited environment and adds no mode", () => {
  withProfile((base, repo, starts) => {
    const r = runInProcess(["serena-launch", `${base}/plugin-data`, "--", "start-mcp-server"], { cwd: repo });
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(starts.map((s) => [s.args, s.env]), [[["start-mcp-server"], undefined]]);
  });
});

test("C002-TC-525 (C002-TS-525): an undeterminable or relative variable is refused per platform rule", () => {
  const rows: [UserOs, Record<string, string | undefined>, string][] = [
    ["windows", {}, "LOCALAPPDATA is not set"],
    ["windows", { LOCALAPPDATA: "" }, "LOCALAPPDATA is not set"],
    ["windows", { LOCALAPPDATA: "AppData" }, "LOCALAPPDATA is relative: AppData"],
    ["windows", { LOCALAPPDATA: "C:AppData" }, "LOCALAPPDATA is relative: C:AppData"],
    ["linux", {}, "HOME is not set"],
    ["linux", { XDG_DATA_HOME: "data", HOME: "/fx-home" }, "XDG_DATA_HOME is relative: data"],
    ["macos", { XDG_DATA_HOME: "/fx-home/data" }, "HOME is not set"],
  ];
  for (const [os, env, reason] of rows) {
    assert.throws(
      () => userDataDir(repoRoot(), env, os),
      (e: unknown) => e instanceof CliError && e.code === "ERR-CLI-020" && e.message.startsWith(`\`cannot use the user data folder: ${reason}\``),
      `${os} ${JSON.stringify(env)}`,
    );
  }
});

test("C002-TC-525 (C002-TS-525): refused folders exit 2 with ERR-CLI-020, write no config and start no Serena", () => {
  withProfile((base, repo, starts) => {
    const link = `${base}/repo-link`;
    symlinkSync(repo, link, USER_OS === "windows" ? "junction" : "dir");
    const variable = Object.keys(hostEnv(base).env)[0]!;
    const envs: Record<string, string>[] = [
      {},
      { [variable]: "" },
      { [variable]: "data" },
      hostEnv(`${repo}/AppData`).env,
      hostEnv(`${link}/AppData`).env,
      hostEnv(repo).env,
    ];
    // NTFS ignores letter case: the same folder spelt differently is still inside (C002-IF-008 §1.1).
    if (USER_OS === "windows") envs.push(hostEnv(`${repo.slice(0, 1).toLowerCase()}${repo.slice(1).toUpperCase()}/AppData`).env);
    // Linux without XDG_DATA_HOME, macOS: HOME is the repository.
    if (USER_OS !== "windows") envs.push({ HOME: repo });
    for (const env of envs)
      for (const args of [["serena-config", "--user-data"], ["serena-launch", "--user-data", "--", "start-mcp-server"]]) {
        const r = runInProcess(args, { cwd: repo, env });
        const what = `${args[0]} ${JSON.stringify(env)}`;
        assert.equal(r.code, 2, `${what}: ${r.stderr}`);
        assert.ok(r.stderr.startsWith("ERR-CLI-020: `cannot use the user data folder: "), `${what}: ${r.stderr}`);
        assert.equal(r.stdout, "", what);
      }
    assert.deepEqual(configsUnder(base), [], "no serena_config.yml under the profile or the repository");
    assert.deepEqual(starts, [], "Serena was not started");
  });
});

test("C002-TC-525: the reason names the folder and the repository root, or the variable", () => {
  withProfile((base, repo) => {
    const { env, data } = hostEnv(`${repo}/AppData`);
    const inside = runInProcess(["serena-config", "--user-data"], { cwd: `${repo}/.sdd`, env });
    assert.ok(inside.stderr.includes(`${data} lies inside the repository ${repo}`), inside.stderr);
    assert.ok(inside.stderr.includes("Fix: Set the variable to an absolute folder outside the repository"), inside.stderr);
    const variable = Object.keys(hostEnv(base).env)[0]!;
    assert.ok(runInProcess(["serena-config", "--user-data"], { cwd: repo, env: {} }).stderr.includes(`${variable} is not set`));
  });
});

test("C002-TC-533 (C002-TS-533): a per-user folder beside the repository that shares its name prefix is accepted", () => {
  withProfile((base, repo) => {
    const { env, data } = hostEnv(`${base}/repo-data`);
    const r = runInProcess(["serena-config", "--user-data"], { cwd: repo, env });
    assert.equal(r.code, 0, r.stderr);
    assert.ok(existsSync(join(data, "serena", "serena_config.yml")));
  });
});

test("a data folder and --user-data together, or neither, are usage errors", () => {
  withProfile((base, repo, starts) => {
    const { env } = hostEnv(`${base}/data`);
    for (const args of [["serena-config"], ["serena-config", "x", "--user-data"], ["serena-launch", "--", "start-mcp-server"], ["serena-launch", "x", "--user-data", "--", "start-mcp-server"]]) {
      const r = runInProcess(args, { cwd: repo, env });
      assert.equal(r.code, 2, args.join(" "));
      assert.ok(r.stderr.startsWith("ERR-CLI-003"), r.stderr);
    }
    assert.deepEqual(starts, []);
    assert.deepEqual(configsUnder(base), []);
  });
});

test("--read-only appends --mode with the mode file above the CLI folder", () => {
  withProfile((base, repo, starts) => {
    const r = runInProcess(["serena-launch", `${base}/data`, "--read-only", "--", "start-mcp-server", "--mode", "planning"], { cwd: repo });
    assert.equal(r.code, 0, r.stderr);
    const args = starts[0]!.args;
    assert.deepEqual(args.slice(0, 4), ["start-mcp-server", "--mode", "planning", "--mode"]);
    assert.ok(args[4]!.endsWith("/serena/architect-read-only.yml"), args[4]);
  });
  assert.equal(readOnlyModeFile("/pkg/scripts"), normalisePath("/pkg/serena/architect-read-only.yml"));
});

/**
 * Runs a bundled CLI with SDD_DEBUG and returns the traced mode file. `data` is a file, so writing the
 * config fails after the trace and no real Serena starts.
 */
function tracedMode(cli: string, data: string): string {
  const r = spawnSync(process.execPath, [cli, "serena-launch", data, "--read-only", "--", "--version"], { env: { ...process.env, SDD_DEBUG: "1" }, encoding: "utf8" });
  assert.equal(r.status, 3, r.stderr);
  const line = r.stderr.split("\n").find((l) => l.includes(" serena-launch ")) ?? "";
  const m = / mode=("(?:[^"\\]|\\.)*"|\S+)/.exec(line);
  assert.ok(m, r.stderr);
  return m[1]!.startsWith('"') ? (JSON.parse(m[1]!) as string) : m[1]!;
}

test("the read-only mode file is found beside the CLI in the plugin layout and in the npm layout", () => {
  const base = normalisePath(realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-read-only-"))));
  try {
    const plugin = normalisePath(join(repoRoot(), "plugins", "architect"));
    writeFileSync(join(base, "data"), "not a folder\n");
    const inPlugin = tracedMode(CLI, `${base}/data`);
    assert.equal(normalisePath(inPlugin), `${plugin}/serena/architect-read-only.yml`);
    assert.ok(existsSync(inPlugin));
    // npm layout of architect-sdd: <package>/scripts/sdd.mjs and <package>/serena/architect-read-only.yml.
    const pkg = `${base}/node_modules/architect-sdd`;
    mkdirSync(join(pkg, "scripts"), { recursive: true });
    mkdirSync(join(pkg, "serena"), { recursive: true });
    copyFileSync(CLI, join(pkg, "scripts", "sdd.mjs"));
    copyFileSync(join(plugin, "serena", "architect-read-only.yml"), join(pkg, "serena", "architect-read-only.yml"));
    const inPackage = tracedMode(join(pkg, "scripts", "sdd.mjs"), `${base}/data`);
    assert.equal(normalisePath(inPackage), `${pkg}/serena/architect-read-only.yml`);
    assert.ok(existsSync(inPackage));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// --- C002-TC-685 (C002-TS-685; C002-T-065): serena-launch starts the serena of the PATH folders only ---
// The bundled CLI in a copy of fx-bootstrap whose root holds a recording serena.exe (stub-exe);
// LOCALAPPDATA a temporary folder; per row a folder standing for C:/fx/serena-bin with a recording
// serena.exe that also records SERENA_HOME, nothing named serena, or only a recording serena.cmd; the
// PATH of the row with that folder substituted, followed by a folder holding only the real node.exe.
const ROWS_685: { path: string; bin: "exe" | "none" | "cmd" }[] = [
  { path: "BIN", bin: "exe" },
  { path: ".;BIN", bin: "exe" },
  { path: "BIN", bin: "none" },
  { path: "BIN", bin: "cmd" },
];
ROWS_685.forEach((row, i) => {
  test(`C002-TS-685 row ${i + 1} — PATH ${row.path}, serena-bin ${row.bin}: ${row.bin === "exe" ? "one start with SERENA_HOME" : "non-zero exit naming serena"}`, { skip: STUB_EXE_SKIP }, () => {
    const fx = fxBootstrap();
    const home = normalisePath(realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-home-"))));
    try {
      plantExe(fx.root, "serena", { print: "planted" });
      const bin = join(home, "fx-serena-bin");
      mkdirSync(bin, { recursive: true });
      if (row.bin === "exe") plantExe(bin, "serena", { env: ["SERENA_HOME"] });
      if (row.bin === "cmd") plantCmd(bin, "serena", { print: "serena.cmd" });
      const local = `${home}/AppData/Local`;
      const path = [...row.path.split(";").map((e) => (e === "BIN" ? bin : e)), nodeOnlyDir()].join(";");
      const r = runBundled(["serena-launch", "--user-data", "--", "start-mcp-server", "--project", "."], { cwd: fx.root, env: envWithPath(path, { LOCALAPPDATA: local }) });
      if (row.bin === "exe") {
        assert.equal(r.code, 0, r.stderr);
        const starts = exeStarts(bin, "serena");
        assert.equal(starts.length, 1);
        assert.deepEqual(starts[0]!.args, ["start-mcp-server", "--project", "."]);
        assert.equal(normalisePath(starts[0]!.env["SERENA_HOME"]!), `${local}/architect-sdd/serena`);
      } else {
        assert.notEqual(r.code, 0);
        assert.match(r.stderr, /\bserena\b/);
      }
      assert.deepEqual(exeStarts(fx.root, "serena"), [], "the planted serena.exe records no start");
      if (row.bin === "cmd") assert.deepEqual(cmdStarts(bin, "serena"), [], "serena.cmd records no start");
    } finally {
      fx.cleanup();
      rmSync(home, { recursive: true, force: true });
    }
  });
});
