// Archive-task marker (C005-IF-002): the task that runs `sdd archive` for its own change. Full form:
// frontmatter key `archive_task` with the YAML boolean `true`. Lite form: the field `- **Archive task:** true`
// of a task section, its value compared trimmed, without emphasis or backticks, in any letter case. Any other
// value counts as no marker. Read by LINT-TASK-005 and the archive preconditions.

/** Frontmatter key of the full form. */
export const ARCHIVE_TASK_KEY = "archive_task";
/** Field name of the lite form. */
export const ARCHIVE_TASK_FIELD = "Archive task";

/** True when a task file's frontmatter carries the marker. */
export function fullMarked(frontmatter: Readonly<Record<string, unknown>> | null | undefined): boolean {
  return frontmatter?.[ARCHIVE_TASK_KEY] === true;
}

/** True when the value of a lite task's `Archive task` field is the marker. */
export function liteMarked(value: string | null | undefined): boolean {
  return typeof value === "string" && value.replace(/[*`]/g, "").trim().toLowerCase() === "true";
}
