// `npm run package`: a self-contained, installable copy of the plugin in dist/.
//   dist/architect-<version>/        marketplace folder: .claude-plugin/marketplace.json, plugins/architect/, INSTALL.md
//   dist/architect-<version>.zip     the same folder, zipped
//   dist/architect-<version>-plugin.zip  the plugin alone (.claude-plugin/plugin.json at the root), for upload UIs
// Steps: build (bundle, license allowlist, notices), plugin structure checks, `claude plugin validate`
// on the staged plugin and marketplace (skipped when Claude Code is not found), then stage and zip.
// The Claude Code packages leave out plugins/architect/targets/ (C002-CON-10, C002-ADR-002).
// Then the npm package architect-sdd (C002-IF-003, C002-ADR-004): dist/npm/architect-sdd/ staged with the
// template CLI-line translation and scan (ERR-BLD-002), packed by `npm pack` into
// dist/architect-sdd-<version>.tgz. Publication stays manual (C002-REQ-502).
// Between the two, the target generator (C002-IF-004, C002-REQ-101, C002-ADR-003) writes dist/opencode/ and
// dist/copilot/, each zipped to dist/architect-<target>-<version>.zip; a generator failure stops the run
// with the generator's exit code, before any target zip or tarball exists.
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { NPM_NAME, npmManifestText } from "./npm-manifest.mjs";
import { translateAndScanTemplates } from "./template-cli-lines.mjs";

/** Top-level folders of plugins/architect/ that no Claude Code package holds: targets/ is the generator's input. */
export const CLAUDE_EXCLUDES = ["targets"];

/** Removes the Windows long-path prefix: `\\?\UNC\server\share` → `\\server\share`, `\\?\C:\x` → `C:\x`. */
export function stripLongPathPrefix(p) {
  if (p.startsWith("\\\\?\\UNC\\")) return `\\\\${p.slice(8)}`;
  if (p.startsWith("\\\\?\\")) return p.slice(4);
  return p;
}

/**
 * `cpSync` filter of the plugin copy: false for an excluded top-level folder of `src` (and so its content).
 * On Windows, Node 20's `fs.cpSync` passes the filter `\\?\`-prefixed long paths while Node 22 passes plain
 * ones (docs/nfr-results.md F-1); the prefix is removed from both `src` and the argument before
 * `relative()`, so the exclusion holds on both versions.
 */
export function pluginFilter(src) {
  const base = stripLongPathPrefix(src);
  return (p) => !CLAUDE_EXCLUDES.includes(relative(base, stripLongPathPrefix(p)).split(sep)[0]);
}

function installText(version, name) {
  return [
    `# Architect ${version} — install`,
    "",
    "Requirements: Claude Code 2.1.295 or later, Node.js 20 or later, Git.",
    "",
    "1. Keep this folder where it is (Claude Code reads the plugin from it). If you received the zip,",
    "   extract it first, for example to `%USERPROFILE%\\claude-plugins\\" + name + "`.",
    "2. In Claude Code:",
    "",
    "   ```text",
    "   /plugin marketplace add <this folder>",
    "   /plugin install architect@architect-local",
    "   ```",
    "",
    "   or from a terminal: `claude plugin marketplace add <this folder>` then",
    "   `claude plugin install architect@architect-local`. Restart Claude Code when asked.",
    "3. In the repository you want to specify:",
    "",
    "   ```text",
    "   claude --agent architect:sdd-conductor",
    "   ```",
    "",
    "   then run `/architect:doctor` and `/architect:init`.",
    "",
    "Updating to a newer package: replace this folder with the new one (same path), then",
    "`claude plugin marketplace update architect-local` and `claude plugin update architect@architect-local`.",
    "",
    "Removing: `claude plugin uninstall architect@architect-local` and `claude plugin marketplace remove architect-local`.",
    "",
    "Full guide: `plugins/architect/README.md`.",
    "",
  ].join("\n");
}

