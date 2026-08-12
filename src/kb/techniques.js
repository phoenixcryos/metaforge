/**
 * KB: Technique comparison matrix.
 * Provenance: merged ARCHITECTURAL_COMPARISON_MATRIX from all six model reports.
 * Figures are indicative engineering ranges, NOT guarantees. See docs/PROVENANCE.md.
 */
export const techniques = [
  {id:"zeroshot", name:"Zero-shot direct", mech:"Single forward pass, no scaffold", cost:"1× / 1×", gain:"baseline", use:"Classification, extraction, short rewrites on strong models", shapes:["linear"]},
  {id:"fewshot", name:"Few-shot / k-NN exemplars", mech:"In-context demonstrations retrieved per query", cost:"1.2–4× tok / 1× lat", gain:"10–35% ↓ format & style error", use:"Format-sensitive tasks, domain jargon, label taxonomies", shapes:["linear"]},
  {id:"cot", name:"Chain-of-Thought", mech:"Explicit intermediate token generation", cost:"1.5–4×", gain:"15–50% ↓ multi-step arithmetic/logic; ~0 on retrieval-bound", use:"Math, planning, causal / multi-hop reasoning", shapes:["linear","search"]},
  {id:"sc", name:"Self-Consistency (SC@k)", mech:"k stochastic CoT samples + majority vote", cost:"k× (k=5–40) / 1× if parallel", gain:"10–25% ↓ over single CoT; saturates ≈ k=16", use:"Verifiable-answer tasks with canonical form", shapes:["linear"]},
  {id:"bon", name:"Best-of-N + Verifier/PRM", mech:"Sample N, rank with reward/process model", cost:"N× gen + N× scoring", gain:"20–45% ↓ vs single sample", use:"Code gen, math, structured plans where a scorer exists", shapes:["verification"]},
  {id:"tot", name:"Tree-of-Thoughts", mech:"BFS/DFS over thought states, self-eval of branches, backtracking", cost:"10–100× tok / 5–30× lat", gain:"Game-of-24 class: 4% → 74%; near-zero on linear tasks", use:"Combinatorial puzzles, constrained planning, design search", shapes:["search","exploration"]},
  {id:"got", name:"Graph-of-Thoughts", mech:"DAG of thoughts with aggregate / refine / merge operators", cost:"8–60× / 4–20×", gain:"10–30% ↑ over ToT on aggregation-shaped tasks", use:"Sorting/merging, doc synthesis, multi-source reconciliation", shapes:["aggregation"]},
  {id:"refine", name:"Self-Refine / Reflexion", mech:"Generate → self-critique → revise, N iterations", cost:"2.5–5×", gain:"15–40% ↓ when critique is grounded; ~0–10% and drift risk when ungrounded", use:"Code repair, long-form drafting, spec compliance", shapes:["linear","verification"]},
  {id:"rrf", name:"Recursive Reflection (pre-output)", mech:"Internal invariant checklist + contradiction scan before emit", cost:"1.4–2.2×", gain:"10–30% ↓ constraint violations & unsupported claims", use:"High-stakes single-shot answers (legal, medical, security review)", shapes:["linear","verification","aggregation","search","exploration"]},
  {id:"react", name:"ReAct (Thought→Action→Observation)", mech:"Interleaved reasoning and tool calls with observation grounding", cost:"3–20× (tool-bound)", gain:"30–60% ↓ hallucination on fact-seeking vs closed-book", use:"Search, DB/API querying, environment interaction", shapes:["exploration","verification"]},
  {id:"plan", name:"Plan-and-Execute", mech:"Frozen plan up front, cheap executor per step", cost:"2–8× / lower per-step than ReAct", gain:"10–25% ↑ completion on long horizons; reduces drift/looping", use:"Multi-file refactors, ETL pipelines, deterministic workflows", shapes:["linear","exploration"]},
  {id:"multi", name:"Orchestrator + sub-agents", mech:"Context isolation, parallel sub-tasks, typed handoff contracts", cost:"4–15× tok / 1–3× wall-clock", gain:"20–40% ↑ breadth-first research; INCREASES error on tightly-coupled tasks", use:"Parallel research, multi-repo audits, adversarial review", shapes:["aggregation","exploration"]},
  {id:"rag", name:"RAG (retrieval-augmented)", mech:"Vector/BM25 hybrid retrieval → grounded generation", cost:"1.5–6× tok / +50–300ms", gain:"40–70% ↓ factual hallucination with citation enforcement", use:"Knowledge-bound QA over private corpora", shapes:["linear","aggregation"]},
  {id:"aragl", name:"Agentic / Iterative RAG", mech:"Query decomposition, multi-hop retrieval, sufficiency check", cost:"4–15×", gain:"+10–25% over single-shot RAG on multi-hop", use:"Compliance Q&A, research synthesis", shapes:["exploration","aggregation"]},
  {id:"compact", name:"Context compression / compaction", mech:"Recursive summarization, salience pruning, artifact offload", cost:"−40 to −80% tokens (net saving)", gain:"Prevents rot-driven degradation; +10–30% completion on >20-turn sessions", use:"Long agent sessions, chat memory, log analysis", shapes:["exploration"]},
  {id:"mcp", name:"MCP tool binding", mech:"Standardized tool/resource/prompt discovery over JSON-RPC", cost:"+200–2000 tok/session", gain:"Reduces integration defects; enables dynamic tool sets", use:"Cross-app agents, enterprise tool fabric", shapes:["exploration","verification"]},
  {id:"schema", name:"JSON Schema + constrained decoding", mech:"Grammar/FSM-masked sampling, validate after", cost:"+0–10% tok / +0–15% lat", gain:"~100% syntactic validity; 30–60% ↓ parse failures", use:"Any machine-consumed output", shapes:["linear","verification","aggregation","search","exploration"]},
  {id:"ast", name:"AST / compiler-in-the-loop", mech:"Parse, type-check, test, feed diagnostics back", cost:"2–6×", gain:"30–70% ↓ non-compiling / failing code", use:"Code generation & migration", shapes:["verification"]},
  {id:"dspy", name:"DSPy compilation (MIPROv2/GEPA)", mech:"Metric-driven search over instructions + demos", cost:"High offline; ≈1× online", gain:"5–25 pts absolute ↑ vs hand prompts", use:"Any pipeline with an eval set and stable task definition", shapes:["linear","verification"]},
  {id:"meta", name:"Meta-prompting (LLM as prompt author)", mech:"Model generates/critiques prompts for sub-tasks", cost:"2–5×", gain:"10–20% ↑ vs naive hand prompt; below compiled optimizers", use:"Cold-start, novel tasks without labeled data", shapes:["exploration","search"]},
  {id:"const", name:"Constitutional critique-revise layer", mech:"Principle-anchored self-critique pass", cost:"1.5–3×", gain:"40–80% ↓ policy violations on adversarial suites", use:"Public-facing assistants, content pipelines", shapes:["linear","aggregation"]},
  {id:"spot", name:"Spotlighting / delimiter isolation", mech:"Typed tags + provenance marking of untrusted content", cost:"+1–3% tok", gain:"Substantial ↓ indirect prompt-injection success (not elimination)", use:"Any agent ingesting web/email/file content", shapes:["linear","verification","aggregation","search","exploration"]},
  {id:"calib", name:"Probabilistic calibration / selective prediction", mech:"Agreement, entropy, verifier variance → confidence → abstain or escalate", cost:"Medium (needs k samples or a verifier)", gain:"15–40% ↓ confident-wrong rate at a coverage cost", use:"Any pipeline where a wrong answer costs more than no answer", shapes:["linear","verification","aggregation"]},
  {id:"heavy", name:"Extended thinking budget", mech:"Native reasoning tokens, budget-controlled", cost:"2–30×", gain:"Strong ↑ on competition math/code; flat-to-negative on retrieval/style", use:"Algorithm design, proofs, deep debugging, threat modeling", shapes:["search","verification"]}
];

/** Selection heuristic — the decision rule the router implements. */
export const selectionHeuristic = `if output is machine-consumed        -> constrained decoding + schema validation (always)
if a sound verifier exists           -> generate-and-verify loop (dominant)
elif answer has canonical form       -> Self-Consistency@8-16
elif task is search/combinatorial    -> ToT/GoT with pruning
elif task requires external facts    -> ReAct / Agentic RAG with citation enforcement
elif horizon > 20 steps              -> Plan-and-Execute + compaction + artifact offload
elif breadth-parallelizable          -> orchestrator + isolated sub-agents
else                                 -> single call + Recursive Reflection pass`;
