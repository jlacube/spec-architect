// `claude plugin eval` case files (prompt.md + graders/*.md): loading and deterministic grading,
// shared by the SDK case runner (plugin-cases.mjs) and the unit tests. No SDK import here.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { finalReply, toolCalls } from "./assert.mjs";

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  return m ? { data: parseYaml(m[1]) ?? {}, body: m[2] } : { data: {}, body: text };
}

/** Case directories (holding a prompt.md) under the eval directory, with their graders. */
export function loadCases(evalDir) {
  const cases = [];
  const walk = (dir) => {
    if (existsSync(join(dir, "prompt.md"))) {
      const { data, body } = frontmatter(readFileSync(join(dir, "prompt.md"), "utf8"));
      const gdir = join(dir, "graders");
      const graders = existsSync(gdir)
        ? readdirSync(gdir).filter((f) => f.endsWith(".md")).sort().map((f) => {
            const g = frontmatter(readFileSync(join(gdir, f), "utf8"));
            return { name: f.slice(0, -3), ...g.data, criteria: g.body.trim() };
          })
        : [];
      cases.push({ name: data.name ?? relative(evalDir, dir).replace(/\\/g, "/"), dir, prompt: body.trim(), options: data, graders });
      return;
    }
    for (const n of readdirSync(dir)) if (n !== "results" && n !== "mocks" && statSync(join(dir, n)).isDirectory()) walk(join(dir, n));
  };
  walk(evalDir);
  return cases;
}

const matches = (call, inputMatch) => (inputMatch ? new RegExp(inputMatch).test(JSON.stringify(call.input ?? {})) : true);
const pick = (calls, spec) => (typeof spec === "string" ? calls.filter((c) => c.name === spec) : calls.filter((c) => c.name === spec.tool && matches(c, spec.input_match)));

/** Grades one run; returns `{ name, passed, explanation }` per grader. */
export function grade(graders, { transcript, created }) {
  const calls = toolCalls(transcript);
  return graders.map((g) => {
    if (g.type === "tool_used") {
      const n = calls.filter((c) => c.name === g.tool && matches(c, g.input_match)).length;
      const min = g.min ?? 1;
      const max = g.max ?? Infinity;
      return { name: g.name, passed: n >= min && n <= max, explanation: `${g.tool} called ${n}x (expected ${min}..${max === Infinity ? "∞" : max})` };
    }
    if (g.type === "tool_order") {
      const before = pick(calls, g.before)[0];
      const after = pick(calls, g.after)[0];
      return { name: g.name, passed: Boolean(before && after && calls.indexOf(before) < calls.indexOf(after)), explanation: "first matching calls in order" };
    }
    if (g.type === "regex") {
      const target = g.target === "trace" ? transcript.map((r) => JSON.stringify(r)).join("\n") : finalReply(transcript);
      const found = (target.match(new RegExp(g.pattern, `${g.flags ?? ""}g`)) ?? []).length;
      const passed = g.match === "not_contains" ? found === 0 : String(g.match ?? "").startsWith("count:") ? found === Number(String(g.match).slice(6)) : found > 0;
      return { name: g.name, passed, explanation: `${found} match(es)` };
    }
    if (g.type === "file_exists") {
      const re = new RegExp(`^${String(g.path).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")}$`);
      const any = created.some((p) => re.test(p));
      return { name: g.name, passed: g.exists === false ? !any : any, explanation: `${any ? "a" : "no"} created file matches ${g.path}` };
    }
    return { name: g.name, passed: false, explanation: `grader type ${g.type} is not run by the SDK runner` };
  });
}
