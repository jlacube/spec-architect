// C002-T-028 — wiring variants, anchors and skill inlining (C002-IF-001 §3 steps 2, 3 and 5, §4; C002-COMP-001,
// C002-COMP-002, C002-COMP-016) on the real source plugin and on fx-src (a copy of it on disk with a
// variant entry removed, an anchor planted or a variant file changed). Expected texts are read from the
// tables and the variant files, never from a copy (C002-CAP-01 acceptance, verification note).
//   C002-TC-115 (C002-TS-115)  skill bodies inlined
//   C002-TC-117 (C002-TS-117)  interview wiring per target
//   C002-TC-118 (C002-TS-118)  sdd CLI invocation lines per target
//   C002-TC-119 (C002-TS-119)  gate wiring without a Copilot variant
//   C002-TC-120 (C002-TS-120)  CLI invocation line, command wiring or doctor host rows without a variant
//   C002-TC-123 (C002-TS-123)  doctor host rows per target
//   C002-TC-121 (C002-TS-121)  the generator's part: no variant in a Claude Code file, every variant file
//                               under targets/, source files byte-unchanged by a run
//   C002-TC-134 (C002-TS-134)  the inlined-body clause (carried from C002-T-027)
// Carried: the plugin structure checks of C002-TC-121 (PLG-SIZE-001) and C002-TC-122 (PLG-VAR-001,
// `npm run check` on a pasted variant) to C002-T-035; the staging check of C002-TC-121 is C002-T-015's.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../../../scripts/generate/main.ts";
import { readSource } from "../../../scripts/generate/reader.ts";
import { loadTargetTable, TARGETS, type MappingTable, type Target } from "../../../scripts/generate/tables.ts";
import { translateBodies, type TranslatedDoc } from "../../../scripts/generate/translate/constructs.ts";
import { listField } from "../../../scripts/generate/translate/frontmatter.ts";
import { inlineSkills, skillHeading, type InlinedAgent } from "../../../scripts/generate/translate/inline.ts";
import { tokenValues, variantPath, WIRING_SECTION } from "../../../scripts/generate/translate/wiring.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const source = readSource(PLUGIN);
assert.deepEqual(source.diagnostics, [], "the source plugin reads without diagnostics");
const tables = Object.fromEntries(TARGETS.map((t) => [t, loadTargetTable(root, t)])) as Record<Target, MappingTable>;
const NAME: Record<Target, string> = { opencode: "OpenCode", copilot: "Copilot" };
const peers = Object.values(tables);

interface Generated {
  docs: Map<string, TranslatedDoc>;
  agents: Map<string, InlinedAgent>;
}
const cache = new Map<Target, Generated>();
/** The translated docs and inlined agents of the real plugin for one target; fails on any diagnostic. */
function generated(t: Target): Generated {
  const hit = cache.get(t);
  if (hit) return hit;
  const input = { source: source.source, table: tables[t], target: t, mode: tables[t].enforcement_mode, peers };
  const bodies = translateBodies(input);
  assert.deepEqual(bodies.diagnostics, [], `${t}: no body diagnostics`);
  const inlined = inlineSkills(source.source, bodies.docs, t);
  assert.deepEqual(inlined.diagnostics, [], `${t}: no inlining diagnostics`);
  const g = { docs: new Map(bodies.docs.map((d) => [d.path, d])), agents: new Map(inlined.agents.map((a) => [a.name, a])) };
  cache.set(t, g);
  return g;
}

