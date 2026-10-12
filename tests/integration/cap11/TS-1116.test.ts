// C001-TC-1116 / C001-TS-1116 (C001-AC-1115.1, C001-REQ-1115): the plugin README and the repository README
// contain the required sections (PLG-README-001 reports nothing), and Troubleshooting covers every
// remedy of the doctor's table.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { context } from "../../../scripts/check/lib.mjs";
import readme from "../../../scripts/check/readme.mjs";
import { repoRoot } from "../../helpers.ts";

test("README completeness", () => {
  assert.deepEqual(readme.check(context({ repo: repoRoot() })), []);
});

test("Troubleshooting covers every doctor remedy", () => {
  const plugin = join(repoRoot(), "plugins", "architect");
  const doctor = readFileSync(join(plugin, "commands", "doctor.md"), "utf8");
  // The remedies table: the rows after its header "| Tool | Detection | Install / fix command |".
  const lines = doctor.split("\n");
  const head = lines.findIndex((l) => /^\| Tool \| Detection \|/.test(l));
  const rows: string[] = [];
  for (let i = head + 2; i < lines.length && lines[i]!.startsWith("|"); i++) rows.push(lines[i]!);
  assert.ok(rows.length >= 9, `doctor remedies: ${rows.length}`);
  const text = readFileSync(join(plugin, "README.md"), "utf8");
  const trouble = text.slice(text.indexOf("## Troubleshooting"), text.indexOf("## License"));
  for (const r of rows) {
    const [tool, , fix] = r.split("|").slice(1, 4).map((c) => c.trim());
    const command = /`([^`]+)`/.exec(fix ?? "")?.[1] ?? "";
    assert.ok(trouble.includes(command), `${tool}: remedy ${command} in Troubleshooting`);
  }
});
