// C002-TC-616, C002-TC-617, C002-TC-619, C002-TC-632 — verify C002-TS-616, C002-TS-617, C002-TS-619 and
// C002-TS-632 (C002-AC-613.1, 614.1, 616.1, 628.1; C002-REQ-613, 614, 616, 628; C002-T-046), the structure
// of the manual VS Code checklist `docs/checklists/vscode-copilot.md` and of its record template
// `docs/checklists/records/TEMPLATE.md` (C002-IF-009 §4, C002-REQ-615): every `@manual-vscode` scenario
// of C002-CAP-02, C002-CAP-03 and C002-CAP-05 maps to a step; per Copilot enforcement mode, one step per
// C002-TS-516 row with its status, Version text and Fix; the run order of C002-IF-009 §4 "Run order"
// (install part first, the hooks-off rows before the restore step, the restore before the
// true-and-trusted row, that row directly before the hooks-state step, every hook-decided step after
// it); the rerun rule; the hooks-state step with its three sources in both modes; the template's
// `hooks_state` and `hooks_sources` in both modes. Spec files are found through the locator.
// The checklist run itself is C002-TC-901 (P-01, C002-T-050); C002-TC-358 and C002-TC-516 are its steps.
// C002-T-064: the revised C002-TS-617 Then lines (boundary step `sdd-mcp-server`, delegated edit `both`,
// C002-TS-358 in each mode), and the supporting checks of C002-TC-516 (the `VS Code refused: ` pass rule
// of VSC-04 and VSC-06) and C002-TC-618 (the rerun rule with `earlier_results` and its causes, the
// template's `earlier_results` example). C002-T-066 (revision D-026/D-027): the `models_used` Then line
// of C002-TS-617 and the template check of C002-TC-618 (`models_used` with the key `sdd-conductor`).
// C002-T-080 (revision D-051 … D-053, VS Code 1.145.2): the revised C002-TS-617 and C002-TS-619 (question
// tool `askQuestions`, `chat.autoReply`, MCP servers on first use, the delegated-edit step's conductor
// refusal and default-agent probe with `agent_type: present | absent`, `models_used` from the reply
// footer), the `/architect:<name>` form, the step-index modes of VSC-25 and VSC-26 and C002-TC-618's
// template checks (VSC-20, VSC-27, VSC-28 and VSC-29 fields, the A-5 row). C002-T-083 (C002-T-050 run of
// 2026-11-12): VSC-15 in the prompt-file form only across both conductor copies and the prompt file
// (C002-TC-617), the revised assumption A-2 and the conductor copy in VSC-02 and the template (C002-TC-618).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";
import { specFile } from "../../helpers/spec-file.ts";

type Mode = "sdd-mcp-server" | "copilot-hooks";
const MODES: Mode[] = ["sdd-mcp-server", "copilot-hooks"];
const MODE_TEXT: Record<string, Mode> = { "sdd MCP server enforcement": "sdd-mcp-server", "the Copilot hooks fallback": "copilot-hooks" };

const root = repoRoot();
const read = (rel: string) => readFileSync(join(root, rel), "utf8").replace(/\r\n?/g, "\n");
const CHECKLIST = read("docs/checklists/vscode-copilot.md");
const TEMPLATE = read("docs/checklists/records/TEMPLATE.md");
const FIXTURE = read("docs/checklists/fixtures/toy-planted-line.md");
const spec = (rel: string) => readFileSync(specFile("002", rel), "utf8").replace(/\r\n?/g, "\n");
const acceptance = (cap: string) => spec(`10-spec/20-capabilities/${cap}/acceptance.md`);

/** Element `i` of `a`, failing when it is missing. */
function at<T>(a: readonly T[], i: number, what = `element ${i}`): T {
  const v = a[i];
  assert.ok(v !== undefined, `missing ${what}`);
  return v;
}
/** Capture group 1 of a match, failing when there is none. */
function g1(m: RegExpMatchArray | null | undefined, what: string): string {
  const v = m?.[1];
  assert.ok(v !== undefined, `missing ${what}`);
  return v;
}

// --- the checklist -------------------------------------------------------------------------------

interface Step { id: string; group: number; mode: "both" | Mode; kind: string; hook: boolean; scenarios: string[]; title: string; body: string }

function steps(): Step[] {
  const sections = new Map<string, string>();
  // A step's section runs to the next `###` heading (the injection procedure has a heading of its own).
  const heads = [...CHECKLIST.matchAll(/^### (?:(VSC-\d\d) — )?.*$/gm)];
  heads.forEach((h, i) => {
    if (h[1] !== undefined) sections.set(h[1], CHECKLIST.slice(h.index, heads[i + 1]?.index));
  });
  return CHECKLIST.split("\n")
    .filter((l) => l.startsWith("| VSC-"))
    .map((l) => {
      const c = l.split("|").slice(1, -1).map((x) => x.trim());
      assert.equal(c.length, 7, l);
      const [id, group, mode, kind, hook, scenarios, title] = c as [string, string, string, string, string, string, string];
      assert.ok(["both", ...MODES].includes(mode), `${id}: mode ${mode}`);
      assert.ok(hook === "yes" || hook === "no", `${id}: hook ${hook}`);
      return { id, group: Number(group), mode: mode as Step["mode"], kind, hook: hook === "yes", scenarios: scenarios.split(/,\s*/), title, body: sections.get(id) ?? "" };
    });
}
const STEPS = steps();
const inMode = (m: Mode) => STEPS.filter((s) => s.mode === "both" || s.mode === m);
const field = (s: Step, name: string) => new RegExp(`^- \\*\\*${name}:\\*\\* (.*)$`, "m").exec(s.body)?.[1];
const code = (v: string | undefined) => (v === undefined ? undefined : v === "empty" ? "" : /^`([^`]*)`$/.exec(v)?.[1]);

// --- the spec ------------------------------------------------------------------------------------

interface Scenario { id: string; tags: string[] }

/** The scenarios of an acceptance file with their tags (the `@…` lines of their gherkin block). */
function scenarios(text: string): Scenario[] {
  return [...text.matchAll(/```gherkin\n([\s\S]*?)```/g)].flatMap((b) => {
    const block = g1(b, "gherkin block");
    const tags = block.split("\n").filter((l) => l.trim().startsWith("@")).flatMap((l) => l.trim().split(/\s+/));
    return [...block.matchAll(/Scenario(?: Outline)?: (C002-TS-\d+)/g)].map((m) => ({ id: g1(m, "scenario ID"), tags }));
  });
}

/** The Examples rows of C002-TS-516 by mode, in their order. */
function ts516Rows(): { mode: Mode; state: string; status: string; version: string; fix: string }[] {
  const found = [...acceptance("CAP-05-cli-distribution").matchAll(/```gherkin\n([\s\S]*?)```/g)].find((b) => b[1]?.includes("C002-TS-516"));
  const block = g1(found, "the C002-TS-516 block");
  const rows = block.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|")).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
  const head = at(rows, 0, "Examples header");
  const col = (r: string[], n: string) => at(r, head.indexOf(n), `column ${n}`);
  return rows.slice(1).map((r) => {
    const fix = col(r, "fix");
    const mode = MODE_TEXT[col(r, "mode")];
    assert.ok(mode !== undefined, `mode ${col(r, "mode")}`);
    return {
      mode,
      state: col(r, "state"),
      status: col(r, "status"),
      version: col(r, "version"),
      fix: /^its Fix column is empty$/.test(fix) ? "" : g1(/^its Fix column holds "(.*)"$/.exec(fix), "Fix text"),
    };
  });
}

const OK_VERSION = "chat.useHooks on; profile and .code-workspace settings, Workspace Trust and organisation policy not read, confirmed by the manual VS Code checklist";

// --- step list -----------------------------------------------------------------------------------

test("the step index and the step sections hold the same IDs, numbered in index order", () => {
  assert.ok(STEPS.length > 0);
  assert.deepEqual(STEPS.map((s) => s.id), STEPS.map((_, i) => `VSC-${String(i + 1).padStart(2, "0")}`));
  assert.deepEqual([...CHECKLIST.matchAll(/^### (VSC-\d\d) — /gm)].map((m) => m[1]), STEPS.map((s) => s.id));
  for (const s of STEPS) assert.ok(/\*\*(Do|Case):\*\*/.test(s.body), `${s.id}: no Do or Case`);
});

test("every @manual-vscode scenario of CAP-02, CAP-03 and CAP-05 maps to a step of its mode", () => {
  const manual = ["CAP-02-opencode-target", "CAP-03-copilot-target", "CAP-05-cli-distribution"].flatMap((c) => scenarios(acceptance(c))).filter((s) => s.tags.includes("@manual-vscode"));
  // The cases that C002-TC-901 runs (test plan §8).
  const tc901 = [216, 218, 220, 309, 313, 317, 318, 319, 321, 329, 335, 358, 508, 516].map((n) => `C002-TS-${n}`);
  assert.deepEqual(manual.map((s) => s.id).sort(), tc901);
  for (const sc of manual) {
    const mapped = STEPS.filter((s) => s.scenarios.includes(sc.id));
    assert.ok(mapped.length > 0, `${sc.id} maps to no step`);
    for (const [tag, mode] of [["@mode-server", "sdd-mcp-server"], ["@mode-hooks", "copilot-hooks"]] as const)
      if (sc.tags.includes(tag)) assert.ok(mapped.some((s) => s.mode === "both" || s.mode === mode), `${sc.id} (${tag}) has no step under ${mode}`);
  }
});

test("the checklist names the tested versions and the enforcement mode of the Copilot mapping table", () => {
  const table = JSON.parse(read("plugins/architect/targets/copilot.json")) as { enforcement_mode: string; host: { tested_versions: Record<string, string> } };
  assert.ok(CHECKLIST.includes(`\`${table.host.tested_versions["vscode"]}\``));
  assert.ok(CHECKLIST.includes(`\`${table.host.tested_versions["copilot-chat"]}\``));
  assert.ok(CHECKLIST.includes(`today \`${table.enforcement_mode}\``));
  assert.ok(/\*\*Session type:\*\* \*\*Local\*\*/.test(CHECKLIST));
});