const sourceText = (path: string) => source.source.files.find((f) => f.path === path)!.text;
const sourceLine = (path: string, n: number) => sourceText(path).split("\n")[n - 1]!;
/** Agents whose source `skills` field lists `skill`. */
const inliners = (skill: string) => source.source.agents.filter((a) => listField(a.data?.["skills"]).includes(skill)).map((a) => a.name);
/** The variant of `id` for target `t`, its tokens resolved (the expected generated text, before constructs). */
function variantText(t: Target, id: string): string {
  const v = tables[t].variants.find((x) => x.id === id);
  assert.ok(v, `${t}: variant ${id}`);
  let text = sourceText(variantPath(t, v)).replace(/\n+$/, "");
  for (const [k, value] of tokenValues(source.source, tables[t], tables[t].enforcement_mode)) text = text.replaceAll(`{{${k}}}`, value);
  assert.ok(!/\{\{/.test(text), `${t}: ${id} has no unresolved token`);
  return text;
}
/** The generated lines that come from source line `n` (a variant takes its anchor's first line). */
const linesFrom = (d: TranslatedDoc, n: number) => d.body.split("\n").filter((_, i) => d.sourceLines[i] === n).join("\n");
/** The part of an inlined agent body under `## Skill: <name>`. */
function inlinedPart(a: InlinedAgent, skill: string): string {
  const start = a.body.indexOf(`${skillHeading(skill)}\n`);
  assert.ok(start >= 0, `${a.name} inlines ${skill}`);
  const next = a.body.indexOf("\n## Skill: ", start + 1);
  return a.body.slice(start, next < 0 ? undefined : next);
}

function fxSrc(base: string): string {
  const src = join(base, "src", "plugins", "architect");
  cpSync(PLUGIN, src, { recursive: true });
  return src;
}
function run(args: string[]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = main(args, { cwd: root, stdout: (l) => stdout.push(l), stderr: (l) => stderr.push(l) });
  return { code, stdout, stderr };
}
const editJson = (path: string, f: (data: Record<string, unknown>) => void) => {
  const data = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  f(data);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
};
const dropVariant = (src: string, t: Target, id: string) =>
  editJson(join(src, "targets", `${t}.json`), (d) => {
    const before = (d["variants"] as { id: string }[]).length;
    d["variants"] = (d["variants"] as { id: string }[]).filter((v) => v.id !== id);
    assert.equal((d["variants"] as unknown[]).length, before - 1, `${t}: ${id} removed`);
  });
const fix002 = (t: Target) => `Fix: Add the variant file under \`plugins/architect/targets/${t}/wiring/\` and its \`variants\` entry`;
/** Runs the generator on fx-src after `plant`; returns the run. */
function onFixture(plant: (src: string) => void) {
  const base = mkdtempSync(join(tmpdir(), "sdd-wr-"));
  try {
    const src = fxSrc(base);
    plant(src);
    const r = run(["--source", src, "--out", join(base, "out")]);
    for (const t of TARGETS) assert.ok(!existsSync(join(base, "out", t)) || r.code === 0, `no ${t} package after a failed run`);
    return r;
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

// --- The real plugin generates with 0 diagnostics (step outline 4) ---
test("the real plugin generates both targets with 0 diagnostics; every anchor has a variant for both targets", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-wr-"));
  try {
    const r = run(["--out", join(base, "out")]);
    assert.deepEqual(r.stderr, []);
    assert.equal(r.code, 0);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  const ids = (t: Target) => tables[t].variants.map((v) => `${v.id}\0${v.file}\0${JSON.stringify(v.anchor)}`).sort();
  assert.deepEqual(ids("opencode"), ids("copilot"), "both tables name the same anchors");
  for (const t of TARGETS) {
    const g = generated(t);
    for (const d of g.docs.values()) assert.ok(!d.body.includes(`# ${WIRING_SECTION}`), `${t}: ${d.path} keeps no Claude Code wiring section`);
  }
});

// --- C002-TC-115 ---
for (const t of TARGETS) {
  test(`C002-TC-115 (C002-TS-115): sdd-test-designer inlines its three skills with the ${NAME[t]} variants`, () => {
    const skills = ["acceptance-scenarios", "dod-catalogue", "sdd-conventions"];
    assert.deepEqual(listField(source.source.agents.find((a) => a.name === "sdd-test-designer")!.data?.["skills"]), skills);
    const g = generated(t);
    const a = g.agents.get("sdd-test-designer")!;
    assert.deepEqual(a.skills, skills);
    assert.ok(a.body.startsWith(g.docs.get("agents/sdd-test-designer.md")!.body.trimEnd()), "the agent body comes first");
    const headings = [...a.body.matchAll(/^## Skill: (.+)$/gm)].map((m) => m[1]);
    assert.deepEqual(headings, skills, "one heading per skill, in source order, and no other skill");
    for (const s of skills) assert.ok(inlinedPart(a, s).includes(g.docs.get(`skills/${s}/SKILL.md`)!.body.trim()), `${t}: body of ${s}`);
    // The inlined sdd-conventions carries the target's CLI variant.
    assert.ok(inlinedPart(a, "sdd-conventions").includes(variantText(t, "cli-conventions")));
    for (const other of source.source.skills.filter((s) => !skills.includes(s.name)))
      assert.ok(!a.body.includes(g.docs.get(other.doc.path)!.body.trim()), `${t}: no body of ${other.name}`);
  });
}

// --- C002-TC-117 ---
for (const t of TARGETS) {
  test(`C002-TC-117 (C002-TS-117): the interview wiring section takes the ${NAME[t]} variant, in the skill and every inlining agent`, () => {
    const path = "skills/interview-protocol/SKILL.md";
    assert.equal(sourceLine(path, 119), `## ${WIRING_SECTION}`);
    assert.ok(sourceText(path).split("\n").slice(118).join("\n").includes("AskUserQuestion"), "the source section names AskUserQuestion");
    const g = generated(t);
    const doc = g.docs.get(path)!;
    const expected = variantText(t, "interview-protocol");
    assert.equal(linesFrom(doc, 119), expected, "the variant in place of the section");
    assert.ok(!doc.body.includes("AskUserQuestion"));
    assert.ok(expected.includes(t === "opencode" ? "`question` tool" : "`ask_user`"), "the host question tool");
    const agents = inliners("interview-protocol");
    assert.ok(agents.includes("sdd-conductor"));
    for (const name of agents) {
      const part = inlinedPart(g.agents.get(name)!, "interview-protocol");
      assert.ok(part.includes(expected), `${t}: ${name}`);
      assert.ok(!g.agents.get(name)!.body.includes("AskUserQuestion"), `${t}: ${name}`);
    }
  });
}

// --- C002-TC-118 ---
const SHELL: Record<Target, string> = { opencode: "sdd-shell_run_command", copilot: "sdd-shell-run_command" };
for (const [file, line, id] of [
  ["skills/sdd-conventions/SKILL.md", 13, "cli-conventions"],
  ["agents/sdd-conductor.md", 19, "cli-conductor"],
  ["agents/sdd-auditor.md", 13, "cli-auditor"],
] as const) {
  for (const t of TARGETS) {
    test(`C002-TC-118 (C002-TS-118): ${file}:${line} takes the ${NAME[t]} CLI variant`, () => {
      assert.ok(sourceLine(file, line).includes("${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"));
      const g = generated(t);
      const expected = variantText(t, id);
      const doc = g.docs.get(file)!;
      assert.equal(linesFrom(doc, line), expected);
      const texts = [doc.body];
      if (file.startsWith("skills/")) {
        const agents = inliners("sdd-conventions");
        assert.ok(agents.length > 1);
        for (const name of agents) {
          const part = inlinedPart(g.agents.get(name)!, "sdd-conventions");
          assert.ok(part.includes(expected), `${t}: ${name}`);
          texts.push(part);
        }
      } else texts.push(g.agents.get(file.slice("agents/".length, -".md".length))!.body);
      for (const x of texts) assert.ok(!x.includes("scripts/sdd.mjs"), `${t}: no script path`);
      // The token {{server_shell}}: the target's call form of the command tool, never the grant form.
      assert.equal(tokenValues(source.source, tables[t], tables[t].enforcement_mode).get("server_shell"), SHELL[t]);
      if (sourceText(variantPath(t, tables[t].variants.find((v) => v.id === id)!)).includes("{{server_shell}}")) assert.ok(expected.includes(SHELL[t]));
      assert.ok(!expected.includes("sdd-shell/run_command"));
    });
  }
}

// --- C002-TC-123 ---
for (const t of TARGETS) {
  test(`C002-TC-123 (C002-TS-123): the doctor host rows take the ${NAME[t]} variant`, () => {
    const path = "commands/doctor.md";
    assert.ok(sourceLine(path, 12).includes("Claude Code"), "probe list names Claude Code");
    assert.ok(sourceLine(path, 33).startsWith("| Claude Code | `claude --version`"), "remedies row");
    const g = generated(t);
    const doc = g.docs.get(path)!;
    for (const [id, n] of [["doctor-probe", 11], ["doctor-report", 17], ["doctor-remedies-host", 33]] as const)
      assert.equal(linesFrom(doc, n), variantText(t, id), `${t}: ${id}`);
    const rows = doc.body.split("\n").filter((l) => l.startsWith("| "));
    assert.ok(rows.some((l) => l.startsWith(`| ${tables[t].host.name} |`)), "host row");
    assert.ok(rows.some((l) => l.startsWith("| sdd CLI |")), "sdd CLI row");
    assert.ok(!rows.some((l) => l.startsWith("| Claude Code |")), "no Claude Code row");
    assert.ok(!doc.body.includes("claude --version"));
    assert.ok(!doc.body.includes("Claude Code"), "the body names the host only");
    if (t === "opencode") assert.ok(doc.body.includes(`= ${tables.opencode.host.tested_versions["opencode"]}`), "tested version from the table");
  });
}

// --- C002-TC-134 (the inlined-body clause) ---
for (const [skill, section, sourceName, call, grant] of [
  ["research-protocol", 93, "mcp__plugin_architect_context7__query-docs", "context7-query-docs", "context7/query-docs"],
  ["code-discovery", 109, "mcp__plugin_architect_serena__find_symbol", "serena-find_symbol", "serena/find_symbol"],
] as const) {
  test(`C002-TC-134 (C002-TS-134): every Copilot agent that inlines ${skill} names "${call}"`, () => {
    const g = generated("copilot");
    const agents = inliners(skill);
    assert.ok(agents.length > 0);
    const wiring = linesFrom(g.docs.get(`skills/${skill}/SKILL.md`)!, section);
    assert.ok(wiring.includes(call));
    for (const name of agents) {
      const part = inlinedPart(g.agents.get(name)!, skill);
      assert.ok(part.includes(wiring), `${name}: the translated wiring variant`);
      assert.ok(part.includes(call) && !part.includes(sourceName) && !part.includes(grant), name);
    }
  });
}

// --- C002-TC-119 ---
test('C002-TC-119 (C002-TS-119): gate wiring with an OpenCode variant and no Copilot variant names line 87 and "copilot" only', () => {
  const r = onFixture((src) => dropVariant(src, "copilot", "gate-protocol"));
  assert.equal(r.code, 1);
  assert.deepEqual(r.stderr, [`ERR-GEN-002: skills/gate-protocol/SKILL.md:87: section "${WIRING_SECTION}" has no copilot wiring variant. ${fix002("copilot")}`]);
  assert.ok(!r.stderr.join("\n").includes("opencode"));
  assert.deepEqual(r.stdout, ["copilot: not written (1 errors)", "opencode: not written (0 errors)"]);
});

// --- C002-TC-120 ---
for (const [fixture, file, line, present, missing, plant] of [
  ["fx-plugin-novariant-cli", "skills/sdd-conventions/SKILL.md", 13, "copilot", "opencode", (src: string) => dropVariant(src, "opencode", "cli-conventions")],
  ["fx-plugin-novariant-agent", "agents/sdd-auditor.md", 13, "opencode", "copilot", (src: string) => dropVariant(src, "copilot", "cli-auditor")],
  [
    "fx-plugin-novariant-cmd",
    "commands/archive.md",
    20,
    "opencode",
    "copilot",
    (src: string) => {
      const path = join(src, "commands", "archive.md");
      const lines = readFileSync(path, "utf8").replace(/\r\n/g, "\n").split("\n");
      assert.equal(lines.length, 19, "18 lines and a final newline");
      lines.splice(18, 1, "", `## ${WIRING_SECTION}`, "", "- Confirm the archive in one AskUserQuestion round.", "");
      writeFileSync(path, lines.join("\n"));
      writeFileSync(join(src, "targets", "opencode", "wiring", "archive.md"), "## OpenCode wiring\n\n- Confirm the archive in one `question` tool round.\n");
      editJson(join(src, "targets", "opencode.json"), (d) =>
        (d["variants"] as unknown[]).push({ id: "archive", file: "commands/archive.md", anchor: { section: WIRING_SECTION }, text_file: "archive.md" }),
      );
    },
  ],
  ["fx-plugin-novariant-doctor", "commands/doctor.md", 33, "opencode", "copilot", (src: string) => dropVariant(src, "copilot", "doctor-remedies-host")],
] as const) {
  test(`C002-TC-120 (C002-TS-120): ${fixture} — ${file}:${line} with a ${present} variant and no ${missing} variant`, () => {
    const r = onFixture(plant);
    assert.equal(r.code, 1);
    assert.equal(r.stderr.length, 1, r.stderr.join("\n"));
    assert.ok(r.stderr[0]!.startsWith(`ERR-GEN-002: ${file}:${line}: `), r.stderr[0]);
    assert.ok(r.stderr[0]!.includes(` has no ${missing} wiring variant. ${fix002(missing)}`), r.stderr[0]);
    assert.ok(!r.stderr[0]!.includes(present), "the present target is not named");
  });
}

// --- Stale anchors, tokens, table rules, leaks in variant text ---
test("a variant whose anchor is no longer in the source is ERR-GEN-005; the anchor line it left is ERR-GEN-002", () => {
  const r = onFixture((src) => {
    const path = join(src, "agents", "sdd-auditor.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("`;`, `|` or redirection;", "`;`, `|` or any redirection;"));
  });
  assert.equal(r.code, 1);
  const lines = r.stderr.map((l) => l.slice(0, l.indexOf(". Fix:")));
  assert.deepEqual(lines.slice(0, 2), [
    'ERR-GEN-005: agents/sdd-auditor.md: anchor of variant "cli-auditor" not found for copilot',
    'ERR-GEN-005: agents/sdd-auditor.md: anchor of variant "cli-auditor" not found for opencode',
  ]);
  assert.equal(lines.length, 4, lines.join("\n"));
  for (const [i, t] of [[2, "copilot"], [3, "opencode"]] as const) {
    assert.ok(lines[i]!.startsWith('ERR-GEN-002: agents/sdd-auditor.md:13: line "`;`, `|` or any redirection;'), lines[i]);
    assert.ok(lines[i]!.endsWith(`" has no ${t} wiring variant`), lines[i]);
  }
});

test("an unknown token in a variant file is ERR-GEN-006 naming the variant file and line", () => {
  const r = onFixture((src) => writeFileSync(join(src, "targets", "opencode", "wiring", "cli-auditor.md"), "`;`, `|` or redirection; `sdd` is {{sdd_path}}):\n"));
  assert.equal(r.code, 1);
  assert.deepEqual(r.stderr, ['ERR-GEN-006: targets/opencode/wiring/cli-auditor.md:1: unknown token "{{sdd_path}}". Fix: Use a token of C002-IF-001 §4']);
});

test("a Claude Code construct left in a variant text is ERR-GEN-001 naming the variant file and line", () => {
  const r = onFixture((src) => writeFileSync(join(src, "targets", "copilot", "wiring", "cli-conductor.md"), 'The CLI is `sdd`.\nOr `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"`.\n'));
  assert.equal(r.code, 1);
  assert.equal(r.stderr.length, 1, r.stderr.join("\n"));
  assert.ok(r.stderr[0]!.startsWith('ERR-GEN-001: targets/copilot/wiring/cli-conductor.md:2: CLI invocation "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"'), r.stderr[0]);
});

test("a missing variant file, a duplicate id and overlapping anchors break the table rules (ERR-GEN-004)", () => {
  const r = onFixture((src) => {
    rmSync(join(src, "targets", "opencode", "wiring", "doctor-probe.md"));
    editJson(join(src, "targets", "copilot.json"), (d) => {
      const vs = d["variants"] as { id: string; file: string; anchor: unknown; text_file: string }[];
      const probe = vs.find((v) => v.id === "doctor-probe")!;
      vs.push({ ...probe }, { ...probe, id: "doctor-probe-again" });
    });
  });
  assert.equal(r.code, 1);
  const lines = r.stderr.map((l) => l.slice(0, l.indexOf(". Fix:")));
  assert.ok(lines.includes("ERR-GEN-004: targets/opencode.json: /variants/2/text_file: targets/opencode/wiring/doctor-probe.md does not exist"), lines.join("\n"));
  assert.ok(lines.some((l) => l.startsWith('ERR-GEN-004: targets/copilot.json: /variants/13/id: variant id "doctor-probe" is not unique')), lines.join("\n"));
  assert.ok(lines.some((l) => l.startsWith('ERR-GEN-004: targets/copilot.json: variants "doctor-probe" and "doctor-probe-again" overlap in commands/doctor.md')), lines.join("\n"));
});

// --- C002-TC-121 (generator's part) and C002-REQ-113 ---
const hashTree = (dir: string, rel = ""): Map<string, string> => {
  const out = new Map<string, string>();
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const p = rel === "" ? e.name : `${rel}/${e.name}`;
    if (e.isDirectory()) for (const [k, v] of hashTree(dir, p)) out.set(k, v);
    else out.set(p, createHash("sha256").update(readFileSync(join(dir, p))).digest("hex"));
  }
  return out;
};

test("C002-TC-121 (C002-TS-121): the variants live under targets/ only; Claude Code files hold none and a run leaves them byte-unchanged", () => {
  const claudeFiles = source.source.files.filter((f) => /^(agents|commands|skills)\//.test(f.path));
  for (const t of TARGETS)
    for (const v of tables[t].variants) {
      const path = variantPath(t, v);
      assert.ok(path.startsWith(`targets/${t}/wiring/`) && source.source.files.some((f) => f.path === path), `${t}: ${v.id} under targets/`);
      // Every variant line of its own (tokens resolved or not; not a line kept from the anchored source
      // file) is absent from the Claude Code files.
      const kept = new Set(sourceText(v.file).split("\n").map((x) => x.trim()));
      const own = [...variantText(t, v.id).split("\n"), ...sourceText(path).split("\n")].map((x) => x.trim()).filter((x) => x.length > 20 && !kept.has(x));
      assert.ok(own.length > 0, `${t}: ${v.id} differs from the source`);
      for (const f of claudeFiles) {
        const lines = new Set(f.text.split("\n").map((x) => x.trim()));
        for (const l of own) assert.ok(!lines.has(l), `${f.path} holds the ${t} variant line "${l}"`);
      }
    }
  for (const f of claudeFiles) assert.ok(!/\bask_user\b|\btool_search_tool\b/.test(f.text), `${f.path}: no Copilot tool name`);

  const parts = ["agents", "commands", "skills"];
  const before = new Map(parts.map((p) => [p, hashTree(join(PLUGIN, p))]));
  const base = mkdtempSync(join(tmpdir(), "sdd-wr-"));
  try {
    assert.equal(run(["--out", join(base, "out")]).code, 0);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  for (const p of parts) assert.deepEqual(hashTree(join(PLUGIN, p)), before.get(p), `${p}/ byte-unchanged`);
});

test("inlining: a preloaded skill that is not in the source plugin is ERR-GEN-007 naming the agent's skills line", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-wr-"));
  try {
    const src = fxSrc(base);
    const path = join(src, "agents", "sdd-auditor.md");
    const text = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
    writeFileSync(path, text.replace("skills: sdd-conventions", "skills: sdd-conventions, no-such-skill"));
    mkdirSync(join(base, "out"), { recursive: true });
    const r = run(["--source", src, "--out", join(base, "out")]);
    assert.equal(r.code, 1);
    const line = text.split("\n").findIndex((l) => l.startsWith("skills:")) + 1;
    assert.deepEqual(
      r.stderr.map((l) => l.slice(0, l.indexOf(". Fix:"))),
      TARGETS.map(() => `ERR-GEN-007: agents/sdd-auditor.md:${line}: preloaded skill "no-such-skill" is not a skill of the source plugin`),
    );
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
