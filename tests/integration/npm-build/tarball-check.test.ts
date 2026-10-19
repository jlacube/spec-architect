// Tarball check of architect-sdd (C002-T-023): TGT-NPM-001 over the rules of C002-IF-003 §1 and §2, and
// the SPDX header scan of C002-NFR-801, on the fx-tgz tarball and on mutated copies of its entries.
//   C002-NFR-402 / C002-DOD-017   0 dependencies, 0 runtime imports outside bundled code and Node.js built-ins
//   C002-NFR-801 / C002-DOD-020   0 files or bundled packages outside the license allowlist
//   C002-TS-417 (manifest part)   bin sdd and sdd-mcp, separate bundled entries
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bundleImports, checkTarball, NPM_CODE, spdxFindings, SPDX_CODE } from "../../../scripts/check/tarball.mjs";
import { cleanupFxTgz, fxTgz } from "../../fixtures/fx-tgz.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const plugin = join(root, "plugins", "architect");
const licenseText = readFileSync(join(root, "LICENSE"), "utf8");
const fx = fxTgz();
after(() => cleanupFxTgz());

type Finding = { code: string; path: string; line: number | null; message: string };
const check = (entries: Map<string, Buffer>) => checkTarball(entries, { plugin, licenseText }) as Promise<{ npm: Finding[]; spdx: Finding[] }>;
const mutate = (fn: (m: Map<string, Buffer>) => void) => {
  const m = new Map(fx.entries);
  fn(m);
  return m;
};
const manifest = (fn: (pkg: Record<string, unknown>) => void) =>
  mutate((m) => {
    const pkg = JSON.parse(m.get("package/package.json")!.toString("utf8")) as Record<string, unknown>;
    fn(pkg);
    m.set("package/package.json", Buffer.from(JSON.stringify(pkg, null, 2)));
  });
const messages = (fs: Finding[]) => fs.map((f) => `${f.path}${f.line ? `:${f.line}` : ""} — ${f.message}`);

test("TGT-NPM-001 and the SPDX scan: the packed tarball has 0 findings", async () => {
  const r = await check(fx.entries);
  assert.deepEqual(messages(r.npm), []);
  assert.deepEqual(messages(r.spdx), []);
});

test("C002-NFR-402: a dependencies entry, an install script or another engines value is a TGT-NPM-001 finding", async () => {
  const r = await check(
    manifest((p) => {
      p.dependencies = { yaml: "^2.9.1" };
      p.peerDependencies = { zod: "*" };
      p.scripts = { postinstall: "node x.js" };
      p.engines = { node: ">=18" };
      p.name = "@jlacube/architect-sdd";
    }),
  );
  const m = messages(r.npm).join("\n");
  for (const re of [/dependencies present \(1 entries\)/, /peerDependencies present/, /scripts field present \(postinstall\)/, /engines\.node is ">=18"/, /name is "@jlacube\/architect-sdd"/]) assert.match(m, re);
  assert.ok(r.npm.every((f) => f.code === NPM_CODE && f.path === "package.json"));
});

test("TGT-NPM-001: bin, version and files rules of C002-IF-003 §2", async () => {
  const r = await check(
    manifest((p) => {
      p.bin = { sdd: "scripts/sdd.mjs" };
      p.version = "9.9.9";
      p.files = ["scripts/"];
    }),
  );
  const m = messages(r.npm).join("\n");
  assert.match(m, /bin is \{"sdd":"scripts\/sdd\.mjs"\}/);
  assert.match(m, /version "9\.9\.9" differs from plugin\.json version/);
  assert.match(m, /files is \["scripts\/"\]/);
});

test("C002-NFR-402: an entry importing a package at run time (import, require or dynamic import) is a finding; strings are not imports", async () => {
  const src = fx.entries.get("package/scripts/sdd-mcp.mjs")!.toString("utf8");
  const planted = src.replace(
    'import { createRequire as __sddCreateRequire } from "node:module";',
    'import { createRequire as __sddCreateRequire } from "node:module";\nimport left from "left-pad";\nconst lazy = () => import("chalk");\nconst r = __require("lodash");\nconst s = \'require("not-an-import")\';',
  );
  assert.notEqual(planted, src);
  const r = await check(mutate((m) => m.set("package/scripts/sdd-mcp.mjs", Buffer.from(planted))));
  const m = messages(r.npm);
  assert.deepEqual(
    m.filter((x) => x.includes("runtime import")),
    ["left-pad (import-statement)", "chalk (dynamic-import)", "lodash (require-call)"].map((x) => {
      const [name, kind] = x.split(" ");
      return `scripts/sdd-mcp.mjs — entry sdd-mcp: runtime import of "${name}" ${kind} is neither bundled nor a Node.js built-in`;
    }),
  );
  // The shipped bundles import only built-ins (ajv's code-generation strings `require("ajv/…")` are text).
  for (const bin of ["sdd", "sdd-mcp"]) {
    const imports = (await bundleImports(fx.entries.get(`package/scripts/${bin}.mjs`)!.toString("utf8"))) as { path: string }[];
    assert.ok(imports.length > 0, bin);
    assert.ok(imports.every((i) => i.path.startsWith("node:") || ["buffer", "process"].includes(i.path)), JSON.stringify(imports));
  }
});

