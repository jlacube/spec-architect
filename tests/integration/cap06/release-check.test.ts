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
// plus: a target zip whose content differs from the regeneration (ERR-REL-007, C002-NFR-501), a package
// generated with --mode (ERR-REL-008), the committed replay reports pass the recomputation, the ERR-REL
// catalogue mirrors errors.md §3, and the script entry with --dry-run.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { splitCells } from "../../../src/model/blocks.ts";
import { main as generate } from "../../../scripts/generate/main.ts";
import { zipDir } from "../../../scripts/package.mjs";
import type { Target } from "../../../scripts/generate/tables.ts";
import { MECHANISMS_OF_MODE } from "../../../scripts/release/check.ts";
import { REL_CATALOGUE } from "../../../scripts/release/errors.ts";
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
  assert.deepEqual(gaps.err, ["ERR-REL-004: copilot: checklist step VSC-23 is not recorded", "ERR-REL-004: copilot: checklist step VSC-24 is not-applicable"]);
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

test("C002-TC-637 (C002-TS-637): incomplete replay reports refused at release", () => {
  type R = ReturnType<typeof cleanReport>;
  const toNa = (id: string) => (r: R) => {
    const c = caseOf(r, id);
    r.cases = r.cases.filter((x) => x !== c);
    r.not_applicable.push({ id: c.id, corpus: c.corpus, category: c.category, rule: "C002-REQ-626" });
    recount(r);
  };
  const rows: { variant: typeof OC_NATIVE | typeof OC_SDD; mutate: (r: R) => void; part: string; id: string }[] = [
    { variant: OC_SDD, mutate: (r) => void recount(Object.assign(r, { cases: r.cases.filter((c) => c.id !== "PG-205") })), part: "omits cases", id: "PG-205" },
    { variant: OC_SDD, mutate: toNa("PG-205"), part: "lists cases as not applicable without a rule", id: "PG-205" },
    { variant: OC_NATIVE, mutate: toNa("BG-258"), part: "lists cases as not applicable without a rule", id: "BG-258" },
    {
      variant: OC_SDD,
      mutate: (r) => {
        const na = r.not_applicable.find((x) => x.id === "BG-258")!;
        r.not_applicable = r.not_applicable.filter((x) => x !== na);
        r.cases.push({ id: na.id, corpus: na.corpus, category: na.category, fed_as: { tool: "Bash", caller: "sdd-conductor", malformed: false }, expected: "deny", expected_source: "corpus", actual: "deny" });
        recount(r);
      },
      part: "replays cases that its mechanism excludes",
      id: "BG-258",
    },
    { variant: OC_NATIVE, mutate: (r) => void Object.assign(caseOf(r, "PG-205"), { expected: "allow", expected_source: "corpus", actual: "allow" }), part: "records expectations other than C002-IF-009 §2.1", id: "PG-205" },
    {
      variant: OC_SDD,
      mutate: (r) => {
        const c = caseOf(r, "PG-163");
        c.fed_as.malformed = true;
        c.expected_source = "C002-REQ-630";
      },
      part: "records expectations other than C002-IF-009 §2.1",
      id: "PG-163",
    },
    { variant: OC_SDD, mutate: (r) => void (r.replay_host = { platform: "win32", capabilities: [] }), part: "replay host lacks file-symlink", id: "PG-163" },
  ];
  for (const row of rows) {
    const mech = MECHANISMS_OF_MODE[row.variant.mode][0] as Mechanism;
    const r = check({ variant: row.variant, mutate: { [mech]: row.mutate } });
    refused(r, `${mech}: ${row.part}`);
    assert.deepEqual(r.err, [`ERR-REL-012: opencode: replay report docs/releases/opencode/${FX_VERSION}/replay-${mech}.json (${mech}) ${row.part}: ${row.id}`], row.part);
  }
  // C002-REQ-401 and C002-REQ-517 hold on sdd-mcp-server only (revised C002-IF-009 §2.1).
  const moved = check({ variant: OC_NATIVE, mutate: { "opencode-permissions": (r) => void Object.assign(caseOf(r, "PG-135"), { expected: "deny", expected_source: "C002-REQ-401", actual: "deny" }) } });
  assert.deepEqual(moved.err, [`ERR-REL-012: opencode: replay report docs/releases/opencode/${FX_VERSION}/replay-opencode-permissions.json (opencode-permissions) records expectations other than C002-IF-009 §2.1: PG-135`]);
  // A missing report is missing evidence.
  const gone = check({ variant: OC_SDD, reports: { "sdd-mcp-server": null } });
  assert.deepEqual(gone.err, [`ERR-REL-009: opencode: evidence corpus replay missing or unreadable at docs/releases/opencode/${FX_VERSION}/replay-sdd-mcp-server.json`]);
});

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
