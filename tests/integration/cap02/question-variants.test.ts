// C002-T-037 — the interview and gate wiring variants of the conductor on the host question tools
// (C002-REQ-211…214, C002-REQ-311, C002-REQ-312; C002-COMP-014, C002-COMP-016, C002-COMP-002): the generated
// conductor of each target and enforcement mode, read back from a package the generator writes into a
// temporary folder, carries the rules. Expected tool names and texts come from the mapping tables, the
// source plugin and the generated install notes, never from a copy of the variant files.
// Beside them (asked with this task): the conductor's description names the target's own way to start
// the conductor (construct `conductor-start`), and a table without that construct stops generation.
// The behaviour on the hosts is verified by the evals of evals/targets/question-tool/ (Claude Code rows
// here, OpenCode rows in C002-T-056) and the VS Code checklist (C002-TC-216, 218, 220, 317, 318, 319 in
// C002-T-050).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../../../scripts/generate/main.ts";
import { readSource } from "../../../scripts/generate/reader.ts";
import { loadTargetTable, TARGETS, type MappingTable, type Mode, type Target } from "../../../scripts/generate/tables.ts";
import { translateBodies } from "../../../scripts/generate/translate/constructs.ts";
import { CONDUCTOR } from "../../../scripts/generate/translate/frontmatter.ts";
import { skillHeading } from "../../../scripts/generate/translate/inline.ts";
import { WIRING_SECTION } from "../../../scripts/generate/translate/wiring.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const source = readSource(join(root, "plugins", "architect"));
assert.deepEqual(source.diagnostics, [], "the source plugin reads without diagnostics");
const tables = Object.fromEntries(TARGETS.map((t) => [t, loadTargetTable(root, t)])) as Record<Target, MappingTable>;
const MODES: Record<Target, Mode[]> = { opencode: ["native-permissions", "sdd-mcp-server"], copilot: ["sdd-mcp-server", "copilot-hooks"] };
const NAME: Record<Target, string> = { opencode: "OpenCode", copilot: "Copilot" };
/**
 * The host question tools: the tools entry of AskUserQuestion (C002-IF-001 §6.1; S-07). Copilot maps it to
 * both `ask_user` (Copilot CLI) and `askQuestions` (VS Code Local session type; C002-T-077, defect D-051).
 */
const questionTools = (t: Target): string[] => {
  const e = tables[t].tools["AskUserQuestion"];
  assert.ok(Array.isArray(e) && e.length >= 1, `${t}: a question tool`);
  return e as string[];
};
const ticked = (s: string) => "`" + s + "`";
/** The wiring names the host question tool: the OpenCode tool; on Copilot both names and a question-tool call. */
const namesQuestionTool = (t: Target, w: string): boolean =>
  t === "opencode" ? w.includes(ticked(questionTools(t)[0]!)) : questionTools(t).every((q) => w.includes(ticked(q))) && w.includes("question-tool call");
/** The host's auto-reply text while `chat.autoReply` is on (VS Code 1.145.2; C002-IF-001 §6.1 No answer). */
const AUTO_REPLY = "The user is not available to respond and will review your work later. Work autonomously and make good decisions.";

