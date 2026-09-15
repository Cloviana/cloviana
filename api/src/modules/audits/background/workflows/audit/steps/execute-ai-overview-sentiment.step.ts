import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import type { SentimentResponse } from "../audit.types";
import { getLocationCode } from "../utils/location-code.util";

export async function executeAiOverviewSentimentStep(
  dataForSeo: DataForSeoService,
  prompts: string[],
  country: string,
): Promise<SentimentResponse[]> {
  const results = await Promise.allSettled(
    prompts.map(async (prompt, index): Promise<SentimentResponse> => {
      const answer = await dataForSeo.getAiAnswer({
        engine: "google-ai-overview",
        prompt,
        locationCode: getLocationCode(country),
        languageCode: "en",
        forceWebSearch: false,
      });

      return {
        id: `google-aio-${index}`,
        prompt,
        text: answer.content,
        platform: "google_aio",
      };
    }),
  );
  const responses = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (responses.length === 0) {
    throw new Error(
      "Google AI Overview returned no successful sentiment responses",
    );
  }

  return responses;
}
