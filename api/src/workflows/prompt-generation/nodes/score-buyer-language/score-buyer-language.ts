import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import pLimit from "p-limit";
import { z } from "zod";
import {
  PromptGenerationNodeConfig,
  requirePromptGenerationDependencies,
} from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";
import type { BuyerLanguage } from "../../prompt-generation.types";

const CONCURRENT_REQUESTS = 5;
const MIN_SCORE = 70;

const BuyerLanguageScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
});

export async function scoreBuyerLanguage(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { groq, logger } = requirePromptGenerationDependencies(config);
  const limit = pLimit(CONCURRENT_REQUESTS);

  logger?.debug(
    `[${state._businessId}] Scoring ${state.buyerLanguage.length} buyer language snippets`,
  );

  const buyerLanguage = await Promise.all(
    state.buyerLanguage.map((item) =>
      limit(() => scoreBuyerLanguageItem(item, state, groq)),
    ),
  );

  const filtered = buyerLanguage.filter((item) => (item.score ?? 0) >= MIN_SCORE);

  logger?.debug(
    `[${state._businessId}] Scored ${buyerLanguage.length} buyer language snippets, kept ${filtered.length} above ${MIN_SCORE}`,
  );

  return {
    buyerLanguage: filtered,
  };
}

async function scoreBuyerLanguageItem(
  buyerLanguage: BuyerLanguage,
  state: typeof StateAnnotation.State,
  groq: ReturnType<typeof requirePromptGenerationDependencies>["groq"],
): Promise<BuyerLanguage> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  const prompt = await loadPromptHbs("score-buyer-language", {}, { baseDir });

  const result = await groq.parse({
    name: "score-buyer-language",
    schema: BuyerLanguageScoreSchema,
    model: "openai/gpt-oss-20b",
    reasoning_effort: "low",
    temperature: 0,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          profile: state.profile,
          competitors: state.competitors,
          buyerLanguage,
        }),
      },
    ],
  });

  return {
    ...buyerLanguage,
    score: result.score,
  };
}
