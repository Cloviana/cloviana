import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { BuyerLanguageTypeSchema } from "@/workflows/prompt-generation/prompt-generation.schema";
import pLimit from "p-limit";
import { z } from "zod";
import {
  PromptGenerationNodeConfig,
  requirePromptGenerationDependencies,
} from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";
import type {
  BuyerLanguage,
  BuyerLanguageType,
  Doc,
} from "../../prompt-generation.types";

const CONCURRENT_REQUESTS = 5;
const MAX_DOC_CHARS_BY_SOURCE_TYPE = {
  REVIEW: 8_000,
  FORUM: 12_000,
  TRANSCRIPT: 24_000,
} as const;

const ExtractBuyerLanguageSchema = z.object({
  snippets: z.array(
    z.object({
      text: z.string().min(1),
      signal: z.string().min(1),
      type: BuyerLanguageTypeSchema,
    }),
  ),
});

export async function extractBuyerLanguage(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { groq, logger } = requirePromptGenerationDependencies(config);
  const limit = pLimit(CONCURRENT_REQUESTS);

  logger?.debug(
    `[${state.businessId}] Extracting buyer language from ${state.docs.length} docs`,
  );

  const buyerLanguage = await Promise.all(
    state.docs.map((doc) =>
      limit(() => extractBuyerLanguageFromDoc(doc, state, groq)),
    ),
  );

  const flattened = buyerLanguage.flat();

  logger?.debug(
    `[${state.businessId}] Extracted ${flattened.length} buyer language snippets`,
  );

  return {
    buyerLanguage: flattened,
  };
}

async function extractBuyerLanguageFromDoc(
  doc: Doc,
  state: typeof StateAnnotation.State,
  groq: ReturnType<typeof requirePromptGenerationDependencies>["groq"],
): Promise<BuyerLanguage[]> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  const prompt = await loadPromptHbs("extract-buyer-language", {}, { baseDir });

  const result = await groq.parse({
    name: "extract-buyer-language",
    schema: ExtractBuyerLanguageSchema,
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
          extraContext: state.extraContext,
          doc: {
            id: doc.id,
            sourceType: doc.sourceType,
            title: doc.title,
            url: doc.url,
            text: truncateDocText(doc),
          },
        }),
      },
    ],
  });

  return result.snippets.slice(0, 10).map((snippet, index) => ({
    id: `${doc.id}:buyer-language-${index + 1}`,
    text: snippet.text,
    signal: snippet.signal,
    docId: doc.id,
    type: snippet.type as BuyerLanguageType,
    sourceType: doc.sourceType,
  }));
}

function truncateDocText(doc: Doc): string {
  return doc.text.slice(0, MAX_DOC_CHARS_BY_SOURCE_TYPE[doc.sourceType]);
}
