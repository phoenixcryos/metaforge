/**
 * Checker registry.
 *
 * Keys used in task.checker field of JSONL records.
 */
import * as jsonSchema from "./json-schema.js";
import * as constraintsKeyword from "./constraints-keyword.js";

const registry = {
  "json.schema": jsonSchema.check,
  "constraints.keyword": constraintsKeyword.check,
  // Alias for smoke / dry-run: always "succeeds" so plumbing is testable
  "echo.pass": () => ({
    task_success: 1,
    schema_validity: 1,
    constraint_violation_rate: 0,
    detail: { dryRun: true }
  })
};

export function getChecker(name) {
  if (!name) return registry["echo.pass"];
  const fn = registry[name];
  if (!fn) {
    throw new Error(
      `Unknown checker "${name}". Registered: ${Object.keys(registry).join(", ")}`
    );
  }
  return fn;
}

export function listCheckers() {
  return Object.keys(registry);
}
