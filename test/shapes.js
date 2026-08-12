/**
 * Shape classification accuracy harness — `node test/shapes.js`
 *
 * ── Why this reports three numbers instead of one ─────────────────────────
 * The classifier's features were fitted against fixtures/shapes.js and
 * fixtures/shapes-dev.js. It scores 100% on both. That number does not predict
 * real-world accuracy and must never be quoted as if it did: an earlier version
 * of this classifier scored 98.3% on its tuning set and 33.3% on unseen cases.
 *
 * The number that matters is HOLDOUT, measured on fixtures/shapes-holdout.js,
 * which has never been tuned against. It is currently ~47% top-1.
 *
 * The number that matters *operationally* is the decision-relevant binary
 * accuracy, because top-1 shape is not what the router consumes. Measured with
 * impact analysis (see docs/EVALUATION.md), free-text shape changes the emitted
 * prompt in only 6 of 48 domain×consumer×risk cells, and in those cells the live
 * question is "aggregation or not" and "search or not". Those binaries run
 * 80-87% on holdout — much better than 47%, and the honest figure to cite.
 *
 * GATES (deliberately set at the holdout numbers, not the tuning numbers):
 *   - tuning-set regression: must stay >= 95% (catches feature breakage)
 *   - holdout top-1:          must stay >= 40% (catches catastrophic regression)
 *   - holdout binaries:       must stay >= 75% (the operational contract)
 *   - ambiguous cases must be less confident than clear ones (calibration)
 */
import { classifyShape } from "../src/engine/shape.js";
import { shapeCases, ambiguousCases } from "./fixtures/shapes.js";
import { devCases } from "./fixtures/shapes-dev.js";
import { holdoutCases } from "./fixtures/shapes-holdout.js";

