// Shared Givens for the ad-hoc commands of C001-T-033 (C001-TS-316 … 318): a workspace with changes
// 001…004 (constitution approved); the last ones active in the phases a scenario needs.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { constitution } from "../cap02/drafting.mjs";
import { edit, git, sdd } from "../harness/workspaces.mjs";

const TITLES = ["Login audit", "Export reports", "Card payments", "Job scheduler"];

/**
 * Changes 001…004. `stopped` lists the NNNs to mark stopped (so they are not active); `phase`
 * sets change 004's current phase, with the earlier phases approved.
 */
export function changesFixture({ stopped = [], phase = "00-ideation" } = {}) {
  return (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    constitution(root, "approved");
    for (const t of TITLES) sdd(root, "change", "new", t, "--profile", "full");
    const folders = readdirSync(join(root, ".sdd")).filter((n) => /^\d{3}-/.test(n));
    for (const f of folders) {
      const nnn = f.slice(0, 3);
      edit(root, `.sdd/${f}/change.md`, (t) => {
        let out = t;
        if (stopped.includes(nnn)) out = out.replace(/^status: active$/m, "status: stopped");
        if (nnn === "004") {
          const order = ["00-ideation", "10-spec", "20-plan"];
          out = out.replace(/^phase: \S+$/m, `phase: ${phase}`);
          for (const p of order.slice(0, order.indexOf(phase))) out = out.replace(new RegExp(`^( {2}${p}: \\{ status: )not-started`, "m"), "$1approved");
          out = out.replace(new RegExp(`^( {2}${phase}: \\{ status: )not-started`, "m"), "$1draft");
        }
        return out;
      });
    }
    sdd(root, "status", "--write");
  };
}

export const folderOf = (root, nnn) => readdirSync(join(root, ".sdd")).find((n) => n.startsWith(`${nnn}-`));

export function filesUnder(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}
