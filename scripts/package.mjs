// `npm run package`: a self-contained, installable copy of the plugin in dist/.
//   dist/architect-<version>/        marketplace folder: .claude-plugin/marketplace.json, plugins/architect/, INSTALL.md
//   dist/architect-<version>.zip     the same folder, zipped
//   dist/architect-<version>-plugin.zip  the plugin alone (.claude-plugin/plugin.json at the root), for upload UIs
// Steps: build (bundle, license allowlist, notices), plugin structure checks, `claude plugin validate`
// on the staged plugin and marketplace (skipped when Claude Code is not found), then stage and zip.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8"));
const name = `architect-${version}`;
const dist = join(root, "dist");
const stage = join(dist, name);
const zip = join(dist, `${name}.zip`);
const claude = process.env.CLAUDE_CODE_EXECPATH || "claude";

function step(title, cmd, args, opts = {}) {
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
}

step("build", process.execPath, [join(root, "scripts", "build.mjs")]);
step("plugin structure checks", process.execPath, [join(root, "scripts", "check", "run.mjs")]);

console.log(`\n=== stage ${name} ===`);
rmSync(stage, { recursive: true, force: true });
rmSync(zip, { force: true });
mkdirSync(join(stage, ".claude-plugin"), { recursive: true });
cpSync(join(root, ".claude-plugin", "marketplace.json"), join(stage, ".claude-plugin", "marketplace.json"));
cpSync(join(root, "plugins", "architect"), join(stage, "plugins", "architect"), { recursive: true });
writeFileSync(
  join(stage, "INSTALL.md"),
  [
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
  ].join("\n"),
);

step("claude plugin validate (plugin)", claude, ["plugin", "validate", join(stage, "plugins", "architect")], { optional: true });
step("claude plugin validate (marketplace)", claude, ["plugin", "validate", stage], { optional: true });

/** Zips the content of `dir` (entries relative to it, dot-folders included, "/" separators). */
function zipDir(title, dir, out) {
  const entries = readdirSync(dir);
  if (process.platform === "win32") {
    // Windows' own bsdtar writes standard zip entries; Windows PowerShell's Compress-Archive writes "\"
    // separators that other tools mis-read.
    const tar = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
    step(title, tar, ["-a", "-c", "-f", out, ...entries], { cwd: dir });
  } else {
    step(title, "zip", ["-qr", out, ...entries], { cwd: dir });
  }
  if (!existsSync(out)) {
    console.error(`package failed: ${out} not produced`);
    process.exit(1);
  }
}

// Plugin archive for upload UIs: .claude-plugin/plugin.json at the archive root.
const pluginZip = join(dist, `${name}-plugin.zip`);
rmSync(pluginZip, { force: true });
zipDir("zip plugin (upload)", join(stage, "plugins", "architect"), pluginZip);
// Marketplace archive for `/plugin marketplace add <extracted folder>`.
zipDir("zip marketplace", stage, zip);
console.log(`\npackaged:\n  dist/${name}-plugin.zip   plugin archive (upload in Claude: .claude-plugin/plugin.json at its root)\n  dist/${name}.zip          marketplace archive (extract, then /plugin marketplace add <folder>)\n  dist/${name}/             the marketplace folder, unzipped`);
