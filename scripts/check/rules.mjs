// PLG-RULES-001: every lint rule code of errors.md has a rule module and a bad/good fixture
// (C001-NFR-503). PLG-MSG-001: every catalogue entry of errors.md and every rule module has a Fix
// text (C001-NFR-601).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { files, finding, frontmatter, read, rel } from "./lib.mjs";

/** Rows of errors.md whose first cell is a single code (`LINT-REQ-001`, `ERR-CLI-003`, …). */
export function catalogue(ctx) {
  return read(join(ctx.interfaces, "errors.md"))
    .split("\n")
    .map((l, i) => ({ cells: l.split("|").map((c) => c.trim()), line: i + 1 }))
    .filter((r) => /^(LINT|ERR|WARN|GUARD|PLG)-[A-Z]+-\d{3}$/.test(r.cells[1] ?? ""))
    .map((r) => ({ code: r.cells[1], cells: r.cells.slice(1, -1), line: r.line }));
}

/** Codes declared by the rule modules of src/lint/rules/ (`code: "LINT-…"`), with each module's fix. */
export function ruleModules(ctx) {
  const out = new Map();
  for (const p of files(join(ctx.repo, "src", "lint", "rules"), (r) => r.endsWith(".ts") && r !== "index.ts")) {
    const text = read(p);
    const fix = /\bfix:\s*["'`]([^"'`]*)["'`]/.exec(text)?.[1] ?? "";
    for (const m of text.matchAll(/\bcode:\s*["']((?:LINT|TR)-[A-Z0-9-]+)["']/g)) out.set(m[1], { path: p, fix });
  }
  return out;
}

/** The open task (not done or dropped) whose file names `code`, e.g. a planned rule; null if none. */
export function openOwner(ctx, code) {
  for (const p of files(ctx.tasks, (r) => r.endsWith(".md"))) {
    const text = read(p);
    const status = String(frontmatter(text).data.status ?? "todo");
    if (status !== "done" && status !== "dropped" && text.includes(code)) return String(frontmatter(text).data.id);
  }
  return null;
}

export const rules001 = {
  code: "PLG-RULES-001",
  check(ctx) {
    const out = [];
    const modules = ruleModules(ctx);
    const errorsPath = rel(ctx, join(ctx.interfaces, "errors.md"));
    for (const e of catalogue(ctx).filter((e) => e.code.startsWith("LINT-"))) {
      const fx = join(ctx.repo, "tests", "lint-fixtures", e.code);
      const problems = [];
      if (!modules.has(e.code)) problems.push(`${e.code} has no rule module`);
      if (!existsSync(join(fx, "bad")) || !existsSync(join(fx, "good"))) problems.push(`${e.code} has no bad/good fixture in tests/lint-fixtures/`);
      // A rule a planned task will write is pending until that task is done.
      const owner = problems.length > 0 ? openOwner(ctx, e.code) : null;
      for (const m of problems) out.push({ ...finding(this.code, errorsPath, e.line, m), ...(owner ? { owner } : {}) });
    }
    return out;
  },
};

export const msg001 = {
  code: "PLG-MSG-001",
  check(ctx) {
    const out = [];
    const errorsPath = rel(ctx, join(ctx.interfaces, "errors.md"));
    // Catalogue tables: ERR/WARN rows are | code | condition | message | fix | spec |; LINT rows | code | severity | condition | fix | spec |.
    for (const e of catalogue(ctx).filter((e) => /^(ERR|WARN|LINT)-/.test(e.code))) if ((e.cells[3] ?? "") === "") out.push(finding(this.code, errorsPath, e.line, `${e.code} has no Fix text`));
    for (const [code, m] of ruleModules(ctx)) if (m.fix.trim() === "") out.push(finding(this.code, rel(ctx, m.path), null, `${code} has no fix text`));
    return out;
  },
};
