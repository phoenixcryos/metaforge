# Roadmap

Ordered by leverage — what most improves output quality per unit of work.
Each item states the problem, the approach, and how you'd know it worked.

---

## 1. Semantic shape classification — **partly done (v1.1)**

**Problem.** Shape detection was keyword regex with last-match-wins: no
tie-breaking, no confidence. Shape drives topology, so a miss here is the most
expensive error the tool can make.

**Shipped.** `src/engine/shape.js` scores all five shapes from verb classes and
structural frames, returns a confidence derived from the *raw* evidence margin,
and the routing panel tells the user whether shape came from their domain
selection or from reading their wording, flagging close calls. A confidence gate
that auto-downgraded low-confidence shapes to `linear` was built, measured, found
to destroy three correct calls while rescuing none, and removed — see
[`EVALUATION.md`](EVALUATION.md).

**Measured** (`npm run test:shapes`, held-out set, never tuned against):

```
top-1                46.7%
aggregation vs not   83.3%    ← selects Graph-of-Thoughts
search vs not        80.0%    ← selects Tree-of-Thoughts
exploration vs not   86.7%    ← selects Plan-and-Execute
```

The original "≥90% top-1" target was **not met and has been retired as the wrong
target.** Free-text shape changes the emitted prompt in only 6 of 48
domain×consumer×risk cells, and in those cells the decision is binary. The
binaries are the operational contract; see the case study in
[`EVALUATION.md`](EVALUATION.md) — including why the tuning-set figure is 100%
and why quoting it would be dishonest.

**Remaining, if it proves worth it:**
1. Grow the holdout to 100+ cases. Thirty cases means ±9pp of noise, which is
   too coarse to detect a real 5-point improvement.
2. Log real user inputs with their predicted shape and confidence. With enough
   of them, revisit whether confidence can drive *any* automatic action — the
   first attempt failed, but on 120 synthetic cases rather than real traffic.
3. Embedding classifier over labeled examples — the pattern approach has likely
   plateaued near 50% top-1. Breaks zero-dependency, so it ships as an opt-in
   module, never in the core bundle.

**Done when:** weakest routing binary ≥90% on a 100-case holdout.

---

## 2. Eval harness — **partly done (P0 + P1)**

**Problem.** [`EVALUATION.md`](EVALUATION.md) describes a methodology nobody can
run without building it. Until it exists, every routing threshold is research-
derived rather than measured.

**Shipped.** `bin/eval.js` + `eval/`: JSONL task format, three arms (baseline /
MetaForge / naive), routing-only mode, echo executor, checker registry
(`json.schema`, `constraints.keyword`, `echo.pass`), record shape + CI95 table.
See [`eval/README.md`](../eval/README.md).

```bash
npm run eval -- --set eval/fixtures/smoke.jsonl --routing-only
npm run eval -- --set eval/fixtures/smoke.jsonl --arms baseline,metaforge,naive
```

**Remaining (P2+).** Script executor against a real model API; 20–50 real tasks
with programmatic checkers; ablation flags; release-gate automation on a sealed set.

**Done when:** `npm run eval -- --set my-tasks.jsonl` produces a table of
`task_success` and `tokens_per_successful_task` per arm with confidence intervals
**from real model runs** (not only echo).

---

## 3. Prompt linting for existing prompts

**Problem.** People have prompts already. MetaForge only helps if you start from a
spec.

**Approach.** `lint(promptText)` → findings against the same rule set: no
insufficiency escape hatch, no output contract, untrusted content not isolated,
constraints not restated at the tail, unbounded reflection language ("keep
improving"), CoT scaffolding on a reasoning model.

**Done when:** pasting a real prompt yields actionable findings mapped to R-numbers.

---

## 4. Spec inference from a task description — **partly done (Simple Mode)**

**Problem.** The form asks for domain, consumer, and risk. Users guess.

**Shipped (Simple Mode).** A four-question deterministic pre-filler
(`src/ui/simple.js`) that asks only for task, deliverable-shape, audience, and
optional constraints, then fills a complete spec for the existing `route()`.
See `docs/SIMPLE_MODE.md`. Tools stay off; risk/untrusted only escalate; a
review strip states every inference.

**Remaining.** Optional auto-inference on the advanced form (pre-fill domain/
consumer/risk from task text with visible markers) without requiring the
Simple Mode path.

**Done when:** for the six presets, advanced-form inference reproduces the
hand-authored spec fields ≥80% of the time *or* Simple Mode covers the
beginner path sufficiently that advanced inference is low priority.

---

## 5. Multi-turn / agent session artifacts

**Problem.** MetaForge compiles a single call. Long-horizon agents also need a
handoff artifact, a compaction prompt, and a state schema — all present in the
research corpus, none emitted today.

**Approach.** When `domain: agent`, additionally emit: a typed handoff/compaction
artifact (objective verbatim, established facts with sources, ruled-out approaches
with `do_not_retry`, open questions, budget remaining, escalation triggers), a
ReAct state schema, and a compaction prompt tuned for recall.

**Done when:** an agent can be paused, compacted, and resumed without losing
established facts or re-attempting a ruled-out approach (R21, R22).

---

## 6. Diff view between routing decisions

**Problem.** Change risk from medium to high and the whole prompt re-renders. What
actually changed is invisible.

**Approach.** Keep the previous compile in memory; render an inline diff of the
system prompt plus a summary of which routing decisions flipped and why.

**Done when:** toggling any input shows exactly what it changed.

---

## 7. Shareable permalinks

**Problem.** No way to send someone a spec.

**Approach.** Encode the spec into the URL fragment (LZ-compressed base64), hydrate
on load. Fragment stays client-side — no server, no storage, no privacy exposure.

**Done when:** a link round-trips a spec exactly, including evidence fields.

---

## 8. Domain packs

**Problem.** Ten domains cover common cases. Specialized fields (clinical, finance,
embedded, ML training) need their own MUSTs, NEVERs, and verification gates.

**Approach.** A documented pack format that adds domains without touching core.
Packs live in `packs/`, are opt-in, and carry their own provenance file — the
sourcing standard applies to contributed knowledge too.

**Done when:** a third party ships a pack without editing `src/`.

---

## Explicitly not planned

| Not doing | Why |
|---|---|
| Calling model APIs from the app | Turns a static artifact into a service with key handling and cost. Compile here, run in your own stack. |
| Accounts, saved history, telemetry | Zero-dependency, zero-backend is the point. Use the download buttons. |
| A React/Vue rewrite | ~700 lines of DOM code. A framework adds a build chain and rot for no user benefit. |
| Chasing every new technique | Bar for the matrix: reproduced results *and* a clear statement of when it does not help. Hype is not evidence. |
| Real tokenizer | Would require per-model tokenizer data. Estimates are adequate for pressure warnings; anything billing-grade should measure at the API. |

---

## Contributing to the roadmap

Open an issue with: the problem in one paragraph, why it matters more than the
items above it, and what "done" looks like. Items move up when someone makes that
case — or ships it.