// --- C002-TS-516 rows and the run order, per mode --------------------------------------------------

for (const mode of MODES) {
  test(`${mode}: one step per C002-TS-516 row, with its status, Version text and Fix`, () => {
    const rows = ts516Rows().filter((r) => r.mode === mode);
    assert.equal(rows.length, 3);
    const rowSteps = inMode(mode).filter((s) => s.kind === "hooks-row");
    assert.equal(rowSteps.length, rows.length);
    rows.forEach((r, i) => {
      const s = at(rowSteps, i, `hooks-row step ${i}`);
      assert.equal(s.mode, mode, `${s.id} applies to ${s.mode}`);
      assert.ok(s.scenarios.includes("C002-TS-516"), s.id);
      assert.equal(field(s, "Row"), r.state, `${s.id} row`);
      assert.equal(code(field(s, "Expected status")), r.status, `${s.id} status`);
      assert.equal(code(field(s, "Expected Version")), r.version, `${s.id} Version`);
      assert.equal(code(field(s, "Expected Fix")), r.fix, `${s.id} Fix`);
    });
    // The `ok` Version text is the caveat of C002-IF-006 §2, as the doctor's wiring shows it.
    for (const r of rows.filter((x) => x.status === "ok")) {
      assert.equal(r.version, OK_VERSION);
      assert.ok(r.version.includes("profile and .code-workspace settings"));
    }
    assert.ok(read("plugins/architect/targets/copilot/wiring/doctor-report.md").includes(`Version \`${OK_VERSION}\``));
  });

  test(`${mode}: run order of C002-IF-009 §4 (install, hooks off, restore, true-and-trusted row, hooks state, the rest)`, () => {
    const order = inMode(mode);
    const line = new RegExp(`^Run order, ${mode}: (.*)$`, "m").exec(CHECKLIST);
    assert.deepEqual(g1(line, `run-order line for ${mode}`).split(/,\s*/), order.map((s) => s.id), "the run-order line is the index filtered to the mode");
    for (let i = 1; i < order.length; i++) {
      const [prev, cur] = [at(order, i - 1), at(order, i)];
      assert.ok(cur.group >= prev.group, `${cur.id} of group ${cur.group} after group ${prev.group}`);
    }
    const group = (g: number) => order.filter((s) => s.group === g);
    // Group 1: the install part, first.
    assert.ok(group(1).length > 0 && group(1).every((s) => s.kind === "install"));
    assert.ok(group(1).some((s) => s.body.includes("sdd install copilot")));
    assert.equal(at(order, 0).kind, "install");
    // Group 2: the chat.useHooks-false row, the restricted-mode row, then the restore step.
    const rows = ts516Rows().filter((r) => r.mode === mode);
    const [offRow, restrictedRow, trustedRow] = [at(rows, 0), at(rows, 1), at(rows, 2)];
    assert.deepEqual(group(2).map((s) => s.kind), ["hooks-row", "hooks-row", "restore"]);
    assert.deepEqual(group(2).slice(0, 2).map((s) => field(s, "Row")), [offRow.state, restrictedRow.state]);
    assert.ok(/chat\.useHooks.*false/.test(offRow.state) && /restricted mode/.test(restrictedRow.state));
    const restore = at(group(2), 2);
    assert.ok(/`chat\.useHooks` to true/.test(restore.body) && /trust the\s+workspace/.test(restore.body), "the restore step sets chat.useHooks true and trusts the workspace");
    // Group 3: the true-and-trusted row directly before the hooks-state step.
    assert.deepEqual(group(3).map((s) => s.kind), ["hooks-row", "hooks-state"]);
    const trueRow = at(group(3), 0);
    assert.equal(field(trueRow, "Row"), trustedRow.state);
    assert.ok(/true and the workspace is trusted/.test(trustedRow.state));
    const hs = order.findIndex((s) => s.kind === "hooks-state");
    assert.equal(at(order, hs - 1), trueRow);
    // Group 4: everything else, every hook-decided step after the hooks-state step.
    for (const s of order.slice(0, hs + 1)) assert.ok(!s.hook, `${s.id} is hook-decided but runs before the hooks-state step`);
    for (const s of order.filter((x) => ["delegated-edit", "guard-denial", "injection", "boundary", "roots"].includes(x.kind))) {
      assert.equal(s.group, 4, `${s.id} (${s.kind}) is not in group 4`);
      assert.ok(order.indexOf(s) > hs, `${s.id} before the hooks-state step`);
      assert.ok(s.hook, `${s.id} (${s.kind}) is not marked hook-decided`);
    }
    for (const s of order.filter((x) => /specialist|sdd-spec-writer|sdd-cartographer/.test(x.title + x.body) && x.group === 4)) assert.ok(s.hook, `${s.id}: a specialist writes or runs a command, so a hook decides it`);
  });

  test(`${mode}: the delegated-edit, roots and hooks-state steps are present`, () => {
    const kinds = inMode(mode).map((s) => s.kind);
    for (const k of ["delegated-edit", "roots", "hooks-state"]) assert.ok(kinds.includes(k), `${mode} has no ${k} step`);
  });
}

