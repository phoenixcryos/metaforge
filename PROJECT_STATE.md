# Project State

> Living document. Updated at the end of every significant work block.
> Read this, [`AGENTS.md`](AGENTS.md), and [`docs/ROADMAP.md`](docs/ROADMAP.md) before changing anything.

**Last updated:** 2026-08-25 — v1.2.0 merged to `main` (PR #1, merge commit `c16c864`)
**Branch:** `arena/01a03709-metaforge` (release work landed here; merged to `main`)

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

1. **Enable GitHub Pages (maintainer-only, one-time), then re-run the deploy.** The
   `Deploy to GitHub Pages` workflow has failed on `configure-pages` on every push
   to `main` since 2026-08-12 — *pre-dating this release*. Cause: Pages for the repo
   is not enabled with source "GitHub Actions" ([`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
   one-time setup, step 2). Fix: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**, then re-run the failed workflow (`gh run rerun 32808368173`) or
   push any commit to `main`. The automation token cannot do this — the Pages API
   returns 403 for integration tokens here.
2. **Tag the release**: `git tag -a v1.2.0 -m "v1.2.0" c16c864` on the merge commit,
   then `git push origin v1.2.0` ([`docs/RELEASE.md`](docs/RELEASE.md) §6).
3. **Apply the CI patch**: `git apply docs/ci-additions.patch` (needs a token with
   the Actions `workflows` permission — the sandbox token is refused when editing
   `.github/workflows`), then commit and push.
4. **Manual browser pass** per [`docs/RELEASE.md`](docs/RELEASE.md) §3 — the only
   check automation can't do.

## Post-merge verification (2026-08-25)

- PR #1: **merged** · merge commit `c16c8640bf74982da322a4bb217b0b6050f1e0b3`.
- CI on `main` after merge: **success** (14 s).
- Deploy workflow: **failed at `actions/configure-pages`** — repo setting issue,
  not a code issue; see action 1 above. Same failure present on the previous
  commit to `main` 12 days earlier.

---

## Blockers

None known. CI gate (zero-dependency, three test phases, artifact self-containment) is the constraint on all future changes.

## Decisions made this session (short list)

- **Release number is 1.2.0, not 1.0.** The repository already shipped 1.0.0 and 1.1.0; [`docs/VERSIONING.md`](docs/VERSIONING.md) governs. The engine changed since 1.1.0 (shape classification rebuilt), so `ENGINE_VERSION` bumps MINOR; KB content did not change, so `KB_VERSION` stays 1.1.0.
- **Held-out shape-classifier numbers are quoted as-is** (46.7% top-1, 80–87% on routing binaries). Improving them is ROADMAP item 1 and does not block the release — the router's operational contract is the binaries, and those gate in CI.
- **No real-model eval claims.** The harness measures against user-supplied executors; no benchmark numbers are fabricated anywhere in docs or marketing material.
- **`test/ui.js` is static analysis, not a DOM shim.** It asserts that every element id referenced by `src/ui/app.js` exists in `src/ui/app.html` — catches dead-button regressions without violating zero-dependency.
