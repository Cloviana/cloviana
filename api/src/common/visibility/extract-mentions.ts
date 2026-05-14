import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";

const MentionsSchema = z.object({
  ids: z.array(z.string()),
});

export type Brand = { name: string; domain: string };

export type MentionBatchItem = {
  customId: string;
  text: string;
};

export type MentionBatchResult = {
  customId: string;
  domains: string[];
};

const BASE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "prompts",
);

function parseDomains(
  content: string,
  brandsById: Map<string, Brand>,
): string[] {
  const parsed = MentionsSchema.parse(JSON.parse(content));
  return [...new Set(parsed.ids)]
    .map((id) => brandsById.get(id)?.domain)
    .filter((domain): domain is string => domain !== undefined);
}

export async function extractMentions(
  groq: GroqService,
  text: string,
  brands: Brand[],
): Promise<string[]> {
  if (!text || brands.length === 0) return [];

  const prompt = await loadPromptHbs("extract-mentions", {}, { baseDir: BASE_DIR });
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

  return [...new Set(result.ids)]
    .map((id) => brandsById.get(id)?.domain)
    .filter((domain): domain is string => domain !== undefined);
}

export async function batchExtractMentions(
  groq: GroqService,
  items: MentionBatchItem[],
  brands: Brand[],
): Promise<MentionBatchResult[]> {
  if (items.length === 0 || brands.length === 0) {
    return items.map((item) => ({ customId: item.customId, domains: [] }));
  }

  const prompt = await loadPromptHbs("extract-mentions", {}, { baseDir: BASE_DIR });
  const brandsById = new Map<string, Brand>(
    brands.map((brand, index) => [`brand-${index + 1}`, brand]),
  );
  const brandList = brands.map((brand, index) => ({
    id: `brand-${index + 1}`,
    name: brand.name,
  }));

  const { withText, withoutText } = items.reduce<{
    withText: MentionBatchItem[];
    withoutText: MentionBatchItem[];
  }>(
    (acc, item) => {
      (item.text ? acc.withText : acc.withoutText).push(item);
      return acc;
    },
    { withText: [], withoutText: [] },
  );

  const emptyResults: MentionBatchResult[] = withoutText.map((item) => ({
    customId: item.customId,
    domains: [],
  }));

  if (withText.length === 0) return emptyResults;

  const batchResults = await groq.batch(
    withText.map((item) => ({
      custom_id: item.customId,
      body: {
        model: "openai/gpt-oss-120b" as const,
        temperature: 0,
        messages: [
          { role: "system" as const, content: prompt },
          {
            role: "user" as const,
            content: JSON.stringify({ text: item.text, brands: brandList }),
          },
        ],
        response_format: {
          type: "json_schema" as const,
          json_schema: {
            name: "extract-mentions",
            strict: true,
            schema: z.toJSONSchema(MentionsSchema),
          },
        },
      },
    })),
  );

  const results: MentionBatchResult[] = [...emptyResults];
  const fallbackItems: MentionBatchItem[] = [];

  for (const batchResult of batchResults) {
    if (batchResult.error || !batchResult.content) {
      const original = withText.find((i) => i.customId === batchResult.custom_id);
      if (original) fallbackItems.push(original);
      continue;
    }

    try {
      results.push({
        customId: batchResult.custom_id,
        domains: parseDomains(batchResult.content, brandsById),
      });
    } catch {
      const original = withText.find((i) => i.customId === batchResult.custom_id);
      if (original) fallbackItems.push(original);
    }
  }

  if (fallbackItems.length > 0) {
    await Promise.all(
      fallbackItems.map(async (item) => {
        try {
          const domains = await extractMentions(groq, item.text, brands);
          results.push({ customId: item.customId, domains });
        } catch {
          results.push({ customId: item.customId, domains: [] });
        }
      }),
    );
  }

  return results;
}
