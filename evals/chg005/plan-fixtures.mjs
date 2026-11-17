// Plan-phase case workspaces of CHG-005 (C005-TS-120, 121, 141 … 143): a full-profile change 002 "CSV
// export" or a lite change 003 "Coupon codes", ideation approved through the CLI and stating that the change
// ends with its archive into the living specs, 10-spec approved with its real hash, 20-plan draft. The
// planner is dispatched through the eval relay (architect:eval-dispatcher), as in evals/cap06/planner.mjs.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { constitution, liteSpecDraftedAt } from "../cap02/drafting.mjs";
import { toolCalls } from "../harness/assert.mjs";
import { dispatchPrompt } from "../harness/overlay.mjs";
import { CLI, edit, git, sdd, write } from "../harness/workspaces.mjs";
import { execFileSync } from "node:child_process";

export const FULL = ".sdd/002-csv-export";
export const LITE = ".sdd/003-coupon-codes";

const ARCHIVE_SENTENCE = "The change ends with its archive into the living specs (`sdd archive {NNN}`), as its last task.";

const ideation = (nnn) => `# Ideation — CSV export

## 1. Document control

CHG-${nnn}, version 1, approved at G1.

## 2. Problem statement

Shop managers copy order lists by hand into spreadsheets.

## 3. Q&A decision record

Q-export-01: one CSV file per export, UTF-8, comma separated (P-01, round 1).

## 4. Goals and non-goals

Goal: managers export the orders of a date range as CSV. Non-goal: other formats.

## 5. Scope boundary

In scope: one capability, **export** (the export endpoint and the cleanup of old export files). Out of scope: scheduling.

## 6. Research index

None.

## 7. Options and decisions index

None needed.

## 8. Design direction

An export endpoint writes a CSV file to the export folder; a nightly job removes export files older than 30 days. ${ARCHIVE_SENTENCE.replace("{NNN}", nnn)}

## 9. Risks

Large date ranges (low).

## 10. Assumptions

None.

## 11. Open questions

None blocking.

## 12. Sources

None.
`;

const REQS = [
  ["101", "Export orders", "event-driven", "WHEN a manager requests an export of a date range, THE export service SHALL write the orders of that range to one CSV file."],
  ["102", "Archive old CSV exports", "event-driven", "WHEN the nightly cleanup job runs, THE export service SHALL move export files older than 30 days to the export archive folder."],
];

