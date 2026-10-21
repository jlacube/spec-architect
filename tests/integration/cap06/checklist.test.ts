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
  assert.ok(/input shape of one `ask_user` call/.test(interview.body));
  const gate = one((s) => s.scenarios.includes("C002-TS-318"), "the skipped gate answer");
  assert.ok(/result that `ask_user` returned/.test(gate.body));
  const install = one((s) => s.kind === "install" && s.body.includes("sdd install copilot --package"), "sdd install copilot");
  assert.ok(/P-03's terminal/.test(install.body));
  assert.ok(STEPS.some((s) => s.scenarios.includes("C002-TS-220")), "the toy change's creation");
  const revise = one((s) => s.scenarios.includes("C002-TS-218"), "Revise at G1");
  assert.ok(/\*\*Revise\*\*/.test(revise.body) && /Gate log of `change\.md` has a row `revise`/.test(revise.body) && /presented again/.test(revise.body));
  const revisePrompt = one((s) => /^\/revise|`\/revise /m.test(s.body), "the revise prompt");
  assert.ok(/`sdd status`/.test(revisePrompt.body) && /`in-revision`/.test(revisePrompt.body));
  for (const s of STEPS.filter((x) => x.kind === "delegated-edit")) {
    assert.equal(s.mode, "both", `${s.id} applies to both modes (C002-IF-009 §4)`);
    assert.ok(s.scenarios.includes("C002-TS-358"));
    assert.ok(/`src\/app\.ts` (is )?unchanged/.test(s.body) && /GUARD-HOOK-002/.test(s.body) && /`general-purpose`/.test(s.body), s.id);
  }
  const first = STEPS.find((s) => s.kind === "delegated-edit")!;
  assert.ok(/whether the host offered `general-purpose`/.test(first.body) && /`agent_type`/.test(first.body) && /denied by a hook/.test(first.body));
});

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
      assert.ok(de && /denied by a hook/.test(de.body) && /Copilot subagent guard hook/.test(de.body), "the delegated-edit step expects the edit denied by the Copilot subagent guard hook");
    } else {
      const gds = inMode(mode).filter((s) => s.kind === "guard-denial");
      assert.equal(gds.length, 1);
      const gd = at(gds, 0);
      assert.equal(gd.mode, "copilot-hooks");
      assert.ok(gd.scenarios.includes("C002-TS-619") && gd.scenarios.includes("C002-TS-313"));
      assert.ok(/to `src\/app\.ts`/.test(gd.body) && /denied by a hook/.test(gd.body));
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

test("C002-TS-617 Then 7: the delegated-edit step of C002-TS-358 has the mode both; C002-TS-358, an outline over both modes without a mode tag, maps to a step of each mode", () => {
  const de = STEPS.filter((s) => s.kind === "delegated-edit" && s.scenarios.includes("C002-TS-358"));
  assert.ok(de.length > 0);
  for (const s of de) assert.equal(s.mode, "both", s.id);
  const ts358 = scenarios(acceptance("CAP-03-copilot-target")).find((s) => s.id === "C002-TS-358");
  assert.ok(ts358, "C002-TS-358 is in the CAP-03 acceptance file");
  assert.ok(!ts358.tags.includes("@mode-server") && !ts358.tags.includes("@mode-hooks"), "no mode tag");
  for (const mode of MODES) assert.ok(inMode(mode).some((s) => s.scenarios.includes("C002-TS-358")), `C002-TS-358 has no step under ${mode}`);
});

// --- C002-T-066 (revision D-026/D-027): models_used in the fresh-install step and the record template ---

test("C002-TS-617 Then 5: the fresh-install step records in models_used the model ID VS Code showed for the turns of sdd-conductor, or not shown, and whether VS Code showed it where the install notes say", () => {
  const install = STEPS.filter((s) => s.kind === "install" && s.body.includes("sdd install copilot --package"));
  assert.equal(install.length, 1);
  const record = (/- \*\*Record:\*\* ([\s\S]*?)(?:\n- \*\*|\n### |$)/.exec(at(install, 0).body)?.[1] ?? "").replace(/\s+/g, " ");
  assert.ok(/record in `models_used` under the key `sdd-conductor` the model ID that VS Code showed for those turns, or `not shown`/.test(record), record);
  assert.ok(/for the turns of `sdd-conductor`/.test(record), record);
  assert.ok(/whether VS Code showed the model where `INSTALL\.md` says it does \(the chat's model picker\)/.test(record), record);
  // The install notes name the chat's model picker as that place (C002-IF-005 §5 Models).
  assert.ok(/the model that the chat's model picker shows for the session/.test(read("plugins/architect/targets/copilot/install.md").replace(/\s+/g, " ")));
  assert.deepEqual(STEPS.map((s) => s.id), STEPS.map((_, i) => `VSC-${String(i + 1).padStart(2, "0")}`), "no step added, removed or renumbered");
});

test("C002-TC-618 (template check): the record template holds models_used, a mapping with the key sdd-conductor, where C002-IF-009 §4 shows it", () => {
  const doc = splitFrontmatter(TEMPLATE);
  assert.equal(doc.error, undefined);
  const fm = doc.data!;
  const used = fm["models_used"] as Record<string, string>;
  assert.ok(used !== null && typeof used === "object" && !Array.isArray(used), "models_used is a mapping");
  assert.ok("sdd-conductor" in used, "the key sdd-conductor");
  assert.match(String(used["sdd-conductor"]), /not shown/);
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
