# ADR-0003: Knowledge base as plain data

**Status:** Accepted · **Date:** 2026-08-11

## Context

MetaForge encodes a fast-moving field. Model dialects have a half-life around
three months; technique figures around a year. Whoever maintains this — quite
likely an AI agent — must be able to update knowledge without reading or risking
the routing logic.

## Decision

All research content lives in `src/kb/*.js` as plain exported objects and arrays.
No logic, no imports from `engine/`. Each file opens with a provenance comment
naming its source report. `KB_VERSION` is bumped when content changes.

The engine imports the KB; the KB never imports the engine.

## Consequences

**Good**
- Updating a figure is a one-line data edit with no risk to behavior.
- The KB is directly renderable — the reference tabs are just the KB, formatted.
- `test/run.js` validates KB shape, so a malformed entry fails CI rather than
  silently producing a broken prompt.
- Clean provenance: every claim traces to a source file and a report.

**Bad**
- Some duplication between KB data and prompt text.
- Data-driven means data errors are silent unless a schema assertion catches them,
  hence the required-keys checks.

## Revisit if

The KB grows past what is comfortable in JS literals, at which point JSON or YAML
with a loader would be better — but that adds a parse step, so not before it hurts.
