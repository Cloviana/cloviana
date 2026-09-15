import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import type { SentimentResponse } from "../audit.types";
import { getLocationCode } from "../utils/location-code.util";

export async function executeChatgptSentimentStep(
  dataForSeo: DataForSeoService,
  prompts: string[],
  country: string,
): Promise<SentimentResponse[]> {
  const results = await Promise.allSettled(
    prompts.map(async (prompt, index): Promise<SentimentResponse> => {
      const response = await dataForSeo.getChatGptScrape({
        keyword: prompt,
        language_code: "en",
        location_code: getLocationCode(country),
        force_web_search: false,
      });
      const result = response.tasks?.[0]?.result?.[0];
      if (!result) {
        throw new Error(
          response.tasks?.[0]?.status_message ??
            "ChatGPT scraper returned no result",
        );
      }

      return {
        id: `chatgpt-${index}`,
        prompt,
        text: result.markdown ?? "",
        platform: "chatgpt",
      };
    }),
  );
  const responses = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (responses.length === 0) {
    throw new Error("ChatGPT returned no successful sentiment responses");
  }

  return responses;
}
