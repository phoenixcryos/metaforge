# Research corpus

`source-corpus-2026-08.md` — the primary source for everything in `src/kb/`.

Six frontier models were each given the same executive research directive on
advanced metaprompting, context engineering, MCP integration, and autonomous model
orchestration. Each returned an independent technical report. This file is all six
concatenated, in this order:

| Line (approx) | Report |
|---|---|
| 66 | `Claude Opus 4.8` |
| 663 | `gpt-5.6-luna-xhigh` |
| 3906 | `gpt-5.6-terra-xhigh` |
| 5875 | `claude-haiku-4-5` |
| 8708 | `gpt-5.5-xhigh` |
| 12411 | `claude-opus-5-low` |

The original research directive is at the top of the file.

**This is a snapshot, not a living document.** It is committed so that every claim
in the KB can be traced to its source, and so a future maintainer can diff a fresh
corpus against it. See [`../docs/PROVENANCE.md`](../docs/PROVENANCE.md) for the
claim-by-claim mapping and [`../docs/MAINTENANCE.md`](../docs/MAINTENANCE.md) for
the annual refresh procedure.

Material extracted so far is catalogued in PROVENANCE.md. Sections not yet mined
into the KB include: MCP server/tool JSON schemas, DSPy compilation configs,
AGENTS.md reference templates, ReAct state schemas, ToT/GoT orchestration schemas,
and the prompt-optimization experiment spec. These are candidates for ROADMAP
items 5 and 8.
