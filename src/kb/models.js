/**
 * KB: Model dialects.
 * Provenance: synthesized across all six reports + vendor documentation conventions.
 *
 * MAINTENANCE: this is the fastest-rotting file in the repo. Model families ship
 * new reasoning controls and structured-output APIs continuously. When a family
 * changes, update `param`, `thinking`, and `tips` — and bump KB_VERSION in
 * src/kb/index.js. See docs/MAINTENANCE.md § "Model dialect drift".
 */
export const models = {
  claude: {
    label:"Claude (Opus / Sonnet / Haiku)", vendor:"Anthropic",
    window:200000, isolation:"xml",
    thinking:"Native extended thinking. Set budget_tokens explicitly. Use `think`/`think harder` escalation words only when budget is not API-controlled.",
    tips:[
      "XML tags are the strongest boundary primitive for this family — wrap every untrusted span.",
      "Put invariants in the system prompt; put the task + freshest evidence at the very end of the user turn.",
      "Assistant prefill (starting the reply with `{`) forces JSON without a schema API.",
      "Long-context: place documents BEFORE the question; ask for quote extraction before analysis.",
      "Honors negative constraints well when they are phrased as NEVER + consequence."
    ],
    param:'{"model":"<claude-model>","max_tokens":8000,"thinking":{"type":"enabled","budget_tokens":BUDGET},"system":"<SYSTEM_BLOCK>","messages":[{"role":"user","content":"<TASK_BLOCK>"}]}'
  },
  gpt: {
    label:"GPT / o-series (OpenAI)", vendor:"OpenAI",
    window:400000, isolation:"markdown+xml",
    thinking:"Reasoning models take a `reasoning.effort` knob (minimal|low|medium|high). Do NOT hand-write CoT scaffolds for reasoning models — state the goal and constraints, let it think.",
    tips:[
      "Use Structured Outputs (`response_format: json_schema`, `strict: true`) instead of asking for JSON in prose.",
      "Developer/system message holds invariants; user message holds task + data.",
      "For reasoning models, remove 'think step by step' — it competes with native reasoning and wastes tokens.",
      "Markdown headers parse cleanly; keep XML only for untrusted-data isolation.",
      "Be explicit about eagerness: state exactly how much exploration/tool use is allowed."
    ],
    param:'{"model":"<gpt-model>","reasoning":{"effort":"EFFORT"},"response_format":{"type":"json_schema","json_schema":{"name":"result","strict":true,"schema":{}}},"messages":[{"role":"developer","content":"<SYSTEM_BLOCK>"},{"role":"user","content":"<TASK_BLOCK>"}]}'
  },
  gemini: {
    label:"Gemini (Google)", vendor:"Google",
    window:1000000, isolation:"markdown",
    thinking:"`thinkingConfig.thinkingBudget` (0 = off, -1 = dynamic). Supports very large windows but context rot still applies — R02 holds.",
    tips:[
      "Use `systemInstruction` for invariants; it is weighted more strongly than in-turn text.",
      "Set `responseMimeType: application/json` + `responseSchema` for deterministic output.",
      "Huge windows tempt you to dump everything — do not. Precision-optimized retrieval still beats recall-max.",
      "Markdown headings parse best; heavy XML nesting is less effective here than with Claude."
    ],
    param:'{"model":"<gemini-model>","systemInstruction":{"parts":[{"text":"<SYSTEM_BLOCK>"}]},"generationConfig":{"thinkingConfig":{"thinkingBudget":BUDGET},"responseMimeType":"application/json","responseSchema":{}},"contents":[{"role":"user","parts":[{"text":"<TASK_BLOCK>"}]}]}'
  },
  grok: {
    label:"Grok (xAI)", vendor:"xAI",
    window:256000, isolation:"markdown+xml",
    thinking:"`reasoning_effort` low|high on reasoning variants. Verbose by default — add explicit brevity + no-preamble constraints.",
    tips:[
      "Add an explicit anti-preamble constraint; this family editorializes without one.",
      "Live-search grounding must still be treated as untrusted data — wrap it.",
      "Restate the output contract at the tail; mid-window instructions drift."
    ],
    param:'{"model":"<grok-model>","reasoning_effort":"EFFORT","messages":[{"role":"system","content":"<SYSTEM_BLOCK>"},{"role":"user","content":"<TASK_BLOCK>"}]}'
  },
  openweight: {
    label:"Open-weight (Llama / Qwen / DeepSeek / Mistral)", vendor:"self-hosted",
    window:128000, isolation:"markdown+xml",
    thinking:"Usually no native reasoning budget. Emulate tiers explicitly with a written procedure; use temperature 0.0–0.3 and grammar-constrained decoding (GBNF/outlines/xgrammar).",
    tips:[
      "Be maximally explicit — implicit conventions that big models infer must be written out.",
      "Keep schemas ≤2 levels deep; these models fail on deep nesting.",
      "Add 1–3 few-shot exemplars; they buy more here than anywhere else.",
      "Enforce format with a grammar at decode time, not with pleading.",
      "Split any task with >5 constraints into a chain of small calls."
    ],
    param:'{"model":"<local-model>","temperature":0.2,"top_p":0.9,"grammar":"<GBNF from schema>","messages":[{"role":"system","content":"<SYSTEM_BLOCK>"},{"role":"user","content":"<TASK_BLOCK>"}]}'
  },
  agnostic: {
    label:"Model-agnostic / portable", vendor:"any",
    window:128000, isolation:"markdown+xml",
    thinking:"Written-procedure reasoning tiers so the prompt works with or without native thinking budgets.",
    tips:[
      "Markdown structure + XML data isolation + JSON Schema output is the portable hybrid.",
      "Assume no native structured-output API; validate and repair on your side.",
      "Recompile per model on version bump — portability is low (R17)."
    ],
    param:'{"model":"<any>","temperature":0.2,"messages":[{"role":"system","content":"<SYSTEM_BLOCK>"},{"role":"user","content":"<TASK_BLOCK>"}]}'
  }
};

/**
 * Thinking tiers. These are IMPLEMENTATION POLICIES, not universal model
 * guarantees (gpt-5.6-terra-xhigh §3.8). Accuracy vs reasoning tokens is roughly
 * logarithmic with a task-dependent knee; past the knee, overthinking appears.
 */
export const tiers = {
  light:    {label:"Light",    budget:"0–1k reasoning tokens", effort:"minimal", num:1000,
             when:"Deterministic transforms, retrieval-bound, formatting, classification",
             controls:"Single pass, constrained output, one validator."},
  extended: {label:"Extended", budget:"4k–16k", effort:"medium", num:8000,
             when:"Multi-constraint synthesis, moderate search, code with tests",
             controls:"Plan, limited tool loop, evidence validation, bounded retry."},
  heavy:    {label:"Heavy",    budget:"32k–128k+ (often + parallel sampling)", effort:"high", num:48000,
             when:"Deep search, proof-like reasoning, adversarial analysis",
             controls:"Branching/search, independent verifier, tests, red-team pass, human escalation path."}
};
