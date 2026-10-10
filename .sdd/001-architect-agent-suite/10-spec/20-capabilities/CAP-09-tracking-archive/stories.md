---
id: C001-CAP-09
artifact: spec/stories
capability: "Implementation tracking, orientation and archive"
change: CHG-001
phase: 10-spec
status: approved
id_block: { US: 901-999, REQ: 901-999, TS: 901-999 }
---

# C001-CAP-09 — Implementation tracking, orientation and archive: user stories

### C001-US-901 — Report task progress with one command
- **As a** P-02 implementer
- **I want** to mark a task in progress, blocked, done or dropped (with commit SHA and notes) using one command
- **So that** `.sdd/` always reflects where implementation stands without editing several files
- **Value / outcome:** Q19 "know where they are in terms of implementation"; C001-SC-10
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-09
- **Requirements:** C001-REQ-901, C001-REQ-902, C001-REQ-903, C001-REQ-904, C001-REQ-922
- **Traces to:** Q19, IDEA-§10.6

### C001-US-902 — Report progress without tooling
- **As a** P-02 implementer who cannot run the CLI
- **I want** to update a task's status by editing its frontmatter, and have the workspace reconcile it
- **So that** tracking works in any environment
- **Value / outcome:** C001-GOAL-07; mitigates IDEA-RK-13
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-09
- **Requirements:** C001-REQ-905, C001-REQ-906
- **Traces to:** IDEA-§10.6 point 3

### C001-US-903 — Report spec defects instead of working around them
- **As a** P-02 implementer
- **I want** to record a defect against a specific requirement, criterion or task, and have the conductor pick it up
- **So that** wrong specs get fixed at the source and the fix is traceable
- **Value / outcome:** closes the loop of IDEA-§20.3
- **Priority:** Must · **Size hint:** M · **Capability:** C001-CAP-09
- **Requirements:** C001-REQ-907, C001-REQ-908, C001-REQ-909, C001-REQ-910, C001-REQ-923
- **Traces to:** IDEA-§10.6, §20.3

### C001-US-904 — Every session knows the workspace state
- **As a** P-05 workspace agent (any Claude Code session in the repository)
- **I want** a short status brief injected when a session starts in a repository with `.sdd/`
- **So that** implementers and other agents are reminded of active changes, progress and open defects
- **Value / outcome:** C001-SC-10; mitigates IDEA-RK-13
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-09
- **Requirements:** C001-REQ-911, C001-REQ-912
- **Traces to:** IDEA-§17.2 SessionStart

### C001-US-905 — Merge a finished change into the current-truth specs
- **As a** P-01 spec owner
- **I want** a finished change's requirements, criteria and scenarios folded into the living spec of each capability, with the history of what they replaced, and its glossary terms merged
- **So that** the next change and any validator see one current truth
- **Value / outcome:** OQ-07a decided in v1; C001-GOAL-02
- **Priority:** Must · **Size hint:** L · **Capability:** C001-CAP-09
- **Requirements:** C001-REQ-914, C001-REQ-915, C001-REQ-916, C001-REQ-917, C001-REQ-918, C001-REQ-919, C001-REQ-920
- **Traces to:** OQ-07, OA-09

### C001-US-906 — Archive only what is really finished, and preview it
- **As a** P-01 spec owner
- **I want** archiving to be refused while tasks or defects are open, and to preview the merge before it happens
- **So that** living specs never claim behaviour that isn't implemented, and I can check the merge
- **Value / outcome:** integrity of `_living/`
- **Priority:** Must · **Size hint:** S · **Capability:** C001-CAP-09
- **Requirements:** C001-REQ-913, C001-REQ-921
- **Traces to:** OQ-07, DOD-G-07
