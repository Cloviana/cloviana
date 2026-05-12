import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { PerplexityService } from "@/clients/perplexity/perplexity.service";
import { ResendService } from "@/clients/resend/resend.service";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { Annotation, LangGraphRunnableConfig } from "@langchain/langgraph";
import { Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

export type AuditDependencies = {
  anthropic: AnthropicService;
  dataForSeo: DataForSeoService;
  groq: GroqService;
  logger?: Logger;
  openai: OpenAIService;
  perplexity: PerplexityService;
  prisma: PrismaClient;
  resend: ResendService;
};

export const AuditContextAnnotation = Annotation.Root({
  anthropic: Annotation<AnthropicService>,
  dataForSeo: Annotation<DataForSeoService>,
  groq: Annotation<GroqService>,
  logger: Annotation<Logger | undefined>,
  openai: Annotation<OpenAIService>,
  perplexity: Annotation<PerplexityService>,
  prisma: Annotation<PrismaClient>,
  resend: Annotation<ResendService>,
});

export type AuditNodeConfig = LangGraphRunnableConfig<AuditDependencies>;

export function requireAuditDependencies(
  config?: AuditNodeConfig,
): AuditDependencies {
  const configurable = config?.configurable;

  if (!configurable?.anthropic) {
    throw new Error("AnthropicService not provided");
  }

  if (!configurable?.dataForSeo) {
    throw new Error("DataForSeoService not provided");
  }

  if (!configurable?.groq) {
    throw new Error("GroqService not provided");
  }

  if (!configurable?.openai) {
    throw new Error("OpenAIService not provided");
  }

  if (!configurable?.perplexity) {
    throw new Error("PerplexityService not provided");
  }

  if (!configurable?.prisma) {
    throw new Error("Prisma client not provided");
  }

  if (!configurable?.resend) {
    throw new Error("ResendService not provided");
  }

  return configurable;
}
