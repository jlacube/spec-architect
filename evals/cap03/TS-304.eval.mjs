// C001-TC-304 — verifies C001-TS-304 (C001-AC-303.1, C001-REQ-303): library question routing. The first
// research tool call is Context7 resolve-library-id, and a Context7 documentation query precedes any
// WebSearch.
import { checker, toolCalls } from "../harness/assert.mjs";
import { researcherRun } from "./research.mjs";

const RESEARCH_TOOLS = /^(WebSearch|WebFetch|mcp__plugin_architect_(context7|deepwiki)__)/;

export default {
  id: "TS-304",
  title: "Library question routing",
  ...researcherRun("How do I configure retries in the AWS SDK v3 S3 client?"),
  maxTurns: 20,
  assert({ transcript }) {
    const { failures, check } = checker();
    const calls = toolCalls(transcript).filter((c) => RESEARCH_TOOLS.test(c.name));
    check(calls[0]?.name === "mcp__plugin_architect_context7__resolve-library-id", `first research call: ${calls[0]?.name ?? "none"}`);
    const docs = calls.findIndex((c) => c.name === "mcp__plugin_architect_context7__query-docs");
    const search = calls.findIndex((c) => c.name === "WebSearch");
    check(docs >= 0, "no Context7 documentation query");
    if (search >= 0) check(docs >= 0 && docs < search, "a WebSearch came before the Context7 documentation query");
    return failures;
  },
};
