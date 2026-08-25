# AGENTS.md

Instructions for AI coding agents working on MetaForge. Follows the
[AGENTS.md](https://agents.md) open specification. **Read this before making changes.**

Human contributors: see [`README.md`](README.md) and [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

---

## What this project is

MetaForge is a **meta-prompt compiler**. It takes a short task spec and emits a
production-grade LLM system prompt. The distinguishing property is that it is a
*router*, not a template engine: it makes conditional structural decisions
(reasoning topology, thinking budget, reflection depth) based on the task, because
applying those uniformly is worse than not applying them at all.

The knowledge encoded here was synthesized from six frontier-model research
reports on meta-prompting and context engineering. See [`docs/PROVENANCE.md`](docs/PROVENANCE.md).

---

## Setup

```bash
npm run build      # writes dist/index.html — no npm install required
npm run test:all   # unit invariants + bundle smoke test
npm run dev        # build + serve dist/ on :8080
```

There are **zero dependencies**. Do not add any. Do not introduce a bundler, a
framework, a CSS library, or a test runner. If you believe one is necessary, open
an issue explaining why the constraint should be relaxed — do not just add it.
Rationale: [ADR-0001](docs/adr/0001-single-file-artifact.md).

---

## Validation contract

Every change must pass:

```bash
npm run test:all
```

That runs:
- `test/run.js` — 226 invariant assertions across 1,440 compiled specs
- `test/shapes.js` — shape-classifier accuracy, gated on a sealed holdout (never
  quote the 100% tuning number; see the file header for why)
- `test/ui.js` — 60 static DOM-wiring invariants (every `$("id")` resolves, tab
  sets agree, spec fields have controls)
- `build.js` — the ES-module → single-file transform
- `test/bundle.js` — 28 assertions executing the *built artifact*

**Never claim a gate passed unless you ran it and observed exit code 0.**
If you changed anything under `src/ui/`, `test/ui.js` covers static wiring, but
also load `dist/index.html` in a browser and confirm the console is clean —
static analysis cannot see behavior.

---

## Architecture rules

Respect these boundaries; the test suite's meaningfulness depends on them.

| Path | Contains | Must not |
|---|---|---|
| `src/kb/**` | Data only — plain objects | Contain logic or import from `engine/` |
| `src/engine/router.js` | Routing decisions | Emit any prose |
| `src/engine/sections.js` | Prompt wording | Make any decisions |
| `src/engine/compile.js` | Assembly, budget, diagnostics, provenance | — |
| `src/ui/**` | DOM wiring | Contain engine logic |

**Changing a decision → `router.js`. Changing wording → `sections.js`.**

Build constraints (enforced by `test/bundle.js`):
- No duplicate top-level identifiers across modules
- No default exports
- No dynamic `import()`
- New modules must be added to `MODULES` in `build.js`, in dependency order

---

## Testing philosophy

Assert **invariants**, not exact strings. This tool's output is prose; string
equality tests would make every wording tweak a CI failure.

Good: `ok(o.sys.includes("# FAILURE_MODE"), "insufficiency escape hatch present")`
Bad: `assert.equal(o.sys, "…entire expected prompt…")`

When you add a feature, add an assertion that the feature's *effect* is present
under the conditions that should trigger it, and absent otherwise. See the
abstention block tests in `test/run.js` for the pattern.
Rationale: [ADR-0004](docs/adr/0004-invariant-testing.md).

---

## Versioning

Three stamps live in `src/kb/index.js` and are embedded in every compiled artifact:

| Constant | Bump when |
|---|---|
| `KB_VERSION` | Knowledge content changes — new technique, revised figure, new model dialect, changed rule text |
| `ENGINE_VERSION` | Routing logic or prompt structure changes, i.e. the same input now produces different output |
| `SPEC_VERSION` | The input spec object's shape changes (breaking for embedders) |

Keep `package.json` version in sync with the higher of KB/ENGINE.
Full policy: [`docs/VERSIONING.md`](docs/VERSIONING.md).

---

## Common tasks

### Add a domain
1. Add an entry to `src/kb/domains.js` with all keys in `REQUIRED_DOMAIN_KEYS`.
2. `never[]` entries **must** start with `NEVER` (asserted).
3. Target that domain's *actual* failure mode, not generic caution.
4. Bump `KB_VERSION`. Run `npm run test:all`.

### Add a model family
1. Add to `src/kb/models.js`: `label`, `vendor`, `window`, `isolation`,
   `thinking`, ≥3 `tips`, and a `param` template that is valid JSON after
   `BUDGET`/`EFFORT` substitution (asserted).
2. If it needs consumer-conditional params, extend `buildAdapter()` in `compile.js`.
3. Bump `KB_VERSION`.

### Change routing behavior
1. Edit only the relevant block in `router.js`.
2. Add or update the corresponding assertion in the "Router decision rule" group.
3. Bump `ENGINE_VERSION` — output changed.
4. Note the change in `CHANGELOG.md` under Changed.

### Update research figures
1. Edit `src/kb/techniques.js` or the relevant KB file.
2. Update the source note in `docs/PROVENANCE.md`.
3. Bump `KB_VERSION`.

---

## Hard boundaries

- **NEVER add a runtime or build dependency.** Zero-dependency is a design commitment.
- **NEVER reference an external URL** for scripts, styles, fonts, or images in
  `src/ui/**`. The artifact must work offline and inside sandboxed iframes.
- **NEVER edit `dist/index.html` directly.** It is generated. Edit `src/` and rebuild.
- **NEVER present indicative figures as guarantees.** The research numbers are
  engineering ranges; keep the hedging language intact wherever they appear.
- **NEVER invent a research finding.** If you add a claim to the KB, it must trace
  to a source recorded in `docs/PROVENANCE.md`. If it is your own engineering
  judgment, label it as such.
- **NEVER remove the provenance stamp** from compiled output (R19).

---

## Style

- 2-space indent, semicolons, double quotes in JS.
- Comments explain **why**, not what. The code says what.
- Every KB file opens with a provenance comment naming its source report.
- Prose in prompts and docs: direct, concrete, no filler. The tool's own output
  standard applies to the tool's own source.

---

## Where to look first

| Question | File |
|---|---|
| How does it decide? | `src/engine/router.js` |
| What does it emit? | `src/engine/sections.js` |
| Where did this claim come from? | `docs/PROVENANCE.md` |
| Why is it built this way? | `docs/adr/` |
| What should I build next? | `docs/ROADMAP.md` |
| How do I know it improved? | `docs/EVALUATION.md` |

---

## Handoff log

Append a dated entry at the end of every significant work block, newest first.

### Handoff — 2026-08-25 — Arena Agent Mode (v1.2.0 release session)

- **What I completed**
  - Discovery report; created `PROJECT_STATE.md` with status, decisions, next actions.
  - Fixed `docs/SIMPLE_MODE.md` (was pasted with ~1,260 literal backslash escapes; rendered broken on GitHub).
  - Added `test/ui.js` — 60 static DOM-wiring invariants; wired into `test:all` and CI (314 assertions total, all green), plus an offline eval-harness smoke step in CI.
  - Wrote `docs/PRODUCT.md` (one-pager), `docs/DEMO.md` (walkthrough), `docs/RELEASE.md` (release checklist); accuracy pass on README/AGENTS/CONTRIBUTING/ROADMAP/MAINTENANCE.
  - Cut release v1.2.0: `ENGINE_VERSION` → 1.2.0, `KB_VERSION` stays 1.1.0, `SPEC_VERSION` 1, package 1.2.0; CHANGELOG section written with reasoning.
- **What is still open**
  - Tag `v1.2.0` on `main` after the PR merges; confirm Pages deploy.
  - Manual browser pass per `docs/RELEASE.md` §3 (automation cannot see DOM behavior).
  - ROADMAP item 2 P2: real-model eval runs need a user-supplied script executor and 20–50 real tasks.
  - Shape classifier holdout top-1 is 46.7% by design acceptance — quote the binaries (80–87%), never the tuning-set 100%.
- **Exact next recommended action** — merge PR `arena/01a03709-metaforge` → `main`, tag `v1.2.0` on the merge commit, verify the deploy workflow.
- **Landmines / non-obvious context**
  - Never quote the 100% tuning-set shape number anywhere. `test/shapes.js` header explains why; `docs/EVALUATION.md` is the case study.
  - The confidence gate was built, measured as strictly harmful, and removed. Do not re-add it without new evidence (see `docs/EVALUATION.md`).
  - `dist/` is generated; `build.js` namespace shims are load-bearing (ADR-0005). Bundle byte-parity is asserted by `test/bundle.js`.
  - Do not add dependencies of any kind; CI hard-fails on it (ADR-0001).
- **Commands the next agent should run first**
  - `npm run test:all` (expect 314 assertions green) and `npm run eval:smoke`.
  - `git log --oneline -6` and read `PROJECT_STATE.md` for the next-3 list.
