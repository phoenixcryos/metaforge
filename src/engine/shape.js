/**
 * ENGINE: task shape classification.
 *
 * Shape drives topology, and topology is the most consequential decision
 * MetaForge makes: Tree-of-Thoughts is transformative on search-shaped work and
 * a 10–100× tax on linear work. A wrong shape is the most expensive error here.
 *
 * ── Design history (read before editing) ──────────────────────────────────
 * v1 was five regexes with last-match-wins: no tie-breaking, no confidence.
 *
 * v2 scored five shapes with long lists of literal phrases. It hit 98.3% on its
 * tuning set and 33.3% on held-out cases — a textbook overfit. Every held-out
 * miss collapsed to `linear` because no other shape's vocabulary matched at all.
 * The lesson: matching surface phrasings memorizes the fixture. Real inputs are
 * paraphrases.
 *
 * v3 (this file) matches on VERB CLASSES and STRUCTURAL FRAMES instead. A verb
 * class is a semantic family ("merge-like verbs") covering many lexicalizations;
 * a frame is a syntactic shape ("does/is/can <artifact> <property>?" = a yes/no
 * question about an existing thing). These transfer to unseen phrasings because
 * they encode what the user is *asking for*, not how they said it.
 *
 * Tuned against fixtures/shapes.js + fixtures/shapes-dev.js.
 * Unbiased estimate from fixtures/shapes-holdout.js — see docs/EVALUATION.md.
 */

export const SHAPES = ["linear","search","aggregation","verification","exploration"];

/* ── Verb classes ───────────────────────────────────────────────────────────
 * Each is a single alternation covering the common lexicalizations of one
 * semantic family, with morphology folded in (-e/-ing/-ed/-s).
 * Add synonyms here rather than adding new phrase-specific rules below. */

const V = {
  // combine several inputs into one output
  merge: /\b(consolidat|synthesi[sz]|reconcil|aggregat|collat|unif|merg|combin|contrast|survey)(e|es|ed|ing|ation|s)?\b|\broll(ing|ed)? up\b|\bbring(ing)? together\b|\bline up\b|\bpull(ing)? together\b|\bcross-?referenc\w*\b|\bcompar(e|es|ed|ing|ison)\b|\bcollectively\b|\bin common\b|\bthemes?\b|\bwhat do (these|the|all)\b/,

  // hold an existing artifact against a standard
  check: /\b(verif|validat|audit|inspect|review|confirm|assess|evaluat)(y|ies|ied|ying|e|es|ed|ing|ion)?\b|\bcheck(ing|s|ed)?\b|\bmake sure\b|\bensure\b|\bsanity[- ]check\b|\bgo(ing)? over\b|\blook(ing)? over\b|\bdouble[- ]check\b|\bprove\b|\bsatisf(y|ies)\b|\bconform\w*\b|\bcompl(y|ies|iance)\b|\btest(ing)? (whether|that|if|for)\b|\bgo(ing)? through\b|\bflag(ging)? (any|anything|all|issues|problems)\b|\bscan(ning)? (this|the|for)\b/,

  // find out something currently unknown, by looking
  discover: /\b(investigat|diagnos|debug|triag)(e|es|ed|ing|is|ion)?\b|\btrack(ing)? down\b|\bchase(ing)? down\b|\bchasing down\b|\bget(ting)? to the bottom\b|\bwork(ing)? out\b|\bfigure? out\b|\bfind(ing)? out\b|\bdetermin(e|ing)\b|\broot cause\b|\btrac(e|ing)\b|\bfollow(ing)? the\b|\bdig(ging)? (in|into)\b|\bmonitor(ing)?\b|\bwatch(ing)?\b|\bnarrow(ing)? down\b|\bresearch(ing)?\b|\breport back\b|\blook(ing)? (through|into|at) the\b/,

  // invent or select an approach that does not yet exist
  design: /\b(design|architect|structur|devis|formulat)(e|es|ed|ing)?\b|\bpropos(e|es|ed|ing)\b|\bsuggest(s|ed|ing)?\b|\brecommend(s|ed|ation|ing)?\b|\bcome up with\b|\bchoos(e|ing)\b|\bdecid(e|ing)\b|\bsettl(e|ing)\b|\bselect(ing)?\b|\bpick(ing)?\b|\boptimi[sz](e|ing|ation)\b|\bplan(ning)?\b|\bstrateg(y|ies)\b|\bapproach\b|\bfigure out how\b|\bexplor(e|ing) (options|approaches|ways|alternatives)\b|\boptions? for\b|\balternativ(e|es)\b|\btrade-?offs?\b|\bwe need (a way|something|an? \w+ that)\b/,

  // rewrite one input into one output, meaning preserved
  transform: /\b(rewrit|rephras|reword|translat|convert|transform|reformat|shorten|condens|annotat|paraphras)(e|es|ed|ing)?\b|\bsummari[sz](e|es|ed|ing)\b|\bturn(ing)? (this|these|it) into\b|\bput(ting)? (this|these) into\b|\brenam(e|ing)\b|\bdraft(ing)?\b|\bwrite up\b|\bclean(ing)? up\b|\bformat(ting)?\b|\bgive me a\b|\bproduce a\b|\bmake (this|it) \w+er\b/
};

