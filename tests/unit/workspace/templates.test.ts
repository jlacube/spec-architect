// Artifact templates (C001-T-015): completeness against C001-IF-06 §2/§3, override resolution,
// rendering, frontmatter per C001-IF-03 §1, portability (C001-REQ-1118) and placeholder words
// (C001-REQ-719).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { buildChangeGraph } from "../../../src/model/graph.ts";
import { listTemplates, placeholders, renderTemplate, resolveTemplate, type Profile } from "../../../src/workspace/templates.ts";
import { repoRoot } from "../../helpers.ts";

const pluginRoot = join(repoRoot(), "plugins", "architect");

// C001-IF-06 §2 (full profile). Generated files (trace.json, 80-traceability.md, 85-open-items.md)
// and approvals.json have no template. Entity files use their placeholder file names.
const FULL = [
  "change.md", "ids.json",
  "00-ideation/ideation.md", "00-ideation/questions-log.md", "00-ideation/critic-report.md",
  "00-ideation/research/R-{{SEQ}}-{{SLUG}}.md", "00-ideation/options/OA-{{SEQ}}-{{SLUG}}.md",
  "00-ideation/decisions/DEC-{{SEQ}}-{{SLUG}}.md", "00-ideation/evidence/baseline-survey.md",
  "10-spec/00-index.md",
  "10-spec/10-context/problem-and-goals.md", "10-spec/10-context/stakeholders-and-personas.md",
  "10-spec/10-context/scope.md", "10-spec/10-context/current-state.md",
  "10-spec/20-capabilities/CAP-{{NN}}-{{SLUG}}/stories.md", "10-spec/20-capabilities/CAP-{{NN}}-{{SLUG}}/requirements.md",
  "10-spec/20-capabilities/CAP-{{NN}}-{{SLUG}}/acceptance.md", "10-spec/20-capabilities/CAP-{{NN}}-{{SLUG}}/ui-notes.md",
  "10-spec/30-nfr/nfr.md",
  "10-spec/40-domain/domain-model.md", "10-spec/40-domain/state-machines.md", "10-spec/40-domain/glossary-delta.md",
  "10-spec/50-interfaces/README.md", "10-spec/50-interfaces/errors.md",
  "10-spec/50-interfaces/{{SLUG}}-cli.md", "10-spec/50-interfaces/{{SLUG}}.md",
  "10-spec/60-architecture/architecture.md", "10-spec/60-architecture/constraints.md",
  "10-spec/60-architecture/sequences/{{SLUG}}.md",
  "10-spec/70-dod.md", "10-spec/90-critic-report.md",
  "20-plan/00-index.md", "20-plan/10-strategy.md",
  "20-plan/20-decisions/ADR-{{SEQ}}-{{SLUG}}.md", "20-plan/20-decisions/OA-{{SEQ}}-{{SLUG}}.md",
  "20-plan/30-impact/blast-radius.md", "20-plan/30-impact/hotspots.md", "20-plan/30-impact/regression-set.md",
  "20-plan/40-work-breakdown.md", "20-plan/50-tasks/T-{{SEQ}}-{{SLUG}}.md",
  "20-plan/60-test-plan.md", "20-plan/70-risks.md", "20-plan/75-rollout.md", "20-plan/78-observability.md",
  "20-plan/90-critic-report.md", "20-plan/handoff.md",
];
// C001-IF-06 §3 (lite profile).
const LITE = ["change.md", "ids.json", "00-ideation/ideation.md", "00-ideation/questions-log.md", "10-spec/spec.md", "10-spec/dod.md", "20-plan/plan.md", "20-plan/handoff.md"];

const VARS = {
  CHANGE: "CHG-004", P: "C004", NNN: "004", TITLE: "Sample change", DATE: "2026-10-11", KIND: "greenfield",
  SEQ: "001", NN: "01", B: "1", SLUG: "sample", NAME: "Sample entity",
};

test("every file of C001-IF-06 §2 and §3 has a template", () => {
  assert.deepEqual(listTemplates("full", { pluginRoot }), [...FULL].sort());
  assert.deepEqual(listTemplates("lite", { pluginRoot }), [...LITE].sort());
});

