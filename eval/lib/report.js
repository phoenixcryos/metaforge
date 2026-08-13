/**
 * Console tables and JSON summary writers.
 */
import { aggregateArm, deltaVsBaseline } from "./metrics.js";

function fmtPct(x) {
  if (x == null || Number.isNaN(x)) return "—";
  return (x * 100).toFixed(1) + "%";
}

function fmtNum(x, digits = 0) {
  if (x == null || Number.isNaN(x)) return "—";
  if (x >= 1000) return (x / 1000).toFixed(1) + "k";
  return x.toFixed(digits);
}

function fmtCI(ci) {
  if (!ci) return "";
  return `[${fmtPct(ci.low)}, ${fmtPct(ci.high)}]`;
}

/** Routing-only table: one row per task. */
export function printRoutingTable(rows) {
  if (!rows.length) {
    console.log("(no rows)");
    return;
  }
  const cols = ["id", "shape", "tier", "topo", "verifier", "conf", "sysT", "pct"];
  const widths = { id: 22, shape: 14, tier: 10, topo: 36, verifier: 14, conf: 6, sysT: 6, pct: 5 };

  const trunc = (s, w) => {
    s = String(s ?? "");
    return s.length <= w ? s.padEnd(w) : s.slice(0, w - 1) + "…";
  };

  console.log(cols.map(c => trunc(c, widths[c])).join("  "));
  console.log(cols.map(c => "-".repeat(widths[c])).join("  "));
  for (const r of rows) {
    console.log([
      trunc(r.id, widths.id),
      trunc(r.shape, widths.shape),
      trunc(r.tier, widths.tier),
      trunc(r.topo, widths.topo),
      trunc(r.verifier, widths.verifier),
      trunc(r.conf != null ? (r.conf * 100).toFixed(0) + "%" : "—", widths.conf),
      trunc(r.sysT != null ? String(r.sysT) : "—", widths.sysT),
      trunc(r.pct != null ? r.pct + "%" : "—", widths.pct)
    ].join("  "));
  }
  console.log(`\n${rows.length} tasks`);
}

/** Aggregate arms table after full runs. */
export function printArmSummary(runsByArm) {
  const arms = Object.keys(runsByArm);
  const aggs = {};
  for (const arm of arms) aggs[arm] = aggregateArm(runsByArm[arm]);

  const baseline = aggs.baseline;
  console.log("");
  console.log(
    "arm".padEnd(12) +
    "n".padStart(5) +
    "success".padStart(10) +
    "CI95".padStart(18) +
    "tok/success".padStart(14) +
    "vs baseline".padStart(14)
  );
  console.log("-".repeat(73));

  for (const arm of arms) {
    const a = aggs[arm];
    const delta = arm !== "baseline" ? deltaVsBaseline(a, baseline) : null;
    const deltaStr = delta
      ? ((delta.task_success >= 0 ? "+" : "") + (delta.task_success * 100).toFixed(1) + "pp")
      : "—";
    console.log(
      arm.padEnd(12) +
      String(a.n).padStart(5) +
      fmtPct(a.task_success.mean).padStart(10) +
      (" " + fmtCI(a.task_success)).padStart(18) +
      fmtNum(a.tokens_per_successful_task?.mean).padStart(14) +
      deltaStr.padStart(14)
    );
  }
  console.log("");
}

/** Build summary object for --out JSON. */
export function buildSummary(runsByArm, meta = {}) {
  const arms = {};
  for (const [arm, runs] of Object.entries(runsByArm)) {
    arms[arm] = {
      runs,
      aggregate: aggregateArm(runs)
    };
  }
  if (arms.baseline && arms.metaforge) {
    arms.metaforge.delta_vs_baseline = deltaVsBaseline(
      arms.metaforge.aggregate,
      arms.baseline.aggregate
    );
  }
  return {
    generated_at: new Date().toISOString(),
    ...meta,
    arms
  };
}
