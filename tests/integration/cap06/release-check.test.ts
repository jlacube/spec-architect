// C002-T-047 — the release check (C002-IF-009 §5, C002-COMP-010) on fx-release evidence folders:
//   C002-TC-620 (C002-TS-620)  boundary evidence at release: replay differences and injection cases (OpenCode, both modes)
//   C002-TC-648 (C002-TS-648)  OpenCode refused when S-07 does not show a closed agent tool set (ERR-REL-013)
//   C002-TC-621 (C002-TS-621)  Copilot checklist record: all passed, one step failed, none
//   C002-TC-622 (C002-TS-622)  one target's refusal does not block the other
//   C002-TC-623 (C002-TS-623)  S-08 outcomes and the S-08 mode rule (ERR-REL-005)
//   C002-TC-624 (C002-TS-624)  host versions of the evidence (ERR-REL-006)
//   C002-TC-625 (C002-TS-625)  the hooks-fallback exception in the release record
//   C002-TC-633 (C002-TS-633)  the hooks-state check, every row of both Copilot modes (ERR-REL-010, -011, -002, -004)
//   C002-TC-637 (C002-TS-637)  incomplete replay reports (ERR-REL-012)
//   C002-TC-651 (C002-TS-651)  replay host capabilities (ERR-REL-012 `replay host lacks file-symlink`, ERR-REL-001)
//   C002-T-064: the PG-900 rows of C002-TC-637; C002-TC-668 (step check, 21 rows), C002-TC-669 (evidence
//   kinds of ERR-REL-009, the unreadable step index), C002-TC-670 (--dry-run), C002-TC-671 (exit codes and
//   output); the step index reader on the repository's checklist and on each unreadable condition
// plus: a target zip whose content differs from the regeneration (ERR-REL-007, C002-NFR-501), a package
// generated with --mode (ERR-REL-008), the committed replay reports pass the recomputation, the ERR-REL
// catalogue mirrors errors.md §3, and the script entry with --dry-run.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stringify } from "yaml";
import { splitCells } from "../../../src/model/blocks.ts";
import { main as generate } from "../../../scripts/generate/main.ts";
import { zipDir } from "../../../scripts/package.mjs";
import type { Target } from "../../../scripts/generate/tables.ts";
import { MECHANISMS_OF_MODE } from "../../../scripts/release/check.ts";
import { REL_CATALOGUE } from "../../../scripts/release/errors.ts";
import { readChecklistSteps } from "../../../scripts/release/evidence.ts";
import { main } from "../../../scripts/release/main.ts";
import { checkReport, loadCorpora, parseReport, type Corpus } from "../../../scripts/release/replay.ts";
import type { Mechanism } from "../../replay/expect.ts";
import { specFile } from "../../helpers/spec-file.ts";
import {
  caseOf,
  checklistRecord,
  cleanReport,
  cleanup,
  COPILOT_CLI,
  evidenceRoot,
  FX_VERSION,
  injectionSummary,
  packageVariant,
  PG_900,
  PG_901,
  RECORD_PATH,
  recount,
  ROOT,
  s07Record,
  s08Record,
  TODAY,
  type Evidence,
  type Package,
} from "./fx-release.ts";

after(cleanup);

interface Run {
  code: number;
  out: string[];
  err: string[];
  record: Record<string, any> | null;
}

/** Runs the check in process on `root` against the package variant `pkg`. */
function run(target: Target, root: string, pkg: Package, args: string[] = []): Run {
  const out: string[] = [];
  const err: string[] = [];
  const code = main(["--target", target, "--root", root, ...args], { stdout: (l) => void out.push(l), stderr: (l) => void err.push(l), check: { source: pkg.source, dist: pkg.dist, today: TODAY } });
  const file = join(root, "docs", "releases", target, FX_VERSION, "release.json");
  return { code, out, err, record: existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Record<string, any>) : null };
}

function check(e: Evidence, args: string[] = []): Run {
  const { root, pkg } = evidenceRoot(e);
  return run(e.variant.target, root, pkg, args);
}

const codes = (r: Run) => r.err.map((l) => l.slice(0, "ERR-REL-000".length));
function allowed(r: Run, what: string) {
  assert.deepEqual(r.err, [], `${what}: no refusal`);
  assert.equal(r.code, 0, what);
  assert.equal(r.record?.["outcome"], "released", what);
  assert.deepEqual(r.record?.["refusals"], [], what);
}
function refused(r: Run, what: string) {
  assert.equal(r.code, 1, `${what}: ${r.err.join("\n")}`);
  assert.equal(r.record?.["outcome"], "refused", what);
  assert.deepEqual(
    (r.record?.["refusals"] as { code: string; message: string }[]).map((x) => `${x.code}: ${x.message}`),
    r.err,
    `${what}: the record lists every printed refusal`,
  );
}

type R637 = ReturnType<typeof cleanReport>;
const OC_NATIVE = { target: "opencode", mode: "native-permissions" } as const;
const OC_SDD = { target: "opencode", mode: "sdd-mcp-server" } as const;
const CP_SDD = { target: "copilot", mode: "sdd-mcp-server" } as const;
const CP_HOOKS = { target: "copilot", mode: "copilot-hooks" } as const;
const flip = (id: string) => (r: ReturnType<typeof cleanReport>) => {
  const c = caseOf(r, id);
  c.actual = c.expected === "allow" ? "deny" : "allow";
  recount(r);
};

// --- C002-TC-620 ---------------------------------------------------------------------------------

test("C002-TC-620 (C002-TS-620): OpenCode boundary evidence at release, both modes", () => {
  for (const variant of [OC_NATIVE, OC_SDD]) {
    const r = check({ variant });
    allowed(r, `${variant.mode}, 0 differing, 0 acted upon`);
    const mech = MECHANISMS_OF_MODE[variant.mode][0] as Mechanism;
    const replay = r.record?.["evidence"]["replay"] as { mechanism: string; not_applicable: string[]; differing: number }[];
    assert.deepEqual(replay.map((x) => x.mechanism), [mech]);
    assert.equal(replay[0]?.differing, 0);
    // Not applicable: no case on the OpenCode rules, the identity-category cases on the sdd MCP server.
    if (variant.mode === "native-permissions") assert.deepEqual(replay[0]?.not_applicable, []);
    else assert.ok(replay[0]!.not_applicable.length > 0 && replay[0]!.not_applicable.includes("BG-258"));

    const diff = check({ variant, mutate: { [mech]: flip("PG-001") } });
    refused(diff, `${variant.mode}, 1 differing`);
    assert.deepEqual(diff.err, [`ERR-REL-001: opencode: corpus replay differs on PG-001 (${mech})`]);
  }
  const acted = check({ variant: OC_NATIVE, injection: injectionSummary("opencode", "opencode-runner", { opencode: "1.18.31" }, 20, ["INJ-03"]) });
  refused(acted, "1 injection case acted upon");
  assert.deepEqual(acted.err, ["ERR-REL-002: opencode: injection case INJ-03 acted upon"]);
});

// --- C002-TC-648 ---------------------------------------------------------------------------------

test("C002-TC-648 (C002-TS-648): OpenCode refused when S-07 does not show a closed agent tool set", () => {
  const rows = [
    { variant: OC_NATIVE, outcomes: { agent_tools_closed: false }, shown: "false" },
    { variant: OC_SDD, outcomes: { agent_tools_closed: false }, shown: "false" },
    { variant: OC_NATIVE, outcomes: { agent_tools_closed: undefined }, shown: "not recorded" },
  ];
  for (const row of rows) {
    const r = check({ variant: row.variant, s07: s07Record(row.variant.mode, { opencode: "1.18.31" }, row.outcomes) });
    refused(r, `${row.variant.mode}, ${row.shown}`);
    assert.deepEqual(r.err, [`ERR-REL-013: opencode: spike S-07 record docs/spikes/S-07-opencode.md shows agent_tools_closed ${row.shown}; the Architect agents' tool set is not closed`]);
  }
});

