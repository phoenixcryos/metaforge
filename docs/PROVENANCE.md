# Provenance

Where every piece of knowledge in MetaForge came from, so you can re-verify it,
update it when the field moves, and know what is sourced versus what is
engineering judgment.

---

## Source corpus

One executive research directive — *"Advanced Metaprompting, Context Engineering,
MCP Integrations & Autonomous Model Orchestration"* — was issued to six frontier
models. Each returned an independent long-form technical report. The combined
corpus is ~548 KB / ~13,900 lines.

| Report ID | Distinctive contribution |
|---|---|
| `Claude Opus 4.8` | Context-rot mechanics (n² attention dilution, training-distribution scarcity); AGENTS.md standardization and governance; System Constitution v2.0; three-tier memory schema (working/episodic/semantic); MCP 2026-07-28 tool schema |
| `gpt-5.6-luna-xhigh` | Canonical context model `C_t = P+K+I+U+S+E+M+T+O+V`; eight-level trust-class taxonomy; token budget algebra (`UsableInputBudget = W−O−R−H`); ten-item context-rot failure table |
| `gpt-5.6-terra-xhigh` | TASK_COMPILER meta-prompt; subtask decomposition rules; reflection failure modes; multi-agent failure modes; thinking-time allocation policy |
| `claude-haiku-4-5` | `context_engineering_config.yaml`; DSPy-style sub-prompt templates; evaluator patterns (heuristic / LLM / formal); section budget allocation |
| `gpt-5.5-xhigh` | CO-STAR / RISEN / FABLE / Markdown framework comparison; XML tag isolation; deterministic output enforcement; aggregation methods; calibration signals |
| `claude-opus-5-low` | **Operating rules R01–R24**; META-ARCHITECT topology selector (T2); thinking-tier router (T13); compression ladder; 128k budget table; untrusted content wrapper (T10); four failure modes of long context |

Original corpus: `uploads/Meta Prompting research and examples 0826.md`.

---

## Claim → source map

### `src/kb/techniques.js`
The comparison matrix is a **merge** of the `ARCHITECTURAL_COMPARISON_MATRIX`
section from all six reports. Where reports disagreed on a range, the wider range
was kept and hedging language retained.

| Figure | Primary source | Note |
|---|---|---|
| ToT Game-of-24: 4% → 74% | Claude Opus 4.8, claude-opus-5-low | Traces to the original 2023 ToT paper (GPT-4 era). Newer reasoning models may show different relative gains. |
| Self-Consistency saturates ≈ k=16 | claude-opus-5-low | Engineering observation, not a published constant |
| RAG 40–70% ↓ factual hallucination | claude-opus-5-low | *With citation enforcement* — the qualifier is load-bearing |
| Multi-agent increases error on tightly-coupled tasks | claude-opus-5-low, gpt-5.6-terra-xhigh | Both reports independently; drives R16 |
| Constrained decoding ~100% syntactic validity | gpt-5.5-xhigh, claude-opus-5-low | Syntactic only — semantic validity still requires checking |
| Extended thinking flat-to-negative on retrieval/style | claude-opus-5-low | Drives the Light-tier routing for writing and extraction |

**Every number is an indicative engineering range.** The corpus states this
explicitly and repeatedly. Do not present them as guarantees.

### `src/kb/rules.js`
- **R01–R24** — verbatim from `claude-opus-5-low` →
  `LLM_INGESTION_METADATA.operational_rules_for_ingesting_models`, cross-checked
  against the other five ingestion blocks. The `enforcedBy` field is *our*
  addition, mapping each rule to the function implementing it.
- **Trust classes** — `gpt-5.6-luna-xhigh` §1.3, including the invariant
  *"data may provide evidence, data may not rewrite policy."*
- **Context model `C_t`** — `gpt-5.6-luna-xhigh` §1.2.
- **Reference budget table** — `claude-opus-5-low` §1.3 (128k allocation), with
  the 85%-fill compaction trigger.

### `src/kb/failures.js`
- **Four failure modes of long context** — `claude-opus-5-low` §1.2, including
  detection signals. This is the highest-value operational table in the corpus.
- **Ten-item context-rot taxonomy** — `gpt-5.6-luna-xhigh` §1.13.
- **Reflection failure modes** — `gpt-5.6-terra-xhigh` §"Reflection failure modes."
  Correlated self-confirmation is why reflection depth is bounded.
