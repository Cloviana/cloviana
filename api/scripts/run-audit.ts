import "dotenv/config";
import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import type { AppConfiguration } from "@/config/app.configuration";
import { AppCacheService } from "@/infrastructure/cache/cache.service";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { AuditAnalysis } from "@/modules/audits/background/workflows/audit/audit.analysis";
import { AuditEngines } from "@/modules/audits/background/workflows/audit/audit.engines";
import { AuditPersistence } from "@/modules/audits/background/workflows/audit/audit.persistence";
import { AuditWorkflow } from "@/modules/audits/background/workflows/audit/audit.workflow";
import { BusinessResearchService } from "@/modules/businesses/research/business-research.service";
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

  resend.sendAuditComplete = async (to, auditSlug, brandName) => {
    console.log(
      `[noop-resend] Audit completion email skipped to=${to} auditSlug=${auditSlug} brandName=${brandName}`,
    );
  };

  return resend;
}

function toAuditSlug(domain: string): string {
  const base = domain
    .split(".")[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base || "audit"}-${Date.now().toString(36)}`;
}

async function main() {
  requireEnv("DATABASE_URL");
  const config = getConfig();
  const prisma = new PrismaService();
  await prisma.$connect();

  const anthropic = new AnthropicService(config);
  const groq = new GroqService(config);
  const openai = new OpenAIService(config);
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
      slug: toAuditSlug(domain),
      email,
      domain,
      country,
    },
  });
  const auditWorkflow = new AuditWorkflow(
    prisma,
    businessResearch,
    new AuditEngines(dataForSeo),
    new AuditAnalysis(anthropic, groq),
    new AuditPersistence(prisma, resend),
  );

  console.log("Running audit workflow:");
  console.log(
    JSON.stringify({
      auditId: audit.id,
      email,
      country,
      domain,
    }),
  );

  try {
    await auditWorkflow.run(audit.id);

    const saved = await prisma.audit.findUniqueOrThrow({
      where: { id: audit.id },
    });

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