// --- C002-TC-621, C002-TC-622 --------------------------------------------------------------------

test("C002-TC-621 (C002-TS-621): Copilot checklist record at release", () => {
  const tested = packageVariant(CP_SDD).tested;
  allowed(check({ variant: CP_SDD }), "every step passed");
  const failed = check({ variant: CP_SDD, checklist: checklistRecord("sdd-mcp-server", tested, { failed: ["VSC-12"] }) });
  refused(failed, "one step failed");
  assert.deepEqual(failed.err, ["ERR-REL-004: copilot: checklist step VSC-12 is failed"]);
  assert.deepEqual(failed.record?.["evidence"]["checklist"]["failed_steps"], ["VSC-12"]);
  const none = check({ variant: CP_SDD, checklist: null });
  refused(none, "no checklist record");
  assert.deepEqual(none.err, [`ERR-REL-003: copilot: no checklist record for version ${FX_VERSION}`]);
  // A step of the package's mode that the record leaves out, or gives as not applicable, did not pass.
  const steps = checklistRecord("sdd-mcp-server", tested).replace(/\n {2}- id: VSC-23\n {4}result: passed/, "").replace(/(id: VSC-24\n {4}result: )passed/, "$1not-applicable");
  const gaps = check({ variant: CP_SDD, checklist: steps });
  // The step check of §5 (C002-T-064): the listed steps in record order, then the unlisted ones.
  assert.deepEqual(gaps.err, ["ERR-REL-004: copilot: checklist step VSC-24 is not-applicable", "ERR-REL-004: copilot: checklist step VSC-23 is not recorded"]);
});

test("C002-TC-622 (C002-TS-622): Copilot refused, OpenCode clean, in one evidence folder", () => {
  const oc = evidenceRoot({ variant: OC_SDD });
  const cp = evidenceRoot({ variant: CP_SDD, into: oc.root, checklist: checklistRecord("sdd-mcp-server", packageVariant(CP_SDD).tested, { failed: ["VSC-30"] }) });
  const copilot = run("copilot", cp.root, cp.pkg);
  refused(copilot, "copilot");
  assert.deepEqual(copilot.err, ["ERR-REL-004: copilot: checklist step VSC-30 is failed"]);
  allowed(run("opencode", oc.root, oc.pkg), "opencode");
});

// --- C002-TC-623 ---------------------------------------------------------------------------------

test("C002-TC-623 (C002-TS-623): S-08 outcomes", () => {
  const tested = packageVariant(CP_SDD).tested;
  const deferred = "ERR-REL-005: copilot: deferred by the spike S-08 record docs/spikes/S-08-copilot-vscode.md (no enforcement mode holds)";
  for (const outcomes of [{ subagent_tool_list_confined: false, guard_hooks_block_subagent_calls: false }, { subagent_tool_list_confined: false }]) {
    const r = check({ variant: CP_SDD, s08: s08Record("sdd-mcp-server", tested, outcomes) });
    refused(r, JSON.stringify(outcomes));
    assert.deepEqual(r.err, [deferred]);
    assert.equal(r.record?.["evidence"]["spike"]["enforcement_mode"], "deferred");
  }
  const confined = check({ variant: CP_SDD, s08: s08Record("sdd-mcp-server", tested, { subagent_tool_list_confined: true }) });
  allowed(confined, "confined, no guard-hook outcome");
  assert.equal(confined.record?.["evidence"]["spike"]["enforcement_mode"], "sdd-mcp-server");
  const hooks = check({ variant: CP_HOOKS, s08: s08Record("copilot-hooks", tested, { subagent_tool_list_confined: false, guard_hooks_block_subagent_calls: true }) });
  allowed(hooks, "guard hooks block");
  assert.equal(hooks.record?.["evidence"]["spike"]["enforcement_mode"], "copilot-hooks");
  // The signed-off record decides "allowed" (sdd-mcp-server).
  const signed = check({ variant: CP_SDD, s08: readFileSync(join(ROOT, "docs", "spikes", "S-08-copilot-vscode.md"), "utf8") });
  allowed(signed, "the signed-off S-08 record");
});

// --- C002-TC-624 ---------------------------------------------------------------------------------

test("C002-TC-624 (C002-TS-624): host version of the evidence", () => {
  const oc = { ...OC_NATIVE, tested: { opencode: "1.4.2" } };
  allowed(check({ variant: oc }), "OpenCode 1.4.2 everywhere");
  const replay = check({ variant: oc, mutate: { "opencode-permissions": (r) => void (r.host_versions = { opencode: "1.5.0" }) } });
  refused(replay, "replay on 1.5.0");
  assert.deepEqual(replay.err, [`ERR-REL-006: opencode: corpus replay docs/releases/opencode/${FX_VERSION}/replay-opencode-permissions.json ran on opencode 1.5.0, tested version is opencode 1.4.2`]);
  const inj = check({ variant: oc, injection: injectionSummary("opencode", "opencode-runner", { opencode: "1.4.1" }) });
  refused(inj, "injection on 1.4.1");
  assert.deepEqual(inj.err, [`ERR-REL-006: opencode: injection evals docs/releases/opencode/${FX_VERSION}/injection.json ran on opencode 1.4.1, tested version is opencode 1.4.2`]);
  const cp = { ...CP_SDD, tested: { vscode: "1.105.0", "copilot-chat": "0.32.0" } };
  const list = check({ variant: cp, checklist: checklistRecord("sdd-mcp-server", cp.tested, { host_versions: { vscode: "1.106.0", "copilot-chat": "0.32.0" } }) });
  refused(list, "checklist on VS Code 1.106");
  assert.deepEqual(list.err, [`ERR-REL-006: copilot: checklist record ${RECORD_PATH} ran on vscode 1.106.0, tested version is vscode 1.105.0`]);
  // The Copilot CLI runner's evidence is compared with the S-08 record's copilot-cli value.
  const cli = check({ variant: CP_SDD, injection: injectionSummary("copilot", "copilot-cli-runner", { "copilot-cli": "1.0.99" }) });
  assert.deepEqual(cli.err, [`ERR-REL-006: copilot: injection evals docs/releases/copilot/${FX_VERSION}/injection.json ran on copilot-cli 1.0.99, tested version is copilot-cli ${COPILOT_CLI}`]);
});

// --- C002-TC-625 ---------------------------------------------------------------------------------

test("C002-TC-625 (C002-TS-625): release record by Copilot enforcement mode", () => {
  const hooks = check({ variant: CP_HOOKS });
  allowed(hooks, "hooks fallback");
  assert.deepEqual(hooks.record?.["exception"], { decision: "C002-DEC-005", reason: "copilot-hooks fallback: the boundary is off whenever hooks are disabled" });
  assert.equal(hooks.record?.["enforcement_mode"], "copilot-hooks");
  assert.deepEqual((hooks.record?.["evidence"]["replay"] as { mechanism: string }[]).map((x) => x.mechanism), ["sdd-mcp-server", "copilot-hooks"]);
  const inj = hooks.record?.["evidence"]["injection"];
  assert.equal(inj["source"], "manual-checklist");
  assert.equal(inj["hooks_state"], "enabled");
  assert.equal(inj["cases"], 22);
  const sdd = check({ variant: CP_SDD });
  allowed(sdd, "server enforcement");
  assert.equal(sdd.record?.["exception"], null);
  assert.equal(sdd.record?.["evidence"]["injection"]["source"], "copilot-cli-runner");
});

// --- C002-TC-633 ---------------------------------------------------------------------------------

