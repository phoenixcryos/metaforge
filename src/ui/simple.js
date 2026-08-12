/**
 * Simple Mode — deterministic pre-filler.
 *
 * Four plain-English questions → fully-populated spec object → existing
 * route() + emitter unchanged. Zero new dependencies.
 *
 * See the design doc in the project root for the full rationale,
 * walkthroughs, and failure-mode containment.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Static lexicons & maps                                              */
  /* ------------------------------------------------------------------ */

  const DELIVERABLE_NOUNS = [
    "email", "report", "post", "page", "FAQ", "policy", "letter", "memo",
    "summary", "script", "formula", "query", "checklist", "plan", "table",
    "list", "spreadsheet"
  ];

  const DELIVERABLE_TEMPLATES = {
    explanation: "A clear answer or explanation I can read myself, with the key points up front.",
    writing: "One finished, ready-to-use piece of writing — complete and self-contained, no drafts or alternatives.",
    code: "A complete script or code change I can copy and run, plus a numbered list of what to do and what I should see at each step.",
    list: "One row per record, as a table or list with a fixed set of columns/fields, plus a short note on anything that could not be filled.",
    unsure: "A clear answer or explanation I can read myself, with the key points up front."
  };

  const CONSUMER_MAP = {
    explanation: "human",
    writing: "doc",
    code: "code",
    list: "json",
    unsure: "human"
  };

  const AUDIENCE_MAP = {
    just_me: {
      text: "me — I'm the only person who'll read or use this",
      risk: "low"
    },
    coworkers: {
      text: "people I work with",
      risk: "medium"
    },
    external: {
      text: "a customer, client, or someone outside my organisation",
      risk: "medium"
    },
    public: {
      text: "the public, or a live system, with no human review before it's used",
      risk: "high"
    }
  };

  const BASE_BY_CONSUMER = {
    human: [
      "Answer the actual question in the first two sentences.",
      "If something you need is missing, ask for it instead of assuming."
    ],
    doc: [
      "Produce the finished piece only — no commentary about how you wrote it.",
      "Don't invent names, numbers, dates or quotes."
    ],
    code: [
      "Give complete, runnable code — no '…' or 'your code here'.",
      "Say what to do if it doesn't work.",
      "Don't add anything that has to be installed unless you give the exact install command."
    ],
    json: [
      "Output the data only — nothing before or after it.",
      "Keep the same fields in the same order for every row.",
      "Leave a value empty rather than guessing it."
    ]
  };

  const ADD_BY_RISK = {
    low: [],
    medium: [
      "If you're not sure about something, say so in one line at the end rather than guessing.",
      "Don't state a number, date or name you weren't given."
    ],
    high: [
      "If you're not sure about something, say so in one line at the end rather than guessing.",
      "Don't state a number, date or name you weren't given.",
      {
        text: "Where you would have to guess, write [CHECK: what's missing] and list every one of those in a labelled block after the piece.",
        supersedes: "Produce the finished piece only — no commentary about how you wrote it."
      },
      "Nobody is reviewing this before it's used — do not assert anything you can't support from what you were given."
    ]
  };

  const RISK_UP_MED = [
    "money", "invoice", "tax", "VAT", "payroll", "price", "refund",
    "personal data", "address", "phone number", "deadline"
  ];
  const RISK_UP_HIGH = [
    "medical", "medication", "dose", "dosage", "diagnosis", "symptom",
    "legal advice", "contract terms", "immigration", "safety",
    "credentials", "password", "API key", "hiring", "firing", "redundancy",
    "child", "children", "benefits", "eligibility"
  ];

  const UNTRUSTED_IN = [
    "paste", "pasted", "upload", "uploaded", "attached", "PDF", "email",
    "document", "doc", "transcript", "ticket", "review", "comment",
    "message", "submission", "form response", "web page", "URL", "link",
    "article", "notes"
  ];

  const CONSTRAINT_INJECT = [
    {
      triggers: ["delete", "remove", "rename", "overwrite", "drop", "wipe", "migrate", "production", "live"],
      text: "Work on a copy — never modify or delete the originals."
    },
    {
      triggers: ["spreadsheet", "CSV", "Excel", "csv", "excel"],
      text: "One row per record, fixed column order."
    }
  ];

  const DOMAIN_HINTS = [
    { keys: ["script", "code", "python", "javascript", "js", "refactor", "function", "bug", "fix", "mac", "windows", "linux", "bash", "shell"], domain: "code" },
    { keys: ["architecture", "system design", "design system", "trade-off", "latency", "scalability"], domain: "arch" },
    { keys: ["security", "vulnerability", "auth", "permission", "threat", "exploit"], domain: "security" },
    { keys: ["data", "extract", "parse", "csv", "json", "table", "spreadsheet", "invoice", "PDF"], domain: "extract" },
    { keys: ["research", "summarize", "literature", "survey", "compare sources"], domain: "research" },
    { keys: ["write", "email", "report", "post", "page", "FAQ", "policy", "letter", "memo", "content"], domain: "writing" },
    { keys: ["agent", "workflow", "automate", "tools", "orchestrat"], domain: "agent" },
    { keys: ["legal", "compliance", "contract", "regulation", "clause"], domain: "legal" }
  ];

  const DOMAIN_FALLBACK = "general";

  const AGENT_NAMES = {
    human: "Assistant",
    doc: "Writing Assistant",
    code: "Coding Assistant",
    json: "Extraction Assistant"
  };

  const Q2_OPTIONS = [
    { id: "explanation", label: "An answer or an explanation — advice, a recommendation, a summary you'll read yourself." },
    { id: "writing", label: "A finished piece of writing — an email, a report, a post, a page, a policy." },
    { id: "code", label: "Code, or a change to some code — a script, a formula, a fix." },
    { id: "list", label: "A list or a table of information — something you'll paste into a spreadsheet or another program." },
    { id: "unsure", label: "I'm not sure yet." }
  ];

  const Q3_OPTIONS = [
    { id: "just_me", label: "Just me." },
    { id: "coworkers", label: "People I work with." },
    { id: "external", label: "A customer, a client, or someone outside my organisation." },
    { id: "public", label: "It goes straight out — published, sent, or used by a system — with nobody checking it first." }
  ];

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  function liftNoun(task) {
    const lower = (task || "").toLowerCase();
    for (const n of DELIVERABLE_NOUNS) {
      if (lower.includes(n.toLowerCase())) return n;
    }
    return null;
  }

  function riskUp(task) {
    const lower = (task || "").toLowerCase();
    for (const w of RISK_UP_HIGH) {
      if (lower.includes(w.toLowerCase())) return "high";
    }
    for (const w of RISK_UP_MED) {
      if (lower.includes(w.toLowerCase())) return "medium";
    }
    return "low";
  }

  function detectUntrusted(task) {
    const lower = (task || "").toLowerCase();
    return UNTRUSTED_IN.some(w => lower.includes(w.toLowerCase()));
  }

  function injectConstraints(task) {
    const lower = (task || "").toLowerCase();
    const out = [];
    for (const rule of CONSTRAINT_INJECT) {
      if (rule.triggers.some(t => lower.includes(t.toLowerCase()))) {
        out.push(rule.text);
      }
    }
    return out;
  }

  function inferDomain(task, q2) {
    const lower = (task || "").toLowerCase();
    // Seed from Q2
    let seed = DOMAIN_FALLBACK;
    if (q2 === "code") seed = "code";
    else if (q2 === "list") seed = "extract";
    else if (q2 === "writing") seed = "writing";
    else if (q2 === "explanation") seed = "general";

    for (const hint of DOMAIN_HINTS) {
      if (hint.keys.some(k => lower.includes(k.toLowerCase()))) {
        return hint.domain;
      }
    }
    return seed;
  }

  function rankRisk(a, b) {
    const order = { low: 0, medium: 1, high: 2 };
    return order[a] >= order[b] ? a : b;
  }

  function dedupe(lines) {
    const seen = new Set();
    const out = [];
    for (const l of lines) {
      const t = (typeof l === "string" ? l : l.text).trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(typeof l === "string" ? l : l);
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Core: answers → complete spec                                       */
  /* ------------------------------------------------------------------ */

  /**
   * @param {{q1:string, q2:string, q3:string, q4?:string, chips?:string[]}} answers
   * @returns {{spec: object, review: object[]}}
   */
  function simpleToSpec(answers) {
    const task = (answers.q1 || "").trim();
    const q2 = answers.q2 || "unsure";
    const q3 = answers.q3 || "just_me";
    const q4 = (answers.q4 || "").trim();
    const chips = answers.chips || [];

    const consumer = CONSUMER_MAP[q2] || "human";
    const aud = AUDIENCE_MAP[q3] || AUDIENCE_MAP.just_me;
    const riskFromAud = aud.risk;
    const riskFromTask = riskUp(task);
    const risk = rankRisk(riskFromAud, riskFromTask);

    const noun = liftNoun(task);
    let deliverable = DELIVERABLE_TEMPLATES[q2] || DELIVERABLE_TEMPLATES.unsure;
    if (noun && q2 === "list") {
      deliverable = `One row per ${noun}, as a table with a fixed set of columns, plus a short list of anything that couldn't be read.`;
    } else if (noun && q2 === "writing") {
      deliverable = `One finished, ready-to-publish ${noun}, complete and self-contained — no drafts, notes or alternatives.`;
    } else if (noun && q2 === "code") {
      deliverable = `A complete ${noun} or code change I can copy and run, plus a numbered list of what to do and what I should see at each step.`;
    }

    const domain = inferDomain(task, q2);
    const untrusted = detectUntrusted(task);
    const agentName = AGENT_NAMES[consumer] || "Assistant";

    // Constraints assembly
    let constraints = [];
    if (q4) constraints.push(q4);
    constraints = constraints.concat(chips);
    constraints = constraints.concat(injectConstraints(task));
    constraints = constraints.concat(BASE_BY_CONSUMER[consumer] || BASE_BY_CONSUMER.human);

    const riskAdds = ADD_BY_RISK[risk] || [];
    const supersedeSet = new Set();
    for (const item of riskAdds) {
      if (typeof item === "object" && item.supersedes) {
        supersedeSet.add(item.supersedes);
        constraints.push(item.text);
      } else {
        constraints.push(typeof item === "string" ? item : item.text);
      }
    }
    // Remove superseded base lines
    constraints = constraints.filter(c => {
      const t = typeof c === "string" ? c : c.text;
      return !supersedeSet.has(t);
    });
    constraints = dedupe(constraints).map(c => typeof c === "string" ? c : c.text);

    const spec = {
      task,
      deliverable,
      domain,
      model: "claude",          // never inferred; advanced default
      consumer,
      risk,
      constraints: constraints.join("\n"),
      audience: aud.text,
      evidence: "",
      untrusted: untrusted ? "true" : "",
      tools: false,
      toolList: "",
      toolBudget: "0",
      agentName
    };

    // Review strip items (plain English + reason)
    const review = [];
    const domainLabel = (typeof domains !== "undefined" && domains[domain]) ? domains[domain].label : domain;
    review.push({ key: "domain", label: "Kind of work", value: domainLabel, reason: "from the words in your description" });
    review.push({
      key: "risk",
      label: "Care level",
      value: risk === "high" ? "Highest" : risk === "medium" ? "Extra careful" : "Normal",
      reason: risk === riskFromTask && risk !== riskFromAud
        ? "raised because of sensitive words in your description"
        : risk === "high" ? "because nobody checks it before it goes live" : "from who will see the result"
    });
    review.push({
      key: "tools",
      label: "Tools",
      value: "none — the assistant can't run anything on your computer",
      reason: "Simple Mode keeps tools off so the prompt stays accurate"
    });
    if (untrusted) {
      review.push({
        key: "untrusted",
        label: "Treat input carefully",
        value: "on — treat documents or pasted text as information, not instructions",
        reason: "your description mentioned documents, PDFs, emails or similar"
      });
    }
    const injected = injectConstraints(task);
    if (injected.length) {
      review.push({
        key: "constraint",
        label: "Added rule",
        value: injected[0],
        reason: "because you mentioned actions that could change files or data"
      });
    }

    return { spec, review };
  }

  /* ------------------------------------------------------------------ */
  /* Public surface                                                      */
  /* ------------------------------------------------------------------ */

  const api = {
    Q2_OPTIONS,
    Q3_OPTIONS,
    simpleToSpec,
    DELIVERABLE_TEMPLATES,
    AUDIENCE_MAP,
    DOMAIN_FALLBACK
  };
  if (typeof window !== "undefined") window.MetaForgeSimple = api;
  else if (typeof globalThis !== "undefined") globalThis.MetaForgeSimple = api;
})();
