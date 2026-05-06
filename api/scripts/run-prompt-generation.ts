import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import type { AppConfiguration } from "@/config/app.configuration";
import { ExaService } from "@/integrations/exa/exa.service";
import { graph } from "@/workflows/prompt-generation/prompt-generation.graph";
import type { StateType } from "@/workflows/prompt-generation/prompt-generation.state";
import type { Doc } from "@/workflows/prompt-generation/prompt-generation.types";
import { Logger } from "@nestjs/common";

const TRANSCRIPT_SAMPLE_SIZE = 40;
const TRANSCRIPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "rexi_transcripts_ytd",
);

const extraContext = [
  "Rexi is a data orchestrator that consolidates transaction sources into a reconciled source of truth, then deploys agents to automate finance and ops workflows end-to-end. It starts with reconciliation as the foundation, with the broader goal of automating the entire FinOps function.",
  "Pricing and packaging: fixed annual subscription per workflow, with no seat pricing and no volume-based billing. US ranges are Growth $24K-$40K, Mid-Market $40K-$80K, Enterprise $80K-$150K+. LatAm runs 60-80% of those numbers. Price depends on technical complexity, including number of data sources, reconciliation logic, and processing frequency. Pilots are paid by default and credited toward year 1 on conversion. Launch fees of $5K-$15K apply for complex implementations and are credited back on fast go-live. Rexi lands with reconciliation and expands into additional FinOps workflows over time.",
  "Primary buyers and sponsors are CFOs and COOs. Champions are lower-level finance and operations leaders, including Accounting VPs, Controllers, and Heads of FinOps.",
  "Technology leaders also need to approve or sign off, including CTOs, Heads of Engineering, and Heads of Data.",
  "Common triggers: transaction volume outgrew spreadsheets; a new finance leader inherited a fragile process; an audit or compliance event exposed the gap; or a costly error such as duplicate payments, unrecovered fees, or settlement breaks made the cost of doing nothing visible.",
  'Buyer problem language: "We do this in Excel and it won\'t scale." "The team spends 90% of time building reconciliations, not analyzing discrepancies." "Pay-ins completely unreconciled - we don\'t have it tied down." "I\'m just trusting the provider that what they\'re charging me is correct." "We have no visibility." "Only balance-level matching." "Some accounts only reconciled monthly." "It will explode as we scale." "We depend on IT for every change."',
  "The common thread is that buyers do not describe a reconciliation problem first. They describe a time, visibility, and control problem. The reconciliation failure is the symptom.",
  "Before Rexi, processes are manual and low-leverage. Finance teams spend hours daily in Excel instead of investigating discrepancies. Investigation is slow because there is no transaction-level drill-down. New rules, data sources, or workflows require engineering or IT. Visibility gaps create operational risk, and unreconciled payments, blind trust in provider reports, and lack of real-time position awareness create financial leakage.",
  "Buyers choose Rexi because it is an agentic system that takes over the process, not another tool to configure. They value intuitive use by non-technical finance teams, full process automation from ingestion to exception handling to reporting, fast time to value in weeks rather than quarters, and internal collaboration around one source of truth.",
  "Common objections: brand risk from buying from an early-stage company, maturity and reliability, SLAs and escalation paths, data security, differentiation from BlackLine or Simetrik, and build-versus-buy concerns from finance or engineering teams that already maintain internal reconciliation logic.",
  "Known gaps: Rexi is early-stage, with limited support capacity and developing SLAs. Connector coverage is narrower than established players. Highly custom integrations and very complex multi-entity, multi-country, chained reconciliation workflows can stretch implementation timelines. Enterprise procurement is harder without a long track record. Buyers who want full control and deep configurability may be uncomfortable with an agentic abstraction.",
  "Reported outcomes: manual reconciliation workload drops dramatically; exception investigation goes from days to minutes; finance and ops teams get transaction-level traceability; audit questions can be answered in real time; recurring losses shrink as fee overpayments, unrecovered breaks, duplicate payments, and revenue leakage become visible; teams can launch new products and scale volume without adding reconciliation headcount.",
];

