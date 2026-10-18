// C002-NFR-102: write with quick-lint findings through the sdd MCP server, p95 over 20 write calls on
// fx-large, threshold 800 ms. The `files` server is started once (rules loaded once per process,
// architecture §6.1) and warmed with one write that is not counted; then each call rewrites the
// requirements file of capability 01 of one of the 20 changes with a requirement that holds two SHALL
// keywords, so every result carries a LINT-EARS-002 finding.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./mcp-client.mjs";
import { CHANGES } from "../tests/fixtures/gen-large.mjs";
import { fxLarge, p95, record } from "./lib.mjs";

const RUNS = 20;
const THRESHOLD_MS = 800;

const pad = (n) => String(n).padStart(3, "0");
const requirements = (c, cap) => `.sdd/${pad(c)}-change-${pad(c)}/10-spec/20-capabilities/CAP-${cap}-area-${Number(cap)}/requirements.md`;

/** The file's content with its first requirement statement given a second SHALL (LINT-EARS-002). */
function withFinding(root, rel) {
  const text = readFileSync(join(root, ...rel.split("/")), "utf8");
  const next = text.replace(/(SHALL record entry \d+)\./, "$1 and SHALL print it.");
  if (next === text) throw new Error(`${rel}: no requirement statement to change`);
  return next;
}

export async function benchMcpWrites() {
  const fx = fxLarge();
  const server = await startServer("files", fx.root);
  try {
    const write = async (rel) => {
      const r = await server.call("write_file", { path: rel, content: withFinding(fx.root, rel) });
      const sc = r.result.structuredContent ?? {};
      if (sc.status !== "written" || !(sc.findings?.total > 0)) throw new Error(`${rel}: expected a write with findings, got ${JSON.stringify(r.result)}`);
      return r;
    };
    await write(requirements(1, "02")); // warm-up, not counted
    const times = [];
    const findings = [];
    for (let i = 0; i < RUNS; i++) {
      const r = await write(requirements((i % CHANGES) + 1, "01"));
      times.push(r.ms);
      findings.push(r.result.structuredContent.findings.total);
    }
    const value = p95(times);
    return record("mcp-writes", {
      nfr: "C002-NFR-102",
      fixture: "fx-large",
      threshold_ms: THRESHOLD_MS,
      runs: times.length,
      findings_per_call: findings,
      times_ms: times.map((t) => Math.round(t * 10) / 10),
      p95_ms: value,
      pass: value <= THRESHOLD_MS,
    });
  } finally {
    await server.close();
    fx.cleanup();
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) await benchMcpWrites();
