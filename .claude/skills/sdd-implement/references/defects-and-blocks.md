# Spec defects and blockers

The implementer never fixes the spec. Report and stop; the owner (P-01) decides, usually through a
revision on the architect side (`/architect:revise`).

## Spec defect vs blocker vs question

| Situation | It is a | Action |
|---|---|---|
| Two REQs / AC contradict; an AC cannot be met; a scenario is untestable as written | spec defect | `defect add --ref <REQ/AC/TS-ID>`, task `blocked`, stop |
| Interface, error code, data shape or decision the task needs is missing or wrong | spec defect | `defect add --ref <IF/COMP/ADR-ID>`, task `blocked`, stop |
| Task's Targets or Step outline cannot work with the real code (symbol gone, wrong file) | plan defect | `defect add --ref <T-ID>`, task `blocked`, stop |
| Precondition unmet; dependency task not truly done; tool, service or credential missing | blocker | task `blocked --reason`, stop |
| Hand-off limit reached (spend, approval needed, version gate) | blocker | task `blocked --reason`, ask the owner |
| Two valid readings, the spec is silent, the choice is invisible to users and tests | question | choose the reading closest to the REQ wording and existing code; name it in the note — or ask, if the owner is present |
| Same as above but the choice changes behaviour, an interface or an NFR | spec defect | as above |

When in doubt between "question" and "defect": defect. A defect costs a short revision; a silent
guess costs a wrong product.

## How to write it

```bash
sdd defect add --ref C004-AC-012.1 --summary "AC-012.1 expects rejection at expiry month but REQ-012 accepts until month end; cannot satisfy both"
sdd task set C004-T-031 --status blocked --reason "defect on C004-AC-012.1 (expiry boundary contradicts REQ-012)"
```

- `--ref` is the most specific ID at fault.
- `--summary` / `--reason`: one line, the conflict and its evidence, no proposed redesign.
- Commit the CLI's `.sdd/` changes as a reporting commit.
- Work already done for the task: keep it on disk uncommitted, or commit it only if it is
  correct regardless of the defect's outcome (say which in the message to the owner).

Then tell the owner: the ID, the conflict, what you need decided, and which other ready tasks can
continue meanwhile. Continue with tasks that do not depend on the blocked one only if the owner
is not available and the hand-off allows it.

## Unblocking

When the owner says the defect is resolved (closed, revised and re-approved plan), re-read the
changed spec/plan text — the task may have changed — then set the task back to `in-progress` and
restart at **Load**. Never close a defect yourself.
