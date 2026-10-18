// The staged package.json of `architect-sdd` (C002-IF-003 §2, C002-T-022): unscoped name, the version of
// plugins/architect/.claude-plugin/plugin.json (C002-CON-16), the two executables `sdd` and `sdd-mcp`
// (C002-REQ-501, C002-REQ-412), no dependencies and no scripts (C002-CON-11), the `files` list, Node 20+.

/** Name of the npm package (C002-REQ-502): unscoped. */
export const NPM_NAME = "architect-sdd";

/** The manifest object for `version`, in the key order of C002-IF-003 §2. */
export function npmManifest(version) {
  return {
    name: NPM_NAME,
    version,
    description: "sdd CLI and sdd MCP server of the Architect spec-driven workflow",
    license: "MIT",
    type: "module",
    bin: { sdd: "scripts/sdd.mjs", "sdd-mcp": "scripts/sdd-mcp.mjs" },
    files: ["scripts/sdd.mjs", "scripts/sdd-mcp.mjs", "templates/", "serena/", "THIRD_PARTY_NOTICES.md"],
    engines: { node: ">=20" },
  };
}

/** The manifest as written to the staging folder: two-space JSON with a final newline. */
export function npmManifestText(version) {
  return JSON.stringify(npmManifest(version), null, 2) + "\n";
}
