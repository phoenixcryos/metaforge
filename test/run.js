/**
 * MetaForge test suite. Zero dependencies — `node test/run.js`.
 *
 * Philosophy: this tool's output is prose, so we cannot assert exact strings
 * without making every wording tweak a test failure. Instead we assert
 * INVARIANTS — properties that must hold for the tool to be correct:
 *   1. Every spec in the input space compiles without throwing.
 *   2. No compiled artifact leaks `undefined`/`NaN`/unresolved placeholders.
 *   3. Routing decisions match the documented decision rule.
 *   4. Structural rules (R02–R24) are actually present in the output.
 *   5. The KB is well-formed.
 */
import { compile, est, hash } from "../src/engine/compile.js";
import { route } from "../src/engine/router.js";
import { models, tiers } from "../src/kb/models.js";
import { domains, REQUIRED_DOMAIN_KEYS } from "../src/kb/domains.js";
import { rules } from "../src/kb/rules.js";
import { presets } from "../src/kb/presets.js";
import { techniques } from "../src/kb/techniques.js";

let pass=0, fail=0; const failures=[];
const ok=(cond,name,detail="")=>{ if(cond){pass++;} else {fail++; failures.push(name+(detail?" :: "+detail:""));} };
const group=n=>console.log(`\n\x1b[1m${n}\x1b[0m`);

const base = {task:"Do a representative task.", deliverable:"A thing", domain:"general",
  model:"agnostic", consumer:"human", risk:"medium", constraints:"One limit.",
  audience:"Engineers", evidence:"", untrusted:"", tools:false, toolList:"",
  toolBudget:"", agentName:""};
const spec = o => ({...base, ...o});

/* ---------- 1. KB well-formedness --------------------------------------- */
group("KB integrity");
ok(Object.keys(domains).length>=8, "domains: at least 8 profiles");
for(const [k,d] of Object.entries(domains)){
  for(const key of REQUIRED_DOMAIN_KEYS) ok(key in d, `domain ${k}: has ${key}`);
  ok(Array.isArray(d.must)&&d.must.length>0,  `domain ${k}: non-empty must[]`);
  ok(Array.isArray(d.never)&&d.never.length>0,`domain ${k}: non-empty never[]`);
  ok(["programmatic","llm_judge","none"].includes(d.verifier), `domain ${k}: valid verifier`, d.verifier);
  ok(["light","extended","heavy"].includes(d.tierBias), `domain ${k}: valid tierBias`, d.tierBias);
  ok(d.never.every(n=>n.startsWith("NEVER")), `domain ${k}: never[] entries start with NEVER`);
}
for(const [k,m] of Object.entries(models)){
  ok(typeof m.window==="number"&&m.window>0, `model ${k}: window`);
  ok(m.tips.length>=3, `model ${k}: >=3 dialect tips`);
  // EFFORT/BUDGET are substituted inside the template; EFFORT already sits in quotes.
  let parsed=null, perr="";
  try{ parsed=JSON.parse(m.param.replace("BUDGET","1").replace("EFFORT","medium")); }catch(e){ perr=e.message; }
  ok(parsed!==null, `model ${k}: param template is valid JSON`, perr);
}
ok(rules.length===24, "rules: exactly R01–R24", String(rules.length));
ok(rules.every((r,i)=>r.id===`R${String(i+1).padStart(2,"0")}`), "rules: ids sequential");
ok(rules.every(r=>r.enforcedBy), "rules: every rule names an enforcer");
ok(techniques.every(t=>t.id&&t.name&&t.mech&&t.cost&&t.gain&&t.use), "techniques: all fields present");
ok(new Set(techniques.map(t=>t.id)).size===techniques.length, "techniques: unique ids");

