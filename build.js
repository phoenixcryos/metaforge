#!/usr/bin/env node
/**
 * MetaForge build.
 *
 * Inlines every ES module + the UI into ONE dependency-free HTML file at
 * dist/index.html. No bundler, no node_modules, no toolchain rot — the build is
 * ~200 lines of string concatenation you can read in full.
 *
 * Why single-file: the artifact must run from file://, from a static host, from
 * an offline laptop, and inside sandboxed iframes with no network. Any external
 * stylesheet, font, or CDN script breaks at least one of those. See
 * docs/adr/0001-single-file-artifact.md.
 *
 * Usage: node build.js
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = p => readFileSync(join(ROOT, p), "utf8");

/* Order matters: dependencies before dependents. */
const MODULES = [
  "src/kb/techniques.js",
  "src/kb/models.js",
  "src/kb/rules.js",
  "src/kb/domains.js",
  "src/kb/presets.js",
  "src/kb/failures.js",
  "src/kb/index.js",
  "src/engine/shape.js",   // must precede router.js — router calls resolveShape()
  "src/engine/router.js",
  "src/engine/sections.js",
  "src/engine/compile.js"
];

/**
 * Strip ES module syntax so the sources can be concatenated into one classic
 * <script>. Everything lands in a single function scope, so cross-module
 * references resolve as plain identifiers.
 *
 * Constraints this relies on (enforced by convention + test/run.js):
 *  - no duplicate top-level identifiers across modules
 *  - no default exports
 *  - no dynamic import()
 *  - `export * as ns from` is rewritten to an explicit namespace object
 */
function stripModuleSyntax(src, path, nsImports){
  let s = src;
  // export * as failures from "./failures.js"  -> handled by the caller via NS_SHIMS
  s = s.replace(/^export\s+\*\s+as\s+\w+\s+from\s+["'][^"']+["'];?\s*$/gm, "");
  // export { a, b } from "./x.js"  (re-export) -> drop; the target module is already inlined
  s = s.replace(/^export\s+\{[^}]*\}\s+from\s+["'][^"']+["'];?\s*$/gm, "");
  // import * as NS from "./mod.js"  -> record so the caller can build a namespace object
  s = s.replace(/^import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["'];?\s*$/gm, (m, ns, from) => {
    nsImports.push({ns, from, importer:path}); return "";
  });
  // import ... from "..."  -> drop
  s = s.replace(/^import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, "");
  // export const/let/function/class -> declaration
  s = s.replace(/^export\s+(const|let|var|function|class|async function)\b/gm, "$1");
  // bare export { ... };
  s = s.replace(/^export\s+\{[^}]*\};?\s*$/gm, "");
  if(/\bexport\b|\bimport\b\s*\(/.test(s.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*/g,""))){
    console.warn(`  ! ${path}: possible leftover module syntax — inspect the bundle`);
  }
  return s.trim();
}

/** Collect the top-level names a module exports, so namespaces can be rebuilt. */
function exportedNames(src){
  const names = new Set();
  const re = /^export\s+(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/gm;
  let m; while((m = re.exec(src))) names.add(m[1]);
  // export { a, b as c };
  const re2 = /^export\s+\{([^}]*)\};?\s*$/gm;
  while((m = re2.exec(src))){
    m[1].split(",").map(x=>x.trim()).filter(Boolean).forEach(x=>{
      const parts = x.split(/\s+as\s+/); names.add((parts[1]||parts[0]).trim());
    });
  }
  return [...names];
}

/**
 * `import * as X from "./mod.js"` and `export * as X from "./mod.js"` both need
 * a real object at runtime. We rebuild each namespace from the target module's
 * export list, so adding an export to a namespaced module Just Works.
 */
function namespaceShims(nsImports){
  // export * as failures from "./failures.js"  (declared in src/kb/index.js)
  const declared = [{ns:"failures", from:"src/kb/failures.js"}];
  const wanted = new Map();
  for(const {ns, from, importer} of nsImports){
    const resolved = from.startsWith(".")
      ? join(dirname(importer), from).replace(/\\/g,"/")
      : from;
    wanted.set(ns, resolved);
  }
  for(const d of declared) if(!wanted.has(d.ns)) wanted.set(d.ns, d.from);

  const out = [];
  for(const [ns, path] of wanted){
    if(!MODULES.includes(path)){
      throw new Error(`namespace import "${ns}" points at ${path}, which is not in MODULES`);
    }
    const names = exportedNames(read(path));
    if(!names.length) throw new Error(`namespace "${ns}": ${path} exports nothing`);
    out.push(`/* namespace shim: ${ns} <- ${path} */\nconst ${ns} = { ${names.join(", ")} };`);
  }
  return out.join("\n\n");
}

function bundle(){
  const nsImports = [];
  const parts = MODULES.map(p => {
    const body = stripModuleSyntax(read(p), p, nsImports);
    return `/* ══════════ ${p} ══════════ */\n${body}`;
  });
  // Namespace objects must exist before the code that dereferences them runs.
  // All module bodies are declarations/consts evaluated top-down, and the
  // namespaced values are only READ inside functions called after load, so
  // appending the shims is safe and keeps declaration order simple.
  return parts.join("\n\n") + "\n\n" + namespaceShims(nsImports) + "\n";
}

/* ---------------------------------------------------------------------- */
const version = JSON.parse(read("package.json")).version;
const engine  = bundle();
const css     = read("src/ui/styles.css");
const html    = read("src/ui/app.html");
const ui      = read("src/ui/app.js");

const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="MetaForge — turn a short task spec into a production-grade LLM system prompt with routed reasoning budget, grounding rails and an output contract.">
<meta name="color-scheme" content="dark">
<title>MetaForge — Meta-Prompt Compiler</title>
<!--
  MetaForge v${version} — generated by build.js. Do not edit this file directly;
  edit src/ and re-run \`npm run build\`. https://github.com/USER/metaforge
-->
<style>
${css}
</style>
</head>
<body>
${html}
<script>
"use strict";
/* ═══════════════ ENGINE (bundled from src/) ═══════════════ */
${engine}

/* ═══════════════ UI ═══════════════ */
${ui}
</script>
</body>
</html>
`;

if(!existsSync(join(ROOT,"dist"))) mkdirSync(join(ROOT,"dist"), {recursive:true});
writeFileSync(join(ROOT,"dist/index.html"), out);

// 404 -> index so a static host serves the SPA from any path
writeFileSync(join(ROOT,"dist/404.html"), out);
// disable Jekyll on GitHub Pages (it ignores files starting with _)
writeFileSync(join(ROOT,"dist/.nojekyll"), "");

const kb = (out.match(/KB_VERSION\s*=\s*"([^"]+)"/)||[])[1];
const en = (out.match(/ENGINE_VERSION\s*=\s*"([^"]+)"/)||[])[1];
console.log(`✓ dist/index.html  ${(out.length/1024).toFixed(1)} KB`);
console.log(`  package ${version} · kb ${kb} · engine ${en}`);
console.log(`  ${MODULES.length} modules inlined, 0 runtime dependencies`);
