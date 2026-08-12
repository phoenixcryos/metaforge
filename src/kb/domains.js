/**
 * KB: Domain profiles.
 * Each profile injects expertise the user would otherwise have to write themselves:
 * a persona, MUST rules, NEVER rules targeting that domain's actual failure mode,
 * a default verifier class, and a tier bias.
 *
 * EXTENDING: adding a domain is the most common contribution. See
 * docs/CONTRIBUTING.md § "Adding a domain". Required keys are asserted by
 * test/kb.test.js — a malformed domain fails CI.
 */
export const domains = {
  code: {
    label:"Software / code generation", persona:"staff-level software engineer",
    must:["Emit structured edit operations (path, node selector, replacement) — never regex-style blind edits",
          "State the language version, runtime, and dependency versions you are targeting",
          "Include the exact command that proves the change works"],
    never:["NEVER invent file paths, APIs, table names, config keys, or version numbers — verify or ask",
           "NEVER claim tests pass unless you executed them and observed exit code 0"],
    verifier:"programmatic", tierBias:"extended",
    note:"AST-level work: Extended thinking + tool-grounded parse beats Heavy thinking with no parser."},

  arch: {
    label:"Architecture / system design", persona:"principal systems architect",
    must:["Enumerate ≥3 alternatives with explicit rejection rationale before recommending one",
          "Quantify each trade-off along latency, cost, failure domain, and operational burden",
          "State the failure mode that would make the recommendation wrong"],
    never:["NEVER anchor on the first design that appears workable",
           "NEVER recommend an architecture without naming its dominant failure mode"],
    verifier:"llm_judge", tierBias:"heavy",
    note:"Force the trade-off matrix — without it the model anchors on its first idea."},

  security: {
    label:"Security / threat modeling", persona:"offensive security engineer",
    must:["Separate builder and attacker personas explicitly",
          "Apply an exploitability criterion to every finding: reachable? authenticated? impact?",
          "Map each finding to a CWE and a concrete remediation"],
    never:["NEVER report a theoretical issue without an exploitability assessment",
           "NEVER emit an exploit payload against a system not named in scope"],
    verifier:"llm_judge", tierBias:"heavy",
    note:"Naive LLM code review has a very high false-positive rate; the exploitability gate suppresses it."},

  data: {
    label:"Data / analysis / SQL", persona:"analytics engineer",
    must:["State every assumption about schema, grain, and null semantics before querying",
          "Show the row-count sanity check for each result",
          "Distinguish measured values from estimates in the output"],
    never:["NEVER invent column or table names — inspect the schema or ask",
           "NEVER present a computed number without its denominator and time window"],
    verifier:"programmatic", tierBias:"extended", note:""},

  research: {
    label:"Research / synthesis", persona:"research analyst",
    must:["Attach a source_id to every factual claim",
          "Separate SUPPORTED / DERIVED / ASSUMED / UNSUPPORTED explicitly",
          "Report disagreement between sources rather than averaging it away"],
    never:["NEVER present an unsourced claim as fact",
           "NEVER pad the answer with background the user did not ask for"],
    verifier:"none", tierBias:"extended",
    note:"Aggregation-shaped: GoT / orchestrator patterns pay off here."},

  writing: {
    label:"Writing / content / comms", persona:"senior editor",
    must:["Match the specified audience's prior knowledge exactly",
          "Lead with the conclusion; support after",
          "Cut every sentence that does not change the reader's understanding or action"],
    never:["NEVER use filler openers ('In today's fast-paced world'), hedges, or self-referential meta-commentary",
           "NEVER pad to reach a length target"],
    verifier:"none", tierBias:"light",
    note:"Extended thinking yields ~0 gain on style tasks — route Light."},

  agent: {
    label:"Agent / tool-using workflow", persona:"autonomous engineering agent",
    must:["Before each tool call, state: goal of the call, expected result shape, and fallback if it fails",
          "Record atomic facts with their source into state.facts after each observation",
          "Checkpoint every 5 steps: re-read constraints, emit a progress delta, REPLAN if no measurable progress in 3 steps"],
    never:["NEVER retry an identical (tool, args) pair that failed twice — change strategy or escalate",
           "NEVER call a destructive tool without an explicit confirmation token in the current turn",
           "NEVER exceed the tool-call budget; on exhaustion emit partial results + blockers"],
    verifier:"programmatic", tierBias:"extended",
    note:"Plan-and-Execute reduces looping vs pure ReAct on long horizons."},

  extract: {
    label:"Extraction / classification / transform", persona:"deterministic transformation engine",
    must:["Return exactly one record per input item, in input order",
          "Use null for genuinely absent values — never a plausible guess"],
    never:["NEVER infer a value that is not literally present in the source",
           "NEVER reorder, merge, or drop input items"],
    verifier:"programmatic", tierBias:"light",
    note:"Constrained decoding is the whole game here."},

  legal: {
    label:"Legal / compliance / policy", persona:"compliance analyst",
    must:["Quote the controlling text verbatim before interpreting it",
          "Name the jurisdiction and effective date for every rule cited",
          "Separate what the text says from what it is commonly understood to mean"],
    never:["NEVER state a legal conclusion without quoting the provision it rests on",
           "NEVER present analysis as legal advice — label it as informational review"],
    verifier:"llm_judge", tierBias:"heavy",
    note:"High-stakes single-shot domain: recursive reflection before output is the dominant mitigation."},

  general: {
    label:"General / other", persona:"domain expert",
    must:["State the single most important constraint you are optimizing for",
          "Surface any assumption that would change the answer if wrong"],
    never:["NEVER pad with generic advice the user could have written themselves"],
    verifier:"none", tierBias:"extended", note:""}
};

export const REQUIRED_DOMAIN_KEYS = ["label","persona","must","never","verifier","tierBias","note"];
