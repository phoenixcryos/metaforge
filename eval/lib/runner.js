/**
 * Eval orchestration: load tasks, build arms, execute, check, aggregate.
 */
import { readFileSync } from "fs";
import { buildArm, ARMS } from "./arms.js";
import { getChecker } from "../checkers/index.js";
import { execute as echoExecute } from "./executor-echo.js";
import { KB_VERSION, ENGINE_VERSION } from "../../src/kb/index.js";

function loadJsonl(path) {
  const text = readFileSync(path, "utf8");
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    rows.push(JSON.parse(t));
  }
  return rows;
}

function makeRunId(i) {
  const d = new Date();
  const stamp = d.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `eval_${stamp}_${String(i).padStart(4, "0")}`;
}

/**
 * Routing-only pass: compile each task's metaforge arm, no model.
 */
export function runRoutingOnly(taskPath) {
  const tasks = loadJsonl(taskPath);
  const rows = [];
  for (const task of tasks) {
    const id = task.id || (task.task || "").slice(0, 40);
    try {
      const built = buildArm("metaforge", task);
      if (built.skipped) {
        rows.push({ id, shape: "—", tier: "—", topo: built.reason || "skipped", verifier: "—", conf: null, sysT: null, pct: null });
        continue;
      }
      rows.push({
        id,
        shape: built.routing?.shape,
        tier: built.routing?.tier,
        topo: built.routing?.topology,
        verifier: built.routing?.verifier,
        conf: built.routing?.shapeConfidence,
        sysT: built.budget?.sysT,
        pct: built.budget?.pct
      });
    } catch (e) {
      rows.push({ id, shape: "ERROR", tier: "—", topo: e.message, verifier: "—", conf: null, sysT: null, pct: null });
    }
  }
  return rows;
}

/**
 * Full multi-arm run.
 * @param {object} opts
 * @param {string} opts.taskPath
 * @param {string[]} opts.arms
 * @param {number} opts.n  replicates per task×arm
 * @param {function} opts.executor  async ({system,user,model,params}) => {output, tokens, raw}
 * @param {string} [opts.model]
 */
export async function runEval(opts) {
  const {
    taskPath,
    arms = ["metaforge"],
    n = 1,
    executor = echoExecute,
    model = "echo"
  } = opts;

  const tasks = loadJsonl(taskPath);
  const runsByArm = Object.fromEntries(arms.map(a => [a, []]));
  let runCounter = 0;

  for (const task of tasks) {
    for (const arm of arms) {
      if (!ARMS.includes(arm)) throw new Error(`unknown arm: ${arm}`);
      for (let rep = 0; rep < n; rep++) {
        const built = buildArm(arm, task);
        const run_id = makeRunId(++runCounter);

        if (built.skipped) {
          runsByArm[arm].push({
            run_id,
            arm,
            task_id: task.id,
            skipped: true,
            reason: built.reason,
            metrics: { task_success: 0 }
          });
          continue;
        }

        const execResult = await executor({
          system: built.system,
          user: built.user,
          model,
          params: {}
        });

        let metrics = { task_success: 0 };
        try {
          const checker = getChecker(task.checker);
          metrics = checker({
            output: execResult.output,
            task,
            trace: execResult.raw
          }) || metrics;
        } catch (e) {
          metrics = {
            task_success: 0,
            detail: { checker_error: e.message }
          };
        }

        // Echo executor produces empty output — treat echo.pass / missing as success for dry-run
        if (model === "echo" || execResult.raw?.dryRun) {
          if (!task.checker || task.checker === "echo.pass") {
            metrics = {
              task_success: 1,
              schema_validity: 1,
              constraint_violation_rate: 0,
              detail: { dryRun: true }
            };
          }
        }

        const record = {
          run_id,
          arm,
          task_id: task.id,
          context_hash: built.context_hash,
          compiler: { kb_version: KB_VERSION, engine_version: ENGINE_VERSION },
          routing: built.routing,
          model: {
            id: model,
            version: execResult.raw?.model || model,
            ...(execResult.raw?.params || {})
          },
          tokens: execResult.tokens,
          metrics,
          replicate: rep
        };
        runsByArm[arm].push(record);
      }
    }
  }

  return { tasks, runsByArm };
}

export { loadJsonl };
