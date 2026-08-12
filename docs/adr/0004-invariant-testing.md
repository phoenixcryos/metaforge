# ADR-0004: Test invariants, not strings

**Status:** Accepted · **Date:** 2026-08-11

## Context

The output of this tool is prose. Snapshot tests or string-equality assertions
would mean every wording improvement — every clarified MUST, every tightened
NEVER — breaks CI. That pressure makes maintainers stop improving wording, which
is precisely the wrong incentive for a prompt compiler.

But the output must still be *correct*, and correctness here is structural: the
insufficiency escape hatch must be present, ToT must not fire on linear tasks,
reflection must be bounded, untrusted content must be wrapped.

## Decision

Assert **invariants**: properties that must hold for the tool to be correct.

- Every spec in the input space compiles without throwing (1,440 combinations).
- No artifact leaks `undefined`, `NaN`, or unresolved placeholders.
- Routing decisions match the documented rule (ToT never on linear, reflection ≤2
  when ungrounded, Light tier on style tasks, etc.).
- Structural guarantees are present under the conditions that should trigger them
  and absent otherwise.
- The KB is well-formed.

No test asserts exact prompt text.

## Consequences

**Good**
- Wording can be tuned freely; CI still catches real regressions.
- Tests document the intended decision rule and stay readable.
- The exhaustive sweep catches combinatorial edge cases a sampled suite would miss.
- Zero test-framework dependency: `node test/run.js`.

**Bad**
- A subtly bad *wording* change passes CI. Only human review or an eval harness
  catches that.
- "Feature present under trigger conditions" requires writing both the positive
  and the negative assertion, or the test is half-useless.

## Revisit if

An eval harness (ROADMAP item 2) exists — then quality regressions can be caught
by measurement rather than by structure alone.