function specFiles(root, reqs) {
  const S = `${FULL}/10-spec`;
  write(root, `${S}/20-capabilities/CAP-01-export/stories.md`, `---\nid: C002-CAP-01\nartifact: spec/stories\n---\n\n### C002-US-101 — Export orders\n- **As a** shop manager\n- **I want** to export orders as CSV\n- **So that** I stop copying them by hand\n- **Value / outcome:** no manual copying\n- **Priority:** Must · **Size hint:** M · **Capability:** C002-CAP-01\n- **Context & notes:** none\n- **Requirements:** ${reqs.map(([id]) => `C002-REQ-${id}`).join(", ")}\n- **Traces to:** IDEA\n`);
  write(root, `${S}/20-capabilities/CAP-01-export/requirements.md`, `---\nid: C002-CAP-01\nartifact: spec/requirements\n---\n\n${reqs.map(([id, t, p, s]) => `### C002-REQ-${id} — ${t}\n- **Pattern:** ${p}\n- **Statement:** ${s}\n- **Rationale:** ideation Goals\n- **Stories:** C002-US-101\n- **Priority:** Must\n- **Acceptance:** C002-AC-${id}.1\n`).join("\n")}`);
  write(root, `${S}/20-capabilities/CAP-01-export/acceptance.md`, `---\nid: C002-CAP-01\nartifact: spec/acceptance\n---\n\n${reqs.map(([id, t]) => `## C002-REQ-${id}\n\n#### C002-AC-${id}.1 — ${t}\n\`\`\`gherkin\nScenario: C002-TS-${id} — ${t.toLowerCase()}\n  Given orders in the shop\n  When the ${t.toLowerCase()} runs\n  Then the expected outcome of REQ-${id} is observed\n\`\`\`\n`).join("\n")}`);
  write(root, `${S}/70-dod.md`, `---\nid: C002-SPEC-DOD\nartifact: spec/dod\n---\n# Definition of done\n\n| ID | Statement | Evidence type | Covers |\n|---|---|---|---|\n| C002-DOD-001 | Acceptance tests pass | test-report | ${reqs.map(([id]) => `C002-REQ-${id}`).join(", ")} |\n`);
}

const hashOf = (root, nnn, phase) => execFileSync(process.execPath, [CLI, "hash", nnn, phase], { cwd: root, encoding: "utf8" }).trim();

/** Marks `phase` approved with its real hash (change.md), as `gate approve` records it. */
function approve(root, dir, nnn, phase) {
  const h = hashOf(root, nnn, phase);
  edit(root, `${dir}/change.md`, (t) =>
    t.split("\n").map((l) => (l.startsWith(`  ${phase}:`) ? `  ${phase}: { status: approved, approved_hash: "${h}", approved_at: 2026-11-17, approved_by: "p01" }` : l)).join("\n"));
}

/** Full change 002 at 20-plan draft; `cleanup` adds the requirement "Archive old CSV exports". */
export function fullAtPlan({ cleanup = false } = {}) {
  return (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    constitution(root, "approved");
    sdd(root, "change", "new", "Earlier change", "--profile", "lite");
    sdd(root, "change", "new", "CSV export", "--profile", "full", "--kind", "greenfield");
    write(root, `${FULL}/00-ideation/ideation.md`, ideation("002"));
    edit(root, `${FULL}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1in-review"));
    sdd(root, "gate", "approve", "002", "00-ideation", "--note", "Approve", "--by", "p01");
    specFiles(root, cleanup ? REQS : REQS.slice(0, 1));
    approve(root, FULL, "002", "10-spec");
    edit(root, `${FULL}/change.md`, (t) => t.replace(/^( {2}20-plan: \{ status: )[a-z-]+/m, "$1draft").replace(/^phase: .*$/m, "phase: 20-plan"));
    sdd(root, "status", "--write");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "fixture");
  };
}

/** Lite change 003 at 20-plan draft (its scaffolded hand-off kept); the ideation states the closing archive. */
export function liteAtPlan(root) {
  liteSpecDraftedAt(3)(root);
  edit(root, `${LITE}/00-ideation/ideation.md`, (t) => `${t.trimEnd()}\n\n${ARCHIVE_SENTENCE.replace("{NNN}", "003")}\n`);
  approve(root, LITE, "003", "00-ideation");
  approve(root, LITE, "003", "10-spec");
  edit(root, `${LITE}/change.md`, (t) => t.replace(/^( {2}20-plan: \{ status: )[a-z-]+/m, "$1draft").replace(/^phase: .*$/m, "phase: 20-plan"));
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "plan start");
}

/** A planner brief through the relay, in the form of evals/cap06/planner.mjs. */
export function plannerPrompt(change, step, task, outputs) {
  return dispatchPrompt(
    "sdd-planner",
    `Brief — planner: ${step}.
- Change: ${change}
- Phase / step: 20-plan · ${step}
- Task: ${task}
- Outputs: ${outputs}
- Quality bar: planning, sdd-conventions.
- Return contract: digest (at most 15 lines), the paths written, and a questions block for what P-01 must decide.`,
  );
}

export const read = (root, rel) => {
  try {
    return readFileSync(join(root, ...rel.split("/")), "utf8");
  } catch {
    return "";
  }
};

export const filesIn = (root, rel) => {
  try {
    return readdirSync(join(root, ...rel.split("/"))).filter((n) => n.endsWith(".md")).sort();
  } catch {
    return [];
  }
};

/** Lines of the `## Reporting protocol` section of a hand-off. */
export function reportingSection(text) {
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex((l) => /^##\s+(\d+\.\s*)?Reporting protocol\b/.test(l));
  if (at < 0) return [];
  const end = lines.findIndex((l, i) => i > at && /^## /.test(l));
  return lines.slice(at + 1, end < 0 ? lines.length : end);
}

/** Tool results by tool_use id (text), from the user messages of the transcript. */
export function toolResults(transcript) {
  const out = new Map();
  for (const r of transcript) {
    if (r.type !== "sdk" || r.message.type !== "user") continue;
    const content = r.message.message?.content;
    if (!Array.isArray(content)) continue;
    for (const b of content) {
      if (b.type !== "tool_result") continue;
      const text = Array.isArray(b.content) ? b.content.map((c) => c.text ?? "").join("") : String(b.content ?? "");
      out.set(b.tool_use_id, text);
    }
  }
  return out;
}

/** True when some Bash call ran `sdd --version` (the plugin CLI by path) and its result printed `version`. */
export function sawVersion(transcript, version) {
  const results = toolResults(transcript);
  return toolCalls(transcript, "Bash").some((c) => /sdd(\.mjs)?["']?\s+--version\b/.test(String(c.input?.command ?? "")) && (results.get(c.id) ?? "").includes(version));
}

/** Bash calls of the guard hooks cannot be seen in the transcript; a Write that landed proves the guard let it pass. */
export const wroteFile = (transcript, suffix) => toolCalls(transcript).some((c) => ["Write", "Edit"].includes(c.name) && String(c.input?.file_path ?? "").split("\\").join("/").endsWith(suffix));
