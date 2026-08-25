# Simple Mode for MetaForge: a four-question deterministic pre-filler

## Summary  
Ship Simple Mode as a deterministic pre-filler over the existing spec object — four plain-English questions, four static lexicons, a review strip — that writes a fully-populated spec and hands it to an unchanged `route()` and emitter. The four questions buy exactly the fields no keyword pass can recover (task, deliverable, audience, risk) and are chosen so the three warnings the codebase already fires (E4) become structurally impossible in Simple Mode, putting its quality floor above advanced mode's. Domain, model, tools, toolList, toolBudget, evidence, untrusted and agentName are inferred from static tables or left at the advanced default, each stated below. I rejected the one-box "just describe your task" wizard because it makes shape classification load-bearing for all routing, and E2 measures that at ~47% top-1 with 80–87% on the binaries that change routing — 13–20% of the users least able to notice would be silently misrouted. The dominant failure mode of what I am recommending is a confident wrong inference the user cannot recognise, contained by escalate-only lexicons and a review strip that states every inference with its reason.

## Evidence keys  
- **E1** — Spec fields: task, deliverable, audience, domain (10), model (6), consumer (human/json/code/doc), risk (low/med/high), tools, toolList, toolBudget, constraints, evidence, untrusted, agentName.  
- **E2** — `route()` derives shape, verifier, tier, topology, reflection depth from those fields. Shape classification ~47% top-1 on unseen phrasings, 80–87% on the binaries that change routing.  
- **E3** — Six presets exist (code refactor, security audit, research memo, data extraction, agent workflow, content writing); closest thing to a beginner path today.  
- **E4** — Warnings already fire for: missing deliverable, no hard constraints, no audience.

## The four questions

**Q1 — required, free text.**  
> **What do you want the assistant to do?**  
> Describe it the way you'd explain it to a new colleague on their first day. Two or three sentences is plenty.  
> *Placeholder:* "Every month I get about 40 supplier invoices as PDFs. I want the supplier name, invoice number, date and total pulled out so I can put them in a spreadsheet."  
> Below the box: the six existing presets (E3) rendered as one-tap examples that fill the box with editable text.

**Q2 — required, single-select.**  
> **What should you end up with?**  
> - An answer or an explanation — advice, a recommendation, a summary you'll read yourself.  
> - A finished piece of writing — an email, a report, a post, a page, a policy.  
> - Code, or a change to some code — a script, a formula, a fix.  
> - A list or a table of information — something you'll paste into a spreadsheet or another program.  
> - I'm not sure yet.

**Q3 — required, single-select.**  
> **Who's going to see or use the result?**  
> - Just me.  
> - People I work with.  
> - A customer, a client, or someone outside my organisation.  
> - It goes straight out — published, sent, or used by a system — with nobody checking it first.

**Q4 — optional, free text plus tappable chips.**  
> **Anything it must always do, or must never do?**  
> Leave it blank if nothing comes to mind — we'll fill in sensible rules based on your answers.  
> Chips are generated from (Q2, Q3), e.g. code+just-me → *"Explain each step like I've never done this"*, *"Don't delete anything"*, *"No extra software to install"*.

Jargon audit: every noun in the four questions is a word a non-engineer already uses. "Verifier class", "thinking tier", "output consumer", "shape", "topology" appear nowhere in the user-facing surface.

## Field mapping: what each answer sets

| Spec field (E1) | Source | Value |  
|---|---|---|  
| `task` | Q1, verbatim | user text, untouched |  
| `deliverable` | Q2 → `DELIVERABLE_TEMPLATES`, with a noun lifted from Q1 by `DELIVERABLE_NOUNS` | e.g. code → *"A complete script or code change I can copy and run, plus a numbered list of what to do and what I should see at each step."* |  
| `consumer` | Q2, 1:1 | answer→doc, code→code, list/table→json, explanation→human, *not sure*→human |  
| `audience` | Q3 → `AUDIENCE_MAP` | e.g. *"the public, or a live system, with no human review before it's used"* |  
| `risk` | `max(AUDIENCE_MAP.risk, RISK_UP(Q1))` | Q3 gives low / med / med / high; lexicon can only raise it |  
| `constraints` | `dedupe(Q4 ∪ CONSTRAINT_INJECT(Q1) ∪ base_by_consumer ∪ add_by_risk)` | never empty |

