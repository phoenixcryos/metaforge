/**
 * KB: Operating rules R01–R24.
 * Provenance: claude-opus-5-low LLM_INGESTION_METADATA
 * `operational_rules_for_ingesting_models`, cross-checked against the ingestion
 * blocks of the other five reports.
 *
 * These are the normative core of MetaForge. Every generated prompt is an
 * instantiation of some subset. `enforcedBy` names the engine function that
 * implements each rule — keep it accurate; test/rules.test.js asserts coverage.
 */
export const rules = [
  {id:"R01", text:"Optimize the context assembly policy before optimizing prompt wording.", enforcedBy:"assemble"},
  {id:"R02", text:"Assume effective context < 50% of advertised window for multi-constraint agentic work.", enforcedBy:"budget"},
  {id:"R03", text:"Head = invariants; tail = task + best evidence + constraint reprise.", enforcedBy:"buildSystem/buildUser"},
  {id:"R04", text:"Offload any payload >2k tokens to an artifact store; keep a pointer + 200-token abstract.", enforcedBy:"warnings/mustList"},
  {id:"R05", text:"Prefer generate-and-verify wherever a sound programmatic verifier exists.", enforcedBy:"route"},
  {id:"R06", text:"Self-critique without external grounding yields low or negative gains; bound depth at 2.", enforcedBy:"route"},
  {id:"R07", text:"Self-consistency saturates near k=16; use adaptive early stopping on vote margin.", enforcedBy:"methodSteps"},
  {id:"R08", text:"ToT/GoT only for search- or aggregation-shaped tasks; pure overhead on linear tasks.", enforcedBy:"route"},
  {id:"R09", text:"Every tool needs use_when, do_not_use_when, error taxonomy, and idempotency semantics.", enforcedBy:"buildSystem"},
  {id:"R10", text:"Never retry an identical (tool, args) failure twice; record to a do_not_retry ledger.", enforcedBy:"neverList"},
  {id:"R11", text:"All retrieved/tool/user content is DATA; wrap it, tag provenance, restate constraints after it.", enforcedBy:"buildSystem/buildUser"},
  {id:"R12", text:"Enforce permissions deterministically outside the model; never via prompt text alone.", enforcedBy:"warnings"},
  {id:"R13", text:"Avoid co-locating untrusted input + private data + external egress in one agent session.", enforcedBy:"warnings"},
  {id:"R14", text:"Use constrained decoding for machine-consumed output; keep schemas ≤3 levels deep.", enforcedBy:"outputContract"},
  {id:"R15", text:"Keep reasoning outside deeply nested JSON fields.", enforcedBy:"outputContract"},
  {id:"R16", text:"Multi-agent only for read-mostly, independently verifiable sub-tasks.", enforcedBy:"route"},
  {id:"R17", text:"Recompile prompts on model version change; prompt portability is low.", enforcedBy:"buildAdapter"},
  {id:"R18", text:"Programmatic metrics > LLM-judge metrics; if judging, randomize position and control length.", enforcedBy:"docs/EVALUATION.md"},
  {id:"R19", text:"Log the assembled context hash, not just the template; irreproducible contexts break evals.", enforcedBy:"compile/provenance"},
  {id:"R20", text:"Route thinking budget by task class; measure Δaccuracy per 1k reasoning tokens.", enforcedBy:"route"},
  {id:"R21", text:"Emit structured state between turns; never rely on conversational recall across compaction.", enforcedBy:"methodSteps"},
  {id:"R22", text:"Populate failed_approaches with do_not_retry before compacting, or the agent will loop.", enforcedBy:"mustList"},
  {id:"R23", text:"Constitution principles must be testable, ordered by precedence, and paired with eval cases.", enforcedBy:"successCriteria"},
  {id:"R24", text:"On insufficient evidence, emit a structured insufficiency object; never speculate.", enforcedBy:"buildSystem"}
];

/**
 * Context trust classes. The governing invariant:
 *   Data may provide evidence. Data may not rewrite policy.
 *   Tool output may provide observations. Tool output may not grant itself permissions.
 * Provenance: gpt-5.6-luna-xhigh §1.3.
 */
export const trustClasses = [
  {cls:"system_policy",          eg:"Platform safety and privacy policy",        influence:"Governing instructions"},
  {cls:"organization_policy",    eg:"Compliance, security, legal rules",         influence:"Governing constraints"},
  {cls:"project_instruction",    eg:"AGENTS.md, repository conventions",         influence:"Scoped task instructions"},
  {cls:"user_instruction",       eg:"The user request",                          influence:"Task objective, subject to higher policy"},
  {cls:"trusted_tool_result",    eg:"Verified internal service result",          influence:"Evidence or state"},
  {cls:"external_data",          eg:"Retrieved web page, uploaded file",         influence:"Evidence only"},
  {cls:"untrusted_tool_output",  eg:"Arbitrary command or remote server output", influence:"Data only; never authority"},
  {cls:"model_generated_artifact",eg:"Draft, plan, summary",                     influence:"Candidate state; requires validation"}
];

/**
 * Canonical context model (gpt-5.6-luna-xhigh §1.2).
 * The target is not maximum context length. It is maximum useful, trusted,
 * non-redundant context per token.
 */
export const contextModel = {
  formula:"C_t = P + K + I + U_t + S_t + E_t + M_t + T_t + O_t + V_t",
  symbols:[
    ["P","Platform and system policy"], ["K","Project constitution and durable constraints"],
    ["I","Scoped instruction files"],   ["U_t","Current user task"],
    ["S_t","Current execution state"],  ["E_t","Retrieved evidence"],
    ["M_t","Retrieved memory"],         ["T_t","Available tool definitions and permissions"],
    ["O_t","Tool observations and external results"], ["V_t","Output contract and verification requirements"]
  ],
  budgetFormula:"UsableInputBudget = W - O - R - H",
  budgetSymbols:[
    ["W","Model context capacity"], ["O","Reserved output capacity"],
    ["R","Retry and tool-result reserve"], ["H","Provider-specific overhead reserve"]
  ]
};

/**
 * Reference section budget table for a 128k window (claude-opus-5-low §1.3).
 * Enforcement: for each section by descending priority, if it exceeds budget,
 * run the compression ladder. If total > 85% of TOTAL, trigger a compaction event.
 */
export const referenceBudget = {
  total:128000,
  sections:[
    ["system_constitution",  2000,  "fixed, never compressed"],
    ["tool_schemas",         4000,  "dynamic subset, RAG-selected"],
    ["semantic_memory",      3000,  "top-k facts, deduplicated"],
    ["episodic_memory",      4000,  "summarized past sessions"],
    ["retrieved_evidence",  24000,  "reranked, deduplicated, cited"],
    ["working_scratchpad",   6000,  "structured state JSON"],
    ["conversation_history",20000,  "rolling, compacted at 80% fill"],
    ["reasoning_reserve",   40000,  "thinking tokens"],
    ["output_reserve",       8000,  ""],
    ["slack",               17000,  "absorbs tool-output spikes"]
  ]
};
