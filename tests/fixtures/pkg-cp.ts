// pkg-cp and pkg-cp-hooks (test plan §2, C002-T-058): the Copilot target package generated from this
// repository's plugin (with the freshly built CLI copy) for `sdd-mcp-server` and for `copilot-hooks`, once
// per test process into a temporary folder, then copied per test to a folder the tests substitute for
// `C:/fx/pkg-cp`. Also the generated OpenCode package (C002-TS-345) and the reading of an installed hook
// command (`node "<package>/scripts/sdd.mjs" <arguments>`).
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../../scripts/generate/main.ts";
import { repoRoot } from "../helpers.ts";

export type CopilotMode = "sdd-mcp-server" | "copilot-hooks";

const generated = new Map<string, string>();
const temps: string[] = [];

/** Generates `target` (and mode) once; returns the package folder. */
function generate(target: "copilot" | "opencode", mode?: CopilotMode): string {
  const key = `${target}:${mode ?? ""}`;
  const hit = generated.get(key);
  if (hit) return hit;
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-gen-")));
  temps.push(base);
  const err: string[] = [];
  const args = ["--target", target, "--out", join(base, "dist"), "--quiet", ...(mode ? ["--mode", `${target}=${mode}`] : [])];
  const code = main(args, { cwd: repoRoot(), stdout: () => {}, stderr: (l) => err.push(l) });
  if (code !== 0) throw new Error(`generate ${key} failed (${code}): ${err.join("\n")}`);
  const dir = join(base, "dist", target);
  generated.set(key, dir);
  return dir;
}

/** A temporary parent folder (real path, `/` separators) removed by `cleanupPackages`. */
export function tempFolder(prefix = "sdd-fx-"): string {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), prefix))).split("\\").join("/");
  temps.push(dir);
  return dir;
}

/** A copy of the generated Copilot package for `mode` at `<parent>/<name>` (default a new temporary parent). */
export function copilotPackage(mode: CopilotMode, name = mode === "sdd-mcp-server" ? "pkg-cp" : "pkg-cp-hooks", parent = tempFolder("sdd-fx-pkg-")): string {
  const dir = `${parent}/${name}`;
  mkdirSync(parent, { recursive: true });
  cpSync(generate("copilot", mode), dir, { recursive: true });
  return dir;
}

/** A copy of the generated OpenCode package. */
export function openCodePackage(parent = tempFolder("sdd-fx-pkg-")): string {
  const dir = `${parent}/pkg-oc`;
  cpSync(generate("opencode"), dir, { recursive: true });
  return dir;
}

export function cleanupPackages(): void {
  for (const t of temps.splice(0)) rmSync(t, { recursive: true, force: true });
  generated.clear();
}

/** The PreToolUse entries of a hooks file (`<package>/hooks.json` or `.github/hooks/architect-guard.json`). */
export function preToolUse(file: string): { command: string; type: string }[] {
  return (JSON.parse(readFileSync(file, "utf8")) as { hooks: Record<string, { command: string; type: string }[]> }).hooks["PreToolUse"]!;
}

/**
 * An installed hook command split into the CLI copy it runs and its arguments. Only the form the install
 * command writes is accepted: `node "<absolute path>" <arguments without quotes or shell operators>`.
 */
export function splitHookCommand(command: string): { script: string; args: string[] } {
  const m = /^node "([^"]+)"((?: [A-Za-z0-9_.,:-]+)+)$/.exec(command);
  if (!m) throw new Error(`not an installed hook command: ${command}`);
  return { script: m[1]!, args: m[2]!.trim().split(" ") };
}