/* ── Structural frames ────────────────────────────────────────────────────── */

const F = {
  // "does X …?", "is X …?", "can X …?" — yes/no question about an existing thing
  yesNoQuestion: /^\s*(does|do|is|are|was|were|can|could|will|would|should|has|have|did)\b[^?]*\?/,

  // "how should we", "what's the best", "which … should" — asks for a choice
  deonticQuestion: /\b(how|what|which|where|when)\b[^?]*\b(should|could|would|ought to|best way|best approach|do you recommend)\b/,

  // superlative/optimality target
  optimality: /\b(?!best practices?\b)(best|optimal|fastest|cheapest|simplest|safest|most \w+|least \w+)\b|\b\w+est\b(?= (way|approach|option|design|strategy))/,

  // "why …", "what caused", "what changed" — asks for an unknown cause
  causalUnknown: /\bwhy\b|\bwhat (caused|changed|triggered|happened|led to|is causing|'s causing)\b|\bwhere\b[^?]*\b(stall|fail|break|hang|slow|go(es)? wrong)\w*\b|\bwhat(?:'s| is) (eating|consuming|blocking)\b/,

  // plural sources: "these nine", "all six", "each region", "across our"
  multiplicity: /\b(these|those|the|all|both|each|every)\s+(\d+|two|three|four|five|six|seven|eight|nine|ten|dozen|several|various|multiple)\b|\b(these|those)\s+\w+(s|es)\b|\bacross (our|the|these|all)\b|\bfrom each\b|\beach of (the|these|our)\b|\bevery (one of|single)\b|\bmultiple\b|\bseveral\b/,

  // enumerated inputs handed over: "here are the notes from", "attached are"
  suppliedSet: /\b(here (are|is)|attached (are|is)|below (are|is)|i(?:'ve| have) (attached|pasted|collected))\b/,

  // a named unknown to be located: "which of", "where do we still", "who owns"
  locateUnknown: /\bwhich (of|ones?|files?|services?|repos?)\b|\bwhere do we\b|\bwho (owns|wrote|touched)\b|\bwhat else\b/,

  // constraint-under-tension: two competing requirements in one sentence
  tension: /\bwithout (downtime|disruption|breaking|losing|regress\w*)\b|\bbut (still|also|without)\b|\bwhile (still|keeping|maintaining|preserving)\b|\bso (that )?\w+ (doesn'?t|won'?t|can'?t)\b|\bcosts? less\b|\bunder (a |an )?[\w-]+ (budget|window|limit|constraint)\b|\bcan'?t predict\b|\bunpredictable\b|\bkeeps? working\b|\bsurviv(e|es|ing)\b|\bgoes down\b|\bfail(s|ure) of\b|\bwhen the \w+ (region|node|service|primary|replica) \w+\b/,

  // failure/incident vocabulary — something is wrong right now
  incident: /\b(intermittent|flaky|spik(e|ed|ing)|regress\w+|leak\w*|crash\w*|outage|5\d\d\b|timeout\w*|stall\w*|silently|anomal\w+|jumped \d|dropped \d)\b|\bstopped (running|working)\b|\breports? (of )?\w*(error|problem|issue|fail)/,

  // safety/harm framing — asks whether something bad can happen
  harmCheck: /\b(leak|expos|double-?charg|destructiv|revers\w+|data ?loss|unsafe|vulnerab\w+|over-?permission\w*|inject\w*|deadlock|race condition|idempoten\w+)\w*\b|\b(safely|correctly|properly|accurately)\b|\bmalformed\b|\bedge cases?\b|\banything (unusual|wrong|odd|suspicious|off)\b|\badds? up\b/,

  // single concrete artifact in hand
  singleArtifact: /\bthis (file|function|query|paragraph|sentence|entry|doc|document|email|error|snippet|class|method|readme|changelog|rfc)\b|\bthe (attached|following|above)\b|\bthe \w+ (file|function|query|script|config|table|module|endpoint|column)\b/
};

/**
 * Feature → shape weights. Each entry is [test, weight].
 * Weights: 3 = near-decisive, 2 = strong, 1 = supporting, negative = counter-evidence.
 */
function score(t, tools){
  const s = {linear:0, search:0, aggregation:0, verification:0, exploration:0};
  const hit = (re) => re.test(t);

  /* Verb-class evidence — the primary signal */
  if(hit(V.merge))     { s.aggregation += 3.0; }
  if(hit(V.check))     { s.verification += 2.5; }
  if(hit(V.discover))  { s.exploration += 2.5; s.search += 0.5; }
  if(hit(V.design))    { s.search += 2.5; }
  if(hit(V.transform)) { s.linear += 2.5; }

  /* Structural frames — disambiguate when verbs collide or are absent */
  if(hit(F.yesNoQuestion))   s.verification += 2.5;
  if(hit(F.deonticQuestion)) s.search += 2.5;
  if(hit(F.optimality))      s.search += 1.5;
  if(hit(F.tension))         s.search += 2.0;
  if(hit(F.causalUnknown))   s.exploration += 2.5;
  if(hit(F.incident))        s.exploration += 1.5;
  if(hit(F.multiplicity))    s.aggregation += 2.5;
  if(hit(F.suppliedSet))     s.aggregation += 1.5;
  if(hit(F.locateUnknown))   { s.aggregation += 1.0; s.exploration += 1.0; }
  if(hit(F.harmCheck))       s.verification += 2.0;
  if(hit(F.singleArtifact))  s.linear += 1.5;

  /* Snapshot raw evidence BEFORE disambiguation.
   *
   * This split is what keeps confidence honest. The interaction rules below are
   * tie-breakers: they encode "when these two features co-occur, prefer X". They
   * routinely swing a score by 3-4 points, which — if confidence were read off
   * the final margin — would report near-certainty on exactly the inputs that
   * needed a tie-breaker to decide. That is backwards.
   *
   * So: the DECISION uses the adjusted scores, but CONFIDENCE is measured
   * against raw evidence. A task where two shapes both had strong raw support
   * reports low confidence even when the tie-break was decisive, which is
   * precisely the signal router.js gates on. */
  const raw = {...s};

  /* Interactions — where the naive additive model gets it wrong */

  // A yes/no question about harm is verification, not exploration, even though
  // incident words are present: the answer is a verdict, not an investigation.
  if(hit(F.yesNoQuestion) && hit(F.harmCheck)) { s.verification += 1.5; s.exploration -= 1.5; }

  // "compare"/"line up" across a supplied set is aggregation even though
  // choosing among options looks like search.
  if(hit(V.merge) && hit(F.multiplicity)) { s.aggregation += 1.5; s.search -= 1.0; }

  // Design verbs + tension = genuine search. Design verbs on a single artifact
  // ("suggest a better wording for this sentence") is a linear edit.
  if(hit(V.design) && hit(F.singleArtifact) && !hit(F.tension)) { s.search -= 2.0; s.linear += 1.5; }

  // Transform verbs are weak evidence when a stronger frame is present:
  // "summarize what these nine reports have in common" is aggregation.
  if(hit(V.transform) && hit(F.multiplicity)) { s.linear -= 2.0; s.aggregation += 1.0; }

  // "review and rewrite" is authoring, not verification.
  if(/\breview(ing)? and (rewrit|revis|edit|updat|clean)\w*/.test(t)) { s.verification -= 3.5; s.linear += 2.0; }

  // Writing tests is authoring; running/checking them is verification.
  if(/\bwrite (unit |integration |e2e |the )?tests?\b|\badd (unit |integration )?tests?\b/.test(t)) {
    s.verification -= 3.0; s.linear += 2.0;
  }

  // An explicit check verb with a propositional complement ("validate that …")
  // is a verdict on a claim; the plural subject inside the claim is incidental.
  if(hit(V.check) && /\b(that|whether|if)\b/.test(t)) { s.verification += 2.0; s.aggregation -= 1.5; }

  // Survey/compare + a summarize verb: the merge is the work, the summary is
  // just the output format, so the transform verb must not outrank it.
  if(hit(V.merge) && hit(V.transform)) { s.aggregation += 1.5; s.linear -= 1.5; }

  // Exactly two items compared is a single pass, not a synthesis across sources.
  // Two supplied items is a pairwise comparison — one pass over both — not a
  // synthesis across many sources. Note this keys on the deictic "these/the two"
  // and NOT on bare "both": "merge duplicates across both databases" is still
  // aggregation, because the deliverable is a combined artifact.
  if(/\b(these|those|the) two\b/.test(t)) { s.aggregation -= 3.0; s.linear += 1.0; }

  // A comparison whose output is a single choice ("pick the clearer one") is a
  // judgement call in one pass; a comparison whose output is a combined artifact
  // is aggregation. The deliverable disambiguates the verb.
  if(/\bpick (the|one|whichever)\b|\bchoose the\b|\bwhich (one|is) (is )?(better|clearer|faster|safer|best)\b|\bthe (clearer|better|best) one\b/.test(t)) {
    s.aggregation -= 2.0; s.linear += 1.5;
  }

  // Retrieving one named value from one named artifact is a lookup, even with
  // tools available and an imperative "read/check the file" framing.
  if(/\btell me the\b|\bwhat(?:'s| is) the\b/.test(t) && hit(F.singleArtifact)) {
    s.linear += 2.0; s.exploration -= 1.5;
  }

  // Mechanical combination in a fixed order is linear, not synthesis.
  if(/\bconcatenat\w*\b|\bin (timestamp|alphabetical|numeric|chronological) order\b|\bappend\b/.test(t)) {
    s.aggregation -= 3.0; s.linear += 2.0;
  }

  /* Tool availability gates exploration.
   * Without tools an "investigate" brief cannot run a loop — the intent is real
   * but it resolves to reasoning, so redistribute rather than zeroing silently. */
  if(!tools){
    if(s.exploration > 0){
      s.verification += s.exploration * 0.35;
      s.search       += s.exploration * 0.25;
    }
    s.exploration = -1;
  } else {
    // tools present is itself mild evidence for an agentic loop
    s.exploration += 0.75;
  }

  /* Linear is the prior: with no positive evidence anywhere, a task is a
   * single pass. Small enough to lose to any real signal. */
  s.linear += 0.75;
  raw.linear += 0.75;
  if(!tools) raw.exploration = -1;

  return {adj:s, raw};
}

/** Domains whose shape is inherent in the work, regardless of phrasing. */
export const DOMAIN_SHAPE = {
  extract:"linear", writing:"linear", research:"aggregation",
  security:"verification", arch:"search", legal:"verification"
};

/**
 * @param {string} text  task + constraints + deliverable, any case
 * @param {{tools?:boolean}} opts
 * @returns {{shape,confidence,scores,runnerUp,ambiguous}}
 *
 * confidence ∈ [0,1] from the margin between first and second place, so a task
 * with two equally plausible readings reports ~0.5 rather than false certainty.
 */
export function classifyShape(text, opts = {}){
  const t = (text||"").toLowerCase();
  const {adj, raw} = score(t, !!opts.tools);

  // Decision: adjusted scores (tie-breakers applied).
  const ranked = SHAPES.map(x => [x, adj[x]]).sort((a,b) => b[1]-a[1]);
  const [top]    = ranked[0];
  const [second] = ranked[1];

  // Confidence: raw evidence margin between the chosen shape and its strongest
  // rival. If a rival had comparable raw support, this is a close call no matter
  // how decisively the interaction rules resolved it.
  const rivalRaw = Math.max(...SHAPES.filter(x => x !== top).map(x => raw[x]));
  const rawMargin = raw[top] - rivalRaw;
  let confidence = Math.max(0, Math.min(1, 0.5 + rawMargin/6));

  // Cap: a shape chosen against the raw evidence (the tie-break overturned the
  // leader) can never be reported as high-confidence.
  if(rawMargin <= 0) confidence = Math.min(confidence, 0.55);

  return { shape: top, runnerUp: second, confidence,
           ambiguous: confidence < 0.6, scores: adj, rawScores: raw };
}

/**
 * Full resolution including domain override. Domain beats phrasing: a user who
 * selected "security" is doing verification work even if they wrote "look at
 * our IAM setup".
 */
export function resolveShape(S, text){
  const c = classifyShape(text, {tools: !!S.tools});

  if(S.domain === "agent" && S.tools){
    return {...c, shape:"exploration", confidence:Math.max(c.confidence,0.85),
            ambiguous:false, override:"domain:agent+tools"};
  }
  if(DOMAIN_SHAPE[S.domain]){
    const forced = DOMAIN_SHAPE[S.domain];
    return {...c, shape:forced,
            confidence: c.shape===forced ? Math.max(c.confidence,0.85) : 0.7,
            ambiguous: c.shape!==forced && c.confidence>0.75,
            override:`domain:${S.domain}`};
  }
  return c;
}
