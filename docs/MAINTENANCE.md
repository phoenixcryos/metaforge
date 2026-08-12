# Maintenance

MetaForge encodes a fast-moving field. This document is the plan for keeping it
current, ordered by how quickly each area rots.

---

## Rot rate by file

| File | Half-life | Why it rots |
|---|---|---|
| `src/kb/models.js` | **~3 months** | Vendors ship new reasoning controls, structured-output APIs, context windows, and prompting guidance continuously |
| `src/kb/techniques.js` | ~6–12 months | New techniques appear; published figures get superseded by newer model generations |
| `src/kb/failures.js` | ~12–24 months | Failure taxonomies are architectural and change slowly |
| `src/kb/rules.js` | ~12–24 months | R01–R24 are principles, not implementation details |
| `src/engine/router.js` | Change-driven | Only when the technique landscape shifts enough to change a decision |
| `src/engine/sections.js` | Change-driven | Wording tuning |
| Build, tests, UI | Stable | Deliberately dependency-free |

---

## Review cadence

### Monthly — model dialect check (~30 min)

For each family in `src/kb/models.js`:

- [ ] Context window still accurate?
- [ ] Reasoning-budget parameter name and value range unchanged?
- [ ] Structured-output API unchanged?
- [ ] Any new official prompting guidance that contradicts a `tips[]` entry?
- [ ] Any new family worth adding?

If anything changed: update the entry, bump `KB_VERSION`, note it in `CHANGELOG.md`,
run `npm run test:all`.

**Signals to watch:** vendor prompt-engineering docs, model cards, API changelogs,
deprecation notices.

### Quarterly — technique matrix review (~2 hrs)

- [ ] Any technique in the matrix superseded or now considered harmful?
- [ ] Any new technique with enough evidence to add? (Bar: reproduced results plus
      a clear statement of *when it does not help*.)
- [ ] Do the cost/benefit ranges still hold on current-generation models?
- [ ] Does the selection heuristic still order correctly?

Pay attention to figures derived from GPT-4-era papers — the ToT Game-of-24 numbers
in particular. If reasoning models change the picture, update the figure *and* the
provenance note.

### Semi-annually — routing audit (~half day)

- [ ] Run every preset. Are the routing decisions still defensible?
- [ ] Sample 10 real tasks from your own use. Does shape classification get them right?
- [ ] Are the thinking-tier thresholds still at the accuracy knee?
- [ ] Any new failure mode observed in production that deserves a diagnostic?

This is the review most likely to produce an `ENGINE_VERSION` bump.

### Annually — corpus refresh (~1–2 days)

Re-run the original research directive against current frontier models. Diff the
new reports against `docs/PROVENANCE.md`. Look for:

- Findings that reversed
- New consensus areas
- Techniques that became standard (fold into defaults) or obsolete (remove)

This is how MetaForge stays a *meta*-level tool rather than a 2026 time capsule.

---

## Triggered updates

Do these immediately, regardless of cadence:

| Trigger | Action |
|---|---|
| A major model family launches | Add or update its dialect; check whether tier budgets still map |
| A vendor deprecates a parameter you emit | Fix `param` template immediately — you are emitting broken calls |
| A technique is shown to be harmful | Remove from matrix, remove from router, note in CHANGELOG under Removed |
| You observe a novel production failure | Add to `failures.js`; add a diagnostic if it is detectable pre-run |
| Someone reports a bad routing decision | Reproduce, add a failing assertion, fix, keep the assertion |

---

## Model dialect drift — the recurring problem

`src/kb/models.js` will be wrong before anything else. Structure your updates:

```js
// BEFORE — becomes wrong silently
thinking: "Use reasoning.effort (low|medium|high)."

// AFTER — states the contract, easy to verify
thinking: "Reasoning models take a `reasoning.effort` knob (minimal|low|medium|high). " +
          "Do NOT hand-write CoT scaffolds for reasoning models — state the goal " +
          "and constraints, let it think.",
```

Prefer describing *the shape of the contract* over exact model names. Model names
change every few months; the contract shape changes yearly.

**Do not put model IDs in `param` templates.** They are placeholders
(`<claude-model>`) on purpose — an ID list would be permanently stale.

---

## Adding knowledge without breaking anything

The KB is data, so additions are low-risk if you follow the shape:

1. **Add to the right file.** Techniques → `techniques.js`. Failure modes →
   `failures.js`. Rules → `rules.js` (rarely; R01–R24 is a stable set).
2. **Record the source** in `docs/PROVENANCE.md`. An unsourced claim in the KB is
   a bug — it violates the standard the tool itself enforces.
3. **Keep hedging language.** "10–30% ↓" not "reduces errors by 30%".
4. **State when it does not help.** Every technique entry should make the negative
   case visible; that is what makes the router able to *not* use it.
5. **Bump `KB_VERSION`**, run `npm run test:all`.

---

## Deprecating knowledge

Do not silently delete. Deletion loses the reason.

1. Move the entry's substance into `CHANGELOG.md` under **Removed**, with why.
2. If it was superseded, note the successor in `PROVENANCE.md`.
3. Remove from the KB.
4. Remove any router branch that depended on it, plus its assertion.
5. Bump `KB_VERSION` (and `ENGINE_VERSION` if routing changed).

---

## Health checks

Run before any release:

```bash
npm run test:all          # 254 assertions
node build.js             # artifact builds
# then, in a browser:     # load dist/index.html, console must be clean
```

Manual checks the tests cannot do:

- [ ] Every preset compiles and the routing decision reads sensibly
- [ ] Reference tabs render (Techniques, Failure Modes, Operating Rules)
- [ ] Copy and download buttons work
- [ ] Page works from `file://` with no network
- [ ] No console errors, no layout breakage at 1280px and 480px

---

## Keeping the compiler honest

The most important maintenance task is not updating figures — it is making sure
the router still makes *good decisions*. A KB full of current research attached to
a router that fires ToT on linear tasks is worse than useless.

The strongest signal available without a full eval harness: take ten real tasks,
compile them, and read the routing decisions. If you disagree with one, that is a
bug worth a test. See [`EVALUATION.md`](EVALUATION.md) for the measured approach.
