# ◆ MetaForge

**A meta-prompt compiler.** Describe a job in four fields; get back a production-grade
system prompt with a routed reasoning budget, an appropriate reasoning topology,
anti-hallucination rails, trust boundaries, executable verification gates, and a
strict output contract.

Not a template filler. A **router** — it makes structural decisions about *how* the
model should approach the work, because that is where most of the quality difference lives.

```
Task spec  →  classify shape  →  route thinking budget  →  select topology
           →  assemble by position  →  install rails  →  bound reflection
           →  adapt to target model  →  stamp provenance
```

**Live:** `https://<user>.github.io/metaforge/` · **Single file:** `dist/index.html`
(110 KB, zero dependencies, runs offline from `file://`)

---

## Why this exists

Six frontier models were each given the same executive research directive on
meta-prompting, context engineering, MCP, and model orchestration. Their reports
converged on a set of findings that are individually well known and collectively
almost never applied:

| Finding | Consequence people miss |
|---|---|
| Tree-of-Thoughts: 4% → 74% on search-shaped tasks | …and pure 10–100× waste on linear ones |
| Multi-agent: +20–40% on breadth-first research | …and it **increases** error on tightly-coupled work |
| Extended thinking: strong ↑ on competition math | …and flat-to-negative on retrieval and style tasks |
| Self-critique: 15–40% ↓ when grounded | …and ~0–10% with drift risk when ungrounded |
| Effective context ≈ 50% of the advertised window | Bigger windows do not fix context rot |

Every one of those is a *conditional*. A static prompt template cannot express a
conditional, so MetaForge computes them. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Quick start

```bash
git clone https://github.com/<user>/metaforge.git
cd metaforge
npm run build     # writes dist/index.html — no npm install needed
npm run dev       # build + serve on :8080
npm run test:all  # 254 assertions, no test framework
```

There are **no runtime dependencies and no build dependencies.** `build.js` is
~200 lines of string concatenation. Node 18+ only for the tooling; the artifact
itself is plain HTML/CSS/JS.

### Use as a library

```js
import { compile } from "./src/engine/compile.js";

const { sys, usr, adp, R, B, W, provenance } = compile({
  task: "Refactor the billing module to get p99 under 400ms.",
  deliverable: "A patch plus a benchmark",
  domain: "code", model: "claude", consumer: "code", risk: "medium",
  constraints: "No schema migration.\nPython 3.11.",
  audience: "Senior backend engineers",
  tools: true, toolList: "read_file, run_tests"
});

R.topo   // "Generate → Verify loop"
R.tier   // "extended"
provenance.context_hash  // "142e26d9a697e4"  ← log this with eval runs (R19)
```

Full input/output contract: [`docs/API.md`](docs/API.md).

---

## What ships in each prompt

| Block | Purpose |
|---|---|
| `IDENTITY` / `PRIME_DIRECTIVE` | Persona + explicit priority order (correctness > speed > completeness > eloquence) |
| `SUCCESS_CRITERIA` | Binary, checkable boxes derived from your deliverable and constraints |
| `METHOD` | Steps specific to the chosen topology — ToT branches, GoT extract/aggregate/refine, Plan-and-Execute, etc. |
| `REASONING_POLICY` | Tier-appropriate guidance, including an explicit overthinking warning |
| `CONSTRAINTS` | Domain MUSTs + your constraints + NEVERs targeting that domain's real failure mode |
| `TOOL_POLICY` | Allowed set, pre-call declaration, schema validation, budget (only when tools are on) |
| `TRUST_BOUNDARY` | Injection-resistant framing for untrusted content (only when present) |
| `VERIFICATION_GATES` | Executable checks; "passed" requires actual execution |
| `CALIBRATION_AND_ABSTENTION` | Selective prediction when a wrong answer costs more than no answer |
| `SELF_CHECK` | Constraint matrix, groundedness labeling, adversarial pass, contract check |
| `FAILURE_MODE` | A structured insufficiency object — a legal way to say "not enough info" |
| `OUTPUT_CONTRACT` | JSON Schema / code layout / doc structure / prose rules |
| `CONSTRAINT_REPRISE` | Authoritative restatement at the tail, where recall is highest |

---

## Repository layout

