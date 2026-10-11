// One /architect:doctor run on cfg-no-ripwire graded against C001-TS-1111 (8-row table; ripwire missing
// with fallback and the install command of C001-IF-10 §3) and C001-TS-1015 (serena_config.yml written
// in the plugin data folder with the project folder inside it and the dashboard off; Serena started from
// it on a copy of fx-brownfield-ts leaves no .serena/ entry in git status --porcelain --ignored).
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checker } from "../harness/assert.mjs";
import { ROOT } from "../harness/fixtures.mjs";
import { doctorRows, doctorRun, PLUGIN_DATA, TOOLS, workspace } from "./doctor.mjs";

const CONFIG = join(PLUGIN_DATA, "serena", "serena_config.yml");

export function ts1111(transcript) {
  const { failures, check } = checker();
  const rows = doctorRows(transcript);
  for (const t of TOOLS) check(rows.filter((r) => r.tool === t).length === 1, `TS-1111: no single row for ${t}`);
  const rw = rows.find((r) => r.tool === "ripwire");
  check(rw?.status === "missing", `TS-1111: ripwire status "${rw?.status}"`);
  check(/serena|lsp|grep/i.test(rw?.fallback ?? ""), `TS-1111: ripwire fallback "${rw?.fallback}"`);
  check(/github\.com\/redhat-et\/ripwire\/releases/.test(rw?.fix ?? ""), "TS-1111: ripwire fix lacks the install command");
  return failures;
}

/** Starts Serena for 20 s from the config on a git copy of fx-brownfield-ts; returns its ignored/untracked entries. */
function serenaLeavesNothing() {
  const repo = mkdtempSync(join(tmpdir(), "sdd-1015-"));
  cpSync(join(ROOT, "tests", "fixtures", "fx-brownfield-ts"), repo, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: repo });
  spawnSync("serena", ["start-mcp-server", "--context", "claude-code", "--mode", "planning", "--mode", join(ROOT, "plugins", "architect", "serena", "architect-read-only.yml"), "--project-from-cwd", "--enable-web-dashboard", "False", "--open-web-dashboard", "False"], {
    cwd: repo,
    env: { ...process.env, SERENA_HOME: join(PLUGIN_DATA, "serena") },
    input: "",
    timeout: 20000,
    shell: process.platform === "win32",
  });
  const status = execFileSync("git", ["status", "--porcelain", "--ignored"], { cwd: repo, encoding: "utf8" });
  try {
    rmSync(repo, { recursive: true, force: true });
  } catch {
    // a language server may still hold the folder; temp folders are cleaned later
  }
  return status.split("\n").filter((l) => /\.serena/.test(l));
}

export default {
  id: "doctor-no-ripwire",
  title: "Doctor on cfg-no-ripwire (TS-1111, TS-1015)",
  ...doctorRun("cfg-no-ripwire"),
  fixture: (root) => {
    // Given: the plugin data folder has no serena_config.yml (eval artifact of earlier runs only).
    rmSync(join(PLUGIN_DATA, "serena"), { recursive: true, force: true });
    workspace(root);
  },
  assert({ transcript }) {
    const failures = ts1111(transcript);
    const local = [];
    const c = (cond, msg) => cond || local.push(msg);
    c(existsSync(CONFIG), `TS-1015: ${CONFIG} not written`);
    const text = existsSync(CONFIG) ? readFileSync(CONFIG, "utf8") : "";
    const loc = /^project_serena_folder_location:\s*"?([^"\n]+)"?/m.exec(text)?.[1] ?? "";
    c(loc.split("\\").join("/").toLowerCase().startsWith(PLUGIN_DATA.split("\\").join("/").toLowerCase()), `TS-1015: project_serena_folder_location "${loc}" is not inside the data folder`);
    c(/^web_dashboard:\s*(false|False)\s*$/m.test(text), "TS-1015: web_dashboard is not false");
    if (existsSync(CONFIG)) {
      const leaks = serenaLeavesNothing();
      c(leaks.length === 0, `TS-1015: git status lists ${leaks.join(", ")}`);
    }
    return [...failures, ...local];
  },
};