/* ---------- 2. Exhaustive compile sweep --------------------------------- */
group("Exhaustive compile sweep");
let n=0, leaks=0, threw=0;
const BAD = /undefined|NaN|\[object Object\]|\{\{|VERIFICATION\b(?!_GATES)/;
for(const model of Object.keys(models))
for(const domain of Object.keys(domains))
for(const consumer of ["human","json","code","doc"])
for(const risk of ["low","medium","high"])
for(const tools of [true,false]){
  const s=spec({model,domain,consumer,risk,tools,
    task:"Compare and design an optimized system for verification of data.",
    toolList:tools?"a, b, c":"", evidence:"e", untrusted:"u", agentName:"Atlas"});
  try{
    const o=compile(s); n++;
    const blob=o.sys+o.usr+o.adp;
    if(BAD.test(blob)){ leaks++; if(leaks<4) failures.push(`leak: ${model}/${domain}/${consumer}/${risk}/${tools}`); }
  }catch(e){ threw++; if(threw<4) failures.push(`threw: ${model}/${domain}/${consumer}/${risk} :: ${e.message}`); }
}
ok(threw===0, `sweep: ${n} specs compiled without throwing`, `${threw} threw`);
ok(leaks===0, `sweep: no placeholder/undefined leaks`, `${leaks} leaked`);
console.log(`  swept ${n} combinations`);

/* ---------- 3. Router decision rule ------------------------------------- */
group("Router decision rule");
ok(route(spec({consumer:"json"})).verifier==="programmatic", "machine-consumed output => programmatic verifier");
ok(route(spec({consumer:"code"})).verifier==="programmatic", "code output => programmatic verifier");
ok(route(spec({consumer:"json"})).topo.startsWith("Generate"), "verifier present => generate-verify loop (R05)");
ok(route(spec({domain:"writing",consumer:"human",risk:"low"})).tier==="light", "style task => Light tier");
ok(route(spec({domain:"extract",consumer:"human",risk:"low"})).tier==="light", "extraction => Light tier");
ok(route(spec({risk:"high",domain:"arch",consumer:"human"})).tier==="heavy", "high risk => Heavy tier");
ok(route(spec({domain:"research",consumer:"human"})).topo.startsWith("Graph"), "aggregation shape => GoT");
ok(route(spec({domain:"agent",tools:true,consumer:"human",
     task:"Investigate and triage incidents."})).topo.startsWith("Plan"), "tool exploration => Plan-and-Execute");
ok(route(spec({domain:"arch",risk:"high",consumer:"human",
     task:"Design a novel greenfield scheduling architecture from scratch."})).topo.startsWith("Tree"),
   "novel search + heavy => ToT (R08)");
ok(route(spec({domain:"general",consumer:"human",risk:"low",task:"Summarize this."})).topo.startsWith("Single"),
   "linear low-risk => single expert (R16)");

// reflection depth bounds (R06)
for(const risk of ["low","medium","high"]) for(const consumer of ["human","json","code","doc"]){
  const R=route(spec({risk,consumer}));
  ok(R.reflect>=1 && R.reflect<=3, `reflection depth in [1,3] (${risk}/${consumer})`, String(R.reflect));
  if(R.verifier!=="programmatic") ok(R.reflect<=2, `ungrounded reflection capped at 2 (${risk}/${consumer})`, String(R.reflect));
  if(R.tier==="light") ok(R.reflect===1, `light tier => reflection 1 (${risk}/${consumer})`);
}
// ToT/GoT never on linear tasks (R08)
for(const domain of Object.keys(domains)){
  const R=route(spec({domain,consumer:"human",risk:"low",task:"Rewrite this sentence."}));
  if(R.shape==="linear") ok(!R.multiAgent, `no branching topology on linear task (${domain})`, R.topo);
}

/* ---------- 4. Structural guarantees in output -------------------------- */
group("Prompt structural guarantees");
{
  const o=compile(spec({consumer:"json",tools:true,toolList:"a,b",untrusted:"x",risk:"high",domain:"security"}));
  ok(o.sys.includes("# FAILURE_MODE"),          "insufficiency escape hatch present (R24)");
  ok(o.sys.includes("insufficient_context"),    "insufficiency object named (R24)");
  ok(o.sys.includes("# CONSTRAINT_REPRISE"),    "tail constraint reprise present (R03/R11)");
  ok(o.sys.includes("# TRUST_BOUNDARY"),        "trust boundary present when untrusted input (R11)");
  ok(o.sys.includes("SUPPORTED"),               "groundedness labeling present");
  ok(o.sys.includes("# OUTPUT_CONTRACT"),       "output contract present (R14)");
  ok(o.sys.includes("# VERIFICATION_GATES"),    "verification gates present (R05)");
  ok(o.sys.indexOf("# IDENTITY") < o.sys.indexOf("# CONSTRAINT_REPRISE"), "identity at head, reprise at tail (R03)");
  ok(o.usr.includes("<untrusted_document"),     "untrusted input wrapped in typed tag (R11)");
  ok(o.provenance.context_hash.length>=12,      "context hash stamped (R19)");
  ok(o.provenance.kb_version && o.provenance.engine_version, "versions stamped");
}
{ // abstention appears exactly when the router asks for it
  const hi=compile(spec({risk:"high",domain:"arch",consumer:"human"}));
  ok(hi.R.abstention, "high risk + no programmatic verifier => abstention policy");
  ok(hi.sys.includes("# CALIBRATION_AND_ABSTENTION"), "abstention block rendered");
  const lo=compile(spec({risk:"low",domain:"writing",consumer:"human"}));
  ok(!lo.sys.includes("# CALIBRATION_AND_ABSTENTION"), "no abstention block on low-risk style task");
}
{ // tool policy only when tools enabled
  const withT=compile(spec({tools:true,toolList:"read_file"}));
  const noT  =compile(spec({tools:false}));
  ok(withT.sys.includes("# TOOL_POLICY"),  "tool policy present when tools enabled");
  ok(!noT.sys.includes("# TOOL_POLICY"),   "tool policy absent when tools disabled");
  ok(withT.sys.includes("read_file"),      "declared tool named in prompt");
}
{ // adapter strips schema params for prose consumers
  // Check the fenced param block only — "response_format" also appears in prose tips.
  const paramBlock = s => (s.adp.split("**Call parameters**")[1]||"");
  const prose=compile(spec({model:"gpt",consumer:"human"}));
  ok(!paramBlock(prose).includes("response_format"), "no structured-output param for prose output");
  const json=compile(spec({model:"gpt",consumer:"json"}));
  ok(paramBlock(json).includes("response_format"),   "structured-output param for JSON output");
  const light=compile(spec({model:"claude",domain:"writing",consumer:"human",risk:"low"}));
  ok(light.adp.includes('"disabled"'),       "thinking disabled on Light tier");
}
{ // domain expertise actually injected
  const sec=compile(spec({domain:"security",consumer:"human"}));
  ok(sec.sys.includes("exploitability"), "security domain injects exploitability gate");
  const code=compile(spec({domain:"code",consumer:"code"}));
  ok(code.sys.includes("NEVER invent file paths"), "code domain injects fabrication guard");
}

/* ---------- 5. Warnings fire correctly ---------------------------------- */
group("Diagnostics");
const warnOf = s => compile(s).W.map(w=>w[0]).join(" | ");
ok(warnOf(spec({deliverable:""})).includes("Deliverable"),        "warns on missing deliverable");
ok(warnOf(spec({constraints:""})).includes("hard constraints"),   "warns on missing constraints");
ok(warnOf(spec({tools:true,toolList:""})).includes("none named"), "warns on unbounded tool surface");
ok(warnOf(spec({tools:true,toolList:Array.from({length:25},(_,i)=>"t"+i).join(",")})).includes("25 tools"),
   "warns on tool catalog bloat");
ok(warnOf(spec({tools:true,toolList:"a",untrusted:"x"})).includes("lethal trifecta")
   || warnOf(spec({tools:true,toolList:"a",untrusted:"x"})).includes("Untrusted input + tools"),
   "warns on untrusted+tools co-location (R13)");
ok(warnOf(spec({evidence:"x".repeat(9000)})).includes("2k tokens"), "warns on oversized evidence (R04)");
ok(compile(spec({deliverable:"A thing",constraints:"A limit.",audience:"Eng",consumer:"human"})).W.length<=1,
   "well-specified input produces few warnings");

/* ---------- 6. Presets + determinism ------------------------------------ */
group("Presets & determinism");
for(const [k,p] of Object.entries(presets)){
  const {_label, ...clean}=p;
  const o=compile(spec(clean));
  ok(o.sys.length>1500, `preset ${k}: substantive system prompt`, String(o.sys.length));
  ok(o.W.length<=2,     `preset ${k}: <=2 warnings`, o.W.map(w=>w[0]).join(","));
}
{
  const a=compile(spec({consumer:"json"})), b=compile(spec({consumer:"json"}));
  ok(a.sys===b.sys, "compile is deterministic (same input => same prompt)");
  ok(a.provenance.context_hash===b.provenance.context_hash, "context hash is stable");
  const c=compile(spec({consumer:"json",risk:"high"}));
  ok(a.provenance.context_hash!==c.provenance.context_hash, "context hash changes with input");
}
ok(est("")>0 && est("abcd")>0, "token estimator returns positive");
ok(hash("a")!==hash("b"), "hash distinguishes inputs");

/* ---------- report ------------------------------------------------------ */
console.log(`\n${"─".repeat(52)}`);
if(fail){
  console.log(`\x1b[31m✗ ${fail} failed\x1b[0m, \x1b[32m${pass} passed\x1b[0m\n`);
  failures.slice(0,25).forEach(f=>console.log("  ✗ "+f));
  if(failures.length>25) console.log(`  … ${failures.length-25} more`);
  process.exit(1);
}
console.log(`\x1b[32m✓ all ${pass} assertions passed\x1b[0m`);
