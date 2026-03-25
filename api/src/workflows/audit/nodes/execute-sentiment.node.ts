import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { AiOverviewItem } from "@/integrations/dataforseo/dataforseo.types";
import { RunnableConfig } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { StateAnnotation } from "../audit.state";
import { SentimentClaim, SentimentResponse, SentimentResult } from "../audit.types";
import { getLocationCode } from "../utils/location-code";

const groq = new GroqClient();

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
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const dataForSeo = configurable?.dataForSeo as DataForSeoService;
  if (!dataForSeo) throw new Error("DataForSeoService not provided");

  const logger = configurable?.logger as Logger;

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  // Step A — Generate 5 branded prompts via LLM
  const sentimentPromptsTemplate = await loadPromptHbs(
    "nodes/generate-sentiment-prompts",
    {},
    { baseDir },
  );

  const promptsResult = await groq.chatJson<z.infer<typeof SentimentPromptsSchema>>({
    name: "generate-sentiment-prompts",
    schema: SentimentPromptsSchema,
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: sentimentPromptsTemplate },
      {
        role: "user",
        content: JSON.stringify({
          brandName: state._brandName,
          icp: state._product.icp,
          category: state._product.category,
        }),
      },
    ],
  });

  const brandedPrompts = promptsResult.prompts;
  logger?.debug(`[sentiment] Generated ${brandedPrompts.length} branded prompts:`);
  brandedPrompts.forEach((p) => logger?.debug(`[sentiment]   - ${p}`));

  const locationCode = getLocationCode(state._country);

  // Step B — Run 10 calls in parallel (5 prompts × 2 platforms)
  logger?.debug(`[sentiment] Running ${brandedPrompts.length * 2} calls (chatgpt + google_aio)`);
  const pairs: { prompt: string; platform: "chatgpt" | "google_aio" }[] = brandedPrompts.flatMap(
    (p) => [
      { prompt: p, platform: "chatgpt" },
      { prompt: p, platform: "google_aio" },
    ],
  );

  const rawResponses = await Promise.all(
    pairs.map(async ({ prompt, platform }, index): Promise<SentimentResponse> => {
      const id = String(index);
      try {
        if (platform === "chatgpt") {
          const response = await dataForSeo.getChatGptResponse({
            user_prompt: prompt.slice(0, 500),
            model_name: "gpt-4o-mini",
            max_output_tokens: 2048,
            web_search: true,
            web_search_country_iso_code: state._country,
          });

          const taskResult = response.tasks?.[0]?.result?.[0];
          const messageItem = taskResult?.items?.find((i) => i.type === "message");
          const textSections = messageItem?.sections?.filter((s) => s.type === "text") ?? [];
          const text = textSections.map((s) => s.text ?? "").join("\n\n");

          logger?.debug(`[sentiment] [${id}] chatgpt → ${text.length} chars`);
          return { id, prompt, text, platform: 'chatgpt' as const };
        } else {
          const response = await dataForSeo.getGoogleSerpAiOverview({
            keyword: prompt,
            language_code: "en",
            location_code: locationCode,
          });

          const taskResult = response.tasks?.[0]?.result?.[0];
          const aiOverview = taskResult?.items?.find(
            (item): item is AiOverviewItem => item.type === "ai_overview",
          );
          const text = aiOverview?.markdown ?? "";

          logger?.debug(`[sentiment] [${id}] google_aio → ${text.length} chars`);
          return { id, prompt, text, platform: 'google_aio' as const };
        }
      } catch (err) {
        logger?.debug(`[sentiment] [${id}] error: ${err}`);
        return { id, prompt, text: "", platform };
      }
    }),
  );

  // Step C — Extract claims per response in parallel
  const nonEmptyResponses = rawResponses.filter((r) => r.text.length > 0);
  logger?.debug(`[sentiment] ${nonEmptyResponses.length}/${rawResponses.length} responses with text`);

  if (nonEmptyResponses.length === 0) {
    logger?.debug(`[sentiment] No responses with text — skipping claim extraction`);
    const result: SentimentResult = {
      positivePercent: 0,
      negativePercent: 0,
      claims: [],
      responses: rawResponses,
    };
    return { _sentimentResult: result };
  }

  const claimsPerResponse = await Promise.all(
    nonEmptyResponses.map(async (response) => {
      const extractClaimsTemplate = await loadPromptHbs(
        "nodes/extract-claims",
        { brandName: state._brandName, id: response.id, prompt: response.prompt, text: response.text },
        { baseDir },
      );

      const result = await groq.chatJson<z.infer<typeof ClaimsSchema>>({
        name: "extract-claims",
        schema: ClaimsSchema,
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: extractClaimsTemplate }],
      });

      logger?.debug(`[sentiment] [${response.id}] extracted ${result.claims.length} claims`);
      return result.claims;
    }),
  );

  const claims: SentimentClaim[] = claimsPerResponse.flat();
  logger?.debug(`[sentiment] Extracted ${claims.length} claims total`);

  // Step D — Score
  const total = claims.length;
  const positive = claims.filter((c) => c.sentiment === "positive").length;
  const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;
  const negativePercent = 100 - positivePercent;
  logger?.debug(`[sentiment] Score: ${positivePercent}% positive, ${negativePercent}% negative`);

  const result: SentimentResult = {
    positivePercent,
    negativePercent,
    claims,
    responses: rawResponses,
  };

  return { _sentimentResult: result };
}
