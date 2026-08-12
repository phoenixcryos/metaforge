/**
 * MetaForge UI.
 * Vanilla DOM, no framework, no build step beyond concatenation. The engine is
 * already in scope (bundled above by build.js) — this file only wires it to the page.
 */
const $ = id => document.getElementById(id);
const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
let RISK = "medium", LAST = null;

/* ---- version stamp ------------------------------------------------------ */
$("vstamp").textContent = `v${ENGINE_VERSION} · kb ${KB_VERSION}`;

/* ---- selects ------------------------------------------------------------ */
$("domain").innerHTML = Object.entries(domains).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join("");
$("model").innerHTML  = Object.entries(models ).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join("");
$("domain").value = "code";
$("model").value  = "claude";

/* ---- presets ------------------------------------------------------------ */
$("presets").innerHTML = Object.entries(presets)
  .map(([k,p])=>`<button class="pchip" data-p="${k}">${p._label}</button>`).join("");
$("presets").addEventListener("click", e => {
  const b = e.target.closest(".pchip"); if(!b) return;
  const p = presets[b.dataset.p];
  ["task","deliverable","domain","model","consumer","constraints","audience","evidence","toolList"]
    .forEach(f => { if($(f) && p[f]!==undefined) $(f).value = p[f]||""; });
  $("untrusted").value = p.untrusted||"";
  $("tools").checked = !!p.tools;
  setRisk(p.risk);
  if(p.evidence||p.untrusted) document.querySelectorAll(".adv")[0].open = true;
  if(p.tools) document.querySelectorAll(".adv")[1].open = true;
  run();
});

/* ---- risk --------------------------------------------------------------- */
function setRisk(v){ RISK=v; [...$("risk").children].forEach(b=>b.classList.toggle("on", b.dataset.v===v)); }
$("risk").addEventListener("click", e => {
  const b = e.target.closest("button"); if(b){ setRisk(b.dataset.v); if(LAST) run(); }
});

/* ---- tabs --------------------------------------------------------------- */
const TABS = ["forge","matrix","failures","rules","about"];
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("on"));
  t.classList.add("on");
  TABS.forEach(id => $(id).style.display = (id===t.dataset.tab) ? "block" : "none");
  window.scrollTo(0,0);
}));

/* ---- static reference tables -------------------------------------------- */
$("mrows").innerHTML = techniques.map(t =>
  `<tr><td>${t.name}</td><td>${t.mech}</td><td>${t.cost}</td><td>${t.gain}</td><td>${t.use}</td></tr>`).join("");
$("heur").textContent = selectionHeuristic;
$("trows").innerHTML = Object.values(tiers).map(t =>
  `<tr><td>${t.label}</td><td>${t.budget}</td><td>${t.when}</td><td>${t.controls}</td></tr>`).join("");
$("agrows").innerHTML = failures.aggregationMethods.map(a =>
  `<tr><td>${a.method}</td><td>${a.fit}</td></tr>`).join("");

$("lcgrid").innerHTML = failures.longContext.map(f =>
  `<div class="fm"><h4>${f.name}</h4><div class="m">${f.mech}</div>
   <div class="kv"><b>Signal</b> — ${f.signal}<br><b>Fix</b> — ${f.fix}</div></div>`).join("");
$("crrows").innerHTML = failures.contextRot.map(f =>
  `<tr><td>${f.name}</td><td>${f.desc}</td><td>${f.fix}</td></tr>`).join("");
$("rfgrid").innerHTML = failures.reflection.map(f =>
  `<div class="fm soft"><h4>${f.name}</h4><div class="m">${f.why}</div>
   <div class="kv"><b>Fix</b> — ${f.fix}</div></div>`).join("");
$("magrid").innerHTML = failures.multiAgent.map(f =>
  `<div class="fm info"><h4>${f.name}</h4><div class="m">${f.desc}</div></div>`).join("");
$("ladder").innerHTML = failures.compressionLadder.map(r =>
  `<div class="step"><div class="num">${r.rung}</div><div><div class="nm">${r.name}</div>
   <div class="dt">${r.detail}</div><div class="sv">saving: ${r.saving} · loss: ${r.loss}</div></div></div>`).join("");
$("csrows").innerHTML = failures.calibrationSignals.map(c =>
  `<tr><td>${c.name}</td><td>${c.reading}</td></tr>`).join("");

$("rrows").innerHTML = rules.map(r =>
  `<div class="rule"><span class="id">${r.id}</span><span class="tx">${r.text}
   <span style="color:var(--dim2);font-family:var(--mono);font-size:10.5px"> · ${r.enforcedBy}</span></span></div>`).join("");
$("tcrows").innerHTML = trustClasses.map(t =>
  `<tr><td>${t.cls}</td><td>${t.eg}</td><td>${t.influence}</td></tr>`).join("");
$("cform").textContent =
  contextModel.formula + "\n\n" +
  contextModel.symbols.map(([s,m])=>`  ${s.padEnd(5)} ${m}`).join("\n") + "\n\n" +
  contextModel.budgetFormula + "\n" +
  contextModel.budgetSymbols.map(([s,m])=>`  ${s.padEnd(5)} ${m}`).join("\n");
