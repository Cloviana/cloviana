import { DataForSeoService } from "@/integrations/dataforseo/dataforseo.service";
import { AiEngine } from "@prisma/client";
import type {
  MonitoringEngineResponse,
  SerializedMonitoringRunInput,
} from "../monitoring.types";
import { toCitation } from "../utils/citation.util";

export async function executeAiOverviewStep(
  dataForSeo: DataForSeoService,
  input: SerializedMonitoringRunInput,
): Promise<MonitoringEngineResponse[]> {
  const results = await Promise.allSettled(
    input.prompts.map(async (prompt): Promise<MonitoringEngineResponse> => {
      const answer = await dataForSeo.getAiAnswer({
        engine: "google-ai-overview",
        prompt: prompt.text,
        forceWebSearch: false,
      });
      const citations = await Promise.all(answer.citations.map(toCitation));

      return {
        responseKey: `${AiEngine.AI_OVERVIEWS}:${prompt.id}`,
        engine: AiEngine.AI_OVERVIEWS,
        promptId: prompt.id,
        content: answer.content,
        webSearch: answer.webSearch,
        citations,
        mentions: [],
        sentimentClaims: [],
        fanOutQueries: answer.fanOutQueries.map((query) => ({
          query,
          inferred: false,
        })),
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
