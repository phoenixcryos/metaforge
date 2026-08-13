#!/usr/bin/env node
/**
 * MetaForge eval CLI
 *
 * Usage:
 *   node bin/eval.js --set eval/fixtures/smoke.jsonl --routing-only
 *   node bin/eval.js --set eval/fixtures/smoke.jsonl --executor=echo --arms metaforge,naive
 *   node bin/eval.js --set path.jsonl --executor=script:./run.sh --n 3 --out results.json
 *
 * See eval/README.md and docs/EVALUATION.md.
 */
import { writeFileSync } from "fs";
import { pathToFileURL } from "url";
import { resolve } from "path";
import { runRoutingOnly, runEval } from "../eval/lib/runner.js";
import { printRoutingTable, printArmSummary, buildSummary } from "../eval/lib/report.js";
import { execute as echoExecute } from "../eval/lib/executor-echo.js";
import { listCheckers } from "../eval/checkers/index.js";

function usage() {
  console.log(`MetaForge eval harness

Usage:
  node bin/eval.js --set <tasks.jsonl> [options]

Options:
  --routing-only          Compile only; print shape/tier/topo table (no model)
  --arms a,b,c            Arms to run (default: metaforge). baseline,metaforge,naive
  --n <int>               Replicates per task×arm (default: 1)
  --executor=echo         Dry-run executor (default)
  --executor=script:path  Shell script: JSON in on stdin, JSON out on stdout
  --model <id>            Model label for records (default: echo)
  --out <file>            Write full JSON summary
  --list-checkers         Print registered checkers and exit
  --help                  This message
`);
}

function parseArgs(argv) {
  const opts = {
    set: null,
    routingOnly: false,
    arms: ["metaforge"],
    n: 1,
    executor: "echo",
    model: "echo",
    out: null,
    listCheckers: false,
    help: false
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--routing-only") opts.routingOnly = true;
    else if (a === "--list-checkers") opts.listCheckers = true;
    else if (a === "--set") opts.set = argv[++i];
    else if (a.startsWith("--set=")) opts.set = a.slice(6);
    else if (a === "--arms") opts.arms = argv[++i].split(",").map(s => s.trim()).filter(Boolean);
    else if (a.startsWith("--arms=")) opts.arms = a.slice(7).split(",").map(s => s.trim()).filter(Boolean);
    else if (a === "--n") opts.n = parseInt(argv[++i], 10);
    else if (a.startsWith("--n=")) opts.n = parseInt(a.slice(4), 10);
    else if (a === "--executor") opts.executor = argv[++i];
    else if (a.startsWith("--executor=")) opts.executor = a.slice(11);
    else if (a === "--model") opts.model = argv[++i];
    else if (a.startsWith("--model=")) opts.model = a.slice(8);
    else if (a === "--out") opts.out = argv[++i];
    else if (a.startsWith("--out=")) opts.out = a.slice(6);
    else if (a.startsWith("-")) {
      console.error("Unknown option:", a);
      opts.help = true;
    }
  }
  return opts;
}

async function loadExecutor(spec) {
  if (!spec || spec === "echo") return echoExecute;
  if (spec.startsWith("script:")) {
    const scriptPath = resolve(spec.slice(7));
    const { spawn } = await import("child_process");
    return async function scriptExecutor(payload) {
      return new Promise((resolvePromise, reject) => {
        const child = spawn(scriptPath, [], { stdio: ["pipe", "pipe", "inherit"] });
        let stdout = "";
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", d => { stdout += d; });
        child.on("error", reject);
        child.on("close", code => {
          if (code !== 0) {
            reject(new Error(`executor script exited ${code}`));
            return;
          }
          try {
            resolvePromise(JSON.parse(stdout));
          } catch (e) {
            reject(new Error(`executor script returned invalid JSON: ${e.message}`));
          }
        });
        child.stdin.write(JSON.stringify(payload));
        child.stdin.end();
      });
    };
  }
  throw new Error(`Unknown executor: ${spec}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    process.exit(0);
  }
  if (opts.listCheckers) {
    console.log(listCheckers().join("\n"));
    process.exit(0);
  }
  if (!opts.set) {
    console.error("Missing --set <tasks.jsonl>");
    usage();
    process.exit(1);
  }

  if (opts.routingOnly) {
    const rows = runRoutingOnly(opts.set);
    printRoutingTable(rows);
    if (opts.out) {
      writeFileSync(opts.out, JSON.stringify({ mode: "routing-only", rows }, null, 2));
      console.log("Wrote", opts.out);
    }
    return;
  }

  const executor = await loadExecutor(opts.executor);
  const { runsByArm } = await runEval({
    taskPath: opts.set,
    arms: opts.arms,
    n: opts.n,
    executor,
    model: opts.model
  });

  printArmSummary(runsByArm);

  if (opts.out) {
    const summary = buildSummary(runsByArm, {
      task_set: opts.set,
      arms: opts.arms,
      n: opts.n,
      model: opts.model,
      executor: opts.executor
    });
    writeFileSync(opts.out, JSON.stringify(summary, null, 2));
    console.log("Wrote", opts.out);
  }
}

main().catch(e => {
  console.error(e.stack || e.message || e);
  process.exit(1);
});