$("rbrows").innerHTML = referenceBudget.sections.map(([n,t,p]) =>
  `<tr><td>${n}</td><td>${t.toLocaleString()}</td><td>${p||"—"}</td></tr>`).join("")
  + `<tr><td><b>TOTAL</b></td><td><b>${referenceBudget.total.toLocaleString()}</b></td><td>compaction event at 85% fill</td></tr>`;

/* ---- clipboard / download ----------------------------------------------- */
function toast(m){ const t=$("toast"); t.textContent=m; t.classList.add("on"); setTimeout(()=>t.classList.remove("on"),1500); }
function copy(txt){
  const done = () => toast("Copied to clipboard");
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(txt).then(done).catch(()=>legacyCopy(txt));
  } else legacyCopy(txt);
  function legacyCopy(t){
    const ta=document.createElement("textarea");
    ta.value=t; ta.style.cssText="position:fixed;opacity:0";
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); done(); }catch(e){ toast("Copy failed — select manually"); }
    document.body.removeChild(ta);
  }
}
function download(name, txt, mime){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([txt],{type:mime||"text/markdown"}));
  a.download=name; a.click(); URL.revokeObjectURL(a.href); toast("Downloaded "+name);
}
window.__copy = k => copy(LAST[k]);
window.__dlMd = () => {
  const o=LAST, p=o.provenance;
  download("metaforge-prompt.md",
`# MetaForge compiled prompt

| | |
|---|---|
| Topology | ${o.R.topo} |
| Thinking tier | ${tiers[o.R.tier].label} (${tiers[o.R.tier].budget}) |
| Task shape | ${o.R.shape} |
| Verifier | ${o.R.verifier} |
| Reflection depth | ${o.R.reflect} |
| Context hash | \`${p.context_hash}\` |
| Compiler | engine ${p.engine_version} · kb ${p.kb_version} |

---

## SYSTEM PROMPT

\`\`\`markdown
${o.sys}
\`\`\`

---

## USER / TASK MESSAGE

\`\`\`markdown
${o.usr}
\`\`\`

---

## MODEL ADAPTER

${o.adp}
`);
};
window.__dlJson = () => {
  const o=LAST;
  download("metaforge-prompt.json", JSON.stringify({
    provenance:o.provenance, routing:o.R, budget:o.B,
    warnings:o.W.map(([t,d])=>({title:t,detail:d})),
    system_prompt:o.sys, user_message:o.usr, adapter_notes:o.adp
  },null,2), "application/json");
};

/* ---- minimal markdown renderer (adapter block only) --------------------- */
function md(s){
  s = esc(s);
  s = s.replace(/```json\n([\s\S]*?)```/g, (m,c)=>`<pre>${c}</pre>`);
  s = s.replace(/```\n?([\s\S]*?)```/g,    (m,c)=>`<pre>${c}</pre>`);
  s = s.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  s = s.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/^- (.+)$/gm, "<li>$1</li>");
  s = s.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>");
  return s.split(/\n{2,}/).map(p => /^\s*<(h2|ul|pre|blockquote)/.test(p) ? p : (p.trim()?`<p>${p}</p>`:"")).join("");
}

function section(title, size, body, copyKey, isMd){
  return `<div class="sec"><div class="h"><span class="t">${title}</span><span class="sz">${size}</span>
    <span class="sp">${copyKey?`<button class="btn ghost" onclick="__copy('${copyKey}')">Copy</button>`:""}</span></div>
    ${isMd?`<div class="md">${body}</div>`:`<pre>${esc(body)}</pre>`}</div>`;
}

