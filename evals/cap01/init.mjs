// Shared run of /architect:init on a workspace without a constitution (C001-TS-119, C001-TS-120).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { architectWithStubs } from "../harness/overlay.mjs";
import { git } from "../harness/workspaces.mjs";

export const CONSTITUTION = ".sdd/_constitution/constitution.md";

export const initRun = {
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: (root) => git(root, "init", "-q"),
  allowTools: ["Write", "Edit", "Bash", "Agent"],
  maxTurns: 24,
  prompt: "/architect:init",
};

export function readConstitution(root) {
  try {
    return readFileSync(join(root, ...CONSTITUTION.split("/")), "utf8");
  } catch {
    return "";
  }
}
