# Eval harness (P0 + P1)

Measure whether MetaForge prompts beat a baseline on **your** tasks, at what token cost.

Design and metrics: [`docs/EVALUATION.md`](../docs/EVALUATION.md).  
Roadmap item 2.

## Quick start

```bash
# Routing audit only (no model, no network)
node bin/eval.js --set eval/fixtures/smoke.jsonl --routing-only

# Dry-run full arms with echo executor
node bin/eval.js --set eval/fixtures/smoke.jsonl --executor=echo --arms baseline,metaforge,naive

# List checkers
node bin/eval.js --list-checkers
```

Or via npm:

```bash
npm run eval -- --set eval/fixtures/smoke.jsonl --routing-only
```

## Task format (JSONL)

One JSON object per line:

```json
{
  "id": "invoice-01",
  "task": "Extract line items…",
  "spec": {
    "domain": "extract",
    "consumer": "json",
    "risk": "medium",
    "deliverable": "JSON array",
    "constraints": "Never invent amounts.",
    "untrusted": "true"
  },
  "baseline_prompt": "Optional existing prompt for arm A",
  "checker": "json.schema",
  "gold": { "type": "array", "itemRequired": ["desc", "amount"] },
  "tags": ["extract"]
}
```

## Arms

| Arm | Source |
|-----|--------|
| `baseline` | `baseline_prompt` (skipped if missing) |
| `metaforge` | `compile(spec)` |
| `naive` | Task text only |

## Checkers (P1)

| Name | Role |
|------|------|
| `echo.pass` | Always succeeds (smoke / dry-run) |
| `json.schema` | Parse JSON; required keys / array shape |
| `constraints.keyword` | `must_contain` / `must_not_contain` + soft constraint lines |

## Executors

- `echo` (default) — no model calls; empty output; token estimates from prompt length
- `script:path` — your script reads a JSON payload on stdin, writes JSON on stdout:

```json
{
  "output": "model text",
  "tokens": { "system": 100, "user": 50, "thinking": 0, "output": 80, "total": 230 },
  "raw": {}
}
```

## Output

- Console table (routing-only or arm summary)
- Optional `--out file.json` with full run records + aggregates

## Status

- **P0** shipped: routing-only, record shape, CLI  
- **P1** shipped: checker registry, smoke fixture, echo executor  
- **P2** (your side): real task set + script executor against your model API  
- **P3+**: ablations, release-gate automation