const SHAPES = ["linear","search","aggregation","verification","exploration"];
const argv = process.argv.slice(2);
const VERBOSE = argv.includes("-v") || argv.includes("--verbose");
const C = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`,
            y:s=>`\x1b[33m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m`, d:s=>`\x1b[2m${s}\x1b[0m` };

let failures = 0;
const fail = m => { failures++; console.log(`  ${C.r("✗")} ${m}`); };

/* ─── 1. tuning set: regression guard, NOT an accuracy claim ─────────────── */
let strict = 0, accepted = 0;
const misses = [];
const confusion = Object.fromEntries(SHAPES.map(a => [a, Object.fromEntries(SHAPES.map(b => [b,0]))]));

for(const c of shapeCases){
  const r = classifyShape(c.t, {tools: !!c.tools});
  confusion[c.s][r.shape]++;
  const exact = r.shape === c.s;
  if(exact) strict++;
  if(exact || (c.alt && r.shape === c.alt)) accepted++;
  else misses.push({task:c.t, want:c.s, alt:c.alt, got:r.shape, conf:r.confidence, scores:r.scores});
}
const n = shapeCases.length;

console.log(`\n${C.b("1. Tuning set")} ${C.d("(fitted against — regression guard only)")}`);
console.log(`   exact ${strict}/${n}  ${(100*strict/n).toFixed(1)}%     accepted-alt ${accepted}/${n}  ${(100*accepted/n).toFixed(1)}%`);

console.log(`\n   ${C.d("confusion (rows = expected, cols = predicted)")}`);
console.log("   " + "".padEnd(13) + SHAPES.map(s=>s.slice(0,6).padStart(8)).join(""));
for(const want of SHAPES){
  const row = SHAPES.map(got => {
    const v = confusion[want][got];
    if(!v) return C.d("·".padStart(8));
    return (want===got ? C.g : C.r)(String(v).padStart(8));
  }).join("");
  console.log("   " + want.padEnd(13) + row);
}
if(misses.length){
  console.log(`\n   ${C.b(`misses (${misses.length})`)}`);
  for(const m of misses){
    console.log(`   ${C.r("✗")} want=${m.want}${m.alt?`|${m.alt}`:""} got=${m.got} conf=${m.conf.toFixed(2)}  "${m.task}"`);
    if(VERBOSE) console.log(`       ${Object.entries(m.scores).map(([k,v])=>`${k}:${v.toFixed(1)}`).join("  ")}`);
  }
}

/* ─── 2. dev set ─────────────────────────────────────────────────────────── */
let devOk = 0;
for(const c of devCases) if(classifyShape(c.t,{tools:!!c.tools}).shape === c.s) devOk++;
console.log(`\n${C.b("2. Dev set")} ${C.d("(also fitted against)")}`);
console.log(`   ${devOk}/${devCases.length}  ${(100*devOk/devCases.length).toFixed(1)}%`);

/* ─── 3. HOLDOUT — the only unbiased number ──────────────────────────────── */
let hoOk = 0, aggOk = 0, srchOk = 0, explOk = 0;
const hoByShape = {};
for(const c of holdoutCases){
  const r = classifyShape(c.t, {tools: !!c.tools});
  hoByShape[c.s] ??= [0,0]; hoByShape[c.s][1]++;
  if(r.shape === c.s){ hoOk++; hoByShape[c.s][0]++; }
  if((r.shape==="aggregation") === (c.s==="aggregation")) aggOk++;
  if((r.shape==="search")      === (c.s==="search"))      srchOk++;
  if((r.shape==="exploration") === (c.s==="exploration")) explOk++;
}
const hn = holdoutCases.length;
const hoPct = 100*hoOk/hn;
const binMin = Math.min(aggOk, srchOk, explOk);
const binPct = 100*binMin/hn;

console.log(`\n${C.b("3. HOLDOUT")} ${C.y("(never tuned against — the real number)")}`);
console.log(`   top-1 ${hoOk}/${hn}  ${C.b(hoPct.toFixed(1)+"%")}`);
console.log(`   ${C.d("per shape: " + Object.entries(hoByShape).map(([k,v])=>`${k} ${v[0]}/${v[1]}`).join("  "))}`);
console.log(`\n   ${C.b("decision-relevant binaries")} ${C.d("(what the router actually consumes)")}`);
console.log(`   aggregation vs not  ${aggOk}/${hn}  ${(100*aggOk/hn).toFixed(1)}%   ${C.d("→ selects Graph-of-Thoughts")}`);
console.log(`   search vs not       ${srchOk}/${hn}  ${(100*srchOk/hn).toFixed(1)}%   ${C.d("→ selects Tree-of-Thoughts (high risk only)")}`);
console.log(`   exploration vs not  ${explOk}/${hn}  ${(100*explOk/hn).toFixed(1)}%   ${C.d("→ selects Plan-and-Execute")}`);

/* ─── 4. calibration: ambiguity must be visible ──────────────────────────── */
const mean = a => a.reduce((x,y)=>x+y,0)/(a.length||1);
const clear = shapeCases.filter(c => !c.alt).map(c => classifyShape(c.t,{tools:!!c.tools}).confidence);
const ambig = ambiguousCases.map(c => classifyShape(c.t,{tools:!!c.tools}).confidence);
const mClear = mean(clear), mAmbig = mean(ambig);
console.log(`\n${C.b("4. Confidence calibration")}`);
console.log(`   mean confidence, clear cases      ${mClear.toFixed(2)}`);
console.log(`   mean confidence, ambiguous cases  ${mAmbig.toFixed(2)}`);
console.log(`   ${C.d(`ambiguous flagged low (<0.60): ${ambig.filter(x=>x<0.6).length}/${ambig.length}`)}`);

/* ─── gates ──────────────────────────────────────────────────────────────── */
console.log(`\n${"─".repeat(60)}`);
if(100*strict/n < 95) fail(`tuning-set accuracy ${(100*strict/n).toFixed(1)}% < 95% — features regressed`);
if(hoPct < 40)  fail(`holdout top-1 ${hoPct.toFixed(1)}% < 40% floor`);
if(binPct < 75) fail(`weakest holdout binary ${binPct.toFixed(1)}% < 75% — routing contract broken`);
if(mAmbig >= mClear) fail(`ambiguous cases (${mAmbig.toFixed(2)}) not less confident than clear ones (${mClear.toFixed(2)})`);

if(failures){
  console.log(C.r(`\n✗ ${failures} gate(s) failed`));
  process.exit(1);
}
console.log(C.g(`✓ holdout top-1 ${hoPct.toFixed(1)}%, weakest binary ${binPct.toFixed(1)}%, ambiguity surfaced`));
console.log(C.d(`  Quote the holdout figures, never the tuning-set 100%.`));
