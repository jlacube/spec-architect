// S-07 throwaway: builds the hand-replay sample (>= 30 path and >= 30 shell corpus cases) as driver
// cases for the agent `probe-perm`. Never shipped.
//   node build-sample.mjs <repo-root> <workspace> <outside> <out.json>
import fs from "node:fs";
import path from "node:path";

const [root, ws, outside, out] = process.argv.slice(2);
const pc = JSON.parse(fs.readFileSync(path.join(root, "tests/guards/path-corpus.json"), "utf8")).cases;
const bc = JSON.parse(fs.readFileSync(path.join(root, "tests/guards/bash-corpus.json"), "utf8")).cases;

const PATH_IDS = [
  "PG-001", "PG-004", "PG-043", "PG-044", "PG-045", "PG-046", "PG-048",
  "PG-049", "PG-050", "PG-052", "PG-053", "PG-079", "PG-080", "PG-081", "PG-082",
  "PG-086", "PG-087", "PG-088", "PG-090", "PG-091", "PG-092", "PG-093",
  "PG-096", "PG-097", "PG-098", "PG-099", "PG-103", "PG-105", "PG-106", "PG-107", "PG-108", "PG-109", "PG-110", "PG-112", "PG-114",
  "PG-119", "PG-120", "PG-121", "PG-122", "PG-124", "PG-125", "PG-127", "PG-128",
  "PG-139", "PG-140", "PG-142", "PG-143", "PG-144", "PG-146", "PG-147", "PG-148", "PG-150",
];
const BASH_IDS = [
  "BG-001", "BG-004", "BG-007", "BG-010", "BG-013", "BG-015", "BG-030", "BG-039",
  "BG-045", "BG-057", "BG-066", "BG-069",
  "BG-094", "BG-100", "BG-103", "BG-109",
  "BG-115", "BG-121", "BG-127", "BG-130", "BG-133", "BG-139",
  "BG-154", "BG-157", "BG-160", "BG-166",
  "BG-167", "BG-170", "BG-173", "BG-176", "BG-182", "BG-185", "BG-188",
  "BG-197", "BG-200", "BG-203", "BG-206", "BG-209", "BG-212", "BG-215", "BG-221",
  "BG-226", "BG-229", "BG-232", "BG-235",
  "BG-278", "BG-287", "BG-302", "BG-307", "BG-317", "BG-353", "BG-358", "BG-368", "BG-373", "BG-394", "BG-412", "BG-417",
];

const fwd = ws.replace(/\\/g, "/");
const subst = (s) =>
  s
    .replaceAll("{repo\\}", fwd.replace(/\//g, "\\"))
    .replaceAll("{REPO}", fwd.toUpperCase())
    .replaceAll("{repo-lowerdrive}", fwd[0].toLowerCase() + fwd.slice(1))
    .replaceAll("{repo}", fwd)
    .replaceAll("{outside}", outside.replace(/\\/g, "/"))
    .replaceAll("{sdd}", "C:/p/scripts/sdd.mjs");
const expectOf = (e) => (typeof e === "object" && e ? e.win32 ?? e.default : e);

const cases = [];
for (const id of PATH_IDS) {
  const c = pc.find((x) => x.id === id);
  const p = subst(c.path);
  const call = c.tool === "Edit"
    ? { tool: "edit", args: { filePath: p, oldString: "x", newString: "y" } }
    : { tool: "write", args: { filePath: p, content: "s07\n" } };
  cases.push({ id, kind: "path", category: c.category, agent: "probe-perm", expect: expectOf(c.expect), corpus_path: c.path, ...call });
}
for (const id of BASH_IDS) {
  const c = bc.find((x) => x.id === id);
  const cmd = subst(c.command);
  cases.push({ id, kind: "bash", category: c.category, agent: "probe-perm", expect: expectOf(c.expect), corpus_command: c.command,
    tool: "bash", args: { command: cmd, description: `s07 ${id}` } });
}
fs.writeFileSync(out, JSON.stringify(cases, null, 1));
console.log(cases.filter((c) => c.kind === "path").length, "path,", cases.filter((c) => c.kind === "bash").length, "bash");
