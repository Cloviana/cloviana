import "dotenv/config";
import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { PerplexityService } from "@/clients/perplexity/perplexity.service";
import { AppConfiguration } from "@/config/app.configuration";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { graph } from "@/workflows/monitoring/monitoring.graph";
import type { StateType } from "@/workflows/monitoring/monitoring.state";
import { HttpService } from "@nestjs/axios";
import axios from "axios";

const input: StateType = {
  prompts: [
    {
      promptId: "prompt-1",
      text: "What are the best AI search monitoring platforms for B2B SaaS teams?",
    },
  ],
  competitors: [
    { id: "competitor-1", domain: "profound.xyz", name: "Profound" },
    { id: "competitor-2", domain: "peec.ai", name: "Peec AI" },
    { id: "competitor-3", domain: "athenahq.ai", name: "AthenaHQ" },
  ],
  profile: {
    businessId: "business-1",
    name: "Cloviana",
    category: "AI search monitoring",
    description:
      "Cloviana helps B2B SaaS teams monitor how they appear across AI search and answer engines.",
    icp: "B2B SaaS teams evaluating AI search visibility platforms.",
    domain: "cloviana.com",
  },
  date: new Date(),
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
    anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
    dataForSeoBase64Credentials: requireEnv("DATA_FOR_SEO_BASE64_CREDENTIALS"),
    groqApiKey: requireEnv("GROQ_API_KEY"),
    openaiApiKey: requireEnv("OPENAI_API_KEY"),
    perplexityApiKey: requireEnv("PERPLEXITY_API_KEY"),
  });
}

function isState(value: unknown): value is StateType {
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

  const stream = graph.streamEvents(input, {
    version: "v2",
    configurable: {
      anthropic: new AnthropicService(config),
      dataForSeo: new DataForSeoService(new HttpService(axios), config),
      groq: new GroqService(config),
      openai: new OpenAIService(config),
      perplexity: new PerplexityService(config),
      logger: undefined,
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
    throw new Error("Monitoring graph completed without a final state");
  }

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

  console.log("\nPrompt metrics:");
  console.log(JSON.stringify(result.promptMetrics, null, 2));

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
