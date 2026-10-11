---
name: research-protocol
description: How the researcher answers a research question — source routing (library documentation first, repository knowledge bases for repository internals, then the web), the research-note template with dated sources and confidence ratings, degraded mode when a source is unavailable, and the digest-only return. Use for every research question of an SDD change.
---

# Research protocol

One question, one note. Every finding is backed by a source you actually opened in this
session, dated, and rated for confidence. You never state as fact what only the spec owner
(P-01) can decide (budget, preferences, priorities): ask it through the questions block.

## 1. Route the question

Pick the first matching route; use the next ones only to fill gaps.

| The question is about | First source | Then |
|---|---|---|
| the API, configuration or behaviour of a **named library or framework** | the library-documentation service: resolve the library ID, then query its documentation | web search, then the official documentation pages |
| how a **public repository implements** something | the repository knowledge base: ask your question about that repository (`owner/repo`) | the repository's source files on the web |
| standards, prior art, products, market or anything else | web search | the primary pages found (fetch them) |

- Do the first-source call before any general web search (library questions) or any fetch of
  the repository's source files (repository questions).
- **Degraded mode.** If a first source is unavailable or returns an error, continue with web
  search and fetch, and say so in the Method section with this exact phrase: `Context7
  unavailable (<error>); substitute: WebSearch/WebFetch` (or `DeepWiki unavailable …` for the
  repository knowledge base). Context7 is the library-documentation service, DeepWiki the
  repository knowledge base.
- Prefer primary sources (official documentation, specifications, the repository itself) over
  articles and forums. Record versions when the answer depends on one.

## 2. Cite only what you opened

- A URL may be cited only if it came back in a search result, was fetched, or was returned by a
  documentation or repository-knowledge query in this session. Never cite from memory.
- Use today's date as the access date (`YYYY-MM-DD`).

## 3. Write the note

Path: `.sdd/<NNN>-<slug>/00-ideation/research/R-<seq>-<slug>.md` (number from
`sdd id next R --change <NNN>` when the brief does not give it). Headings, in this order:

```markdown
---
id: C<NNN>-R-<seq>
artifact: ideation/research
change: CHG-<NNN>
phase: 00-ideation
status: draft
---
# R-<seq> — <short title>

## Question
<the question, verbatim from the brief, and why it was asked (decision or ID it serves)>

## Method
<routes used in order, queries made, sources consulted; degraded mode if any>

## Findings
- <finding> — sources: <url> (<YYYY-MM-DD>)[, <url> (<YYYY-MM-DD>)] — confidence: <high|medium|low> (<one-line reason>)

## Confidence
<overall confidence and what would raise it>

## Implications
<what the findings mean for the change: options opened or closed, risks, IDs affected>

## Conflicting evidence
<sources that disagree and how you weighed them, or "None found">

## Follow-up questions
<open questions for further research; questions for P-01 go in the questions block instead>
```

Confidence rubric: **high** — a primary source states it for the relevant version; **medium**
— a primary source implies it, or two independent secondary sources agree; **low** — a single
secondary source, an old version, or an inference.

Check each finding against the lint rules before returning (the auditor runs the lint):
LINT-RES-001 — every finding has a URL with a `YYYY-MM-DD` access date; LINT-RES-002 — every
finding has a rating and a reason.

## 4. Return

Your final message, and nothing else:

- a digest of **at most 15 lines**: the answer, the confidence, the main implication;
- the path of each note written;
- a `questions` block (return contract of the sdd-conventions skill) only for what P-01 alone
  can decide — for example a budget for paid services, a licensing preference or a priority. Do
  not write such a value into the note as a fact.

## Claude Code wiring

- Library documentation: `mcp__plugin_architect_context7__resolve-library-id`, then
  `mcp__plugin_architect_context7__query-docs`.
- Repository knowledge: `mcp__plugin_architect_deepwiki__ask_wiki_question` (repository
  `owner/repo`); `read_wiki_structure` and `read_wiki_contents` for an overview.
- These MCP tools are deferred: load them with `ToolSearch` (`select:<tool name>`) before the
  first call. If loading or calling fails, use degraded mode.
- Web: `WebSearch`, then `WebFetch` on the pages you cite.
