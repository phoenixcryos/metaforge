/** KB: Starter presets. Each exercises a different router path — useful as smoke tests. */
export const presets = {
  refactor:{_label:"Code refactor",
    task:"Refactor our Python billing module to reduce p99 latency below 400ms without a database schema migration. It currently makes 3 sequential calls to the pricing service.",
    domain:"code",model:"claude",consumer:"code",risk:"medium",tools:true,
    toolList:"read_file, write_file, run_tests, git_diff",
    constraints:"No DB schema migration.\nMust preserve per-item error granularity.\nPython 3.11.",
    evidence:"",audience:"Senior backend engineers",
    deliverable:"A patch plus a benchmark showing the p99 improvement."},

  audit:{_label:"Security audit",
    task:"Perform a security audit of an Express.js API that handles payment webhooks and issues session JWTs.",
    domain:"security",model:"gpt",consumer:"json",risk:"high",tools:true,
    toolList:"read_file, grep, dependency_check",
    constraints:"Scope is limited to the /webhooks and /auth route trees.\nDo not test against production.",
    evidence:"",audience:"CISO and the platform security team",
    deliverable:"Ranked findings with CWE mapping, exploitability rating, and remediation diffs."},

  research:{_label:"Research memo",
    task:"Compare the three leading approaches to vector index compression and recommend one for a 500M-embedding corpus with a 50ms p99 budget.",
    domain:"research",model:"gemini",consumer:"doc",risk:"medium",tools:true,
    toolList:"web_search, fetch_page",
    constraints:"Only cite sources published in the last 24 months.\nMust include cost per million vectors.",
    evidence:"",audience:"Infrastructure architects evaluating a build-vs-buy decision",
    deliverable:"A decision memo with a comparison matrix and one recommendation."},

  extract:{_label:"Data extraction",
    task:"Extract structured contract terms from uploaded PDF service agreements.",
    domain:"extract",model:"openweight",consumer:"json",risk:"medium",tools:false,toolList:"",
    constraints:"Never infer a value that is not literally present.\nDates in ISO-8601.\nCurrency as a decimal plus an ISO-4217 code.",
    evidence:"",audience:"A downstream ingestion pipeline",
    deliverable:"One JSON record per document."},

  agentwf:{_label:"Agent workflow",
    task:"Build an agent that triages incoming production incidents: read the alert, pull recent traces and deploys, form a hypothesis, and post a summary to Slack.",
    domain:"agent",model:"claude",consumer:"json",risk:"high",tools:true,
    toolList:"get_alert, query_traces, list_deploys, post_slack, page_oncall",
    constraints:"NEVER page oncall without a confirmation token.\nBudget: 25 tool calls, 8 minutes.",
    evidence:"",audience:"The on-call SRE",
    deliverable:"An incident hypothesis with evidence links and a recommended next action."},

  writing:{_label:"Content writing",
    task:"Write a launch announcement for a developer tool that turns OpenAPI specs into typed clients.",
    domain:"writing",model:"gpt",consumer:"human",risk:"low",tools:false,toolList:"",
    constraints:"Under 400 words.\nNo exclamation marks.\nNo 'revolutionary', 'seamless', or 'game-changing'.",
    evidence:"",audience:"Backend engineers who are skeptical of codegen tools",
    deliverable:"A blog post with a headline and three subsections."}
};
