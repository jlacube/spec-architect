// Regeneration comparison of the release check (C002-IF-009 §5, C002-NFR-501, C002-CON-01): the
// target is generated again from the source plugin at the current commit with the table's mode (the
// generator modules of C002-IF-004, imported, never copied) into a temporary folder, and compared file
// by file with the package proposed for release, both the folder `dist/<target>/` and the zip
// `dist/architect-<target>-<version>.zip` that P-01 releases (Q-release-01). A missing, extra or
// different file in either is a regeneration difference (ERR-REL-007); a package whose manifest records
// an enforcement-mode override is ERR-REL-008.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main as generate } from "../generate/main.ts";
import type { Target } from "../generate/tables.ts";
import { MANIFEST } from "../generate/writer.ts";
import { readZip, ZipError } from "./zip.ts";

/** File name of a target package's zip in dist/ (C002-T-034; scripts/package.mjs targetZipName). */
export function targetZipName(target: string, version: string): string {
  return `architect-${target}-${version}.zip`;
}

/** Every file under `dir`, "/"-separated relative path to its bytes. */
export function readTree(dir: string): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  const walk = (abs: string, rel: string) => {
    for (const name of readdirSync(abs)) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out.set(r, readFileSync(p));
    }
  };
  walk(dir, "");
  return out;
}

/** Differences of `actual` from `expected`, each `<prefix><path> (missing|extra|different)`, sorted by path. */
export function treeDifferences(expected: Map<string, Buffer>, actual: Map<string, Buffer>, prefix: string): string[] {
  const paths = [...new Set([...expected.keys(), ...actual.keys()])].sort();
  const out: string[] = [];
  for (const p of paths) {
    const e = expected.get(p);
    const a = actual.get(p);
    if (a === undefined) out.push(`${prefix}${p} (missing)`);
    else if (e === undefined) out.push(`${prefix}${p} (extra)`);
    else if (!e.equals(a)) out.push(`${prefix}${p} (different)`);
  }
  return out;
}

export interface Regeneration {
  /** Every difference of the folder and of the zip from the regeneration; empty when both are identical. */
  differences: string[];
  /** The manifest's enforcement mode when the package was generated with `--mode` (ERR-REL-008), else null. */
  overrideMode: string | null;
}

/**
 * Regenerates `target` from `source` and compares it with `<dist>/<target>/` and the target zip.
 * `distLabel` is the repository-relative spelling of `dist` used in the difference texts.
 */
export function compareWithRegeneration(target: Target, version: string, source: string, dist: string, distLabel = "dist"): Regeneration {
  const tmp = mkdtempSync(join(tmpdir(), "sdd-release-regen-"));
  try {
    const errors: string[] = [];
    const code = generate(["--target", target, "--source", source, "--out", tmp, "--quiet"], { stdout: () => undefined, stderr: (l) => void errors.push(l) });
    if (code !== 0) return { differences: [`regeneration failed (generator exit ${code}${errors[0] !== undefined ? `: ${errors[0]}` : ""})`], overrideMode: null };
    const regen = readTree(join(tmp, target));
    const differences: string[] = [];

    const folder = join(dist, target);
    let overrideMode: string | null = null;
    if (!existsSync(folder) || !statSync(folder).isDirectory()) differences.push(`${distLabel}/${target}/ (missing)`);
    else {
      const pkg = readTree(folder);
      differences.push(...treeDifferences(regen, pkg, `${distLabel}/${target}/`));
      const manifest = pkg.get(MANIFEST);
      if (manifest !== undefined) {
        try {
          const m = JSON.parse(manifest.toString("utf8")) as { mode_source?: unknown; enforcement_mode?: unknown };
          if (m.mode_source === "override") overrideMode = String(m.enforcement_mode);
        } catch {
          // An unparsable manifest differs from the regeneration's, which the comparison reports.
        }
      }
    }

    const zipName = targetZipName(target, version);
    const zipPath = join(dist, zipName);
    if (!existsSync(zipPath)) differences.push(`${distLabel}/${zipName} (missing)`);
    else {
      try {
        differences.push(...treeDifferences(regen, readZip(zipPath), `${distLabel}/${zipName}:`));
      } catch (e) {
        if (!(e instanceof ZipError) && !(e instanceof RangeError)) throw e;
        differences.push(`${distLabel}/${zipName} (unreadable: ${e.message})`);
      }
    }
    return { differences, overrideMode };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
