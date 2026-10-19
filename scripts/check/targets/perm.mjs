// TGT-PERM-001 (OpenCode): no top-level `permission`; `agent` entries for the ten Architect agents only;
// `edit` and `bash` rules as the table's mode requires; `question` is `allow` for the conductor and `deny`
// for each specialist (C002-REQ-206 … C002-REQ-209, C002-REQ-217, C002-TS-229). The finding names the
// agent and its `question` value or its missing key.
import { agentPermission } from "../../generate/emit/opencode-permissions.ts";
import { CONDUCTOR, translateAgents } from "../../generate/translate/frontmatter.ts";
import { canonicalJson } from "../../generate/writer.ts";
import { configPath, finding, json } from "./lib.mjs";

/** JSON text of a rule as the package writes it (rule maps keep their order: last match wins). */
const written = (v) => (v === undefined ? undefined : JSON.stringify(JSON.parse(canonicalJson(v))));

export default {
  code: "TGT-PERM-001",
  check(ctx) {
    if (ctx.target !== "opencode") return [];
    const config = configPath(ctx);
    const j = json(ctx, config);
    if (j === undefined || j.error) return [];
    const out = [];
    const say = (m) => out.push(finding(this.code, config, null, `${config}: ${m}`));
    const doc = j.value ?? {};
    if (Object.hasOwn(doc, "permission")) say("has a top-level permission key; the rules belong to the Architect agents' entries only");
    const agents = translateAgents(ctx.emitInput).agents;
    const names = agents.map((a) => a.frontmatter.name);
    const entries = doc.agent !== null && typeof doc.agent === "object" ? doc.agent : {};
    for (const n of Object.keys(entries).sort()) if (!names.includes(n)) say(`has an agent entry "${n}", which is not an Architect agent`);
    for (const a of agents) {
      const name = a.frontmatter.name;
      const perm = entries[name]?.permission;
      if (perm === null || typeof perm !== "object" || Array.isArray(perm)) {
        say(`agent "${name}" has no permission block`);
        continue;
      }
      const want = agentPermission(ctx.table, ctx.mode, a);
      for (const k of ["edit", "bash"]) {
        const have = perm[k] === undefined ? undefined : JSON.stringify(perm[k]);
        if (have !== written(want[k])) say(`agent "${name}": the ${k} rule ${have === undefined ? "is missing" : `is ${have.length > 80 ? `${have.slice(0, 77)}...` : have}`}; mode ${ctx.mode} requires the table's ${k} rules${typeof want[k] === "string" ? ` ("${want[k]}")` : " in their order"}`);
      }
      const q = name === CONDUCTOR ? "allow" : "deny";
      if (!Object.hasOwn(perm, "question")) say(`agent "${name}" lacks the key "question" in its permission; it must be "${q}"`);
      else if (perm.question !== q) say(`agent "${name}" has the question value "${String(typeof perm.question === "string" ? perm.question : JSON.stringify(perm.question))}"; it must be "${q}"`);
    }
    return out;
  },
};
