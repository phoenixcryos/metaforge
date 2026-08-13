/**
 * Checker: parse output as JSON and verify required fields / shape.
 *
 * Task.gold examples:
 *   { "type": "object", "required": ["items"] }
 *   { "type": "array", "minItems": 1, "itemRequired": ["desc", "amount"] }
 *   { "required_fields": ["a", "b"] }   // shorthand: object with those keys
 */
export function check(ctx) {
  const { output, task } = ctx;
  const gold = task.gold || {};
  const detail = {};

  let parsed = null;
  try {
    const text = (output || "").trim();
    // Allow fenced JSON
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const body = fence ? fence[1].trim() : text;
    parsed = JSON.parse(body);
    detail.parsed = true;
  } catch (e) {
    return {
      task_success: 0,
      schema_validity: 0,
      detail: { error: "json_parse_failed", message: e.message }
    };
  }

  const required = gold.required || gold.required_fields || [];
  let missing = [];

  if (gold.type === "array" || Array.isArray(parsed)) {
    if (!Array.isArray(parsed)) {
      return {
        task_success: 0,
        schema_validity: 0,
        detail: { error: "expected_array" }
      };
    }
    if (typeof gold.minItems === "number" && parsed.length < gold.minItems) {
      return {
        task_success: 0,
        schema_validity: 0.5,
        detail: { error: "minItems", got: parsed.length, want: gold.minItems }
      };
    }
    const itemReq = gold.itemRequired || gold.item_required || [];
    if (itemReq.length) {
      for (let i = 0; i < parsed.length; i++) {
        const row = parsed[i] || {};
        for (const k of itemReq) {
          if (row[k] === undefined || row[k] === null || row[k] === "") {
            missing.push(`[${i}].${k}`);
          }
        }
      }
    }
  } else {
    // object
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        task_success: 0,
        schema_validity: 0,
        detail: { error: "expected_object" }
      };
    }
    for (const k of required) {
      if (parsed[k] === undefined || parsed[k] === null) missing.push(k);
    }
  }

  detail.missing = missing;
  const schema_validity = missing.length === 0 ? 1 : Math.max(0, 1 - missing.length * 0.25);
  const task_success = missing.length === 0 ? 1 : 0;

  return { task_success, schema_validity, detail };
}
