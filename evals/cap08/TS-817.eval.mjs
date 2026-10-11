// C001-TC-817 — verifies C001-TS-817 (C001-AC-815.1, C001-REQ-815): stop at G1, one scenario per Then:
// (1) P-01 answers Stop at G1 of change 005 with the reason "superseded by 006" → change.md has status
// stopped, the reason and the date, and SDD.md no longer lists 005 as active; (2) on a change stopped that
// way, /architect:specify 005 is refused naming the stopped status.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checker, dispatches, finalReply, toolCalls } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { constitution } from "../cap02/drafting.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";
import { isGate } from "./gate.mjs";

const DIR = ".sdd/005-loyalty-points";

function atG1(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  for (let i = 1; i < 5; i++) sdd(root, "change", "new", `Earlier change ${i}`, "--profile", "lite");
  sdd(root, "change", "new", "Loyalty points", "--profile", "lite");
  write(root, `${DIR}/00-ideation/ideation.md`, "# Ideation — Loyalty points\n\n## Problem statement\n\nRepeat customers get nothing back.\n");
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1in-review"));
  sdd(root, "status", "--write");
}

function stopped(root) {
  atG1(root);
  sdd(root, "change", "stop", "005", "--reason", "superseded by 006");
}

const read = (root, rel) => readFileSync(join(root, ...rel.split("/")), "utf8");
const base = { agent: "architect:sdd-conductor", plugins: [architectWithStubs], allowTools: ["Agent", "Write", "Edit", "Bash"], maxTurns: 20 };

export default [
  {
    id: "TS-817-stop",
    title: "Stop at G1",
    ...base,
    fixture: atG1,
    prompt: "/architect:gate 005",
    answer: (q) => (isGate(q) ? "Stop — superseded by 006" : q.options[0].label),
    assert({ root }) {
      const { failures, check } = checker();
      const change = read(root, `${DIR}/change.md`);
      check(/^status: stopped$/m.test(change), "change.md status is not stopped");
      check(/^stopped:[^\n]*superseded by 006/m.test(change), "the stop reason is not recorded");
      check(/^stopped:[^\n]*\d{4}-\d{2}-\d{2}/m.test(change), "the stop date is not recorded");
      const block = read(root, ".sdd/SDD.md");
      const active = block.split("\n").filter((l) => /\b005\b|CHG-005/.test(l) && !/stopped/i.test(l));
      check(active.length === 0, `SDD.md still lists 005 as active: ${active.join(" | ")}`);
      return failures;
    },
  },
  {
    id: "TS-817-specify",
    title: "Specify refused on a stopped change",
    ...base,
    fixture: stopped,
    prompt: "/architect:specify 005",
    assert({ transcript }) {
      const { failures, check } = checker();
      check(dispatches(transcript).length === 0, "a specialist was dispatched");
      check(toolCalls(transcript).every((c) => c.name !== "Write" && c.name !== "Edit"), "files were written");
      check(/stopped/i.test(finalReply(transcript)), "the reply does not name the stopped status");
      return failures;
    },
  },
];
