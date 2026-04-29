import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { PerplexityService } from "@/clients/perplexity/perplexity.service";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { Annotation, LangGraphRunnableConfig } from "@langchain/langgraph";
import { Logger } from "@nestjs/common";

export type MonitoringDependencies = {
  anthropic: AnthropicService;
  dataForSeo: DataForSeoService;
  openai: OpenAIService;
  perplexity: PerplexityService;
  groq: GroqService;
  logger?: Logger;
};

export const MonitoringContextAnnotation = Annotation.Root({
  anthropic: Annotation<AnthropicService>,
  dataForSeo: Annotation<DataForSeoService>,
  openai: Annotation<OpenAIService>,
  perplexity: Annotation<PerplexityService>,
  groq: Annotation<GroqService>,
  logger: Annotation<Logger | undefined>,
});

export type MonitoringNodeConfig =
  LangGraphRunnableConfig<MonitoringDependencies>;

export function requireMonitoringDependencies(
  config?: MonitoringNodeConfig,
): MonitoringDependencies {
  const configurable = config?.configurable;

  if (!configurable?.perplexity) {
    throw new Error("PerplexityService not provided");
  }

  if (!configurable?.anthropic) {
    throw new Error("AnthropicService not provided");
  }

  if (!configurable?.openai) {
    throw new Error("OpenAIService not provided");
  }

  if (!configurable?.dataForSeo) {
    throw new Error("DataForSeoService not provided");
  }

  if (!configurable?.groq) {
    throw new Error("GroqService not provided");
  }

  return configurable;
}