test("TGT-NPM-001: layout of C002-IF-003 §1 — missing template, extra file, node_modules folder", async () => {
  const r = await check(
    mutate((m) => {
      m.delete("package/templates/lite/20-plan/plan.md");
      m.set("package/extra.txt", Buffer.from("x"));
      m.set("package/node_modules/yaml/package.json", Buffer.from("{}"));
    }),
  );
  const m = messages(r.npm);
  assert.ok(m.includes("templates/lite/20-plan/plan.md — missing from the tarball"), m.join("\n"));
  assert.ok(m.includes("extra.txt — not part of the package layout"), m.join("\n"));
  assert.ok(m.includes("node_modules/yaml/package.json — bundled node_modules folder in the tarball"), m.join("\n"));
});

test("TGT-NPM-001: a template changed beyond the CLI lines, or with a plugin path of the CLI left, is a finding", async () => {
  const name = "package/templates/full/20-plan/handoff.md";
  const staged = fx.entries.get(name)!.toString("utf8");
  const r = await check(mutate((m) => m.set(name, Buffer.from(staged + "\nRun node ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs status\n"))));
  const m = messages(r.npm).join("\n");
  assert.match(m, /templates\/full\/20-plan\/handoff\.md — differs from the source template other than by the translated CLI lines/);
  assert.match(m, /templates\/full\/20-plan\/handoff\.md:\d+ — plugin path of the CLI "\$\{CLAUDE_PLUGIN_ROOT\}"/);
});

test("C002-REQ-413 / C002-REQ-414: notices — a disallowed license, a bundled package not listed, a listed package not bundled", async () => {
  const name = "package/THIRD_PARTY_NOTICES.md";
  const notices = fx.entries.get(name)!.toString("utf8");
  const changed = notices.replace(/^### yaml (\S+) — ISC$/m, "### yaml $1 — GPL-3.0").replace(/^### zod .*$/m, "### left-pad 1.3.0 — MIT");
  assert.notEqual(changed, notices);
  const r = await check(mutate((m) => m.set(name, Buffer.from(changed))));
  const m = messages(r.npm).join("\n");
  assert.match(m, /bundled package license not allowed: yaml@\S+ \(GPL-3\.0\)/);
  assert.match(m, /bundled package zod is not listed/);
  assert.match(m, /lists left-pad, which neither entry bundles/);
});

test("TGT-NPM-001: LICENSE must hold the MIT license", async () => {
  const r = await check(mutate((m) => m.set("package/LICENSE", Buffer.from("Apache License\nVersion 2.0\n"))));
  assert.deepEqual(messages(r.npm), ["LICENSE:1 — does not hold the MIT license"]);
});

test("C002-NFR-801: the SPDX header scan reports a header or @license tag outside the allowlist; OR expressions pass on one side", () => {
  const text = [
    "// SPDX-License-Identifier: MIT",
    "/* SPDX-License-Identifier: GPL-3.0-only */",
    "# SPDX-License-Identifier: (MIT OR GPL-2.0)",
    " * @license AGPL-3.0",
    " * @license Apache-2.0",
    "<!-- SPDX-License-Identifier: LGPL-2.1 -->",
  ].join("\n");
  const f = spdxFindings("x/file.js", Buffer.from(text)) as Finding[];
  assert.deepEqual(
    f.map((x) => `${x.code} ${x.line} ${x.message.split(" (")[0]}`),
    [`${SPDX_CODE} 2 license not allowed: GPL-3.0-only`, `${SPDX_CODE} 4 license not allowed: AGPL-3.0`, `${SPDX_CODE} 6 license not allowed: LGPL-2.1`],
  );
  assert.deepEqual(spdxFindings("x/bin", Buffer.from([0, 1, 2])), []);
});

test("tarball check command line: 0 findings and exit 0 on the packed tarball; exit 2 on an internal error", () => {
  const ok = spawnSync(process.execPath, [join(root, "scripts", "check", "tarball.mjs"), fx.tgz], { cwd: root, encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /tarball check: .* \(\d+ files\): TGT-NPM-001 0 errors/);
  assert.match(ok.stdout, /SPDX header scan: .*: 0 errors/);
  const bad = spawnSync(process.execPath, [join(root, "scripts", "check", "tarball.mjs"), fx.tgz, "--plugin", join(root, "tests", "missing-plugin")], { cwd: root, encoding: "utf8" });
  assert.equal(bad.status, 2, bad.stdout + bad.stderr);
  assert.match(bad.stderr, /tarball check: internal error/);
});
