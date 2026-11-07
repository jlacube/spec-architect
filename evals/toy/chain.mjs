// Runs the session chain of the toy change to G3 on one configuration (evals/toy/toy-g3.eval.mjs): one run.mjs
// session of the row `toy-g3-<cfg>` after the other, until G3 is approved, a session fails, or a limit is
// reached. Usage:
//   node evals/toy/chain.mjs --cfg cfg-full|cfg-bare [--fresh] [--max-sessions N] [--max-usd X] [--label NAME]
//                            [-- <further run.mjs options>]
// Each session: `run.mjs --host claude-code --auth subscription --cap-exception --tier dev --runs 1
// --only toy-g3-<cfg> --label <label> evals/toy/toy-g3.eval.mjs` (the rerun cap of the row's cap exception,
// 6.00 USD, C002-IF-010 §2.2, defect D-043). --fresh removes the chain's saved state first. Exit 0 when G3 is approved and the end
// state holds; 1 when a session fails (or run.mjs refuses it); 2 at a limit (sessions or notional USD).
// The USD limit (default 30, defect D-043) is checked before each session with the session's cap, read from the
// row's cap exception (C002-IF-010 §2.2, defect D-042, critic CR-134): no session starts when the chain total plus
// that cap would pass --max-usd, so a chain ends at or under --max-usd, apart from the overshoot of a capped
// session's last step. A resumed chain counts the sessions of its saved state (chain.json).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { TOY_CHAIN_RERUN_USD, capException } from "../harness/caps.mjs";
import { ROOT } from "../harness/fixtures.mjs";
import { CONFIGS, nextStep, stateDir, statusOf } from "./toy-g3.eval.mjs";

/** The default notional limit of one chain (USD; defect D-043, P-01 Q-toy-g3-cap-02). */
export const DEFAULT_MAX_USD = 30;

/** The session cap of the row `toy-g3-<cfg>`: the rerun cap of its cap exception (C002-IF-010 §2.2), or null. */
export function rowCapUsd(cfg) {
  return capException({ id: `toy-g3-${cfg}`, file: "evals/toy/toy-g3.eval.mjs", host: "claude-code", auth: "subscription" })?.rerunUsd ?? null;
}

/** The chain's notional total (USD) from its chain.json document. */
export const chainUsd = (chain) => Math.round((chain?.sessions ?? []).reduce((s, x) => s + (x.cost_usd ?? 0), 0) * 1e6) / 1e6;

/**
 * What the driver does next: `{ go: true }` or `{ go: false, code, why }`. `done` (G3 approved) ends with 0
 * when the last session had no failure; `lastExit` non-zero ends with 1; a limit reached ends with 2. The USD
 * limit counts the next session at its cap `sessionUsd` (the row's rerun cap, 6.00 USD): no session starts when
 * the chain total plus that cap would pass `maxUsd` (critic CR-134).
 */
export function decide({ chain, done, lastExit = 0, maxSessions, maxUsd, sessionUsd = TOY_CHAIN_RERUN_USD }) {
  const n = chain?.sessions?.length ?? 0;
  const last = chain?.sessions?.at(-1);
  if (lastExit !== 0) return { go: false, code: 1, why: `session ${n} failed (run.mjs exit ${lastExit})` };
  if (done) return last && last.failures > 0 ? { go: false, code: 1, why: `G3 approved, but session ${n} has ${last.failures} failure(s)` } : { go: false, code: 0, why: `G3 approved after ${n} session(s)` };
  if (n >= maxSessions) return { go: false, code: 2, why: `${n} sessions, the --max-sessions limit, and G3 not approved` };
  const usd = chainUsd(chain);
  if (usd + sessionUsd > maxUsd) return { go: false, code: 2, why: `${usd} USD notional, and one more session at its ${sessionUsd} USD cap would pass --max-usd ${maxUsd}; G3 not approved` };
  return { go: true };
}

function parse(argv) {
  const o = { cfg: null, fresh: false, maxSessions: 12, maxUsd: DEFAULT_MAX_USD, label: "toy-g3", rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      o.rest = argv.slice(i + 1);
      break;
    }
    if (a === "--cfg") o.cfg = argv[++i];
    else if (a === "--fresh") o.fresh = true;
    else if (a === "--max-sessions") o.maxSessions = Number(argv[++i]);
    else if (a === "--max-usd") o.maxUsd = Number(argv[++i]);
    else if (a === "--label") o.label = argv[++i];
    else throw new Error(`chain: unknown option ${a}`);
  }
  if (!CONFIGS.includes(o.cfg)) throw new Error(`chain: --cfg must be one of ${CONFIGS.join(", ")}`);
  if (!(o.maxSessions > 0) || !(o.maxUsd > 0)) throw new Error("chain: --max-sessions and --max-usd must be positive");
  return o;
}

function main() {
  const o = parse(process.argv.slice(2));
  const dir = stateDir(o.cfg);
  const sessionUsd = rowCapUsd(o.cfg);
  if (typeof sessionUsd !== "number") throw new Error(`chain: no cap exception with a rerun cap for toy-g3-${o.cfg} (C002-IF-010 §2.2)`);
  if (o.fresh) rmSync(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
  const read = () => {
    const chain = existsSync(join(dir, "chain.json")) ? JSON.parse(readFileSync(join(dir, "chain.json"), "utf8")) : { sessions: [] };
    const ws = join(dir, "workspace");
    const done = existsSync(join(ws, ".sdd")) && nextStep(statusOf(ws)).done === true;
    return { chain, done };
  };
  let lastExit = 0;
  for (;;) {
    const d = decide({ ...read(), lastExit, maxSessions: o.maxSessions, maxUsd: o.maxUsd, sessionUsd });
    if (!d.go) {
      const { chain } = read();
      console.log(`chain ${o.cfg}: ${d.why}; ${chain.sessions.length} session(s), ${chainUsd(chain)} USD notional (state ${dir})`);
      process.exit(d.code);
    }
    const args = [join(ROOT, "evals", "harness", "run.mjs"), "--host", "claude-code", "--auth", "subscription", "--cap-exception", "--tier", "dev", "--runs", "1", "--only", `toy-g3-${o.cfg}`, "--label", o.label, ...o.rest, join(ROOT, "evals", "toy", "toy-g3.eval.mjs")];
    const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
    lastExit = r.status ?? 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
