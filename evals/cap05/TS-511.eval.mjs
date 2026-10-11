// C001-TC-511 — verifies C001-TS-511 (C001-AC-511.1, C001-REQ-511): interface format, all four Examples rows
// in one session: the architect writes an HTTP API, a JSON document, an event stream and a CLI, each in
// its standard format, registered in 50-interfaces/README.md (no LINT-IF-002).
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { checker } from "../harness/assert.mjs";
import { read } from "../cap04/spec.mjs";
import { architectRun, brief, IFS, lint } from "./arch.mjs";

const TASK = "define four interfaces of the billing and notification services, one of each kind: (1) the HTTP API clinics use to view invoices, (2) the JSON document of an invoice, (3) the event stream of billing events (charge succeeded, charge failed), (4) the command-line tool support staff use to re-run a failed charge.";

export default {
  id: "TS-511",
  title: "Interface format (four kinds)",
  ...architectRun(brief("10-spec · step 5 — Interfaces", TASK, `the contract files under \`${IFS}/\`, the registry \`${IFS}/README.md\` and \`${IFS}/errors.md\`.`)),
  assert({ root }) {
    const { failures, check } = checker();
    let names = [];
    try {
      names = readdirSync(join(root, ...IFS.split("/")));
    } catch {
      // no folder
    }
    const file = (re) => names.find((n) => re.test(n));
    const openapi = file(/^openapi\.ya?ml$/);
    check(openapi && /^openapi:\s*["']?3\.1\.\d/m.test(read(root, `${IFS}/${openapi}`)), `HTTP API: openapi.yaml with openapi: 3.1.x (files: ${names.join(", ")})`);
    const schema = file(/\.schema\.json$/);
    check(schema && /"\$schema"\s*:\s*"https:\/\/json-schema\.org\/draft\/2020-12\/schema"/.test(read(root, `${IFS}/${schema}`)), "JSON document: *.schema.json with the 2020-12 $schema");
    if (schema) {
      try {
        JSON.parse(read(root, `${IFS}/${schema}`));
      } catch (e) {
        check(false, `${schema} does not parse: ${e.message}`);
      }
    }
    check(names.includes("events.asyncapi.yaml") && /^asyncapi:\s*["']?3\.0\.\d/m.test(read(root, `${IFS}/events.asyncapi.yaml`)), "event stream: events.asyncapi.yaml with asyncapi: 3.0.x");
    const cli = file(/-cli\.md$/);
    const cliText = cli ? read(root, `${IFS}/${cli}`) : "";
    for (const h of ["Synopsis", "Commands", "Exit codes", "Output"]) check(new RegExp(`^#{1,4} (\\d+\\.\\s*)?${h}\\b`, "m").test(cliText), `CLI: ${cli ?? "*-cli.md"} lacks heading ${h}`);
    const reg = lint(root).filter((x) => x.code === "LINT-IF-002" || x.code === "LINT-IF-001");
    check(reg.length === 0, `registry: ${reg.map((x) => x.message).join("; ")}`);
    return failures;
  },
};
