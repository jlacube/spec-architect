// C001-TC-609 — verifies C001-TS-609 (C001-AC-608.1, C001-REQ-608): work breakdown content. With 12 task
// files in 3 milestones, 40-work-breakdown.md has a Mermaid graph with 12 task nodes in 3 subgraphs, one
// edge per depends_on pair, and a Critical path list consistent with the edges.
import { checker } from "../harness/assert.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";
import { read } from "../cap04/spec.mjs";
import { specWithRequirements } from "../cap05/arch.mjs";
import { brief, plannerRun } from "./planner.mjs";

const PLAN = ".sdd/004-clinic-subscriptions/20-plan";
// 12 tasks, 3 milestones; depends_on edges (dependency → dependent).
const TASKS = [
  ["01", 1, []], ["02", 1, ["01"]], ["03", 1, ["01"]], ["04", 1, ["02", "03"]],
  ["05", 2, ["04"]], ["06", 2, ["05"]], ["07", 2, ["05"]], ["08", 2, ["06"]],
  ["09", 3, ["08"]], ["10", 3, ["07", "09"]], ["11", 3, ["10"]], ["12", 3, ["04"]],
];
const id = (n) => `C004-T-0${n}`;

function given(root) {
  specWithRequirements(root);
  write(root, `${PLAN}/10-strategy.md`, `---\nid: C004-PLAN-STRATEGY\nartifact: plan/strategy\n---\n# Strategy\n\n| Milestone | Goal | Exit criterion | Tasks |\n|---|---|---|---|\n${[1, 2, 3].map((m) => `| C004-M-${m} | milestone ${m} goal | milestone ${m} tests pass | ${TASKS.filter((t) => t[1] === m).map((t) => id(t[0])).join(", ")} |`).join("\n")}\n`);
  for (const [n, m, deps] of TASKS)
    write(root, `${PLAN}/50-tasks/T-0${n}-task-${n}.md`, `---\nid: ${id(n)}\ntitle: Task ${n}\nmilestone: C004-M-${m}\nstatus: todo\ndepends_on: [${deps.map(id).join(", ")}]\nimplements: [C004-REQ-101]\nsatisfies_ac: [C004-AC-101.1]\nverified_by: [C004-TS-101]\ncomponents: []\nrisk_refs: []\nestimate: ${n === "06" || n === "09" ? "L" : "M"}\nreport: { commit: null, completed_at: null, notes: null }\n---\n# ${id(n)} — Task ${n}\n\n## Intent\nStep ${n}.\n## Targets\n| Kind | Target | Change |\n|---|---|---|\n| add | src/t${n}.ts | new |\n## Preconditions\n-\n## Step outline\n1. Do it.\n## Verification\n- npm test\n## Done when\n- [ ] done\n`);
  edit(root, ".sdd/004-clinic-subscriptions/change.md", (t) => t.replace(/^( {2}20-plan: \{ status: )not-started/m, "$1draft"));
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "tasks");
}

export default {
  id: "TS-609",
  title: "Work breakdown content",
  ...plannerRun(brief('CHG-004 "Clinic subscriptions" · profile full · kind greenfield', "work breakdown", `the 12 tasks of \`${PLAN}/50-tasks/\` and the milestones of \`${PLAN}/10-strategy.md\` are written; write the work breakdown from them (do not change the tasks).`, `\`${PLAN}/40-work-breakdown.md\` only.`), given),
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, `${PLAN}/40-work-breakdown.md`);
    check(text, "40-work-breakdown.md missing");
    const graph = /```mermaid\s*\n([\s\S]*?)```/.exec(text)?.[1] ?? "";
    check(/^\s*(flowchart|graph)\b/m.test(graph), "no Mermaid graph");
    const subgraphs = graph.match(/^\s*subgraph\b/gm) ?? [];
    check(subgraphs.length === 3, `${subgraphs.length} subgraphs`);
    for (const [n] of TASKS) check(graph.includes(id(n).replaceAll("-", "_")) || graph.includes(`T${n}`) || graph.includes(`T_0${n}`), `node for ${id(n)} missing`);
    const node = (n) => `(?:C004_T_0${n}|T0${n}|T_0${n})\\b`;
    for (const [n, , deps] of TASKS) for (const d of deps) check(new RegExp(`${node(d)}[^\\n]*-->[^\\n]*${node(n)}`).test(graph), `edge ${id(d)} → ${id(n)} missing`);
    const cp = (text.split(/^#{2,3}\s+Critical path\b/im)[1] ?? "").split(/^#{2,3}\s/m)[0];
    // The path is the list items (numbered or bulleted, or arrows on one line); the first task ID of
    // each item counts, so notes about alternatives or slack on the same line are ignored.
    const numbered = cp.split(/\r?\n/).filter((l) => /^\s*\d+\.\s/.test(l));
    const items = numbered.length > 0 ? numbered : cp.split(/\r?\n/).filter((l) => /^\s*[-*]\s/.test(l));
    const order = items.length > 0 ? items.map((l) => /C004-T-0(\d{2})/.exec(l)?.[1]).filter(Boolean) : [...(cp.split(/\r?\n/).find((l) => /→|->/.test(l)) ?? "").matchAll(/C004-T-0(\d{2})/g)].map((m) => m[1]);
    check(order.length >= 3, `critical path lists ${order.length} tasks`);
    const deps = Object.fromEntries(TASKS.map(([n, , d]) => [n, d]));
    for (let i = 1; i < order.length; i++) {
      // Each step of the path depends (transitively) on the previous one.
      const reach = (a, b) => (deps[b] ?? []).some((d) => d === a || reach(a, d));
      check(reach(order[i - 1], order[i]), `critical path step ${id(order[i - 1])} → ${id(order[i])} is not a dependency chain`);
    }
    return failures;
  },
};
