import { GroqService } from "@/clients/groq/groq.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { Annotation, LangGraphRunnableConfig } from "@langchain/langgraph";
import { Logger } from "@nestjs/common";

export type PromptGenerationDependencies = {
  exa: ExaService;
  groq: GroqService;
  logger?: Logger;
  progress?: PromptGenerationProgressReporter;
};

export type PromptGenerationProgressUpdate = {
  percent: number | null;
  step: string | null;
  title: string;
  meta?: Record<string, unknown>;
};

export type PromptGenerationProgressReporter = (
  update: PromptGenerationProgressUpdate,
) => Promise<void>;

export const PromptGenerationContextAnnotation = Annotation.Root({
  exa: Annotation<ExaService>,
  groq: Annotation<GroqService>,
  logger: Annotation<Logger | undefined>,
  progress: Annotation<PromptGenerationProgressReporter | undefined>({
    value: (_current, next) => next,
    default: () => undefined,
  }),
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

  return configurable;
}