test("the rerun rule: a new restore step, then groups 3 and 4 again; the record in run order", () => {
  const rule = /\*\*Rerun rule\.\*\*([\s\S]*?)\n\n/.exec(CHECKLIST)?.[1] ?? "";
  assert.ok(rule.length > 0, "no rerun rule");
  const restore = STEPS.find((s) => s.kind === "restore")!;
  const hooksState = STEPS.find((s) => s.kind === "hooks-state")!;
  assert.ok(rule.includes(hooksState.id) && rule.includes(`${restore.id} again`), "the rule names the hooks-state and the restore step");
  assert.ok(/groups 3 and 4 again/.test(rule));
  assert.ok(/`chat\.useHooks`, Workspace Trust or an organisation policy/.test(rule));
  assert.ok(/record lists the steps in run order/.test(rule));
});

// --- C002-TS-617, C002-TS-619 ---------------------------------------------------------------------

test("C002-TS-617: the steps of the checklist content", () => {
  const one = (pred: (s: Step) => boolean, what: string) => {
    const s = STEPS.find(pred);
    assert.ok(s, `no step for ${what}`);
    return s;
  };
  const boundary = one((s) => s.kind === "boundary", "the sdd MCP server boundary");
  assert.ok(/outside `\.sdd\/`/.test(boundary.body) && /GUARD-PATH-001/.test(boundary.body) && /outside the allowlist/.test(boundary.body) && /GUARD-BASH-001/.test(boundary.body));
  const interview = one((s) => s.scenarios.includes("C002-TS-216"), "the interview round");
  assert.ok(/input shape of one `askQuestions` call/.test(interview.body), interview.id);
  const gate = one((s) => s.scenarios.includes("C002-TS-318"), "the skipped gate answer");
  const gateText = gate.body.replace(/\s+/g, " ");
  assert.ok(/`chat\.autoReply` to true/.test(gateText) && /result that `askQuestions` returned/.test(gateText), gate.id);
  assert.ok(/`selected`/.test(gateText) && /auto-reply text/.test(gateText) && /`approvals\.json` is unchanged/.test(gateText), gate.id);
  // Then 7: the MCP servers start when their first tool is used; Serena holds --context vscode.
  const servers = one((s) => /Workspace MCP servers/.test(s.title), "the MCP servers step");
  const serversText = servers.body.replace(/\s+/g, " ");
  assert.ok(/when (its|their) first tool is used/.test(serversText), serversText);
  assert.ok(/after `\/architect:status`/.test(serversText) && /after a step that uses Serena/.test(serversText) && /`--context vscode`/.test(serversText), servers.id);
  const install = one((s) => s.kind === "install" && s.body.includes("sdd install copilot --package"), "sdd install copilot");
  assert.ok(/P-03's terminal/.test(install.body));
  assert.ok(STEPS.some((s) => s.scenarios.includes("C002-TS-220")), "the toy change's creation");
  const revise = one((s) => s.scenarios.includes("C002-TS-218"), "Revise at G1");
  assert.ok(/\*\*Revise\*\*/.test(revise.body) && /Gate log of `change\.md` has a row `revise`/.test(revise.body) && /presented again/.test(revise.body));
  const revisePrompt = one((s) => /`\/architect:revise /.test(s.body), "the revise prompt");
  assert.ok(/`sdd status`/.test(revisePrompt.body) && /`in-revision`/.test(revisePrompt.body));
  for (const s of STEPS.filter((x) => x.kind === "delegated-edit")) {
    assert.equal(s.mode, "both", `${s.id} applies to both modes (C002-IF-009 §4)`);
    assert.ok(s.scenarios.includes("C002-TS-358"));
    assert.ok(/`src\/app\.ts` (is )?unchanged/.test(s.body) && /GUARD-HOOK-002/.test(s.body) && /`general-purpose`/.test(s.body), s.id);
  }
  // Then 9 and 10 (critic CR-154, CR-155): the conductor's refusal, then the default-agent probe with both outcomes.
  const first = STEPS.find((s) => s.kind === "delegated-edit")!;
  assertDelegatedEdit(first);
});

/** The two parts of the delegated-edit step of C002-TS-617 / C002-TS-358 (revision D-052). */
function assertDelegatedEdit(s: Step): void {
  const b = s.body.replace(/\s+/g, " ");
  assert.ok(/no agent other than the nine Architect specialists/.test(b), `${s.id}: the conductor starts only the nine specialists`);
  assert.ok(/\*\*Conductor refusal/.test(b) && /\*\*Default-agent probe/.test(b), `${s.id}: both parts`);
  assert.ok(/default agent/.test(b) && /`runSubagent`/.test(b) && /`general-purpose`/.test(b), `${s.id}: the probe starts general-purpose through runSubagent`);
  assert.ok(/"GitHub Copilot Chat Hooks"/.test(b) && /PreToolUse/.test(b), `${s.id}: the probe's hook input is read from the hooks log`);
  assert.ok(/`agent_type: present`/.test(b) && /`agent_type: absent`/.test(b), `${s.id}: both recorded values`);
  assert.ok(/GUARD-HOOK-002/.test(b) && /GUARD-HOOK-001/.test(b) && /Copilot subagent guard hook/.test(b), `${s.id}: the denial where agent_type is present`);
  assert.ok(/`git checkout -- src\/app\.ts`/.test(b) && /known limitation of (defect )?D-052/.test(b), `${s.id}: the revert where agent_type is absent`);
}

test("the planted line of C002-TS-358 is in the fixture file, which the delegated-edit steps name", () => {
  const planted = g1(/the planted line "([^"]+)"/.exec(acceptance("CAP-03-copilot-target")), "the planted line of C002-TS-358");
  assert.ok(FIXTURE.includes(`\n${planted}\n`), "the fixture holds the planted line on a line of its own");
  for (const s of STEPS.filter((x) => x.kind === "delegated-edit" && x.scenarios.includes("C002-TS-358"))) assert.ok(s.body.includes("fixtures/toy-planted-line.md") || /repeat VSC-27/.test(s.body), s.id);
});

for (const [modeText, mode] of Object.entries(MODE_TEXT)) {
  test(`C002-TS-619 (${modeText}): the hooks-state step with its three sources, and the denial step`, () => {
    const all = inMode(mode).filter((s) => s.kind === "hooks-state");
    assert.equal(all.length, 1);
    const hs = at(all, 0);
    assert.equal(hs.mode, "both");
    for (const src of ["`chat.useHooks`", "Workspace Trust", "organisation policy", "`use_hooks`", "`workspace_trust`", "`policy`", "`on`", "`off`", "`trusted`", "`untrusted`", "`none`", "`disables`", "`hooks_state`", "`hooks_sources`"])
      assert.ok(hs.body.includes(src), `the hooks-state step does not name ${src}`);
    assert.ok(/`enabled` exactly when\s+they read `on`, `trusted` and `none`/.test(hs.body));
    if (mode === "sdd-mcp-server") {
      const de = inMode(mode).find((s) => s.kind === "delegated-edit" && s.scenarios.includes("C002-TS-619"));
      assert.ok(de, "the delegated-edit step of C002-TS-619");
      // The refusal check and the default-agent probe, whose hook denial is expected only where its PreToolUse input carries agent_type.
      assertDelegatedEdit(de);
      assert.ok(/[Ww]here (that subagent's|the probe's|its) PreToolUse input carries `agent_type`/.test(de.body.replace(/\s+/g, " ")), de.id);
    } else {
      // The mode is not offered for VS Code 1.145.2, whose record gives its steps not-applicable.
      assert.ok(/Copilot hooks fallback is not offered for VS Code 1\.145\.2/.test(CHECKLIST.replace(/\s+/g, " ")), "the checklist states that the hooks fallback is not offered for VS Code 1.145.2");
      const gds = inMode(mode).filter((s) => s.kind === "guard-denial");
      assert.equal(gds.length, 1);
      const gd = at(gds, 0);
      assert.equal(gd.mode, "copilot-hooks");
      assert.ok(gd.scenarios.includes("C002-TS-619") && gd.scenarios.includes("C002-TS-313"));
      assert.ok(/to `src\/app\.ts`/.test(gd.body) && /denied by a hook/.test(gd.body));
      assert.ok(/PreToolUse hook input carries `agent_type`/.test(gd.body.replace(/\s+/g, " ")), `${gd.id}: for a VS Code that sends agent_type`);
    }
  });
}

// --- C002-TS-616, C002-TS-632: injection steps ---------------------------------------------------

test("C002-TS-616 / C002-TS-632: one injection step per Copilot injection case, after the hooks-state step", () => {
  const cases = [...new Set([...read("evals/injection/injection.eval.mjs").matchAll(/"(INJ-\d\d)"/g)].map((m) => g1(m, "case ID")))];
  assert.ok(cases.length >= 20, `${cases.length} injection cases`);
  const inj = STEPS.filter((s) => s.kind === "injection");
  assert.deepEqual(inj.map((s) => /INJ-\d\d/.exec(s.title)?.[0]), cases);
  for (const s of inj) {
    assert.equal(s.mode, "copilot-hooks", s.id);
    assert.ok(s.body.includes(`**Case:** ${/INJ-\d\d/.exec(s.title)![0]} — `), s.id);
  }
  const hooks = inMode("copilot-hooks");
  const hs = hooks.findIndex((s) => s.kind === "hooks-state");
  for (const s of inj) assert.ok(hooks.indexOf(s) > hs, `${s.id} before the hooks-state step`);
  // C002-REQ-613: under sdd MCP server enforcement the steps apply when Copilot CLI cannot load the package.
  assert.ok(/apply as well when the S-08 record gives\s+`copilot_cli_loads_package: false`/.test(CHECKLIST));
  const s08 = splitFrontmatter(read("docs/spikes/S-08-copilot-vscode.md")).data as { outcomes: { copilot_cli_loads_package: boolean } };
  assert.ok(CHECKLIST.includes(`The signed-off S-08 record gives\n\`copilot_cli_loads_package: ${String(s08.outcomes.copilot_cli_loads_package)}\``), "the checklist states the S-08 record's value");
});

test("every assumption of the table maps to an existing step that applies in both modes", () => {
  const rows = CHECKLIST.split("\n").filter((l) => /^\| A-\d \|/.test(l)).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
  assert.equal(rows.length, 8);
  for (const row of rows) {
    const [id, stepIds] = [at(row, 0), at(row, 3)];
    for (const sid of stepIds.split(/,\s*/)) {
      const s = STEPS.find((x) => x.id === sid);
      assert.ok(s, `${id}: no step ${sid}`);
      assert.equal(s.mode, "both", `${id}: ${sid} applies to ${s.mode}`);
      assert.ok(s.body.includes(`assumption ${id}`) || s.body.includes(`assumptions ${id}`), `${sid} does not name ${id}`);
    }
  }
});

// --- the record template (C002-IF-009 §4, C002-REQ-615, C002-TS-618) -------------------------------

test("the record template parses and carries the fields of C002-IF-009 §4, hooks_state and hooks_sources in both modes", () => {
  const doc = splitFrontmatter(TEMPLATE);
  assert.equal(doc.error, undefined);
  const fm = doc.data!;
  const section = g1(/## §4 Checklist and checklist record([\s\S]*?)\n## §5/.exec(spec("10-spec/50-interfaces/verification-records.md")), "C002-IF-009 §4");
  const example = parseYaml(g1(/```yaml\n---\n([\s\S]*?)---\n```/.exec(section), "the record frontmatter of §4")) as Record<string, unknown>;
  for (const k of Object.keys(example)) assert.ok(k in fm, `the template lacks ${k}`);
  assert.equal(fm["checklist"], "docs/checklists/vscode-copilot.md");
  assert.equal(fm["session_type"], "Local");
  assert.deepEqual(Object.keys(fm["host_versions"] as object), Object.keys(example["host_versions"] as object));
  assert.deepEqual(Object.keys(fm["hooks_sources"] as object), ["use_hooks", "workspace_trust", "policy"]);
  assert.ok(/^hooks_state: .*# both modes/m.test(doc.raw!) && /^hooks_sources: .*# both modes/m.test(doc.raw!), "hooks_state and hooks_sources are marked as required in both modes");
  assert.ok(/required in \*\*both\*\* Copilot enforcement modes/.test(TEMPLATE));
  const recorded = fm["steps"] as { id: string; result: string; injection_case?: string; observed?: string }[];
  assert.deepEqual(recorded.map((s) => s.id), STEPS.map((s) => s.id), "every step once, in checklist order");
  for (const s of recorded) assert.ok(/passed/.test(s.result) && /failed/.test(s.result) && /not-applicable/.test(s.result), s.id);
  for (const s of STEPS.filter((x) => x.kind === "injection")) assert.equal(recorded.find((r) => r.id === s.id)!.injection_case, /INJ-\d\d/.exec(s.title)![0]);
  // The observations the record keeps: ask_user input shape and no-choice result, the roots path,
  // the offered agents and agent_type of the delegated edit.
  const observed = (pred: (s: Step) => boolean) => STEPS.filter(pred).map((s) => recorded.find((r) => r.id === s.id)!);
  for (const r of [
    ...observed((s) => s.kind === "roots" || s.kind === "delegated-edit"),
    ...observed((s) => ["C002-TS-216", "C002-TS-317", "C002-TS-318"].some((t) => s.scenarios.includes(t))),
  ]) assert.ok(typeof r.observed === "string" && r.observed.length > 0, `${r.id} has no observed field`);
  for (const k of ["executed_by", "date", "package_version", "enforcement_mode"]) assert.ok(typeof fm[k] === "string", k);
});

// --- C002-T-064: the revised C002-TS-617 Then lines, and the checklist text of C002-TC-516 and C002-TC-618 ---

test("C002-TS-617 Then 1: the sdd MCP server boundary step (write outside .sdd/, command outside the allowlist) has the mode sdd-mcp-server in the step index", () => {
  const boundary = STEPS.filter((s) => s.kind === "boundary");
  assert.equal(boundary.length, 1);
  const s = at(boundary, 0);
  assert.equal(s.mode, "sdd-mcp-server", `${s.id} applies to ${s.mode}`);
  assert.ok(/outside `\.sdd\/`/.test(s.body) && /outside the allowlist/.test(s.body), s.id);
});

test("C002-TS-617 Then 9: the delegated-edit step of C002-TS-358 has the mode both; C002-TS-358, an outline over both modes without a mode tag, maps to a step of each mode", () => {
  const de = STEPS.filter((s) => s.kind === "delegated-edit" && s.scenarios.includes("C002-TS-358"));
  assert.ok(de.length > 0);
  for (const s of de) assert.equal(s.mode, "both", s.id);
  const ts358 = scenarios(acceptance("CAP-03-copilot-target")).find((s) => s.id === "C002-TS-358");
  assert.ok(ts358, "C002-TS-358 is in the CAP-03 acceptance file");
  assert.ok(!ts358.tags.includes("@mode-server") && !ts358.tags.includes("@mode-hooks"), "no mode tag");
  for (const mode of MODES) assert.ok(inMode(mode).some((s) => s.scenarios.includes("C002-TS-358")), `C002-TS-358 has no step under ${mode}`);
});

// --- C002-T-066 (revision D-026/D-027): models_used in the fresh-install step and the record template ---

// C002-T-067 (defect D-028 items 1 and 2): the two instructions sit in the Record of the install step
// VSC-02, which runs `sdd install copilot` and opens the conductor chat (C002-IF-009 §4 Models used).
/** The install step that runs `sdd install copilot` and opens the conductor chat, and its Record text. */
function vsc02(): { id: string; record: string } {
  const install = STEPS.filter((s) => s.kind === "install" && s.body.includes("sdd install copilot --package"));
  assert.equal(install.length, 1);
  const step = at(install, 0);
  assert.equal(step.id, "VSC-02", "the install step that runs sdd install copilot is VSC-02");
  assert.match(step.body.replace(/\s+/g, " "), /select `sdd-conductor` as the session agent/, "VSC-02 opens the conductor chat");
  return { id: step.id, record: (/- \*\*Record:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(step.body)?.[1] ?? "").replace(/\s+/g, " ") };
}

test("C002-TS-617 Then 5: the Record of VSC-02 instructs P-01 to fill models_used from the turns of the toy-change steps, with at least the model ID VS Code showed for the turns of sdd-conductor, or not shown", () => {
  const { record } = vsc02();
  assert.ok(/for the turns of `sdd-conductor` in this chat and in the toy-change steps that follow/.test(record), record);
  assert.ok(/record in `models_used` under the key `sdd-conductor` the model ID that VS Code showed in the reply footer of those turns, or `not shown`/.test(record), record);
  // Revision D-053: a new window starts on "Auto", so P-01 picks a model in the picker.
  assert.ok(/pick a model in the chat's model picker in place of "Auto"/.test(record), record);
  assert.deepEqual(STEPS.map((s) => s.id), STEPS.map((_, i) => `VSC-${String(i + 1).padStart(2, "0")}`), "no step added, removed or renumbered");
});

test("C002-TS-617 Then 6: the Record of VSC-02 instructs P-01 to write into the note of VSC-02 whether VS Code showed the model where the install notes say it does, or where it showed it instead", () => {
  const { record } = vsc02();
  assert.ok(/in this step's `note` whether VS Code showed the model in the reply footer, where `INSTALL\.md` says it does, or where it showed it instead/.test(record), record);
  // The install notes name the chat's model picker (C002-IF-005 §5 Models; the reply footer since C002-T-079).
  const notes = read("plugins/architect/targets/copilot/install.md").replace(/\s+/g, " ");
  assert.ok(/model picker/.test(notes), "the install notes name the model picker");
  assert.ok(/footer of each reply names the model/.test(notes), "the install notes name the reply footer (C002-T-079)");
});

test("C002-TC-618 (template check): the record template holds models_used, a mapping with the key sdd-conductor, where C002-IF-009 §4 shows it", () => {
  const doc = splitFrontmatter(TEMPLATE);
  assert.equal(doc.error, undefined);
  const fm = doc.data!;
  const used = fm["models_used"] as Record<string, string>;
  assert.ok(used !== null && typeof used === "object" && !Array.isArray(used), "models_used is a mapping");
  assert.ok("sdd-conductor" in used, "the key sdd-conductor");
  assert.match(String(used["sdd-conductor"]), /not shown/);
  assert.ok(/^models_used: .*reply footer/m.test(doc.raw!), "models_used is read from the reply footer (revision D-053)");
  const keys = Object.keys(fm);
  assert.equal(keys.indexOf("models_used"), keys.indexOf("hooks_sources") + 1, "after hooks_sources, as in C002-IF-009 §4");
  assert.equal(keys.indexOf("executed_by"), keys.indexOf("models_used") + 1, "before executed_by, as in C002-IF-009 §4");
});

test("C002-TC-516 (supporting): VSC-04 and VSC-06 state the VS Code refused pass rule of the restricted-mode rows", () => {
  const restricted = STEPS.filter((s) => s.kind === "hooks-row" && /restricted mode/.test(field(s, "Row") ?? ""));
  assert.deepEqual(restricted.map((s) => s.id), ["VSC-04", "VSC-06"]);
  for (const s of restricted) {
    const doText = (/- \*\*Do:\*\* ([\s\S]*?)\n- \*\*/.exec(s.body)?.[1] ?? "").replace(/\s+/g, " ");
    assert.ok(/VS Code itself refuses the chat or the doctor prompt/.test(doText), `${s.id}: ${doText}`);
    assert.ok(/no tool call of the package runs/.test(doText), s.id);
    assert.ok(doText.includes('`passed` with `note: "VS Code refused: <text as VS Code showed it>"`'), s.id);
    assert.ok(/`passed` only when the Copilot hooks row shows the status `ok`/.test(doText) && /empty Fix/.test(doText) && /otherwise record it `failed`, with the row as shown in `note`/.test(doText), s.id);
    assert.ok(!/record the step failed with what VS Code showed/.test(doText), `${s.id}: the earlier failed rule is gone`);
  }
});

test("C002-TC-618 (supporting): the rerun rule names earlier_results, its three causes and the third trigger; VSC-07 and VSC-10 record earlier runs there", () => {
  const rule = (/\*\*Rerun rule\.\*\*([\s\S]*?)\n\n/.exec(CHECKLIST)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(rule.includes("`earlier_results`"), rule);
  for (const cause of ["hooks-source-changed", "ran-before-hooks-state", "repeated"]) assert.ok(rule.includes(`\`${cause}\``), `${cause}: ${rule}`);
  assert.ok(/VSC-10 read a source off and P-01 put it right/.test(rule), "the third trigger");
  assert.ok(/never in a `note`/.test(rule), rule);
  const how = (/## How to run and record\n([\s\S]*?)\n## /.exec(CHECKLIST)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(how.includes("`earlier_results`") && /Never record an earlier run in a `note` only/.test(how), how);
  const record = (id: string) => (/- \*\*Record:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(STEPS.find((s) => s.id === id)!.body)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/`earlier_results`/.test(record("VSC-07")) && /`hooks-source-changed`/.test(record("VSC-07")) && /`ran-before-hooks-state`/.test(record("VSC-07")), record("VSC-07"));
  assert.ok(/earlier `failed` run of VSC-10/.test(record("VSC-10")) && /before the new restore step/.test(record("VSC-10")), record("VSC-10"));
});

test("C002-TC-618 (supporting): the record template has an earlier_results example with cause and the VS Code refused note of VSC-04 and VSC-06; no free-text rerun note remains", () => {
  const doc = splitFrontmatter(TEMPLATE);
  assert.equal(doc.error, undefined);
  const recorded = doc.data!["steps"] as { id: string; note?: string; earlier_results?: { result: string; cause: string; note?: string }[] }[];
  const withEarlier = recorded.filter((s) => s.earlier_results !== undefined);
  assert.ok(withEarlier.length >= 1, "an earlier_results example");
  for (const s of withEarlier) {
    assert.ok(Array.isArray(s.earlier_results) && s.earlier_results.length > 0, s.id);
    for (const e of s.earlier_results) {
      assert.ok(/passed/.test(e.result) && /failed/.test(e.result), `${s.id} result ${e.result}`);
      for (const cause of ["hooks-source-changed", "ran-before-hooks-state", "repeated"]) assert.ok(e.cause.includes(cause), `${s.id} cause ${e.cause}`);
      assert.ok("note" in e, `${s.id}: the optional note`);
    }
  }
  for (const id of ["VSC-04", "VSC-06"]) assert.ok(recorded.find((s) => s.id === id)?.note?.startsWith("VS Code refused: "), id);
  assert.ok(!/with a `note` naming the earlier run/.test(TEMPLATE), "no free-text rerun note");
  assert.ok(/Never name an earlier run in a free-text `note`/.test(TEMPLATE));
});

test("C002-TS-319 (supporting): VSC-15 expects the text fallback, with no INSTALL.md step and no enable step (revision D-037)", () => {
  const s = STEPS.find((x) => x.id === "VSC-15")!;
  assert.deepEqual([s.group, s.mode, s.kind, s.hook, s.scenarios], [4, "both", "scenario", false, ["C002-TS-319"]]);
  const expect = (/- \*\*Expect:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(s.body)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/as plain text/.test(expect) && /recommended option first/.test(expect) && /ends its turn/.test(expect), expect);
  assert.ok(/No change folder `\.sdd\/<NNN>-\*` is created until you answer/.test(expect), expect);
  // The Expect states both absences in one sentence; outside it, it names no INSTALL.md step and no enable step.
  const absent = "The reply names no `INSTALL.md` step and does not tell you to enable, install or switch on `askQuestions`, `ask_user` or another question tool.";
  assert.ok(expect.includes(absent), expect);
  const rest = expect.replace(absent, "");
  assert.ok(!/INSTALL\.md/.test(rest), "no INSTALL.md step");
  assert.ok(!/\b(?:enable|install|switch on|turn on)/i.test(rest), "no enable step");
});

// --- C002-T-080 (revision D-051 … D-053): VS Code 1.145.2 ---------------------------------------------

const stepText = (id: string) => STEPS.find((s) => s.id === id)!.body.replace(/\s+/g, " ");

test("C002-T-080: every slash command of the checklist is in the /architect:<name> form; VSC-12 records a bare /init", () => {
  const names = ["doctor", "init", "new", "status", "ideate", "specify", "plan", "gate", "revise", "decide", "research", "lint", "archive"];
  const flat = CHECKLIST.replace(/\s+/g, " ");
  const bare = [...flat.matchAll(new RegExp(`\`/(${names.join("|")})\\b`, "g"))];
  // The one bare form allowed is VS Code's own built-in /init ("a bare `/init`", "built-in `/init`").
  for (const m of bare) assert.ok(m[0] === "`/init" && /(bare|built-in) $/.test(flat.slice(Math.max(0, m.index - 9), m.index)), `bare ${m[0]}: …${flat.slice(Math.max(0, m.index - 40), m.index + 10)}`);
  const vsc12 = stepText("VSC-12");
  for (const c of ["/architect:doctor", "/architect:new", "/architect:init"]) assert.ok(vsc12.includes(`\`${c}\``), c);
  assert.ok(/whether a bare `\/init` resolves to VS Code's built-in/.test(vsc12), vsc12);
  for (const id of ["VSC-13", "VSC-14"]) assert.ok(/`\/architect:(doctor|init)`/.test(stepText(id)), id);
});

test("C002-T-080: the step-index modes of VSC-25 and VSC-26 stay copilot-hooks and are recorded not-applicable on a build without agent_type", () => {
  for (const id of ["VSC-25", "VSC-26"]) {
    const s = STEPS.find((x) => x.id === id)!;
    assert.equal(s.mode, "copilot-hooks", id);
    assert.ok(/`not-applicable`/.test(s.body) && /no `agent_type`/.test(s.body.replace(/\s+/g, " ")), `${id}: not-applicable without agent_type`);
  }
  const note = (/\*\*Steps of the Copilot hooks fallback on VS Code 1\.145\.2\.\*\*([\s\S]*?)\n\n/.exec(CHECKLIST)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/VSC-25/.test(note) && /VSC-26/.test(note) && /C002-TS-313/.test(note) && /C002-TS-335/.test(note) && /`not-applicable`/.test(note), note);
});

test("C002-T-080: VSC-15, VSC-18, VSC-20 … VSC-23, VSC-28, VSC-29 and VSC-54 carry the revised question tool, tool ids and fallbacks", () => {
  const v15 = stepText("VSC-15");
  // C002-T-083 (C002-T-050 run of 2026-11-12): the prompt-file form only, no plain request (C002-TC-617, below).
  assert.ok(/`askQuestions`/.test(v15) && /`ask_user`/.test(v15) && /`\.github\/agents\/sdd-conductor\.agent\.md`/.test(v15) && /prompt file/.test(v15) && !/plain request/i.test(v15), v15);
  const v18 = stepText("VSC-18");
  // C002-T-082 (defect D-054): the three tools entries, and the dialogs come from vscode_askQuestions.
  assert.ok(/`ask_user`, `askQuestions` and `vscode\/askQuestions`/.test(v18) && /`vscode_askQuestions`/.test(v18) && /D-054/.test(v18), v18);
  const v20 = stepText("VSC-20");
  assert.ok(/`chat\.autoReply`/.test(v20) && /free-text half/.test(v20) && /Keep the CSV export out of v1/.test(v20) && /both halves pass/.test(v20) && /one round/.test(v20) && /`selected: \[\]`/.test(v20), v20);
  const v23 = stepText("VSC-23");
  assert.ok(/`mcp_<command>\[N\]_<tool>`/.test(v23) && /`tool_name`/.test(v23) && /hooks log/.test(v23), v23);
  for (const id of ["VSC-22", "VSC-54"]) assert.ok(/`runSubagent`/.test(stepText(id)) && /`agentName: sdd-spec-writer`/.test(stepText(id)), id);
  assert.ok(/`explore_subagent`/.test(stepText("VSC-54")));
  assert.ok(/JSON/.test(stepText("VSC-21")) && /"GitHub Copilot Chat Hooks"/.test(stepText("VSC-21")));
  assert.ok(/`chat\.autoReply`/.test(stepText("VSC-29")));
  const v28 = stepText("VSC-28");
  assert.ok(/assumption A-4/.test(v28) && /hooks log/.test(v28), v28);
});

test("C002-T-080: the assumption table and the S-08 fact mapping state the 1.145.2 results", () => {
  const row = (id: string) => CHECKLIST.split("\n").find((l) => l.startsWith(`| ${id} |`)) ?? "";
  assert.ok(/refuted/.test(row("A-5")) && /accepted/.test(row("A-5")) && /known limitation/.test(row("A-5")), row("A-5"));
  assert.ok(/`askQuestions`/.test(row("A-6")), row("A-6"));
  assert.ok(/when (its|their) first tool is used/.test(row("A-8")), row("A-8"));
  const fact = (f: string) => CHECKLIST.split("\n").find((l) => l.startsWith(`  | ${f} `)) ?? "";
  assert.ok(/refuted/.test(fact("F-4")) && /VSC-27/.test(fact("F-4")) && /VSC-54/.test(fact("F-4")), fact("F-4"));
  assert.ok(/refuted/.test(fact("F-5")) && /`askQuestions`/.test(fact("F-5")), fact("F-5"));
  assert.ok(/`mcp_<command>\[N\]_<tool>`/.test(fact("F-7")) && /VSC-23/.test(fact("F-7")), fact("F-7"));
});

test("C002-TC-618 (template check, revision D-051 … D-053): VSC-20, VSC-27, VSC-28 and VSC-29 fields; the A-5 row", () => {
  const doc = splitFrontmatter(TEMPLATE);
  assert.equal(doc.error, undefined);
  const recorded = doc.data!["steps"] as Record<string, unknown>[];
  const entry = (id: string) => recorded.find((s) => s["id"] === id)!;
  const v20 = entry("VSC-20");
  assert.ok(typeof v20["auto_reply_result"] === "string" && /chat\.autoReply true/.test(String(v20["auto_reply_result"])), "VSC-20 autoReply-true result");
  const ft = v20["free_text_half"] as Record<string, unknown>;
  assert.ok(ft && typeof ft === "object" && "result" in ft && "askquestions_result" in ft && "questions_log" in ft, "VSC-20 free-text half fields");
  assert.match(String(ft["askquestions_result"]), /selected: \[\]/);
  const v29 = entry("VSC-29");
  assert.ok(/chat\.autoReply true/.test(String(v29["auto_reply_result"])), "VSC-29 autoReply-true result");
  assert.ok(typeof v29["auto_reply_off"] === "string" && typeof v20["auto_reply_off"] === "string", "VSC-20 and VSC-29: chat.autoReply set back to false");
  for (const id of ["VSC-27", "VSC-28"]) {
    const e = entry(id);
    assert.ok(typeof e["conductor_refusal"] === "string", `${id} conductor_refusal`);
    const probe = e["probe"] as Record<string, unknown>;
    assert.ok(probe && typeof probe === "object", `${id} probe`);
    assert.match(String(probe["agent_type"]), /present/);
    assert.match(String(probe["agent_type"]), /absent/);
    assert.ok("deny_message" in probe && "git_revert" in probe, `${id} deny_message and git_revert`);
  }
  const t = TEMPLATE.replace(/\s+/g, " ");
  assert.ok(/A-5/.test(t) && /refuted, accepted/.test(t), "the A-5 row");
});

// --- C002-T-083 (C002-T-050 run of 2026-11-12): VSC-15 in the prompt-file form only; the conductor copy ---

test("C002-TC-617 (C002-T-083): VSC-15 edits both conductor copies and the prompt file, backs up the package files, reloads and restores; no plain request", () => {
  const v15 = stepText("VSC-15").replace(/\\/g, "/");
  assert.ok(/`<package folder>\/agents\/sdd-conductor\.agent\.md`/.test(v15), "the plugin conductor");
  assert.ok(/`\.github\/agents\/sdd-conductor\.agent\.md`/.test(v15), "the workspace conductor");
  assert.ok(/`<package folder>\/prompts\/new\.prompt\.md`/.test(v15), "the prompt file");
  assert.ok(/`ask_user`, `askQuestions` and `vscode\/askQuestions`/.test(v15), "the three entries");
  assert.ok(/`sdd-conductor\.agent\.md\.t050-backup`/.test(v15) && /`new\.prompt\.md\.t050-backup`/.test(v15), "the two package backups");
  assert.ok(/[Rr]eload the window/.test(v15), "a reload");
  assert.ok(/`git checkout -- \.github\/agents\/sdd-conductor\.agent\.md`/.test(v15) && /from their backups/.test(v15), "the restore");
  assert.ok(/`\/architect:new "Toy change"`/.test(v15), "the prompt-file form");
  assert.ok(!/plain request/i.test(v15) && !/[Aa]lternatively/.test(v15), "no plain-request alternative");
  assert.ok(!/which form ran/.test(v15), "no which-form clause");
  const record = (/- \*\*Record:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(STEPS.find((x) => x.id === "VSC-15")!.body)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/conductor copy/.test(record) && /Session agent/.test(record) && /only when its session used the other copy/.test(record) && /VSC-02/.test(record), record);
  assert.ok(/invocation form/.test(record) && /attached with `-a`/.test(record) && /slash command typed by P-01/.test(record), `VSC-15 invocation form: ${record}`);
  assert.ok(/D-032/.test(v15), "the history note names CHG-001 defect D-032");
});

test("C002-TC-617 (C002-T-083): assumption A-2 lets either conductor copy be the session agent and the record names the copy; VSC-02 Record asks for it", () => {
  const a2 = (CHECKLIST.split("\n").find((l) => l.startsWith("| A-2 |")) ?? "").replace(/\s+/g, " ");
  assert.ok(/\*\*Open half\*\*/.test(a2) && /\*\*Settled half\*\*/.test(a2), `both halves: ${a2}`);
  assert.ok(/starts the workspace specialists/.test(a2) && /VSC-22 records the session's copy and the started specialist/.test(a2) && /starts no specialist goes back to P-01/.test(a2), `open half: ${a2}`);
  assert.ok(/[Ee]ither conductor copy/.test(a2) && /session agent/.test(a2) && /Q-copilot-agentcopy-01/.test(a2), a2);
  const recordOf = (id: string) => (/- \*\*Record:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(STEPS.find((x) => x.id === id)!.body)?.[1] ?? "").replace(/\s+/g, " ");
  const v18 = recordOf("VSC-18");
  assert.ok(/invocation form/.test(v18) && /attached with `-a`/.test(v18) && /slash command typed by P-01/.test(v18), `VSC-18: ${v18}`);
  const v22 = recordOf("VSC-22");
  assert.ok(/conductor copy/.test(v22) && /`mode`/.test(v22) && /specialist that session started/.test(v22) && /starts no specialist, report it to P-01/.test(v22), `VSC-22: ${v22}`);
  assert.ok(/record names the copy/.test(a2) && /`mode`/.test(a2) && /VSC-02/.test(a2), a2);
  assert.ok(!/prompt files bind/.test(a2) && !/bind to it/.test(a2), a2);
  assert.ok(/slash commands/.test(a2), a2);
  const v02 = (/- \*\*Record:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(STEPS.find((x) => x.id === "VSC-02")!.body)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/conductor copy/.test(v02) && /`plugin` or `workspace`/.test(v02) && /`mode`/.test(v02), v02);
  assert.ok(!/prompt files bind/.test(CHECKLIST.replace(/\s+/g, " ")), "no binding claim left in the checklist");
});

test("C002-TC-618 (C002-T-083): the template's VSC-15 observed names the three files without plain request; VSC-02 note and the A-2 row carry the conductor copy", () => {
  const doc = splitFrontmatter(TEMPLATE);
  assert.equal(doc.error, undefined);
  const recorded = doc.data!["steps"] as Record<string, unknown>[];
  const entry = (id: string) => recorded.find((s) => s["id"] === id)!;
  const v15 = String(entry("VSC-15")["observed"]);
  assert.ok(!/plain request/i.test(v15), v15);
  assert.ok(/plugin conductor/.test(v15) && /workspace conductor/.test(v15) && /prompt file/.test(v15), v15);
  const v02 = String(entry("VSC-02")["note"]);
  assert.ok(/conductor copy/.test(v02) && /plugin \| workspace/.test(v02) && /mode/.test(v02), v02);
  const a2 = TEMPLATE.split("\n").find((l) => l.startsWith("| A-2 |")) ?? "";
  assert.ok(/either conductor copy/.test(a2) && /copy used/.test(a2), a2);
  assert.ok(/open half/.test(a2) && /settled half/.test(a2) && /VSC-22/.test(a2), `template A-2 both halves: ${a2}`);
  for (const id of ["VSC-15", "VSC-18"]) assert.ok(/invocation form: prompt attached with -a \| slash command typed by P-01/.test(String(entry(id)["note"])), `${id} note: invocation form`);
  assert.ok(/conductor copy: plugin \| workspace, only when it differs/.test(String(entry("VSC-15")["note"])), "VSC-15 copy only when it differs");
  const v22 = String(entry("VSC-22")["observed"]);
  assert.ok(/session's conductor copy/.test(v22) && /specialist that session started/.test(v22), v22);
});

// --- C002-T-084 (C002-T-050 run 3 of 2026-11-12; defects D-056, D-057): A-3 refuted, VSC-01 expects the
// entries shown, VSC-12 and VSC-13 expect Context7 and DeepWiki `ok`; the template follows them ---

test("C002-TC-617 (C002-T-084): A-3 reads refuted with the pre-install window and a history note; VSC-01 expects the Architect entries shown before the install", () => {
  const a3 = (CHECKLIST.split("\n").find((l) => l.startsWith("| A-3 |")) ?? "").replace(/\s+/g, " ");
  assert.ok(/[Rr]efuted on VS Code 1\.145\.2/.test(a3) && /D-056/.test(a3) && /Q-t050-a3-01/.test(a3) && /Q-t050-a3-02/.test(a3), a3);
  assert.ok(/also before the install/.test(a3) && /no guard hook/.test(a3) && /Registered before the install/.test(a3), `the pre-install window: ${a3}`);
  assert.ok(/History:/.test(a3) && /VS Code adds no agent, prompt file or skill from a registered package folder without `plugin\.json`/.test(a3), `the old statement kept as history: ${a3}`);
  const v01 = STEPS.find((s) => s.id === "VSC-01")!;
  const expect = (/- \*\*Expect:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(v01.body)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/no `plugin\.json` and no `hooks\.json` at its root yet/.test(expect), expect);
  assert.ok(/the agent picker and the slash-command list offer the Architect agents and prompt files/.test(expect), expect);
  assert.ok(!/neither the agent picker nor/.test(expect), "the old expectation is gone");
  const doText = (/- \*\*Do:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(v01.body)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/Use no Architect entry before the install/.test(doText), doText);
  const record = (/- \*\*Record:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(v01.body)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/twin profile's only `chat\.pluginLocations` entry/.test(record) && /no user prompt file/.test(record) && /no other plugin/.test(record), record);
});

test("C002-TC-617 (C002-T-084): VSC-13 names the TS-508 precondition and expects Context7 and DeepWiki ok with an empty Fix; VSC-12's doctor run shows the same", () => {
  const v13 = stepText("VSC-13");
  assert.ok(/`context7` and `deepwiki` of `\.vscode\/mcp\.json` are enabled/.test(v13) && /network access/.test(v13), v13);
  assert.ok(/the Context7 and DeepWiki rows have the status `ok` and an empty Fix/.test(v13), v13);
  assert.ok(/- \*\*Record:\*\* the host row and the Context7 and DeepWiki rows/.test(v13), v13);
  const v12 = stepText("VSC-12");
  assert.ok(/the Context7 and DeepWiki rows have the status `ok` and an empty Fix/.test(v12), v12);
  assert.ok(/the Context7 and DeepWiki rows of that doctor run as shown/.test(v12), v12);
});

test("C002-TC-618 (C002-T-084): the template's A-3 row is refuted with its reason; VSC-01, VSC-12 and VSC-13 placeholders follow the checklist; no targeted-retake placeholder", () => {
  const doc = splitFrontmatter(TEMPLATE);
  assert.equal(doc.error, undefined);
  const recorded = doc.data!["steps"] as Record<string, unknown>[];
  const entry = (id: string) => recorded.find((s) => s["id"] === id)!;
  const v01 = String(entry("VSC-01")["observed"]);
  assert.ok(/Architect agents and prompt files/.test(v01) && /no plugin\.json and no hooks\.json/.test(v01) && /only chat\.pluginLocations entry/.test(v01), v01);
  for (const id of ["VSC-12", "VSC-13"]) assert.ok(/Context7 and DeepWiki rows/.test(String(entry(id)["observed"])) && /expected ok, empty/.test(String(entry(id)["observed"])), `${id}: ${String(entry(id)["observed"])}`);
  const a3 = TEMPLATE.split("\n").find((l) => l.startsWith("| A-3 |")) ?? "";
  assert.ok(/\| refuted \(defect D-056/.test(a3) && /Registered before the install/.test(a3), a3);
  assert.ok(!/retake/i.test(TEMPLATE), "no targeted-retake placeholder (P-01's answer to Q-t050-retake-03)");
});

// --- C002-T-085 (defect D-058): VSC-20's free-text half while a phase of the toy change is open; the
// cause outside-narrowed-step in the checklist and the record template ----

test("C002-TC-617 (C002-T-085): VSC-20's free-text half runs while a phase of the toy change is open, never after an approval; its Record names the open phase and the cause outside-narrowed-step", () => {
  const v20 = stepText("VSC-20");
  const doText = (/- \*\*Do:\*\* (.*?) - \*\*Expect:\*\*/.exec(v20)?.[1] ?? "");
  for (const status of ["draft", "in-review", "in-revision"]) assert.ok(doText.includes(`\`${status}\``), `${status}: ${doText}`);
  assert.ok(/VSC-30 rework/.test(doText) && /inside VSC-31/.test(doText) && /Never after an approval/.test(doText), doText);
  assert.ok(!/during or after/.test(v20), "no 'during or after the VSC-30 rework'");
  assert.ok(/D-058/.test(v20) && /CHG-001 D-034/.test(v20), "the history note and the tracking defect");
  const record = (/- \*\*Record:\*\* (.*)$/.exec(v20)?.[1] ?? "");
  assert.ok(/open phase/.test(record) && /`00-ideation in-revision`/.test(record), record);
  assert.ok(/`outside-narrowed-step`/.test(record) && /`defect`/.test(record) && /`tracked_by`/.test(record) && /\(a\) … \(e\)/.test(record), record);
  assert.ok(!/during or after the VSC-30 rework/.test(CHECKLIST), "gone from the whole checklist");
});

test("C002-TC-617 (C002-T-085): the rerun rule and How to run and record name the cause outside-narrowed-step beside the three rerun causes; VSC-07's Record names it", () => {
  const rule = (/\*\*Rerun rule\.\*\*([\s\S]*?)\n\n/.exec(CHECKLIST)?.[1] ?? "").replace(/\s+/g, " ");
  for (const cause of ["hooks-source-changed", "ran-before-hooks-state", "outside-narrowed-step", "repeated"]) assert.ok(rule.includes(`\`${cause}\``), `${cause}: ${rule}`);
  assert.ok(/`defect`/.test(rule) && /`tracked_by`/.test(rule), rule);
  const how = (/## How to run and record\n([\s\S]*?)\n## /.exec(CHECKLIST)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/`outside-narrowed-step`/.test(how) && /`defect`/.test(how) && /`tracked_by`/.test(how) && /\(a\) … \(e\)/.test(how), how);
  assert.ok(/a `repeated` one included/.test(how), "repeated stays binding");
  assert.ok(/VSC-30, with the free-text half of VSC-20 typed during its rework/.test(how) && /inside VSC-31/.test(how), "the batch order of Who runs the steps");
  assert.ok(/`outside-narrowed-step`/.test(stepText("VSC-07")), stepText("VSC-07"));
});

test("C002-TC-618 (C002-T-085 template check): the cause outside-narrowed-step with defect, tracked_by and the note evidence (a) … (e); free_text_half has open_phase", () => {
  const doc = splitFrontmatter(TEMPLATE);
  assert.equal(doc.error, undefined);
  const recorded = doc.data!["steps"] as Record<string, unknown>[];
  const entry = (id: string) => recorded.find((s) => s["id"] === id)!;
  const example = (entry("VSC-07")["earlier_results"] as { cause: string }[])[0]!;
  assert.ok(example.cause.includes("outside-narrowed-step"), example.cause);
  const half = entry("VSC-20")["free_text_half"] as Record<string, string>;
  assert.ok(/draft, in-review or in-revision/.test(half["open_phase"] ?? "") && /00-ideation in-revision/.test(half["open_phase"] ?? ""), half["open_phase"]);
  assert.ok(/round/.test(half["questions_log"] ?? ""), half["questions_log"]);
  const guidance = TEMPLATE.replace(/\s+/g, " ");
  assert.ok(/- `outside-narrowed-step` \(C002-IF-009 §4 Earlier runs, Tries outside a narrowed step/.test(guidance), "the cause's guidance item");
  assert.ok(/`defect`/.test(guidance) && /`D-<NNN>`/.test(guidance) && /`D-058`/.test(guidance), "defect");
  assert.ok(/`tracked_by`/.test(guidance) && /`CHG-<NNN> D-<NNN>`/.test(guidance) && /`CHG-001 D-034`/.test(guidance), "tracked_by");
  for (const c of ["(a)", "(b)", "(c)", "(d)", "(e)"]) assert.ok(guidance.includes(c), c);
  assert.ok(/goes under `repeated`, which stays binding/.test(guidance));
  assert.ok(/tries outside a narrowed step \(cause outside-narrowed-step\)/.test(TEMPLATE), "the Notes placeholder");
  assert.ok(!/retake/i.test(TEMPLATE));
});
