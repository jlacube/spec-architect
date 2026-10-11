// C001-TC-305 — verifies C001-TS-305 (C001-AC-304.1, C001-REQ-304): repository internals routing. A
// DeepWiki ask_wiki_question call for oraios/serena occurs before any WebFetch of a github.com source
// file of that repository.
import { checker, toolCalls } from "../harness/assert.mjs";
import { researcherRun } from "./research.mjs";

export default {
  id: "TS-305",
  title: "Repository internals routing",
  ...researcherRun("How does oraios/serena decide which tools are excluded in planning mode?"),
  maxTurns: 20,
  assert({ transcript }) {
    const { failures, check } = checker();
    const calls = toolCalls(transcript);
    const ask = calls.findIndex((c) => c.name === "mcp__plugin_architect_deepwiki__ask_wiki_question" && /oraios\/serena/i.test(JSON.stringify(c.input ?? {})));
    check(ask >= 0, "no DeepWiki ask_wiki_question call for oraios/serena");
    const fetch = calls.findIndex((c) => c.name === "WebFetch" && /github(usercontent)?\.com\/oraios\/serena/i.test(String(c.input?.url ?? "")));
    if (fetch >= 0) check(ask >= 0 && ask < fetch, "a source file of oraios/serena was fetched before asking DeepWiki");
    return failures;
  },
};
