/**
 * ENGINE: the router.
 *
 * This is the heart of MetaForge and the file most worth understanding before
 * you change anything. It converts a sparse user spec into a set of structural
 * decisions: task shape, verifier class, thinking tier, topology, and reflection
 * depth. Everything downstream is rendering.
 *
 * Design rationale (docs/adr/0002-router-over-templates.md): a template filler
 * produces the same scaffold regardless of task, which is exactly the failure the
 * research warns about — ToT is a 10–100× tax on linear tasks, multi-agent
 * *increases* error on tightly-coupled work, and Heavy thinking is flat-to-negative
 * on retrieval and style tasks. Structural choices must therefore be conditional.
 */
import { domains } from "../kb/domains.js";
import { resolveShape } from "./shape.js";

export const lines = s => (s||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
export const csv   = s => (s||"").split(/[,\n]/).map(x=>x.trim()).filter(Boolean);

const CANONICAL = /canonical|single number|one answer|classify|which of/;
const NOVEL     = /\b(novel|new approach|from scratch|greenfield|no precedent|unprecedented)/;

export function route(S){
  const t = ((S.task||"")+" "+(S.constraints||"")+" "+(S.deliverable||"")).toLowerCase();
  const D = domains[S.domain] || domains.general;

  // --- task shape ---------------------------------------------------------
  // Scored classifier (src/engine/shape.js) rather than the old last-match-wins
  // regex chain. It also returns a confidence, which matters: measured accuracy
  // on unseen phrasings is ~47% top-1 / ~80-87% on the binaries that actually
  // change routing (docs/EVALUATION.md). We therefore treat a low-confidence
  // call as "no signal" and fall back to the domain's default shape rather than
  // committing to an expensive topology on a coin flip.
  const shapeCall = resolveShape(S, t);
  const shape = shapeCall.shape;
  const shapeConfidence = shapeCall.confidence;
  const shapeOverride = shapeCall.override || null;

  // NO CONFIDENCE GATE — deliberately. A "fall back to linear below 0.62"
  // rule was implemented here and then removed after measurement: across all
  // 120 labeled cases it fired 3 times, destroyed 3 correct classifications,
  // and rescued zero incorrect ones (it never fired at all on the holdout).
  // Low confidence turned out to mean "two shapes are plausible", not "the
  // top pick is wrong", so overriding the top pick only discarded information.
  //
  // Confidence is still computed and still surfaced in the UI, where a human
  // can act on it. It just doesn't silently change the routing.
  // See docs/EVALUATION.md, "Case study: the shape classifier".
  const shapeGated = false;

  // --- verifier class -----------------------------------------------------
  // Machine-consumed output always admits a programmatic check (schema at minimum).
  let verifier = D.verifier;
  if(S.consumer==="json" || S.consumer==="code") verifier="programmatic";

  const risk = S.risk || "medium";
  const constraintCount = lines(S.constraints).length;
  const novel = NOVEL.test(t);
  const toolCount = csv(S.toolList).length;

  // --- thinking tier (R20) ------------------------------------------------
  let tier;
  if(risk==="high" || (shape==="search" && novel))                 tier="heavy";
  else if(verifier==="programmatic" && shape!=="linear")           tier="extended";
  else if(constraintCount>=5 || shape==="search" || shape==="aggregation") tier="extended";
  else if(S.domain==="writing" || S.domain==="extract")            tier="light";
  else tier = D.tierBias;
  if(risk==="low"  && tier==="heavy") tier="extended";
  if(risk==="high" && tier==="light") tier="extended";

  // --- topology (T2 META-ARCHITECT rule set) ------------------------------
  let topo, topoWhy, maxRounds=1;
  if(shape==="exploration" && S.tools){
    topo = verifier==="programmatic" ? "Plan-and-Execute with a nested verify loop" : "Plan-and-Execute + compaction";
    topoWhy = "Long-horizon tool use. A frozen plan with a cheap per-step executor avoids the drift and looping that pure ReAct produces past ~20 steps"
            + (verifier==="programmatic"
               ? ", and each step's artifact is checked by a real verifier before the plan advances (R05)."
               : "; compaction keeps working context under half the window (R02).");
    maxRounds=3;
  } else if(verifier==="programmatic"){
    topo="Generate → Verify loop";
    topoWhy="A sound programmatic verifier exists, so generate-and-verify dominates every sampling strategy (R05).";
    maxRounds=3;
  } else if(shape==="search" && tier==="heavy"){
    topo="Tree-of-Thoughts (b=3, d=4, beam=2) + Evaluator";
    topoWhy="Search-shaped task with branchable, evaluable intermediate states — the only class where ToT's 10–100× cost pays for itself (R08).";
    maxRounds=4;
  } else if(shape==="aggregation"){
    topo="Graph-of-Thoughts: N extractors → 1 aggregator → 1 refiner";
    topoWhy="Aggregation-shaped work needs merge operators that a tree cannot express; GoT beats ToT here at lower cost.";
    maxRounds=2;
  } else if(CANONICAL.test(t) && tier!=="light"){
    topo="Self-Consistency @ k=8, weighted vote";
    topoWhy="Canonical-form answer with no verifier — majority voting is the cheapest reliable lift; saturates near k=16 (R07).";
    maxRounds=1;
  } else {
    topo="Single expert + Recursive Reflection";
    topoWhy="Tightly-coupled or linear work. Splitting it across agents would increase error, not reduce it (R16).";
    maxRounds=2;
  }

  // --- reflection depth (R06) ---------------------------------------------
  let reflect = verifier==="programmatic" ? 3 : (risk==="high" ? 2 : (risk==="low" ? 1 : 2));
  if(tier==="light") reflect = Math.min(reflect, 1);

  // --- calibration / abstention -------------------------------------------
  // Selective prediction is worth its cost when a wrong answer is expensive and
  // no programmatic gate will catch it.
  const abstention = (risk==="high" && verifier!=="programmatic") ||
                     topo.startsWith("Self-Consistency");

  return {shape, verifier, tier, topo, topoWhy, maxRounds, reflect, novel,
          constraintCount, toolCount, abstention,
          shapeConfidence, shapeOverride, shapeGated,
          shapeRunnerUp: shapeCall.runnerUp, shapeScores: shapeCall.scores,
          multiAgent: topo.startsWith("Graph") || topo.startsWith("Tree")};
}
