/**
 * KB barrel + version stamp.
 *
 * VERSIONING CONTRACT (see docs/VERSIONING.md):
 *   KB_VERSION  — bump when knowledge content changes (new technique, revised
 *                 figure, new model dialect, changed rule text).
 *   ENGINE_VERSION — bump when routing logic or prompt structure changes, i.e.
 *                 when the same input produces different output.
 *   Both are stamped into every compiled artifact's provenance block so any
 *   prompt in the wild can be traced back to the exact compiler that made it.
 */
export const KB_VERSION     = "1.1.0";
export const ENGINE_VERSION = "1.2.0";   // shape classifier rebuilt (v1.2.0): resolveShape() replaces the regex chain
export const SPEC_VERSION   = "1";       // shape of the input spec object

export { techniques, selectionHeuristic } from "./techniques.js";
export { models, tiers } from "./models.js";
export { rules, trustClasses, contextModel, referenceBudget } from "./rules.js";
export { domains, REQUIRED_DOMAIN_KEYS } from "./domains.js";
export { presets } from "./presets.js";
export * as failures from "./failures.js";
