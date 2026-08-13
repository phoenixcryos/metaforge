# Changelog

All notable changes to MetaForge. Format: [Keep a Changelog](https://keepachangelog.com/).
Versioning policy: [`docs/VERSIONING.md`](docs/VERSIONING.md).

Every entry explains **why**, not just what — that is what makes it useful to a
future maintainer deciding whether the reasoning still holds.

## [Unreleased]

### Added
- **Eval harness (P0 + P1)** — `bin/eval.js` + `eval/`: JSONL tasks, three arms
  (baseline / MetaForge / naive), `--routing-only` audit, echo executor, checker
  registry (`json.schema`, `constraints.keyword`, `echo.pass`), CI95 arm table.
  Zero new dependencies; no model API calls in core. See `eval/README.md`.
- **Simple Mode** — four plain-English questions that deterministically fill a
  complete spec and hand it to the existing `route()` + emitter. Entry link above
  the advanced form; review strip shows every inference with its reason; tools
  stay off; escalate-only lexicons for risk/untrusted/constraints. Zero new
  dependencies. See `src/ui/simple.js`.
- `src/engine/shape.js` — task-shape classification extracted from the router and
  rebuilt as a scored classifier over verb classes and structural frames. Returns
  `{shape, confidence, runnerUp, scores, rawScores}` instead of a bare label.
- `npm run test:shapes` — accuracy harness over three fixtures (60 tuning, 30
  dev, 30 held-out) with confusion matrix, per-miss listing, and calibration
  check. Gates CI on **held-out** numbers, never the tuning number.
- Routing panel now states where shape came from — your domain selection or a
  read of your wording — and flags close calls with an amber `shape ?` pill.

### Changed
- `route()` delegates shape to `resolveShape()`; the five last-match-wins regexes
  are gone. All six preset routings are unchanged, verified against the v1.0
  baseline table.

### Why this is documented as a partial success
Held-out top-1 accuracy is **46.7%**, well short of the ≥90% the roadmap asked
for. The tuning-set figure is 100% and is not quoted anywhere as an accuracy
claim, because the previous iteration scored 98.3% on its tuning set and 33.3%
on unseen phrasings — pure memorization of fixture wording.

The target was retired rather than met, because top-1 shape turned out to be the
wrong metric: free-text shape changes the emitted prompt in only 6 of 48
domain×consumer×risk cells, and in those the decision is binary. Held out, the
binaries that actually route run 80.0–86.7%. Those are the numbers in the gate
and in the docs.

### Removed
- A confidence gate (fall back to `linear` below 0.62) was implemented here and
  then deleted after measurement: across 120 labeled cases it destroyed three
  correct classifications and rescued zero incorrect ones. Low confidence means
  "two shapes are plausible", not "the top pick is wrong". Confidence is still
  computed and shown to the user; it no longer silently alters routing.

Full write-up: [`docs/EVALUATION.md`](docs/EVALUATION.md), "Case study: the shape
classifier".

---

## [1.1.0] — 2026-08-11

First repository release. v1.0.0 was a single prototype HTML file; this
restructures it into a maintainable, testable, deployable project and mines
research that the prototype left on the table.

### Added
- **Failure-mode knowledge base** (`src/kb/failures.js`) — the four failure modes
  of long context with detection signals, the ten-item context-rot taxonomy,
  reflection failure modes, multi-agent failure modes, the six-rung compression
  ladder, calibration signals, and aggregation methods. This was the largest
  unmined asset in the source corpus and it is what makes the diagnostics
  principled rather than ad hoc.
- **Calibration & abstention block.** Fires when risk is high and no programmatic
  verifier exists — precisely the case where a confidently wrong answer is most
  expensive and nothing will catch it. Adds an `abstained` field to the JSON
  contract.
- **Legal / compliance domain profile**, with quote-before-interpret MUSTs and a
  citation-fidelity verification gate.
- **Provenance stamping** on every compile: `kb_version`, `engine_version`,
  `spec_version`, a stable `context_hash`, and the routing decision. Irreproducible
  contexts are the top cause of "the prompt regressed" (R19); without a hash you
  cannot tell a prompt change from a model change.
- **Diagnostics** for tool catalog bloat (>20 tools → Context Confusion) and
  oversized evidence (>2k tokens → compression ladder rung 6, R04).
- **JSON export** alongside markdown, so compiled prompts can be committed or fed
  to a harness.
- **Test suite** — 226 invariant assertions over 1,440 compiled specs, plus 28
  assertions executing the built artifact.
- **Documentation set** — architecture, API, provenance, maintenance, versioning,
  evaluation, contributing, roadmap, deployment, `AGENTS.md`, and five ADRs.
- **CI and GitHub Pages deployment**, including a check that the artifact contains
  no external URLs.

### Changed
- **Split the prototype into modules** (`src/kb`, `src/engine`, `src/ui`) with a
  strict boundary: `router.js` makes decisions and emits no prose; `sections.js`
  emits prose and makes no decisions. This is what allows wording to be tuned
  without risking routing behavior, and vice versa.
- **Agent workflows now route to Plan-and-Execute** rather than a bare verify loop
  when tools are enabled. A frozen plan with a cheap executor avoids the drift and
  looping that pure ReAct produces past roughly 20 steps.
- **Reflection depth capped at 1 on the Light tier.** Cheap tasks do not earn
  iteration, and ungrounded critique on a formatting task is pure drift risk with
  no upside (R06).
- **Model adapter parameters are now consumer-aware** — structured-output params
  are stripped for prose consumers, and thinking is disabled on the Light tier,
  rather than emitting parameters the call does not need.
- Call-parameter JSON is pretty-printed instead of one-lined.

### Fixed
- **Namespace imports were silently dropped by the build**, shipping a page where
  every button threw `X is not defined`. Unit tests passed because they import the
  ES modules directly; nothing tested the artifact. `build.js` now rebuilds
  namespace objects from the target module's export list, and `test/bundle.js`
  executes the bundled engine and asserts byte-parity with source.
  ([ADR-0005](docs/adr/0005-namespace-shims-in-build.md))
- Grammar bug in `IDENTITY` ("You are a offensive security engineer") — now
  article-aware.
- `METHOD` referenced a `VERIFICATION` section that did not exist. Added
  `VERIFICATION_GATES` with domain-specific executable gates.
- Checkbox label inherited the uppercase field-label style.

## [1.0.0] — 2026-08-11

Initial prototype: single-file HTML compiler with the router, six domains, six
model dialects, the 23-technique matrix, and R01–R24.
