// Shared setup of the cartographer scenarios (C001-T-041): a copy of fx-brownfield-ts under git with a
// brownfield change in ideation, the cartographer dispatched as a subagent through the eval relay on a
// machine configuration (harness/machines.mjs).
import { cpSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { constitution } from "../cap02/drafting.mjs";
import { ROOT } from "../harness/fixtures.mjs";
import { machine } from "../harness/machines.mjs";
import { dispatchPrompt } from "../harness/overlay.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";

export const CHANGE = ".sdd/001-payments-refunds";
export const EVIDENCE = `${CHANGE}/00-ideation/evidence`;
export const SERENA = ["find_symbol", "get_symbols_overview", "find_referencing_symbols", "find_declaration", "find_implementations"].map((t) => `mcp__plugin_architect_serena__${t}`);
export const CARTO_TOOLS = ["Agent", "Bash", "Write", "ToolSearch", "LSP", ...SERENA];

export const TOOLCHAIN_AST_GREP = `# Toolchain\n\n| Tool | Detected | Version | Path or endpoint | Fallback in use |\n|---|---|---|---|---|\n| ripwire | yes | 0.6.5 | PATH | — |\n| Serena | yes | 1.7.0 | MCP | — |\n| ast-grep | yes | 0.42.3 | PATH | — |\n`;

/** fx-brownfield-ts under git, `sdd init`, constitution approved, brownfield change 001 in ideation. */
export function brownfield({ extra } = {}) {
  return (root) => {
    cpSync(join(ROOT, "tests", "fixtures", "fx-brownfield-ts"), root, { recursive: true });
    extra?.(root);
    git(root, "init", "-q");
    sdd(root, "init");
    constitution(root, "approved");
    write(root, ".sdd/_constitution/toolchain.md", TOOLCHAIN_AST_GREP);
    sdd(root, "change", "new", "Payments refunds", "--kind", "brownfield");
    edit(root, `${CHANGE}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1draft"));
    sdd(root, "status", "--write");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "fixture");
  };
}

export function brief(task, outputs, extra = "") {
  return `Brief — cartographer: code evidence.
- Change: CHG-001 "Payments refunds" · profile full · kind brownfield
- Phase / step: 00-ideation · step 3 — Research and discovery
- Task: ${task} ${extra}
- Inputs: the repository (current directory); \`.sdd/_constitution/toolchain.md\`.
- IDs to use: evidence entries E-1, E-2, … per file.
- Outputs: ${outputs}
- Quality bar: code-discovery, sdd-conventions.
- Return contract: digest (at most 20 lines, naming the layers used), the paths written, and a questions block only for what P-01 alone can decide.`;
}

/** Scenario fields for a cartographer run on configuration `cfg`. */
export function cartoRun(cfg, prompt, fixture = brownfield()) {
  const m = machine(cfg);
  return {
    agent: "architect:eval-dispatcher",
    plugins: m.plugins,
    env: m.env,
    fixture,
    allowTools: CARTO_TOOLS,
    maxTurns: 30,
    // Serena connects a few seconds after session start; the relay spawns at once (see runSession).
    startDelayMs: 15000,
    prompt: dispatchPrompt("sdd-cartographer", prompt),
  };
}

/**
 * Callers Given: fx-brownfield-ts plus a tsconfig and a named production caller of createIntent. The fixture's only
 * other call sits in an anonymous test callback, which Serena cannot attribute to a symbol.
 */
export const callersFixture = brownfield({
  extra: (root) => {
    // A tsconfig lets the TypeScript language server behind Serena resolve the `.ts` imports.
    write(root, "tsconfig.json", JSON.stringify({ compilerOptions: { target: "es2022", module: "nodenext", moduleResolution: "nodenext", allowImportingTsExtensions: true, noEmit: true, strict: true }, include: ["src", "tests"] }, null, 2) + "\n");
    write(root, "src/api/checkout.ts", `// Checkout API entry point.
import { createIntent } from "../checkout/payments.ts";

export function startCheckout(amountCents: number) {
  return createIntent(amountCents);
}
`);
  },
});

const LADDER = ["ripwire", "serena", "lsp", "grep"];

/**
 * Checks of C001-TS-1002-style scenarios: the entry for the caller startCheckout has layer `expected`,
 * and no entry uses a layer above `expected` on the ladder (ast-grep aside).
 */
export function callerLayerProblems(root, expected) {
  const entries = evidence(read(root, `${EVIDENCE}/callers-createIntent.md`));
  const problems = [];
  const caller = entries.find((e) => /startCheckout/.test(e.head));
  if (!caller) problems.push(`no evidence entry for the caller startCheckout (entries: ${entries.map((e) => e.head.trim()).join(" | ") || "none"})`);
  else if (caller.layer !== expected) problems.push(`startCheckout entry has layer ${caller.layer}, expected ${expected}`);
  const above = entries.filter((e) => LADDER.indexOf(e.layer) >= 0 && LADDER.indexOf(e.layer) < LADDER.indexOf(expected));
  for (const e of above) problems.push(`${e.id} uses ${e.layer}, unavailable in this configuration`);
  return problems;
}

export const CALLERS_BRIEF = brief("Who calls createIntent? Record each caller as evidence.", `\`${EVIDENCE}/callers-createIntent.md\`.`);

export function read(root, rel) {
  try {
    return readFileSync(join(root, ...rel.split("/")), "utf8");
  } catch {
    return "";
  }
}

export function files(dir) {
  try {
    return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
  } catch {
    return [];
  }
}

/** Evidence entries `{ id, head, layer, disclosures, pattern, text }` of a Markdown text. */
export function evidence(text) {
  return [...String(text).matchAll(/^- \*\*(E-\d+)\*\*([^\n]*)\n((?:[ \t]+-[^\n]*\n?)*)/gm)].map((m) => ({
    id: m[1],
    head: m[2],
    layer: /layer:\s*([\w-]+)/.exec(m[3])?.[1] ?? null,
    disclosures: /disclosures:\s*([^\n]*)/.exec(m[3])?.[1] ?? "",
    pattern: /pattern:\s*([^\n·]*)/.exec(m[3])?.[1]?.trim() ?? "",
    text: m[0],
  }));
}

/** Code-intelligence calls of the subagent in order: ripwire/ast-grep Bash commands, Serena and LSP calls, Grep. */
export function intelCalls(toolCalls, transcript) {
  return toolCalls(transcript)
    .filter((c) => c.agent !== null)
    .map((c) => ({ name: c.name, cmd: c.name === "Bash" ? String(c.input?.command ?? "") : JSON.stringify(c.input ?? {}) }))
    .filter((c) => (c.name === "Bash" && /\b(ripwire|ast-grep)\b/.test(c.cmd) && !/--version/.test(c.cmd)) || /serena|^LSP$|^Grep$/.test(c.name));
}

