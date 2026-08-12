/**
 * Labeled task set for shape classification.
 *
 * Purpose: shape drives topology, and a wrong shape is the most expensive error
 * MetaForge can make (ToT on a linear task is a 10–100× tax; single-expert on a
 * search task loses the 4%→74% class of gain). This fixture is the ground truth
 * that `test/shapes.js` measures accuracy against.
 *
 * Labels are the *dominant* shape a competent engineer would assign given the
 * task text alone, before domain overrides apply. Where a task is genuinely
 * ambiguous between two shapes, `alt` names the acceptable second answer — those
 * count as correct for top-1 but are the cases we want surfaced as low-confidence.
 *
 * ADDING CASES: when you hit a real task MetaForge routes badly, add it here with
 * the correct label. That converts a one-off complaint into a permanent guard.
 */
export const shapeCases = [
  /* ---------- linear: one pass, no branching, no merging ---------- */
  {t:"Rewrite this paragraph to be clearer and shorter.", s:"linear"},
  {t:"Translate the user guide into Spanish.", s:"linear"},
  {t:"Convert these CSV rows into JSON objects.", s:"linear"},
  {t:"Summarize the attached meeting transcript.", s:"linear"},
  {t:"Write a docstring for this function.", s:"linear"},
  {t:"Fix the typo in the error message and update the snapshot.", s:"linear"},
  {t:"Rename the variable userId to accountId throughout this file.", s:"linear"},
  {t:"Turn these bullet points into a paragraph of prose.", s:"linear"},
  {t:"Add type annotations to this Python module.", s:"linear"},
  {t:"Draft a polite decline to this vendor email.", s:"linear"},

  /* ---------- search: explore a space, evaluate branches, commit ---------- */
  {t:"Design a rate limiter that survives a regional outage.", s:"search"},
  {t:"Figure out which of these three caching strategies we should use.", s:"search"},
  {t:"Come up with the best schema for storing versioned documents.", s:"search"},
  {t:"What's the optimal way to shard this table given our query patterns?", s:"search"},
  {t:"Plan a migration path from our monolith to services with zero downtime.", s:"search"},
  {t:"Propose an approach for deduplicating 200M records under a 4-hour window.", s:"search"},
  {t:"Work out a retry policy that won't amplify load during an incident.", s:"search"},
  {t:"Decide how to structure our multi-tenant permissions model.", s:"search"},
  {t:"Explore options for reducing our cold start latency.", s:"search"},
  {t:"Choose between event sourcing and CRUD for the orders service.", s:"search"},

  /* ---------- aggregation: many sources in, one synthesis out ---------- */
  {t:"Compare the four leading vector databases for our use case.", s:"aggregation"},
  {t:"Pull together what these five incident reports have in common.", s:"aggregation"},
  {t:"Synthesize the customer interview notes into themes.", s:"aggregation"},
  {t:"Summarize what the team decided across these twelve Slack threads.", s:"aggregation",alt:"linear"},
  {t:"Reconcile the differences between the spec and the implementation notes.", s:"aggregation"},
  {t:"Build a single view of our API surface from these three OpenAPI files.", s:"aggregation"},
  {t:"Consolidate the findings from the three vendor security questionnaires.", s:"aggregation"},
  {t:"What do these benchmark results collectively tell us?", s:"aggregation"},
  {t:"Merge the duplicate entries across both customer databases.", s:"aggregation"},
  {t:"Survey how other companies solve this and summarize the tradeoffs.", s:"aggregation"},

  /* ---------- verification: check an artifact against a standard ---------- */
  {t:"Review this pull request for correctness and style.", s:"verification"},
  {t:"Audit our IAM policies for over-permissioned roles.", s:"verification"},
  {t:"Check whether this implementation matches the RFC.", s:"verification"},
  {t:"Validate that these invoices add up correctly.", s:"verification"},
  {t:"Prove that this concurrent queue is free of deadlock.", s:"verification"},
  {t:"Confirm the migration script is idempotent.", s:"verification"},
  {t:"Test whether the new endpoint handles malformed input safely.", s:"verification"},
  {t:"Go through this contract and flag anything unusual.", s:"verification",alt:"linear"},
  {t:"Verify our backup restore actually works end to end.", s:"verification"},
  {t:"Inspect this Dockerfile for security problems.", s:"verification"},

  /* ---------- exploration: tool-driven, unknown path, iterative ---------- */
  {t:"Figure out why checkout latency spiked last Tuesday.", s:"exploration",tools:true},
  {t:"Track down the source of these duplicate webhook deliveries.", s:"exploration",tools:true},
  {t:"Investigate the memory leak in the worker pool.", s:"exploration",tools:true},
  {t:"Find out which service is calling the deprecated endpoint.", s:"exploration",tools:true},
  {t:"Debug why the integration tests fail only in CI.", s:"exploration",tools:true},
  {t:"Triage this alert and tell me whether to page someone.", s:"exploration",tools:true},
  {t:"Research current best practice for OAuth token rotation and report back.", s:"exploration",tools:true,alt:"aggregation"},
  {t:"Diagnose the root cause of the elevated 5xx rate.", s:"exploration",tools:true},
  {t:"Look through the logs and work out what preceded the crash.", s:"exploration",tools:true},
  {t:"Monitor the deploy and tell me if anything looks wrong.", s:"exploration",tools:true},

  /* ---------- adversarial: phrasings that historically misfired ---------- */
  // "review" appears but the work is a rewrite, not a check
  {t:"Review and rewrite this onboarding doc so new hires can follow it.", s:"linear",alt:"verification"},
  // "compare" appears but there are only two known options and a decision is wanted
  {t:"Compare these two error messages and pick the clearer one.", s:"linear",alt:"aggregation"},
  // "design" appears but the design is given; the job is transcription
  {t:"Write up the design we agreed on in the meeting as an ADR.", s:"linear",alt:"search"},
  // no trigger verbs at all, but genuinely a search problem
  {t:"We need something that keeps working when the primary region goes down.", s:"search",alt:"linear"},
  // no trigger verbs, genuinely aggregation
  {t:"Here are eight support tickets. What's the underlying issue?", s:"aggregation"},
  // "test" appears but it means "write tests", not "verify"
  {t:"Write unit tests for the pricing module.", s:"linear",alt:"verification"},
  // "plan" appears but it's a simple enumeration
  {t:"List the steps to rotate our API keys.", s:"linear",alt:"search"},
  // tools available but the task is a single lookup
  {t:"Read the config file and tell me the timeout value.", s:"linear",tools:true,alt:"exploration"},
  // "optimize" as a figure of speech, not a search problem
  {t:"Optimize this sentence for clarity.", s:"linear",alt:"search"},
  // multi-source but the merge is mechanical, not synthetic
  {t:"Concatenate these three log files in timestamp order.", s:"linear",alt:"aggregation"}
];

/** Cases where two shapes are defensible — used to check confidence reporting. */
export const ambiguousCases = shapeCases.filter(c => c.alt);
