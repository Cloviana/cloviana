import path from "node:path";
import { fileURLToPath } from "node:url";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { z } from "zod";
import type {
  BusinessProfile,
  SentimentClaim,
  SentimentResponse,
  SentimentResult,
} from "../audit.types";

const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prompts",
);
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

export async function analyzeSentimentStep(
  groq: GroqService,
  profile: BusinessProfile,
  responses: SentimentResponse[],
): Promise<SentimentResult> {
  const nonEmptyResponses = responses.filter((response) => response.text);
  if (nonEmptyResponses.length === 0) {
    return {
      positivePercent: 0,
      negativePercent: 0,
      claims: [],
      responses,
    };
  }

  const claimsPerResponse = await Promise.all(
    nonEmptyResponses.map(async (response) => {
      const prompt = await loadPromptHbs(
        "extract-claims",
        {
          brandName: profile.name,
          id: response.id,
          prompt: response.prompt,
          text: response.text,
        },
        { baseDir: PROMPT_DIRECTORY },
      );
      const result = await groq.parse({
        name: "extract-claims",
        schema: ClaimsSchema,
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
      });

      return result.claims;
    }),
  );
  const claims: SentimentClaim[] = claimsPerResponse.flat();
  const positiveCount = claims.filter(
    (claim) => claim.sentiment === "positive",
  ).length;
  const positivePercent =
    claims.length > 0 ? Math.round((positiveCount / claims.length) * 100) : 0;

  return {
    positivePercent,
    negativePercent: claims.length > 0 ? 100 - positivePercent : 0,
    claims,
    responses,
  };
}
