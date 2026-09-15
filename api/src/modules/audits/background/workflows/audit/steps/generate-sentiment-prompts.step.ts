import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import type { BusinessProfile } from "../audit.types";

const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prompts",
);
const SentimentPromptsSchema = z.object({
  prompts: z.array(z.string()).length(5),
});

export async function generateSentimentPromptsStep(
  groq: GroqService,
  profile: BusinessProfile,
): Promise<string[]> {
  const system = await loadPromptHbs(
    "generate-sentiment-prompts",
    {
      brandName: profile.name,
      category: profile.category,
      icp: profile.icp,
    },
    { baseDir: PROMPT_DIRECTORY },
  );
  const result = await groq.parse({
    name: "generate-sentiment-prompts",
    schema: SentimentPromptsSchema,
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          brandName: profile.name,
          icp: profile.icp,
          category: profile.category,
        }),
      },
    ],
  });

  return result.prompts;
}
