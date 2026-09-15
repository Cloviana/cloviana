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
});
