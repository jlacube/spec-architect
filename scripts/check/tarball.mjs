// Tarball check of `architect-sdd` (C002-T-023): the manifest check TGT-NPM-001 (C002-IF-005 §6) over the
// rules of C002-IF-003 §1 and §2 on the packed tarball, and the SPDX header scan of C002-NFR-801.
//   node scripts/check/tarball.mjs [<tgz>] [--spdx <dir>]… [--plugin <dir>] [--json]
// With no <tgz>, the package is staged from this repository's build outputs and packed into a fresh
// temporary folder (as `npm run package` does, never touching dist/), checked and removed: the step
// `tarball` of `npm run check` (C002-COMP-007). `--spdx <dir>` adds a folder to the SPDX header scan
// (for example dist/opencode and dist/copilot, C002-DOD-020). Exit 1 on any finding, 2 on an internal error.
//
// TGT-NPM-001 findings: manifest fields (name, version = plugin.json version, bin, no dependencies of
// any kind, no scripts, engines, type, license, files), the file layout of §1, the two entries (shebang
// first; every runtime import a Node.js built-in, C002-NFR-402, C002-CON-11), LICENSE, the notices (every
// package bundled into either entry listed, each with an allowlisted license, C002-REQ-413, C002-REQ-414),
// the templates and the Serena mode file (byte copies of the source plugin's, except the translated CLI
// lines; no plugin path of the CLI left, C002-REQ-512, C002-REQ-518, C002-REQ-519).
// C002-NFR-801 findings: a file whose SPDX-License-Identifier (or `@license <id>`) names a license
// outside the allowlist of C001-REQ-1114.
import { build } from "esbuild";
import { mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { builtinModules } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { ALLOWED, disallowed } from "../licenses.mjs";
import { scanCliPaths, translateCliLines } from "../template-cli-lines.mjs";

export const NPM_CODE = "TGT-NPM-001";
export const SPDX_CODE = "C002-NFR-801";
const NAME = "architect-sdd";
const ENTRIES = { sdd: "scripts/sdd.mjs", "sdd-mcp": "scripts/sdd-mcp.mjs" };
const FILES = ["scripts/sdd.mjs", "scripts/sdd-mcp.mjs", "templates/", "serena/", "THIRD_PARTY_NOTICES.md"];
const FIXED = ["package.json", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "scripts/sdd.mjs", "scripts/sdd-mcp.mjs", "serena/architect-read-only.yml"];
// The banner of scripts/build.mjs: `require` is bound to createRequire, which hides require calls from
// esbuild's scan; the check unbinds it (and esbuild's own `__require` shim) before scanning.
const REQUIRE_BANNER = "const require = __sddCreateRequire(import.meta.url);";

/** Entries of a gzipped tar archive (ustar, with pax `path` records), by name. */
export function readTgz(path) {
  const buf = gunzipSync(readFileSync(path));
  const out = new Map();
  let p = 0;
  let paxPath = null;
  while (p + 512 <= buf.length) {
    const header = buf.subarray(p, p + 512);
    if (header.every((b) => b === 0)) break;
    const str = (o, n) => header.toString("utf8", o, o + n).replace(/\0.*$/s, "");
    const size = parseInt(str(124, 12).trim() || "0", 8);
    const type = str(156, 1) || "0";
    const prefix = str(345, 155);
    const name = paxPath ?? (prefix ? `${prefix}/${str(0, 100)}` : str(0, 100));
    const body = buf.subarray(p + 512, p + 512 + size);
    p += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") {
      const m = /\d+ path=([^\n]*)\n/.exec(body.toString("utf8"));
      paxPath = m ? m[1] : null;
      continue;
    }
    paxPath = null;
    if (type === "0" || type === "\0") out.set(name, Buffer.from(body));
  }
  return out;
}

/** Files under `dir`, relative with `/` separators, with their bytes. */
export function readDir(dir) {
  const out = new Map();
  const walk = (abs, rel) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out.set(r, readFileSync(p));
    }
  };
  walk(dir, "");
  return out;
}

const finding = (code, path, line, message) => ({ code, path, line, message });
const isBuiltin = (spec) => spec.startsWith("node:") || builtinModules.includes(spec) || builtinModules.includes(spec.split("/")[0]);

