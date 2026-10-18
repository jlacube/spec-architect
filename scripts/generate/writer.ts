// Writer (C002-COMP-001): stages every selected target package in `<out>/.staging-<target>/`, then
// replaces each `<out>/<target>/` by its staged folder. A run publishes all selected packages or none
// (C002-INV-02): on any write or rename error, the selected `<out>/<target>/` folders, those already
// replaced included, and every staging folder are removed (ERR-GEN-010). Output is byte-deterministic
// (C002-NFR-301): files in byte order of path, LF line endings, manifest without time stamp or machine path.
import { createHash } from "node:crypto";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { diagnostic, type Diagnostic } from "./diagnostics.ts";
import type { TargetPackage } from "./model.ts";
import type { Target } from "./tables.ts";

/** The generation manifest of every package (C002-IF-004 §Output). */
export const MANIFEST = "architect-target.json";

/** The file system operations of the writer; tests replace one to plant a write error. */
export interface WriteOps {
  mkdir(path: string): void;
  writeFile(path: string, data: Buffer): void;
  rename(from: string, to: string): void;
  rm(path: string): void;
}

export const fsOps: WriteOps = {
  mkdir: (p) => void mkdirSync(p, { recursive: true }),
  writeFile: (p, d) => writeFileSync(p, d),
  rename: (a, b) => renameSync(a, b),
  rm: (p) => rmSync(p, { recursive: true, force: true, maxRetries: 3 }),
};

const byteOrder = (a: string, b: string) => Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
const sha256 = (data: Buffer) => createHash("sha256").update(data).digest("hex");

/** LF line endings only. */
export function lf(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/**
 * JSON with keys sorted at every level, two-space indent and a final LF: for emitted JSON files. A `Map`
 * is written as an object in its insertion order instead: the rule maps whose order the host evaluates
 * (OpenCode `permission.bash` and `permission.edit`, last matching rule wins), still deterministic.
 */
export function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : v instanceof Map
        ? Object.fromEntries([...v.entries()].map(([k, x]) => [String(k), sort(x)]))
        : v !== null && typeof v === "object"
        ? Object.fromEntries(Object.keys(v as object).sort(byteOrder).map((k) => [k, sort((v as Record<string, unknown>)[k])]))
        : v;
  return JSON.stringify(sort(value), null, 2) + "\n";
}

export const stagingDir = (out: string, target: Target) => join(out, `.staging-${target}`);
export const targetDir = (out: string, target: Target) => join(out, target);

/** A package path must be relative, `/`-separated and stay inside the package. */
function checkPath(target: Target, path: string): void {
  if (path === "" || path.startsWith("/") || path.includes("\\") || /^[A-Za-z]:/.test(path) || path.split("/").some((s) => s === "" || s === "." || s === ".."))
    throw new Error(`${target}: invalid package path "${path}"`);
  if (path === MANIFEST) throw new Error(`${target}: "${MANIFEST}" is written by the writer, not by an emitter`);
}

/**
 * Every file of a package as written: the emitter's files (text with LF, bytes as given) in byte order of path, then the
 * manifest, whose key order is that of C002-IF-004 and whose `files` lists every other file.
 */
export function packageFiles(pkg: TargetPackage, sourceDigest: string, version: string): [string, Buffer][] {
  const files = [...pkg.files]
    .map(([path, text]) => {
      checkPath(pkg.target, path);
      // Bytes (the CLI copy, C002-ADR-004) are written unchanged; text gets LF line endings.
      return [path, Buffer.isBuffer(text) ? text : Buffer.from(lf(text), "utf8")] as [string, Buffer];
    })
    .sort(([a], [b]) => byteOrder(a, b));
  const manifest = {
    target: pkg.target,
    package_version: version,
    enforcement_mode: pkg.mode,
    mode_source: pkg.modeSource,
    table_schema_version: pkg.table.schema_version,
    tested_versions: Object.fromEntries(Object.entries(pkg.table.host.tested_versions).sort(([a], [b]) => byteOrder(a, b))),
    source_digest: sourceDigest,
    files: files.map(([path, data]) => ({ path, sha256: sha256(data) })),
  };
  return [...files, [MANIFEST, Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8")]];
}

/** Removes `<out>/<target>/` and `<out>/.staging-<target>/` of every target given; returns the failures. */
export function discard(out: string, targets: readonly Target[], ops: WriteOps = fsOps): string[] {
  const failed: string[] = [];
  for (const t of targets)
    for (const dir of [targetDir(out, t), stagingDir(out, t)]) {
      try {
        ops.rm(dir);
      } catch {
        failed.push(dir);
      }
    }
  return failed;
}

export type PublishResult = { ok: true; files: Record<string, number> } | { ok: false; diagnostic: Diagnostic };

/**
 * Stages and publishes every package, all or none. `targets` is every selected target (each must have
 * a package); `display` turns a path into the form printed in messages.
 */
export function publish(
  out: string,
  packages: readonly TargetPackage[],
  sourceDigest: string,
  version: string,
  ops: WriteOps = fsOps,
  display: (p: string) => string = (p) => p,
): PublishResult {
  const targets = packages.map((p) => p.target);
  // Built in memory first (C002-IF-004 run semantics, step 1); an invalid emitter path throws here.
  const built = packages.map((pkg) => ({ pkg, files: packageFiles(pkg, sourceDigest, version) }));
  let at = out;
  let target: Target | undefined;
  try {
    const counts: Record<string, number> = {};
    // 1. Stage every package; no `<out>/<target>/` is touched yet.
    for (const { pkg, files } of built) {
      target = pkg.target;
      const staging = stagingDir(out, pkg.target);
      at = staging;
      ops.rm(staging);
      ops.mkdir(staging);
      for (const [path, data] of files) {
        at = join(staging, ...path.split("/"));
        ops.mkdir(dirname(at));
        ops.writeFile(at, data);
      }
      counts[pkg.target] = files.length;
    }
    // 2. Replace each old package by its staged folder.
    for (const pkg of packages) {
      target = pkg.target;
      at = targetDir(out, pkg.target);
      ops.rm(at);
      ops.rename(stagingDir(out, pkg.target), at);
    }
    return { ok: true, files: counts };
  } catch (e) {
    discard(out, targets, ops);
    const why = e instanceof Error ? ((e as NodeJS.ErrnoException).code ?? e.message) : String(e);
    return {
      ok: false,
      diagnostic: diagnostic("ERR-GEN-010", `could not write ${display(at)}: ${why}; no target package was kept`, target === undefined ? {} : { target }),
    };
  }
}
