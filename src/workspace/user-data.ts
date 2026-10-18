// `--user-data` of `sdd serena-config` and `sdd serena-launch` (C002-REQ-515, C002-REQ-516, C002-IF-007):
// the per-user data folder of `architect-sdd`, for the generated targets that have no
// `${CLAUDE_PLUGIN_DATA}`. The platform rule lives in src/io/paths.ts; containment is the repository
// root rule of src/io/repo-root.ts (C002-IF-008 §1.1: letter case, drive letters and links resolved).
// ERR-CLI-020 is raised before anything is written or started.
import { CliError } from "../cli/errors.ts";
import { userDataFolder, USER_OS, type UserOs } from "../io/paths.ts";
import { findRepositoryRoot, isOutsideRepository } from "../io/repo-root.ts";

export const USER_DATA_APP = "architect-sdd";

/** The per-user data folder (normalised), or ERR-CLI-020 when it is undeterminable, relative or inside the repository of `cwd`. */
export function userDataDir(cwd: string, env: Readonly<Record<string, string | undefined>>, os: UserOs = USER_OS): string {
  const r = userDataFolder(USER_DATA_APP, env, os);
  if (!("folder" in r)) {
    const reason = r.value === undefined ? `${r.variable} is not set` : `${r.variable} is relative: ${r.value}`;
    throw new CliError("ERR-CLI-020", { reason });
  }
  const root = findRepositoryRoot(cwd);
  if (!isOutsideRepository(root, r.folder, cwd)) throw new CliError("ERR-CLI-020", { reason: `${r.folder} lies inside the repository ${root}` });
  return r.folder;
}
