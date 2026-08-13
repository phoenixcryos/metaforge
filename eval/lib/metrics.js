/**
 * Aggregation helpers. Prefer programmatic metrics; report means + CI95.
 */

/** Wilson score interval for a proportion (n successes out of N trials). */
export function wilsonCI(successes, n, z = 1.96) {
  if (n <= 0) return { low: 0, high: 0, mean: 0 };
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return {
    mean: p,
    low: Math.max(0, (centre - margin) / denom),
    high: Math.min(1, (centre + margin) / denom)
  };
}

/** Mean ± simple normal CI for continuous values (e.g. tokens). */
export function meanCI(values, z = 1.96) {
  const n = values.length;
  if (n === 0) return { mean: 0, low: 0, high: 0, n: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (n === 1) return { mean, low: mean, high: mean, n: 1 };
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  const se = Math.sqrt(variance / n);
  return { mean, low: mean - z * se, high: mean + z * se, n };
}

/**
 * Aggregate run records for one arm.
 * @param {object[]} runs  records with metrics.task_success and tokens
 */
export function aggregateArm(runs) {
  const usable = runs.filter(r => !r.skipped);
  const n = usable.length;
  if (n === 0) {
    return {
      n: 0,
      task_success: { mean: 0, low: 0, high: 0 },
      tokens_per_successful_task: null,
      schema_validity: null,
      constraint_violation_rate: null,
      total_tokens_mean: null
    };
  }

  const successes = usable.filter(r => (r.metrics?.task_success ?? 0) >= 1).length;
  const successCI = wilsonCI(successes, n);

  const successRuns = usable.filter(r => (r.metrics?.task_success ?? 0) >= 1);
  const tokensOnSuccess = successRuns
    .map(r => r.tokens?.total)
    .filter(t => typeof t === "number" && t > 0);
  const tokensPerSuccess = tokensOnSuccess.length
    ? meanCI(tokensOnSuccess)
    : null;

  const schemaVals = usable
    .map(r => r.metrics?.schema_validity)
    .filter(v => typeof v === "number");
  const schemaMean = schemaVals.length
    ? schemaVals.reduce((a, b) => a + b, 0) / schemaVals.length
    : null;

  const cvrVals = usable
    .map(r => r.metrics?.constraint_violation_rate)
    .filter(v => typeof v === "number");
  const cvrMean = cvrVals.length
    ? cvrVals.reduce((a, b) => a + b, 0) / cvrVals.length
    : null;

  const allTokens = usable.map(r => r.tokens?.total).filter(t => typeof t === "number");
  const totalTokensMean = allTokens.length ? meanCI(allTokens) : null;

  return {
    n,
    successes,
    task_success: successCI,
    tokens_per_successful_task: tokensPerSuccess,
    schema_validity: schemaMean,
    constraint_violation_rate: cvrMean,
    total_tokens_mean: totalTokensMean
  };
}

/**
 * Delta of metaforge (or other) vs baseline on task_success.
 */
export function deltaVsBaseline(armAgg, baselineAgg) {
  if (!baselineAgg || baselineAgg.n === 0 || !armAgg || armAgg.n === 0) {
    return null;
  }
  const diff = armAgg.task_success.mean - baselineAgg.task_success.mean;
  // Rough CI on difference of independent proportions
  const se = Math.sqrt(
    (armAgg.task_success.mean * (1 - armAgg.task_success.mean)) / armAgg.n +
    (baselineAgg.task_success.mean * (1 - baselineAgg.task_success.mean)) / baselineAgg.n
  );
  const z = 1.96;
  return {
    task_success: diff,
    ci95: [diff - z * se, diff + z * se],
    n: Math.min(armAgg.n, baselineAgg.n)
  };
}
