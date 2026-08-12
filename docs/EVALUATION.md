# Evaluation

MetaForge currently tells you what *should* work based on the research. It does
not measure whether it did on **your** tasks. This document is the methodology for
finding out — and the honest statement of what is not yet built.

> **Status:** no eval harness ships today. This is the intended design.
> See [ROADMAP](ROADMAP.md) item 2.

---

## Why this matters more than the KB

A knowledge base full of current research attached to a router that makes bad
decisions is worse than useless — it is confidently wrong. The research corpus is
explicit on this point:

> Re-measure on a sealed in-domain eval set before relying on any number for
> capacity or cost planning.

And R18: **programmatic metrics beat LLM-judge metrics.** If you can write a
checker, write the checker.

---

## The comparison that matters

Not "is the MetaForge prompt good?" but:

> For **my** task distribution, does the MetaForge prompt beat what I would have
> written, at what token cost?

That requires three arms:

| Arm | What it is |
|---|---|
| **A — baseline** | Your current prompt, unchanged |
| **B — MetaForge** | Compiled from a spec describing the same job |
| **C — naive** | Just the task text, no scaffold (controls for "any structure helps") |

Arm C matters. If B beats A but ties C, the win came from having *a* structure,
not from *this* structure.

---

## Metrics

Prefer programmatic. In rough order of usefulness:

| Metric | How | Applies to |
|---|---|---|
| `schema_validity` | Validate against the output contract | Any machine-consumed output |
| `task_success` | Domain checker — tests pass, query returns right rows, extraction matches gold | Anything with a ground truth |
| `constraint_violation_rate` | One assertion per stated constraint | Everything |
| `unsupported_claim_rate` | Claims with no source ÷ total claims | Research, analysis |
| `citation_coverage` | Claims with a valid source ÷ claims requiring one | RAG, research |
| `tool_error_rate` | Failed calls ÷ total calls | Agents |
| `loop_detected` | Any identical (tool, args) pair retried >2× | Agents |
| `tokens_per_successful_task` | **Total** tokens ÷ successes | Everything — this is the real cost metric |
| `cost_per_successful_task` | Dollars ÷ successes | Everything |
| `p50 / p95 latency` | Wall clock | Anything interactive |

`tokens_per_successful_task` is the one to optimize. Tokens-per-call rewards
prompts that fail cheaply; tokens-per-*success* is what you actually pay.

If you must use an LLM judge (R18): randomize position, control for length, and
validate the judge against human labels on a sample first.

---

## Dataset discipline

```
train  ~40%   prompt/router iteration
dev    ~30%   candidate selection
test   ~30%   SEALED — release gate only, run once per release
```

Touching `test` more than once per release turns it into `dev` and you lose your
only unbiased estimate.

Twenty to fifty real tasks per domain beats a thousand synthetic ones. Draw from
actual logs, including the ones that failed.

---

## Case study: the shape classifier, and why we publish 47% instead of 100%

This is the worked example of the discipline above, kept because it went wrong in
an instructive way.

`src/engine/shape.js` classifies a task into linear / search / aggregation /
verification / exploration. Three versions exist:

| version | approach | tuning set | held out |
|---|---|---|---|
| v1 | five regexes, last-match-wins | — | — |
| v2 | scored, literal-phrase features | **98.3%** | **33.3%** |
| v3 | scored, verb-class + structural-frame features | **100%** | **46.7%** |

**v2 is the cautionary tale.** Its 98.3% was produced by writing regexes that
matched the exact phrasings in the fixture. On thirty unseen cases it scored
33.3%, and *every single miss collapsed to `linear`* — no other shape's
vocabulary matched at all. The features had memorized the fixture, not the
concept. Had the holdout not existed, that 98.3% would have shipped as if real.

**v3 generalizes better but not dramatically.** It matches on verb classes
(semantic families like "merge-like verbs") and structural frames (`does/is/can
X …?` = a yes/no question about an existing artifact). That lifted held-out
accuracy by ~14 points. It is still 47%, and no amount of further hand-tuning
is likely to fix that — natural-language phrasing has a longer tail than
hand-written patterns can cover.

### Why 47% is nevertheless acceptable

Top-1 shape accuracy is the wrong metric, because top-1 shape is not what the
router consumes. Enumerating all domain × consumer × risk cells:

- Free-text classification decides shape in **4 of 10 domains** (`code`, `data`,
  `general`, and `agent` with tools off). The other six carry a `DOMAIN_SHAPE`
  override, which is a user-supplied fact rather than an inference.
- Of 48 free-text cells, the shape changes the emitted prompt in **only 6** —
  all `general` domain. Elsewhere the programmatic-verifier branch or the tier
  clamp reaches the same topology regardless of shape.
- In those 6 cells the live questions are binary: *aggregation or not* (selects
  Graph-of-Thoughts) and, at high risk, *search or not* (selects
  Tree-of-Thoughts).

Held-out accuracy on the binaries that actually route:

```
aggregation vs not   83.3%
search vs not        80.0%
exploration vs not   86.7%
```

**Those are the numbers to quote.** They are the operational contract and they
are what `test/shapes.js` gates on (≥75% on the weakest binary).

### Confidence is measured on raw evidence, not final scores