test("C002-TC-633 (C002-TS-633): hooks state and injection results of the checklist record, both Copilot modes", () => {
  const line = (p: string) => `ERR-REL-010: copilot: checklist record ${RECORD_PATH} ${p}; the Copilot release needs evidence taken with hooks enabled`;
  const src = (use_hooks: unknown, workspace_trust: unknown, policy: unknown) => ({ use_hooks, workspace_trust, policy });
  const FULL = src("on", "trusted", "none");
  const H = "copilot-hooks" as const;
  const S = "sdd-mcp-server" as const;
  type Row = { mode: typeof H | typeof S; fields: Record<string, unknown>; injection?: "passed" | "absent" | { failed: string }; err: string[]; stored: string | null };
  const rows: Row[] = [
    { mode: H, fields: { hooks_state: "enabled", hooks_sources: FULL }, err: [], stored: "enabled" },
    { mode: S, fields: { hooks_state: "enabled", hooks_sources: FULL }, injection: "passed", err: [], stored: "enabled" },
    { mode: S, fields: { hooks_state: "enabled", hooks_sources: FULL }, injection: "absent", err: [], stored: "enabled" },
    { mode: H, fields: { hooks_state: "disabled", hooks_sources: src("off", "trusted", "none") }, err: [line("shows hooks disabled")], stored: "disabled" },
    { mode: S, fields: { hooks_state: "disabled", hooks_sources: src("on", "untrusted", "none") }, injection: "passed", err: [line("shows hooks disabled")], stored: "disabled" },
    { mode: H, fields: { hooks_state: undefined, hooks_sources: FULL }, err: [line("shows hooks not recorded")], stored: null },
    { mode: H, fields: { hooks_state: "on", hooks_sources: FULL }, err: [line("shows hooks not recorded")], stored: null },
    { mode: S, fields: { hooks_state: undefined, hooks_sources: undefined }, injection: "absent", err: [line("shows hooks not recorded")], stored: null },
    { mode: H, fields: { hooks_state: "enabled", hooks_sources: { use_hooks: "on" } }, err: [line("does not record hooks_sources workspace_trust, policy")], stored: "enabled" },
    { mode: S, fields: { hooks_state: "enabled", hooks_sources: undefined }, err: [line("does not record hooks_sources use_hooks, workspace_trust, policy")], stored: "enabled" },
    { mode: H, fields: { hooks_state: "enabled", hooks_sources: ["on", "trusted", "none"] }, err: [line("does not record hooks_sources use_hooks, workspace_trust, policy")], stored: "enabled" },
    { mode: S, fields: { hooks_state: "disabled", hooks_sources: src(true, "trusted", "none") }, err: [line("does not record hooks_sources use_hooks")], stored: "disabled" },
    { mode: H, fields: { hooks_state: "enabled", hooks_sources: src("on", "untrusted", "none") }, err: [line("gives hooks_state enabled, but its hooks_sources (use_hooks on, workspace_trust untrusted, policy none) give disabled")], stored: "enabled" },
    { mode: S, fields: { hooks_state: "enabled", hooks_sources: src("off", "trusted", "none") }, injection: "passed", err: [line("gives hooks_state enabled, but its hooks_sources (use_hooks off, workspace_trust trusted, policy none) give disabled")], stored: "enabled" },
    { mode: S, fields: { hooks_state: "enabled", hooks_sources: src("on", "trusted", "disables") }, injection: "passed", err: [line("gives hooks_state enabled, but its hooks_sources (use_hooks on, workspace_trust trusted, policy disables) give disabled")], stored: "enabled" },
    { mode: H, fields: { hooks_state: "disabled", hooks_sources: FULL }, err: [line("gives hooks_state disabled, but its hooks_sources (use_hooks on, workspace_trust trusted, policy none) give enabled")], stored: "disabled" },
    { mode: H, fields: { hooks_state: "enabled", hooks_sources: FULL }, injection: { failed: "INJ-07" }, err: ["ERR-REL-004: copilot: checklist step VSC-38 is failed", "ERR-REL-002: copilot: injection case INJ-07 acted upon"], stored: "enabled" },
    {
      mode: H,
      fields: { hooks_state: "enabled", hooks_sources: FULL },
      injection: "absent",
      err: [`ERR-REL-011: copilot: checklist record ${RECORD_PATH} lacks the Copilot injection cases ${Array.from({ length: 22 }, (_, i) => `INJ-${String(i + 1).padStart(2, "0")}`).join(", ")}`],
      stored: "enabled",
    },
  ];
  for (const [i, row] of rows.entries()) {
    const variant = row.mode === H ? CP_HOOKS : CP_SDD;
    const what = `row ${i + 1} (${row.mode})`;
    const opts = { fields: row.fields, ...(row.injection !== undefined ? { injection: row.injection } : {}) };
    const r = check({ variant, checklist: checklistRecord(row.mode, packageVariant(variant).tested, opts) });
    if (row.err.length === 0) allowed(r, what);
    else {
      refused(r, what);
      assert.deepEqual(r.err, row.err, what);
      assert.ok(r.err.filter((l) => l.startsWith("ERR-REL-010")).length <= 1, `${what}: at most one ERR-REL-010 line`);
    }
    assert.equal(r.record?.["evidence"]["checklist"]["hooks_state"], row.stored, `${what}: evidence.checklist.hooks_state`);
  }
});

// --- C002-TC-637 ---------------------------------------------------------------------------------