/* ---- render ------------------------------------------------------------- */
function render(o){
  const T = tiers[o.R.tier], M = models[$("model").value], p = o.provenance;
  let h = "";

  h += `<div class="rt"><h2>Compiled</h2>
    <span class="pill ${!o.R.shapeOverride && o.R.shapeConfidence<0.7 ? "w":"a"}">${o.R.shape}${
      !o.R.shapeOverride && o.R.shapeConfidence < 0.7 ? " ?" : ""}</span>
    <span class="pill b">${T.label} thinking</span>
    <span class="pill ${o.R.verifier==="programmatic"?"a":o.R.verifier==="none"?"w":"b"}">verifier: ${o.R.verifier}</span>
    <span class="pill ${RISK==="high"?"r":RISK==="low"?"a":"w"}">${RISK} stakes</span>
    ${o.R.abstention?'<span class="pill w">abstention</span>':""}
    <div style="margin-left:auto;display:flex;gap:6px">
      <button class="btn ghost" onclick="__copy('combined')">Copy all</button>
      <button class="btn ghost" onclick="__dlMd()">.md</button>
      <button class="btn ghost" onclick="__dlJson()">.json</button>
    </div></div>`;

  // Shape provenance. The classifier is ~47% top-1 on unseen phrasings, so the
  // user needs to know whether shape came from their domain selection (a fact)
  // or from reading their wording (an inference), and how close the call was.
  // Low confidence does not change routing — see the note in router.js — it is
  // shown so a human can override by picking a domain.
  const shapeNote = o.R.shapeOverride
    ? `<p><b>Shape: ${o.R.shape}</b> — set by your <b>${o.R.shapeOverride.replace("domain:","")}</b> selection, not inferred from wording.</p>`
    : o.R.shapeConfidence < 0.7
      ? `<p><b>Shape: ${o.R.shape}</b> — read from your wording, but this was a close call (${(o.R.shapeConfidence*100).toFixed(0)}% confidence; <b>${o.R.shapeRunnerUp}</b> was nearly as plausible). Shape decides the topology below, so if that looks wrong, <b>pick a specific domain</b> to set it explicitly.</p>`
      : o.R.shapeConfidence < 0.8
        ? `<p><b>Shape: ${o.R.shape}</b> — inferred from wording at ${(o.R.shapeConfidence*100).toFixed(0)}% confidence; <b>${o.R.shapeRunnerUp}</b> was second. Worth a glance.</p>`
        : "";

  h += `<div class="why"><div class="t">Routing decision</div>
    ${shapeNote}
    <p><b>${o.R.topo}</b> — ${o.R.topoWhy}</p>
    <p><b>${T.label} reasoning budget</b> (${T.budget}) — ${T.when.toLowerCase()}. ${M.thinking}</p>
    <p><b>Reflection depth ${o.R.reflect}</b> — ${o.R.verifier==="programmatic"
        ? "a real verifier grounds each round, so iteration keeps paying."
        : "critique is ungrounded here, so the loop is capped before it starts flipping correct answers to incorrect ones."}</p>
    ${o.R.abstention?`<p><b>Abstention policy included</b> — a wrong answer costs more than no answer, and no programmatic gate will catch one.</p>`:""}
    </div>`;

  h += `<div class="cards">
    <div class="card"><div class="k">System</div><div class="v">${o.B.sysT.toLocaleString()}</div><div class="n">prompt tokens</div></div>
    <div class="card"><div class="k">Task + data</div><div class="v">${o.B.usrT.toLocaleString()}</div><div class="n">tokens</div></div>
    <div class="card"><div class="k">Reasoning</div><div class="v">${o.B.think.toLocaleString()}</div><div class="n">budgeted</div></div>
    <div class="card"><div class="k">Output</div><div class="v">${o.B.outT.toLocaleString()}</div><div class="n">reserved</div></div>
    <div class="card"><div class="k">Effective window</div><div class="v">${o.B.pct}%</div>
      <div class="bar"><i class="${o.B.pct>80?"hot":""}" style="width:${o.B.pct}%"></i></div>
      <div class="n">${o.B.total.toLocaleString()} of ~${(o.B.effective/1000)|0}k usable (R02: half of ${(o.B.window/1000)|0}k)</div></div>
    </div>`;

  if(o.W.length){
    h += `<div class="warns">` + o.W.map(([t,d]) =>
      `<div class="warn"><span class="i">▲</span><div><div class="t">${t}</div><div class="d">${d}</div></div></div>`).join("") + `</div>`;
  }

  h += section("SYSTEM PROMPT", "~"+o.B.sysT+" tok", o.sys, "sys", false);
  h += section("USER / TASK MESSAGE", "~"+o.B.usrT+" tok", o.usr, "usr", false);
  h += section("MODEL ADAPTER", "dialect + params", md(o.adp), "adp", true);

  h += `<div class="prov"><b>provenance</b> · engine ${p.engine_version} · kb ${p.kb_version} · spec v${p.spec_version}<br>
    <b>context_hash</b> ${p.context_hash} &nbsp; <b>compiled</b> ${p.compiled_at}<br>
    <span style="color:var(--dim2)">Log this hash with eval runs — irreproducible contexts are the #1 cause of "the prompt regressed" (R19).</span></div>`;

  $("out").innerHTML = h;
  $("out").scrollTop = 0;
}

/* ---- run ---------------------------------------------------------------- */
function run(){
  const S = {
    task:$("task").value, deliverable:$("deliverable").value, domain:$("domain").value,
    model:$("model").value, consumer:$("consumer").value, risk:RISK,
    constraints:$("constraints").value, audience:$("audience").value,
    evidence:$("evidence").value, untrusted:$("untrusted").value,
    tools:$("tools").checked, toolList:$("toolList").value,
    toolBudget:$("toolBudget").value, agentName:$("agentName").value
  };
  if(!S.task.trim()){ toast("Describe the task first"); $("task").focus(); return; }
  LAST = compile(S);
  render(LAST);
}
$("go").addEventListener("click", run);
$("task").addEventListener("keydown", e => { if((e.metaKey||e.ctrlKey) && e.key==="Enter") run(); });
["domain","model","consumer"].forEach(f => $(f).addEventListener("change", () => { if(LAST) run(); }));
$("tools").addEventListener("change", () => { if(LAST) run(); });

/* expose for console debugging + potential embedding */
window.MetaForge = { compile, route, KB_VERSION, ENGINE_VERSION };
