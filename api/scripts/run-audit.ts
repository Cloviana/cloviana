import "dotenv/config";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { PerplexityService } from "@/clients/perplexity/perplexity.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import type { AppConfiguration } from "@/config/app.configuration";
import { AppCacheService } from "@/infrastructure/cache/cache.service";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { BusinessResearchService } from "@/modules/businesses/services/business-research.service";
import { graph } from "@/workflows/audits/audit.graph";
import type { StateType } from "@/workflows/audits/audit.state";
import { HttpService } from "@nestjs/axios";
import axios from "axios";

const DEFAULT_DOMAIN = "velonpricing.com";
const DEFAULT_COUNTRY = "US";
const DEFAULT_EMAIL = "samuel@cloviana.com";

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
    exaApiKey: requireEnv("EXA_API_KEY"),
    groqApiKey: requireEnv("GROQ_API_KEY"),
    openaiApiKey: requireEnv("OPENAI_API_KEY"),
    perplexityApiKey: requireEnv("PERPLEXITY_API_KEY"),
    resendApiKey: process.env.RESEND_API_KEY ?? "noop",
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

function createNoopResend(config: AppConfiguration): ResendService {
  const resend = new ResendService(config);

  resend.sendAuditComplete = async (to, auditId, brandName) => {
    console.log(
      `[noop-resend] Audit completion email skipped to=${to} auditId=${auditId} brandName=${brandName}`,
    );
  };

  return resend;
}

async function main() {
  requireEnv("DATABASE_URL");
  const config = getConfig();
  const prisma = new PrismaService();
  await prisma.$connect();

  const groq = new GroqService(config);
  const openai = new OpenAIService(config);
  const perplexity = new PerplexityService(config);
  const dataForSeo = new DataForSeoService(new HttpService(axios), config);
  const exa = new ExaService(config);
  const cache = new AppCacheService(createMemoryCache() as never);
  const businessResearch = new BusinessResearchService(
    cache,
    exa,
    groq,
    openai,
  );
  const resend = createNoopResend(config);
  const domain = process.env.AUDIT_DOMAIN ?? DEFAULT_DOMAIN;
  const country = process.env.AUDIT_COUNTRY ?? DEFAULT_COUNTRY;
  const email = process.env.AUDIT_EMAIL ?? DEFAULT_EMAIL;
  const audit = await prisma.audit.create({
    data: {
      email,
      domain,
      country,
    },
  });
  const profile = await businessResearch.enrichProfile(domain);
  const competitorDomains = await businessResearch.findCompetitors(domain, 30);

  const input: StateType = {
    auditId: audit.id,
    email,
    country,
    profile: {
      ...profile,
      domain,
    },
    competitors: competitorDomains.map((competitorDomain) => ({
      id: competitorDomain,
      domain: competitorDomain,
      name: competitorDomain,
    })),
    prompts: [],
    engineResponses: [],
    contentIdeas: [],
    sentimentResult: {
      positivePercent: 0,
      negativePercent: 0,
      claims: [],
      responses: [],
    },
  };

  console.log("Running audit graph:");
  console.log(
    JSON.stringify({
      auditId: audit.id,
      email,
      country,
      profile: input.profile,
      competitors: input.competitors,
    }),
  );

  try {
    const stream = graph.streamEvents(input, {
      version: "v2",
      configurable: {
        dataForSeo,
        groq,
        logger: undefined,
        openai,
        perplexity,
        prisma,
        resend,
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
        if (
          typeof output === "object" &&
          output !== null &&
          "engineResponses" in output
        ) {
          result = output as StateType;
        }
      }
    }

    if (!result) {
      throw new Error("Audit graph completed without a final state");
    }

    const saved = await prisma.audit.findUniqueOrThrow({
      where: { id: audit.id },
    });

    console.log("\nAudit graph summary:");
    console.log(
      JSON.stringify(
        {
          promptCount: result.prompts.length,
          responseCount: result.engineResponses.length,
          contentIdeaCount: result.contentIdeas.length,
          sentimentClaimCount: result.sentimentResult.claims.length,
        },
        null,
        2,
      ),
    );
    console.log("\nPersisted report fields:");
    console.log(
      JSON.stringify(
        {
          brandName: saved.brandName,
          brandVisibility: saved.brandVisibility,
          citationLeaderboard: saved.citationLeaderboard,
          visibilityLeaderboard: saved.visibilityLeaderboard,
          topPages: saved.topPages,
          contentSuggestions: saved.contentSuggestions,
          sentiment: saved.sentiment,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
