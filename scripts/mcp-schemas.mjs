// Served schemas of the sdd MCP server (C002-ADR-001, C002-ADR-002): from the in-repository contract
// copy src/mcp/tools.schema.json, writes src/mcp/served-schemas.json with each tool's description,
// inputSchema and outputSchema, every `#/$defs/…` reference inlined, so `tools/list` sends
// self-contained schemas. The contract test (tests/integration/contracts/mcp-served-schemas.test.ts)
// fails when the written file is not what this script produces.
//   node scripts/mcp-schemas.mjs           write the file
//   node scripts/mcp-schemas.mjs --check   exit 1 when the file is out of date
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CONTRACT_COPY = join(root, "src", "mcp", "tools.schema.json");
export const SERVED = join(root, "src", "mcp", "served-schemas.json");

/** Tool name → the `$defs` names of its input and output schemas (C002-IF-002 §4). */
export const TOOLS = {
  write_file: { input: "writeFileInput", output: "writeFileOutput" },
  replace_text: { input: "replaceTextInput", output: "replaceTextOutput" },
  run_command: { input: "runCommandInput", output: "runCommandOutput" },
};

/**
 * A deep copy of `node` with every `{ "$ref": "#/$defs/<name>" }` replaced by the (inlined) definition.
 * A reference with sibling keywords, to another document or in a cycle is an error.
 * @param {unknown} node
 * @param {Record<string, unknown>} defs
 * @param {string[]} [stack]
 * @returns {unknown}
 */
export function inlineDefs(node, defs, stack = []) {
  if (Array.isArray(node)) return node.map((v) => inlineDefs(v, defs, stack));
  if (node === null || typeof node !== "object") return node;
  const obj = /** @type {Record<string, unknown>} */ (node);
  if ("$ref" in obj) {
    const ref = obj["$ref"];
    const m = typeof ref === "string" ? /^#\/\$defs\/([A-Za-z0-9_]+)$/.exec(ref) : null;
    if (!m || m[1] === undefined) throw new Error(`unsupported $ref ${JSON.stringify(ref)}: only #/$defs/<name> is inlined`);
    if (Object.keys(obj).length !== 1) throw new Error(`$ref ${ref} has sibling keywords`);
    const name = m[1];
    if (!(name in defs)) throw new Error(`$ref ${ref}: no such definition`);
    if (stack.includes(name)) throw new Error(`$ref ${ref}: reference cycle ${[...stack, name].join(" → ")}`);
    return inlineDefs(defs[name], defs, [...stack, name]);
  }
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, inlineDefs(v, defs, stack)]));
}

/**
 * The served schemas of every tool, from the parsed contract.
 * @param {{ $defs: Record<string, any> }} contract
 */
export function servedSchemas(contract) {
  const defs = contract.$defs;
  /** @type {Record<string, { description: string, inputSchema: unknown, outputSchema: unknown }>} */
  const out = {};
  for (const [tool, { input, output }] of Object.entries(TOOLS)) {
    if (!defs[input] || !defs[output]) throw new Error(`contract has no $defs/${input} or $defs/${output} for ${tool}`);
    out[tool] = {
      description: String(defs[input].description ?? tool),
      inputSchema: inlineDefs(defs[input], defs),
      outputSchema: inlineDefs(defs[output], defs),
    };
  }
  return out;
}

/** The file text `node scripts/mcp-schemas.mjs` writes. */
export function servedSchemasText() {
  return JSON.stringify(servedSchemas(JSON.parse(readFileSync(CONTRACT_COPY, "utf8"))), null, 2) + "\n";
}

// Run directly (not when bundled into a test file, whose import.meta.url is the test's own).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href && basename(fileURLToPath(import.meta.url)) === "mcp-schemas.mjs") {
  const text = servedSchemasText();
  let current = "";
  try {
    current = readFileSync(SERVED, "utf8");
  } catch {
    // missing: written below, or reported by --check
  }
  if (process.argv.includes("--check")) {
    // Compared as JSON, so a checkout with CRLF line endings is not "out of date".
    let same = false;
    try {
      same = JSON.stringify(JSON.parse(current)) === JSON.stringify(JSON.parse(text));
    } catch {
      same = false;
    }
    if (!same) {
      console.error("src/mcp/served-schemas.json is out of date: run node scripts/mcp-schemas.mjs");
      process.exit(1);
    }
  } else if (current !== text) {
    writeFileSync(SERVED, text);
    console.log("wrote src/mcp/served-schemas.json");
  }
}
