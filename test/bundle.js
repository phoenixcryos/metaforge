/**
 * Bundle smoke test — `node test/bundle.js` (run after `npm run build`).
 *
 * The ES-module -> single-script transform in build.js is the one place where a
 * change can pass every unit test and still ship a broken page (e.g. a namespace
 * import whose object was never rebuilt). This test executes the bundled engine
 * in isolation, exactly as the browser would, and asserts it still works.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist/index.html");

let pass=0, fail=0; const errs=[];
const ok=(c,n,d="")=>{ c?pass++:(fail++,errs.push(n+(d?" :: "+d:""))); };

if(!existsSync(DIST)){ console.error("✗ dist/index.html missing — run `npm run build` first"); process.exit(1); }
const html = readFileSync(DIST,"utf8");

/* ---- 1. artifact shape -------------------------------------------------- */
ok(html.startsWith("<!DOCTYPE html>"), "starts with doctype");
ok(/<\/html>\s*$/.test(html), "ends with </html>");
ok(!/\bsrc\s*=\s*["']https?:/i.test(html), "no external script src (offline-safe)");
ok(!/<link[^>]+href\s*=\s*["']https?:/i.test(html), "no external stylesheet");
ok(!/@import\s+url\(\s*["']?https?:/i.test(html), "no remote @import");
ok(html.includes("<style>"), "styles inlined");
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g)||[];
ok(scripts.length===1, "exactly one script block", String(scripts.length));

/* ---- 2. no leftover module syntax -------------------------------------- */
const code = scripts[0].replace(/^<script>/,"").replace(/<\/script>$/,"");
const stripped = code.replace(/\/\*[\s\S]*?\*\//g,"").replace(/^\s*\/\/.*$/gm,"");
ok(!/^\s*import\s+/m.test(stripped),   "no leftover `import` statements");
ok(!/^\s*export\s+/m.test(stripped),   "no leftover `export` statements");
ok(!/\bfrom\s+["']\.\.?\//.test(stripped), "no relative module specifiers");

/* ---- 3. the bundled engine actually runs -------------------------------- */
// Emulate the browser: evaluate the engine portion, then probe it. The UI half
// touches the DOM, so we cut the script at the UI marker.
const UI_MARK = "/* ═══════════════ UI ═══════════════ */";
ok(code.includes(UI_MARK), "UI section marker present");
const engineOnly = code.split(UI_MARK)[0];

let api;
try{
  api = new Function(engineOnly + `
    return { compile, route, KB_VERSION, ENGINE_VERSION,
             domains, models, tiers, rules, presets, techniques, failures,
             trustClasses, contextModel, referenceBudget, selectionHeuristic };
  `)();
  ok(true, "bundled engine evaluates without throwing");
}catch(e){
  ok(false, "bundled engine evaluates without throwing", e.message);
  report();
}

if(api){
  ok(typeof api.compile==="function", "compile() exported from bundle");
  ok(typeof api.route==="function",   "route() exported from bundle");
  ok(api.failures && Array.isArray(api.failures.longContext),
     "namespace shim rebuilt `failures` correctly");
  ok(api.failures.compressionLadder.length===6, "compression ladder intact through bundling");

  const s = {task:"Refactor the billing module for latency.", deliverable:"A patch",
    domain:"code", model:"claude", consumer:"code", risk:"medium",
    constraints:"No schema migration.", audience:"Engineers", evidence:"", untrusted:"",
    tools:true, toolList:"read_file, run_tests", toolBudget:"", agentName:""};

  let o=null;
  try{ o=api.compile(s); ok(true,"compile() runs inside the bundle"); }
  catch(e){ ok(false,"compile() runs inside the bundle", e.message); }

  if(o){
    ok(o.sys.length>1500, "bundled compile yields a substantive prompt", String(o.sys.length));
    // the exact failure that shipped once: a namespace deref inside buildSystem
    ok(o.sys.includes("# SUCCESS_CRITERIA"), "section builders (namespace X) reachable");
    ok(o.sys.includes("# VERIFICATION_GATES"), "verification gates rendered");
    ok(o.sys.includes("# TOOL_POLICY"), "tool policy rendered");
    ok(!/undefined|NaN|\[object Object\]/.test(o.sys+o.usr+o.adp), "no leaks in bundled output");
    ok(o.provenance.context_hash && o.provenance.engine_version, "provenance stamped in bundle");
    // parity with the source engine
    const src = await import("../src/engine/compile.js");
    const ref = src.compile(s);
    ok(ref.sys===o.sys, "bundled output is byte-identical to source engine");
    ok(ref.provenance.context_hash===o.provenance.context_hash, "hash parity source vs bundle");
  }

  // every preset survives bundling
  let bad=0;
  for(const [k,p] of Object.entries(api.presets)){
    const {_label, ...clean}=p;
    try{
      const r=api.compile({audience:"", untrusted:"", toolBudget:"", agentName:"", ...clean});
      if(r.sys.length<1500) bad++;
    }catch(e){ bad++; errs.push(`preset ${k} threw in bundle :: ${e.message}`); }
  }
  ok(bad===0, "all presets compile inside the bundle", `${bad} failed`);
}

/* ---- 4. version stamps agree ------------------------------------------- */
const pkg = JSON.parse(readFileSync(join(ROOT,"package.json"),"utf8"));
ok(html.includes(`MetaForge v${pkg.version}`), "build banner matches package version");
if(api) ok(html.includes(api.ENGINE_VERSION), "engine version present in artifact");

report();
function report(){
  console.log(`\n${"─".repeat(52)}`);
  if(fail){
    console.log(`\x1b[31m✗ ${fail} failed\x1b[0m, \x1b[32m${pass} passed\x1b[0m\n`);
    errs.forEach(e=>console.log("  ✗ "+e));
    process.exit(1);
  }
  console.log(`\x1b[32m✓ bundle: all ${pass} assertions passed\x1b[0m`);
}
