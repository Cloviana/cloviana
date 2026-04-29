import { PromptResearchRunner } from "@/workflows/prompt-research/prompt-research.runner";
import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import { StateAnnotation } from "../business-initialization.state";

export async function runPromptResearch(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const promptResearchRunner =
    configurable?.promptResearchRunner as PromptResearchRunner;
  if (!promptResearchRunner)
    throw new Error("PromptResearchRunner not provided");

  const logger = configurable?.logger as Logger | undefined;

  logger?.log(`[${state._businessId}] Running prompt research`);

  await promptResearchRunner.run(state._businessId);

  return {
    _completedSteps: ["PROMPT_RESEARCH"],
  };
}
