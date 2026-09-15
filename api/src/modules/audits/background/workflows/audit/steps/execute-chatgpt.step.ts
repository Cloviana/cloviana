import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import type { AuditPrompt, EngineResult } from "../audit.types";
import { getLocationCode } from "../utils/location-code.util";

export async function executeChatgptStep(
  dataForSeo: DataForSeoService,
  prompts: AuditPrompt[],
  country: string,
): Promise<EngineResult[]> {
  const results = await Promise.allSettled(
    prompts.map(async (prompt): Promise<EngineResult> => {
      const response = await dataForSeo.getChatGptScrape({
        keyword: prompt.text,
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
        promptId: prompt.id,
        prompt: prompt.text,
        engine: "chatgpt",
        text: result.markdown ?? "",
        sources: (result.sources ?? [])
          .filter((source) => source.url.trim().length > 0)
          .map((source) => ({
            title: source.title ?? source.source_name ?? "",
            url: source.url,
            description: source.snippet ?? source.markdown ?? "",
          })),
        mentions: [],
      };
    }),
  );
  const responses = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (responses.length === 0) {
    throw new Error("ChatGPT returned no successful responses");
  }

  return responses;
}