for (const profile of ["full", "lite"] as Profile[]) {
  test(`${profile} templates render completely, with valid frontmatter and portable wording`, () => {
    for (const rel of listTemplates(profile, { pluginRoot })) {
      const raw = resolveTemplate(profile, rel, { pluginRoot }).text;
      const text = renderTemplate(raw, { ...VARS, PROFILE: profile });
      assert.deepEqual(placeholders(text), [], rel);
      // C001-REQ-1118: no Claude-Code-specific tool names in templates.
      assert.doesNotMatch(raw, /AskUserQuestion|Agent\(|TodoWrite|mcp__/, rel);
      // C001-REQ-719: no placeholder words outside code.
      const prose = raw.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
      assert.doesNotMatch(prose, /\bTBD\b|\bTODO\b|lorem|\betc\./, rel);
      assert.equal(raw.includes("\r"), false, rel);
      if (rel.endsWith(".json")) {
        assert.doesNotThrow(() => JSON.parse(text), rel);
        continue;
      }
      // Raw templates stay readable as Markdown with YAML frontmatter.
      assert.equal(splitFrontmatter(raw).error, undefined, `${rel} (raw)`);
      const doc = splitFrontmatter(text);
      assert.equal(doc.error, undefined, rel);
      const keys = rel === "change.md" ? ["id", "title", "kind", "profile", "status", "phase", "phases"] : ["id", "artifact", "change", "phase", "status"];
      for (const k of keys) assert.ok(doc.data && k in doc.data, `${rel}: ${k}`);
      if (rel !== "change.md") assert.equal(doc.data?.["change"], "CHG-004", rel);
    }
  });
}

test("a full change rendered from the templates parses into the model without duplicate IDs", () => {
  const root = mkdtempSync(join(tmpdir(), "sdd-tpl-"));
  try {
    const dir = join(root, ".sdd", "004-sample");
    for (const rel of listTemplates("full", { pluginRoot })) {
      // Option analyses of ideation and plan share one OA sequence in a real change.
      const vars = { ...VARS, PROFILE: "full", SEQ: rel.startsWith("20-plan/20-decisions/OA-") ? "002" : VARS.SEQ };
      const target = join(dir, ...renderTemplate(rel, vars).split("/"));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, renderTemplate(resolveTemplate("full", rel, { pluginRoot }).text, vars));
    }
    const g = buildChangeGraph(dir);
    for (const f of g.files) assert.equal(f.frontmatterError, undefined, f.path);
    for (const id of ["C004-US-101", "C004-REQ-101", "C004-AC-101.1", "C004-TS-101", "C004-NFR-101", "C004-COMP-01", "C004-T-001", "C004-ADR-001", "C004-OA-001", "C004-CAP-01"])
      assert.equal(g.byId.get(id)?.length, 1, id);
    assert.deepEqual([...g.byId.entries()].filter(([, v]) => v.length > 1).map(([k]) => k), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a template under .sdd/_templates/<profile>/ overrides the plugin default", () => {
  const root = mkdtempSync(join(tmpdir(), "sdd-tpl-"));
  try {
    const sddDir = join(root, ".sdd");
    const override = join(sddDir, "_templates", "full", "20-plan", "70-risks.md");
    mkdirSync(dirname(override), { recursive: true });
    writeFileSync(override, "# Our risk register\n");
    const r = resolveTemplate("full", "20-plan/70-risks.md", { pluginRoot, sddDir });
    assert.equal(r.source, "override");
    assert.equal(r.text, "# Our risk register\n");
    assert.equal(resolveTemplate("full", "20-plan/75-rollout.md", { pluginRoot, sddDir }).source, "plugin");
    assert.equal(resolveTemplate("lite", "20-plan/plan.md", { pluginRoot, sddDir }).source, "plugin");
    assert.throws(() => resolveTemplate("full", "20-plan/unknown.md", { pluginRoot }), /no full template/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("renderTemplate replaces only the given keys", () => {
  assert.equal(renderTemplate("{{P}}-REQ-{{B}}01 in {{CHANGE}} {{UNKNOWN}}", { P: "C004", B: "1" }), "C004-REQ-101 in {{CHANGE}} {{UNKNOWN}}");
  assert.deepEqual(placeholders("{{A}} {{B}} {{A}}"), ["A", "B"]);
});
