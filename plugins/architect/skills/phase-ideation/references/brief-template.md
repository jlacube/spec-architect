# Specialist brief template

Every dispatch to a specialist uses this template (C001-REQ-214). Fill every field; write
`none` when a field does not apply. Refer to artifacts by path and ID; never paste their content. Write every path relative to
the repository root, starting with `.sdd/` (for example `.sdd/004-coupons/10-spec/spec.md`);
never an absolute path or a path relative to `.sdd/`.
The only exception is an excerpt of at most 40 lines that states a specific question
(C001-REQ-215), marked as an excerpt with its source path and line range.

```markdown
# Brief — <specialist role>: <one-line task>

- **Change:** CHG-<NNN> "<title>" · profile <full|lite> · kind <greenfield|brownfield|mixed>
- **Phase / step:** <00-ideation|10-spec|20-plan> · step <n> — <step title>
- **Task:** <what to produce and why, 2–6 sentences; the decision or question it serves>
- **Inputs (read these):**
  - `.sdd/<NNN>-<slug>/<path>` — <what to take from it>
  - …
- **IDs to use:** <ID types and blocks, e.g. "allocate REQ and NFR with
  `sdd id next REQ --change <NNN>`; CAP-03 requirements use the 3xx block"; IDs to reference>
- **Outputs (write only these):**
  - `.sdd/<NNN>-<slug>/<path>` — <content expected>
- **Quality bar:** <skills and sections that apply, e.g. "ears-requirements, sdd-conventions
  §Writing rules; C001-IF-03 §5 research-note headings">
- **Constraints:** <scope limits, decisions already taken (DEC/OA IDs), unattended mode if
  active, time or cost limits>
- **Return contract:** final message = Digest (≤ 15 lines, IDs and paths), Written (paths),
  and a `questions` block (C001-IF-05) only for what P-01 alone can decide — the return contract
  of the sdd-conventions skill. Do not ask P-01 directly.
```

## Checks before dispatching

- The change ID, phase and at least one input path written as `.sdd/<NNN>-<slug>/…` are present.
- Every output path is inside `.sdd/<NNN>-<slug>/` and is owned by that specialist's role.
- No block of more than 40 consecutive lines copied from any `.sdd/` file.
- Independent briefs of the same step are dispatched together, in one turn.