```
metaforge/
├── src/
│   ├── kb/                 knowledge base — the research, as data
│   │   ├── techniques.js     23-technique comparison matrix + selection heuristic
│   │   ├── models.js         model dialects, call params, thinking tiers
│   │   ├── rules.js          R01–R24, trust classes, context model, budget table
│   │   ├── domains.js        10 domain profiles (persona, MUSTs, NEVERs, verifier)
│   │   ├── failures.js       failure taxonomies, compression ladder, calibration
│   │   ├── presets.js        starter specs (also used as smoke tests)
│   │   └── index.js          barrel + KB_VERSION / ENGINE_VERSION
│   ├── engine/
│   │   ├── router.js         ★ classification + routing — read this first
│   │   ├── sections.js       prompt section builders (wording lives here)
│   │   └── compile.js        assembly, budget, diagnostics, provenance
│   └── ui/                 styles.css · app.html · app.js
├── test/
│   ├── run.js              226 invariant assertions over 1,440 compiled specs
│   └── bundle.js           28 assertions against the built artifact
├── docs/                   see index below
├── build.js                ES modules → single-file HTML
└── dist/index.html         the deliverable
```

## Documentation

| Doc | Read it when |
|---|---|
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | You want to understand or change the routing logic |
| [`API.md`](docs/API.md) | You're embedding `compile()` in something else |
| [`PROVENANCE.md`](docs/PROVENANCE.md) | You want to know which model report each idea came from |
| [`MAINTENANCE.md`](docs/MAINTENANCE.md) | The meta shifted and you need to update the KB |
| [`VERSIONING.md`](docs/VERSIONING.md) | You're cutting a release |
| [`EVALUATION.md`](docs/EVALUATION.md) | You want to prove a change actually helped |
| [`CONTRIBUTING.md`](docs/CONTRIBUTING.md) | You're adding a domain, model, or technique |
| [`ROADMAP.md`](docs/ROADMAP.md) | You're deciding what to build next |
| [`AGENTS.md`](AGENTS.md) | **An AI agent is working on this repo** |
| [`adr/`](docs/adr/) | You're wondering why something is the way it is |

---

## Deploying

Any static host. The artifact is one file.

```bash
npm run build
# GitHub Pages: push to main, the workflow in .github/workflows/deploy.yml does the rest
# Netlify / Vercel / S3 / Cloudflare Pages: point at dist/
# Offline: open dist/index.html directly
```

[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) covers all of these plus custom domains.

---

## Design commitments

These are deliberate and should survive refactors:

1. **Single-file artifact.** No CDN, no fonts, no analytics. Works offline and in
   sandboxed iframes. ([ADR-0001](docs/adr/0001-single-file-artifact.md))
2. **Router, not template.** Structural choices are conditional on task shape.
   ([ADR-0002](docs/adr/0002-router-over-templates.md))
3. **Knowledge as data.** Research lives in `src/kb/*.js` as plain objects so it
   can be updated without touching logic. ([ADR-0003](docs/adr/0003-kb-as-data.md))
4. **Invariant testing.** Tests assert properties, not exact strings, so wording
   can be tuned without breaking CI. ([ADR-0004](docs/adr/0004-invariant-testing.md))
5. **Provenance on every output.** KB version, engine version, and a context hash,
   because irreproducible contexts are the #1 cause of "the prompt regressed" (R19).

---

## Honest limitations

- **The quantitative figures are indicative ranges, not guarantees.** They come
  from published benchmarks and production reports across different models and
  task distributions. Re-measure on your own sealed eval set before using any
  number for capacity or cost planning.
- **Shape classification is keyword-based.** It is a fast heuristic that is right
  most of the time, not a semantic classifier. Override by rewording the task or
  changing the domain. Improving this is [ROADMAP](docs/ROADMAP.md) item 1.
- **Token counts are estimates** (`chars / 3.9`), not tokenizer output. Good enough
  for budget pressure warnings; do not bill against them.
- **No eval harness yet.** MetaForge tells you what *should* work based on the
  research. It does not yet measure whether it did on your tasks. See
  [`docs/EVALUATION.md`](docs/EVALUATION.md) for the intended methodology and
  [ROADMAP](docs/ROADMAP.md) item 2 for the plan.
- **Model dialects drift.** `src/kb/models.js` is the fastest-rotting file here.
  See [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) for the review cadence.

---

## License

MIT. See [LICENSE](LICENSE).

Built from six frontier-model research reports; see [`docs/PROVENANCE.md`](docs/PROVENANCE.md)
for full attribution.
