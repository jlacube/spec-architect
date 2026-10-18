// fx-tgz (test plan §fixtures, C002-T-022): the `architect-sdd` package staged from this repository's
// build outputs (plugins/architect/scripts/sdd.mjs, build/npm/), packed by `npm pack` and installed
// globally into a clean temporary prefix with an isolated npm cache and user config (offline: the package
// has no dependencies). Built once per test process; the repository's dist/ is not touched.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { npmCli, packNpm, stageNpm } from "../../scripts/package.mjs";
import { repoRoot } from "../helpers.ts";

export interface FxTgz {
  /** Path of the packed tarball (`architect-sdd-<version>.tgz`). */
  tgz: string;
  /** Tarball entries by name (`package/…`). */
  entries: Map<string, Buffer>;
  /** ERR-BLD-002 messages of the staging scan (empty for the repository's templates). */
  scan: string[];
  /** Global install prefix. */
  prefix: string;
  /** Installed package folder (`<prefix>/node_modules/architect-sdd` or `<prefix>/lib/node_modules/…`). */
  pkgDir: string;
  /** Folder of the installed executables' shims. */
  binDir: string;
  /** Runs an installed executable (`sdd` or `sdd-mcp`) through its npm shim; arguments must need no quoting. */
  runShim: (bin: "sdd" | "sdd-mcp", args: string[], opts: { cwd: string; env?: Record<string, string | undefined> }) => Run;
  /** Runs the installed package's entry `scripts/<bin>.mjs` with Node (arguments passed as is). */
  runEntry: (bin: "sdd" | "sdd-mcp", args: string[], opts: { cwd: string; env?: Record<string, string | undefined> }) => Run;
}

export interface Run {
  code: number;
  stdout: string;
  stderr: string;
}

/** Entries of a gzipped tar archive (ustar, with pax `path` records), by name. */
export function readTgz(path: string): Map<string, Buffer> {
  const buf = gunzipSync(readFileSync(path));
  const out = new Map<string, Buffer>();
  let p = 0;
  let paxPath: string | null = null;
  while (p + 512 <= buf.length) {
    const header = buf.subarray(p, p + 512);
    if (header.every((b) => b === 0)) break;
    const str = (o: number, n: number) => header.toString("utf8", o, o + n).replace(/\0.*$/s, "");
    const size = parseInt(str(124, 12).trim() || "0", 8);
    const type = str(156, 1) || "0";
    const prefix = str(345, 155);
    const name = paxPath ?? (prefix ? `${prefix}/${str(0, 100)}` : str(0, 100));
    const body = buf.subarray(p + 512, p + 512 + size);
    p += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") {
      const m = /\d+ path=([^\n]*)\n/.exec(body.toString("utf8"));
      paxPath = m ? m[1]! : null;
      continue;
    }
    paxPath = null;
    if (type === "0" || type === "\0") out.set(name, Buffer.from(body));
  }
  return out;
}

const ENV_BASE = { SDD_DEBUG: undefined, SDD_TEST_FAULT: undefined, CLAUDE_PLUGIN_ROOT: undefined, CLAUDE_PLUGIN_DATA: undefined };

let cached: FxTgz | null = null;
let tmp: string | null = null;

/** The fx-tgz fixture of this test process (built on first use). */
export function fxTgz(): FxTgz {
  if (cached) return cached;
  const root = repoRoot();
  const { version } = JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8")) as { version: string };
  tmp = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-tgz-")));
  const stage = join(tmp, "dist", "npm", "architect-sdd");
  const scan = stageNpm(root, stage, version);
  const tgz = packNpm(stage, join(tmp, "dist"));
  const prefix = join(tmp, "prefix");
  const cache = join(tmp, "npm-cache");
  const rc = join(tmp, "npmrc");
  mkdirSync(prefix);
  writeFileSync(rc, "");
  execFileSync(
    process.execPath,
    [npmCli(), "install", "--global", tgz, "--prefix", prefix, "--cache", cache, "--userconfig", rc, "--offline", "--no-audit", "--no-fund", "--no-update-notifier", "--loglevel", "error"],
    { cwd: tmp, stdio: ["ignore", "ignore", "inherit"] },
  );
  const win = process.platform === "win32";
  const pkgDir = win ? join(prefix, "node_modules", "architect-sdd") : join(prefix, "lib", "node_modules", "architect-sdd");
  const binDir = win ? prefix : join(prefix, "bin");
  if (!existsSync(join(pkgDir, "package.json"))) throw new Error(`fx-tgz: ${pkgDir} not installed`);
  const env = (extra?: Record<string, string | undefined>) => ({ ...process.env, ...ENV_BASE, ...extra });
  const result = (r: ReturnType<typeof spawnSync>): Run => ({ code: r.status ?? -1, stdout: String(r.stdout), stderr: String(r.stderr) });
  cached = {
    tgz,
    entries: readTgz(tgz),
    scan,
    prefix,
    pkgDir,
    binDir,
    runShim: (bin, args, opts) =>
      result(
        win
          ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `""${join(binDir, `${bin}.cmd`)}" ${args.join(" ")}"`], {
              cwd: opts.cwd,
              env: env(opts.env),
              encoding: "utf8",
              input: "",
              windowsVerbatimArguments: true,
            })
          : spawnSync(join(binDir, bin), args, { cwd: opts.cwd, env: env(opts.env), encoding: "utf8", input: "" }),
      ),
    runEntry: (bin, args, opts) => result(spawnSync(process.execPath, [join(pkgDir, "scripts", `${bin}.mjs`), ...args], { cwd: opts.cwd, env: env(opts.env), encoding: "utf8", input: "" })),
  };
  return cached;
}

/** Removes the fixture's temporary folder (call from `after`). */
export function cleanupFxTgz(): void {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
  cached = null;
}
