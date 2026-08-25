# MetaForge — Product One-Pager

*One page, written to stand alone. For depth: [ARCHITECTURE](ARCHITECTURE.md) ·
[EVALUATION](EVALUATION.md) · [DEMO](DEMO.md).*

---

## The problem

Everyone writes prompts; almost nobody **routes** them. The research is old and
unambiguous: Tree-of-Thoughts is transformative on search-shaped tasks and a
10–100× waste on linear ones. Multi-agent fan-out helps breadth-first research
and *increases* error on tightly-coupled work. Heavy reasoning helps competition
math and is flat-to-negative on retrieval and style. Self-critique helps when
it's grounded in a real verifier and drifts when it isn't.

Every one of those is a **conditional**. A prompt template — the thing everyone
actually uses — cannot express a conditional. So teams either apply heavyweight
scaffolding everywhere (wasteful, sometimes harmful) or nowhere (quality left on
the table).

## The product

**MetaForge is a meta-prompt compiler.** You describe the job in four fields —
task, deliverable, audience, constraints — and it emits a production-grade system
prompt whose *structure* was computed from your task's shape:

```
Task spec → classify shape → route thinking budget → select topology
          → assemble by position → install rails → bound reflection
          → adapt to target model → stamp provenance
```

The output carries the things hand-written prompts usually lack: executable
verification gates, anti-hallucination rails, a trust boundary for untrusted
input, a calibration/abstention policy when a wrong answer costs more than no
answer, a strict output contract — and a provenance stamp (KB version, engine
version, context hash) so a prompt in the wild stays reproducible.

**Form factor:** one 149 KB HTML file. Zero dependencies, zero network calls,
works offline from `file://`, embeddable in a sandboxed iframe. Nothing you type
leaves the browser. Use it as a web app or import `compile()` as a library.

## How it works (60 seconds)

1. **Classify.** A scored classifier reads your task's shape (linear / search /
   aggregation / verification / exploration). Where your domain choice implies
   the shape, that wins outright — user assertions beat inference.
2. **Route.** The shape, risk, verifier availability, and domain pick a reasoning
   topology (ToT, GoT, Plan-and-Execute, generate→verify, self-consistency, or
   deliberately *single expert*) and a thinking tier (light / extended / heavy).
   The router's first skill is knowing when **not** to spend.
3. **Assemble.** Sections are positioned by primacy/recency — identity and
   success criteria at the head, the authoritative constraint reprise at the
   tail where recall is highest.
4. **Constrain.** Domain-specific MUSTs and NEVERs, a trust boundary for
   third-party content, executable gates, and a bounded self-check depth —
   because ungrounded self-critique past depth 2 flips right answers to wrong.
5. **Adapt.** Dialect notes and call parameters for six model families.
6. **Stamp.** Every output carries a context hash. Log it with your eval runs.

## Who it's for

| User | What they get |
|---|---|
| **Engineers shipping LLM features** | A system prompt that survives production: output contracts, verification gates, tool policy, injection rails. |
| **Agent builders** | Plan-and-Execute topology with step budgets, typed tool policy, and the lethal-trifecta warning when untrusted input meets tools that can egress. |
| **Teams standardizing prompt practice** | The research as data (`src/kb/`), the decisions as code (`router.js`), and provenance on every output — reviewable infrastructure, not lore. |
| **Non-engineers** | Simple Mode: four plain-English questions that fill the same spec the advanced form uses. `Esc` anytime; nothing is inferred invisibly. |

## Honest positioning

**What it is:** a router over published prompt-engineering research, with the
research kept as inspectable data and every claim traced to a source report.

**What it is not:**

- **Not a model, and not a hosted service.** No API keys, no accounts, no
  telemetry. It compiles a prompt; you run it in your own stack.
- **Not measured on your tasks yet.** The routing decisions are research-derived;
  the bundled eval harness (`npm run eval`) exists so you can measure them on
  *your* task distribution, against your current prompt and a naive baseline.
- **Not a semantic parser.** Free-text shape classification runs 47% top-1 on
  unseen phrasings and 80–87% on the binaries that actually change routing —
  published honestly, hedged in the UI, never silent. Choosing a domain pins the
  shape with certainty; Simple Mode sidesteps the classifier entirely.
- **Not a guarantee.** Every number in the knowledge base is an indicative
  engineering range, labeled as such wherever it appears.

## Comparison points

| | Prompt library / template | Hand-written expert prompt | **MetaForge** |
|---|---|---|---|
| Adapts structure to task shape | ✗ | ✓ (if the expert remembers) | **✓ computed** |
| Verification gates in output | ✗ | sometimes | **✓ executable, domain-specific** |
| Injection/trust boundary | ✗ | sometimes | **✓ when untrusted input present** |
| Cost control (tier routing) | ✗ | intuition | **✓ explicit budget + overthinking rails** |
| Reproducibility | ✗ | ✗ | **✓ provenance + context hash** |
| Works offline / self-auditable | ✓ | ✓ | **✓ single file, zero deps** |
| Quality on *your* tasks | unknown | unknown | **measurable — harness included** |

## Status (2026-08)

- v1.2.0 · 314 invariant assertions, all green · CI + one-file static deploy.
- Roadmap: semantic shape classification, real-task eval corpus, prompt linting,
  agent handoff artifacts. See [ROADMAP](ROADMAP.md).

*License: MIT. Attribution for the research corpus: [PROVENANCE](PROVENANCE.md).*
