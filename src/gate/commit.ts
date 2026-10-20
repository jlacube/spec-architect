// `sdd gate approve --commit` (C001-REQ-816, C001-REQ-817): the approval is committed together with the
// change folder and the workspace status files — never anything else. The preconditions are checked
// before the approval is recorded, so a refusal leaves the workspace unchanged.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { CliError } from "../cli/errors.ts";
import { nativeExecutable } from "../io/paths.ts";

/**
 * Runs `git` in `root`: the first native match on PATH, started by its absolute path without a shell
 * (C002-IF-007 §Executable lookup, C002-CON-17). No native match fails as a missing git does, so the first
 * precondition gives ERR-CLI-018 `not a git repository`.
 */
function git(root: string, args: string[]): { ok: boolean; out: string } {
  const exe = nativeExecutable("git");
  if ("error" in exe) return { ok: false, out: exe.error };
  const r = spawnSync(exe.file, args, { cwd: root, encoding: "utf8", windowsHide: true });
  return { ok: !r.error && r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim() };
}

const refuse = (reason: string) => new CliError("ERR-CLI-018", { reason });

/** Throws ERR-CLI-018 unless `root` is a git work tree with a committer identity and nothing staged. */
export function commitPreconditions(root: string): void {
  if (!git(root, ["rev-parse", "--is-inside-work-tree"]).ok) throw refuse("not a git repository");
  if (!git(root, ["var", "GIT_COMMITTER_IDENT"]).ok) throw refuse("git has no committer identity (set user.name and user.email)");
  const staged = git(root, ["diff", "--cached", "--name-only"]);
  if (!staged.ok) throw refuse("cannot read the git index");
  if (staged.out !== "") throw refuse(`other changes are staged: ${staged.out.split("\n").slice(0, 5).join(", ")}`);
}

/** Commits the change folder, `.sdd/SDD.md` and `.sdd/registry.json` with `message`; returns the short sha. */
export function commitApproval(root: string, changeDir: string, message: string): string {
  const paths = [relative(root, changeDir), ".sdd/SDD.md", ".sdd/registry.json"].filter((p) => existsSync(join(root, p))).map((p) => p.split("\\").join("/"));
  const add = git(root, ["add", "--", ...paths]);
  if (!add.ok) throw refuse(`approval recorded, but git add failed: ${add.out}`);
  const commit = git(root, ["commit", "-q", "-m", message, "--", ...paths]);
  if (!commit.ok) throw refuse(`approval recorded, but git commit failed: ${commit.out}`);
  return git(root, ["rev-parse", "--short", "HEAD"]).out;
}
