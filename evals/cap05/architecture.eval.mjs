// One architecture run graded against C001-TS-507 (Mermaid flowchart keyed by catalogue COMP IDs and a
// sequenceDiagram per runtime flow) and C001-TS-508 (three flows → three sequence diagrams, each naming
// an existing TS ID; no LINT-ARCH-004), with the architecture lint rules clean (LINT-ARCH-002, 003).
import { checker } from "../harness/assert.mjs";
import { read } from "../cap04/spec.mjs";
import { ARCH, architectRun, brief, lint } from "./arch.mjs";

const TS_IDS = ["C004-TS-101", "C004-TS-102", "C004-TS-201"];

export default {
  id: "architecture",
  title: "Architecture with three runtime flows (TS-507, TS-508)",
  ...architectRun(brief("10-spec · step 5 — Architecture", "write the architecture for the two capabilities, with exactly three runtime flows: the monthly charge, the failed-charge retry and the appointment reminder.", `\`${ARCH}/architecture.md\`, \`${ARCH}/constraints.md\`, and the interface registry \`.sdd/004-clinic-subscriptions/10-spec/50-interfaces/README.md\` for the interfaces you name.`)),
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, `${ARCH}/architecture.md`);
    check(text, "architecture.md missing");
    const comps = [...new Set([...text.matchAll(/^#{2,4} (C004-COMP-\d+)\b/gm)].map((m) => m[1]))];
    check(comps.length >= 2, `catalogue components: ${comps.join(", ")}`);
    const blocks = [...text.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)].map((m) => m[1]);
    const flow = blocks.find((b) => /^\s*flowchart\b/m.test(b)) ?? "";
    check(flow, "TS-507: no Mermaid flowchart");
    for (const c of comps) check(flow.includes(c.replaceAll("-", "_")), `TS-507: flowchart lacks node ${c.replaceAll("-", "_")}`);
    const seqs = blocks.filter((b) => /^\s*sequenceDiagram\b/m.test(b));
    check(seqs.length === 3, `TS-508: ${seqs.length} sequence diagrams for 3 flows`);
    for (const [i, s] of seqs.entries()) check(TS_IDS.some((t) => s.includes(t) || text.slice(text.indexOf(s) - 400, text.indexOf(s)).includes(t)), `TS-508: sequence ${i + 1} names no existing TS ID`);
    for (const s of seqs) check(/participant\s+C004_COMP_\d+/.test(s), "TS-507: sequence participants are not component IDs");
    const f = lint(root).filter((x) => /^LINT-ARCH-00[2-4]$/.test(x.code));
    check(f.length === 0, `lint: ${f.map((x) => `${x.code} ${x.message}`).join("; ")}`);
    return failures;
  },
};
