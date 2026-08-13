/**
 * Dry-run executor — no model calls.
 * Returns empty output so checkers and plumbing can be tested offline.
 */
export async function execute({ system, user, model, params }) {
  const sysT = Math.max(1, Math.round((system || "").length / 3.9));
  const usrT = Math.max(1, Math.round((user || "").length / 3.9));
  return {
    output: "",
    tokens: {
      system: sysT,
      user: usrT,
      thinking: 0,
      output: 0,
      total: sysT + usrT
    },
    raw: { dryRun: true, model: model || "echo", params: params || {} }
  };
}
