# Release Checklist

Run against every release cut. Version policy: [`VERSIONING.md`](VERSIONING.md).
Current release train: **v1.2.0** (2026-08-25).

---

## 1. Definition of Done for a release

A stranger can:

- [ ] Clone the repository
- [ ] Run `npm run build` and `npm run test:all` successfully (no `npm install`)
- [ ] Open `dist/index.html` offline from `file://` and use the tool end-to-end
- [ ] Deploy the single file to any static host by following
      [`DEPLOYMENT.md`](DEPLOYMENT.md) alone
- [ ] Understand the product from the README and the one-pager
      ([`PRODUCT.md`](PRODUCT.md))

## 2. Gates (automated)

- [ ] `npm run test:all` exit 0 — unit invariants (226) + shape holdout gates +
      UI wiring (60) + build + bundle (28)
- [ ] `npm run eval:smoke` exit 0 — eval harness not rotten
- [ ] CI green on the release branch, including the zero-dependency and
      artifact self-containment checks

## 3. Manual checks (the ones CI cannot do)

From [`MAINTENANCE.md`](MAINTENANCE.md) health checks:

- [ ] Load `dist/index.html`; browser console clean
- [ ] Every preset compiles; routing decisions read sensibly
- [ ] Reference tabs render (Techniques, Failure Modes, Operating Rules,
      How it works)
- [ ] Simple Mode: entry link → 4 questions → review strip → generates; `Esc`
      back to advanced form
- [ ] Risk toggle visibly changes the routing panel and the prompt
- [ ] Copy + both download buttons work
- [ ] Page behaves at 1280px and 480px widths

## 4. Documentation currency

- [ ] README claims still true (artifact size, test counts, feature list)
- [ ] [`API.md`](API.md) matches the actual `compile()` input/output contract
- [ ] [`ARCHITECTURE.md`](ARCHITECTURE.md) still describes the pipeline
- [ ] [`ROADMAP.md`](ROADMAP.md) status snapshot updated
- [ ] [`PROJECT_STATE.md`](../PROJECT_STATE.md) reflects reality; "Next 3
      actions" current
- [ ] [`AGENTS.md`](../AGENTS.md) has a handoff note for this release

## 5. Compliance

- [ ] `LICENSE` present, MIT, current year
- [ ] No secrets, credentials, or personal data in the repo
- [ ] Every new KB claim traces to [`PROVENANCE.md`](PROVENANCE.md) — or is
      labeled as engineering judgment there
- [ ] Indicative figures still hedged everywhere they appear
- [ ] No fabricated benchmark numbers anywhere (docs included)

## 6. Version & tag

- [ ] `KB_VERSION` / `ENGINE_VERSION` / `SPEC_VERSION` bumped per
      [`VERSIONING.md`](VERSIONING.md); `package.json` tracks the higher
- [ ] `CHANGELOG.md` has a proper section for this release with the *why* on
      every entry
- [ ] Rebuild + full gate after the bump (`npm run test:all`)
- [ ] Commit: `release: vX.Y.Z — <one-line summary>`
- [ ] After merge to `main`: `git tag -a vX.Y.Z -m "vX.Y.Z"` on the merge
      commit, `git push --tags`
- [ ] GitHub Pages deploy workflow green; spot-check the live URL

## 7. Historical record

| Release | Date | Notes |
|---|---|---|
| v1.0.0 | 2026-08-11 | Initial prototype |
| v1.1.0 | 2026-08-11 | Modular restructure, tests, docs, CI |
| v1.2.0 | 2026-08-25 | Simple Mode, shape classifier rebuild + holdout gates, eval harness P0+P1, UI wiring tests, product docs |
