# Contributing

Zero dependencies, zero build tooling. Clone, edit, `npm run test:all`.

```bash
git clone https://github.com/phoenixcryos/metaforge.git
cd metaforge
npm run test:all   # must pass before and after your change
npm run dev        # build + serve on :8080
```

AI agents: read [`AGENTS.md`](../AGENTS.md) first — it has the machine-oriented version.

---

## Ground rules

1. **No dependencies.** Not runtime, not build, not test. This is a design
   commitment ([ADR-0001](adr/0001-single-file-artifact.md)), not an oversight.
2. **No external URLs in the UI.** No CDN scripts, fonts, or images. The artifact
   must work offline and inside sandboxed iframes.
3. **Never edit `dist/`.** It is generated. Edit `src/`, run `npm run build`.
4. **Every KB claim needs a source.** Record it in [`PROVENANCE.md`](PROVENANCE.md).
   If it is your engineering judgment rather than sourced research, say so.
5. **Keep hedging on figures.** "10–30% ↓", not "reduces errors by 30%".
6. **Respect the layer boundary.** Decisions in `router.js`, prose in `sections.js`.

---

## Common contributions

### Add a domain

`src/kb/domains.js`:

```js
mydomain: {
  label: "Display name", persona: "the expert this hires",
  must: ["Specific, checkable obligations"],
  never: ["NEVER <the actual failure mode of this domain>"],
  verifier: "programmatic" | "llm_judge" | "none",
  tierBias: "light" | "extended" | "heavy",
  note: "Why this domain routes the way it does, or \"\""
}
```

Rules the tests enforce: all keys in `REQUIRED_DOMAIN_KEYS`, non-empty `must[]`
and `never[]`, every `never[]` entry starts with `NEVER`, valid `verifier` and
`tierBias`.

**Quality bar:** target the *actual* failure mode. "NEVER be inaccurate" is
worthless. "NEVER invent column or table names — inspect the schema or ask" is a
real guard against a real behavior. If you cannot name the specific way models
fail at this domain, the profile is not ready.

Add a verification gate in `sections.js → verificationGates()` if the domain has
a natural check. Bump `KB_VERSION`.

### Add a model family

`src/kb/models.js`:

```js
myfamily: {
  label: "Family (Vendor)", vendor: "Vendor",
  window: 200000, isolation: "xml" | "markdown" | "markdown+xml",
  thinking: "How reasoning budget is controlled, and what NOT to do.",
  tips: ["≥3 dialect-specific notes"],
  param: '{"model":"<placeholder>","…":BUDGET,"…":"EFFORT", …}'
}
```

`param` must parse as JSON after `BUDGET` → number and `EFFORT` → string
substitution (asserted). Use `<placeholder>` model IDs — real IDs go stale.
If the family needs consumer-conditional parameters, extend `buildAdapter()`.
Bump `KB_VERSION`.

### Add a technique to the matrix

`src/kb/techniques.js`. Required: `id`, `name`, `mech`, `cost`, `gain`, `use`,
`shapes`.

**Bar for inclusion:** reproduced results *and* a clear statement of when it does
**not** help. The negative case is what lets the router decline to use it. A
technique with only upside claims is marketing, not evidence. Record the source in
`PROVENANCE.md`. Bump `KB_VERSION`.

### Change routing behavior

1. Edit the relevant block in `src/engine/router.js` only.
2. Add or update the assertion in the "Router decision rule" group of `test/run.js`.
3. Bump `ENGINE_VERSION` — output changed.
4. `CHANGELOG.md` under **Changed**, explaining *why*.

### Reword a prompt section

`src/engine/sections.js`. No version bump needed unless the change is structural
(section added/removed/renamed → `ENGINE_VERSION` MINOR or MAJOR).

Prompt-writing standard — the tool's own output standard applies to its own output:
direct, concrete, no filler, every line changes behavior. If a sentence would not
change what the model does, delete it.

### Add a diagnostic warning

`warnings()` in `src/engine/compile.js`. Format: `[title, detail]`. The detail
should say what to *do*, not just what is wrong, and cite the R-number when one
applies. Add an assertion in the "Diagnostics" group.

---

## Testing

```bash
npm test              # unit invariants (226)
npm run test:shapes   # shape-classifier accuracy, holdout-gated
npm run test:ui       # static DOM-wiring invariants (60)
npm run test:bundle   # build + artifact smoke test (28)
npm run test:all      # all of the above — this is the gate
```

Assert **invariants, not strings** ([ADR-0004](adr/0004-invariant-testing.md)):

```js
// good — survives wording changes, catches real regressions
ok(o.sys.includes("# CALIBRATION_AND_ABSTENTION"), "abstention block rendered");
ok(!lowRisk.sys.includes("# CALIBRATION_AND_ABSTENTION"), "absent when not needed");

// bad — breaks on every edit
assert.equal(o.sys, "…entire expected prompt…");
```

Write both the positive and the negative assertion. A feature test that only
checks presence cannot detect the feature firing when it shouldn't.

Anything touching `src/ui/` also needs a manual browser check — the unit tests
cannot see DOM wiring. Load `dist/index.html`, exercise the presets and tabs,
confirm the console is clean.

---

## Pull requests

**Title:** `[scope] imperative description` — e.g. `[kb] add legal domain profile`

**Body:**
- What changed and why
- Which version stamps you bumped, and why ([VERSIONING.md](VERSIONING.md))
- Test output showing `test:all` passing
- For UI changes: confirmation of a clean browser console

**Checklist:**
- [ ] `npm run test:all` passes
- [ ] No new dependencies
- [ ] `PROVENANCE.md` updated if knowledge was added
- [ ] `CHANGELOG.md` updated with reasoning, not just a summary
- [ ] Version stamps bumped appropriately
- [ ] `dist/` not hand-edited

---

## Reporting a bad routing decision

The most valuable bug report for this project. Include:

1. The exact task text
2. The routing decision you got (copy the provenance block)
3. What you expected and why

These become test cases. A reproducible bad decision is worth more than a feature
request.
