# ADR-0005: Automatic namespace shims in the build

**Status:** Accepted · **Date:** 2026-08-11

## Context

`build.js` strips ES module syntax so sources can be concatenated into one classic
`<script>`. The first implementation dropped `import` lines wholesale.

That silently broke `compile.js`, which uses `import * as X from "./sections.js"`
and then calls `X.successCriteria(...)`. The import line vanished; the `X.`
references did not. Every unit test passed — they import the ES modules directly —
and the shipped page threw `X is not defined` on the first button click.

This is exactly the failure class the tool itself warns about: a validation gate
that was never actually executed against the artifact being shipped.

## Decision

Two changes:

1. **`build.js` rebuilds namespace objects automatically.** It records
   `import * as NS from "./mod.js"`, reads the target module's export list, and
   emits `const NS = { ...exports };`. Adding an export to a namespaced module
   requires no build change.
2. **`test/bundle.js` executes the built artifact.** It evaluates the bundled
   engine in isolation, calls `compile()`, and asserts byte-identical parity with
   the source engine. It would have caught this bug immediately.

`npm run test:all` runs unit tests, then builds, then tests the bundle.

## Consequences

**Good**
- The build transform is now itself under test.
- Namespace imports work without hardcoded shim lists.
- Bundle-vs-source parity is asserted, so the artifact cannot silently diverge.

**Bad**
- The stripper still relies on conventions (no duplicate top-level identifiers, no
  default exports, no dynamic import). These are documented in `AGENTS.md` and
  partly asserted, but a sufficiently creative module could still break it.

## Lesson

Any transform between source and artifact needs a test that runs the *artifact*.
Testing only the source tests something the user never receives.
