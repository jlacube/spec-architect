// C001-TC-202 — verifies C001-TS-202 (C001-AC-202.1, C001-REQ-202): orientation on a workspace with
// two changes. fx-bootstrap is this repository's workspace; CHG-001's phase is read from its
// change.md at run time (the scenario was written when CHG-001 was in 10-spec).
import { cpSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checker, firstReply, toolCalls } from "../harness/assert.mjs";
import { ROOT } from "../harness/fixtures.mjs";
import { edit, git, sdd } from "../harness/workspaces.mjs";

const CHG1_PHASE = /^phase:\s*(\S+)/m.exec(readFileSync(join(ROOT, ".sdd", "001-architect-agent-suite", "change.md"), "utf8"))[1];

export default {
  id: "TS-202",
  title: "Orientation on a workspace with two changes",
  agent: "architect:sdd-conductor",
  fixture: (root) => {
    // fx-bootstrap extended with change 002 in 00-ideation, status draft.
    cpSync(join(ROOT, ".sdd"), join(root, ".sdd"), { recursive: true, filter: (src) => !src.includes(join(".sdd", "metrics")) });
    git(root, "init", "-q");
    sdd(root, "change", "new", "Second idea");
    const folder = readdirSync(join(root, ".sdd")).find((n) => n.startsWith("002-"));
    edit(root, `.sdd/${folder}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1draft"));
    sdd(root, "status", "--write");
  },
  maxTurns: 14,
  prompt: "hi",
  assert({ transcript }) {
    const { failures, check } = checker();
    const reads = toolCalls(transcript, "Read").map((c) => String(c.input?.file_path ?? "").replace(/\\/g, "/"));
    const firstText = transcript.findIndex((r) => r.type === "sdk" && r.message.type === "assistant" && !r.message.parent_tool_use_id && (r.message.message?.content ?? []).some((b) => b.type === "text" && b.text.trim()));
    const readsBefore = toolCalls(transcript.slice(0, firstText < 0 ? undefined : firstText), "Read").map((c) => String(c.input?.file_path ?? "").replace(/\\/g, "/"));
    for (const f of [/\.sdd\/SDD\.md$/, /\.sdd\/registry\.json$/, /\.sdd\/001-[^/]+\/change\.md$/, /\.sdd\/002-[^/]+\/change\.md$/])
      check(readsBefore.some((p) => f.test(p)), `no Read of ${f} before the first reply (reads: ${reads.join(", ")})`);
    const reply = firstReply(transcript);
    check(/CHG-001/.test(reply) && reply.includes(CHG1_PHASE), `first reply does not name CHG-001 with phase ${CHG1_PHASE}`);
    check(/CHG-002/.test(reply) && /00-ideation|ideation/i.test(reply), "first reply does not name CHG-002 with phase 00-ideation");
    check(/next/i.test(reply) || /propos|recommend|suggest/i.test(reply), "first reply proposes no next action");
    check(toolCalls(transcript, "Write").length === 0 && toolCalls(transcript, "Agent").length === 0, "wrote files or spawned agents during orientation");
    return failures;
  },
};