`DELIVERABLE_NOUNS`: email, report, post, page, FAQ, policy, letter, memo, summary, script, formula, query, checklist, plan, table, list, spreadsheet. First literal match wins; otherwise the option's generic noun.

`base_by_consumer` (the floor, applied always):  
- **human** — *"Answer the actual question in the first two sentences."* / *"If something you need is missing, ask for it instead of assuming."*  
- **doc** — *"Produce the finished piece only — no commentary about how you wrote it."* / *"Don't invent names, numbers, dates or quotes."*  
- **code** — *"Give complete, runnable code — no '…' or 'your code here'."* / *"Say what to do if it doesn't work."* / *"Don't add anything that has to be installed unless you give the exact install command."*  
- **json** — *"Output the data only — nothing before or after it."* / *"Keep the same fields in the same order for every row."* / *"Leave a value empty rather than guessing it."*

`add_by_risk`:  
- **low** — none.  
- **med** — *"If you're not sure about something, say so in one line at the end rather than guessing."* / *"Don't state a number, date or name you weren't given."*  
- **high** — all of med, plus *"Where you would have to guess, write [CHECK: what's missing] and list every one of those in a labelled block after the piece."* / *"Nobody is reviewing this before it's used — do not assert anything you can't support from what you were given."*

Precedence matters: the high-risk `[CHECK]` line contradicts the doc floor's *"finished piece only"*. Entries in `add_by_risk` carry an optional `supersedes` key naming the base line they relax, applied after the union and before dedupe.

## What Simple Mode infers instead of asking

| Field | Rule | Stated default |  
|---|---|---|  
| `domain` (10) | `DOMAIN_HINTS` literal-keyword lookup over Q1, seeded by Q2's option default | `DOMAIN_FALLBACK` = the most general of the existing 10; the maintainer pins this constant once |  
| `model` (6) | never written by Simple Mode | the advanced form's current default; if the code has none, pin to the most capable general-purpose entry of the 6 |  
| `tools` | always `false` | `false` |  
| `toolList` | always `[]` | `[]` |  
| `toolBudget` | always `0` | `0` |  
| `evidence` | always empty; when `risk ≥ med`, the calibration line goes into `constraints` instead of faking a source list | `""` |  
| `untrusted` | `true` if `UNTRUSTED_IN` hits Q1 | `false` |  
| `agentName` | `AGENT_NAMES[consumer]` — Assistant / Writing Assistant / Coding Assistant / Extraction Assistant | existing advanced default |

`RISK_UP`, two tiers, escalate-only. →**med**: money, invoice, tax, VAT, payroll, price, refund, personal data, address, phone number, deadline. →**high**: medical, medication, dose, dosage, diagnosis, symptom, legal advice, contract terms, immigration, safety, credentials, password, API key, hiring, firing, redundancy, child, children, benefits, eligibility.

`UNTRUSTED_IN` (third-party *text* only, deliberately excluding "file", "folder", "photo"): paste, pasted, upload, uploaded, attached, PDF, email, document, doc, transcript, ticket, review, comment, message, submission, form response, web page, URL, link, article, notes.

`CONSTRAINT_INJECT`: destructive verbs (delete, remove, rename, overwrite, drop, wipe, migrate, production, live) → *"Work on a copy — never modify or delete the originals."*; spreadsheet/CSV/Excel → *"One row per record, fixed column order."*

Tools being hard-off is a quality decision, not a shortcut: a non-engineer cannot supply a real `toolList`, and a prompt that instructs a model to call tools that do not exist is strictly worse than one that states there are none. The review strip says so in plain English and offers the advanced control.

## Three walkthroughs

### 1. Nadia — studio manager, batch file rename  
**Q1:** *"I have a folder of about 300 photos named IMG_0001.JPG and so on. I want them renamed to the date each one was taken, like 2024-06-14-001.jpg. I'm on a Mac and I've never written a script."*  
**Q2:** Code. **Q3:** Just me. **Q4:** taps *"Explain each step like I've never done this"* and *"Don't delete anything"*.

