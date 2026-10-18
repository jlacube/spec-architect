// C001-TC-1015 — verifies C001-TS-1015 (C001-AC-1013.1, C001-REQ-1013; defect D-010): Serena data kept
// outside the repository. Given a plugin data folder without serena/serena_config.yml, a session starts in a
// copy of fx-brownfield-ts with the plugin enabled — no /architect:init, no /architect:doctor — and the
// cartographer makes a Serena call. Claude Code starts Serena through `sdd serena-launch`, which must write
// the configuration first: afterwards the file exists in the data folder (project folders inside it,
// dashboard off) and the repository has no .serena/ entry.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { checker, toolCalls } from "../harness/assert.mjs";
import { PLUGIN_DATA_FOLDERS, pluginData } from "../cap11/doctor.mjs";
import { brief, callersFixture, cartoRun, EVIDENCE } from "./carto.mjs";

const TASK = "Use Serena (find_symbol) to locate the function createIntent and record its file and line as one evidence entry.";

const base = cartoRun("cfg-no-ripwire", brief(TASK, `\`${EVIDENCE}/serena-probe.md\`.`), (root) => {
  // Given: no Serena configuration in the plugin data folder (eval artifact of earlier runs only).
  // only the config: a running Serena may hold its log files
  for (const data of PLUGIN_DATA_FOLDERS) rmSync(join(data, "serena", "serena_config.yml"), { force: true });
  callersFixture(root);
});

export default {
  id: "TS-1015",
  title: "Serena data kept outside the repository without init or doctor (TS-1015, D-010)",
  ...base,
  maxTurns: 14,
  assert({ transcript, root, auth }) {
    const PLUGIN_DATA = pluginData(auth);
    const CONFIG = join(PLUGIN_DATA, "serena", "serena_config.yml");
    const { failures, check } = checker();
    const serena = toolCalls(transcript).filter((c) => /mcp__plugin_architect_serena__/.test(c.name));
    check(serena.length > 0, "no Serena tool was called (the scenario needs Serena to start)");
    check(existsSync(CONFIG), `${CONFIG} not written`);
    if (existsSync(CONFIG)) {
      const text = readFileSync(CONFIG, "utf8");
      const loc = /^project_serena_folder_location:\s*"?([^"\n]+)"?/m.exec(text)?.[1] ?? "";
      check(loc.split("\\").join("/").toLowerCase().startsWith(PLUGIN_DATA.split("\\").join("/").toLowerCase()), `project_serena_folder_location "${loc}" is not inside the data folder`);
      check(/^web_dashboard:\s*(false|False)\s*$/m.test(text), "web_dashboard is not false");
    }
    const status = execFileSync("git", ["status", "--porcelain", "--ignored"], { cwd: root, encoding: "utf8" });
    const leaks = status.split("\n").filter((l) => /\.serena/.test(l));
    check(leaks.length === 0, `git status lists ${leaks.join(", ")}`);
    return failures;
  },
};
