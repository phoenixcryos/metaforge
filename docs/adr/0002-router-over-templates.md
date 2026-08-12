# ADR-0002: A router, not a template engine

**Status:** Accepted · **Date:** 2026-08-11

## Context

The obvious implementation of "prompt generator" is a template with slots. Most
tools in this space do that: pick a framework (CO-STAR, RISEN), fill in the
blanks, emit.

The research corpus makes that approach untenable. Its central findings are all
*conditional*:

- Tree-of-Thoughts: 4% → 74% on search-shaped tasks; 10–100× pure overhead on linear ones.
- Multi-agent: +20–40% on breadth-first research; **increases** error on tightly-coupled work.
- Extended thinking: strong gains on competition math; flat-to-negative on retrieval and style.
- Self-critique: 15–40% ↓ when grounded in a verifier; ~0–10% with drift risk when not.

A template cannot express a conditional. Emitting a ToT scaffold for every task
would make outputs *worse* for most tasks while costing far more.

## Decision

Compute the structural decisions. `route()` classifies task shape, verifier
availability, risk, and novelty, then selects reasoning topology, thinking tier,
and reflection depth. Section builders render whatever the router decided.

Strict separation: **`router.js` makes decisions and emits no prose;
`sections.js` emits prose and makes no decisions.**

## Consequences

**Good**
- Output is appropriate to the task rather than uniformly maximal.
- The routing rationale is displayable, so users learn the reasoning.
- Decisions are testable independently of wording (ADR-0004).
- Wording can be tuned freely without touching decision logic.

**Bad**
- Classification can be wrong, and a wrong shape is the most expensive error here.
  Mitigated by domain overrides and surfaced routing rationale; better
  classification is ROADMAP item 1.
- More complex than a template. Requires ADRs and docs like this one.

## Revisit if

Measurement (ROADMAP item 2) shows the router's decisions do not beat a fixed
sensible default on real task distributions.
