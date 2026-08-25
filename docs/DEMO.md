# Demo Script — MetaForge in ~8 minutes

A walkthrough outline for presenting or onboarding. Every step works offline;
the only setup is opening one file.

**Setup (30 s):** open `dist/index.html` — double-click works; there is no
install and no network. Optionally kill Wi-Fi first: the whole demo runs
air-gapped, which is part of the story.

---

## Act 1 — The default experience (2 min)

1. **Click the first preset** (code refactor). Point out: the filled form is
   short — task, deliverable, domain, model, consumer, risk, constraints.
2. **Hit Forge.** Read the generated system prompt top to tail, briefly:
   identity → prime directive → success criteria as *checkable boxes* → method
   steps for the routed topology → MUST/NEVER constraints → verification gates →
   self-check → output contract → the authoritative constraint reprise at the
   tail.
3. **Talking point:** "Nothing here is a template slot. The topology, the
   thinking budget, the reflection depth were all *decided* from the task."

## Act 2 — Show the router think (2 min)

4. **Look at the routing panel.** Name the decisions out loud: shape, thinking
   tier, topology, reflection depth — and the one-line *why* for each.
   If the shape came from reading the task text (not the domain), the UI says
   so, with a confidence figure and an amber `shape ?` pill on close calls.
5. **Flip risk medium → high and re-forge.** The prompt re-renders: heavier
   tier, deeper reflection, and a `CALIBRATION_AND_ABSTENTION` block appears,
   because a wrong high-risk answer with no programmatic checker is exactly
   where "I don't know" is worth more than a confident guess.
6. **Flip consumer to JSON.** Note the output contract switches to a JSON
   schema and the model adapter picks up structured-output call parameters —
   which are stripped again if you flip back to prose.
7. **Talking point:** "A template can't do what you just watched. Those are
   conditionals — the same ones the research says are 10–100× mistakes when
   you apply them uniformly."

## Act 3 — Warnings as a linter (1 min)

8. **Clear the deliverable field and re-forge.** A warning fires: the model
   will guess the artifact shape.
9. **Enable tools with no tool list.** Second warning: unbounded tool surface.
10. **Paste 9,000 characters into evidence.** Third warning: compression ladder,
    pass a pointer plus a 200-token abstract instead.
11. **Talking point:** "The diagnostics are the failure modes from the source
    research, mapped to checks that can fire *before* you spend a token."

## Act 4 — Simple Mode (2 min)

12. **Click "New to this? Answer 4 questions instead →"** above the form.
13. Use the invoice scenario:
    - Q1: *"Every month I get about 40 supplier invoices as PDFs. I want the
      supplier name, invoice number, date and total pulled out into a
      spreadsheet for my accountant."*
    - Q2: a list or table. Q3: just me. Q4: type *"Never guess a number."*
14. **Read the review strip:** it states every inference with its reason —
    risk raised to *extra careful* because invoices and tax, untrusted-input
    handling on because PDFs, and that tools are off because the assistant
    can't run anything on your computer.
15. **Talking point:** "Same engine, same router — questions instead of jargon.
    And the strip is the safety mechanism: nothing is inferred invisibly."

## Act 5 — Take it with you (1 min)

16. **Copy / download** the prompt as Markdown or JSON. The JSON export carries
    the spec, the routing decision, and the provenance block.
17. **Point at the provenance stamp:** KB version, engine version, context
    hash. "Log that hash with your eval runs. When someone says 'the prompt
    regressed', the hash is what separates a prompt change from a model change."
18. Optional, for technical audiences — the eval harness:

    ```bash
    npm run eval -- --set eval/fixtures/smoke.jsonl --routing-only
    ```

    A table of routing decisions over a task set, offline. Real model runs plug
    in through a script executor — see [`eval/README.md`](../eval/README.md).

## Close

> "MetaForge doesn't promise you a good prompt. It promises that the structural
> decisions — topology, budget, reflection depth, rails — are *made*, visibly,
> from the research, instead of not being made at all. Then it hands you the
> harness to measure the rest on your own tasks."

---

## Presenter checklist

- [ ] `npm run build` run today; artifact opens from `file://`
- [ ] Presets all forge without warnings beyond the expected ones
- [ ] Browser console clean (F12) before showing anyone
- [ ] Know the honest-numbers line: shape classifier 47% top-1 / 80–87% on the
      routing binaries — say it before someone finds it in the docs
- [ ] Fallback if a projector kills the browser: the same file opens on any
      machine, or walk the pre-compiled JSON export in any text editor
