---
id: C001-IF-13
artifact: spec/interface
kind: conventions
change: CHG-001
phase: 10-spec
status: approved
---

# C001-IF-13 — Gate summary and approval hash

## §1 Gate summary (`sdd gate show`)

```text
Gate G2 — CHG-004 "Add SEPA direct debit" — phase 10-spec (status: in-review)
Files (23): 00-index.md, 10-context/… (list)
IDs: US 14 · REQ 41 · AC 63 · TS 97 · NFR 9 · INV 7 · IF 4 · COMP 8 · CON 5 · DOD 12
Coverage: TR-01 14/14 · TR-02 41/41 · TR-03 63/63 · TR-04 9/9 · TR-05 50/50 · TR-09 6/6
Lint: 0 error · 3 warn · 2 info
Critic: 0 blocker · 1 major (CR-4) · 5 minor
Open markers: 1 [NEEDS CLARIFICATION] (Q-spec-03 at 30-nfr/nfr.md:44) · 2 [ASSUMPTION]
Stale: no · Previous approval: none
Proposed waivers: (none)
```

For a phase with status `in-revision`, the summary ends with two more lines, computed from the
per-ID content hashes of `approvals.json` (C001-REQ-813, C001-REQ-814; defect D-005):

```text
Impact since last approval: modified C004-REQ-012, C004-AC-012.1 · added C004-TS-044 · removed C004-REQ-020
Downstream: C004-T-031, C004-T-032, C004-DOD-004
```

`Downstream` lists the IDs outside the changed set whose text references a changed ID. When
`approvals.json` has no per-ID hashes for the phase, the first line reads `Impact since last
approval: unknown (…)`. The conductor adds, in prose, "Approving means …" (C001-REQ-802) and
shows these lines at the gate of a revised phase.

## §2 Approval hash algorithm

1. **Inputs:** every file under the phase folder, excluding generated files (`80-traceability.md`,
   `85-open-items.md`) and excluding state files at the change root.
2. **Normalise each file:** decode UTF-8; replace CRLF and CR with LF; if the text begins with a
   line `---`, remove everything up to and including the next line that is exactly `---`
   (with its line terminator); strip trailing spaces and tabs from every line. The remaining
   text keeps its final newline, if any.
3. **Per-file hash:** `h(f) = SHA-256(normalised bytes)` in lowercase hex.
4. **Phase hash:**
   - if exactly one file remains: `sha256:` + `h(f)`. This is the form used for CHG-001's G1
     (C001-TS-806).
   - otherwise: `sha256:` + SHA-256 of the UTF-8 text formed by the lines
     `<relative path with forward slashes>\t<h(f)>\n`, sorted by path in byte order.
5. **Per-ID content hash** (for `approvals.json`): SHA-256 of the normalised text of the ID's
   defining block (from its heading line to the line before the next heading of the same or
   higher level), with the frontmatter rule not applicable.
