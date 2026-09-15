import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import type { AuditPrompt, EngineResult } from "../audit.types";
import { getLocationCode } from "../utils/location-code.util";

export async function executeAiOverviewStep(
  dataForSeo: DataForSeoService,
  prompts: AuditPrompt[],
  country: string,
): Promise<EngineResult[]> {
  const results = await Promise.allSettled(
    prompts.map(async (prompt): Promise<EngineResult> => {
      const answer = await dataForSeo.getAiAnswer({
        engine: "google-ai-overview",
        prompt: prompt.text,
        locationCode: getLocationCode(country),
        languageCode: "en",
        forceWebSearch: false,
      });

      return {
        promptId: prompt.id,
        prompt: prompt.text,
        engine: "google-aio",
        text: answer.content,
        sources: answer.citations.map((source) => ({
          title: source.title,
          url: source.url,
          description: source.excerpt ?? "",
        })),
        mentions: [],
      };
    }),
  );
  const responses = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (responses.length === 0) {
    throw new Error("Google AI Overview returned no successful responses");
  }

  return responses;
}
