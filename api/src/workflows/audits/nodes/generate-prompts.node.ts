import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import { AuditNodeConfig, requireAuditDependencies } from "../audit.config";
import { StateAnnotation } from "../audit.state";

const GeneratePromptsSchema = z.object({
  problem_aware: z.array(z.string()).length(3),
  solution_aware: z.array(z.string()).length(4),
  category_aware: z.array(z.string()).length(6),
});

export async function generatePrompts(
  state: typeof StateAnnotation.State,
  config: AuditNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { groq } = requireAuditDependencies(config);

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const prompt = await loadPromptHbs("generate-prompts", {}, { baseDir });

  const result = await groq.parse({
    name: "generate-prompts",
    schema: GeneratePromptsSchema,
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          domain: state.profile.domain,
          profile: state.profile,
        }),
      },
    ],
  });

  const prompts = [
    ...result.problem_aware,
    ...result.solution_aware,
    ...result.category_aware,
  ];

  return {
    prompts: prompts.map((text, index) => ({
      promptId: `prompt-${index + 1}`,
      text,
    })),
  };
}