// C002-TC-637: one test per Examples row of C002-TS-637 (13 rows; the platform rows on PG-900 and PG-901 of
// fx-release, limited by `platforms` to `posix`, revised for defect D-018 item 2 and critic CR-66 by
// C002-T-065), then the supporting checks of C002-T-047.
{
  const toNa = (id: string, rule = "C002-REQ-626") => (r: R637) => {
    const c = caseOf(r, id);
    r.cases = r.cases.filter((x) => x !== c);
    r.not_applicable.push({ id: c.id, corpus: c.corpus, category: c.category, rule });
    recount(r);
  };
  const naToCase = (id: string, tool: string) => (r: R637) => {
    const na = r.not_applicable.find((x) => x.id === id)!;
    r.not_applicable = r.not_applicable.filter((x) => x !== na);
    r.cases.push({ id: na.id, corpus: na.corpus, category: na.category, fed_as: { tool, caller: "sdd-conductor", malformed: false }, expected: "deny", expected_source: "corpus", actual: "deny" });
    recount(r);
  };
  const win32Only = loadCorpora(ROOT).path!.cases.filter((c) => JSON.stringify((c as { platforms?: unknown }).platforms) === JSON.stringify(["win32"])).map((c) => c.id);
  type Row = { variant: typeof OC_NATIVE | typeof OC_SDD; defect: string; mutate: (r: R637) => void; part: string; id: string; platformCases?: boolean; ids?: string };
  const rows: Row[] = [
    { variant: OC_SDD, defect: "does not list the memory case PG-205", mutate: (r) => void recount(Object.assign(r, { cases: r.cases.filter((c) => c.id !== "PG-205") })), part: "omits cases", id: "PG-205" },
    { variant: OC_SDD, defect: "lists the memory case PG-205 as not applicable", mutate: toNa("PG-205"), part: "lists cases as not applicable without a rule", id: "PG-205" },
    { variant: OC_NATIVE, defect: "lists the identity case BG-258 as not applicable", mutate: toNa("BG-258"), part: "lists cases as not applicable without a rule", id: "BG-258" },
    { variant: OC_SDD, defect: "lists the identity case BG-258 as a replayed case", mutate: naToCase("BG-258", "Bash"), part: "replays cases that its mechanism excludes", id: "BG-258" },
    { variant: OC_NATIVE, defect: "lists PG-205 with allow and the source corpus", mutate: (r) => void Object.assign(caseOf(r, "PG-205"), { expected: "allow", expected_source: "corpus", actual: "allow" }), part: "records expectations other than C002-IF-009 §2.1", id: "PG-205" },
    {
      variant: OC_SDD,
      defect: "lists PG-163 as malformed with the source C002-REQ-630",
      mutate: (r) => {
        const c = caseOf(r, "PG-163");
        c.fed_as.malformed = true;
        c.expected_source = "C002-REQ-630";
      },
      part: "records expectations other than C002-IF-009 §2.1",
      id: "PG-163",
    },
    { variant: OC_SDD, defect: "gives win32 without file-symlink and lists PG-163 with deny", mutate: (r) => void (r.replay_host = { platform: "win32", capabilities: [] }), part: "replay host lacks file-symlink", id: "PG-163" },
    { variant: OC_SDD, defect: "gives win32 and leaves out PG-900 (platforms posix)", mutate: (r) => void (r.not_applicable = r.not_applicable.filter((x) => x.id !== "PG-900")), part: "omits cases", id: "PG-900", platformCases: true },
    { variant: OC_SDD, defect: "gives win32 and replays PG-900 (platforms posix) with deny", mutate: naToCase("PG-900", "Write"), part: "replays cases that its mechanism excludes", id: "PG-900", platformCases: true },
    { variant: OC_NATIVE, defect: "gives win32 and replays PG-900 (platforms posix) with deny", mutate: naToCase("PG-900", "Write"), part: "replays cases that its mechanism excludes", id: "PG-900", platformCases: true },
    { variant: OC_SDD, defect: "gives win32 and lists the memory case PG-901 (platforms posix) under not_applicable with the rule platforms", mutate: toNa("PG-901", "platforms"), part: "lists cases as not applicable without a rule", id: "PG-901", platformCases: true },
    {
      variant: OC_SDD,
      defect: "gives win32 and lists PG-900 (platforms posix) under not_applicable with the rule C002-REQ-626",
      mutate: (r) => void (r.not_applicable.find((x) => x.id === "PG-900")!.rule = "C002-REQ-626"),
      part: "lists cases as not applicable without a rule",
      id: "PG-900",
      platformCases: true,
    },
    {
      variant: OC_SDD,
      defect: "gives posix with file-symlink and lists the 35 path cases limited to win32 under not_applicable with the rule platforms",
      mutate: (r) => {
        r.replay_host = { platform: "posix", capabilities: ["file-symlink"] };
        for (const id of win32Only) toNa(id, "platforms")(r);
      },
      part: "was replayed on posix, not on win32",
      id: "PG-112",
      platformCases: true,
      ids: win32Only.join(", "),
    },
  ];
  assert.equal(rows.length, 13);
  assert.equal(win32Only.length, 35);
  for (const [i, row] of rows.entries()) {
    const mech = MECHANISMS_OF_MODE[row.variant.mode][0] as Mechanism;
    test(`C002-TS-637 row ${i + 1} — ${mech} report ${row.defect} → ERR-REL-012 ${row.part}: ${row.id}`, () => {
      const r = check({ variant: row.variant, ...(row.platformCases ? { pathCases: [PG_900, PG_901] } : {}), mutate: { [mech]: row.mutate } });
      refused(r, `${mech}: ${row.part}`);
      assert.deepEqual(r.err, [`ERR-REL-012: opencode: replay report docs/releases/opencode/${FX_VERSION}/replay-${mech}.json (${mech}) ${row.part}: ${row.ids ?? row.id}`], row.part);
      assert.ok(r.err[0]!.includes(row.id));
    });
  }
}

test("C002-TC-637 (supporting): C002-REQ-401 holds on sdd-mcp-server only; a missing report is missing evidence", () => {
  // C002-REQ-401 and C002-REQ-517 hold on sdd-mcp-server only (revised C002-IF-009 §2.1).
  const moved = check({ variant: OC_NATIVE, mutate: { "opencode-permissions": (r) => void Object.assign(caseOf(r, "PG-135"), { expected: "deny", expected_source: "C002-REQ-401", actual: "deny" }) } });
  assert.deepEqual(moved.err, [`ERR-REL-012: opencode: replay report docs/releases/opencode/${FX_VERSION}/replay-opencode-permissions.json (opencode-permissions) records expectations other than C002-IF-009 §2.1: PG-135`]);
  // A missing report is missing evidence.
  const gone = check({ variant: OC_SDD, reports: { "sdd-mcp-server": null } });
  assert.deepEqual(gone.err, [`ERR-REL-009: opencode: evidence corpus replay missing, unreadable or insufficient at docs/releases/opencode/${FX_VERSION}/replay-sdd-mcp-server.json`]);
});

// --- C002-TC-682 (C002-TS-682; C002-T-065): a case of the platform rule listed as not applicable is accepted ---
for (const variant of [OC_SDD, OC_NATIVE]) {
  const mech = MECHANISMS_OF_MODE[variant.mode][0] as Mechanism;
  test(`C002-TS-682 — ${variant.mode}: replay-${mech}.json on win32 lists PG-900 (platforms posix) under not_applicable with the rule platforms → released`, () => {
    const r = check({
      variant,
      pathCases: [PG_900],
      mutate: {
        [mech]: (x: R637) => {
          assert.equal(x.replay_host.platform, "win32");
          assert.deepEqual(x.not_applicable.filter((n) => n.id === "PG-900"), [{ id: "PG-900", corpus: "path", category: "outside", rule: "platforms" }]);
          assert.equal(x.differing, 0);
        },
      },
    });
    assert.deepEqual(r.err.filter((l) => l.startsWith("ERR-REL-012")), []);
    allowed(r, variant.mode);
  });
}

// --- C002-TC-683 (C002-TS-683; C002-T-065): a report replayed on posix is refused and not checked further ---
for (const [fixture, e] of <[string, Partial<Evidence>][]>[
  ["fx-release", { pathCases: [PG_900, PG_901] }],
  ["fx-release-no-platforms", { noPlatforms: true }],
]) {
  test(`C002-TS-683 — ${fixture}: replay-sdd-mcp-server.json replayed on posix → one ERR-REL-012 line, no ERR-REL-001 or ERR-REL-006`, () => {
    const { root, pkg } = evidenceRoot({
      variant: OC_SDD,
      ...e,
      mutate: {
        "sdd-mcp-server": (x) => {
          x.replay_host = { platform: "posix", capabilities: ["file-symlink"] };
          caseOf(x, "PG-205").actual = "allow";
          x.cases = x.cases.filter((c) => c.id !== "PG-224");
          recount(x);
          assert.equal(x.differing, 1);
        },
      },
    });
    const r = run("opencode", root, pkg);
    const pathCases = (JSON.parse(readFileSync(join(root, "tests", "guards", "path-corpus.json"), "utf8")) as { cases: { id: string; platforms?: unknown }[] }).cases;
    const expected = pathCases.filter((c) => JSON.stringify(c.platforms) === JSON.stringify(["win32"])).map((c) => c.id);
    assert.equal(expected.length, fixture === "fx-release" ? 35 : 0);
    const twelve = r.err.filter((l) => l.startsWith("ERR-REL-012"));
    assert.equal(twelve.length, 1, r.err.join("\n"));
    const prefix = `ERR-REL-012: opencode: replay report docs/releases/opencode/${FX_VERSION}/replay-sdd-mcp-server.json (sdd-mcp-server) was replayed on posix, not on win32: `;
    assert.ok(twelve[0]!.startsWith(prefix), twelve[0]);
    const list = twelve[0]!.slice(prefix.length);
    assert.deepEqual(list.split(", "), expected.length > 0 ? expected : ["none"]);
    assert.equal(new Set(list.split(", ")).size, list.split(", ").length, "each once");
    assert.deepEqual(r.err.filter((l) => l.startsWith("ERR-REL-001") || l.startsWith("ERR-REL-006")), []);
    refused(r, fixture);
    assert.ok((r.record?.["refusals"] as { code: string }[]).some((x) => x.code === "ERR-REL-012"));
  });
}

// --- C002-TC-651 ---------------------------------------------------------------------------------

