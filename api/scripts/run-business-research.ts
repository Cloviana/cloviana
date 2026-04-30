import "dotenv/config";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import type { AppConfiguration } from "@/config/app.configuration";
import { AppCacheService } from "@/infrastructure/cache/cache.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { BusinessResearchService } from "@/modules/businesses/services/business-research.service";

const DEFAULT_DOMAIN = "lemlist.com";
const DEFAULT_COMPETITOR_COUNT = 8;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function getConfig(): AppConfiguration {
  return {
    exaApiKey: process.env.EXA_API_KEY ?? "noop",
    groqApiKey: requireEnv("GROQ_API_KEY"),
    openaiApiKey: requireEnv("OPENAI_API_KEY"),
  } as AppConfiguration;
}

function createMemoryCache() {
  const cache = new Map<string, unknown>();

  return {
    async get<T>(key: string): Promise<T | undefined> {
      return cache.get(key) as T | undefined;
    },
    async set<T>(key: string, value: T): Promise<void> {
      cache.set(key, value);
    },
  };
}

function getDomain(): string {
  return (
    process.argv[2] ?? process.env.BUSINESS_RESEARCH_DOMAIN ?? DEFAULT_DOMAIN
  );
}

function getCompetitorCount(): number {
  const rawCount =
    process.argv[3] ??
    process.env.BUSINESS_RESEARCH_COMPETITOR_COUNT ??
    String(DEFAULT_COMPETITOR_COUNT);
  const count = Number.parseInt(rawCount, 10);

  if (!Number.isInteger(count) || count < 1) {
    throw new Error(
      `Competitor count must be a positive integer. Received: ${rawCount}`,
    );
  }

  return count;
}

async function main() {
  const domain = getDomain();
  const count = getCompetitorCount();
  const config = getConfig();
  const cache = new AppCacheService(createMemoryCache() as never);
  const exa = new ExaService(config);
  const groq = new GroqService(config);
  const openai = new OpenAIService(config);
  const businessResearch = new BusinessResearchService(
    cache,
    exa,
    groq,
    openai,
  );

  console.log("Running business research competitor lookup:");
  console.log(JSON.stringify({ domain, count }, null, 2));

  const profile = await businessResearch.enrichProfile(domain);
  const competitors = await businessResearch.findCompetitors(domain, count);

  console.log("\nBusiness profile:");
  console.log(JSON.stringify(profile, null, 2));

  console.log("\nCompetitors:");
  console.log(JSON.stringify(competitors, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