/** Stages the marketplace folder `stage` from repository `root`: marketplace.json, the plugin (without excludes), INSTALL.md. */
export function stageMarketplace(root, stage, version) {
  const name = `architect-${version}`;
  const plugin = join(root, "plugins", "architect");
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(join(stage, ".claude-plugin"), { recursive: true });
  cpSync(join(root, ".claude-plugin", "marketplace.json"), join(stage, ".claude-plugin", "marketplace.json"));
  cpSync(plugin, join(stage, "plugins", "architect"), { recursive: true, filter: pluginFilter(plugin) });
  writeFileSync(join(stage, "INSTALL.md"), installText(version, name));
}

/** The Architect repository, whose README is the full guide (C002-IF-003 §1). */
export const REPOSITORY_URL = "https://github.com/jlacube/spec-architect";

/** README.md of architect-sdd (C002-IF-003 §1): install, the two executables, the shipped files, the repository URL. */
export function npmReadme(version) {
  return [
    `# ${NPM_NAME} ${version}`,
    "",
    "The sdd CLI and the sdd MCP server of the Architect spec-driven workflow, for the targets other than",
    "Claude Code (OpenCode, GitHub Copilot). The Claude Code plugin carries its own copy of the CLI.",
    "",
    "Requirements: Node.js 20 or later.",
    "",
    "```text",
    `npm install -g ${NPM_NAME}@${version}`,
    "```",
    "",
    "Executables:",
    "",
    "- `sdd <command> …` — the sdd CLI (`sdd --version`, `sdd status`, `sdd template show <profile>/<path>`, …).",
    "- `sdd-mcp --profile files|shell [--root <dir>]` — the sdd MCP server over standard input and output.",
    "",
    "The package also ships the artifact templates (`templates/`) and Serena's read-only mode file",
    "(`serena/architect-read-only.yml`).",
    "",
    `Full guide: the README of the Architect repository, ${REPOSITORY_URL}`,
    "",
  ].join("\n");
}

/**
 * Stages `dist/npm/architect-sdd/` (C002-IF-003 §1, C002-ADR-004) from repository `root` into `stage`:
 * manifest, byte copies of the two bundles, the templates with their CLI lines translated, the Serena
 * read-only mode file, LICENSE, the union notices and README.md. Writes only under `stage`. Returns the
 * ERR-BLD-002 messages of the template scan (empty when clean).
 */
export function stageNpm(root, stage, version) {
  const plugin = join(root, "plugins", "architect");
  const npmBuild = join(root, "build", "npm");
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(join(stage, "scripts"), { recursive: true });
  writeFileSync(join(stage, "package.json"), npmManifestText(version));
  copyFileSync(join(plugin, "scripts", "sdd.mjs"), join(stage, "scripts", "sdd.mjs"));
  copyFileSync(join(npmBuild, "sdd-mcp.mjs"), join(stage, "scripts", "sdd-mcp.mjs"));
  cpSync(join(plugin, "templates"), join(stage, "templates"), { recursive: true });
  mkdirSync(join(stage, "serena"));
  copyFileSync(join(plugin, "serena", "architect-read-only.yml"), join(stage, "serena", "architect-read-only.yml"));
  copyFileSync(join(root, "LICENSE"), join(stage, "LICENSE"));
  copyFileSync(join(npmBuild, "THIRD_PARTY_NOTICES.md"), join(stage, "THIRD_PARTY_NOTICES.md"));
  writeFileSync(join(stage, "README.md"), npmReadme(version));
  return translateAndScanTemplates(join(stage, "templates"));
}

/**
 * npm's JavaScript entry (C002-ADR-004): `npm_execpath` under `npm run`, else
 * `node_modules/npm/bin/npm-cli.js` beside the Node executable (`lib/node_modules/…` one level up on
 * POSIX installs). Throws naming the places looked at when none exists; there is no shell fallback.
 */
