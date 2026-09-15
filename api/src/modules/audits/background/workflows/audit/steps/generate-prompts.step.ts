import path from "node:path";
import { fileURLToPath } from "node:url";
import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import type { AuditPrompt, BusinessProfile } from "../audit.types";

const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prompts",
);
const GeneratePromptsSchema = z.object({
  prompts: z.array(z.string()).length(8),
});

export async function generatePromptsStep(
  anthropic: AnthropicService,
  profile: BusinessProfile,
): Promise<AuditPrompt[]> {
  const system = await loadPromptHbs(
    "generate-prompts",
    {},
    { baseDir: PROMPT_DIRECTORY },
  );
  const result = await anthropic.parse({
    schema: GeneratePromptsSchema,
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages: [
      {
        role: "user",
        content: `<domain>${profile.domain}</domain>\n<profile>\n  <category>${profile.category}</category>\n  <icp>${profile.icp}</icp>\n  <description>${profile.description}</description>\n  <name>${profile.name}</name>\n</profile>`,
      },
    ],
  });

  return result.prompts.map((text, index) => ({
    id: `prompt-${index + 1}`,
    text,
  }));
}
