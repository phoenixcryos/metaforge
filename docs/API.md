# API

`compile(spec)` is the entire public surface.

```js
import { compile } from "./src/engine/compile.js";
const result = compile(spec);
```

In the browser bundle the same function is exposed as `window.MetaForge.compile`.

---

## Input: the spec object

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `task` | string | **yes** | — | Plain description of the job. Drives shape classification. |
| `deliverable` | string | no | `""` | The concrete artifact wanted. Highest-leverage field — omitting it triggers a warning. |
| `domain` | key of `domains` | no | `"general"` | `code`, `arch`, `security`, `data`, `research`, `writing`, `agent`, `extract`, `legal`, `general` |
| `model` | key of `models` | no | `"agnostic"` | `claude`, `gpt`, `gemini`, `grok`, `openweight`, `agnostic` |
| `consumer` | enum | no | `"human"` | `human` \| `json` \| `code` \| `doc`. Determines the output contract and whether a programmatic verifier exists. |
| `risk` | enum | no | `"medium"` | `low` \| `medium` \| `high`. Drives tier and abstention. |
| `constraints` | string | no | `""` | Newline-separated. Each becomes a success criterion and a reprise entry. |
| `audience` | string | no | `""` | Calibrates depth. |
| `evidence` | string | no | `""` | Trusted context. Cited freely by the model. |
| `untrusted` | string | no | `""` | Third-party content. Triggers the trust boundary and typed wrapping. |
| `tools` | boolean | no | `false` | Enables `TOOL_POLICY`. |
| `toolList` | string | no | `""` | Comma or newline separated. Unbounded surfaces trigger a warning. |
| `toolBudget` | string | no | `"25"` | Max tool calls. |
| `agentName` | string | no | `""` | Names the agent in `IDENTITY`. |

Unknown keys are ignored. Missing keys fall back to the defaults above.

---

## Output

```js
{
  R,           // routing decision
  sys,         // system prompt (string, markdown)
  usr,         // user/task message (string, markdown)
  adp,         // model adapter notes (string, markdown)
  combined,    // sys + separator + usr
  B,           // budget estimate
  W,           // warnings
  provenance   // version + hash stamp
}
```

### `R` — routing decision

```js
{
  shape:            "linear"|"search"|"aggregation"|"verification"|"exploration",
  verifier:         "programmatic"|"llm_judge"|"none",
  tier:             "light"|"extended"|"heavy",
  topo:             "Generate → Verify loop",       // human-readable topology
  topoWhy:          "A sound programmatic verifier exists, …",
  maxRounds:        3,
  reflect:          3,        // reflection depth, 1–3
  abstention:       false,    // calibration block included?
  novel:            false,
  constraintCount:  2,
  toolCount:        4,
  multiAgent:       false     // true for ToT / GoT topologies
}
```

### `B` — budget

```js
{
  sysT:      1832,     // estimated system prompt tokens
  usrT:        50,     // estimated user message tokens
  think:     8000,     // reasoning tokens budgeted for the tier
  outT:      1200,     // output tokens reserved
  total:    11082,
  window:  200000,     // model's advertised context
  effective:100000,    // R02: assume ~50% is usable
  pct:         11      // total as % of effective
}
```

Token counts are `chars / 3.9` estimates, not tokenizer output. Fine for pressure
warnings; do not bill against them.

### `W` — warnings

Array of `[title, detail]` pairs. Empty when the spec is well-formed.

### `provenance`

```js
{
  kb_version: "1.1.0", engine_version: "1.1.0", spec_version: "1",
  context_hash: "142e26d9a697e4",
  compiled_at: "2026-08-11T…Z",
  routing: { shape, tier, verifier, topology, reflection_depth, abstention }
}
```

`context_hash` is a stable non-cryptographic hash of `combined`. Same input →
same hash, always. Log it with eval runs (R19).

---

## Usage patterns

### Inspect routing without rendering

```js
import { route } from "./src/engine/router.js";
const R = route(spec);          // cheap; no string building
if (R.tier === "heavy") console.warn("This will be expensive:", R.topoWhy);
```

### Send to an API

```js
const { sys, usr } = compile(spec);

// Anthropic
await client.messages.create({
  model: "…", max_tokens: 8000,
  thinking: { type: "enabled", budget_tokens: 8000 },
  system: sys,
  messages: [{ role: "user", content: usr }]
});

// OpenAI
await client.chat.completions.create({
  model: "…", reasoning: { effort: "medium" },
  messages: [
    { role: "developer", content: sys },
    { role: "user", content: usr }
  ]
});
```

`adp` contains the recommended parameters for the selected family as a markdown
block — useful to surface to a human, not meant to be parsed.

### Batch a spec sweep

```js
const specs = tasks.map(t => ({ ...baseSpec, task: t }));
const rows = specs.map(s => {
  const { R, B, provenance } = compile(s);
  return { task: s.task.slice(0, 60), topo: R.topo, tier: R.tier,
           pct: B.pct, hash: provenance.context_hash };
});
console.table(rows);
```

Useful for auditing routing decisions across a real workload — see
[`EVALUATION.md`](EVALUATION.md).

---

## Stability

- `compile()` is **pure and deterministic** apart from `provenance.compiled_at`.
  Same spec → same `sys`, `usr`, `adp`, and `context_hash`.
- Section *names* are stable within a MAJOR `ENGINE_VERSION`.
- Exact prompt *text* is not stable. Do not string-match against it.
- Input contract is stable within a `SPEC_VERSION`.

See [`VERSIONING.md`](VERSIONING.md).
