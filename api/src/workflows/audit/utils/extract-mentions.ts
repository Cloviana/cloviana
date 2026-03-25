import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const groq = new GroqClient();

const MentionsSchema = z.object({
  mentions: z.array(z.object({ name: z.string(), domain: z.string() })),
});

export type BrandRef = { name: string; domain: string };

export async function extractMentions(
  text: string,
  brands: BrandRef[],
): Promise<BrandRef[]> {
  if (!text || brands.length === 0) return [];

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const prompt = await loadPromptHbs("nodes/extract-mentions", {}, { baseDir });

  const result = await groq.chatJson<{ mentions: BrandRef[] }>({
    name: "extract-mentions",
    schema: MentionsSchema,
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: JSON.stringify({ text, brands }) },
    ],
  });

  return result.mentions;
}