interface Pkg {
  description: string;
  body: string;
  install: string;
  /** The conductor's `tools` list. */
  tools: string[];
  /** The `tools` list of every generated prompt file by file name (Copilot); empty on OpenCode. */
  prompts: Map<string, string[]>;
}
const listOf = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
const built = new Map<string, Pkg>();
/** The generated conductor (description, body) and install notes of `t` in `mode`, read from disk. */
function pkg(t: Target, mode: Mode): Pkg {
  const key = `${t}/${mode}`;
  const hit = built.get(key);
  if (hit) return hit;
  const base = mkdtempSync(join(tmpdir(), "sdd-qv-"));
  try {
    const err: string[] = [];
    const code = main(["--target", t, "--mode", `${t}=${mode}`, "--out", join(base, "dist"), "--quiet"], { cwd: root, stdout: () => {}, stderr: (l) => err.push(l) });
    assert.equal(code, 0, err.join("\n"));
    const dir = join(base, "dist", t);
    const p = tables[t].placement;
    const text = readFileSync(join(dir, p["agents_dir"]!, p["agent_file"]!.replace("{name}", CONDUCTOR)), "utf8").replace(/\r\n/g, "\n");
    const fm = splitFrontmatter(text);
    const prompts = new Map<string, string[]>();
    if (t === "copilot")
      for (const n of readdirSync(join(dir, p["commands_dir"]!)).filter((x) => x.endsWith(".prompt.md")).sort())
        prompts.set(n, listOf(splitFrontmatter(readFileSync(join(dir, p["commands_dir"]!, n), "utf8").replace(/\r\n/g, "\n")).data?.["tools"]));
    const r = {
      description: String(fm.data?.["description"] ?? ""),
      body: fm.lines.slice(fm.bodyStartLine - 1).join("\n"),
      install: readFileSync(join(dir, p["install_notes"]!), "utf8").replace(/\r\n/g, "\n"),
      tools: listOf(fm.data?.["tools"]),
      prompts,
    };
    built.set(key, r);
    return r;
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

/** The part of the conductor body under `## Skill: <skill>`. */
function skillPart(body: string, skill: string): string {
  const start = body.indexOf(`${skillHeading(skill)}\n`);
  assert.ok(start >= 0, `the conductor inlines ${skill}`);
  const next = body.indexOf("\n## Skill: ", start + 1);
  return body.slice(start, next < 0 ? undefined : next);
}
/** The `## <host> wiring` section of an inlined skill part. */
function wiring(t: Target, part: string): string {
  const at = part.indexOf(`## ${tables[t].host.name} wiring\n`);
  assert.ok(at >= 0, `${t}: the ${tables[t].host.name} wiring section`);
  return part.slice(at);
}
/** The Claude Code wiring section of a source skill. */
function sourceWiring(skill: string): string {
  const text = source.source.files.find((f) => f.path === `skills/${skill}/SKILL.md`)!.text.replace(/\r\n/g, "\n");
  const at = text.indexOf(`## ${WIRING_SECTION}\n`);
  assert.ok(at >= 0, `${skill}: Claude Code wiring section`);
  return text.slice(at);
}
const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ");

for (const t of TARGETS) {
  for (const mode of MODES[t]) {
    test(`C002-TC-215/219 (C002-REQ-211, 213): ${NAME[t]} ${mode} — the conductor asks rounds of 1–4 questions through ${questionTools(t).map(ticked).join(" / ")}`, () => {
      const { body } = pkg(t, mode);
      const w = oneLine(wiring(t, skillPart(body, "interview-protocol")));
      assert.ok(namesQuestionTool(t, w), "names the host question tool");
      assert.match(w, /`questions` holds 1–4 items, never more/);
      assert.match(w, /further rounds/, "a topic with more than four questions takes further rounds");
      assert.ok(!body.includes("AskUserQuestion"), "no Claude Code tool name in the conductor body");
      assert.ok(!body.includes(`## ${WIRING_SECTION}`), "no Claude Code wiring section");
      // The profile round of the new-change command is an interview round: no change folder before the answer.
      assert.match(w, /no change folder/);
    });

    test(`C002-TC-217 (C002-REQ-212): ${NAME[t]} ${mode} — the gate question offers the four choices through the host question tool and keeps the verbatim rule`, () => {
      const w = oneLine(wiring(t, skillPart(pkg(t, mode).body, "gate-protocol")));
      assert.ok(namesQuestionTool(t, w), "names the host question tool");
      assert.ok(w.includes("(`Approve`, `Approve with waivers`, `Revise`, `Stop`), in that order"));
      assert.ok(w.includes("`sdd gate show` output") && w.includes('"Approving means …"'));
      assert.match(w, /none (labelled ` \(Recommended\)`|marked `recommended`)/, "no option recommended");
      // C001-REQ-802 as modified by C002-REQ-212: the answer goes to the CLI unchanged, as on Claude Code.
      const verbatim = /- (Pass the answer to the CLI unchanged:[^\n]*(?:\n {2}[^\n]*)*)/.exec(sourceWiring("gate-protocol"))?.[1];
      assert.ok(verbatim, "the Claude Code verbatim line");
      assert.ok(w.includes(oneLine(verbatim)), "the verbatim line, unchanged");
    });

    test(`C002-TC-316/317/318 (C002-REQ-311): ${NAME[t]} ${mode} — a result without a choice is neither answer nor approval`, () => {
      const body = pkg(t, mode).body;
      const iw = oneLine(wiring(t, skillPart(body, "interview-protocol")));
      const gw = oneLine(wiring(t, skillPart(body, "gate-protocol")));
      assert.match(iw, /without a choice of P-01 is no answer/);
      assert.match(iw, /dismissed call|call dismissed/);
      assert.match(iw, /empty (answer list|result)/);
      assert.match(iw, /Record no answer for the questions of that call/);
      assert.match(iw, /never assume the recommended option/);
      assert.match(iw, /say that no answer was received/);
      assert.match(gw, /without a choice of P-01 is no decision and never an approval/);
      assert.match(gw, /Run no `sdd gate approve` and no `sdd gate record`/);
      assert.match(gw, /leave `approvals\.json`, `change\.md` and the questions log unchanged/);
      // The command that asks again takes the target's command form.
      assert.ok(gw.includes(`${(tables[t].references["command"] as { to: string }).to}gate <NNN>`));
      if (t === "opencode") {
        // S-07 §5: a dismissed call ends with this error text, and no `answers`.
        for (const w of [iw, gw]) assert.ok(w.includes("`The user dismissed this question`"));
      } else {
        // C002-IF-001 §6.1 No answer (C002-T-077, defect D-051): `skipped: true`, no selected label and no
        // free text, and the host's auto-reply text, quoted exactly once in each wiring section.
        for (const w of [iw, gw]) {
          assert.ok(w.includes("`skipped: true`"), "skipped");
          assert.ok(w.includes("no selected label and no free text"), "no label and no free text");
          assert.ok(w.includes("(`freeText` null, missing or blank)"), "blank free text");
          assert.ok(w.includes("a dismissed call (closed without a choice)"), "dismissed call");
          assert.equal(w.split(`"${AUTO_REPLY}"`).length - 1, 1, "the auto-reply text, quoted exactly once");
          assert.ok(w.includes("the setting `chat.autoReply` is on"), "the setting that sends it");
        }
      }
    });
  }
}

// --- C002-T-077 (defect D-051; C002-IF-001 §6.1 Question tool on Copilot, C002-IF-005 §3) ---
for (const mode of MODES.copilot) {
  test(`C002-TC-114/C002-REQ-211 (C002-T-077): Copilot ${mode} — the conductor and every prompt file that lists a question tool list both askQuestions and ask_user`, () => {
    const p = pkg("copilot", mode);
    const both = questionTools("copilot");
    assert.deepEqual([...both].sort(), ["askQuestions", "ask_user"], "the table maps AskUserQuestion to both names");
    for (const q of both) assert.ok(p.tools.includes(q), `conductor: ${q}`);
    assert.equal(p.prompts.size, 13, "the 13 prompt files");
    for (const [name, tools] of p.prompts) {
      const listed = both.filter((q) => tools.includes(q));
      assert.ok(listed.length === 0 || listed.length === both.length, `${name}: both question tools or none (${tools.join(", ")})`);
      assert.deepEqual(tools, p.tools, `${name}: the conductor's tools`);
    }
  });

  test(`C002-T-077: Copilot ${mode} — the conductor body names both question tools and keeps /architect:<name>`, () => {
    const { body, description } = pkg("copilot", mode);
    assert.ok(body.includes("the question tool (`askQuestions` in VS Code, `ask_user` in Copilot CLI)"), "construct ask-user-question");
    assert.ok(body.includes("/architect:gate <NNN>"), "command references keep /architect:<name>");
    for (const text of [body, description]) assert.ok(!/\/architect-[a-z]/.test(text), "no /architect-<name> form");
    assert.ok(!/(^|[\s(`"])\/(gate|init|new|status|doctor|ideate|specify|plan|revise|archive|decide|research|lint)\b/m.test(body), "no bare /<name> command form");
  });

  test(`C002-TS-317/318 (C002-REQ-311; critic CR-157): Copilot ${mode} — the askQuestions input and result shapes, and P-01's own free text with no selected label is the answer, verbatim`, () => {
    const body = pkg("copilot", mode).body;
    const iw = oneLine(wiring("copilot", skillPart(body, "interview-protocol")));
    const gw = oneLine(wiring("copilot", skillPart(body, "gate-protocol")));
    for (const w of [iw, gw]) {
      // Input: questions[] of header, question, options[label, description, recommended], multiSelect, allowFreeformInput.
      for (const f of ['"questions"', '"header"', '"question"', '"options"', '"label"', '"description"', '"multiSelect"', '"allowFreeformInput"']) assert.ok(w.includes(f), `input field ${f}`);
      // Result: answers keyed by header, each with selected, freeText, skipped.
      assert.match(w, /`askQuestions` returns `\{ "answers": \{ "[^"]+": \{ "selected": \[ "<label>"[^\]]*\], "freeText": "<text>" \| null, "skipped": <boolean> \} \} \}`/);
    }
    assert.ok(iw.includes('"recommended": true'), "the recommended flag of the input");
    assert.ok(iw.includes("keyed by its `header`"), "one entry per question, keyed by its header");
    // CR-157: a result with `selected: []` and P-01's own free text is P-01's answer, logged verbatim.
    assert.ok(iw.includes("a result with no selected label (`selected: []`) and P-01's own free text is P-01's answer too: log that free text verbatim as the answer"), iw);
    assert.ok(gw.includes("with no selected label, P-01's own free text is the answer, verbatim"), gw);
    // …while the host's auto-reply text as free text stays no answer (the other row of C002-TS-317).
    assert.ok(iw.indexOf(`"${AUTO_REPLY}"`) > iw.indexOf("is no answer"), "the auto-reply text is a no-answer case");
    assert.ok(gw.indexOf(`"${AUTO_REPLY}"`) > gw.indexOf("is no decision and never an approval"), "the auto-reply text is no decision");
    // The round size and the gate's verbatim rule stay.
    assert.match(iw, /`questions` holds 1–4 items, never more/);
    assert.match(gw, /Pass the answer to the CLI unchanged/);
  });
}

for (const mode of MODES.opencode) {
  test(`C002-TC-221 (C002-REQ-214): OpenCode ${mode} — headers of at most 30 characters, every option with a description`, () => {
    const w = oneLine(wiring("opencode", skillPart(pkg("opencode", mode).body, "interview-protocol")));
    assert.match(w, /never more than 30, the tool's limit/);
    assert.match(w, /shorten a long topic/);
    assert.match(w, /Every option has a non-empty `description`/);
    const gw = oneLine(wiring("opencode", skillPart(pkg("opencode", mode).body, "gate-protocol")));
    assert.match(gw, /each with a non-empty description/);
  });
}

for (const mode of MODES.copilot) {
  test(`C002-TS-319 (supporting): Copilot ${mode} — without askQuestions and ask_user the conductor asks in the text form and names no INSTALL.md step`, () => {
    // Revised by C001-T-084 (D-020; P-01, Q-noask-01 "Text fallback"): without ask_user the conductor asks
    // as plain text (C001-IF-05 `questions.md` §3) and names no INSTALL.md step (C001-REQ-223). Supporting
    // test of C002-TC-319, which stays the manual case of checklist step VSC-15 (revision D-037, C002-T-074).
    const { body } = pkg("copilot", mode);
    const w = oneLine(wiring("copilot", skillPart(body, "interview-protocol")));
    assert.ok(w.includes("If neither `askQuestions` nor `ask_user` is offered, or a call is refused, ask the round in the text form of §4."));
    const gw = oneLine(wiring("copilot", skillPart(body, "gate-protocol")));
    assert.ok(gw.includes("If neither `askQuestions` nor `ask_user` is offered, or a call is refused, present the gate in the text form of §3."));
    for (const x of [w, gw]) assert.ok(!/\b(enable|install|switch on)\b[^.]*\b(askQuestions|ask_user)\b/i.test(x), "no instruction to enable a question tool");
    assert.ok(!/INSTALL\.md/.test(w) && !/INSTALL\.md/.test(gw), "no INSTALL.md detour");
  });
}

test("the Claude Code wiring sections are unchanged: AskUserQuestion, no host variant text", () => {
  for (const skill of ["interview-protocol", "gate-protocol"]) {
    const w = sourceWiring(skill);
    // (`question` is also a field name of AskUserQuestion, so the OpenCode tool is matched as "`question` tool".)
    for (const q of questionTools("copilot")) assert.ok(!w.includes(q), `${skill}: no Copilot question tool ${q}`);
    assert.ok(!w.includes(`${ticked(questionTools("opencode")[0]!)} tool`), `${skill}: no OpenCode question tool`);
    assert.ok(!/dismissed|skipped|INSTALL\.md/.test(w), `${skill}: no generated-target rule`);
  }
  assert.ok(sourceWiring("interview-protocol").includes("`AskUserQuestion`"));
});

// --- The conductor's description names the target's own way to start it ---
const START: Record<Target, RegExp[]> = {
  opencode: [/`sdd-conductor` primary agent/, /`opencode --agent sdd-conductor`/],
  copilot: [/`sdd-conductor` as the session agent in the Chat agent picker/],
};
for (const t of TARGETS) {
  for (const mode of MODES[t]) {
    test(`${NAME[t]} ${mode}: the conductor's description names the ${NAME[t]} way to start the conductor`, () => {
      const d = pkg(t, mode).description;
      for (const re of START[t]) assert.match(d, re);
      assert.ok(!d.includes("claude --agent"), d);
      assert.match(d, /do not invoke it as a subagent\.$/);
    });
  }
  test(`${NAME[t]}: a table without the conductor-start construct stops generation (ERR-GEN-001 on the description)`, () => {
    const table = { ...tables[t], constructs: tables[t].constructs.filter((c) => c.id !== "conductor-start") };
    const r = translateBodies({ source: source.source, table, target: t, mode: table.enforcement_mode, peers: Object.values(tables) });
    assert.deepEqual(
      r.diagnostics.map((d) => [d.code, d.file, d.line, d.construct]),
      [["ERR-GEN-001", "agents/sdd-conductor.md", 3, "(claude --agent sdd-conductor)"]],
    );
  });
}
