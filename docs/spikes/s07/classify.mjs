// S-07 throwaway: reads a driver output and classifies each case's OpenCode decision by
// C002-IF-009 §2.3 (opencode-permissions): deny = refused by a permission rule or arguments
// rejected before the tool ran; allow = the tool ran, whatever its own result; error = no decision.
// Also separates "denied by a permission rule" from "rejected before the permission check".
//   node classify.mjs <cases.json> <out.json>
import fs from "node:fs";

const [casesFile, outFile] = process.argv.slice(2);
const cases = JSON.parse(fs.readFileSync(casesFile, "utf8"));
const out = JSON.parse(fs.readFileSync(outFile, "utf8")).results;
const RULE = /prevents you from using this specific tool call/;
const rows = [];
for (const c of cases) {
  const r = out.find((x) => x.id === c.id);
  const t = r?.tools?.[0];
  let decision, how;
  if (!t) { decision = "error"; how = "no tool part"; }
  else if (t.status === "completed") { decision = "allow"; how = "ran"; }
  else if (t.status === "error" && RULE.test(t.error ?? "")) { decision = "deny"; how = "permission rule"; }
  else if (t.status === "error" && /external_directory|outside of the project|external directory/i.test(t.error ?? "")) { decision = "deny"; how = "external_directory"; }
  else if (t.status === "error") {
    // tool's own error: before or after the permission check is read from the message
    const pre = /Could not find oldString|BadResource|must read|Invalid|invalid/i.test(t.error ?? "");
    decision = pre ? "deny" : "allow"; how = pre ? "rejected before permission check" : "tool error after run";
  } else { decision = "error"; how = t.status; }
  rows.push({ id: c.id, kind: c.kind, category: c.category, expect: c.expect, decision, how, same: c.expect === decision,
    input: c.corpus_path ?? c.corpus_command ?? JSON.stringify(c.args), error: (t?.error ?? "").slice(0, 160) });
}
const by = (k) => rows.filter((r) => r.kind === k);
for (const k of ["path", "bash"]) {
  const rs = by(k);
  console.log(`${k}: ${rs.length} cases, ${rs.filter((r) => r.same).length} same, ${rs.filter((r) => !r.same).length} differ`);
}
for (const r of rows) console.log([r.same ? "  " : "XX", r.id, r.category, `exp=${r.expect}`, `got=${r.decision}`, `(${r.how})`, r.input.slice(0, 90), r.same ? "" : r.error.slice(0, 90)].join(" | "));
fs.writeFileSync(outFile.replace(/\.json$/, "-classified.json"), JSON.stringify(rows, null, 1));
