// Helpers for CLI tests: run the bundled CLI as a subprocess, run it in-process with test-double
// lint rules, and build throwaway workspaces.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runCli, type CliIo } from "../../../src/cli/run.ts";
import type { LintRule } from "../../../src/lint/types.ts";
import { rebuildRegistry } from "../../../src/workspace/status.ts";
import { repoRoot } from "../../helpers.ts";

export const CLI = join(repoRoot(), "plugins", "architect", "scripts", "sdd.mjs");

export interface Result {
  code: number;
  stdout: string;
  stderr: string;
}

/** Runs the bundled CLI with a clean environment (no inherited SDD_DEBUG). */
export function runBundled(args: string[], opts: { cwd: string; env?: Record<string, string> }): Result {
  const env: Record<string, string | undefined> = { ...process.env, SDD_DEBUG: undefined, SDD_TEST_FAULT: undefined, ...opts.env };
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: opts.cwd, env, encoding: "utf8" });
  return { code: r.status ?? -1, stdout: r.stdout, stderr: r.stderr };
}

/** Runs the CLI in-process; `rules` replaces the registered lint rules. */
export function runInProcess(args: string[], opts: { cwd: string; env?: Record<string, string>; rules?: LintRule[] }): Result {
  let stdout = "";
  let stderr = "";
  const io: CliIo = {
    cwd: opts.cwd,
    env: opts.env ?? {},
    stdout: (s) => (stdout += s),
    stderr: (s) => (stderr += s),
  };
  if (opts.rules) io.rules = opts.rules;
  const code = runCli(args, io);
  return { code, stdout, stderr };
}

/** Creates a temporary folder with the given files (paths relative to it, `/` separated). */
export function makeWorkspace(files: Record<string, string>): { root: string; cleanup: () => void } {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-cli-")));
  for (const [rel, content] of Object.entries(files)) {
    const p = join(root, ...rel.split("/"));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  // `REBUILD` asks for a registry.json consistent with the files, so LINT-REG-001 stays quiet.
  if (files[".sdd/registry.json"] === REBUILD) {
    writeFileSync(join(root, ".sdd", "registry.json"), JSON.stringify(rebuildRegistry(join(root, ".sdd")), null, 2) + "\n");
  }
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

/** Marker value for `.sdd/registry.json`: write the registry rebuilt from the other files. */
export const REBUILD = "<rebuilt registry>";

/** A minimal valid change folder `004-x` with one requirement. */
/** The story fields of C001-REQ-402 before Requirements and Traces to, for persona P-01. */
export const STORY_FIELDS =
  "- **As a** P-01 owner\n- **I want** a thing\n- **So that** it is done\n- **Value / outcome:** done\n- **Priority:** Must · **Size hint:** S · **Capability:** C004-CAP-01\n";

export function minimalChange(): Record<string, string> {
  return {
    ".sdd/SDD.md": "# SDD workspace\n",
    ".sdd/registry.json": REBUILD,
    ".sdd/004-x/change.md": "---\nid: CHG-004\ntitle: x\n---\n# CHG-004\n",
    ".sdd/004-x/10-spec/10-context/stakeholders-and-personas.md":
      "---\nid: C004-SPEC-CTX-04\nartifact: spec/context/personas\n---\n\n## P-01 — Owner\n\nOwns the spec.\n",
    ".sdd/004-x/10-spec/40-domain/glossary-delta.md":
      "---\nid: C004-SPEC-GLOSSARY\nartifact: spec/glossary-delta\n---\n\n## 2. System names\n\n| Name | Component |\n|---|---|\n| sdd CLI | — |\n",
    ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md":
      "---\nid: C004-CAP-01\nartifact: spec/requirements\n---\n\n### C004-REQ-012 — Thing\n- **Pattern:** ubiquitous\n- **Statement:** THE sdd CLI SHALL do one thing.\n- **Rationale:** r\n- **Stories:** C004-US-001\n- **Priority:** Must\n- **Acceptance:** C004-AC-012.1\n",
    ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/stories.md":
      "---\nid: C004-CAP-01\nartifact: spec/stories\n---\n\n### C004-US-001 — Story\n" + STORY_FIELDS + "- **Requirements:** C004-REQ-012\n- **Traces to:** Q1\n",
    ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/acceptance.md":
      "---\nid: C004-CAP-01\nartifact: spec/acceptance\n---\n\n#### C004-AC-012.1 — Criterion\n```gherkin\nScenario: C004-TS-012 — s\n  Given a\n  When b\n  Then c\n```\n",
  };
}
