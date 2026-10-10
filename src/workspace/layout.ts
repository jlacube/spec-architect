// Root entries of the workspace (C001-IF-06 §1).
export const ROOT_FILES = ["SDD.md", "registry.json"] as const;
export const ROOT_DIRS = ["_constitution", "_living", "_decisions", "_templates", "_archive"] as const;
export const CHANGE_FOLDER = /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** True for entries defined by the layout; everything else is preserved and reported (C001-REQ-124). */
export function isKnownRootEntry(name: string, isDirectory: boolean): boolean {
  if (!isDirectory) return (ROOT_FILES as readonly string[]).includes(name);
  return (ROOT_DIRS as readonly string[]).includes(name) || CHANGE_FOLDER.test(name);
}
