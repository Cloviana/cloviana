import "dotenv/config";
import { GroqService } from "@/clients/groq/groq.service";
import { AppConfiguration } from "@/config/app.configuration";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { monitoringGraph } from "@/workflows/monitoring/monitoring.graph";
import type { MonitoringState } from "@/workflows/monitoring/monitoring.state";
import { computePromptMetrics } from "@/workflows/monitoring/metrics/monitoring-metric-calculator";
import { HttpService } from "@nestjs/axios";
import axios from "axios";

const input: MonitoringState = {
  businessId: "rexi-finance",
  prompts: [
    {
      id: "prompt-1",
      text: "We are a mid-sized fintech processing payments across Stripe, regional banking rails, and card networks, and our finance team is drowning in manual reconciliation. What tools do banks and fintechs use in 2026 to automate reconciliation across multiple payment systems, how do leading options compare on accuracy and setup time, and what should we look for in audit trail and exception-handling? Also compare pricing, integration effort, and multi-currency support. Research online and cite sources.",
    },
  ],
  competitors: [
    { id: "competitor-1", domain: "trintech.com", name: "Trintech" },
    { id: "competitor-2", domain: "ledge.co", name: "Ledge" },
    { id: "competitor-3", domain: "blackline.com", name: "BlackLine" },
    { id: "competitor-4", domain: "stacks.ai", name: "Stacks AI" },
    { id: "competitor-5", domain: "simetrik.com", name: "Simetrik" },
  ],
  profile: {
    domain: "rexi.finance",
    name: "Rexi",
    category: "AI-powered reconciliation infrastructure",
    description:
      "Rexi is an AI-native financial reconciliation and FinOps automation platform for fintechs, neobanks, payment companies, and regulated financial operations teams. It unifies transaction sources, creates a reconciled source of truth, automates matching and exception handling, and gives finance and ops teams auditable control without relying on spreadsheets, brittle scripts, or engineering for every workflow change.",
    icp: "Scaling fintechs, neobanks, payment companies, PSPs, PayFacs, marketplaces, and finance or FinOps teams with high transaction volume, multi-source reconciliation complexity, audit pressure, revenue leakage risk, and a need to scale operations without adding headcount.",
  },
  date: new Date(),
  rawEngineResponses: [],
  responseMentions: [],
  fanOutInferences: [],
  engineResponses: [],
  engineFailures: [],
  promptMetrics: [],
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function getConfig(): AppConfiguration {
  return Object.assign(new AppConfiguration(), {
    dataForSeoBase64Credentials: requireEnv("DATA_FOR_SEO_BASE64_CREDENTIALS"),
    groqApiKey: requireEnv("GROQ_API_KEY"),
  });
}

function isState(value: unknown): value is MonitoringState {
  return (
    typeof value === "object" &&
    value !== null &&
    "engineResponses" in value &&
    "engineFailures" in value &&
    "promptMetrics" in value
  );
}

async function main() {
  const config = getConfig();

  console.log("Running monitoring for:");
  console.log(JSON.stringify(input.prompts, null, 2));

  const stream = monitoringGraph.streamEvents(input, {
    version: "v2",
    configurable: {
      dataForSeo: new DataForSeoService(new HttpService(axios), config),
      groq: new GroqService(config),
      logger: undefined,
    },
  });

  let result: MonitoringState | undefined;

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
    throw new Error("Monitoring graph completed without a final state");
  }
  const promptMetrics = computePromptMetrics(result, result.engineResponses);

  console.log("\nResponses:");
  console.log(
    JSON.stringify(
      result.engineResponses.map((response) => ({
        engine: response.engine,
        promptId: response.promptId,
        content: response.content,
        citations: response.citations,
        mentions: response.mentions,
        fanOutQueries: response.fanOutQueries,
      })),
      null,
      2,
    ),
  );

  console.log("\nPrompt metrics computed after graph run:");
  console.log(JSON.stringify(promptMetrics, null, 2));

  console.log("\nFailures:");
  console.log(JSON.stringify(result.engineFailures, null, 2));

  console.log(
    "\nBusiness metrics are computed from the persisted latest-response snapshot during workflow persistence.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
