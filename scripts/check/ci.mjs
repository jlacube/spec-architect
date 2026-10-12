// PLG-CI-001: GitHub Actions workflows run `npm run check` on windows-latest, macos-latest and
// ubuntu-latest and are triggered by workflow_dispatch only (C001-REQ-1119; owned by C001-T-064).
import { join } from "node:path";
import YAML from "yaml";
import { files, finding, read, rel } from "./lib.mjs";

const OSES = ["windows-latest", "macos-latest", "ubuntu-latest"];

export default {
  code: "PLG-CI-001",
  owner: "C001-T-064",
  check(ctx) {
    const dir = join(ctx.repo, ".github", "workflows");
    const flows = files(dir, (r) => /\.ya?ml$/.test(r));
    if (flows.length === 0) return [finding(this.code, rel(ctx, dir), null, "no workflow file")];
    const out = [];
    const seen = new Set();
    let runsCheck = false;
    for (const p of flows) {
      const doc = YAML.parse(read(p)) ?? {};
      const on = doc.on ?? doc[true];
      const triggers = typeof on === "string" ? [on] : Array.isArray(on) ? on : Object.keys(on ?? {});
      if (triggers.length !== 1 || triggers[0] !== "workflow_dispatch") out.push(finding(this.code, rel(ctx, p), null, `triggers ${JSON.stringify(triggers)}; only workflow_dispatch is allowed`));
      const text = read(p);
      for (const os of OSES) if (text.includes(os)) seen.add(os);
      if (/npm run check/.test(text)) runsCheck = true;
    }
    for (const os of OSES) if (!seen.has(os)) out.push(finding(this.code, rel(ctx, dir), null, `no job on ${os}`));
    if (!runsCheck) out.push(finding(this.code, rel(ctx, dir), null, "no step runs npm run check"));
    return out;
  },
};
