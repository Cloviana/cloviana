import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { StateAnnotation } from "../audit.state";

const GeneratePromptsSchema = z.object({
  problem_aware: z.array(z.string()).length(3),
  solution_aware: z.array(z.string()).length(4),
  category_aware: z.array(z.string()).length(6),
});

export async function generatePrompts(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const logger = configurable?.logger as Logger;

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const prompt = await loadPromptHbs("nodes/generate-prompts", {}, { baseDir });

  const groq = new GroqClient();
  const result = await groq.chatJson<z.infer<typeof GeneratePromptsSchema>>({
    name: "generate-prompts",
    schema: GeneratePromptsSchema,
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({ domain: state._domain, product: state._product }),
      },
    ],
  });

  const prompts = [
    ...result.problem_aware,
    ...result.solution_aware,
    ...result.category_aware,
  ];

  logger?.debug(`Generated ${prompts.length} prompts for ${state._domain}:`);
  prompts.forEach((p) => logger?.debug(`  - ${p}`));

  return { _prompts: prompts };
}
