---
name: probe-ask
description: S-08 probe of the question tool (askQuestions) — asks one question with three options.
agent: probe-parent
tools: ['vscode/askQuestions']
---

Use the question tool (#tool:vscode/askQuestions) to ask exactly one question: header "S-08",
question "Which option do you pick?", options "Alpha" (recommended), "Beta", "Gamma". Then reply with
the raw result the tool returned, verbatim, including any `skipped` field. Do nothing else.