/**
 * Module specifiers that a bundle imports at run time, from esbuild's parser (strings and comments are
 * not imports): [{ kind, path }]. Every import is marked external, so nothing is resolved.
 */
export async function bundleImports(source) {
  const contents = source.replace(REQUIRE_BANNER, "").replace(/\b__require\(/g, "require(");
  const found = [];
  await build({
    stdin: { contents, resolveDir: tmpdir(), sourcefile: "entry.mjs", loader: "js" },
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    logLevel: "silent",
    plugins: [
      {
        name: "record-imports",
        setup(b) {
          b.onResolve({ filter: /.*/ }, (a) => {
            found.push({ kind: a.kind, path: a.path });
            return { path: a.path, external: true };
          });
        },
      },
    ],
  });
  const seen = new Set();
  return found.filter((f) => !seen.has(`${f.kind} ${f.path}`) && seen.add(`${f.kind} ${f.path}`));
}

/** Packages whose modules esbuild bundled into `source` (its `// node_modules/<package>/…` path comments). */
export function bundledPackageNames(source) {
  const out = new Set();
  for (const m of source.matchAll(/^\/\/ node_modules\/((?:@[^/\s]+\/)?[^/\s]+)\//gm)) out.add(m[1]);
  return out;
}

/** `### <name> <version> — <license>` headings of THIRD_PARTY_NOTICES.md: [{ name, version, license, line }]. */
export function noticePackages(text) {
  const out = [];
  text.split("\n").forEach((l, i) => {
    const m = /^### (\S+) (\S+) — (.+?)\s*$/.exec(l);
    if (m) out.push({ name: m[1], version: m[2], license: m[3], line: i + 1 });
  });
  return out;
}

/** SPDX findings of one file: each SPDX-License-Identifier or `@license <id>` outside the allowlist. */
export function spdxFindings(path, bytes, code = SPDX_CODE) {
  if (bytes.includes(0)) return []; // binary
  const out = [];
  bytes
    .toString("utf8")
    .split("\n")
    .forEach((l, i) => {
      const exprs = [];
      for (const m of l.matchAll(/SPDX-License-Identifier:\s*([A-Za-z0-9.+\-() ]+?)\s*(?:\*\/|-->|$)/g)) exprs.push(m[1]);
      for (const m of l.matchAll(/@license\s+([A-Za-z0-9][A-Za-z0-9.+-]*)/g)) exprs.push(m[1]);
      for (const e of exprs) if (disallowed([{ license: e }]).length > 0) out.push(finding(code, path, i + 1, `license not allowed: ${e} (allowlist: ${ALLOWED.join(", ")})`));
    });
  return out;
}

/** Files under the source plugin's templates/, relative with `/` separators. */
function templateFiles(plugin) {
  return [...readDir(join(plugin, "templates")).keys()];
}

/**
 * TGT-NPM-001 and the SPDX scan on tarball `entries` (names `package/…`). `plugin` is the source plugin
 * (version, templates and Serena mode file); `licenseText` the repository's LICENSE (optional).
 * @returns {Promise<{ npm: object[], spdx: object[] }>}
 */
export async function checkTarball(entries, { plugin, licenseText }) {
  const npm = [];
  const f = (path, line, message) => npm.push(finding(NPM_CODE, path, line, message));
  const files = new Map();
  for (const [name, bytes] of entries) {
    if (!name.startsWith("package/")) f(name, null, "entry outside the package/ root");
    else files.set(name.slice("package/".length), bytes);
  }
  const text = (p) => files.get(p)?.toString("utf8");
  const { version } = JSON.parse(readFileSync(join(plugin, ".claude-plugin", "plugin.json"), "utf8"));

  // §2 manifest.
  let pkg = null;
  try {
    pkg = JSON.parse(text("package.json") ?? "null");
  } catch (e) {
    f("package.json", null, `does not parse: ${e instanceof Error ? e.message : e}`);
  }
  if (pkg === null) f("package.json", null, "missing");
  else {
    if (pkg.name !== NAME) f("package.json", null, `name is ${JSON.stringify(pkg.name)}, want "${NAME}" without a scope`);
    if (pkg.version !== version) f("package.json", null, `version ${JSON.stringify(pkg.version)} differs from plugin.json version "${version}"`);
    if (JSON.stringify(pkg.bin) !== JSON.stringify(ENTRIES)) f("package.json", null, `bin is ${JSON.stringify(pkg.bin)}, want ${JSON.stringify(ENTRIES)}`);
    for (const k of ["dependencies", "optionalDependencies", "peerDependencies", "bundleDependencies", "bundledDependencies"]) {
      const v = pkg[k];
      if (v !== undefined) f("package.json", null, `${k} present (${Array.isArray(v) ? v.length : Object.keys(v ?? {}).length} entries); the package has no runtime dependency`);
    }
    if (pkg.scripts !== undefined) f("package.json", null, `scripts field present (${Object.keys(pkg.scripts ?? {}).join(", ")}); no install scripts allowed`);
    if (pkg.engines?.node !== ">=20") f("package.json", null, `engines.node is ${JSON.stringify(pkg.engines?.node)}, want ">=20"`);
    if (pkg.type !== "module") f("package.json", null, `type is ${JSON.stringify(pkg.type)}, want "module"`);
    if (pkg.license !== "MIT") f("package.json", null, `license is ${JSON.stringify(pkg.license)}, want "MIT"`);
    if (JSON.stringify(pkg.files) !== JSON.stringify(FILES)) f("package.json", null, `files is ${JSON.stringify(pkg.files)}, want ${JSON.stringify(FILES)}`);
  }

  // §1 layout.
  const sourceTemplates = templateFiles(plugin);
  const expected = new Set([...FIXED, ...sourceTemplates.map((t) => `templates/${t}`)]);
  for (const p of expected) if (!files.has(p)) f(p, null, "missing from the tarball");
  for (const p of files.keys()) if (!expected.has(p)) f(p, null, p.split("/").includes("node_modules") ? "bundled node_modules folder in the tarball" : "not part of the package layout");

  // Entries: shebang, runtime imports.
  const bundled = new Set();
  for (const [bin, p] of Object.entries(ENTRIES)) {
    const src = text(p);
    if (src === undefined) continue;
    if (!src.startsWith("#!/usr/bin/env node\n")) f(p, 1, `entry ${bin}: first line is not #!/usr/bin/env node`);
    let imports = [];
    try {
      imports = await bundleImports(src);
    } catch (e) {
      f(p, null, `entry ${bin}: does not parse: ${e instanceof Error ? e.message.split("\n")[0] : e}`);
    }
    for (const i of imports) if (!isBuiltin(i.path)) f(p, null, `entry ${bin}: runtime import of "${i.path}" (${i.kind}) is neither bundled nor a Node.js built-in`);
    for (const n of bundledPackageNames(src)) bundled.add(n);
  }

  // LICENSE and notices.
  const license = text("LICENSE");
  if (license !== undefined) {
    if (!/^MIT License\b/.test(license) || !license.includes("Permission is hereby granted, free of charge")) f("LICENSE", 1, "does not hold the MIT license");
    else if (licenseText !== undefined && license !== licenseText) f("LICENSE", null, "differs from the repository's LICENSE");
  }
  const notices = text("THIRD_PARTY_NOTICES.md");
  if (notices !== undefined) {
    const listed = noticePackages(notices);
    for (const p of listed) for (const d of disallowed([p])) f("THIRD_PARTY_NOTICES.md", p.line, `bundled package license not allowed: ${d.name}@${d.version} (${d.license})`);
    const names = new Set(listed.map((p) => p.name));
    for (const n of [...bundled].sort()) if (!names.has(n)) f("THIRD_PARTY_NOTICES.md", null, `bundled package ${n} is not listed`);
    for (const p of listed) if (!bundled.has(p.name)) f("THIRD_PARTY_NOTICES.md", p.line, `lists ${p.name}, which neither entry bundles`);
  }

  // Templates and the Serena mode file.
  for (const t of sourceTemplates) {
    const staged = files.get(`templates/${t}`);
    if (staged === undefined) continue;
    const src = readFileSync(join(plugin, "templates", ...t.split("/")));
    if (!staged.equals(src) && staged.toString("utf8") !== translateCliLines(src.toString("utf8"))) f(`templates/${t}`, null, "differs from the source template other than by the translated CLI lines");
    for (const s of scanCliPaths(staged.toString("utf8"))) f(`templates/${t}`, s.line, `plugin path of the CLI "${s.construct}"`);
  }
  const serena = files.get("serena/architect-read-only.yml");
  if (serena !== undefined && !serena.equals(readFileSync(join(plugin, "serena", "architect-read-only.yml")))) f("serena/architect-read-only.yml", null, "differs from the source mode file");

  // SPDX header scan of every file of the tarball.
  const spdx = [...files].flatMap(([p, b]) => spdxFindings(`${NAME}/${p}`, b));
  return { npm, spdx };
}

/** Print form of a finding (the target structure checks' form, with the package or folder in place of the target). */
export function format(f, where) {
  return `error ${f.code} ${where} ${f.line ? `${f.path}:${f.line}` : f.path} — ${f.message}`;
}

/** Stages and packs architect-sdd from `root` into a fresh temporary folder; returns { tgz, dir }. */
async function freshTarball(root) {
  const { packNpm, stageNpm } = await import("../package.mjs");
  const { version } = JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8"));
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-tgz-check-")));
  const stage = join(dir, "npm", NAME);
  const scan = stageNpm(root, stage, version);
  if (scan.length > 0) throw new Error(`staging failed:\n${scan.join("\n")}`);
  return { tgz: packNpm(stage, dir), dir };
}

/** Command line; returns the exit code. */
export async function cli(argv, root) {
  const opt = (name) => argv.flatMap((a, i) => (a === name && argv[i + 1] !== undefined ? [argv[i + 1]] : []));
  const valued = new Set(["--spdx", "--plugin"]);
  const positional = argv.filter((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1]));
  const plugin = opt("--plugin")[0] ?? join(root, "plugins", "architect");
  const started = Date.now();
  let fresh = null;
  try {
    let tgz = positional[0];
    if (!tgz) {
      fresh = await freshTarball(root);
      tgz = fresh.tgz;
    }
    const entries = readTgz(tgz);
    let licenseText;
    try {
      licenseText = readFileSync(join(root, "LICENSE"), "utf8");
    } catch {
      licenseText = undefined;
    }
    const { npm, spdx } = await checkTarball(entries, { plugin, licenseText });
    const dirs = opt("--spdx").map((d) => {
      const files = readDir(d);
      const rel = relative(root, d).split(sep).join("/") || ".";
      return { dir: rel, files: files.size, findings: [...files].flatMap(([p, b]) => spdxFindings(`${rel}/${p}`, b)) };
    });
    const all = [...npm, ...spdx, ...dirs.flatMap((d) => d.findings)];
    const shown = fresh ? `${NAME} (fresh pack)` : relative(root, tgz).split(sep).join("/") || tgz;
    if (argv.includes("--json")) console.log(JSON.stringify(all, null, 2));
    else for (const x of all) console.log(format(x, x.code === NPM_CODE ? NAME : "spdx"));
    const s = (n) => `${n} error${n === 1 ? "" : "s"}`;
    console.log(`tarball check: ${shown} (${entries.size} files): ${NPM_CODE} ${s(npm.length)}`);
    console.log(`SPDX header scan: ${shown} (${entries.size} files)${dirs.map((d) => `, ${d.dir}/ (${d.files} files)`).join("")}: ${s(spdx.length + dirs.reduce((n, d) => n + d.findings.length, 0))}`);
    console.log(`tarball check: ${((Date.now() - started) / 1000).toFixed(1)} s`);
    return all.length > 0 ? 1 : 0;
  } catch (e) {
    console.error(`tarball check: internal error: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
    return 2;
  } finally {
    if (fresh) rmSync(fresh.dir, { recursive: true, force: true });
  }
}

// Script entry only (a test bundling this module has another argv[1]).
if (/[\\/]scripts[\\/]check[\\/]tarball\.mjs$/.test(process.argv[1] ?? "") && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await cli(process.argv.slice(2), join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
}