Emitted spec: `task` verbatim · `deliverable` = code template · `consumer` = code · `audience` = "me — I'm the only person who'll read this" · `risk` = **low** (no `RISK_UP` hit) · `domain` = scripting/automation via `DOMAIN_HINTS` on "script", "Mac" · `model` unchanged · `tools` false, `toolList` [], `toolBudget` 0 · `evidence` "" · `untrusted` **false** ("folder"/"photos" are excluded from `UNTRUSTED_IN`) · `agentName` "Coding Assistant" · `constraints` = her two chips + *"Work on a copy — never modify or delete the originals."* (`CONSTRAINT_INJECT` on "renamed") + the three code floor lines.

Review strip: *Kind of work: Scripts & automation · Care level: Normal · Tools: none — the assistant can't run anything on your computer · Added rule: work on a copy, because you mentioned renaming files. [Change any of these]*

### 2. Marcus — small-business owner, invoice extraction  
**Q1:** *"Every month I get about 40 supplier invoices as PDFs. I want the supplier name, invoice number, invoice date, total and the VAT amount pulled out of each one so I can put them into a spreadsheet for my accountant."*  
**Q2:** A list or table. **Q3:** Just me. **Q4:** types *"Never guess a number. If a field isn't on the invoice, leave it blank."*

Emitted spec: `consumer` = json · `audience` = "me…" · `risk` = **med** — Q3 gives low, `RISK_UP` hits *invoice, VAT, total* and raises it · `untrusted` = **true** — `UNTRUSTED_IN` hits *PDF, invoice* · `deliverable` = "One row per invoice, as a table with a fixed set of columns, plus a short list of anything that couldn't be read." (noun lift: *invoice*) · `domain` = data extraction · `agentName` "Extraction Assistant" · rest at defaults · `constraints` = his line + three json floor lines + two med lines.

