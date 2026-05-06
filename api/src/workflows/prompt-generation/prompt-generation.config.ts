import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { Annotation, LangGraphRunnableConfig } from "@langchain/langgraph";
import { Logger } from "@nestjs/common";

export type PromptGenerationDependencies = {
  exa: ExaService;
  groq: GroqService;
  openai: OpenAIService;
  anthropic: AnthropicService;
  logger?: Logger;
};

export const PromptGenerationContextAnnotation = Annotation.Root({
  exa: Annotation<ExaService>,
  groq: Annotation<GroqService>,
  openai: Annotation<OpenAIService>,
  anthropic: Annotation<AnthropicService>,
  logger: Annotation<Logger | undefined>,
});

export type PromptGenerationNodeConfig =
  LangGraphRunnableConfig<PromptGenerationDependencies>;

export function requirePromptGenerationDependencies(
  config?: PromptGenerationNodeConfig,
): PromptGenerationDependencies {
  const configurable = config?.configurable;

  if (!configurable?.exa) {
    throw new Error("ExaService not provided");
  }

  if (!configurable?.groq) {
    throw new Error("GroqService not provided");
  }

  if (!configurable?.openai) {
    throw new Error("OpenAIService not provided");
  }

  if (!configurable?.anthropic) {
    throw new Error("AnthropicService not provided");
  }

  return configurable;
}
