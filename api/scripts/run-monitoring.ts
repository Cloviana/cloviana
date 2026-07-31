import "dotenv/config";
import { GroqService } from "@/clients/groq/groq.service";
import { AppConfiguration } from "@/config/app.configuration";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { MonitoringAnalysisService } from "@/modules/monitoring/background/workflows/monitoring/monitoring-analysis.service";
import { MonitoringEngineService } from "@/modules/monitoring/background/workflows/monitoring/monitoring-engine.service";
import { computePromptMetrics } from "@/modules/monitoring/background/workflows/monitoring/monitoring.metrics";
import type { MonitoringRunInput } from "@/modules/monitoring/background/workflows/monitoring/monitoring.types";
import { HttpService } from "@nestjs/axios";
import axios from "axios";

const input: MonitoringRunInput = {
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
  },
  date: new Date(),
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

async function main() {
  const config = getConfig();
  const dataForSeoService = new DataForSeoService(
    new HttpService(axios),
    config,
  );
  const engineService = new MonitoringEngineService(dataForSeoService);
  const analysisService = new MonitoringAnalysisService(
    new GroqService(config),
  );

  console.log("Running monitoring for:");
  console.log(JSON.stringify(input.prompts, null, 2));

  const { engineResponses, engineFailures } =
    await engineService.executeEngines(input);
  const analyzedResponses = await analysisService.enrichResponses(
    input,
    engineResponses,
  );
  const promptMetrics = computePromptMetrics(input, analyzedResponses);

  console.log("\nResponses:");
  console.log(
    JSON.stringify(
      analyzedResponses.map((response) => ({
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
  console.log(JSON.stringify(engineFailures, null, 2));

  console.log(
    "\nBusiness metrics are computed from the persisted latest-response snapshot during workflow persistence.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
