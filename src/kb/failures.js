/**
 * KB: Failure-mode taxonomies.
 * Provenance: gpt-5.6-luna-xhigh §1.13, claude-opus-5-low §1.2, gpt-5.6-terra-xhigh
 * reflection/multi-agent failure tables. These drive the diagnostic engine —
 * each entry carries a detection signal so the compiler can warn *before* a run.
 */

/** Long-context failure modes (claude-opus-5-low §1.2 — the canonical four). */
export const longContext = [
  {id:"poisoning", name:"Context Poisoning",
   mech:"A hallucinated fact or plan enters history and is repeatedly re-conditioned on.",
   signal:"The same wrong claim reappears across turns.",
   fix:"Validation gates before writing to memory; quarantine tool outputs; periodic re-ground from source."},
  {id:"distraction", name:"Context Distraction",
   mech:"Long history dominates instructions; the model imitates history rather than following system rules.",
   signal:"Model repeats the prior turn's structure and ignores a new constraint.",
   fix:"Re-inject system invariants at the tail; hard compaction; reduce history depth."},
  {id:"confusion", name:"Context Confusion",
   mech:"Too many tools or too much irrelevant content leads to wrong tool selection.",
   signal:"Tool-choice error rate rises as tool count rises.",
   fix:"Dynamic tool subsetting (RAG over tool descriptions); cap active tools at ~10–20."},
  {id:"clash", name:"Context Clash",
   mech:"Contradictory information across turns or documents.",
   signal:"Oscillating answers; excessive hedging.",
   fix:"Conflict-detection pass; recency + authority precedence rules; explicit `precedence:` field in the constitution."}
];

/** Context-rot failure modes (gpt-5.6-luna-xhigh §1.13 — the operational ten). */
export const contextRot = [
  {name:"Token saturation",        desc:"Useful content is displaced by low-value history.",     fix:"Budgeting, retrieval, compression"},
  {name:"Lost in the middle",      desc:"Important information is buried in long context.",       fix:"Ordering, anchors, evidence targeting"},
  {name:"Contradictory memory",    desc:"Old and new facts are both retrieved.",                  fix:"Supersession, timestamps, authority ranking"},
  {name:"Recursive summary drift", desc:"Repeated summaries change meaning.",                     fix:"Source retention, summary validation"},
  {name:"Instruction contamination",desc:"Data is interpreted as instructions.",                  fix:"Trust labels, delimiters, policy hierarchy"},
  {name:"Tool catalog bloat",      desc:"Too many tools reduce selection quality.",               fix:"Intent-based tool filtering"},
  {name:"Tool-result flooding",    desc:"Large outputs crowd out task state.",                    fix:"Pagination, extraction, summarization"},
  {name:"Context rot",             desc:"Stale or irrelevant state remains active.",              fix:"TTL, checkpoints, state compaction"},
  {name:"Handoff loss",            desc:"Important decisions disappear between agents.",          fix:"Typed handoff package and artifact references"},
  {name:"Policy dilution",         desc:"Safety rules become less salient in long prompts.",      fix:"External enforcement and pinned policy block"}
];

/** Reflection failure modes (gpt-5.6-terra-xhigh). Why bounded reflection exists. */
export const reflection = [
  {name:"Correlated self-confirmation", why:"Generator and critic share the same model bias and context.",
   fix:"Use deterministic validators, separate prompts, different models, or independent evidence."},
  {name:"Infinite revision loop", why:"The critic keeps finding stylistic issues with no completion threshold.",
   fix:"Set maximum iterations and a repairability policy."},
  {name:"Vague critique", why:"'Improve clarity' does not map to an actionable repair.",
   fix:"Require critiques to reference failed rubric IDs and evidence."},
  {name:"Reward hacking", why:"The model optimizes the visible rubric while violating user intent.",
   fix:"Use hidden holdouts, adversarial tests, and human review."},
  {name:"Context contamination", why:"The candidate includes injected content that the critic then repeats.",
   fix:"Preserve typed provenance and isolate untrusted text."}
];

/** Multi-agent failure modes (gpt-5.6-terra-xhigh §3.7). Why the router avoids fan-out. */
export const multiAgent = [
  {name:"Shared-model correlation", desc:"Multiple agents on the same model and context reproduce the same error."},
  {name:"Context fan-out leakage",  desc:"Sensitive data is unnecessarily copied into many agent contexts."},
  {name:"Consensus illusion",       desc:"Agreement is not evidence when all agents rely on the same unsupported source."},
  {name:"Coordination overhead",    desc:"Agents spend more tokens negotiating than solving."},
  {name:"Authority confusion",      desc:"A reviewer must not gain authority to alter policy merely by identifying a problem."}
];

/**
 * Compression ladder, ordered by increasing information loss.
 * Provenance: claude-opus-5-low §1.4. Rung 6 is the highest-leverage technique for long agents.
 */
export const compressionLadder = [
  {rung:1, name:"Deduplication",            detail:"Hash-based near-duplicate removal of chunks/tool outputs.", saving:"10–30%", loss:"minimal"},
  {rung:2, name:"Structural pruning",       detail:"Strip boilerplate, HTML chrome, license headers, repeated stack frames.", saving:"20–60% on raw web/log data", loss:"low"},
  {rung:3, name:"Field projection",         detail:"For JSON/tabular tool output, select only the schema fields the task needs.", saving:"50–90%", loss:"low"},
  {rung:4, name:"Extractive summarization", detail:"Keep verbatim salient sentences (preserves quotability and citations).", saving:"variable", loss:"medium"},
  {rung:5, name:"Abstractive summarization",detail:"LLM condensation with a fixed schema. Highest ratio, highest risk of drift.", saving:"high", loss:"high"},
  {rung:6, name:"Artifact offload",         detail:"Write full content to a store, keep a pointer + 200-token abstract. Preferred for anything >2k tokens.", saving:"near-total", loss:"none (retrievable)"}
];

/**
 * Calibration signals for selective prediction / abstention.
 * Provenance: gpt-5.5-xhigh §3.3, gpt-5.6-terra-xhigh §3.5.
 * Note: token probabilities and sample agreement are NOT calibrated probabilities
 * of correctness. Calibration must be learned on held-out data resembling
 * production traffic, and monitored for drift after any model/prompt/retriever change.
 */
export const calibrationSignals = [
  {name:"agreement_rate",          reading:"High agreement usually implies lower uncertainty."},
  {name:"answer_entropy",          reading:"High entropy implies ambiguity or model instability."},
  {name:"verifier_score_variance", reading:"High variance implies unstable candidate quality."},
  {name:"evidence_overlap",        reading:"Low overlap suggests weak grounding."},
  {name:"schema_pass_rate",        reading:"Low pass rate suggests prompt/schema mismatch."}
];

/** Aggregation methods for multi-sample convergence (gpt-5.5-xhigh). */
export const aggregationMethods = [
  {method:"Exact majority vote",      fit:"Multiple choice, arithmetic"},
  {method:"Semantic clustering",      fit:"Free-text answers"},
  {method:"Verifier scoring",         fit:"Code, math, policy"},
  {method:"Weighted confidence vote", fit:"Calibrated models"},
  {method:"Pairwise tournament",      fit:"Long-form alternatives"},
  {method:"Citation overlap",         fit:"Evidence-grounded QA"}
];
