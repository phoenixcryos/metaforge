# Versioning

MetaForge carries **three** version stamps because knowledge and behavior change
independently, and a prompt in the wild needs to be traceable to both.

All three live in [`src/kb/index.js`](../src/kb/index.js) and are embedded in every
compiled artifact's provenance block.

---

## The three stamps

| Constant | Meaning | Bump when |
|---|---|---|
| `KB_VERSION` | The research content | A technique is added/removed, a figure is revised, a model dialect changes, a domain profile changes, rule text changes |
| `ENGINE_VERSION` | The compiler behavior | Routing logic changes, a prompt section is added/removed/restructured — **i.e. the same input now produces different output** |
| `SPEC_VERSION` | The input contract | A field is added, removed, renamed, or changes meaning in the spec object accepted by `compile()` |

`package.json.version` tracks the higher of `KB_VERSION` and `ENGINE_VERSION`.

### The decisive test

> **Would the same input produce different output?**
> Yes → bump `ENGINE_VERSION`.
> Only reference-tab content changed → bump `KB_VERSION` only.
> Both → bump both.

A KB change frequently *does* change output (e.g. editing a domain's `never[]`
edits the prompt). That is a `KB_VERSION` bump **and** an `ENGINE_VERSION` bump is
not required, because the engine didn't change — but the output did, so record it
in the changelog. When in doubt, bump both; the cost is zero and the ambiguity is
expensive.

---

## Semantic versioning

All three follow `MAJOR.MINOR.PATCH`.

### `KB_VERSION`

| Level | Meaning | Example |
|---|---|---|
| MAJOR | Knowledge that reverses prior guidance | A technique previously recommended is now known harmful |
| MINOR | New knowledge, backward-compatible | New domain, new model family, new technique in the matrix |
| PATCH | Corrections | Fixed figure, clarified wording, typo |

### `ENGINE_VERSION`

| Level | Meaning | Example |
|---|---|---|
| MAJOR | Prompt structure changes such that downstream parsers break | A section is renamed or removed |
| MINOR | New conditional behavior | Abstention block added; a new topology can now fire |
| PATCH | Wording tuned; no structural change | Reworded a MUST for clarity |

### `SPEC_VERSION`

Integer, not semver. Increment on **any** breaking change to the input object.
Embedders pin against this. Currently `"1"`.

---

## Release procedure

```bash
# 1. Validate
npm run test:all

# 2. Bump stamps in src/kb/index.js, and package.json to match

# 3. Update CHANGELOG.md — Added / Changed / Fixed / Removed, with reasoning

# 4. Rebuild and re-validate
npm run build && npm run test:all

# 5. Manual smoke: open dist/index.html, console clean, presets compile

# 6. Commit, tag, push
git add -A
git commit -m "release: v1.2.0 — <one-line summary>"
git tag -a v1.2.0 -m "v1.2.0"
git push && git push --tags
```

CI runs the full suite on push and deploys `dist/` to GitHub Pages from `main`.

---

## Changelog discipline

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/).

Every entry answers **why**, not just what. Compare:

```markdown
### Changed
- Reflection depth capped at 1 for Light tier.        ← what only, useless later

### Changed
- Reflection depth now capped at 1 on the Light tier. Cheap tasks do not earn
  iteration, and ungrounded critique on a formatting task is where drift comes
  from with no upside. (R06)                          ← why, still useful in a year
```

The second version is what lets a future maintainer — human or AI — decide whether
your reasoning still holds.

---

## Provenance in compiled output

Every `compile()` returns:

```js
provenance: {
  kb_version:     "1.1.0",
  engine_version: "1.1.0",
  spec_version:   "1",
  context_hash:   "142e26d9a697e4",   // stable hash of the assembled context
  compiled_at:    "2026-08-11T…Z",
  routing: { shape, tier, verifier, topology, reflection_depth, abstention }
}
```

The UI renders this under every compile and includes it in both download formats.

**Log `context_hash` alongside every eval run.** Irreproducible contexts are the
number-one cause of "the prompt regressed" (R19) — without the hash you cannot tell
whether the prompt changed, the KB changed, or the model changed.

---

## Compatibility promises

- **Within a MAJOR `SPEC_VERSION`:** `compile()` accepts the same fields. New
  optional fields may be added; existing ones will not change meaning.
- **Within a MAJOR `ENGINE_VERSION`:** the prompt's top-level section names are
  stable, so downstream parsers keep working.
- **No promise on exact prompt text.** Wording is tuned continuously. Do not
  string-match against generated prompts — that is what `provenance` is for.
