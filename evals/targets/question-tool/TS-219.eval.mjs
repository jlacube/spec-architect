// C002-TC-219 — verifies C002-TS-219 (C002-AC-213.1, C002-REQ-213; C002-T-037): on a workspace with one
// change, the new-change command with the title "Export to CSV" asks one question-tool call whose first
// option is a profile labelled "(Recommended)" with the size estimate (expected user stories,
// requirements, touched modules) compared with the constitution's thresholds, and no folder
// ".sdd/002-*" exists before the answer (checked when the answer is given). Scenario Outline rows:
//   TS-219-claude-code  AskUserQuestion, `/architect:new`  (C002-T-037 step 4)
//   TS-219-opencode     `question`, `/architect-new`       (carried to C002-T-056, `run.mjs --host opencode`)
// Given: the real CLI, an approved constitution (default thresholds: lite for ≤ 3 stories,
// ≤ 10 requirements, ≤ 2 modules) and change 001. Run the Claude Code row with `--only TS-219-claude-code`.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { checker, toolCalls } from "../../harness/assert.mjs";
import { constitution } from "../../cap02/drafting.mjs";
import { git, sdd } from "../../harness/workspaces.mjs";

const HOST = {
  "claude-code": { agent: "architect:sdd-conductor", tool: "AskUserQuestion", prompt: '/architect:new "Export to CSV"' },
  opencode: { agent: "sdd-conductor", tool: "question", prompt: '/architect-new "Export to CSV"' },
};

const isProfile = (x) => /profile|\blite\b|\bfull\b/i.test(`${x.header ?? ""} ${x.question ?? ""} ${(x.options ?? []).map((o) => o.label).join(" ")}`);

function row(host) {
  const { agent, tool, prompt } = HOST[host];
  let workspace = null;
  let foldersAtAnswer = null;
  const laterChanges = () => readdirSync(join(workspace, ".sdd")).filter((n) => /^\d{3}-/.test(n) && !n.startsWith("001-"));
  return {
    id: `TS-219-${host}`,
    title: `Profile round on ${host} through ${tool} before the change exists (TS-219)`,
    host,
    agent,
    fixture: (root) => {
      workspace = root;
      foldersAtAnswer = null;
      git(root, "init", "-q");
      sdd(root, "init");
      constitution(root, "approved");
      sdd(root, "change", "new", "Booking service", "--profile", "lite");
      sdd(root, "status", "--write");
      git(root, "add", "-A");
      git(root, "commit", "-q", "-m", "fixture");
    },
    allowTools: ["Write", "Edit", "Bash"],
    maxTurns: 16,
    maxBudgetUsd: 0.35,
    prompt,
    answer: (x) => {
      foldersAtAnswer ??= laterChanges();
      return x.options[0].label;
    },
    assert({ transcript }) {
      const { failures, check } = checker();
      const asks = toolCalls(transcript).filter((c) => c.name === tool && c.agent === null);
      const profile = asks.filter((c) => (c.input?.questions ?? []).some(isProfile));
      check(profile.length === 1, `TS-219 ${host}: ${profile.length} ${tool} calls ask the profile (one expected)`);
      if (profile.length === 0) return failures;
      const x = profile[0].input.questions.find(isProfile);
      const first = x.options?.[0];
      check(/\b(lite|full)\b/i.test(first?.label ?? "") && /\(Recommended\)\s*$/.test(first?.label ?? ""), `TS-219 ${host}: first option is not a profile labelled "(Recommended)": ${first?.label}`);
      const estimate = `${x.question ?? ""} ${first?.description ?? ""}`;
      for (const [what, re] of [["user stories", /stor/i], ["requirements", /requirement|\bREQ/i], ["touched modules", /module/i]])
        check(re.test(estimate) && /\d/.test(estimate), `TS-219 ${host}: the estimate does not name ${what} with a number`);
      check(/threshold|≤|<=|limit/i.test(estimate), `TS-219 ${host}: the estimate is not compared with the thresholds`);
      check(Array.isArray(foldersAtAnswer) && foldersAtAnswer.length === 0, `TS-219 ${host}: a change folder existed before the answer: ${foldersAtAnswer}`);
      return failures;
    },
  };
}

export default [row("claude-code"), row("opencode")];
