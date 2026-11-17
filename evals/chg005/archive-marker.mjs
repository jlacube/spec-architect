// Checks of the archive-task marker cases (C005-TS-141 … 143; C005-IF-002): which tasks run `sdd archive <NNN>`
// in their steps, and which carry the marker, for task files and lite task sections.
import { FULL, filesIn, LITE, read } from "./plan-fixtures.mjs";

const runsArchive = (text, nnn) => new RegExp(`sdd(\\.mjs["']?)?\\s+archive\\s+${nnn}\\b`).test(text);
const fullMarked = (text) => /^archive_task:\s*true\s*$/m.test(text.split(/^---\s*$/m)[1] ?? "");
const liteMarked = (text) => /^[-*]\s+\*\*Archive task:\*\*\s*`?\**true\**`?\s*$/im.test(text);

/** Task files of change 002: `{ name, text, archive, marked }`. */
export function fullTasks(root) {
  return filesIn(root, `${FULL}/20-plan/50-tasks`).map((name) => {
    const text = read(root, `${FULL}/20-plan/50-tasks/${name}`);
    return { name, text, archive: runsArchive(text, "002"), marked: fullMarked(text) };
  });
}

/** Task sections of the lite plan of change 003: `{ name, text, archive, marked }`. */
export function liteTasks(root) {
  const plan = read(root, `${LITE}/20-plan/plan.md`);
  return plan
    .split(/^(?=#{2,4}\s+C003-T-\d+)/m)
    .slice(1)
    .map((s) => s.split(/^#{1,4}\s(?!.*C003-T-)/m)[0])
    .map((text) => ({ name: text.split("\n")[0], text, archive: runsArchive(text, "003"), marked: liteMarked(text) }));
}