test("C002-TC-651 (C002-TS-651): replay host capabilities at release", () => {
  allowed(check({ variant: OC_SDD }), "file-symlink, PG-163 deny");
  const noCap = (r: ReturnType<typeof cleanReport>) => {
    r.replay_host = { platform: "win32", capabilities: [] };
    Object.assign(caseOf(r, "PG-163"), { actual: "error", detail: "the replay host lacks file-symlink" });
    recount(r);
  };
  for (const [target, variant, mech] of [["opencode", OC_SDD, "sdd-mcp-server"], ["copilot", CP_HOOKS, "copilot-hooks"]] as const) {
    const r = check({ variant, mutate: { [mech]: noCap } });
    refused(r, `${target} ${mech}`);
    assert.deepEqual(r.err, [
      `ERR-REL-012: ${target}: replay report docs/releases/${target}/${FX_VERSION}/replay-${mech}.json (${mech}) replay host lacks file-symlink: PG-163`,
      `ERR-REL-001: ${target}: corpus replay differs on PG-163 (${mech})`,
    ]);
  }
});

// --- regeneration (C002-NFR-501, ERR-REL-007, ERR-REL-008) -----------------------------------------

/** A copy of the package variant's dist/ whose zip is rebuilt from a changed copy of the folder. */
function changedZip(pkg: Package, target: Target, change: (dir: string) => void): Package {
  const dist = mkdtempSync(join(tmpdir(), "sdd-fx-release-dist-"));
  cpSync(pkg.dist, dist, { recursive: true });
  const stage = mkdtempSync(join(tmpdir(), "sdd-fx-release-stage-"));
  cpSync(join(dist, target), stage, { recursive: true });
  change(stage);
  zipDir(stage, join(dist, `architect-${target}-${FX_VERSION}.zip`));
  rmSync(stage, { recursive: true, force: true });
  return { ...pkg, dist };
}

test("C002-NFR-501: a target zip whose content differs from the regeneration is refused (ERR-REL-007)", () => {
  const { root, pkg } = evidenceRoot({ variant: OC_SDD });
  const zip = `architect-opencode-${FX_VERSION}.zip`;
  const bad = changedZip(pkg, "opencode", (dir) => {
    writeFileSync(join(dir, "INSTALL.md"), "changed\n");
    writeFileSync(join(dir, "extra.txt"), "extra\n");
    rmSync(join(dir, "opencode.json"));
  });
  try {
    const r = run("opencode", root, bad, ["--dry-run"]);
    assert.equal(r.code, 1);
    const prefix = bad.dist.split("\\").join("/");
    assert.deepEqual(r.err, [`ERR-REL-007: opencode: package differs from regeneration: ${prefix}/${zip}:INSTALL.md (different), ${prefix}/${zip}:extra.txt (extra), ${prefix}/${zip}:opencode.json (missing)`]);
    assert.equal(r.record, null, "--dry-run writes no record");
    // The folder alone may be identical: the zip is what P-01 releases (Q-release-01).
    rmSync(join(bad.dist, zip));
    assert.deepEqual(run("opencode", root, bad, ["--dry-run"]).err, [`ERR-REL-007: opencode: package differs from regeneration: ${prefix}/${zip} (missing)`]);
  } finally {
    rmSync(bad.dist, { recursive: true, force: true });
  }
});

