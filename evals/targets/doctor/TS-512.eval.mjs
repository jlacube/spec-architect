// C002-TC-512 — verifies C002-TS-512 (C002-AC-507.1, C002-REQ-507; C002-T-038): the init command on
// OpenCode, on cfg-full and a repository without `.sdd/`, writes `.sdd/_constitution/toolchain.md` with
// the OpenCode row and the sdd CLI row once the baseline survey completes. OpenCode only: carried to
// C002-T-056 (`run.mjs --host opencode`).
import { checker } from "../../harness/assert.mjs";
import { git } from "../../harness/workspaces.mjs";
import { doctorCase } from "./doctor-cases.mjs";
import { toolchainProblems } from "./TS-511.eval.mjs";

export default [
  {
    id: "TS-512-opencode",
    title: "toolchain.md written by init on OpenCode (TS-512)",
    ...doctorCase("opencode", "cfg-full", {
      prompt: "/architect-init",
      fixture: (root) => git(root, "init", "-q"),
      targetPackage: { target: "opencode" },
    }),
    assert({ root }) {
      const { failures, check } = checker();
      for (const p of toolchainProblems(root, "opencode", { only: ["OpenCode", "sdd CLI"] })) check(false, `TS-512 ${p}`);
      return failures;
    },
  },
];