const input: StateType = {
  _businessId: "rexi-finance",
  profile: {
    domain: "rexi.finance",
    name: "Rexi",
    category: "AI-powered reconciliation infrastructure",
    description:
      "Rexi is an AI-native financial reconciliation and FinOps automation platform for fintechs, neobanks, payment companies, and regulated financial operations teams. It unifies transaction sources, creates a reconciled source of truth, automates matching and exception handling, and gives finance and ops teams auditable control without relying on spreadsheets, brittle scripts, or engineering for every workflow change.",
    icp: "Scaling fintechs, neobanks, payment companies, PSPs, PayFacs, marketplaces, and finance or FinOps teams with high transaction volume, multi-source reconciliation complexity, audit pressure, revenue leakage risk, and a need to scale operations without adding headcount.",
  },
  competitors: [
    { id: "competitor-1", domain: "trintech.com", name: "Trintech" },
    { id: "competitor-2", domain: "ledge.co", name: "Ledge" },
    { id: "competitor-3", domain: "blackline.com", name: "BlackLine" },
    { id: "competitor-4", domain: "stacks.ai", name: "Stacks AI" },
    { id: "competitor-5", domain: "simetrik.com", name: "Simetrik" },
  ],
  extraContext,
  docs: [],
  buyerLanguage: [],
  clusters: [],
  prompts: [],
  promptUniverse: {
    prompts: [],
    clusters: [],
  },
};

function isState(value: unknown): value is StateType {
  return (
    typeof value === "object" &&
    value !== null &&
    "docs" in value &&
    "buyerLanguage" in value &&
    "clusters" in value &&
    "prompts" in value &&
    "promptUniverse" in value
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function getConfig(): AppConfiguration {
  return {
    anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
    exaApiKey: requireEnv("EXA_API_KEY"),
    groqApiKey: requireEnv("GROQ_API_KEY"),
    openaiApiKey: requireEnv("OPENAI_API_KEY"),
  } as AppConfiguration;
}

async function loadRandomTranscriptDocs(): Promise<Doc[]> {
  const files = (await readdir(TRANSCRIPTS_DIR))
    .filter((file) => file.endsWith(".txt"))
    .sort();

  const sampledFiles = shuffle(files).slice(0, TRANSCRIPT_SAMPLE_SIZE);

  return Promise.all(
    sampledFiles.map(async (file) => {
      const text = await readFile(path.join(TRANSCRIPTS_DIR, file), "utf8");
      const title = path.basename(file, path.extname(file));

      return {
        id: `transcript:${title}`,
        title,
        text,
        sourceType: "TRANSCRIPT" as const,
      };
    }),
  );
}

function shuffle<T>(values: T[]): T[] {
  const shuffled = [...values];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

async function main() {
  const config = getConfig();
  const transcriptDocs = await loadRandomTranscriptDocs();
  const workflowInput: StateType = {
    ...input,
    docs: transcriptDocs,
  };

  console.log("Running prompt generation for:");
  console.log(
    JSON.stringify(
      {
        profile: workflowInput.profile,
        competitors: workflowInput.competitors,
        extraContextCount: workflowInput.extraContext.length,
        transcriptDocs: transcriptDocs.map((doc) => doc.title),
      },
      null,
      2,
    ),
  );

  const stream = graph.streamEvents(workflowInput, {
    version: "v2",
    configurable: {
      exa: new ExaService(config),
      groq: new GroqService(config),
      openai: new OpenAIService(config),
      anthropic: new AnthropicService(config),
      logger: new Logger(),
    },
  });

  let result: StateType | undefined;

  for await (const event of stream) {
    if (event.event === "on_chain_start" && event.name) {
      console.log(`▶ ${event.name}`);
    }

    if (event.event === "on_chain_end" && event.name) {
      console.log(`✓ ${event.name}`);

      const output = event.data?.output;
      if (isState(output)) {
        result = output;
      }
    }
  }

  if (!result) {
    throw new Error("Prompt generation graph completed without a final state");
  }

  console.log("\nPrompt universe:");
  console.log(JSON.stringify(result.promptUniverse, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
