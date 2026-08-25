# Project State

> Living document. Updated at the end of every significant work block.
> Read this, [`AGENTS.md`](AGENTS.md), and [`docs/ROADMAP.md`](docs/ROADMAP.md) before changing anything.

**Last updated:** 2026-08-25 — v1.2.0 release session
**Branch:** `arena/01a03709-metaforge` (release work lands here, merges to `main`)

---

## Current status

| Area | State |
|---|---|
| Core engine (`router`, `shape`, `sections`, `compile`) | **Stable.** No known defects. |
| Knowledge base | **Current as of 2026-08.** `models.js` is the fastest-rotting file; monthly cadence in [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md). |
| Tests | 226 invariant + shape-holdout gates + 28 bundle assertions. **All green.** |
| Build | `dist/index.html` ≈149 KB, single file, zero deps, verified by `test/bundle.js`. |
| Eval harness | **P0 + P1 shipped** (`bin/eval.js`, routing-only, checkers, echo executor). P2 (real-model runs) is the user's side. |
| UI | Forge + Simple Mode + reference tabs. DOM wiring verified manually; static wiring test (`test/ui.js`) added this session. |

**Version line:** 1.0.0 → 1.1.0 → **1.2.0 (this session)**.
`KB_VERSION` 1.1.0 · `ENGINE_VERSION` 1.2.0 · `SPEC_VERSION` 1 · package 1.2.0.

---

## Next 3 actions

1. **Merge the PR, apply the CI patch, and tag**: `git apply docs/ci-additions.patch` (needs a token with the Actions `workflows` permission — the sandbox token refused to push workflow edits), then `git tag -a v1.2.0 -m "v1.2.0"` on the merge commit, and confirm the Pages deploy workflow is green. Full checklist: [`docs/RELEASE.md`](docs/RELEASE.md).
2. **Manual browser pass** on `dist/index.html` (presets, Simple Mode incl. review strip, tabs, copy/download, clean console) — `test/ui.js` covers static wiring but not behavior; checklist in [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md).
3. **Run the eval harness P2 step when real tasks exist**: write a script executor against your model API and collect 20–50 real tasks with programmatic checkers (ROADMAP item 2), so routing thresholds stop being research-derived only. In parallel, schedule the next `models.js` dialect review (due ~2026-09 per MAINTENANCE cadence).

---

## Blockers

None known. CI gate (zero-dependency, three test phases, artifact self-containment) is the constraint on all future changes.

## Decisions made this session (short list)

- **Release number is 1.2.0, not 1.0.** The repository already shipped 1.0.0 and 1.1.0; [`docs/VERSIONING.md`](docs/VERSIONING.md) governs. The engine changed since 1.1.0 (shape classification rebuilt), so `ENGINE_VERSION` bumps MINOR; KB content did not change, so `KB_VERSION` stays 1.1.0.
- **Held-out shape-classifier numbers are quoted as-is** (46.7% top-1, 80–87% on routing binaries). Improving them is ROADMAP item 1 and does not block the release — the router's operational contract is the binaries, and those gate in CI.
- **No real-model eval claims.** The harness measures against user-supplied executors; no benchmark numbers are fabricated anywhere in docs or marketing material.
- **`test/ui.js` is static analysis, not a DOM shim.** It asserts that every element id referenced by `src/ui/app.js` exists in `src/ui/app.html` — catches dead-button regressions without violating zero-dependency.