export function npmCli(env = process.env, node = process.execPath) {
  const tried = [];
  if (env.npm_execpath) {
    if (/npm-cli\.js$/.test(env.npm_execpath) && existsSync(env.npm_execpath)) return env.npm_execpath;
    tried.push(`npm_execpath (${env.npm_execpath})`);
  } else tried.push("npm_execpath (not set)");
  for (const p of [join(dirname(node), "node_modules", "npm", "bin", "npm-cli.js"), join(dirname(node), "..", "lib", "node_modules", "npm", "bin", "npm-cli.js")]) {
    if (existsSync(p)) return p;
    tried.push(p);
  }
  throw new Error(`npm's JavaScript entry not found; looked at: ${tried.join(", ")}`);
}

/** Runs `npm pack <stage> --pack-destination <dest>` through Node (no shell); returns the tarball path. */
export function packNpm(stage, dest) {
  mkdirSync(dest, { recursive: true });
  const out = execFileSync(process.execPath, [npmCli(), "pack", stage, "--pack-destination", dest, "--json", "--no-update-notifier"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const [{ filename }] = JSON.parse(out);
  const tgz = join(dest, filename);
  if (!existsSync(tgz)) throw new Error(`${tgz} not produced`);
  return tgz;
}

/** Zips the content of `dir` into `out` (entries relative to it, dot-folders included, "/" separators); throws on failure. */
export function zipDir(dir, out) {
  rmSync(out, { force: true });
  const entries = readdirSync(dir);
  // Windows' own bsdtar writes standard zip entries; Windows PowerShell's Compress-Archive writes "\"
  // separators that other tools mis-read.
  const [cmd, args] =
    process.platform === "win32"
      ? [join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe"), ["-a", "-c", "-f", out, ...entries]]
      : ["zip", ["-qr", out, ...entries]];
  const r = spawnSync(cmd, args, { cwd: dir, stdio: "inherit" });
  if (r.error) throw r.error;
  if (r.status !== 0 || !existsSync(out)) throw new Error(`${out} not produced`);
}

/** The target packages the generator writes by default (one table each under plugins/architect/targets/). */
export const GENERATED_TARGETS = ["opencode", "copilot"];

/** File name of a target package's zip in dist/ (C002-REQ-101, Q-release-01). */
export function targetZipName(target, version) {
  return `architect-${target}-${version}.zip`;
}

/**
 * Generator step of `npm run package` (C002-T-034): removes the previous run's target zips, runs
 * `scripts/generate.mjs` of `root` as a child process (no shell) and, when it exits 0, zips each
 * `<dist>/<target>/` (folder content at the zip root, generation manifest included) to
 * `<dist>/architect-<target>-<version>.zip`. `source` (a fixture plugin) and a `dist` other than
 * `<root>/dist` are passed as `--source` and `--out`; packaging itself uses the defaults (C002-IF-004).
 * Returns the generator's exit code and, with `stdio: "pipe"`, its output; `zips` is empty on failure.
 * Throws when a zip is not produced.
 * @param {{ root: string, dist?: string, version: string, source?: string, stdio?: "inherit" | "pipe" }} options
 * @returns {{ code: number, stdout: string, stderr: string, zips: string[] }}
 */
export function packageTargets({ root, dist = join(root, "dist"), version, source, stdio = "inherit" }) {
  const zips = GENERATED_TARGETS.map((t) => join(dist, targetZipName(t, version)));
  for (const z of zips) rmSync(z, { force: true });
  const args = [join(root, "scripts", "generate.mjs")];
  if (source) args.push("--source", source);
  if (dist !== join(root, "dist")) args.push("--out", dist);
  let stdout = "";
  try {
    stdout = execFileSync(process.execPath, args, { cwd: root, encoding: "utf8", stdio: stdio === "pipe" ? ["ignore", "pipe", "pipe"] : "inherit" }) ?? "";
  } catch (e) {
    if (typeof e?.status !== "number" && e?.signal == null) throw e;
    return { code: e.status || 3, stdout: e.stdout ?? "", stderr: e.stderr ?? "", zips: [] };
  }
  GENERATED_TARGETS.forEach((t, i) => zipDir(join(dist, t), zips[i]));
  return { code: 0, stdout, stderr: "", zips };
}

// Script entry only: bundled into a test, import.meta.url is the test file, so match the file name too.
if (fileURLToPath(import.meta.url) === process.argv[1] && /[\\/]scripts[\\/]package\.mjs$/.test(process.argv[1] ?? "")) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const { version } = JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8"));
  const name = `architect-${version}`;
  const dist = join(root, "dist");
  const stage = join(dist, name);
  const zip = join(dist, `${name}.zip`);
  const claude = process.env.CLAUDE_CODE_EXECPATH || "claude";

  const step = (title, cmd, args, opts = {}) => {
    console.log(`\n=== ${title} ===`);
    const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", ...opts });
    if (r.error && opts.optional) {
      console.log(`skipped: ${cmd} not found`);
      return;
    }
    if (r.status !== 0) {
      console.error(`package failed at: ${title}`);
      process.exit(1);
    }
  };
  const zipStep = (title, dir, out) => {
    console.log(`\n=== ${title} ===`);
    try {
      zipDir(dir, out);
    } catch (e) {
      console.error(`package failed at: ${title} (${e instanceof Error ? e.message : e})`);
      process.exit(1);
    }
  };

  step("build", process.execPath, [join(root, "scripts", "build.mjs")]);
  step("plugin structure checks", process.execPath, [join(root, "scripts", "check", "run.mjs")]);

  console.log(`\n=== stage ${name} ===`);
  rmSync(zip, { force: true });
  stageMarketplace(root, stage, version);

  step("claude plugin validate (plugin)", claude, ["plugin", "validate", join(stage, "plugins", "architect")], { optional: true });
  step("claude plugin validate (marketplace)", claude, ["plugin", "validate", stage], { optional: true });

  // Plugin archive for upload UIs: .claude-plugin/plugin.json at the archive root.
  zipStep("zip plugin (upload)", join(stage, "plugins", "architect"), join(dist, `${name}-plugin.zip`));
  // Marketplace archive for `/plugin marketplace add <extracted folder>`.
  zipStep("zip marketplace", stage, zip);

  // Target packages (C002-T-034): the generator with its defaults (out dist/), then one zip per target.
  // The previous run's tarball goes first, so that a generator failure leaves none.
  const tgzName = `${NPM_NAME}-${version}.tgz`;
  rmSync(join(dist, tgzName), { force: true });
  console.log("\n=== generate target packages ===");
  let targets;
  try {
    targets = packageTargets({ root, version });
  } catch (e) {
    console.error(`package failed at: zip target packages (${e instanceof Error ? e.message : e})`);
    process.exit(1);
  }
  if (targets.code !== 0) {
    console.error(`package failed at: generate target packages (exit ${targets.code})`);
    process.exit(targets.code);
  }

  // architect-sdd: staging, template CLI lines and their scan, npm pack (C002-T-022).
  console.log(`\n=== stage npm/${NPM_NAME} ===`);
  const npmStage = join(dist, "npm", NPM_NAME);
  const scan = stageNpm(root, npmStage, version);
  if (scan.length > 0) {
    for (const line of scan) console.error(line);
    console.error(`package failed at: stage npm/${NPM_NAME}`);
    process.exit(1);
  }
  console.log(`\n=== npm pack ${NPM_NAME} ===`);
  try {
    packNpm(npmStage, dist);
  } catch (e) {
    console.error(`package failed at: npm pack (${e instanceof Error ? e.message : e})`);
    process.exit(1);
  }
  console.log(
    `\npackaged:\n  dist/${name}-plugin.zip   plugin archive (upload in Claude: .claude-plugin/plugin.json at its root)\n  dist/${name}.zip          marketplace archive (extract, then /plugin marketplace add <folder>)\n  dist/${name}/             the marketplace folder, unzipped\n${GENERATED_TARGETS.map((t) => `  dist/${targetZipName(t, version)}  ${t} target package (dist/${t}/, zipped)\n`).join("")}  dist/${tgzName}      npm package (publish by hand: npm publish dist/${tgzName})\n  dist/npm/${NPM_NAME}/      its staging folder`,
  );
}