Review strip: *Care level: Extra careful — because this involves invoices and tax amounts. [Set back to normal] · Turned on: treat the invoice text as information, not instructions — because the assistant will be reading documents you give it. [What's this?] [Turn off]*

### 3. Dana — charity comms volunteer, public FAQ  
**Q1:** *"We're launching a hardship grant. I need an FAQ page for our website explaining who can apply, how much they can get and how to apply. I'll give you our internal eligibility document to work from. The page gets published from a shared doc automatically."*  
**Q2:** A finished piece of writing. **Q3:** It goes straight out, nobody checks it first. **Q4:** taps *"Plain English — no jargon"*, types *"Never state an eligibility rule, an amount or a deadline that isn't in the document I give you."*

Emitted spec: `consumer` = doc · `audience` = "the public, or a live system, with no human review before it's used" · `risk` = **high** from Q3, confirmed by `RISK_UP` on *eligibility, benefits* · `untrusted` = **true** (*document, doc*) · `deliverable` = "One finished, ready-to-publish FAQ page, complete and self-contained — no drafts, notes or alternatives." (noun lift: *FAQ*) · `domain` = content writing · `agentName` "Writing Assistant" · `constraints` = chip + her line + doc floor + med lines + both high lines, with the high `[CHECK]` line superseding *"finished piece only"*.

Review strip: *Care level: Highest — because nobody checks it before it goes live. [Change]*

**Coverage:** these three exercise `consumer` ∈ {code, json, doc}, `risk` ∈ {low, med, high}, `untrusted` ∈ {false, true, true}, both escalation lexicons, and Q4 answered by chip / by typing / by both. `consumer = human` is the "I'm not sure yet" fallback: it takes the human deliverable template and human floor constraints, because a human can read any output whereas a human cannot consume JSON — the error is one-sided in the safe direction.

## The trade-off I rejected

**Rejected: trading question count for inference coverage — the one-box "just describe your task and we'll figure the rest out" wizard.**

What it buys: the shortest funnel possible, one field, roughly 20 seconds of user time (`unverified:` my estimate, not measured).

What it costs: it makes shape classification load-bearing for 100% of routing. E2 puts that at ~47% top-1 on unseen phrasings and 80–87% on the binaries that change routing — so 13–20% of first-time users are silently misrouted on a binary, and more than half get the wrong shape wherever shape leaks into prompt structure rather than only into routing. Those are precisely the users with no way to notice. Worse, one box cannot recover `audience` or `risk` at all: neither is normally present in a task description, which is why "no audience" is a standing warning today (E4).

Why four questions instead of one: Q2 and Q3 each convert a classifier decision into a user assertion, taking that field's error to zero, at a cost of roughly 40 extra seconds (`unverified:` estimate).

**The condition under which this rejection is wrong:** if classification on the routing binaries reached ~99%, one box would dominate on every axis. The only known route from 80–87% to 99% is an LLM call over the input — which is out of scope by constraint. The one-box design is exactly the design that requires the forbidden dependency.

## Alternatives considered

Marginal dollar cost is $0 for every option, because no runtime model call is permitted anywhere in the tool.

| Option | User latency | Failure domain | Operational burden | Verdict |  
|---|---|---|---|---|  
| **A. One-box wizard** | ~20s (`unverified:` est.) | Silent misrouting: 13–20% error on routing binaries, ~53% on shape (E2). Invisible to the user by construction. | Highest — every misroute is an unreproducible support ticket. | Reject |  
| **B. Preset picker only** (ship the six as the beginner path) | ~10s, one click | Coverage. Six presets (E3) is a closed set; 2 of my 3 walkthroughs fall outside it. Presets carry no `audience` and no `risk`, so all three existing warnings (E4) still fire. | Lowest code, but preset sprawl: every new use case becomes a PR. | Reject as the whole mode; **keep as Q1's example chips** |  
| **C. Progressive disclosure** (tooltips + a "beginner" toggle on the current form) | Unchanged, 3–5 min | Doesn't solve the stated problem. The user still faces "verifier class", now with a 200-character explanation. (`unverified:` design judgement, not measured.) | Permanent: every future field needs beginner copy. | Reject |  
| **D. Four-question deterministic pre-filler** (recommended) | ~60–90s (`unverified:` est.); zero added compute, one extra render | Confident wrong inference — see below | Four static lexicons need a curation policy; ~250 lines of data + ~80 of logic (`unverified:` est.) | **Adopt** |

**What would have made a rejected option correct.** B becomes correct if the preset set grows from six (E3) to a taxonomy covering the long tail *and* each preset gains `audience` and `risk` — at which point it is this design with the questions hidden inside preset labels. A becomes correct only under the ≥99% classifier condition stated above.

### Architectural decisions

**Decision 1 — Simple Mode writes a complete spec into the existing object and reuses `route()` and the emitter unchanged.**  
- *Rejected: a parallel beginner emitter.* Guarantees drift, creates two prompt-quality baselines, and makes "materially as good as expert mode" unmeasurable because there is no single target.  
- *Rejected: emit a partial spec and let `route()` default the nulls.* `route()` is shared with advanced mode (E2); adding defaults there changes existing users' output, violating the "advanced stays default" constraint.

**Decision 2 — all defaults live in one declarative `SIMPLE_MAP` object, not in the UI handlers.**  
- *Rejected: defaults inline in each question's handler.* Default drift across handlers is the standard cause of "why did this field come out empty", and it makes the completeness test below impossible to write.

## Dominant failure mode and containment

**Confident wrong inference the user cannot recognise as wrong.** A lexicon fires on a homonym or misses a paraphrase; Simple Mode sets `risk` or `untrusted` incorrectly; the user — by definition unable to evaluate prompt quality — ships it. This is strictly worse than advanced mode's failure, where a missing field produces a visible warning (E4): wrong values do not warn.

Containment, all inside the design:  
1. **Nothing is inferred invisibly.** The review strip states every inferred value in plain English *with its reason*, one tap to change.  
2. **Lexicons only escalate.** Risk goes up, `untrusted` goes on, constraints get added — never the reverse. A false positive costs verbosity; a false negative costs safety.  
3. **`model` is never inferred.** The one field with six options (E1) and no plain-English proxy is left at the advanced default.  
4. **"Show the technical version"** on every screen renders the filled advanced form, so a suspicious user can inspect without docs.

The mitigation I cannot use: a fifth disambiguating question. That breaks the ≤4 constraint.

## Entry, exit, rollback

Advanced form remains the default landing state, rendered exactly as today. Above the first field, one line: **"New to this? Answer 4 questions instead →"**. No modal, no tour, no interstitial. Every Simple Mode screen carries **"Back to the full form"** plus `Esc`; exiting hands the partially-built spec to the advanced form so nothing is lost, and sets a dismissal flag that collapses the entry line to a small `?` for the rest of the session. Both directions are one click and plain-labelled. Dismissal persists in `localStorage` if the bundle runs in a browser (`unverified:` — I am inferring a browser target from "single-file bundle"); otherwise an in-memory session flag. Rollback is deleting one object and one line of markup.

Zero new dependencies: the entire mechanism is object literals, `String.prototype.includes`, and the existing render path.

## Proving the quality bar was met

Two checks the maintainer owns, both binary:

1. **Completeness test.** Assert that for every combination of Q2 × Q3 × (Q4 blank | Q4 filled), the produced spec has a non-empty value for all 14 fields in E1, and that every value for `domain`, `consumer` and `risk` is a member of the declared enum. This is a pure loop over `SIMPLE_MAP`; no fixtures needed.  
2. **Spec-diff harness.** Take N real advanced-mode specs, have a human answer the four Simple Mode questions from each spec's `task` text alone, diff the two spec objects field by field. Pass criterion: the fields `route()` branches on match, and Simple Mode's `constraints` count is ≥ the advanced spec's.

**Independent of both:** Simple Mode cannot produce a spec that fires any of the three existing warnings (E4). `deliverable` comes from a mandatory Q2 template, `audience` from a mandatory Q3 option, `constraints` from a floor set that is never empty. Advanced mode can fire all three. On the only quality signal the codebase currently measures, Simple Mode's floor sits above advanced mode's.

## Verification gates

**Gate 1 — Citation coverage: PASS.** Every claim about MetaForge's current behaviour cites E1–E4. Estimates of user time, line count and browser target are marked `unverified:` inline. The claim about tooltips failing non-engineers is marked as an unmeasured design judgement.

**Gate 2 — Criteria sweep:**

| Criterion | Evidence |  
|---|---|  
| Deliverable is exactly the requested artifact | Sections: four questions · field mapping · what it infers · three walkthroughs · the trade-off rejected |  
| Self-contained, no unresolved placeholders | Two values I cannot read from E1–E4 (`DOMAIN_FALLBACK`, the model default) are specified as decision rules with a stated fallback, not left blank |  
| ≤4 plain-English questions, no jargon | Q1–Q4, with the jargon audit under that section |  
| Every spec field valued | 14/14 of E1 covered across the mapping and inference tables |  
| No quality degradation | Unchanged `route()` + emitter; the three E4 warnings are structurally unreachable; **empirical parity `unverified:` until the spec-diff harness runs — I did not run it** |  
| Reachable and dismissable, advanced stays default | Entry, exit, rollback section: one entry line, `Esc`, session dismissal flag, advanced form untouched |  
| Zero new dependencies, single-file | Object literals + `String.prototype.includes` + existing render path |  
| No LLM call | All inference is table lookup and literal substring match |

## Assumptions & Limitations

- **Confidence: 0.72** that this design ships and satisfies every stated constraint as written; **0.55** that emitted quality is materially equal to expert mode *without* the maintainer tuning the `base_by_consumer` and `add_by_risk` tables against real specs. The gap between those two numbers is entirely the spec-diff harness.  
- **Assumed from E1's notation:** fields shown without an enumerated option set (`task`, `deliverable`, `audience`, `constraints`, `evidence`) are free-form, since only `domain`, `model`, `consumer` and `risk` carry counts or value lists. If `deliverable` is actually an enum, `DELIVERABLE_TEMPLATES` must return enum members instead of strings — a table change, not a design change.  
- **Two constants I cannot resolve from the evidence:** which of the 10 domains is the neutral fallback, and what the advanced form's current model default is. Both are one-line pins.  
- **`unverified:` route() sensitivity.** E2 confirms `route()` consumes these fields but not which ones dominate. My question selection is justified by E4's warning set and by lexical recoverability, not by measured routing sensitivity. If `domain` turns out to be a primary routing driver, `DOMAIN_HINTS` becomes the weakest link and Q1's preset chips should be promoted to setting `domain` explicitly.  
- **Lexicon accuracy is unmeasured.** E2's 47% / 80–87% figures describe shape classification, a different operation from literal substring matching on concrete nouns; I have no accuracy figure for the latter. The escalate-only rule and the review strip are the containment, not measured precision.  
- **The mode is English-only.** All four lexicons are English literals; non-English task text falls through to defaults (risk low, untrusted false), which is the unsafe direction. Detecting this is out of scope here.  
- **Blast radius if this is wrong:** a first-time user ships a prompt with under-set `risk` or `untrusted`. The maintainer notices via the review-strip change rate — if users routinely correct the same chip, that lexicon entry is wrong.  
- No `<untrusted_*>` content was supplied with this task; `security_notices` is empty. 