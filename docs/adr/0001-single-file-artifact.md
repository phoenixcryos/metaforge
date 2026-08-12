# ADR-0001: Single-file, zero-dependency artifact

**Status:** Accepted · **Date:** 2026-08-11

## Context

MetaForge needs to run in several environments that are hostile to typical web
tooling: sandboxed preview iframes with `sandbox="allow-scripts"` and no network,
a laptop with no internet, a corporate machine where npm install is blocked, and a
static host with no build step. It also needs to stay useful for years with
minimal maintenance.

The default modern stack (React + Vite + a component library + a test runner)
would add ~200 MB of `node_modules`, a build chain that breaks on major-version
bumps, and a dependency surface that requires ongoing security attention — for a
tool whose entire logic is a router and some string building.

## Decision

Ship **one HTML file** with inlined CSS and JS, no external requests, and **zero
runtime and build dependencies**. `build.js` is plain string concatenation with
ES-module syntax stripping.

## Consequences

**Good**
- Works from `file://`, offline, in sandboxed iframes, on any static host.
- No dependency CVEs, no lockfile churn, no framework migration.
- The build is ~200 lines you can read in full and debug with `console.log`.
- Trivial deployment: copy one file.

**Bad**
- Hand-rolled DOM code (~700 lines) instead of a component model.
- No hot reload; iterate with `npm run dev` and refresh.
- We wrote a small module-stripping transform, which had a real bug (see ADR-0005).
- Some conveniences (a markdown lib, a diffing lib) must be written or skipped.

**Accepted trade-off.** The UI is a form and some tables. A framework would cost
more in maintenance than it saves in authoring.

## Revisit if

The UI grows genuinely stateful (multi-step wizards, live collaboration), or the
DOM code passes ~2000 lines and becomes hard to change safely.
