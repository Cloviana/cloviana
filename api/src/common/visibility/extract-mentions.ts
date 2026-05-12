import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";

const MentionsSchema = z.object({
  ids: z.array(z.string()),
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
  const brandsById = new Map<string, Brand>(
    brands.map((brand, index) => [`brand-${index + 1}`, brand]),
  );

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
          brands: brands.map((brand, index) => ({
            id: `brand-${index + 1}`,
            name: brand.name,
          })),
        }),
      },
    ],
  });

  const domains = [...new Set(result.ids)]
    .map((id) => brandsById.get(id)?.domain)
    .filter((domain): domain is string => domain !== undefined);

  return domains;
}