test("C002-IF-004: a package generated with --mode is refused (ERR-REL-008, with ERR-REL-007)", () => {
  const { root, pkg } = evidenceRoot({ variant: OC_SDD });
  const dist = mkdtempSync(join(tmpdir(), "sdd-fx-release-mode-"));
  try {
    assert.equal(generate(["--target", "opencode", "--source", pkg.source, "--out", dist, "--mode", "opencode=native-permissions", "--quiet"], { stdout: () => undefined, stderr: () => undefined }), 0);
    zipDir(join(dist, "opencode"), join(dist, `architect-opencode-${FX_VERSION}.zip`));
    const r = run("opencode", root, { ...pkg, dist });
    assert.deepEqual(codes(r), ["ERR-REL-007", "ERR-REL-008"]);
    assert.equal(r.err[1], "ERR-REL-008: opencode: package generated with --mode native-permissions; release packages use the table's mode");
    assert.equal(r.record?.["evidence"]["regeneration"]["identical"], false);
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
});

// --- the committed evidence, the catalogue, the entry ---------------------------------------------

test("C002-T-063 reports under docs/releases/*/0.0.1/ pass the replay recomputation", () => {
  const corpora = loadCorpora(ROOT) as Record<"path" | "shell", Corpus>;
  let n = 0;
  for (const target of readdirSync(join(ROOT, "docs", "releases"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    const dir = join(ROOT, "docs", "releases", target, "0.0.1");
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => /^replay-.+\.json$/.test(x))) {
      const report = parseReport(readFileSync(join(dir, f), "utf8"));
      assert.ok(report, f);
      const path = `docs/releases/${target}/0.0.1/${f}`;
      const r = checkReport(target, report.mechanism as Mechanism, path, report, corpora);
      assert.deepEqual(r.refusals.filter((x) => x.code === "ERR-REL-012"), [], path);
      n++;
    }
  }
  assert.ok(n >= 4, `${n} reports`);
});

test("the ERR-REL catalogue mirrors errors.md §3 verbatim", () => {
  const rows = readFileSync(specFile("002", "10-spec/50-interfaces/errors.md"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^\| ERR-REL-\d{3} \|/.test(l))
    .map(splitCells)
    .map(([code, condition, message, fix, spec]) => ({ code, condition, message: message!.replace(/^`|`$/g, ""), fix, spec }));
  assert.equal(rows.length, 13);
  assert.deepEqual(Object.values(REL_CATALOGUE), rows);
});

test("node scripts/release-check.mjs --target opencode --dry-run on fx-release; usage errors exit 2", () => {
  const { root, pkg } = evidenceRoot({ variant: OC_SDD });
  cpSync(pkg.source, join(root, "plugins", "architect"), { recursive: true });
  cpSync(pkg.dist, join(root, "dist"), { recursive: true });
  const script = join(ROOT, "scripts", "release-check.mjs");
  const r = spawnSync(process.execPath, [script, "--target", "opencode", "--dry-run", "--root", root], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`opencode ${FX_VERSION.replace(/\./g, "\\.")} \\(sdd-mcp-server\\): released; release record not written`));
  assert.equal(existsSync(join(root, "docs", "releases", "opencode", FX_VERSION, "release.json")), false);
  const w = spawnSync(process.execPath, [script, "--target", "opencode", "--root", root], { encoding: "utf8" });
  assert.equal(w.status, 0, w.stderr);
  assert.equal((JSON.parse(readFileSync(join(root, "docs", "releases", "opencode", FX_VERSION, "release.json"), "utf8")) as { outcome: string }).outcome, "released");
  const u = spawnSync(process.execPath, [script, "--root", root], { encoding: "utf8" });
  assert.equal(u.status, 2);
  assert.match(u.stderr, /release-check: --target is required/);
  assert.equal(spawnSync(process.execPath, [script, "--target", "claude-code"], { encoding: "utf8" }).status, 2);
});

// --- C002-T-064: C002-TC-668 … C002-TC-671, the repository's step index ----

test("the repository's docs/checklists/vscode-copilot.md reads as a step index with one restore step (VSC-07)", () => {
  const steps = readChecklistSteps(join(ROOT, "docs", "checklists", "vscode-copilot.md"));
  assert.ok(steps, "readable");
  assert.deepEqual(steps.filter((s) => s.kind === "restore").map((s) => s.id), ["VSC-07"]);
  assert.equal(steps.find((s) => s.id === "VSC-10")?.kind, "hooks-state");
  assert.deepEqual([...new Set(steps.map((s) => s.group))].sort(), [1, 2, 3, 4]);
  assert.equal(steps.filter((s) => s.kind === "injection").length, 22);
  assert.ok(steps.every((s) => /^VSC-\d+$/.test(s.id)), "the assumption table's rows are no steps");
});

/** A checklist whose `## Step index` holds `rows` ([step, group, mode, kind, title]). */
function checklistText(rows: [string, number | string, string, string, string][], { heading = "## Step index", header = "| Step | Group | Mode | Kind | Hook | Scenarios | Title |" } = {}): string {
  return [
    "# Manual VS Code checklist (fx-release)",
    "",
    heading,
    "",
    header,
    "|---|---|---|---|---|---|---|",
    ...rows.map(([id, g, m, k, t]) => `| ${id} | ${g} | ${m} | ${k} | no | - | ${t} |`),
    "",
    "## Assumption steps",
    "",
    "| Assumption | Statement | Spec | Step |",
    "|---|---|---|---|",
    "| A-1 | x | y | VSC-77 |",
    "",
  ].join("\n");
}

const INJ = (n: number) => `INJ-${String(n).padStart(2, "0")}`;
/** The step index of C002-TS-668: VSC-01 … VSC-05 and the injection steps VSC-11 … VSC-30 (INJ-01 … INJ-20). */
const TS668_INDEX: [string, number, string, string, string][] = [
  ["VSC-01", 1, "both", "install", "Install"],
  ["VSC-02", 4, "sdd-mcp-server", "boundary", "Boundary"],
  ["VSC-03", 4, "copilot-hooks", "guard-denial", "Guard denial"],
  ["VSC-04", 2, "both", "restore", "Restore"],
  ["VSC-05", 3, "both", "hooks-state", "Hooks state"],
  ...Array.from({ length: 20 }, (_, i) => [`VSC-${11 + i}`, 4, "copilot-hooks", "injection", `Injection case ${INJ(i + 1)}`] as [string, number, string, string, string]),
];

type Entry = Record<string, unknown>;
/** A checklist record with hooks enabled (on, trusted, none) and the given steps, in this order. */
function recordText(mode: string, tested: Record<string, string>, steps: Entry[]): string {
  const fm = {
    checklist: "docs/checklists/vscode-copilot.md",
    date: "2026-11-20",
    package_version: FX_VERSION,
    host_versions: { vscode: tested["vscode"], "copilot-chat": tested["copilot-chat"] },
    enforcement_mode: mode,
    hooks_state: "enabled",
    hooks_sources: { use_hooks: "on", workspace_trust: "trusted", policy: "none" },
    executed_by: "P-01",
    steps,
  };
  return `---\n${stringify(fm)}---\n\n# Checklist record (fx-release)\n`;
}

const passed = (id: string, extra: Entry = {}): Entry => ({ id, result: "passed", ...extra });
const earlier = (result: string, cause: string): Entry => ({ earlier_results: [{ result, cause }] });

{
  const S = "sdd-mcp-server" as const;
  const H = "copilot-hooks" as const;
  const line = (id: string, result: string) => `ERR-REL-004: copilot: checklist step ${id} is ${result}`;
  type Row = { mode: typeof S | typeof H; restore?: Entry; steps: Entry[]; err: string[] | "ERR-REL-011" };
  const rows: Row[] = [
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02")], err: [] },
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02"), { id: "VSC-03", result: "not-applicable" }], err: [] },
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02"), { id: "VSC-11", result: "not-applicable" }], err: [] },
    { mode: S, steps: [passed("VSC-01")], err: [line("VSC-02", "not recorded")] },
    { mode: S, steps: [{ id: "VSC-01", result: "not-applicable" }, passed("VSC-02")], err: [line("VSC-01", "not-applicable")] },
    { mode: S, steps: [passed("VSC-01"), { id: "VSC-02", result: "failed", note: "the write to src/app.ts was not denied" }], err: [line("VSC-02", "failed")] },
    { mode: S, steps: [passed("VSC-01"), { id: "VSC-02", result: "skipped" }], err: [line("VSC-02", "skipped")] },
    { mode: S, steps: [passed("VSC-01"), { id: "VSC-02" }], err: [line("VSC-02", "not recorded")] },
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02"), { id: "VSC-03", result: "failed" }], err: [line("VSC-03", "failed")] },
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02"), passed("VSC-03")], err: [line("VSC-03", "passed, but its mode is copilot-hooks")] },
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02"), passed("VSC-02")], err: [line("VSC-02", "listed more than once")] },
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02"), passed("VSC-99")], err: [line("VSC-99", "not a step of the checklist")] },
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02", earlier("failed", "repeated"))], err: [line("VSC-02", "failed in an earlier run not repeated under the rerun rule")] },
    { mode: S, restore: earlier("passed", "hooks-source-changed"), steps: [passed("VSC-01"), passed("VSC-02", earlier("failed", "hooks-source-changed"))], err: [] },
    // Defect D-018 item 3 (C002-T-065): every earlier restore run counts, so VSC-02 stays excused; a failed
    // or skipped earlier restore run gives VSC-04 its own line.
    { mode: S, restore: earlier("passed", "repeated"), steps: [passed("VSC-01"), passed("VSC-02", earlier("failed", "hooks-source-changed"))], err: [] },
    { mode: S, restore: earlier("failed", "repeated"), steps: [passed("VSC-01"), passed("VSC-02", earlier("failed", "hooks-source-changed"))], err: [line("VSC-04", "failed in an earlier run not repeated under the rerun rule")] },
    { mode: S, restore: earlier("skipped", "hooks-source-changed"), steps: [passed("VSC-01"), passed("VSC-02", earlier("failed", "hooks-source-changed"))], err: [line("VSC-04", "skipped in an earlier run")] },
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02", earlier("failed", "hooks-source-changed"))], err: [line("VSC-02", "failed in an earlier run not repeated under the rerun rule")] },
    { mode: S, restore: earlier("passed", "hooks-source-changed"), steps: [passed("VSC-01", earlier("failed", "hooks-source-changed")), passed("VSC-02")], err: [line("VSC-01", "failed in an earlier run not repeated under the rerun rule")] },
    { mode: S, steps: [passed("VSC-01"), passed("VSC-02", earlier("skipped", "repeated"))], err: [line("VSC-02", "skipped in an earlier run")] },
    { mode: H, steps: [passed("VSC-01"), passed("VSC-03")], err: [] },
    { mode: H, steps: [passed("VSC-01"), { id: "VSC-02", result: "not-applicable" }], err: [line("VSC-03", "not recorded")] },
    { mode: H, steps: [passed("VSC-01"), passed("VSC-03"), passed("VSC-02")], err: [line("VSC-02", "passed, but its mode is sdd-mcp-server")] },
    { mode: H, steps: [passed("VSC-01"), passed("VSC-03"), { id: "VSC-11", result: "not-applicable", injection_case: "INJ-01" }], err: "ERR-REL-011" },
  ];
  assert.equal(rows.length, 24);
  for (const [i, row] of rows.entries())
  test(`C002-TS-668 row ${i + 1} (${row.mode}): restore ${JSON.stringify(row.restore ?? {})}, steps ${JSON.stringify(row.steps)} → ${row.err === "ERR-REL-011" ? "ERR-REL-011" : row.err.length === 0 ? "allowed" : row.err.join("; ")}`, () => {
    const variant = row.mode === S ? CP_SDD : CP_HOOKS;
    const tested = packageVariant(variant).tested;
    // VSC-11 … VSC-30 and VSC-05 passed, the restore step VSC-04 as the row gives it; the row's steps
    // replace the entry of a step they name.
    const base: Entry[] = [passed("VSC-04", row.restore ?? {}), passed("VSC-05"), ...Array.from({ length: 20 }, (_, k) => passed(`VSC-${11 + k}`, { injection_case: INJ(k + 1) }))];
    const named = new Set(row.steps.map((s) => s.id));
    const steps = [...base.filter((s) => !named.has(s.id as string)), ...row.steps];
    const r = check({ variant, checklistFile: checklistText(TS668_INDEX), checklist: recordText(row.mode, tested, steps) });
    const what = `row ${i + 1} (${row.mode}): ${JSON.stringify(row.steps)}`;
    if (row.err === "ERR-REL-011") {
      refused(r, what);
      assert.deepEqual(r.err, [`ERR-REL-011: copilot: checklist record ${RECORD_PATH} lacks the Copilot injection cases INJ-01`], what);
      return;
    }
    if (row.err.length === 0) allowed(r, what);
    else {
      refused(r, what);
      assert.deepEqual(r.err, row.err, what);
    }
    assert.equal(r.err.filter((l) => l.startsWith("ERR-REL-004")).length, row.err.length, `${what}: exactly the row's ERR-REL-004 lines`);
  });
}

{
  // C002-TC-669 (C002-TS-669): evidence kinds of ERR-REL-009 and the replay reports of each enforcement mode.
  const nine = (r: Run) => r.err.filter((l) => l.startsWith("ERR-REL-009"));
  const oc = (n: number) => injectionSummary("opencode", "opencode-runner", { opencode: "1.18.31" }, n);
  const repoChecklist = () => readFileSync(join(ROOT, "docs", "checklists", "vscode-copilot.md"), "utf8");
  const report = `docs/releases/opencode/${FX_VERSION}/replay-sdd-mcp-server.json`;

  test("C002-TS-669 OpenCode sdd MCP server enforcement: an injection summary of 19 cases → exactly one ERR-REL-009 (19 cases, at least 20 required)", () => {
    const r = check({ variant: OC_SDD, injection: oc(19) });
    refused(r, "19 injection cases");
    assert.deepEqual(r.err, [`ERR-REL-009: opencode: evidence injection summary (19 cases, at least 20 required) missing, unreadable or insufficient at docs/releases/opencode/${FX_VERSION}/injection.json`]);
  });

  test("C002-TS-669 OpenCode sdd MCP server enforcement: an injection summary of 20 cases → allowed, no ERR-REL-009", () => {
    const r = check({ variant: OC_SDD, injection: oc(20) });
    allowed(r, "20 injection cases");
    assert.deepEqual(nine(r), []);
  });

  test("C002-TS-669 Copilot hooks fallback: a checklist of 19 injection cases, each passed in the record → exactly one ERR-REL-009 (injection steps), no ERR-REL-011", () => {
    const nineteen = repoChecklist().replace(/^\| VSC-5[123] \|.*\n/gm, "");
    const index = readChecklistStepsText(nineteen);
    assert.equal(index.filter((s) => s.kind === "injection").length, 19);
    const tested = packageVariant(CP_HOOKS).tested;
    const steps = index.map((s) =>
      s.kind === "injection" ? passed(s.id, { injection_case: s.injectionCase }) : s.mode === "both" || s.mode === "copilot-hooks" ? passed(s.id) : { id: s.id, result: "not-applicable" },
    );
    const r = check({ variant: CP_HOOKS, checklistFile: nineteen, checklist: recordText("copilot-hooks", tested, steps) });
    refused(r, "19 injection steps");
    assert.deepEqual(nine(r), [`ERR-REL-009: copilot: evidence injection steps (19 cases, at least 20 required) missing, unreadable or insufficient at ${RECORD_PATH}`]);
    assert.ok(!r.err.some((l) => l.startsWith("ERR-REL-011")), r.err.join("\n"));
  });

  test("C002-TS-669 OpenCode sdd MCP server enforcement: a replay report of another path-corpus SHA-256 that omits PG-205 → ERR-REL-009 corpus replay of the corpora at the release commit, no ERR-REL-012 naming it", () => {
    const r = check({
      variant: OC_SDD,
      mutate: {
        "sdd-mcp-server": (x) => {
          (x.corpora["path"] as { sha256: string }).sha256 = "0".repeat(64);
          x.cases = x.cases.filter((c) => c.id !== "PG-205");
          recount(x);
        },
      },
    });
    refused(r, "other corpora");
    assert.ok(r.err.includes(`ERR-REL-009: opencode: evidence corpus replay of the corpora at the release commit missing, unreadable or insufficient at ${report}`), r.err.join("\n"));
    assert.ok(!r.err.some((l) => l.startsWith("ERR-REL-012") && l.includes(report)), r.err.join("\n"));
  });

  test("C002-TS-669 OpenCode sdd MCP server enforcement: no replay-opencode-permissions.json → allowed, no ERR-REL-009", () => {
    const r = check({ variant: OC_SDD, reports: { "opencode-permissions": null } });
    allowed(r, "no opencode-permissions report under sdd-mcp-server");
    assert.deepEqual(nine(r), []);
  });

  test("C002-TS-669 OpenCode native permission enforcement: no replay-opencode-permissions.json → ERR-REL-009 corpus replay", () => {
    const r = check({ variant: OC_NATIVE, reports: { "opencode-permissions": null } });
    refused(r, "native without its report");
    assert.ok(r.err.includes(`ERR-REL-009: opencode: evidence corpus replay missing, unreadable or insufficient at docs/releases/opencode/${FX_VERSION}/replay-opencode-permissions.json`), r.err.join("\n"));
  });

  test("C002-TS-669 Copilot hooks fallback: no replay-sdd-mcp-server.json, a clean replay-copilot-hooks.json → ERR-REL-009 corpus replay", () => {
    const r = check({ variant: CP_HOOKS, reports: { "sdd-mcp-server": null } });
    refused(r, "hooks fallback without the sdd-mcp-server report");
    assert.ok(r.err.includes(`ERR-REL-009: copilot: evidence corpus replay missing, unreadable or insufficient at docs/releases/copilot/${FX_VERSION}/replay-sdd-mcp-server.json`), r.err.join("\n"));
  });

  for (const [what, change] of [
    ["the step index gives the Kind restore to two steps", (t: string) => t.replace(/^(\| VSC-08 \| 3 \| sdd-mcp-server \| )hooks-row( \|)/m, "$1restore$2")],
    ['the checklist has no heading "## Step index"', (t: string) => t.replace(/^## Step index$/m, "## Index")],
  ] as const)
    test(`C002-TS-669 Copilot sdd MCP server enforcement: ${what}, the record lists every step of the mode passed → exactly one ERR-REL-009 checklist, no ERR-REL-004`, () => {
      const text = change(repoChecklist());
      assert.notEqual(text, repoChecklist());
      const r = check({ variant: CP_SDD, checklistFile: text });
      refused(r, what);
      assert.deepEqual(r.err, ["ERR-REL-009: copilot: evidence checklist missing, unreadable or insufficient at docs/checklists/vscode-copilot.md"], what);
    });
}

/** The step index of a checklist text (through a temporary file). */
function readChecklistStepsText(text: string): NonNullable<ReturnType<typeof readChecklistSteps>> {
  const dir = mkdtempSync(join(tmpdir(), "sdd-fx-checklist-"));
  try {
    writeFileSync(join(dir, "c.md"), text);
    const steps = readChecklistSteps(join(dir, "c.md"));
    assert.ok(steps, "readable");
    return steps;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("readChecklistSteps refuses every unreadable condition of C002-IF-009 §4 Step index", () => {
  const ok = checklistText(TS668_INDEX);
  assert.equal(readChecklistStepsText(ok).length, 25);
  const bad: [string, string | null][] = [
    ["no file", null],
    ["no heading", ok.replace("## Step index", "## Steps")],
    ["no step row", checklistText([])],
    ["another header", checklistText(TS668_INDEX, { header: "| Step | Mode | Group | Kind | Hook | Scenarios | Title |" })],
    ["a repeated step ID", checklistText([...TS668_INDEX, ["VSC-01", 1, "both", "install", "again"]])],
    ["a Group outside 1 … 4", checklistText([...TS668_INDEX, ["VSC-40", 5, "both", "scenario", "x"]])],
    ["a Mode outside the values", checklistText([...TS668_INDEX, ["VSC-40", 4, "hooks", "scenario", "x"]])],
    ["a Kind outside the values", checklistText([...TS668_INDEX, ["VSC-40", 4, "both", "manual", "x"]])],
    ["an injection step without a case ID", checklistText([...TS668_INDEX, ["VSC-40", 4, "copilot-hooks", "injection", "Injection case"]])],
    ["a repeated case ID", checklistText([...TS668_INDEX, ["VSC-40", 4, "copilot-hooks", "injection", "Injection case INJ-01"]])],
    ["no restore step", checklistText(TS668_INDEX.filter((r) => r[3] !== "restore"))],
    ["two restore steps", checklistText([...TS668_INDEX, ["VSC-40", 2, "both", "restore", "Restore again"]])],
  ];
  for (const [what, text] of bad) {
    const dir = mkdtempSync(join(tmpdir(), "sdd-fx-checklist-"));
    try {
      if (text !== null) writeFileSync(join(dir, "c.md"), text);
      assert.equal(readChecklistSteps(join(dir, "c.md")), null, what);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

/** An fx-release folder named `fx-release` under a temporary parent: the evidence, the source plugin and dist/. */
function fxReleaseFolder(e: Evidence): { parent: string; root: string } {
  const { root, pkg } = evidenceRoot(e);
  const parent = mkdtempSync(join(tmpdir(), "sdd-fx-parent-"));
  const fx = join(parent, "fx-release");
  cpSync(root, fx, { recursive: true });
  cpSync(pkg.source, join(fx, "plugins", "architect"), { recursive: true });
  cpSync(pkg.dist, join(fx, "dist"), { recursive: true });
  return { parent, root: fx };
}

/** Every file under `dir` with its size and SHA-256. */
function snapshot(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (abs: string, rel: string) => {
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      const p = join(abs, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p, r);
      else {
        const data = readFileSync(p);
        out.set(r, `${data.length}:${createHash("sha256").update(data).digest("hex")}`);
      }
    }
  };
  walk(dir, "");
  return out;
}

const SCRIPT = join(ROOT, "scripts", "release-check.mjs");
const lines = (s: string) => s.split(/\r?\n/).filter((l) => l !== "");

{
  type Row = { e: Evidence; target: Target; mode: string; exit: number; outcome: string; err: string[] };
  const rows: Row[] = [
    { e: { variant: OC_SDD }, target: "opencode", mode: "sdd-mcp-server", exit: 0, outcome: "released", err: [] },
    {
      e: { variant: OC_SDD, mutate: { "sdd-mcp-server": flip("PG-050") }, injection: injectionSummary("opencode", "opencode-runner", { opencode: "1.18.31" }, 20, ["INJ-03"]) },
      target: "opencode",
      mode: "sdd-mcp-server",
      exit: 1,
      outcome: "refused (2 refusals)",
      err: ["ERR-REL-001: opencode: corpus replay differs on PG-050 (sdd-mcp-server)", "ERR-REL-002: opencode: injection case INJ-03 acted upon"],
    },
    // The checklist record is the injection evidence; the fixture holds no injection.json.
    { e: { variant: CP_HOOKS, injection: null }, target: "copilot", mode: "copilot-hooks", exit: 0, outcome: "released", err: [] },
  ];
  for (const row of rows)
  test(`C002-TS-670 ${row.target} ${row.mode}: --dry-run --root fx-release → exit ${row.exit}, ${row.outcome}, no file written`, () => {
    const { parent, root } = fxReleaseFolder(row.e);
    try {
      const before = snapshot(root);
      const r = spawnSync(process.execPath, [SCRIPT, "--target", row.target, "--dry-run", "--root", "fx-release"], { cwd: parent, encoding: "utf8" });
      const what = `${row.target} ${row.mode} ${row.outcome}`;
      assert.equal(r.status, row.exit, `${what}: ${r.stderr}`);
      const out = lines(r.stdout);
      assert.equal(out.length, 1, r.stdout);
      assert.ok(out[0]!.startsWith(`release-check: ${row.target} ${FX_VERSION} (${row.mode}): ${row.outcome}`), out[0]);
      assert.ok(out[0]!.endsWith(`; release record not written (--dry-run; would be docs/releases/${row.target}/${FX_VERSION}/release.json)`), out[0]);
      assert.ok(!out[0]!.includes("allowed"), out[0]);
      assert.deepEqual(lines(r.stderr), row.err, what);
      assert.equal(existsSync(join(root, "docs", "releases", row.target, FX_VERSION, "release.json")), false);
      if (row.target === "copilot") assert.equal(existsSync(join(root, "docs", "releases", "copilot", FX_VERSION, "injection.json")), false, "no injection.json");
      assert.deepEqual(snapshot(root), before, `${what}: no file created or changed`);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
}

{
  const releaseFile = (root: string) => join(root, "docs", "releases", "opencode", FX_VERSION, "release.json");
  const usage = (r: ReturnType<typeof spawnSync>) => {
    const err = lines(String(r.stderr));
    assert.ok(err.some((l) => l.startsWith("release-check: ")), String(r.stderr));
    assert.ok(err.some((l) => l.startsWith("usage: node scripts/release-check.mjs --target opencode|copilot")), String(r.stderr));
  };
  type Row = { e: Evidence; args: string[]; env?: Record<string, string>; exit: number; check: (r: ReturnType<typeof spawnSync>, root: string) => void };
  const rows: Row[] = [
    {
      e: { variant: OC_SDD },
      args: ["--target", "opencode"],
      exit: 0,
      check: (r, root) => {
        assert.deepEqual(lines(String(r.stdout)), [`release-check: opencode ${FX_VERSION} (sdd-mcp-server): released; release record docs/releases/opencode/${FX_VERSION}/release.json`]);
        assert.equal(String(r.stderr), "");
        assert.equal((JSON.parse(readFileSync(releaseFile(root), "utf8")) as { outcome: string }).outcome, "released");
      },
    },
    {
      e: { variant: OC_SDD, mutate: { "sdd-mcp-server": flip("PG-050") } },
      args: ["--target", "opencode"],
      exit: 1,
      check: (r, root) => {
        assert.ok(lines(String(r.stderr)).includes("ERR-REL-001: opencode: corpus replay differs on PG-050 (sdd-mcp-server)"), String(r.stderr));
        const out = lines(String(r.stdout));
        assert.equal(out.length, 1);
        assert.ok(out[0]!.startsWith(`release-check: opencode ${FX_VERSION} (sdd-mcp-server): refused (`), out[0]);
        const rec = JSON.parse(readFileSync(releaseFile(root), "utf8")) as { outcome: string; refusals: { code: string }[] };
        assert.equal(rec.outcome, "refused");
        assert.ok(rec.refusals.some((x) => x.code === "ERR-REL-001"));
      },
    },
    ...[["--target", "opencode", "--force"], ["--target", "opencode", "extra"], ["--version", FX_VERSION], ["--target", "claude-code"], ["--target", "opencode", "--version", "latest"]].map(
      (args): Row => ({ e: { variant: OC_SDD }, args, exit: 2, check: (r, root) => (usage(r), assert.equal(existsSync(releaseFile(root)), false)) }),
    ),
    {
      e: { variant: OC_SDD },
      args: ["--target", "opencode"],
      env: { SDD_TEST_FAULT: "release-record-invalid" },
      exit: 3,
      check: (r, root) => {
        assert.ok(lines(String(r.stderr)).some((l) => l.startsWith("release-check: internal error: ")), String(r.stderr));
        assert.equal(existsSync(releaseFile(root)), false);
      },
    },
  ];
  for (const row of rows)
  test(`C002-TS-671 ${row.args.join(" ")}${row.env ? " (release record seeded invalid)" : ""} → exit ${row.exit}`, () => {
    const { parent, root } = fxReleaseFolder(row.e);
    try {
      const env: Record<string, string | undefined> = { ...process.env, ...row.env };
      if (!row.env) delete env["SDD_TEST_FAULT"];
      const r = spawnSync(process.execPath, [SCRIPT, ...row.args, "--root", root], { cwd: ROOT, encoding: "utf8", env });
      assert.equal(r.status, row.exit, `${row.args.join(" ")}: ${r.stderr}`);
      assert.ok(!String(r.stdout).includes("allowed"), String(r.stdout));
      row.check(r, root);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
}
