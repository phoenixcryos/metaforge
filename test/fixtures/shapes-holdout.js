/**
 * HELD-OUT shape cases — the unbiased generalization estimate.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  DO NOT TUNE AGAINST THIS FILE.
 *
 *  The weights and features in src/engine/shape.js were fitted against
 *  fixtures/shapes.js and fixtures/shapes-dev.js, and score 100% on both. That
 *  number is meaningless as a predictor of real-world accuracy — an earlier
 *  version scored 98% on its tuning set and 33% on unseen cases.
 *
 *  This file is the control. Run it, record the aggregate, and stop. If you
 *  inspect individual misses closely enough to fix them, this set is burned:
 *  move it to shapes-dev.js and write a new holdout. A holdout you have
 *  optimized against is just a slow training set.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Third tranche. Deliberately avoids the vocabulary of both tuning sets:
 * different verbs, different sentence moods, some terse and some verbose,
 * including fragments and multi-sentence briefs of the kind users actually type.
 */
export const holdoutCases = [
  /* linear — one pass over one input */
  {t:"Tighten this abstract to under 150 words.", s:"linear"},
  {t:"Swap the British spellings in this doc for American ones.", s:"linear"},
  {t:"I need this Java method expressed in Go.", s:"linear"},
  {t:"Bullet-point version of the attached memo, please.", s:"linear"},
  {t:"Fill in the missing alt text on the images in this page.", s:"linear"},
  {t:"Restate the third paragraph so a non-lawyer follows it.", s:"linear"},

  /* search — generate and evaluate candidate approaches */
  {t:"Our nightly batch overruns its window. What are our realistic paths forward?", s:"search"},
  {t:"Need a caching layer that stays correct when two writers race.", s:"search"},
  {t:"Weigh Postgres against DynamoDB for this access pattern and land on one.", s:"search"},
  {t:"Sketch a rollout that lets us back out cleanly at any stage.", s:"search"},
  {t:"What's a sane way to version this API so old clients keep functioning?", s:"search"},
  {t:"Think through how we'd support offline mode without rewriting the sync layer.", s:"search"},

  /* aggregation — many inputs, one combined artifact */
  {t:"I've pasted twelve support tickets below. What's the recurring complaint?", s:"aggregation"},
  {t:"Fold the findings from each of the four audits into one register.", s:"aggregation"},
  {t:"Every team submitted a roadmap. Produce the combined picture.", s:"aggregation"},
  {t:"Where do these vendor contracts disagree about liability?", s:"aggregation"},
  {t:"Stitch the partial schemas from our services into a canonical one.", s:"aggregation"},
  {t:"Summarize what the last five incident reviews say about on-call load.", s:"aggregation"},

  /* verification — judge an existing artifact against a standard */
  {t:"Would this policy actually stop the attack described in the writeup?", s:"verification"},
  {t:"Read the PR and tell me if it breaks backward compatibility.", s:"verification"},
  {t:"Confirm the totals in this spreadsheet match the ledger.", s:"verification"},
  {t:"Any way a user could escalate privileges through this endpoint?", s:"verification"},
  {t:"Judge whether these citations actually support the claims made.", s:"verification"},
  {t:"Has this runbook drifted from what the service does now?", s:"verification"},

  /* exploration — act, observe, iterate toward an unknown */
  {t:"Checkout times doubled sometime last week. Find the change responsible.", s:"exploration",tools:true},
  {t:"Poke around the cluster and tell me what's holding those pods pending.", s:"exploration",tools:true},
  {t:"No idea why the nightly export is empty now. Have a look.", s:"exploration",tools:true},
  {t:"Reproduce the customer's crash and identify the trigger.", s:"exploration",tools:true},
  {t:"Comb the audit log for how that record got modified.", s:"exploration",tools:true},
  {t:"Keep an eye on the queue depth and surface whatever's abnormal.", s:"exploration",tools:true}
];
