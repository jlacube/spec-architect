// Plan fixture for the plan-phase lint scenarios (C001-TS-601 … 618, 907): the lint-clean minimal
// change with a started, lint-clean plan; scenarios replace or add plan files.
export const PLAN = ".sdd/004-x/20-plan";
export const CHANGE_MD = "---\nid: CHG-004\ntitle: x\nprofile: full\nphases:\n  20-plan: { status: draft }\n---\n# CHG-004\n";

export interface TaskOptions {
  status?: string;
  dependsOn?: string[];
  implements?: string[];
  satisfiesAc?: string[];
  verifiedBy?: string[];
  components?: string[];
  commit?: string | null;
  targets?: string[];
  verification?: string[];
  doneWhen?: string[];
  /** Extra body text (for code blocks). */
  extra?: string;
}

const yamlList = (ids: string[]) => `[${ids.join(", ")}]`;

/** A task file `T-<seq>-x.md` for `C004-T-<seq>`. */
export function task(seq: string, o: TaskOptions = {}): [string, string] {
  const id = `C004-T-${seq}`;
  const targets = o.targets ?? ["`src/thing.ts`"];
  const verification = o.verification ?? ["Run `npm test`"];
  const doneWhen = o.doneWhen ?? ["Tests pass"];
  const fm = [
    "---", `id: ${id}`, 'title: "Thing"', "change: CHG-004", "phase: 20-plan", "artifact: plan/task", "milestone: C004-M-01",
    `status: ${o.status ?? "todo"}`, `depends_on: ${yamlList(o.dependsOn ?? [])}`, `implements: ${yamlList(o.implements ?? ["C004-REQ-012"])}`,
    `satisfies_ac: ${yamlList(o.satisfiesAc ?? ["C004-AC-012.1"])}`, `verified_by: ${yamlList(o.verifiedBy ?? ["C004-TS-012", "C004-TC-012"])}`,
    `components: ${yamlList(o.components ?? [])}`, "risk_refs: []", "estimate: S",
    `report: { commit: ${o.commit === undefined || o.commit === null ? "null" : o.commit}, completed_at: null, notes: null }`, "---",
  ].join("\n");
  const body =
    `\n\n# ${id} — Thing\n\n## Intent\n\nDo the thing.\n\n## Targets\n\n| Kind | Target | Change |\n|---|---|---|\n` +
    targets.map((t) => `| modify | ${t} | change |\n`).join("") +
    "\n## Preconditions\n\nNone.\n\n## Step outline (no production code)\n\n1. Do it.\n\n## Verification\n\n" + verification.map((v) => `- ${v}\n`).join("") +
    "\n## Done when\n\n" + doneWhen.map((d) => `- [ ] ${d}\n`).join("") + (o.extra ?? "");
  return [`${PLAN}/50-tasks/T-${seq}-x.md`, fm + body];
}

export const TEST_PLAN =
  "---\nid: C004-PLAN-TEST\nartifact: plan/test-plan\n---\n\n# Test plan\n\n| TC | Verifies | Level | Location | Test data | Environment | Task |\n|---|---|---|---|---|---|---|\n" +
  "| C004-TC-012 | C004-TS-012 | integration | `tests/x.test.ts` | none | local | C004-T-001 |\n";

export const STRATEGY =
  "---\nid: C004-PLAN-STRATEGY\nartifact: plan/strategy\n---\n\n# Strategy\n\n## 3. Milestones\n\n| ID | Name | Goal | Exit criterion | Tasks |\n|---|---|---|---|---|\n" +
  "| C004-M-01 | One | Ship it | Tests pass | C004-T-001 |\n";

/** The started plan: change.md, strategy, one task and the test plan. */
export function plan(...extra: [string, string][]): Record<string, string> {
  return Object.fromEntries([
    [".sdd/004-x/change.md", CHANGE_MD],
    [`${PLAN}/10-strategy.md`, STRATEGY],
    task("001"),
    [`${PLAN}/60-test-plan.md`, TEST_PLAN],
    ...extra,
  ]);
}
