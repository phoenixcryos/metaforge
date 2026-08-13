/**
 * Prompt builders for the three eval arms.
 *
 * A — baseline: user-supplied prompt (optional per task)
 * B — metaforge: compile(spec)
 * C — naive: task text only
 */
import { compile, hash } from "../../src/engine/compile.js";

const BASE_SPEC = {
  task: "",
  deliverable: "A clear result",
  domain: "general",
  model: "agnostic",
  consumer: "human",
  risk: "medium",
  constraints: "",
  audience: "",
  evidence: "",
  untrusted: "",
  tools: false,
  toolList: "",
  toolBudget: "",
  agentName: ""
};

/**
 * @param {"baseline"|"metaforge"|"naive"} arm
 * @param {object} task  JSONL task record
 * @returns {{ system: string, user: string, combined: string, context_hash: string, routing?: object, provenance?: object, skipped?: boolean, reason?: string }}
 */
export function buildArm(arm, task) {
  if (arm === "baseline") {
    const prompt = (task.baseline_prompt || "").trim();
    if (!prompt) {
      return { system: "", user: "", combined: "", context_hash: "", skipped: true, reason: "no baseline_prompt" };
    }
    // Treat whole baseline as user message unless it contains an obvious system split.
    const split = prompt.match(/^([\s\S]*?)\n---\n([\s\S]*)$/);
    const system = split ? split[1].trim() : "";
    const user = split ? split[2].trim() : prompt;
    const combined = system ? system + "\n\n---\n\n" + user : user;
    return {
      system,
      user,
      combined,
      context_hash: hash(combined),
      routing: null,
      provenance: null
    };
  }

  if (arm === "naive") {
    const user = (task.task || "").trim() || "(empty task)";
    return {
      system: "",
      user,
      combined: user,
      context_hash: hash(user),
      routing: null,
      provenance: null
    };
  }

  if (arm === "metaforge") {
    const spec = { ...BASE_SPEC, ...(task.spec || {}), task: task.task || (task.spec && task.spec.task) || "" };
    if (!spec.task.trim()) {
      return { system: "", user: "", combined: "", context_hash: "", skipped: true, reason: "no task text" };
    }
    const out = compile(spec);
    return {
      system: out.sys,
      user: out.usr,
      combined: out.combined,
      context_hash: out.provenance.context_hash,
      routing: {
        shape: out.R.shape,
        tier: out.R.tier,
        verifier: out.R.verifier,
        topology: out.R.topo,
        reflection_depth: out.R.reflect,
        abstention: !!out.R.abstention,
        shapeConfidence: out.R.shapeConfidence
      },
      provenance: out.provenance,
      budget: out.B,
      warnings: out.W
    };
  }

  throw new Error(`unknown arm: ${arm}`);
}

export const ARMS = ["baseline", "metaforge", "naive"];
