import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { AiOverviewItem } from "@/integrations/dataforseo/dataforseo.types";
import { z } from "zod";
import { AuditNodeConfig, requireAuditDependencies } from "../audit.config";
import { StateAnnotation } from "../audit.state";
import {
  SentimentClaim,
  SentimentResponse,
  SentimentResult,
} from "../audit.types";
import { getLocationCode } from "../utils/location-code";

const SentimentPromptsSchema = z.object({
  prompts: z.array(z.string()).length(5),
});

const ClaimsSchema = z.object({
  claims: z.array(
    z.object({
      label: z.string(),
      sentiment: z.enum(["positive", "negative"]),
      responseId: z.string(),
      sourceText: z.string(),
    }),
  ),
});

export async function executeSentiment(
  state: typeof StateAnnotation.State,
  config: AuditNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const { dataForSeo, groq, openai } = requireAuditDependencies(config);
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );
  const sentimentPromptsTemplate = await loadPromptHbs(
    "generate-sentiment-prompts",
    {},
    { baseDir },
  );
  const promptsResult = await groq.parse({
    name: "generate-sentiment-prompts",
    schema: SentimentPromptsSchema,
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: sentimentPromptsTemplate },
      {
        role: "user",
        content: JSON.stringify({
          brandName: state.profile.name,
          icp: state.profile.icp,
          category: state.profile.category,
        }),
      },
    ],
  });
  const locationCode = getLocationCode(state.country);
  const pairs: { prompt: string; platform: "chatgpt" | "google_aio" }[] =
    promptsResult.prompts.flatMap((prompt) => [
      { prompt, platform: "chatgpt" },
      { prompt, platform: "google_aio" },
    ]);
  const rawResponses = await Promise.all(
    pairs.map(
      async ({ prompt, platform }, index): Promise<SentimentResponse> => {
        const id = String(index);

        try {
          if (platform === "chatgpt") {
            const result = await openai.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 2048,
            });

            return { id, prompt, text: result.content, platform };
          }

          const response = await dataForSeo.getGoogleSerpAiOverview({
            keyword: prompt,
            language_code: "en",
            location_code: locationCode,
          });
          const taskResult = response.tasks?.[0]?.result?.[0];
          const aiOverview = taskResult?.items?.find(
            (item): item is AiOverviewItem => item.type === "ai_overview",
          );

          return {
            id,
            prompt,
            text: aiOverview?.markdown ?? "",
            platform,
          };
        } catch {
          return { id, prompt, text: "", platform };
        }
      },
    ),
  );
  const nonEmptyResponses = rawResponses.filter((response) => response.text);

  if (nonEmptyResponses.length === 0) {
    return {
      sentimentResult: {
        positivePercent: 0,
        negativePercent: 0,
        claims: [],
        responses: rawResponses,
      },
    };
  }

  const claimsPerResponse = await Promise.all(
    nonEmptyResponses.map(async (response) => {
      const extractClaimsTemplate = await loadPromptHbs(
        "extract-claims",
        {
          brandName: state.profile.name,
          id: response.id,
          prompt: response.prompt,
          text: response.text,
        },
        { baseDir },
      );
      const result = await groq.parse({
        name: "extract-claims",
        schema: ClaimsSchema,
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: extractClaimsTemplate }],
      });

      return result.claims;
    }),
  );
  const claims: SentimentClaim[] = claimsPerResponse.flat();
  const total = claims.length;
  const positive = claims.filter((claim) => claim.sentiment === "positive");
  const positivePercent =
    total > 0 ? Math.round((positive.length / total) * 100) : 0;
  const result: SentimentResult = {
    positivePercent,
    negativePercent: total > 0 ? 100 - positivePercent : 0,
    claims,
    responses: rawResponses,
  };

  return { sentimentResult: result };
}
