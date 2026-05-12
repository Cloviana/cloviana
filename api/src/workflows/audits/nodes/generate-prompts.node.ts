import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import { AuditNodeConfig, requireAuditDependencies } from "../audit.config";
import { StateAnnotation } from "../audit.state";

const GeneratePromptsSchema = z.object({
  prompts: z.array(z.string()).length(13),
});

export async function generatePrompts(
  state: typeof StateAnnotation.State,
  config: AuditNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { anthropic } = requireAuditDependencies(config);

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const prompt = await loadPromptHbs("generate-prompts", {}, { baseDir });

  const result = await anthropic.parse({
    schema: GeneratePromptsSchema,
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: prompt,
    messages: [
      {
        role: "user",
        content: `<domain>${state.profile.domain}</domain>\n<profile>\n  <category>${state.profile.category}</category>\n  <icp>${state.profile.icp}</icp>\n  <description>${state.profile.description}</description>\n  <name>${state.profile.name}</name>\n</profile>`,
      },
    ],
  });

  return {
    prompts: result.prompts.map((text, index) => ({
      promptId: `prompt-${index + 1}`,
      text,
    })),
  };
}
