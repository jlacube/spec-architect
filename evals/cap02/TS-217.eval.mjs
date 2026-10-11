// C001-TC-217 — verifies C001-TS-217 (C001-AC-215.1, C001-REQ-215): brief size discipline. On the
// ideation start of TS-218, no brief contains a contiguous excerpt of more than 40 lines of any .sdd/
// file.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { checker, dispatches } from "../harness/assert.mjs";
import { ideationStart } from "./TS-218.eval.mjs";

function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

/** Whether `text` contains 41 consecutive non-blank lines of `source` (trimmed). */
export function longExcerpt(text, source) {
  const lines = source.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
  const hay = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "").join("\n");
  for (let i = 0; i + 41 <= lines.length; i++) if (hay.includes(lines.slice(i, i + 41).join("\n"))) return true;
  return false;
}

export default {
  id: "TS-217",
  title: "Brief size discipline",
  ...ideationStart,
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const d = dispatches(transcript);
    check(d.length > 0, "no specialist dispatched");
    const sources = files(join(root, ".sdd")).filter((p) => /\.(md|json)$/.test(p));
    for (const x of d) for (const s of sources) check(!longExcerpt(x.prompt, readFileSync(s, "utf8")), `${x.type} brief pastes more than 40 lines of ${s.slice(root.length + 1)}`);
    return failures;
  },
};
