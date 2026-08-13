/**
 * Checker: simple keyword / phrase constraints from task.spec.constraints
 * and optional task.gold.must_contain / must_not_contain.
 *
 * Each non-empty constraint line is treated as a soft requirement that the
 * output should reflect. Gold lists are hard.
 *
 * Returns constraint_violation_rate in 0..1 and task_success if no hard fails.
 */
export function check(ctx) {
  const { output, task } = ctx;
  const text = (output || "").toLowerCase();
  const gold = task.gold || {};
  const detail = { hard_fails: [], soft_misses: [] };

  const mustContain = [].concat(gold.must_contain || gold.mustContain || []);
  const mustNot = [].concat(gold.must_not_contain || gold.mustNotContain || []);

  for (const phrase of mustContain) {
    if (!text.includes(String(phrase).toLowerCase())) {
      detail.hard_fails.push({ type: "must_contain", phrase });
    }
  }
  for (const phrase of mustNot) {
    if (text.includes(String(phrase).toLowerCase())) {
      detail.hard_fails.push({ type: "must_not_contain", phrase });
    }
  }

  // Soft: each constraint line that looks like a positive instruction
  const constraints = String(task.spec?.constraints || task.constraints || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  // Very light heuristic: if constraint contains a quoted phrase, require it
  for (const line of constraints) {
    const quoted = line.match(/"([^"]+)"|'([^']+)'/);
    if (quoted) {
      const phrase = (quoted[1] || quoted[2]).toLowerCase();
      if (phrase.length >= 3 && !text.includes(phrase)) {
        detail.soft_misses.push({ line, phrase });
      }
    }
  }

  const hard = detail.hard_fails.length;
  const soft = detail.soft_misses.length;
  const totalChecks = mustContain.length + mustNot.length + soft + hard;
  const violations = hard + soft;
  const constraint_violation_rate =
    totalChecks === 0 ? 0 : Math.min(1, violations / Math.max(totalChecks, 1));

  return {
    task_success: hard === 0 ? 1 : 0,
    constraint_violation_rate,
    detail
  };
}
