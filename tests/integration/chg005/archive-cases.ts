// Archive precondition cases for C005-TS-134 … 140, on change 004 of the cap09 archive fixture (the
// scenarios name change 003 for the full profile; the fixture uses change 004, and the IDs follow it).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { runBundled, type Result } from "../cli/helpers.ts";
import { archiveWorkspace, inventoryStub, type ArchiveFixture, type TaskSpec } from "../cap09/archive-fixture.ts";

export function archiveCase(tasks: TaskSpec[], extra: Partial<ArchiveFixture> = {}) {
  const ws = archiveWorkspace({
    tasks,
    firstSeq: 1,
    reqs: [{ cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "ADDED" }],
    living: { "CAP-billing.md": inventoryStub("billing") },
    ...extra,
  });
  runBundled(["status", "--write"], { cwd: ws.root });
  const base = () => (existsSync(join(ws.root, ".sdd", "004-x")) ? join(ws.root, ".sdd", "004-x") : join(ws.root, ".sdd", "_archive", "004-x"));
  return {
    root: ws.root,
    cleanup: ws.cleanup,
    archive: (): Result => runBundled(["archive", "004"], { cwd: ws.root }),
    activeExists: () => existsSync(join(ws.root, ".sdd", "004-x")),
    archivedExists: () => existsSync(join(ws.root, ".sdd", "_archive")) && readdirSync(join(ws.root, ".sdd", "_archive")).some((d) => d.startsWith("004-")),
    /** Status of a task in the active or archived change. */
    status: (id: string, lite = false): string => {
      if (lite) {
        const plan = readFileSync(join(base(), "20-plan", "plan.md"), "utf8");
        return /- \*\*Status:\*\* (\S+)/.exec(plan.slice(plan.indexOf(`### ${id}`)))![1]!;
      }
      const seq = id.split("-T-")[1]!;
      return String(splitFrontmatter(readFileSync(join(base(), "20-plan", "50-tasks", `T-${seq}-t.md`), "utf8")).data?.["status"]);
    },
  };
}
