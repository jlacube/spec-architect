// C001-TC-120 — verifies C001-TS-120 (C001-AC-114.2, C001-REQ-114): constitution interview length. At
// most 2 AskUserQuestion calls happen before constitution.md is written.
import { checker, toolCalls } from "../harness/assert.mjs";
import { initRun } from "./init.mjs";

export default {
  id: "TS-120",
  title: "Constitution interview length",
  ...initRun,
  assert({ transcript }) {
    const { failures, check } = checker();
    const calls = toolCalls(transcript);
    const written = calls.findIndex((c) => (c.name === "Write" || c.name === "Edit") && /_constitution[\\/]constitution\.md$/.test(String(c.input?.file_path ?? "")));
    check(written >= 0, "constitution.md was not written");
    const asks = calls.slice(0, written < 0 ? undefined : written).filter((c) => c.name === "AskUserQuestion" && c.agent === null).length;
    check(asks <= 2, `${asks} AskUserQuestion calls before constitution.md was written`);
    return failures;
  },
};
