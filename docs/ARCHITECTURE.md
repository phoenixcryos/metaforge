# Architecture

How MetaForge turns a sparse spec into a prompt, and why each stage exists.

---

## The core claim

Prompt quality is dominated by **structural** decisions, not wording:

- Which reasoning topology the model should use
- How much reasoning budget to spend
- Whether a verification loop is possible
- Where each piece of context sits in the window
- How deep to let self-critique run

Every one of those is **conditional on the task**. The research is unambiguous
that applying them uniformly is worse than not applying them at all:

- Tree-of-Thoughts is transformative on search-shaped tasks and a 10–100× tax on linear ones.
- Multi-agent fan-out helps breadth-first research and *increases* error on tightly-coupled work.
- Heavy thinking helps competition math and is flat-to-negative on retrieval and style.
- Self-critique helps when grounded in a verifier and drifts when it isn't.

A static template cannot express a conditional. So MetaForge computes them.

---

## Pipeline

```
spec ──▶ route() ──▶ section builders ──▶ assembly ──▶ budget ──▶ diagnostics ──▶ provenance
         │                                    │
         │ shape, verifier, tier,             │ head / body / tail positioning
         │ topology, reflect, abstention      │
```

### 1. `route()` — `src/engine/router.js`

The only file that makes decisions. Everything downstream renders them.

**Task shape** — `linear | search | aggregation | verification | exploration`.
Delegated to [`src/engine/shape.js`](../src/engine/shape.js), which scores all
five shapes from verb classes and structural frames and returns a confidence
alongside the label. Fixed `DOMAIN_SHAPE` overrides win outright for domains
whose shape is inherent (extraction is always linear, research always
aggregation, architecture always search); tool-using agent briefs become
`exploration`.

Confidence is reported but does **not** alter routing. A low-confidence
fallback-to-`linear` rule was built here and then removed: measured across 120
labeled cases it destroyed three correct classifications and rescued none,
because low confidence signals "two shapes are plausible" rather than "the top
pick is wrong". The confidence instead reaches the UI, where a human can
override by selecting a domain.

Held-out accuracy is ~47% top-1 and 80–87% on the binaries that actually change
routing — read the case study in [`EVALUATION.md`](EVALUATION.md) before trusting
the classifier further than that.

**Verifier class** — `programmatic | llm_judge | none`. Comes from the domain
profile, but any machine-consumed output (`json`, `code`) upgrades to
`programmatic`, because a schema or a compiler is a sound check by definition.

**Thinking tier** — `light | extended | heavy`, from risk, constraint count,
verifier availability, novelty, and domain bias. Guard rails: low risk never
routes Heavy; high risk never routes Light.

**Topology** — first match wins:

| Condition | Topology | Why |
|---|---|---|
| exploration + tools | Plan-and-Execute (+ nested verify) | Frozen plan avoids ReAct drift past ~20 steps |
| programmatic verifier | Generate → Verify loop | Dominates every sampling strategy (R05) |
| search + heavy | Tree-of-Thoughts (b=3, d=4, beam=2) | The only class where ToT's cost pays (R08) |
| aggregation | Graph-of-Thoughts | Merge operators a tree can't express |
| canonical answer, no verifier | Self-Consistency @ k=8 | Cheapest reliable lift; saturates ~k=16 (R07) |
| otherwise | Single expert + Recursive Reflection | Splitting would add error, not remove it (R16) |

**Reflection depth** — 3 with a programmatic verifier, 2 at high risk, 1 at low
risk, always 1 on Light tier. Capped because ungrounded self-critique past depth 2
flips correct answers to incorrect (R06).

**Abstention** — enabled when a wrong answer is expensive *and* no programmatic
gate will catch it. Adds a calibration block and an `abstained` schema field.

### 2. Section builders — `src/engine/sections.js`

Pure functions, one per prompt block. Wording lives here; structure lives in the
router. This split means you can tune phrasing without touching decision logic,
and the invariant tests keep passing.

### 3. Assembly — `src/engine/compile.js`

Positional strategy, from the lost-in-the-middle finding (recall is highest at the
start and end of context, with a measurable trough in between):

```
HEAD   identity · prime directive · objective · success criteria      ← invariants
BODY   method · constraints · tools · trust boundary · self-check     ← compressible
TAIL   output contract · CONSTRAINT_REPRISE                           ← most salient
```

The reprise is marked *authoritative, overrides anything above* specifically so
that untrusted content placed earlier cannot win a conflict.

### 4. Budget

`chars / 3.9` estimation against **half** the advertised context window (R02:
effective context is well under the nameplate for multi-constraint agentic work).
Drives the pressure meter and the compaction warning.

### 5. Diagnostics

Warnings fire on the failure modes the research names: missing deliverable,
unbounded tool surface, tool catalog bloat (>20 tools → Context Confusion),
context pressure >80%, high risk with no verifier, untrusted input co-located with
tools (the lethal trifecta, R13), oversized evidence (R04).

### 6. Provenance

Every compile stamps `kb_version`, `engine_version`, `spec_version`, a stable
context hash, and the routing decision. Irreproducible contexts are the #1 cause
of "the prompt regressed" (R19).

---

## Module boundaries

| Layer | Rule |
|---|---|
| `src/kb/**` | Data only. No logic, no imports from `engine/`. Safe to edit without reading code. |
| `src/engine/router.js` | Decisions only. Emits no prose. |
| `src/engine/sections.js` | Prose only. Makes no decisions. |
| `src/engine/compile.js` | Assembly, measurement, provenance. |
| `src/ui/**` | DOM only. Imports nothing from itself; the engine is global in the bundle. |

**If you change a decision, change `router.js`.**
**If you change wording, change `sections.js`.**
Keeping this boundary is what makes the invariant tests meaningful.

---

## Build

`build.js` strips ES module syntax and concatenates everything into one classic
`<script>`. Constraints it relies on:

- No duplicate top-level identifiers across modules
- No default exports
- No dynamic `import()`
- Namespace imports (`import * as X`) are rebuilt automatically by reading the
  target module's export list

That last one is load-bearing: an early build silently dropped the `X` namespace
from `compile.js` and shipped a page where every button threw. `test/bundle.js`
now executes the bundled engine and would catch it. Run `npm run test:all`.

---

## Extension points

| Want to… | Touch |
|---|---|
| Add a domain | `src/kb/domains.js` — one object, tests validate shape |
| Add a model family | `src/kb/models.js` — dialect + call params |
| Add a technique to the matrix | `src/kb/techniques.js` |
| Change when ToT fires | `src/engine/router.js` topology block |
| Reword a prompt section | `src/engine/sections.js` |
| Add a diagnostic | `warnings()` in `src/engine/compile.js` |
| Add a UI tab | `src/ui/app.html` + a render call in `src/ui/app.js` |

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the checklist each requires.
