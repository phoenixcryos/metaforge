/**
 * UI wiring invariants — `node test/ui.js`
 *
 * The unit suite tests the engine and test/bundle.js tests the artifact, but
 * neither can see the DOM: a typo'd element id ships a button that silently
 * does nothing, and nothing in CI would notice. We cannot run a browser here
 * (zero-dependency commitment, ADR-0001), so this suite asserts the WIRING
 * contract statically:
 *
 *   1. Every literal $("…") lookup in app.js resolves to an id in app.html.
 *   2. The TABS array, the tab buttons' data-tab attributes, and the section
 *      ids are one consistent set.
 *   3. No duplicate ids in app.html.
 *   4. Every spec field documented in docs/API.md has a form control.
 *   5. Indexed lookups (querySelectorAll(".adv")[0..1]) have enough targets.
 *   6. simple.js stays pure logic: it exposes MetaForgeSimple and touches no
 *      DOM ids (wiring lives in app.js).
 *   7. No external URLs in UI sources (the offline commitment, at source level).
 *
 * If you add a legitimately dynamic getElementById call (argument that is not
 * a quoted literal), this suite fails on purpose: make the lookup static-analy-
 * zable, or extend the known-dynamic allowlist here with a comment explaining
 * why the case is safe.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(join(ROOT, p), "utf8");

const html   = read("src/ui/app.html");
const app    = read("src/ui/app.js");
const simple = read("src/ui/simple.js");
const css    = read("src/ui/styles.css");

let pass=0, fail=0; const errs=[];
const ok=(c,n,d="")=>{ c?pass++:(fail++,errs.push(n+(d?" :: "+d:""))); };
const group=n=>console.log(`\n\x1b[1m${n}\x1b[0m`);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const idSet = new Set(ids);

/* ---------- 1. static id lookups ---------------------------------------- */
group("Element id wiring");

// Known-dynamic lookups, each constrained and re-verified below:
//   $(id)  — TABS.forEach; array checked as a set against sections
//   $(f)   — loops over literal string arrays (preset fill, change listeners);
//            every array member is asserted to exist as an id this run
// Anything else dynamic is a smell; static-analysis-friendly code only.
const KNOWN_DYNAMIC = new Set(["id", "f"]);

let dynamicHits = [];
let missing = [];
for(const m of app.matchAll(/\$\(([^)]*)\)/g)){
  const arg = m[1].trim();
  const lit = arg.match(/^"([^"]+)"$/) || arg.match(/^'([^']+)'$/);
  if(lit){
    if(!idSet.has(lit[1])) missing.push(lit[1]);
  }else if(!KNOWN_DYNAMIC.has(arg)){
    dynamicHits.push(arg);
  }
}
ok(missing.length===0, "every $(\"…\") in app.js exists as an id in app.html",
   missing.join(", "));
ok(dynamicHits.length===0, "no unaudited dynamic $(arg) lookups",
   dynamicHits.join(", "));

// The $(f) loops are only as safe as their arrays — drain them into ids too.
let loopArrays = 0;
for(const m of app.matchAll(/\[((?:"[^"]+",?\s*)+)\]\s*\.forEach\(f\s*=>/g)){
  loopArrays++;
  const members = [...m[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]);
  for(const f of members) ok(idSet.has(f), `forEach($(f)) member "${f}" exists as an id`);
}
ok(loopArrays===2, "both known $(f) loops found (preset fill, change listeners)",
   `${loopArrays} found`);

/* ---------- 2. tabs are one consistent set ------------------------------- */
const tabArray = (app.match(/const TABS = \[([^\]]*)\]/)||[,""])[1]
  .split(",").map(s=>s.trim().replace(/["']/g,"")).filter(Boolean);
const tabButtons = [...html.matchAll(/data-tab="([^"]+)"/g)].map(m=>m[1]);
ok(tabArray.length===5, "TABS array has the 5 expected tabs", tabArray.join(","));
for(const t of tabArray){
  ok(idSet.has(t), `tab section #${t} exists in app.html`);
  ok(tabButtons.includes(t), `tab button data-tab="${t}" exists`);
}
ok(tabButtons.length===tabArray.length, "no orphan tab buttons",
   `buttons=${tabButtons.length} array=${tabArray.length}`);

/* ---------- 3. no duplicate ids ----------------------------------------- */
ok(ids.length===idSet.size, "no duplicate id attributes in app.html",
   `${ids.length} ids, ${idSet.size} unique`);

/* ---------- 4. every documented spec field has a control ----------------- */
// The contract in docs/API.md; the advanced form reads values by these ids.
const SPEC_FIELDS = ["task","deliverable","domain","model","consumer","risk",
  "constraints","audience","evidence","untrusted","tools","toolList",
  "toolBudget","agentName"];
for(const f of SPEC_FIELDS) ok(idSet.has(f), `spec field #${f} has a form control`);

/* ---------- 5. indexed lookups have enough targets ------------------------ */
const advCount = (html.match(/class="adv"/g)||[]).length;
ok(advCount>=2, 'querySelectorAll(".adv")[0..1] has targets', `${advCount} found`);
const riskVals = [...html.matchAll(/data-v="([^"]+)"/g)].map(m=>m[1]);
for(const v of ["low","medium","high"]) ok(riskVals.includes(v), `risk button data-v="${v}" exists`);

// simple mode radios are generated from SM.Q2_OPTIONS/Q3_OPTIONS — assert the
// source data exists and ids used by the generator are in the HTML.
for(const sid of ["sq1","sq2","sq3","sq4","simple-go","simple-review","simple-chips","simple-presets"])
  ok(idSet.has(sid), `simple-mode container #${sid} exists`);

/* ---------- 6. simple.js stays pure logic -------------------------------- */
ok(/window\.MetaForgeSimple\s*=|globalThis\.MetaForgeSimple\s*=/.test(simple),
   "simple.js exposes MetaForgeSimple");
ok(!/getElementById|\$\(|querySelector/.test(simple),
   "simple.js touches no DOM (wiring lives in app.js)");
ok(/simpleToSpec/.test(simple), "simple.js exports simpleToSpec");

/* ---------- 7. offline commitment at source level ------------------------- */
const blob = html + "\n" + app + "\n" + simple + "\n" + css;
ok(!/(src|href)\s*=\s*["']https?:/i.test(blob), "no external script/style/image URLs in UI sources");
ok(!/@import\s+url/i.test(css), "no remote @import in styles.css");
ok(!/\bfetch\(|XMLHttpRequest|navigator\.sendBeacon/.test(app+simple),
   "UI makes no network calls");

/* ---------- report ------------------------------------------------------- */
console.log(`\n${"─".repeat(52)}`);
if(fail){
  console.log(`\x1b[31m✗ ${fail} failed\x1b[0m, \x1b[32m${pass} passed\x1b[0m\n`);
  errs.forEach(e=>console.log("  ✗ "+e));
  process.exit(1);
}
console.log(`\x1b[32m✓ ui: all ${pass} wiring assertions passed\x1b[0m`);
