import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";

const MentionsSchema = z.object({
  mentions: z.array(z.string().min(1)),
});

export type Brand = { name: string; domain: string };

export async function extractMentions(
  groq: GroqService,
  text: string,
  brands: Brand[],
): Promise<string[]> {
  if (!text || brands.length === 0) return [];

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  const prompt = await loadPromptHbs("extract-mentions", {}, { baseDir });

  const result = await groq.parse({
    name: "extract-mentions",
    schema: MentionsSchema,
    model: "openai/gpt-oss-120b",
    temperature: 0,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          text,
          brands: brands.map((b) => ({
            name: b.name,
            domain: b.domain,
          })),
        }),
      },
    ],
  });

  return Array.from(new Set(result.mentions));
}