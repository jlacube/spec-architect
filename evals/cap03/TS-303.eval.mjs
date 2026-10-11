// C001-TC-303 — verifies C001-TS-303 (C001-AC-302.2, C001-REQ-302): sources were actually fetched. Every
// URL cited in the note's Findings appears in a WebFetch, WebSearch result, Context7 or DeepWiki call
// (input or result) of the session's transcript.
import { checker } from "../harness/assert.mjs";
import { notes, researcherRun, section } from "./research.mjs";

/** All text the session's tools received or returned (inputs and results), main thread and subagents. */
function toolTraffic(transcript) {
  const parts = [];
  for (const r of transcript) {
    if (r.type !== "sdk") continue;
    for (const b of r.message.message?.content ?? []) {
      if (b.type === "tool_use") parts.push(JSON.stringify(b.input ?? {}));
      if (b.type === "tool_result") parts.push(typeof b.content === "string" ? b.content : JSON.stringify(b.content ?? ""));
    }
    if (r.message.type === "user" && r.message.tool_use_result) parts.push(JSON.stringify(r.message.tool_use_result));
  }
  return parts.join("\n");
}

const norm = (u) => u.replace(/[).,;]+$/, "").replace(/\/$/, "").replace(/#.*$/, "");

export default {
  id: "TS-303",
  title: "Sources were actually fetched",
  ...researcherRun("What rate limits does the Google Calendar API apply to event insertion, and how should a client back off?"),
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const all = Object.values(notes(root)).join("\n");
    check(all, "no note written");
    const urls = [...new Set([...section(all, "Findings").matchAll(/https?:\/\/[^\s)>\]"'`]+/g)].map((m) => norm(m[0])))];
    check(urls.length > 0, "Findings cite no URL");
    const traffic = toolTraffic(transcript).replace(/\\\//g, "/");
    for (const u of urls) check(traffic.includes(u), `cited but never fetched or returned: ${u}`);
    return failures;
  },
};
