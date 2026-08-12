/**
 * DEV shape cases — second tranche.
 *
 * These began life as a holdout set. The v2 classifier scored 33% on them versus
 * 98% on its tuning set, the twenty misses were inspected individually, and that
 * inspection burned them as an unbiased estimate. They are now a dev set and it
 * is fine to tune against them.
 *
 * The unbiased number comes from fixtures/shapes-holdout.js, which must stay
 * unread at the case level. See docs/EVALUATION.md.
 */
export const devCases = [
  /* linear */
  {t:"Shorten this changelog entry to one line.", s:"linear"},
  {t:"Put these release notes into our standard template.", s:"linear"},
  {t:"Change all the dates in this file to ISO format.", s:"linear"},
  {t:"Give me a one-paragraph version of this RFC.", s:"linear"},
  {t:"Annotate this SQL query with comments explaining each join.", s:"linear"},
  {t:"Produce a plain-English version of this error for end users.", s:"linear"},

  /* search */
  {t:"How should we structure retries so a slow dependency doesn't take us down?", s:"search"},
  {t:"We need a way to run these jobs that costs less than the current setup.", s:"search"},
  {t:"Come up with an indexing strategy for queries we can't predict in advance.", s:"search"},
  {t:"Settle whether we should build this in-house or buy it.", s:"search"},
  {t:"Find an approach that lets us deploy twice a day without breaking clients.", s:"search"},
  {t:"Suggest a layout for the dashboard that surfaces problems fastest.", s:"search"},

  /* aggregation */
  {t:"Take these nine postmortems and tell me what keeps going wrong.", s:"aggregation"},
  {t:"Roll up the quarterly numbers from each region into one summary.", s:"aggregation"},
  {t:"Given the notes from all six stakeholder calls, what do they actually want?", s:"aggregation"},
  {t:"Line up what each of the three proposals says about pricing.", s:"aggregation"},
  {t:"Bring together the scattered documentation on this subsystem.", s:"aggregation"},
  {t:"Across our repos, where do we still use the old auth library?", s:"aggregation"},

  /* verification */
  {t:"Does this implementation actually satisfy the acceptance criteria?", s:"verification"},
  {t:"Go over the terraform plan and tell me if anything is destructive.", s:"verification"},
  {t:"Make sure none of these endpoints leak PII in their responses.", s:"verification"},
  {t:"Assess whether this retry logic can double-charge a customer.", s:"verification"},
  {t:"Sanity-check these financial projections for arithmetic errors.", s:"verification"},
  {t:"Is this migration reversible if it fails halfway?", s:"verification"},

  /* exploration */
  {t:"Something is eating our database connections — work out what.", s:"exploration",tools:true},
  {t:"Users report intermittent logouts. Get to the bottom of it.", s:"exploration",tools:true},
  {t:"Follow the request through our services and tell me where it stalls.", s:"exploration",tools:true},
  {t:"Our bill jumped 40% last month. Determine what changed.", s:"exploration",tools:true},
  {t:"Chase down why this job silently stopped running in March.", s:"exploration",tools:true},
  {t:"Watch the canary and report anything anomalous.", s:"exploration",tools:true}
];