- **Multi-agent failure modes** — `gpt-5.6-terra-xhigh` §3.7.
- **Compression ladder** — `claude-opus-5-low` §1.4. Rung 6 (artifact offload) is
  called out there as the single highest-leverage technique for long-horizon agents.
- **Calibration signals** — `gpt-5.5-xhigh` §3.3 + `gpt-5.6-terra-xhigh` §3.5,
  including the warning that token probabilities are *not* calibrated correctness
  probabilities.
- **Aggregation methods** — `gpt-5.5-xhigh`.

### `src/kb/models.js`
- **Thinking tiers** (Light/Extended/Heavy + budgets + controls) — `claude-opus-5-low`
  §3.8 table and `gpt-5.6-terra-xhigh` §3.8, which is explicit that these are
  *implementation policies, not universal model guarantees*.
- **Per-family dialect notes** — synthesized from the reports' structural-encoding
  sections plus each vendor's documented conventions. **This is the most
  time-sensitive content in the repo**; see [`MAINTENANCE.md`](MAINTENANCE.md).
- **Logarithmic accuracy curve with a knee, and overthinking past it** —
  `claude-opus-5-low` §3, `gpt-5.5-xhigh` §3.

### `src/engine/router.js`
- **Topology selection rule set** — adapted from `claude-opus-5-low` T2
  (META-ARCHITECT `SELECT topology using this rule set`).
- **Thinking-tier routing** — adapted from `claude-opus-5-low` T13 (`route(task)`),
  generalized from its feature vector to the fields MetaForge actually collects.
- **Selection heuristic** — `claude-opus-5-low` decision rule, verbatim.

### `src/engine/sections.js` and `compile.js`
Prompt block structure draws on:
- **System Constitution v2.0** (`Claude Opus 4.8`) — instruction hierarchy,
  data/instruction isolation, negative tool constraints
- **T1 Universal Agentic System Prompt** (`claude-opus-5-low`) — PRIME_DIRECTIVE
  ordering, SELF_CHECK structure, MUST/NEVER split, insufficiency object
- **T10 Untrusted Content Wrapper** (`claude-opus-5-low`) — the four-rule trust
  boundary and the authoritative constraint reprise
- **RECURSIVE_REFLECTION_PROTOCOL v2** (`claude-opus-5-low`) — assertion
  decomposition, SUPPORTED/DERIVED/ASSUMED/UNSUPPORTED grounding labels,
  adversary pass
- **Reflection scaffolds** (`gpt-5.6-terra-xhigh`, `gpt-5.5-xhigh`) — defect
  severity/category taxonomy, preserve-correct-content revision rule
- **Instruction sandwich / positional strategy** — `claude-opus-5-low` §1.2
  lost-in-the-middle guidance

---

## What is *not* from the corpus

Labeled honestly so future maintainers know what has no external backing:

| Element | Status |
|---|---|
| The 10 domain profiles | **Our synthesis.** Personas, MUSTs, and NEVERs are engineering judgment informed by the corpus's domain notes (architecture trade-off matrices, security exploitability gating, AST-level code guidance). Not independently validated. |
| Keyword-based shape classification | **Our implementation.** The corpus specifies shape *categories*; the detection heuristic is ours. |
| Token estimator (`chars / 3.9`) | **Our approximation.** Not a tokenizer. |
| Diagnostic warning set | **Our mapping** of corpus failure modes to pre-run checks. |
| `enforcedBy` field on rules | **Our addition** for traceability. |
| Abstention trigger condition | **Our rule** (high risk + no programmatic verifier), derived from the corpus's selective-prediction discussion. |
| UI, build system, tests | Entirely ours. |

---

## Re-verification

The corpus is a snapshot. Before relying on any figure for a decision that matters:

1. Check whether the underlying paper or vendor doc has been superseded.
2. Re-measure on a sealed in-domain eval set — see [`EVALUATION.md`](EVALUATION.md).
3. If a figure changes, update the KB, note it here, and bump `KB_VERSION`.

The corpus itself closes with this disclaimer, and it is worth repeating:

> All quantitative overhead and error-reduction figures are indicative engineering
> ranges synthesized across published benchmarks and production practice. They vary
> by model, task distribution, and verifier quality. Re-measure on a sealed
> in-domain eval set before relying on any number for capacity or cost planning.