The classifier applies interaction rules ("a yes/no question about harm is
verification, not exploration") that swing scores by 3–4 points. Reading
confidence off the *final* margin reported near-certainty on exactly the inputs
that needed a tie-breaker — backwards, and it silently broke the calibration
gate. So `classifyShape` snapshots raw feature evidence before disambiguation:
the **decision** uses adjusted scores, **confidence** uses the raw margin, and a
shape chosen against the raw evidence is capped at 0.55.

Result: mean confidence 0.85 on clear cases vs. 0.60 on ambiguous ones.

### The confidence gate that was removed

The obvious next move is to act on low confidence: below some bar, fall back to
`linear`, on the theory that a spurious Tree-of-Thoughts costs 10–100× while a
single-pass plan is never catastrophic. That rule was implemented at a 0.62
threshold, then measured across all 120 labeled cases:

```
             fired   rescued a wrong call   destroyed a right call
holdout        0             0                       0
tuning         3             0                       3
dev            0             0                       0
```

It was strictly harmful, so it was deleted. The diagnosis: low confidence means
"two shapes both look plausible", **not** "the leading shape is wrong". On the
cases where it fired, the top pick was correct and the runner-up was merely
close — so overriding the top pick discarded a good answer.

The lesson generalizes: a safety mechanism that has never been observed to
prevent a failure is not neutral. It has its own failure mode, and here that was
the only mode it had. Confidence is still computed and shown in the UI, where a
human can act on it; it just no longer silently rewrites the routing.

### The three fixtures

| file | status | may I tune against it? |
|---|---|---|
| `test/fixtures/shapes.js` | 60 cases, incl. 10 adversarial | yes |
| `test/fixtures/shapes-dev.js` | 30 cases (a burned holdout) | yes |
| `test/fixtures/shapes-holdout.js` | 30 cases | **no — aggregate only** |

`shapes-dev.js` began as a holdout. Its misses were inspected individually to
diagnose v2, which burned it; it was demoted rather than deleted. If you ever
inspect `shapes-holdout.js` case-by-case to fix a miss, demote it the same way
and write a new one. A holdout you have optimized against is a slow training set.

---

## Procedure

```
1. Collect 20–50 real tasks with known-good outcomes.
2. Write a programmatic checker per task (or per task class).
3. Run all three arms, n≥3 samples each to see variance.
4. Compare tokens_per_successful_task and task_success.
5. Log for every run:
     context_hash, kb_version, engine_version,
     model id + version, sampling params, thinking budget,
     every tool call and result, full token accounting.
6. Report deltas with confidence intervals, not point estimates.
```

Step 5 is R19. Without `context_hash` you cannot distinguish a prompt regression
from a model update.

### Record shape

```json
{
  "run_id": "eval_2026_0142",
  "arm": "metaforge",
  "context_hash": "142e26d9a697e4",
  "compiler": { "kb_version": "1.1.0", "engine_version": "1.1.0" },
  "routing": { "shape": "verification", "tier": "heavy",
               "topology": "Generate → Verify loop", "reflection_depth": 3 },
  "model": { "id": "…", "version": "…", "thinking_tokens": 48000,
             "temperature": 0.2, "seed": 42 },
  "tokens": { "system": 1832, "user": 50, "thinking": 41200,
              "output": 940, "total": 44022 },
  "metrics": { "schema_validity": 1.0, "task_success": 0.84,
               "constraint_violation_rate": 0.02,
               "unsupported_claim_rate": 0.014,
               "tokens_per_successful_task": 52407 },
  "delta_vs_baseline": { "task_success": "+0.09", "ci95": "[0.02, 0.16]", "n": 40 }
}
```

---

## Routing audit — cheap and worth doing now

You can validate routing without any harness:

```js
import { compile } from "./src/engine/compile.js";

const rows = myRealTasks.map(t => {
  const { R, B } = compile({ ...baseSpec, task: t });
  return { task: t.slice(0,50), shape: R.shape, tier: R.tier,
           topo: R.topo, pct: B.pct };
});
console.table(rows);
```

Read the table. Every row you disagree with is a bug. File it with the task text,
add a failing assertion to `test/run.js`, then fix the router.

This catches the highest-severity failures — ToT on a linear task, Light tier on
something genuinely hard — for about fifteen minutes of effort.

---

## Ablations worth running

Once a harness exists, these answer whether each component earns its tokens:

| Ablation | Question |
|---|---|
| Remove `SELF_CHECK` | Does the reflection pass pay for its 1.4–2.2×? |
| Force reflection depth 1 vs 3 | Where is the actual knee for your tasks? |
| Force every tier to Extended | How much does routing actually save? |
| Remove `VERIFICATION_GATES` | Do explicit gates change verification honesty? |
| Remove `CONSTRAINT_REPRISE` | Does the tail restatement measurably help? |
| Remove domain MUST/NEVER | Is the injected expertise worth its tokens? |
| Swap topology to single-expert | Does the chosen topology beat the default? |

Each is one flag in a modified `compile()`. Results should feed back into the
router thresholds — that is how MetaForge stops being research-driven and becomes
evidence-driven.

---

## Release gate

Before tagging a release, on the sealed set:

- [ ] `schema_validity` = 1.00 (hard)
- [ ] `constraint_violation_rate` ≤ prior release (hard)
- [ ] `task_success` not regressed by >0.03 (hard)
- [ ] `tokens_per_successful_task` not regressed by >20% (soft — justify in CHANGELOG)
- [ ] No new `loop_detected` cases (hard)
