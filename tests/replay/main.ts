// Corpus replay suite (C002-COMP-008, C002-T-040): the mechanism runs of `npm run replay`.
//
//   npm run replay -- --mechanism <stub|opencode-permissions|sdd-mcp-server|copilot-hooks>[,…] [--all]
//                     [--target opencode|copilot] [--version <v>] [--out <folder>]
//                     [--path-corpus <file>] [--shell-corpus <file>] [--deny-capability <capability>]
//                     [--emulate <mechanism>] [--seed allow-memory|allow-malformed-write]   (stub only)
//                     [--seed bind-adopters]   (opencode-permissions: rules that also bind adopter agents, C002-TS-647)
//
// One report per mechanism and package version, written to docs/releases/<target>/<version>/
// replay-<mechanism>.json (C002-IF-009 §1); the stub's report goes to build/replay/reports/ and never
// under docs/releases/. Exit 0 when every report validates, lists every case once and has 0 differing
// decisions; 1 otherwise (a differing decision, an `error`, an omitted case, a missing adapter); 2 on a
// usage error.
import { join } from "node:path";
import { repoRoot } from "../helpers.ts";
import { createStubAdapter, type ReplayAdapter, type StubSeed, type Target } from "./adapter.ts";
import { createOpenCodeAdapter, type OpenCodeAdapterOptions } from "./adapters/opencode-permissions.ts";
import { type Mechanism, MECHANISMS } from "./expect.ts";
import { releaseReportPath, writeReport } from "./report.ts";
import { runReplay } from "./suite.ts";

/** Options a scenario may pass to an adapter factory (the mechanism runs pass none). */
export type AdapterOptions = OpenCodeAdapterOptions;

/** Adapters of the real mechanisms; C002-T-041 adds sdd-mcp-server and copilot-hooks. */
export const ADAPTERS: Partial<Record<Mechanism, (options?: AdapterOptions) => Promise<ReplayAdapter>>> = {
  // C002-T-042: OpenCode at its tested version, native permission rules unless a scenario names a mode.
  "opencode-permissions": async (options) => createOpenCodeAdapter(options),
};
const OWNER: Record<Mechanism, string> = { "opencode-permissions": "C002-T-042", "sdd-mcp-server": "C002-T-041", "copilot-hooks": "C002-T-041" };
const SEEDS: Record<string, keyof StubSeed> = { "allow-memory": "allowMemory", "allow-malformed-write": "allowMalformedWrite" };
const ADAPTER_SEEDS: Record<string, keyof AdapterOptions> = { "bind-adopters": "bindAdopters" };

class UsageError extends Error {}

interface Args {
  mechanisms: string[];
  target?: Target;
  version?: string;
  out?: string;
  pathCorpus?: string;
  shellCorpus?: string;
  denyCapabilities: string[];
  emulate?: Mechanism;
  seed: StubSeed;
  adapterOptions: AdapterOptions;
}

function parse(argv: readonly string[]): Args {
  const a: Args = { mechanisms: [], denyCapabilities: [], seed: {}, adapterOptions: {} };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]!;
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith("--")) throw new UsageError(`${flag} needs a value`);
      return v;
    };
    switch (flag) {
      case "--mechanism":
        a.mechanisms.push(...value().split(","));
        break;
      case "--all":
        a.mechanisms.push(...MECHANISMS);
        break;
      case "--target": {
        const t = value();
        if (t !== "opencode" && t !== "copilot") throw new UsageError(`unknown target ${t}`);
        a.target = t;
        break;
      }
      case "--version":
        a.version = value();
        break;
      case "--out":
        a.out = value();
        break;
      case "--path-corpus":
        a.pathCorpus = value();
        break;
      case "--shell-corpus":
        a.shellCorpus = value();
        break;
      case "--deny-capability":
        a.denyCapabilities.push(value());
        break;
      case "--emulate": {
        const m = value();
        if (!MECHANISMS.includes(m as Mechanism)) throw new UsageError(`unknown mechanism ${m}`);
        a.emulate = m as Mechanism;
        break;
      }
      case "--seed": {
        const s = value();
        const key = SEEDS[s];
        const adapterKey = ADAPTER_SEEDS[s];
        if (key) a.seed[key] = true;
        else if (adapterKey === "bindAdopters") a.adapterOptions.bindAdopters = true;
        else throw new UsageError(`unknown seed ${s}; seeds: ${[...Object.keys(SEEDS), ...Object.keys(ADAPTER_SEEDS)].join(", ")}`);
        break;
      }
      default:
        throw new UsageError(`unknown argument ${flag}`);
    }
  }
  if (a.mechanisms.length === 0) throw new UsageError("name a mechanism (--mechanism) or --all");
  for (const m of a.mechanisms) if (m !== "stub" && !MECHANISMS.includes(m as Mechanism)) throw new UsageError(`unknown mechanism ${m}; mechanisms: stub, ${MECHANISMS.join(", ")}`);
  return a;
}

/** Runs the named mechanisms; returns the exit code. `log` receives the progress lines. */
export async function main(argv: readonly string[], log: (line: string) => void = console.log): Promise<number> {
  let args: Args;
  try {
    args = parse(argv);
  } catch (err) {
    if (err instanceof UsageError) {
      log(`usage error: ${err.message}`);
      return 2;
    }
    throw err;
  }
  let failed = false;
  for (const name of [...new Set(args.mechanisms)]) {
    let adapter: ReplayAdapter;
    if (name === "stub") adapter = createStubAdapter({ ...(args.emulate ? { emulate: args.emulate } : {}), ...(args.target ? { target: args.target } : {}), seed: args.seed });
    else {
      const make = ADAPTERS[name as Mechanism];
      if (!make) {
        log(`${name}: no replay adapter yet (${OWNER[name as Mechanism]})`);
        failed = true;
        continue;
      }
      adapter = await make(args.adapterOptions);
    }
    const { report, omitted, problems } = await runReplay(adapter, {
      ...(args.target ? { target: args.target } : {}),
      ...(args.version ? { version: args.version } : {}),
      ...(args.pathCorpus ? { pathCorpus: args.pathCorpus } : {}),
      ...(args.shellCorpus ? { shellCorpus: args.shellCorpus } : {}),
      denyCapabilities: args.denyCapabilities,
    });
    const file = args.out
      ? join(args.out, `replay-${report.mechanism}.json`)
      : adapter.stub
        ? join(repoRoot(), "build", "replay", "reports", report.target, report.package_version, `replay-${report.mechanism}.json`)
        : releaseReportPath(report.target, report.package_version, report.mechanism);
    writeReport(report, file);
    log(
      `${adapter.name} (${report.mechanism}, ${report.target} ${report.package_version}, ${report.replay_host.platform} [${report.replay_host.capabilities.join(", ")}]): ` +
        `${report.applicable} replayed, ${report.not_applicable.length} not applicable, ${report.differing} differing → ${file}`,
    );
    for (const c of report.cases.filter((x) => x.actual !== x.expected))
      log(`  differing ${c.id} (${c.corpus}, ${c.category}): expected ${c.expected} (${c.expected_source}), got ${c.actual}${c.detail ? ` — ${c.detail}` : ""}`);
    for (const o of omitted) log(`  omitted ${o}`);
    for (const p of problems) log(`  report problem ${p}`);
    if (report.differing > 0 || omitted.length > 0 || problems.length > 0) failed = true;
  }
  return failed ? 1 : 0;
}
